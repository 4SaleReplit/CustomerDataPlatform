import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Calendar, UserX, UserPlus, Target, Clock, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { DashboardMetrics } from "@/types";

const activityData = [
  { name: "Jan", DAU: 20000, WAU: 70000, MAU: 200000 },
  { name: "Feb", DAU: 22000, WAU: 75000, MAU: 210000 },
  { name: "Mar", DAU: 24000, WAU: 80000, MAU: 220000 },
  { name: "Apr", DAU: 23000, WAU: 82000, MAU: 230000 },
  { name: "May", DAU: 25000, WAU: 85000, MAU: 240000 },
  { name: "Jun", DAU: 24532, WAU: 87429, MAU: 245891 },
];

const segmentData = [
  { name: "High Value Users", value: 15240, color: "#3B82F6" },
  { name: "Active Listers", value: 8756, color: "#10B981" },
  { name: "At Risk Users", value: 3421, color: "#F59E0B" },
  { name: "New Users", value: 12098, color: "#8B5CF6" },
];

export default function Dashboard() {
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Failed to load dashboard metrics. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+5.2%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{metrics?.dau?.toLocaleString()}</h3>
            <p className="text-sm text-slate-500">Daily Active Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12.1%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{metrics?.wau?.toLocaleString()}</h3>
            <p className="text-sm text-slate-500">Weekly Active Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+8.7%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{metrics?.mau?.toLocaleString()}</h3>
            <p className="text-sm text-slate-500">Monthly Active Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">+2.1%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{metrics?.churn?.toLocaleString()}</h3>
            <p className="text-sm text-slate-500">Churned Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-800">User Activity Trends</CardTitle>
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-1">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="DAU" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="WAU" stroke="#6366F1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Segments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-800">Top User Segments</CardTitle>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {segmentData.map((segment) => (
                <div key={segment.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    <span className="text-sm font-medium text-slate-700">{segment.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{segment.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Stickiness Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none"></circle>
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="40" 
                    stroke="#3b82f6" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * (metrics?.stickinessRatio || 75) / 100)}
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">{metrics?.stickinessRatio}%</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center">DAU/MAU Ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Average Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800 mb-2">{metrics?.averageSessionDuration}</div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+15%</span>
                <span className="text-sm text-slate-500">vs last period</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Data Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Profiles</span>
                <span className="text-sm font-semibold text-slate-800">{metrics?.totalProfiles?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Match Rate</span>
                <span className="text-sm font-semibold text-green-600">{metrics?.matchRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Events/Hour</span>
                <span className="text-sm font-semibold text-slate-800">{metrics?.eventsPerHour}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
