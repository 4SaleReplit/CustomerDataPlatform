export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface DashboardMetrics {
  dau: number;
  wau: number;
  mau: number;
  churn: number;
  newUsers: number;
  totalUsers: number;
  stickinessRatio: number;
  averageSessionDuration: string;
  conversionRate: string;
  totalProfiles: number;
  matchRate: string;
  eventsPerHour: string;
}

export interface CohortCondition {
  field: string;
  operator: string;
  value: string;
  connector?: 'AND' | 'OR';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}
