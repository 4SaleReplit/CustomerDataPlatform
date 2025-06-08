
import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UpsellItem {
  id: string;
  item_type: string;
  message: string;
  metric_value: string;
  metric_indicator: string;
  valid_until: string;
}

export default function CampaignBuilder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    targetCohort: '',
    schedule: 'now',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([
    {
      id: '1',
      item_type: '',
      message: '',
      metric_value: '',
      metric_indicator: '',
      valid_until: ''
    }
  ]);

  const mockCohorts = [
    'Premium Users',
    'Active Listers',
    'New Users',
    'High Value Customers'
  ];

  const itemTypes = [
    { value: 'refresh', label: 'Refresh Listing' },
    { value: 'pin', label: 'Pin Listing' },
    { value: 'boost', label: 'Boost Listing' },
    { value: 'premium', label: 'Premium Upgrade' }
  ];

  const steps = [
    'Campaign Setup',
    'Audience Selection',
    'Message & Items',
    'Review & Schedule'
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // TODO: Implement campaign submission
    console.log('Submitting campaign:', {
      ...campaignData,
      upsellItems: upsellItems
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Create Upselling Campaign</h1>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-4 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Campaign Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter campaign name..."
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
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
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Audience Selection</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Cohort</Label>
                  <Select value={campaignData.targetCohort} onValueChange={(value) => setCampaignData({...campaignData, targetCohort: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCohorts.map((cohort) => (
                        <SelectItem key={cohort} value={cohort}>
                          {cohort}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {campaignData.targetCohort && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Estimated audience size</p>
                    <p className="text-2xl font-bold text-blue-600">12,543 users</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Message & Items</h2>
              <div className="space-y-6">
                {upsellItems.map((item, index) => (
                  <Card key={item.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Upsell Item {index + 1}</CardTitle>
                      {upsellItems.length > 1 && (
                        <Button
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
                            placeholder="e.g., 5.99"
                            value={item.metric_value}
                            onChange={(e) => updateUpsellItem(item.id, 'metric_value', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Metric Indicator</Label>
                          <Input
                            placeholder="e.g., USD"
                            value={item.metric_indicator}
                            onChange={(e) => updateUpsellItem(item.id, 'metric_indicator', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="outline" onClick={addUpsellItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Item
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Review & Schedule</h2>
              
              <Tabs defaultValue="summary">
                <TabsList>
                  <TabsTrigger value="summary">Campaign Summary</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="preview">JSON Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Campaign Details</h4>
                      <p><strong>Name:</strong> {campaignData.name}</p>
                      <p><strong>Description:</strong> {campaignData.description}</p>
                      <p><strong>Target:</strong> {campaignData.targetCohort}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Upsell Items</h4>
                      <p>{upsellItems.length} item(s) configured</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="schedule"
                          value="now"
                          checked={campaignData.schedule === 'now'}
                          onChange={(e) => setCampaignData({...campaignData, schedule: e.target.value})}
                        />
                        Publish Now
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
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify({
                        campaign: campaignData,
                        upselling_items: upsellItems
                      }, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleSubmit}>
                Submit Campaign
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
