import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft, Edit, Play, Pause, Trash2, Users, Calendar, Target, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId],
    queryFn: () => apiRequest(`/api/campaigns/${campaignId}`)
  });

  // Fetch cohorts for display
  const { data: cohorts = [] } = useQuery({
    queryKey: ['/api/cohorts'],
    queryFn: () => apiRequest('/api/cohorts')
  });

  // Fetch campaign jobs
  const { data: campaignJobs = [] } = useQuery({
    queryKey: ['/api/campaigns', campaignId, 'jobs'],
    queryFn: () => apiRequest(`/api/campaigns/${campaignId}/jobs`)
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: () => apiRequest(`/api/campaigns/${campaignId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been successfully deleted."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      navigate('/campaigns');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive"
      });
    }
  });

  // Update campaign status mutation
  const updateCampaignMutation = useMutation({
    mutationFn: (updates: any) => apiRequest(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      toast({
        title: "Campaign Updated",
        description: "Campaign status has been updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive"
      });
    }
  });

  if (campaignLoading) {
    return <div className="flex items-center justify-center h-64">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="flex items-center justify-center h-64">Campaign not found</div>;
  }

  const getCohortName = (cohortId: string) => {
    const cohort = cohorts.find((c: any) => c.id === cohortId);
    return cohort ? cohort.name : 'Unknown Cohort';
  };

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

  const handleStatusToggle = () => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    updateCampaignMutation.mutate({ status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <Link to={`/campaigns/${campaignId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {campaign.status === 'active' ? (
            <Button variant="outline" onClick={handleStatusToggle}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          ) : campaign.status === 'paused' ? (
            <Button variant="outline" onClick={handleStatusToggle}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          ) : null}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteCampaignMutation.mutate()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getStatusBadge(campaign.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaign.messagesSent || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Cohort</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{getCohortName(campaign.cohortId)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upsell-items">Upsell Items</TabsTrigger>
          <TabsTrigger value="jobs">Processing Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {campaign.name}</div>
                    <div><strong>Description:</strong> {campaign.description || 'No description'}</div>
                    <div><strong>Schedule:</strong> {campaign.schedule === 'now' ? 'Start immediately' : 'Scheduled'}</div>
                    {campaign.scheduledDate && (
                      <div><strong>Scheduled Date:</strong> {new Date(campaign.scheduledDate).toLocaleString()}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Messages Sent:</strong> {(campaign.messagesSent || 0).toLocaleString()}</div>
                    <div><strong>Views:</strong> {(campaign.views || 0).toLocaleString()}</div>
                    <div><strong>Conversions:</strong> {(campaign.conversions || 0).toLocaleString()}</div>
                    <div><strong>Conversion Rate:</strong> {
                      campaign.views > 0 
                        ? ((campaign.conversions / campaign.views) * 100).toFixed(1) + '%'
                        : '0%'
                    }</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upsell-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upsell Items ({campaign.upsellItems?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaign.upsellItems?.map((item: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2">Item {index + 1}</h5>
                          <div className="space-y-1 text-sm">
                            <div><strong>Type:</strong> {item.item_type}</div>
                            <div><strong>Message:</strong> {item.message}</div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Metrics</h5>
                          <div className="space-y-1 text-sm">
                            <div><strong>Metric Value:</strong> {item.metric_value}</div>
                            <div><strong>Indicator:</strong> {item.metric_indicator}</div>
                            <div><strong>Valid Until:</strong> {item.valid_until ? new Date(item.valid_until).toLocaleString() : 'No expiry'}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || <div className="text-gray-500">No upsell items configured</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Jobs ({campaignJobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignJobs.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {campaignJobs.filter((job: any) => job.status === 'sent').length}
                      </div>
                      <div className="text-sm text-green-700">Sent</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {campaignJobs.filter((job: any) => job.status === 'pending').length}
                      </div>
                      <div className="text-sm text-yellow-700">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {campaignJobs.filter((job: any) => job.status === 'failed').length}
                      </div>
                      <div className="text-sm text-red-700">Failed</div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">User ID</th>
                          <th className="text-left py-2">User Adv ID</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignJobs.slice(0, 50).map((job: any) => (
                          <tr key={job.id} className="border-b">
                            <td className="py-2">{job.userId}</td>
                            <td className="py-2">{job.userAdvId}</td>
                            <td className="py-2">
                              <Badge 
                                variant={job.status === 'sent' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}
                              >
                                {job.status}
                              </Badge>
                            </td>
                            <td className="py-2">{new Date(job.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {campaignJobs.length > 50 && (
                      <div className="text-center text-gray-500 py-2">
                        Showing first 50 of {campaignJobs.length} jobs
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No processing jobs found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}