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
  frequency?: string;
  time?: string;
  dayOfWeek?: string;
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
  formData: FormData;
  setFormData: (data: FormData) => void;
  presentations: any[];
  presentationsLoading: boolean;
  mailingLists: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  updateEmailTemplate: (template: any) => void;
  mode?: 'one-time' | 'scheduled';
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
  updateEmailTemplate,
  mode = 'scheduled'
}: EnhancedSchedulerFormProps) {
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>(formData.customVariables || []);
  const [previewHtml, setPreviewHtml] = useState('');
  const [emailInputValue, setEmailInputValue] = useState<string>(formData.recipientList.join(', '));

  // Helper function to generate cron expression from user-friendly inputs
  const generateCronExpression = (frequency: string, dayOfWeek: string, time: string): string => {
    const [hour, minute] = time.split(':').map(Number);
    
    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        const dayMap: Record<string, number> = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
          thursday: 4, friday: 5, saturday: 6
        };
        return `${minute} ${hour} * * ${dayMap[dayOfWeek] || 1}`;
      case 'monthly':
        if (dayOfWeek === 'last') {
          return `${minute} ${hour} L * *`; // Last day of month
        } else {
          return `${minute} ${hour} ${dayOfWeek} * *`;
        }
      case 'quarterly':
        return `${minute} ${hour} 1 */3 *`; // First day of every 3rd month
      default:
        return `${minute} ${hour} * * 1`; // Default to weekly Monday
    }
  };

  // Helper function to generate human-readable schedule summary
  const getScheduleSummary = (formData: FormData): string => {
    const frequency = formData.frequency || 'weekly';
    const time = formData.time || '09:00';
    const dayOfWeek = formData.dayOfWeek || 'monday';
    const timezone = formData.timezone || 'Africa/Cairo';
    
    const timeFormatted = new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    let scheduleText = '';
    
    switch (frequency) {
      case 'daily':
        scheduleText = `Daily at ${timeFormatted}`;
        break;
      case 'weekly':
        const dayCapitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
        scheduleText = `Every ${dayCapitalized} at ${timeFormatted}`;
        break;
      case 'monthly':
        if (dayOfWeek === 'last') {
          scheduleText = `Last day of every month at ${timeFormatted}`;
        } else if (dayOfWeek === '1') {
          scheduleText = `1st of every month at ${timeFormatted}`;
        } else if (dayOfWeek === '15') {
          scheduleText = `15th of every month at ${timeFormatted}`;
        }
        break;
      case 'quarterly':
        scheduleText = `Every quarter (1st day) at ${timeFormatted}`;
        break;
      default:
        scheduleText = `Weekly on Monday at ${timeFormatted}`;
    }
    
    return `${scheduleText} (${timezone.split('/')[1]} timezone)`;
  };

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
    // Use default template if no templateId is set (for editing existing reports)
    const templateId = formData.emailTemplate.templateId || 'professional';

    // Template designs based on selection
    const templates = {
      professional: `
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
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Attached Report</a>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Powered by 4Sale Analytics Platform</p>
          </div>
        </div>
      `,
      minimal: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e5e7eb;">
          <div style="padding: 40px 30px; border-bottom: 1px solid #e5e7eb;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1f2937;">{report_title}</h1>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">4Sale Analytics Report</p>
          </div>
          <div style="padding: 40px 30px;">
            <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">{email_content}</p>
            <div style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #1f2937; font-weight: 500;">Report: {report_name}</p>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Generated on {generation_date}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">View Attached Report</a>
            </div>
          </div>
          <div style="padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">4Sale Analytics Platform</p>
          </div>
        </div>
      `,
      dashboard: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em;">4Sale Analytics</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Dashboard Report • {generation_date}</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; padding: 0 30px; margin-top: -20px;">
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; margin: 0 5px;">
              <p style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0;">1,247</p>
              <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">Total Users</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; margin: 0 5px;">
              <p style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0;">$12.4K</p>
              <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">Revenue</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; margin: 0 5px;">
              <p style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0;">23%</p>
              <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">Growth</p>
            </div>
          </div>
          
          <div style="padding: 40px 30px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">{report_title}</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 16px;">{email_content}</p>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-weight: 500;">Report Name</span>
                <span style="color: #1f2937; font-weight: 600;">{report_name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6b7280; font-weight: 500;">Period</span>
                <span style="color: #1f2937; font-weight: 600;">{report_period}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-weight: 500;">Generated</span>
                <span style="color: #1f2937; font-weight: 600;">{generation_date}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Attached Report</a>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 25px 30px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Powered by 4Sale Analytics Platform</p>
            <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 12px;">© 2025 4Sale. This report was generated automatically.</p>
          </div>
        </div>
      `
    };

    // Get the selected template or default to professional
    let html = templates[templateId as keyof typeof templates] || templates.professional;
    
    // Process email content to handle line breaks properly
    const processedEmailContent = (formData.emailTemplate.customContent || 'Your custom email content will appear here.')
      .replace(/\n/g, '<br>'); // Convert single line breaks to HTML breaks

    // Replace built-in template variables
    const builtInVars = {
      report_title: formData.emailTemplate.subject || 'Weekly Analytics Report',
      email_content: processedEmailContent,
      report_name: formData.name || 'Analytics Report',
      report_period: 'Last 7 days',
      generation_date: new Date().toLocaleDateString(),
      generation_time: new Date().toLocaleTimeString(),
      ...formData.emailTemplate.templateVariables
    };

    // Replace built-in variables
    Object.entries(builtInVars).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      html = html.replace(regex, String(value));
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

  // Initialize preview on component mount
  useEffect(() => {
    const preview = generateEmailPreview();
    setPreviewHtml(preview);
  }, []);

  // Update preview when form data changes (real-time, no debouncing)
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

        {/* Recipients Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Email Recipients
            </CardTitle>
            <CardDescription>Configure who will receive the scheduled reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipients">Primary Recipients</Label>
              <div className="space-y-2">
                <Input
                  id="recipients"
                  placeholder="Enter email addresses separated by commas"
                  value={emailInputValue}
                  onChange={(e) => {
                    // Allow natural typing with commas
                    setEmailInputValue(e.target.value);
                  }}
                  onBlur={(e) => {
                    // Process emails when user finishes typing
                    const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                    setFormData({ ...formData, recipientList: emails });
                    setEmailInputValue(emails.join(', '));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Process emails when Enter is pressed
                      const emails = e.currentTarget.value.split(',').map(email => email.trim()).filter(email => email);
                      setFormData({ ...formData, recipientList: emails });
                      setEmailInputValue(emails.join(', '));
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Add multiple emails separated by commas (e.g., john@example.com, jane@example.com)
                </p>
              </div>
              {formData.recipientList.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.recipientList.map((email, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {email}
                      <button
                        type="button"
                        onClick={() => {
                          const newRecipients = formData.recipientList.filter((_, i) => i !== index);
                          setFormData({ ...formData, recipientList: newRecipients });
                        }}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cc">CC Recipients (Optional)</Label>
                <Input
                  id="cc"
                  placeholder="CC emails"
                  value={formData.ccList.join(', ')}
                  onChange={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                    setFormData({ ...formData, ccList: emails });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="bcc">BCC Recipients (Optional)</Label>
                <Input
                  id="bcc"
                  placeholder="BCC emails"
                  value={formData.bccList.join(', ')}
                  onChange={(e) => {
                    const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                    setFormData({ ...formData, bccList: emails });
                  }}
                />
              </div>
            </div>

            {mailingLists && mailingLists.length > 0 && (
              <div>
                <Label>Quick Add from Mailing Lists</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {mailingLists.map((list) => (
                    <Button
                      key={list.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const listEmails = list.emails.map(e => e.email);
                        const newRecipients = Array.from(new Set([...formData.recipientList, ...listEmails]));
                        setFormData({ ...formData, recipientList: newRecipients });
                      }}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {list.name} ({list.subscriberCount})
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Configuration - Hide for one-time emails */}
        {mode === 'scheduled' && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Settings</CardTitle>
              <CardDescription>Configure when and how often the report is sent</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency || 'weekly'}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      frequency: value,
                      cronExpression: generateCronExpression(value, formData.dayOfWeek || 'monday', formData.time || '09:00')
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Select
                  value={formData.time || '09:00'}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      time: value,
                      cronExpression: generateCronExpression(formData.frequency || 'weekly', formData.dayOfWeek || 'monday', value)
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.frequency === 'weekly' || formData.frequency === 'monthly') && (
              <div>
                <Label htmlFor="dayOfWeek">
                  {formData.frequency === 'weekly' ? 'Day of Week' : 'Day of Month'}
                </Label>
                <Select
                  value={formData.dayOfWeek || 'monday'}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      dayOfWeek: value,
                      cronExpression: generateCronExpression(formData.frequency || 'weekly', value, formData.time || '09:00')
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.frequency === 'weekly' ? (
                      <>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="1">1st of the month</SelectItem>
                        <SelectItem value="15">15th of the month</SelectItem>
                        <SelectItem value="last">Last day of the month</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                  <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                  <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Summary */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Schedule Summary:</strong> {getScheduleSummary(formData)}
              </p>
            </div>
          </CardContent>
          </Card>
        )}

        {/* Send Options */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Options</CardTitle>
            <CardDescription>Choose when to send the report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="send-now"
                  name="sendOption"
                  value="now"
                  checked={formData.sendOption === 'now'}
                  onChange={(e) => setFormData({ ...formData, sendOption: e.target.value as 'now' | 'schedule' })}
                />
                <Label htmlFor="send-now" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Now (One-time)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="schedule-later"
                  name="sendOption"
                  value="schedule"
                  checked={formData.sendOption === 'schedule'}
                  onChange={(e) => setFormData({ ...formData, sendOption: e.target.value as 'now' | 'schedule' })}
                />
                <Label htmlFor="schedule-later" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule for Later
                </Label>
              </div>
            </div>
            
            {formData.sendOption === 'now' && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ⚡ Send Now Mode - Email will be sent immediately
                </p>
                <p className="text-xs text-blue-700">
                  Make sure to fill in the Email Subject and Content fields below before sending.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading 
              ? (formData.sendOption === 'now' ? "Sending..." : "Creating...") 
              : (formData.sendOption === 'now' ? "Send Now" : "Create Report")
            }
          </Button>
        </div>
      </div>

      {/* Right Column - Live Email Preview */}
      <div className="w-full lg:w-[500px] flex-shrink-0">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Preview
            </CardTitle>
            <CardDescription>
              How your email will appear in Gmail inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Gmail-style header */}
            <div className="bg-white border-b p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    4S
                  </div>
                  <div>
                    <div className="font-medium">4Sale Analytics</div>
                    <div className="text-gray-500 text-xs">ahmed.hawary@4sale.tech</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">now</div>
              </div>
              <div className="text-sm font-medium">
                {formData.emailTemplate.subject || 'Weekly Analytics Report'}
              </div>
            </div>
            
            {/* Email content - Live WYSIWYG Preview */}
            <div className="bg-gray-50 p-2">
              <div 
                className="mx-auto email-preview-container"
                style={{
                  transform: 'scale(0.85)',
                  transformOrigin: 'top center',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  isolation: 'isolate',
                  containIntrinsicSize: '600px 800px',
                  contain: 'layout style'
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            
            {/* Custom Variables Info */}
            {customVariables.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <Label className="text-sm font-medium">Custom Variables:</Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {customVariables.map((variable, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {"{" + variable.name + "}"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}