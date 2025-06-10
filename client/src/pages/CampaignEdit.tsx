import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UpsellItem {
  id: string;
  item_type: string;
  message: string;
  metric_value: string;
  metric_indicator: string;
  valid_until: string;
}

export default function CampaignEdit() {
  const { campaignId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    cohortId: '',
    schedule: 'now',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId],
    queryFn: () => apiRequest(`/api/campaigns/${campaignId}`)
  });

  // Fetch cohorts for dropdown
  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery({
    queryKey: ['/api/cohorts'],
    queryFn: () => apiRequest('/api/cohorts')
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: (campaignData: any) => apiRequest(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId] });
      navigate(`/campaigns/${campaignId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive"
      });
    }
  });

  // Load campaign data when it's fetched
  useEffect(() => {
    if (campaign) {
      setCampaignData({
        name: campaign.name || '',
        description: campaign.description || '',
        cohortId: campaign.cohortId || '',
        schedule: campaign.schedule || 'now',
        scheduledDate: campaign.scheduledDate ? new Date(campaign.scheduledDate).toISOString().split('T')[0] : '',
        scheduledTime: campaign.scheduledDate ? new Date(campaign.scheduledDate).toISOString().split('T')[1].substring(0, 5) : ''
      });
      
      if (campaign.upsellItems) {
        setUpsellItems(campaign.upsellItems.map((item: any, index: number) => ({
          id: `${index + 1}`,
          item_type: item.item_type || '',
          message: item.message || '',
          metric_value: item.metric_value || '',
          metric_indicator: item.metric_indicator || '',
          valid_until: item.valid_until || ''
        })));
      }
    }
  }, [campaign]);

  const itemTypes = [
    { value: 'refresh', label: 'Refresh Listing' },
    { value: 'pin', label: 'Pin Listing' },
    { value: 'boost', label: 'Boost Listing' },
    { value: 'premium', label: 'Premium Upgrade' }
  ];

  const addUpsellItem = () => {
    const newItem: UpsellItem = {
      id: Date.now().toString(),
      item_type: '',
      message: '',
      metric_value: '',
      metric_indicator: '',
      valid_until: ''
    };
    setUpsellItems([...upsellItems, newItem]);
  };

  const removeUpsellItem = (id: string) => {
    setUpsellItems(upsellItems.filter(item => item.id !== id));
  };

  const updateUpsellItem = (id: string, field: keyof UpsellItem, value: string) => {
    setUpsellItems(upsellItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const campaignPayload = {
      name: campaignData.name,
      description: campaignData.description,
      cohortId: campaignData.cohortId,
      schedule: campaignData.schedule,
      scheduledDate: campaignData.schedule === 'later' ? new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime}`) : null,
      upsellItems: upsellItems.map(item => ({
        item_type: item.item_type,
        message: item.message,
        metric_value: item.metric_value,
        metric_indicator: item.metric_indicator,
        valid_until: item.valid_until
      }))
    };
    
    updateCampaignMutation.mutate(campaignPayload);
  };

  const selectedCohort = cohorts.find((c: any) => c.id === campaignData.cohortId);

  if (campaignLoading) {
    return <div className="flex items-center justify-center h-64">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="flex items-center justify-center h-64">Campaign not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/campaigns/${campaignId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaign
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Enter campaign name..."
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this campaign..."
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({...campaignData, description: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audience Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Cohort</Label>
              <Select value={campaignData.cohortId} onValueChange={(value) => setCampaignData({...campaignData, cohortId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohortsLoading ? (
                    <SelectItem value="" disabled>Loading cohorts...</SelectItem>
                  ) : (
                    cohorts.map((cohort: any) => (
                      <SelectItem key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedCohort && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Estimated audience size</p>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedCohort.userCount ? selectedCohort.userCount.toLocaleString() : 'Calculating...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{selectedCohort.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upsell Items */}
        <Card>
          <CardHeader>
            <CardTitle>Upsell Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {upsellItems.map((item, index) => (
              <Card key={item.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Upsell Item {index + 1}</CardTitle>
                  {upsellItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpsellItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Type</Label>
                      <Select value={item.item_type} onValueChange={(value) => updateUpsellItem(item.id, 'item_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                        <SelectContent>
                          {itemTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input
                        type="datetime-local"
                        value={item.valid_until}
                        onChange={(e) => updateUpsellItem(item.id, 'valid_until', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enter upselling message..."
                      value={item.message}
                      onChange={(e) => updateUpsellItem(item.id, 'message', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Metric Value</Label>
                      <Input
                        placeholder="e.g., ad views dropped by 15%"
                        value={item.metric_value}
                        onChange={(e) => updateUpsellItem(item.id, 'metric_value', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Metric Indicator</Label>
                      <Input
                        placeholder="e.g., declining"
                        value={item.metric_indicator}
                        onChange={(e) => updateUpsellItem(item.id, 'metric_indicator', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button type="button" variant="outline" onClick={addUpsellItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Another Item
            </Button>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="schedule"
                  value="now"
                  checked={campaignData.schedule === 'now'}
                  onChange={(e) => setCampaignData({...campaignData, schedule: e.target.value})}
                />
                Start Now
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="schedule"
                  value="later"
                  checked={campaignData.schedule === 'later'}
                  onChange={(e) => setCampaignData({...campaignData, schedule: e.target.value})}
                />
                Schedule for Later
              </label>
            </div>
            
            {campaignData.schedule === 'later' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={campaignData.scheduledDate}
                    onChange={(e) => setCampaignData({...campaignData, scheduledDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={campaignData.scheduledTime}
                    onChange={(e) => setCampaignData({...campaignData, scheduledTime: e.target.value})}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link to={`/campaigns/${campaignId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateCampaignMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateCampaignMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}