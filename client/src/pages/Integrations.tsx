import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  RefreshCw, 
  TrendingUp, 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Play,
  Eye,
  Bug,
  LoaderPinwheel,
  Clock,
  Activity
} from "lucide-react";
import type { Integration } from "@shared/schema";

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations, isLoading, error } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/integrations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integration updated",
        description: "The integration status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update integration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshIntegration = (id: number) => {
    updateIntegrationMutation.mutate({
      id,
      data: { last_sync: new Date().toISOString() }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "amplitude":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "braze":
        return <Mail className="h-5 w-5 text-blue-500" />;
      case "airflow":
        return <Settings className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  // Mock DAG data for demonstration - in production this would come from API
  const mockDAGs = [
    {
      id: 1,
      name: "user_profile_sync",
      description: "Syncs user profile data from operational database to CDP",
      status: "success",
      last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      duration: "12m 34s",
      schedule: "Daily at 2:00 AM"
    },
    {
      id: 2,
      name: "listing_analytics_etl",
      description: "Processes listing data for analytics and reporting",
      status: "failed",
      last_run: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      duration: "Failed after 5m 23s",
      schedule: "Every 4 hours",
      error: "Database timeout"
    },
    {
      id: 3,
      name: "cohort_refresh",
      description: "Updates user cohort memberships based on latest activity",
      status: "running",
      last_run: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      duration: "15m (67% complete)",
      schedule: "Every 6 hours"
    }
  ];

  const getDAGStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <LoaderPinwheel className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDAGStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const healthyCount = integrations?.filter(i => i.status === "healthy").length || 0;
  const warningCount = integrations?.filter(i => i.status === "warning").length || 0;
  const errorCount = integrations?.filter(i => i.status === "error").length || 0;

  if (error) {
    return (
      <div className="text-center text-red-600">
        Failed to load integrations. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Integrations</h2>
          <p className="text-sm text-slate-500">Monitor external integrations and data pipeline health</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="w-16 h-5 rounded-full" />
                </div>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          integrations?.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    {getIntegrationIcon(integration.type)}
                  </div>
                  <Badge className={getStatusBadge(integration.status)}>
                    <span className="flex items-center">
                      {getStatusIcon(integration.status)}
                      <span className="ml-1 capitalize">{integration.status}</span>
                    </span>
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 capitalize">{integration.name}</h3>
                <p className="text-sm text-slate-500 mb-3">
                  {integration.type === "amplitude" && "Event tracking and analytics"}
                  {integration.type === "braze" && "Marketing automation"}
                  {integration.type === "airflow" && "Data pipeline orchestration"}
                </p>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Last sync:</span>
                    <span>{formatDate(integration.last_sync?.toString() || null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {integration.type === "amplitude" && "Events/hour:"}
                      {integration.type === "braze" && "Messages sent:"}
                      {integration.type === "airflow" && "Failed DAGs:"}
                    </span>
                    <span className={integration.status === "error" || integration.status === "warning" ? "text-yellow-600" : ""}>
                      {integration.type === "amplitude" && "2.1K"}
                      {integration.type === "braze" && "148 today"}
                      {integration.type === "airflow" && (integration.status === "warning" ? "1" : "0")}
                    </span>
                  </div>
                </div>
                {integration.error_message && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                    {integration.error_message}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => refreshIntegration(integration.id)}
                  disabled={updateIntegrationMutation.isPending}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Airflow DAGs Monitor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Airflow DAGs Status</CardTitle>
          <p className="text-sm text-slate-500">Monitor and manually trigger data pipeline runs</p>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {mockDAGs.map((dag) => (
              <div key={dag.id} className="p-6 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-md font-semibold text-slate-800">{dag.name}</h4>
                      <Badge className={getDAGStatusBadge(dag.status)}>
                        <span className="flex items-center">
                          {getDAGStatusIcon(dag.status)}
                          <span className="ml-1 capitalize">{dag.status}</span>
                        </span>
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{dag.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>
                        <Clock className="h-3 w-3 mr-1 inline" />
                        Last run: {formatDate(dag.last_run)}
                      </span>
                      <span>
                        <Activity className="h-3 w-3 mr-1 inline" />
                        Duration: {dag.duration}
                      </span>
                      <span>
                        <RefreshCw className="h-3 w-3 mr-1 inline" />
                        Schedule: {dag.schedule}
                      </span>
                      {dag.error && (
                        <span className="text-red-500">
                          <AlertTriangle className="h-3 w-3 mr-1 inline" />
                          Error: {dag.error}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {dag.status === "running" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                      >
                        <LoaderPinwheel className="h-4 w-4 mr-1 animate-spin" />
                        Running
                      </Button>
                    ) : dag.status === "failed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-500 text-white hover:bg-blue-600"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Trigger
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700">
                      {dag.status === "failed" ? (
                        <>
                          <Bug className="h-4 w-4 mr-1" />
                          Debug
                        </>
                      ) : dag.status === "running" ? (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Monitor
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Logs
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
