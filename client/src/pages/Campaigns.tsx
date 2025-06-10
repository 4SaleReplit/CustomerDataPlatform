import React, { useState } from 'react';
import { Link } from 'wouter';
import { Plus, Eye, Edit, Trash2, Play, Pause, BarChart3, MoreHorizontal, Copy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicatingCampaign, setDuplicatingCampaign] = useState<any>(null);
  const [newCampaignName, setNewCampaignName] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns from database
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns'],
    queryFn: () => apiRequest('/api/campaigns')
  });

  // Fetch cohorts for display purposes
  const { data: cohorts = [] } = useQuery({
    queryKey: ['/api/cohorts'],
    queryFn: () => apiRequest('/api/cohorts')
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => apiRequest(`/api/campaigns/${campaignId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been successfully deleted."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive"
      });
    }
  });

  const filteredCampaigns = campaigns.filter((campaign: any) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConversionRate = (conversions: number, views: number) => {
    if (views === 0) return '0%';
    return ((conversions / views) * 100).toFixed(1) + '%';
  };

  const handleDuplicateCampaign = (campaign: any) => {
    setDuplicatingCampaign(campaign);
    setNewCampaignName(`${campaign.name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const confirmDuplicate = () => {
    if (duplicatingCampaign && newCampaignName.trim()) {
      console.log('Creating duplicate campaign:', {
        ...duplicatingCampaign,
        name: newCampaignName,
        id: Date.now() // Generate new ID
      });
      // Here you would typically call an API to create the duplicate campaign
      setDuplicateDialogOpen(false);
      setDuplicatingCampaign(null);
      setNewCampaignName('');
    }
  };

  const handleEditCampaign = (campaign: any) => {
    console.log('Editing campaign:', campaign);
    // Here you would typically navigate to edit page or open edit modal
  };

  const handleDeleteCampaign = (campaignId: string) => {
    deleteCampaignMutation.mutate(campaignId);
  };

  // Helper function to get cohort name by ID
  const getCohortName = (cohortId: string) => {
    const cohort = cohorts.find((c: any) => c.id === cohortId);
    return cohort ? cohort.name : 'Unknown Cohort';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Upselling Campaigns</h1>
        <Link to="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCampaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCampaigns.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCampaigns.reduce((sum, c) => sum + c.messagesSent, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCampaigns.reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Campaign</th>
                  <th className="text-left py-3 px-4 font-medium">Target</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Duration</th>
                  <th className="text-left py-3 px-4 font-medium">Sent</th>
                  <th className="text-left py-3 px-4 font-medium">Views</th>
                  <th className="text-left py-3 px-4 font-medium">Conversions</th>
                  <th className="text-left py-3 px-4 font-medium">CVR</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-600">{campaign.description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{campaign.targetCohort}</Badge>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(campaign.status)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div>{campaign.startDate}</div>
                      <div>to {campaign.endDate}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{campaign.messagesSent.toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium">{campaign.views.toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium">{campaign.conversions.toLocaleString()}</td>
                    <td className="py-3 px-4 font-medium">
                      {getConversionRate(campaign.conversions, campaign.views)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link to={`/campaigns/${campaign.id}/analytics`}>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === 'active' ? (
                          <Button variant="ghost" size="sm">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        
                        {/* Three dots dropdown menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border shadow-md">
                            <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
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
                                  <AlertDialogAction onClick={() => handleDeleteCampaign(campaign.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Campaign Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Campaign</DialogTitle>
            <DialogDescription>
              Enter a name for the new campaign. All settings from "{duplicatingCampaign?.name}" will be copied.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                className="col-span-3"
                placeholder="Enter campaign name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDuplicate} disabled={!newCampaignName.trim()}>
              Create Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
