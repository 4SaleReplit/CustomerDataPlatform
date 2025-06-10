import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, RefreshCw, Play, Pause, Eye, BarChart3, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CampaignJob {
  id: string;
  campaignId: string;
  jobId: string;
  userId: string;
  userAdvId: number;
  recommendation: any;
  status: string;
  error?: string;
  createdAt: string;
  processedAt?: string;
}

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId],
    queryFn: () => apiRequest(`/api/campaigns/${campaignId}`)
  });

  // Fetch campaign jobs
  const { data: campaignJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId, 'jobs'],
    queryFn: () => apiRequest(`/api/campaigns/${campaignId}/jobs`)
  });

  // Fetch cohorts for display
  const { data: cohorts = [] } = useQuery({
    queryKey: ['/api/cohorts'],
    queryFn: () => apiRequest('/api/cohorts')
  });

  // Simulate conversions mutation
  const simulateConversionsMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${campaignId}/simulate-conversions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversionRate: 0.15 }) // 15% conversion rate
    }),
    onSuccess: (data) => {
      toast({
        title: "Conversions Simulated",
        description: `Created ${data.conversionsCreated} conversions from ${data.totalJobs} jobs (${data.conversionRate}% rate)`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to simulate conversions",
        variant: "destructive"
      });
    }
  });

  if (campaignLoading) {
    return <div className="flex items-center justify-center h-64">Loading campaign...</div>;
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Not Found</h1>
        </div>
      </div>
    );
  }

  const cohort = cohorts.find((c: any) => c.id === campaign.cohortId);
  const sentJobs = campaignJobs.filter((job: CampaignJob) => job.status === 'sent');
  const failedJobs = campaignJobs.filter((job: CampaignJob) => job.status === 'failed');
  const conversions = sentJobs.filter((job: CampaignJob) => 
    job.recommendation?.upselling_items?.some((item: any) => item.sold !== null)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600">{campaign.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(campaign.status)}
          {sentJobs.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => simulateConversionsMutation.mutate()}
              disabled={simulateConversionsMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Simulate Conversions
            </Button>
          )}
          {campaign.status === 'active' ? (
            <Button variant="outline" size="sm">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          ) : campaign.status === 'paused' ? (
            <Button variant="outline" size="sm">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          ) : null}
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaign.messagesSent || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {sentJobs.length} successful deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversions.length}</div>
            <p className="text-xs text-muted-foreground">
              {sentJobs.length > 0 ? ((conversions.length / sentJobs.length) * 100).toFixed(1) : '0'}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaignJobs.length > 0 ? ((failedJobs.length / campaignJobs.length) * 100).toFixed(1) : '0'}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Cohort</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{cohort ? cohort.name : 'Unknown'}</div>
            <p className="text-xs text-muted-foreground">
              {cohort ? (cohort.userCount || 0).toLocaleString() : '0'} users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="jobs">Job Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Schedule:</strong> {campaign.schedule}
                  {campaign.scheduledDate && (
                    <span className="ml-2 text-gray-600">
                      ({new Date(campaign.scheduledDate).toLocaleString()})
                    </span>
                  )}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(campaign.createdAt).toLocaleString()}
                </div>
                {campaign.startedAt && (
                  <div>
                    <strong>Started:</strong> {new Date(campaign.startedAt).toLocaleString()}
                  </div>
                )}
                <div>
                  <strong>Upsell Items:</strong> {campaign.upsellItems?.length || 0} configured
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upsell Items Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                  {JSON.stringify(campaign.upsellItems, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sample Recommendations ({sentJobs.length} total)</CardTitle>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div>Loading recommendations...</div>
              ) : sentJobs.length > 0 ? (
                <div className="space-y-4">
                  {sentJobs.slice(0, 5).map((job: CampaignJob) => (
                    <div key={job.id} className="border rounded p-4">
                      <div className="text-sm font-medium mb-2">
                        User ID: {job.userId} | Adv ID: {job.userAdvId}
                      </div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(job.recommendation, null, 2)}
                      </pre>
                    </div>
                  ))}
                  {sentJobs.length > 5 && (
                    <div className="text-center text-gray-600">
                      ... and {sentJobs.length - 5} more recommendations
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-600">No recommendations sent yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Tracking ({conversions.length} conversions)</CardTitle>
            </CardHeader>
            <CardContent>
              {conversions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">User ID</th>
                        <th className="text-left py-2">Item Type</th>
                        <th className="text-left py-2">Sold Date</th>
                        <th className="text-left py-2">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversions.map((job: CampaignJob) => 
                        job.recommendation?.upselling_items
                          ?.filter((item: any) => item.sold !== null)
                          .map((item: any, index: number) => (
                            <tr key={`${job.id}-${index}`} className="border-b">
                              <td className="py-2">{job.userId}</td>
                              <td className="py-2">{item.item_type}</td>
                              <td className="py-2">{item.sold || '-'}</td>
                              <td className="py-2 text-sm">{item.upselling_msg?.message_id}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-600">No conversions yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Job ID</th>
                      <th className="text-left py-2">User ID</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Created</th>
                      <th className="text-left py-2">Processed</th>
                      <th className="text-left py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignJobs.slice(0, 20).map((job: CampaignJob) => (
                      <tr key={job.id} className="border-b">
                        <td className="py-2 text-sm font-mono">{job.jobId}</td>
                        <td className="py-2">{job.userId}</td>
                        <td className="py-2">
                          <Badge variant={job.status === 'sent' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-sm">{new Date(job.createdAt).toLocaleString()}</td>
                        <td className="py-2 text-sm">{job.processedAt ? new Date(job.processedAt).toLocaleString() : '-'}</td>
                        <td className="py-2 text-sm text-red-600">{job.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {campaignJobs.length > 20 && (
                  <div className="text-center text-gray-600 mt-4">
                    Showing 20 of {campaignJobs.length} jobs
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}