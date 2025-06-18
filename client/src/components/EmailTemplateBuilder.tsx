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
    variables: ['report_name', 'recipient_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url', 'current_date', 'current_time']
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple, minimalist design focused on content',
    preview: '',
    html: '',
    variables: ['report_name', 'recipient_name', 'report_period', 'generation_date', 'current_date', 'current_time']
  },
  {
    id: 'dashboard',
    name: 'Dashboard Style',
    description: 'Modern dashboard-inspired layout with metrics',
    preview: '',
    html: '',
    variables: ['report_name', 'recipient_name', 'report_period', 'generation_date', 'dashboard_url', 'current_date', 'current_time', 'report_status']
  }
];

export function EmailTemplateBuilder({ value, onChange, presentations }: EmailTemplateBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(value?.templateId || 'professional');
  const [subject, setSubject] = useState<string>(value?.subject || '');
  const [customContent, setCustomContent] = useState<string>(value?.customContent || '');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>(
    value?.templateVariables || {}
  );

  useEffect(() => {
    onChange({
      templateId: selectedTemplate,
      subject,
      customContent,
      templateVariables
    });
  }, [selectedTemplate, subject, customContent, templateVariables, onChange]);

  const updateVariable = (key: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generatePreview = () => {
    let content = customContent;
    
    // Replace template variables
    Object.entries(templateVariables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    // Replace standard variables
    const now = new Date();
    content = content.replace(/{current_date}/g, now.toLocaleDateString());
    content = content.replace(/{current_time}/g, now.toLocaleTimeString());
    content = content.replace(/{report_name}/g, templateVariables.report_name || 'Sample Report');

    return content;
  };

  const getTemplateHTML = () => {
    const previewContent = generatePreview();
    
    switch (selectedTemplate) {
      case 'professional':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">4SALE TECHNOLOGIES</h1>
              <p style="color: #e8f2ff; margin: 10px 0 0 0; font-size: 16px;">Business Analytics & Intelligence Platform</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Analytics Report: ${templateVariables.report_name || 'Your Report'}</h2>
              <p style="color: #666666; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">Dear Valued Client,</p>
              <div style="color: #444444; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
                ${previewContent.replace(/\n/g, '<br>')}
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">REPORT INFORMATION</h3>
                <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Report ID:</strong> RPT-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.random().toString(36).substr(2,6).toUpperCase()}</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Report Type:</strong> Business Intelligence Dashboard</p>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">4Sale Technologies</p>
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">Advanced Business Intelligence & Analytics Solutions</p>
              <p style="margin: 0; color: #999999; font-size: 12px;">© ${new Date().getFullYear()} 4Sale Technologies. All rights reserved.</p>
            </div>
          </div>
        `;
      case 'minimal':
        return `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="padding: 50px 40px; border-bottom: 1px solid #e1e5e9;">
              <h1 style="color: #2d3748; margin: 0; font-size: 32px; font-weight: 300;">4SALE</h1>
              <p style="color: #718096; margin: 10px 0 0 0; font-size: 16px; font-weight: 300;">Analytics Platform</p>
            </div>
            <div style="padding: 50px 40px;">
              <h2 style="color: #2d3748; margin: 0 0 30px 0; font-size: 24px; font-weight: 400;">${templateVariables.report_name || 'Your Report'}</h2>
              <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px; line-height: 1.7;">Dear Client,</p>
              <div style="color: #2d3748; font-size: 16px; line-height: 1.8; margin-bottom: 40px;">
                ${previewContent.replace(/\n/g, '<br>')}
              </div>
              <div style="border: 1px solid #e2e8f0; padding: 25px; border-radius: 6px;">
                <p style="margin: 8px 0; color: #4a5568; font-size: 14px;"><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 8px 0; color: #4a5568; font-size: 14px;"><strong>Type:</strong> Business Analytics Report</p>
              </div>
            </div>
            <div style="padding: 30px 40px; text-align: center; color: #a0aec0; font-size: 14px;">
              <p style="margin: 0;">4Sale Technologies © ${new Date().getFullYear()}</p>
            </div>
          </div>
        `;
      case 'dashboard':
        return `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(90deg, #1a202c 0%, #2d3748 100%); padding: 25px; color: white;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <h1 style="margin: 0; font-size: 24px; font-weight: bold;">4SALE ANALYTICS</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">Real-time Business Intelligence</p>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
                  <div style="font-size: 12px; opacity: 0.7;">REPORT STATUS</div>
                  <div style="font-size: 16px; font-weight: bold; color: #68d391;">ACTIVE</div>
                </div>
              </div>
            </div>
            <div style="padding: 35px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 10px 0; font-size: 20px;">${templateVariables.report_name || 'Dashboard Report'}</h2>
                <p style="margin: 0; opacity: 0.9; font-size: 14px;">Generated ${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString()}</p>
              </div>
              <p style="color: #2d3748; margin: 0 0 25px 0; font-size: 16px;">Dear Analytics User,</p>
              <div style="color: #4a5568; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">
                ${previewContent.replace(/\n/g, '<br>')}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <div style="color: #667eea; font-size: 14px; font-weight: bold;">REPORT TYPE</div>
                  <div style="color: #2d3748; font-size: 16px; margin-top: 5px;">Business Intelligence</div>
                </div>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <div style="color: #667eea; font-size: 14px; font-weight: bold;">FREQUENCY</div>
                  <div style="color: #2d3748; font-size: 16px; margin-top: 5px;">Scheduled</div>
                </div>
              </div>
            </div>
            <div style="background: #1a202c; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 14px;">4Sale Technologies</p>
              <p style="margin: 0; opacity: 0.7; font-size: 12px;">© ${new Date().getFullYear()} All rights reserved</p>
            </div>
          </div>
        `;
      default:
        return '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Choose Email Template</Label>
            <p className="text-sm text-gray-600 mb-3">Select a professional template design</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {emailTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedTemplate === template.id 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedTemplate === template.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Content Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject" className="text-base font-semibold">Email Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="content" className="text-base font-semibold">Email Content</Label>
            <p className="text-sm text-gray-600 mb-2">Use {`{variable_name}`} for dynamic content</p>
            <Textarea
              id="content"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Enter your email content here. Use {report_name}, {current_date}, {recipient_name} for dynamic content."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Template Variables */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Template Variables</Label>
            <p className="text-sm text-gray-600">Customize dynamic content in your email</p>
          </div>
          <div className="space-y-3">
            {emailTemplates
              .find(t => t.id === selectedTemplate)
              ?.variables.slice(0, 6).map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label className="text-sm font-medium">{variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs font-mono bg-gray-50">
                      {`{${variable}}`}
                    </Badge>
                    <Input
                      value={templateVariables[variable] || ''}
                      onChange={(e) => updateVariable(variable, e.target.value)}
                      placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Live Email Preview
          </Label>
          <p className="text-sm text-gray-600">See exactly how your email will appear</p>
        </div>
        
        <Card className="border-2">
          <CardContent className="p-0">
            <div className="bg-gray-100 p-4 border-b">
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>From:</strong> ahmed.hawary@4sale.tech</div>
                <div><strong>Subject:</strong> {subject || 'No subject'}</div>
              </div>
            </div>
            
            <div className="p-4 bg-white">
              <div 
                className="border rounded-lg overflow-hidden"
                style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%', height: 'auto' }}
                dangerouslySetInnerHTML={{ 
                  __html: getTemplateHTML() || '<div class="p-8 text-center text-gray-500">Select template and add content to see preview</div>' 
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4" />
              Template Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Template:</span>
              <span className="font-medium">{emailTemplates.find(t => t.id === selectedTemplate)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Variables:</span>
              <span className="font-medium">{emailTemplates.find(t => t.id === selectedTemplate)?.variables.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Content Length:</span>
              <span className="font-medium">{customContent.length} chars</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}