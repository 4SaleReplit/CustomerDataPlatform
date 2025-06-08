import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, X, GripVertical, MoreVertical, RefreshCw, Edit, Copy, Trash2, Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { DashboardTile } from './DashboardBuilder';

interface DashboardTileProps {
  tile: DashboardTile;
  isEditMode: boolean;
  onEdit?: (tile: DashboardTile) => void;
  onRemove?: (tileId: string) => void;
  onDuplicate?: (tile: DashboardTile) => void;
  onRefresh?: (tileId: string) => void;
}

// Enhanced color palette
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

// Icon mapping
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'users':
      return Users;
    case 'trending-up':
      return TrendingUp;
    case 'trending-down':
      return TrendingDown;
    default:
      return Users;
  }
};

export function DashboardTileComponent({ tile, isEditMode, onEdit, onRemove, onDuplicate, onRefresh }: DashboardTileProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  // Fetch authentic Snowflake data with caching strategy
  const { data: snowflakeData, isLoading: snowflakeLoading, refetch: refetchSnowflake } = useQuery({
    queryKey: ['/api/snowflake/query', tile.id],
    queryFn: async () => {
      const response = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tile.dataSource.query })
      });
      const timestamp = new Date();
      setLastRefreshTime(timestamp);
      
      // Store timestamp in localStorage for persistence
      localStorage.setItem(`tile-${tile.id}-lastRefresh`, timestamp.toISOString());
      
      return response;
    },
    enabled: !!tile.dataSource.query && (tile.refreshConfig?.refreshOnLoad !== false),
    staleTime: Infinity, // Keep data indefinitely unless manually refreshed
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });

  // Load timestamp from localStorage on mount
  useEffect(() => {
    const storedTimestamp = localStorage.getItem(`tile-${tile.id}-lastRefresh`);
    if (storedTimestamp) {
      setLastRefreshTime(new Date(storedTimestamp));
    }
  }, [tile.id]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/snowflake/query', tile.id] });
      await refetchSnowflake();
      if (onRefresh) {
        onRefresh(tile.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear cache and refresh for this tile
  const handleClearCacheAndRefresh = async () => {
    setIsRefreshing(true);
    try {
      queryClient.removeQueries({ queryKey: ['/api/snowflake/query', tile.id] });
      setLastRefreshTime(null);
      await refetchSnowflake();
      if (onRefresh) {
        onRefresh(tile.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(tile);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(tile);
    }
  };

  const handleDelete = () => {
    if (onRemove) {
      onRemove(tile.id);
    }
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Never refreshed';
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderTileContent = () => {
    const isLoading = snowflakeLoading || isRefreshing;
    
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        </div>
      );
    }

    if (!snowflakeData || !snowflakeData.success) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            {snowflakeData?.error || 'Failed to load data'}
          </div>
        </div>
      );
    }

    switch (tile.type) {
      case 'metric':
        const metricValue = snowflakeData.rows?.[0]?.[0];
        return (
          <div className="h-full flex flex-col justify-center items-center p-4">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue || 'N/A'}
            </div>
            <div className="text-sm text-gray-500 text-center">
              {tile.dataSource.aggregation || 'Total'}
            </div>
          </div>
        );

      case 'chart':
        if (!snowflakeData.rows?.length) {
          return <div className="h-full flex items-center justify-center text-gray-500">No data available</div>;
        }

        const chartDataFormatted = snowflakeData.rows.map((row: any[], index: number) => ({
          name: row[0] || `Item ${index + 1}`,
          value: Number(row[1]) || 0,
        }));

        return (
          <div className="h-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataFormatted}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
        if (!snowflakeData.columns?.length || !snowflakeData.rows?.length) {
          return <div className="h-full flex items-center justify-center text-gray-500">No data available</div>;
        }

        return (
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  {snowflakeData.columns.map((col: any, idx: number) => (
                    <TableHead key={idx} className="font-semibold">
                      {col.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {snowflakeData.rows.slice(0, 50).map((row: any[], idx: number) => (
                  <TableRow key={idx}>
                    {row.map((cell, cellIdx) => (
                      <TableCell key={cellIdx} className="text-sm">
                        {cell !== null && cell !== undefined ? String(cell) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        );

      default:
        return <div className="h-full flex items-center justify-center text-gray-500">Unsupported tile type</div>;
    }
  };

  const IconComponent = getIconComponent(tile.icon || 'users');

  return (
    <Card 
      className="h-full flex flex-col relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-medium truncate">{tile.title}</CardTitle>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Edit mode controls */}
            {isEditMode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleEdit}
                >
                  <Settings className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                >
                  <GripVertical className="w-3 h-3" />
                </Button>
              </>
            )}
            
            {/* Three dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearCacheAndRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache & Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Tile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Tile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-2 relative">
        {renderTileContent()}
        
        {/* Last refresh timestamp in bottom-left corner */}
        <div className="absolute bottom-1 left-2 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 px-1 rounded">
          Last: {formatTimestamp(lastRefreshTime)}
        </div>
      </CardContent>
    </Card>
  );
}