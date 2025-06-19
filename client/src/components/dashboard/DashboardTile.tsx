import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, X, GripVertical, MoreVertical, RefreshCw, Edit, Copy, Trash2, Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { SiSnowflake } from 'react-icons/si';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { EChartsRenderer, ChartType } from '@/components/charts/EChartsRenderer';
import { ChartTypeSelector } from '@/components/charts/ChartTypeSelector';
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

  // Fetch authentic Snowflake data using the working tile data endpoint
  const { data: snowflakeData, isLoading: snowflakeLoading, refetch: refetchSnowflake } = useQuery({
    queryKey: ['/api/dashboard/tiles', tile.databaseId || tile.id, 'data'],
    queryFn: async () => {
      const tileIdForApi = tile.databaseId || tile.id;
      const requestBody: any = {};
      
      // For temporary tiles, include the query in the request
      if (tileIdForApi.startsWith('tile-') && tile.dataSource?.query) {
        requestBody.query = tile.dataSource.query;
      }
      
      const response = await apiRequest(`/api/dashboard/tiles/${tileIdForApi}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      // Update local state with the timestamp from server response
      if (response.lastRefreshAt) {
        setLastRefreshTime(new Date(response.lastRefreshAt));
      }
      
      // Store data in localStorage for caching
      localStorage.setItem(`tile-${tile.id}-data`, JSON.stringify(response));
      
      return response;
    },
    enabled: false, // Never auto-execute queries
    staleTime: Infinity, // Data never becomes stale until manually refreshed
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    // Load authentic last refresh timestamp from database
    if (tile.lastRefreshAt) {
      setLastRefreshTime(new Date(tile.lastRefreshAt));
    }
    
    const storedData = localStorage.getItem(`tile-${tile.id}-data`);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Pre-populate the cache with stored data to prevent initial queries
        queryClient.setQueryData(['/api/dashboard/tiles', tile.databaseId || tile.id, 'data'], parsedData);
      } catch (error) {
        // Clean up invalid cached data
        localStorage.removeItem(`tile-${tile.id}-data`);
      }
    }
  }, [tile.id, tile.lastRefreshAt, queryClient]);

  // Load cached data on mount
  useEffect(() => {
    const storedData = localStorage.getItem(`tile-${tile.id}-data`);
    if (storedData && !snowflakeData) {
      try {
        const parsedData = JSON.parse(storedData);
        queryClient.setQueryData(['/api/snowflake/query', tile.id], parsedData);
      } catch (error) {

      }
    }
  }, [tile.id, queryClient]);

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
    const dataToRender = snowflakeData;
    
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

    if (!dataToRender || !dataToRender.success) {
      const isNetworkPolicyError = snowflakeData?.error?.includes('Network Policy Error');
      
      if (isNetworkPolicyError) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <SiSnowflake className="w-5 h-5" />
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium text-orange-600 mb-1">Snowflake Network Policy</div>
            <div className="text-xs text-muted-foreground">
              Contact your Snowflake admin to whitelist Replit IP ranges
            </div>
          </div>
        );
      }
      
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{dataToRender?.error || 'Failed to load data'}</span>
          </div>
        </div>
      );
    }

    switch (tile.type) {
      case 'metric':
        const metricValue = dataToRender.rows?.[0]?.[0];
        return (
          <div className="h-full flex flex-col justify-center items-center p-6">
            <div className="text-4xl font-bold text-primary mb-3">
              {typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground text-center font-medium">
              {tile.dataSource.aggregation || 'Total'}
            </div>
          </div>
        );

      case 'chart':
      case 'line':
      case 'bar':
      case 'column':
      case 'pie':
      case 'scatter':
      case 'area':
      case 'heatmap':
      case 'radar':
      case 'funnel':
      case 'gauge':
      case 'treemap':
      case 'sunburst':
      case 'sankey':
      case 'graph':
      case 'candlestick':
      case 'boxplot':
      case 'parallel':
      case 'tree':
      case 'map':
      case 'pictorial':
      case 'themeRiver':
      case 'calendar':
        if (!dataToRender.rows?.length) {
          return <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>;
        }

        const chartDataFormatted = dataToRender.rows.map((row: any[], index: number) => ({
          name: row[0] || `Item ${index + 1}`,
          value: Number(row[1]) || 0,
          x: row[0] || `Item ${index + 1}`,
          y: Number(row[1]) || 0,
          category: row[0] || `Item ${index + 1}`
        }));

        // Map legacy tile types to ECharts types
        let chartType: ChartType;
        if (tile.chartType) {
          chartType = tile.chartType as ChartType;
        } else {
          // Legacy tile type mapping
          switch (tile.type) {
            case 'bar':
              chartType = 'bar';
              break;
            case 'pie':
              chartType = 'pie';
              break;
            case 'chart':
            default:
              chartType = 'line';
              break;
          }
        }

        return (
          <div className="h-full p-4">
            <EChartsRenderer
              type={chartType}
              data={chartDataFormatted}
              width="100%"
              height="100%"
              theme="light"
            />
          </div>
        );

      case 'table':
        if (!dataToRender.columns?.length || !dataToRender.rows?.length) {
          return <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>;
        }

        return (
          <div className="h-full flex flex-col p-2">
            <div className="flex-1 overflow-auto">
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="border-b">
                    {dataToRender.columns.map((col: any, idx: number) => (
                      <TableHead key={idx} className="font-semibold text-xs px-3 py-2 text-muted-foreground bg-muted/30 whitespace-nowrap min-w-24">
                        {col.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataToRender.rows.slice(0, 100).map((row: any[], idx: number) => (
                    <TableRow key={idx} className="hover:bg-muted/30 border-b border-border/30">
                      {row.map((cell, cellIdx) => (
                        <TableCell key={cellIdx} className="text-xs px-3 py-2 whitespace-nowrap min-w-24">
                          <div className="text-foreground" title={cell !== null && cell !== undefined ? String(cell) : ''}>
                            {cell !== null && cell !== undefined ? String(cell) : '-'}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      default:
        return <div className="h-full flex items-center justify-center text-muted-foreground">Unsupported tile type</div>;
    }
  };

  const IconComponent = getIconComponent(tile.icon || 'users');

  return (
    <Card 
      className="h-full flex flex-col relative group border shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3 px-4 pt-4 flex-shrink-0 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <IconComponent className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold truncate text-foreground">
              {tile.title}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Edit mode controls */}
            {isEditMode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                  onClick={handleEdit}
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move hover:bg-accent"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            
            {/* Three dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEdit} className="text-sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh} className="text-sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearCacheAndRefresh} className="text-sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache & Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDuplicate} className="text-sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Tile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 text-sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Tile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative overflow-hidden">
        <div className="h-full">
          {renderTileContent()}
        </div>
        
        {/* Last refresh timestamp in bottom-left corner */}
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/90 dark:bg-background/90 px-2 py-1 rounded border shadow-sm">
          Last: {formatTimestamp(lastRefreshTime)}
        </div>
        
        {/* Snowflake data source indicator in bottom-right corner */}
        {tile.dataSource?.query && (
          <div className="absolute bottom-2 right-2 text-blue-500 bg-background/90 dark:bg-background/90 p-1.5 rounded border shadow-sm">
            <SiSnowflake className="w-5 h-5" title="Snowflake Data Source" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}