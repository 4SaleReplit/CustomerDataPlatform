import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, X, GripVertical, MoreVertical, MoreHorizontal, RefreshCw, Edit, Copy, Trash2, Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
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
      setLastRefreshTime(new Date());
      return response;
    },
    enabled: !!tile.dataSource.query,
    staleTime: 1000 * 60 * 15, // 15 minutes - data stays fresh
    gcTime: 1000 * 60 * 60, // 1 hour - cache for longer
  });
  
  // Fetch authentic Snowflake data for metric tiles
  const { data: metricData, isLoading: metricLoading, refetch: refetchMetric } = useQuery({
    queryKey: ['/api/snowflake/query', tile.id, 'metric'],
    queryFn: async () => {
      if (tile.type !== 'metric') return null;
      const response = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tile.dataSource.query })
      });
      setLastRefreshTime(new Date());
      return response;
    },
    enabled: tile.type === 'metric' && !!tile.dataSource.query,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch authentic Snowflake data for chart tiles
  const { data: chartData, isLoading: chartLoading, refetch: refetchChart } = useQuery({
    queryKey: ['/api/snowflake/query', tile.id, 'chart'],
    queryFn: async () => {
      if (tile.type !== 'chart') return null;
      const response = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tile.dataSource.query })
      });
      setLastRefreshTime(new Date());
      return response;
    },
    enabled: tile.type === 'chart' && !!tile.dataSource.query,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate and refetch based on tile type
      if (tile.type === 'table') {
        await queryClient.invalidateQueries({ queryKey: ['/api/snowflake/query', tile.id] });
        await refetchSnowflake();
      } else if (tile.type === 'metric') {
        await queryClient.invalidateQueries({ queryKey: ['/api/snowflake/query', tile.id, 'metric'] });
        await refetchMetric();
      } else if (tile.type === 'chart') {
        await queryClient.invalidateQueries({ queryKey: ['/api/snowflake/query', tile.id, 'chart'] });
        await refetchChart();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear cache and refresh for this tile
  const handleClearCacheAndRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear cached data
      queryClient.removeQueries({ queryKey: ['/api/snowflake/query', tile.id] });
      setLastRefreshTime(null);
      
      // Refetch based on tile type
      if (tile.type === 'table') {
        await refetchSnowflake();
      } else if (tile.type === 'metric') {
        await refetchMetric();
      } else if (tile.type === 'chart') {
        await refetchChart();
      }
      
      // Call parent refresh handler
      if (onRefresh) {
        onRefresh(tile.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(tile);
    }
  };

  const renderTileContent = () => {
    switch (tile.type) {
      case 'metric':
        // Use authentic Snowflake data only
        if (metricLoading) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          );
        }
        
        if (!metricData?.success || !metricData?.rows?.length) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-red-500">No data available</div>
            </div>
          );
        }

        const value = metricData.rows[0][0] || 0;
        const IconComponent = getIconComponent(tile.icon || 'users');
        
        return (
          <div className="h-full flex flex-col p-6 bg-white relative">
            {/* Header with title */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 leading-tight">{tile.title}</h3>
            </div>
            
            {/* Icon in top right */}
            <div className="absolute top-6 right-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            {/* Centered main content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-4">
              {/* Main metric value */}
              <div className="text-4xl font-bold text-gray-900 mb-3">
                {Number(value).toLocaleString()}
              </div>
              
              {/* Data source indicator */}
              <div className="flex items-center justify-center">
                <span className="text-sm text-green-600 font-medium">
                  Live Snowflake Data
                </span>
              </div>
            </div>
          </div>
        );

      case 'chart':
        if (chartLoading) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          );
        }
        
        if (!chartData?.success || !chartData?.rows?.length) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-red-500">No chart data available</div>
            </div>
          );
        }

        // Transform Snowflake data to chart format
        const transformedChartData = chartData.rows.map((row: any, index: number) => ({
          date: row[0] || `Day ${index + 1}`,
          value: Number(row[1]) || 0
        }));

        return (
          <div className="h-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transformedChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3B82F6" }}
                  activeDot={{ r: 6, fill: "#3B82F6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
        if (snowflakeLoading) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-500">Loading table data...</div>
            </div>
          );
        }

        if (!snowflakeData?.success || !snowflakeData?.rows?.length) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-red-500">No table data available</div>
            </div>
          );
        }

        return (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex-shrink-0">
              <h3 className="font-medium text-gray-900">{tile.title}</h3>
              <p className="text-sm text-green-600 mt-1">
                Live Snowflake Data ({snowflakeData.rows.length} rows)
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="h-full w-full overflow-auto">
                <Table className="min-w-full">
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      {snowflakeData.columns?.map((column: any, index: number) => (
                        <TableHead key={index} className="whitespace-nowrap px-4 py-2 text-left border-b">
                          {column.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snowflakeData.rows.map((row: any[], rowIndex: number) => (
                      <TableRow key={rowIndex} className="border-b hover:bg-gray-50">
                        {row.map((cell: any, cellIndex: number) => (
                          <TableCell key={cellIndex} className="whitespace-nowrap px-4 py-2">
                            {cell?.toString() || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Unsupported tile type</div>
          </div>
        );
    }
  };

  return (
    <div 
      className={`h-full bg-white rounded-lg border border-gray-200 shadow-sm relative group transition-all duration-200 ${
        isHovered ? 'shadow-md border-gray-300' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/90 backdrop-blur">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(tile)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onRemove?.(tile.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Tile Content */}
      <div className="h-full">
        {renderTileContent()}
      </div>
    </div>
  );
}