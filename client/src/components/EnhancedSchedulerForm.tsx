import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Mail, Send, Settings, Play, Pause, Trash2, Plus, Users, Database, CalendarDays, TestTube, Eye, Type, Code } from "lucide-react";
import { EmailTemplateBuilder } from "@/components/EmailTemplateBuilder";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface CustomVariable {
  name: string;
  type: 'static' | 'query' | 'timestamp' | 'formula';
  value: string;
  description: string;
}

interface FormData {
  name: string;
  description: string;
  presentationId: string;
  cronExpression: string;
  timezone: string;
  frequency: string;
  time: string;
  dayOfWeek: string;
  recipientList: string[];
  ccList: string[];
  bccList: string[];
  isActive: boolean;
  sendOption: 'now' | 'schedule';
  emailTemplate: {
    templateId: string;
    subject: string;
    customContent: string;
    templateVariables: Record<string, string>;
  };
  pdfDeliveryUrl: string;
  placeholderConfig: Record<string, any>;
  formatSettings: { format: string; includeCharts: boolean };
  customVariables: CustomVariable[];
}

interface EnhancedSchedulerFormProps {
  mode: 'schedule' | 'one-time';
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function EnhancedSchedulerForm({
  mode,
  initialData,
  onSubmit,
  onCancel
}: EnhancedSchedulerFormProps) {
  
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    presentationId: initialData?.presentationId || '',
    cronExpression: initialData?.cronExpression || '0 9 * * 1',
    timezone: initialData?.timezone || 'Africa/Cairo',
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 'monday',
    recipientList: initialData?.recipientList || [],
    ccList: initialData?.ccList || [],
    bccList: initialData?.bccList || [],
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    sendOption: mode === 'one-time' ? 'now' : 'schedule',
    emailTemplate: {
      templateId: initialData?.emailTemplate?.templateId || 'professional',
      subject: initialData?.emailTemplate?.subject || initialData?.emailSubject || '',
      customContent: initialData?.emailTemplate?.customContent || '',
      templateVariables: initialData?.emailTemplate?.templateVariables || {}
    },
    pdfDeliveryUrl: initialData?.pdfDeliveryUrl || '',
    placeholderConfig: initialData?.placeholderConfig || {},
    formatSettings: {
      format: initialData?.formatSettings?.format || 'pdf',
      includeCharts: initialData?.formatSettings?.includeCharts || true
    },
    customVariables: initialData?.customVariables || []
  });

  const [customVariables, setCustomVariables] = useState<CustomVariable[]>(formData.customVariables);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: presentations = [] } = useQuery({
    queryKey: ['/api/presentations'],
    queryFn: () => apiRequest('/api/presentations')
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [newCc, setNewCc] = useState('');
  const [newBcc, setNewBcc] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      if (initialData?.id) {
        return apiRequest(`/api/scheduled-reports/${initialData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/scheduled-reports', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      toast({ 
        title: mode === 'one-time' ? "Email sent successfully" : "Report scheduled successfully" 
      });
      onSubmit(formData);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: mode === 'one-time' ? "Failed to send email" : "Failed to schedule report",
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.emailTemplate.subject) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const requestData = {
        ...formData,
        customVariables,
        cronExpression: mode === 'one-time' ? null : formData.cronExpression,
        isActive: mode === 'one-time' ? false : formData.isActive,
        sentImmediately: mode === 'one-time',
        emailSubject: formData.emailTemplate.subject
      };

      await submitMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const generateCronExpression = () => {
    if (mode === 'one-time') return '';
    
    const hour = parseInt(formData.time.split(':')[0]);
    const minute = parseInt(formData.time.split(':')[1]);

    switch (formData.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        const dayMap: Record<string, number> = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        return `${minute} ${hour} * * ${dayMap[formData.dayOfWeek]}`;
      case 'monthly':
        return `${minute} ${hour} 1 * *`;
      default:
        return `${minute} ${hour} * * 1`;
    }
  };

  useEffect(() => {
    if (mode === 'schedule') {
      const cronExpression = generateCronExpression();
      updateFormData({ cronExpression });
    }
  }, [formData.frequency, formData.time, formData.dayOfWeek, mode]);

  const addRecipient = () => {
    if (newRecipient && !formData.recipientList.includes(newRecipient)) {
      updateFormData({
        recipientList: [...formData.recipientList, newRecipient]
      });
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    updateFormData({
      recipientList: formData.recipientList.filter(r => r !== email)
    });
  };

  const addCc = () => {
    if (newCc && !formData.ccList.includes(newCc)) {
      updateFormData({
        ccList: [...formData.ccList, newCc]
      });
      setNewCc('');
    }
  };

  const removeCc = (email: string) => {
    updateFormData({
      ccList: formData.ccList.filter(r => r !== email)
    });
  };

  const addBcc = () => {
    if (newBcc && !formData.bccList.includes(newBcc)) {
      updateFormData({
        bccList: [...formData.bccList, newBcc]
      });
      setNewBcc('');
    }
  };

  const removeBcc = (email: string) => {
    updateFormData({
      bccList: formData.bccList.filter(r => r !== email)
    });
  };

  const addCustomVariable = () => {
    const newVariable: CustomVariable = {
      name: '',
      type: 'static',
      value: '',
      description: ''
    };
    setCustomVariables([...customVariables, newVariable]);
  };

  const updateCustomVariable = (index: number, field: keyof CustomVariable, value: string) => {
    const updated = [...customVariables];
    updated[index] = { ...updated[index], [field]: value };
    setCustomVariables(updated);
  };

  const removeCustomVariable = (index: number) => {
    setCustomVariables(customVariables.filter((_, i) => i !== index));
  };

  const generateEmailPreview = () => {
    let content = formData.emailTemplate.customContent;
    
    // Replace custom variables
    customVariables.forEach(variable => {
      if (variable.name && variable.value) {
        const placeholder = `{${variable.name}}`;
        content = content.replace(new RegExp(placeholder, 'g'), variable.value);
      }
    });

    // Replace standard variables
    const now = new Date();
    content = content.replace(/{report_name}/g, formData.name);
    content = content.replace(/{current_date}/g, now.toLocaleDateString());
    content = content.replace(/{current_time}/g, now.toLocaleTimeString());

    return content;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
      {/* Configuration Panel */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Report Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Enter report name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Enter report description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="presentation">Select Presentation</Label>
                <Select 
                  value={formData.presentationId} 
                  onValueChange={(value) => updateFormData({ presentationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a presentation" />
                  </SelectTrigger>
                  <SelectContent>
                    {presentations.map((presentation: any) => (
                      <SelectItem key={presentation.id} value={presentation.id}>
                        {presentation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Email Template Designer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Template Designer
              </CardTitle>
              <CardDescription>
                Design your email with live preview and template variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailTemplateBuilder
                value={formData.emailTemplate}
                onChange={(template) => updateFormData({ emailTemplate: template })}
                presentations={presentations}
              />
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* To Recipients */}
              <div>
                <Label>To Recipients</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Enter email address"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                  />
                  <Button type="button" onClick={addRecipient} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.recipientList.map((email, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CC Recipients */}
              <div>
                <Label>CC Recipients</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCc}
                    onChange={(e) => setNewCc(e.target.value)}
                    placeholder="Enter CC email address"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCc())}
                  />
                  <Button type="button" onClick={addCc} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.ccList.map((email, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeCc(email)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* BCC Recipients */}
              <div>
                <Label>BCC Recipients</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newBcc}
                    onChange={(e) => setNewBcc(e.target.value)}
                    placeholder="Enter BCC email address"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBcc())}
                  />
                  <Button type="button" onClick={addBcc} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.bccList.map((email, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeBcc(email)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration - Only show for schedule mode */}
          {mode === 'schedule' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Frequency</Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(value) => updateFormData({ frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateFormData({ time: e.target.value })}
                  />
                </div>

                {formData.frequency === 'weekly' && (
                  <div>
                    <Label>Day of Week</Label>
                    <Select 
                      value={formData.dayOfWeek} 
                      onValueChange={(value) => updateFormData({ dayOfWeek: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Timezone</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => updateFormData({ timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => updateFormData({ isActive: checked })}
                  />
                  <Label htmlFor="active">Active Schedule</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Custom Variables
              </CardTitle>
              <CardDescription>
                Define custom variables to use in your email content using {`{variable_name}`} syntax
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customVariables.map((variable, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Variable {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomVariable(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Variable Name</Label>
                      <Input
                        value={variable.name}
                        onChange={(e) => updateCustomVariable(index, 'name', e.target.value)}
                        placeholder="variable_name"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={variable.type} 
                        onValueChange={(value: 'static' | 'query' | 'timestamp' | 'formula') => 
                          updateCustomVariable(index, 'type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="static">Static Value</SelectItem>
                          <SelectItem value="query">SQL Query</SelectItem>
                          <SelectItem value="timestamp">Timestamp</SelectItem>
                          <SelectItem value="formula">Formula</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Value</Label>
                    <Input
                      value={variable.value}
                      onChange={(e) => updateCustomVariable(index, 'value', e.target.value)}
                      placeholder={
                        variable.type === 'static' ? 'Enter static value' :
                        variable.type === 'query' ? 'SELECT count(*) FROM users' :
                        variable.type === 'timestamp' ? 'YYYY-MM-DD HH:mm:ss' :
                        'Enter formula'
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={variable.description}
                      onChange={(e) => updateCustomVariable(index, 'description', e.target.value)}
                      placeholder="Brief description of this variable"
                    />
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addCustomVariable} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Variable
              </Button>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Processing..." : mode === 'one-time' ? "Send Now" : "Schedule Report"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Live Preview Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Email Preview
            </CardTitle>
            <CardDescription>
              See how your email will appear to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50 min-h-96">
              <div className="bg-white border rounded p-4 space-y-3">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-600">
                    <strong>From:</strong> ahmed.hawary@4sale.tech<br />
                    <strong>To:</strong> {formData.recipientList.join(', ') || 'No recipients'}<br />
                    {formData.ccList.length > 0 && (
                      <>
                        <strong>CC:</strong> {formData.ccList.join(', ')}<br />
                      </>
                    )}
                    <strong>Subject:</strong> {formData.emailTemplate.subject || 'No subject'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>4SALE TECHNOLOGIES</strong><br />
                    Business Analytics & Intelligence Platform
                  </div>
                  
                  <div>
                    <strong>Analytics Report:</strong> {formData.name || 'Untitled Report'}
                  </div>
                  
                  <div>
                    Dear Valued Client,
                  </div>
                  
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {generateEmailPreview() || 'Your report content will appear here.'}
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-4">
                    <strong>REPORT INFORMATION:</strong><br />
                    Report ID: RPT-{new Date().getFullYear()}{(new Date().getMonth()+1).toString().padStart(2,'0')}{new Date().getDate().toString().padStart(2,'0')}-{Math.random().toString(36).substr(2,6).toUpperCase()}<br />
                    Generated: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}<br />
                    Report Type: Business Intelligence Dashboard
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-4">
                    ---<br />
                    4Sale Technologies<br />
                    Advanced Business Intelligence & Analytics Solutions<br />
                    © {new Date().getFullYear()} 4Sale Technologies. All rights reserved.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Summary - Only show for schedule mode */}
        {mode === 'schedule' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Schedule Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Frequency:</strong> {formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)}
                </div>
                <div>
                  <strong>Time:</strong> {formData.time}
                </div>
                {formData.frequency === 'weekly' && (
                  <div>
                    <strong>Day:</strong> {formData.dayOfWeek.charAt(0).toUpperCase() + formData.dayOfWeek.slice(1)}
                  </div>
                )}
                <div>
                  <strong>Timezone:</strong> {formData.timezone}
                </div>
                <div>
                  <strong>Status:</strong> {formData.isActive ? 'Active' : 'Paused'}
                </div>
                <div>
                  <strong>Cron Expression:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{formData.cronExpression}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}