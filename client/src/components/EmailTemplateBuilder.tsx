import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code, Palette, Type, Mail } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  html: string;
  variables: string[];
}

interface EmailTemplateBuilderProps {
  value?: {
    templateId?: string;
    subject?: string;
    customContent?: string;
    templateVariables?: Record<string, string>;
  };
  onChange: (value: {
    templateId: string;
    subject: string;
    customContent: string;
    templateVariables: Record<string, string>;
  }) => void;
  presentations?: Array<{ id: string; title: string }>;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'professional',
    name: 'Professional Report',
    description: 'Clean, corporate design suitable for business reports',
    preview: '',
    html: '',
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url']
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple, minimalist design focused on content',
    preview: '',
    html: '',
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution']
  },
  {
    id: 'dashboard',
    name: 'Dashboard Style',
    description: 'Modern dashboard-inspired design with metrics highlights',
    preview: '',
    html: '',
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url', 'metric_1_value', 'metric_1_label', 'metric_2_value', 'metric_2_label', 'metric_3_value', 'metric_3_label']
  }
];

export function EmailTemplateBuilder({ value, onChange, presentations = [] }: EmailTemplateBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(
    value?.templateId ? emailTemplates.find(t => t.id === value.templateId) || null : null
  );
  const [subject, setSubject] = useState(value?.subject || '');
  const [customContent, setCustomContent] = useState(value?.customContent || '');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>(
    value?.templateVariables || {}
  );
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (selectedTemplate && onChange) {
      onChange({
        templateId: selectedTemplate.id,
        subject,
        customContent,
        templateVariables
      });
    }
  }, [selectedTemplate, subject, customContent, templateVariables, onChange]);

  useEffect(() => {
    if (selectedTemplate) {
      // Generate preview HTML with current variables
      let html = selectedTemplate.html || getTemplatePreview(selectedTemplate.id);
      
      // Replace variables with current values or placeholders
      selectedTemplate.variables.forEach(variable => {
        const value = templateVariables[variable] || `[${variable.replace(/_/g, ' ').toUpperCase()}]`;
        html = html.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });
      
      // Replace email_content with custom content
      html = html.replace(/{{email_content}}/g, customContent || 'Your custom email content will appear here...');
      
      setPreviewHtml(html);
    }
  }, [selectedTemplate, templateVariables, customContent]);

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      
      // Initialize template variables with defaults
      const defaultVariables: Record<string, string> = {
        report_title: 'Weekly Analytics Report',
        recipient_name: 'Valued Customer',
        report_name: 'Analytics Dashboard Report',
        report_period: 'Last 7 days',
        metric_1_value: '12.5K',
        metric_1_label: 'Total Users',
        metric_2_value: '85%',
        metric_2_label: 'Engagement',
        metric_3_value: '$45.2K',
        metric_3_label: 'Revenue'
      };
      
      setTemplateVariables(defaultVariables);
    }
  };

  const updateVariable = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const getTemplatePreview = (templateId: string): string => {
    // Return sample HTML for preview
    switch (templateId) {
      case 'professional':
        return `
          <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">{{report_title}}</h1>
              <p style="margin: 10px 0 0 0;">Generated on {{generation_date}}</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2>Dear {{recipient_name}},</h2>
              <p>{{email_content}}</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Report Details</h3>
                <p><strong>Report:</strong> {{report_name}}</p>
                <p><strong>Period:</strong> {{report_period}}</p>
              </div>
            </div>
          </div>
        `;
      case 'minimal':
        return `
          <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
            <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 24px;">{{report_title}}</h1>
              <p style="margin: 5px 0 0 0; color: #7f8c8d;">{{generation_date}}</p>
            </div>
            <div>
              <p>Hello {{recipient_name}},</p>
              <p>{{email_content}}</p>
              <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
                <strong>{{report_name}}</strong><br>
                Period: {{report_period}}
              </div>
            </div>
          </div>
        `;
      case 'dashboard':
        return `
          <div style="max-width: 600px; margin: 0 auto; font-family: Inter, sans-serif; background: white; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px;">
              <h1 style="margin: 0; font-size: 26px;">{{report_title}}</h1>
              <p style="margin: 8px 0 0 0;">Analytics Report • {{generation_date}}</p>
            </div>
            <div style="display: flex; padding: 0 30px; margin-top: -20px;">
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px;">
                <p style="font-size: 24px; font-weight: 700; margin: 0;">{{metric_1_value}}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">{{metric_1_label}}</p>
              </div>
            </div>
            <div style="padding: 40px 30px;">
              <p>Hi {{recipient_name}},</p>
              <p>{{email_content}}</p>
            </div>
          </div>
        `;
      default:
        return '<p>Select a template to see preview</p>';
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Email Template
          </CardTitle>
          <CardDescription>
            Select a pre-designed template for your scheduled report emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emailTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <>
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>
              
              <div>
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Enter your custom email message..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Template Variables
              </CardTitle>
              <CardDescription>
                Customize the dynamic content in your email template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.variables
                  .filter(variable => !['generation_date', 'generation_time', 'dashboard_url'].includes(variable))
                  .map((variable) => (
                  <div key={variable}>
                    <Label htmlFor={variable}>
                      {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <Input
                      id={variable}
                      value={templateVariables[variable] || ''}
                      onChange={(e) => updateVariable(variable, e.target.value)}
                      placeholder={`Enter ${variable.replace(/_/g, ' ')}...`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList>
                  <TabsTrigger value="preview">Visual Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML Code</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                      className="email-preview"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="html" className="mt-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <pre className="text-sm overflow-x-auto">
                      <code>{previewHtml}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}