import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EChartsRenderer, ChartType } from './EChartsRenderer';
import { ChartTypeSelector } from './ChartTypeSelector';
import { Settings, RefreshCw, Download, Maximize2, Edit3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EChartsTileProps {
  tileId: string;
  title: string;
  query: string;
  chartType?: ChartType;
  width?: number;
  height?: number;
  refreshConfig?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    refreshOnLoad?: boolean;
  };
  onEdit?: () => void;
  onRefresh?: () => void;
  onResize?: (width: number, height: number) => void;
  theme?: 'light' | 'dark';
}

export function EChartsTile({
  tileId,
  title,
  query,
  chartType = 'line',
  width = 400,
  height = 300,
  refreshConfig = {},
  onEdit,
  onRefresh,
  onResize,
  theme = 'light'
}: EChartsTileProps) {
  const [currentChartType, setCurrentChartType] = useState<ChartType>(chartType);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch data using the SQL query
  const { data: rawData, isLoading, refetch, error } = useQuery({
    queryKey: ['tile-data', tileId, query],
    queryFn: () => apiRequest('/api/sql/execute', {
      method: 'POST',
      body: JSON.stringify({ query, tileId })
    }),
    enabled: !!query,
    refetchInterval: refreshConfig.autoRefresh ? (refreshConfig.refreshInterval || 30000) : false,
    refetchOnWindowFocus: false
  });

  // Transform SQL result data into chart-friendly format
  const chartData = useMemo(() => {
    if (!rawData?.rows || !Array.isArray(rawData.rows)) {
      return [];
    }

    const rows = rawData.rows;
    const columns = rawData.columns || [];

    if (rows.length === 0) return [];

    // Auto-detect data structure and transform for different chart types
    return rows.map((row: any, index: number) => {
      if (Array.isArray(row)) {
        // Handle array format from SQL results
        const item: any = {};
        columns.forEach((col: any, colIndex: number) => {
          item[col.name || `column_${colIndex}`] = row[colIndex];
        });
        return item;
      } else if (typeof row === 'object') {
        // Handle object format
        return row;
      } else {
        // Handle primitive values
        return {
          name: `Item ${index + 1}`,
          value: row,
          category: `Category ${index + 1}`
        };
      }
    });
  }, [rawData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefresh(new Date());
      onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh on load if configured
  useEffect(() => {
    if (refreshConfig.refreshOnLoad) {
      handleRefresh();
    }
  }, [refreshConfig.refreshOnLoad]);

  // Handle chart type change
  const handleChartTypeChange = (newType: ChartType) => {
    setCurrentChartType(newType);
  };

  // Export chart data
  const handleExport = () => {
    const dataStr = JSON.stringify(chartData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = () => {
    if (isLoading || isRefreshing) {
      return <Badge variant="secondary">Loading...</Badge>;
    }
    if (error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (chartData.length === 0) {
      return <Badge variant="outline">No Data</Badge>;
    }
    return <Badge variant="default">{chartData.length} records</Badge>;
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-1">
            <ChartTypeSelector
              onSelectChartType={handleChartTypeChange}
              trigger={
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              disabled={chartData.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {isLoading || isRefreshing ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">Failed to load data</p>
              <p className="text-xs text-muted-foreground">{error.message}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">No data available</p>
              <p className="text-xs text-muted-foreground">Check your query or data source</p>
            </div>
          </div>
        ) : (
          <div className="p-4 h-full">
            <EChartsRenderer
              type={currentChartType}
              data={chartData}
              title=""
              width="100%"
              height={height - 120} // Account for header height
              theme={theme}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}