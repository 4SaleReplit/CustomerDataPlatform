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
  recipientList: string[];
  ccList: string[];
  bccList: string[];
  isActive: boolean;
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
  formData: FormData;
  setFormData: (data: FormData) => void;
  presentations: any[];
  presentationsLoading: boolean;
  mailingLists: any[];
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  updateEmailTemplate: (template: any) => void;
}

export function EnhancedSchedulerForm({
  formData,
  setFormData,
  presentations,
  presentationsLoading,
  mailingLists,
  onSubmit,
  onCancel,
  isLoading,
  updateEmailTemplate
}: EnhancedSchedulerFormProps) {
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>(formData.customVariables || []);
  const [previewHtml, setPreviewHtml] = useState('');

  // Add custom variable
  const addCustomVariable = () => {
    const newVariable: CustomVariable = {
      name: '',
      type: 'static',
      value: '',
      description: ''
    };
    const updatedVariables = [...customVariables, newVariable];
    setCustomVariables(updatedVariables);
    setFormData({
      ...formData,
      customVariables: updatedVariables
    });
  };

  // Update custom variable
  const updateCustomVariable = (index: number, field: keyof CustomVariable, value: string) => {
    const updatedVariables = [...customVariables];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    setCustomVariables(updatedVariables);
    setFormData({
      ...formData,
      customVariables: updatedVariables
    });
  };

  // Remove custom variable
  const removeCustomVariable = (index: number) => {
    const updatedVariables = customVariables.filter((_, i) => i !== index);
    setCustomVariables(updatedVariables);
    setFormData({
      ...formData,
      customVariables: updatedVariables
    });
  };

  // Generate email preview
  const generateEmailPreview = () => {
    if (!formData.emailTemplate.templateId) return '';

    // Professional template HTML
    const professionalTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">4Sale Analytics</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your Report is Ready</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">{report_title}</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0;">{email_content}</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Report Details</h3>
            <p style="margin: 5px 0;"><strong>Report:</strong> {report_name}</p>
            <p style="margin: 5px 0;"><strong>Period:</strong> {report_period}</p>
            <p style="margin: 5px 0;"><strong>Generated:</strong> {generation_date}</p>
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Powered by 4Sale Analytics Platform</p>
        </div>
      </div>
    `;

    let html = professionalTemplate;
    
    // Replace built-in template variables
    const builtInVars = {
      report_title: formData.emailTemplate.subject || 'Weekly Analytics Report',
      email_content: formData.emailTemplate.customContent || 'Your custom email content will appear here.',
      report_name: formData.name || 'Analytics Report',
      report_period: 'Last 7 days',
      generation_date: new Date().toLocaleDateString(),
      generation_time: new Date().toLocaleTimeString(),
      ...formData.emailTemplate.templateVariables
    };

    // Replace built-in variables
    Object.entries(builtInVars).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      html = html.replace(regex, value);
    });

    // Replace custom variables
    customVariables.forEach(variable => {
      if (variable.name && variable.value) {
        const regex = new RegExp(`{${variable.name}}`, 'g');
        let processedValue = variable.value;
        
        // Process different variable types
        switch (variable.type) {
          case 'timestamp':
            processedValue = new Date().toLocaleString();
            break;
          case 'query':
            processedValue = `[Query Result: ${variable.value}]`;
            break;
          case 'formula':
            processedValue = `[Calculated: ${variable.value}]`;
            break;
          default:
            processedValue = variable.value;
        }
        
        html = html.replace(regex, processedValue);
      }
    });

    return html;
  };

  // Update preview when form data changes
  useEffect(() => {
    const preview = generateEmailPreview();
    setPreviewHtml(preview);
  }, [formData.emailTemplate, customVariables]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl">
      {/* Left Column - Form Configuration */}
      <div className="flex-1 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Basic information about your scheduled report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <Label htmlFor="presentation">Select Presentation</Label>
                <Select
                  value={formData.presentationId}
                  onValueChange={(value) => setFormData({ ...formData, presentationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a presentation" />
                  </SelectTrigger>
                  <SelectContent>
                    {presentations.map((presentation) => (
                      <SelectItem key={presentation.id} value={presentation.id}>
                        {presentation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter report description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Template */}
        <Card>
          <CardHeader>
            <CardTitle>Email Template</CardTitle>
            <CardDescription>Configure the email template and content</CardDescription>
          </CardHeader>
          <CardContent>
            <EmailTemplateBuilder
              value={formData.emailTemplate}
              onChange={updateEmailTemplate}
              presentations={presentations}
            />
          </CardContent>
        </Card>

        {/* Custom Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Custom Variables
            </CardTitle>
            <CardDescription>
              Define custom variables using {"{variable_name}"} syntax. These can be static values, SQL queries, timestamps, or formulas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customVariables.map((variable, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Variable {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomVariable(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`var-name-${index}`} className="text-sm">Variable Name</Label>
                    <Input
                      id={`var-name-${index}`}
                      value={variable.name}
                      onChange={(e) => updateCustomVariable(index, 'name', e.target.value)}
                      placeholder="e.g., total_sales"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Use in email as: {"{" + variable.name + "}"}</p>
                  </div>
                  
                  <div>
                    <Label htmlFor={`var-type-${index}`} className="text-sm">Type</Label>
                    <Select
                      value={variable.type}
                      onValueChange={(value) => updateCustomVariable(index, 'type', value as any)}
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
                  <Label htmlFor={`var-value-${index}`} className="text-sm">Value</Label>
                  {variable.type === 'query' ? (
                    <Textarea
                      id={`var-value-${index}`}
                      value={variable.value}
                      onChange={(e) => updateCustomVariable(index, 'value', e.target.value)}
                      placeholder="SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE"
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={`var-value-${index}`}
                      value={variable.value}
                      onChange={(e) => updateCustomVariable(index, 'value', e.target.value)}
                      placeholder={
                        variable.type === 'static' ? 'Enter static value' :
                        variable.type === 'timestamp' ? 'Date format (auto-generated)' :
                        'Enter formula'
                      }
                    />
                  )}
                </div>
                
                <div>
                  <Label htmlFor={`var-desc-${index}`} className="text-sm">Description</Label>
                  <Input
                    id={`var-desc-${index}`}
                    value={variable.description}
                    onChange={(e) => updateCustomVariable(index, 'description', e.target.value)}
                    placeholder="Describe what this variable represents"
                  />
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addCustomVariable}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Variable
            </Button>
          </CardContent>
        </Card>

        {/* Schedule Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>Configure when and how often the report is sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cron">Cron Expression</Label>
                <Input
                  id="cron"
                  value={formData.cronExpression}
                  onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                  placeholder="0 9 * * 1"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Report"}
          </Button>
        </div>
      </div>

      {/* Right Column - Live Email Preview */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Email Preview
            </CardTitle>
            <CardDescription>
              Live preview of how your email will look to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="subject">Subject</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual" className="mt-4">
                <div className="border rounded-lg p-2 bg-gray-50 max-h-96 overflow-y-auto">
                  <iframe
                    srcDoc={previewHtml}
                    className="border-0 w-full"
                    style={{
                      height: '400px',
                      transform: 'scale(0.75)',
                      transformOrigin: 'top left'
                    }}
                    title="Email Preview"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="subject" className="mt-4">
                <div className="space-y-3">
                  <div className="border rounded p-3 bg-gray-50">
                    <Label className="text-sm font-medium">Subject Line:</Label>
                    <p className="text-sm mt-1">
                      {formData.emailTemplate.subject || 'No subject set'}
                    </p>
                  </div>
                  
                  <div className="border rounded p-3 bg-gray-50">
                    <Label className="text-sm font-medium">Custom Variables Used:</Label>
                    <div className="mt-2 space-y-1">
                      {customVariables.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No custom variables defined</p>
                      ) : (
                        customVariables.map((variable, index) => (
                          <div key={index} className="text-xs">
                            <Badge variant="outline">{"{" + variable.name + "}"}</Badge>
                            <span className="ml-2 text-muted-foreground">{variable.description || variable.type}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}