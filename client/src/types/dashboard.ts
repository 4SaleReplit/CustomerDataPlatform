export interface DashboardTile {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'gauge';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  icon?: string;
  dataSource: {
    table: string;
    query: string;
    aggregation?: string;
    groupBy?: string;
  };
  refreshConfig: {
    autoRefresh: boolean;
    refreshOnLoad: boolean;
    lastRefreshed?: Date;
  };
}

export interface TimeFilterState {
  chartType: string;
  timeRange: string;
  granularity: string;
  customDateRange?: {
    from: Date;
    to: Date;
  };
}