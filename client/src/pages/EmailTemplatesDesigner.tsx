import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Code, Palette, Type, Mail, Save, Plus, Edit, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  html: string;
  variables: string[];
  isSystem?: boolean;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'professional',
    name: 'Professional Report',
    description: 'Clean, corporate design suitable for business reports',
    preview: '',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{report_title}}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .content h2 { color: #333; margin-bottom: 20px; }
    .content p { color: #666; line-height: 1.6; margin-bottom: 15px; }
    .report-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .report-info h3 { margin: 0 0 10px 0; color: #495057; }
    .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer p { margin: 0; color: #6c757d; font-size: 14px; }
    .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{report_title}}</h1>
      <p>Generated on {{generation_date}} • {{generation_time}}</p>
    </div>
    <div class="content">
      <h2>Dear {{recipient_name}},</h2>
      <p>{{email_content}}</p>
      
      <div class="report-info">
        <h3>Report Details</h3>
        <p><strong>Report Name:</strong> {{report_name}}</p>
        <p><strong>Period:</strong> {{report_period}}</p>
        <p><strong>Generated:</strong> {{generation_date}} at {{generation_time}}</p>
        <p><strong>Next Report:</strong> {{next_execution}}</p>
      </div>
      
      <p>The detailed report is attached as a PDF file. If you have any questions about this report, please don't hesitate to contact our analytics team.</p>
      
      <a href="{{dashboard_url}}" class="button">View Dashboard</a>
    </div>
    <div class="footer">
      <p>This is an automated report from 4Sale Analytics Platform</p>
      <p>© 2025 4Sale. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url'],
    isSystem: true
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple, minimalist design focused on content',
    preview: '',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{report_title}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #ffffff; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
    .header p { margin: 5px 0 0 0; color: #7f8c8d; }
    .content p { line-height: 1.7; margin-bottom: 15px; }
    .report-summary { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #7f8c8d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{report_title}}</h1>
      <p>{{generation_date}} • {{generation_time}}</p>
    </div>
    <div class="content">
      <p>Hello {{recipient_name}},</p>
      <p>{{email_content}}</p>
      
      <div class="report-summary">
        <strong>{{report_name}}</strong><br>
        Period: {{report_period}}<br>
        Next report: {{next_execution}}
      </div>
      
      <p>Please find the detailed report attached.</p>
      <p>Best regards,<br>4Sale Analytics Team</p>
    </div>
    <div class="footer">
      <p>4Sale Analytics Platform • Automated Report Delivery</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution'],
    isSystem: true
  },
  {
    id: 'dashboard',
    name: 'Dashboard Style',
    description: 'Modern dashboard-inspired design with metrics highlights',
    preview: '',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{report_title}}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
    .header .subtitle { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
    .metrics { display: flex; justify-content: space-between; padding: 0 30px; margin-top: -20px; }
    .metric-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; margin: 0 5px; }
    .metric-value { font-size: 24px; font-weight: 700; color: #1f2937; margin: 0; }
    .metric-label { font-size: 12px; color: #6b7280; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 40px 30px 30px; }
    .content p { color: #4b5563; line-height: 1.6; margin-bottom: 16px; }
    .report-details { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .detail-label { color: #6b7280; font-weight: 500; }
    .detail-value { color: #1f2937; font-weight: 600; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 25px 30px; text-align: center; }
    .footer p { margin: 0; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{report_title}}</h1>
      <p class="subtitle">Analytics Report • {{generation_date}}</p>
    </div>
    
    <div class="metrics">
      <div class="metric-card">
        <p class="metric-value">{{metric_1_value}}</p>
        <p class="metric-label">{{metric_1_label}}</p>
      </div>
      <div class="metric-card">
        <p class="metric-value">{{metric_2_value}}</p>
        <p class="metric-label">{{metric_2_label}}</p>
      </div>
      <div class="metric-card">
        <p class="metric-value">{{metric_3_value}}</p>
        <p class="metric-label">{{metric_3_label}}</p>
      </div>
    </div>
    
    <div class="content">
      <p>Hi {{recipient_name}},</p>
      <p>{{email_content}}</p>
      
      <div class="report-details">
        <div class="detail-row">
          <span class="detail-label">Report Name</span>
          <span class="detail-value">{{report_name}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Report Period</span>
          <span class="detail-value">{{report_period}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Generated</span>
          <span class="detail-value">{{generation_date}} {{generation_time}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Next Report</span>
          <span class="detail-value">{{next_execution}}</span>
        </div>
      </div>
      
      <p>The complete report with detailed analytics is attached as a PDF file.</p>
      
      <a href="{{dashboard_url}}" class="cta-button">Open Dashboard</a>
    </div>
    
    <div class="footer">
      <p>Powered by 4Sale Analytics Platform</p>
      <p>© 2025 4Sale. This report was generated automatically.</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url', 'metric_1_value', 'metric_1_label', 'metric_2_value', 'metric_2_label', 'metric_3_value', 'metric_3_label'],
    isSystem: true
  }
];

export function EmailTemplatesDesigner() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(templates[0]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    if (selectedTemplate) {
      generatePreview(selectedTemplate);
    }
  }, [selectedTemplate, previewVariables]);

  const generatePreview = (template: EmailTemplate) => {
    let html = template.html;
    
    // Default preview variables
    const defaultVars = {
      report_title: 'Weekly Analytics Report',
      recipient_name: 'John Doe',
      email_content: 'This is a preview of your email template. Your custom content will appear here.',
      report_name: 'Sales Dashboard Report',
      report_period: 'Last 7 days',
      generation_date: new Date().toLocaleDateString(),
      generation_time: new Date().toLocaleTimeString(),
      next_execution: 'Next Monday at 9:00 AM',
      dashboard_url: '#',
      metric_1_value: '12.5K',
      metric_1_label: 'Total Users',
      metric_2_value: '85%',
      metric_2_label: 'Engagement',
      metric_3_value: '$45.2K',
      metric_3_label: 'Revenue'
    };

    const vars = { ...defaultVars, ...previewVariables };
    
    template.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      html = html.replace(regex, vars[variable] || `[${variable}]`);
    });
    
    setPreviewHtml(html);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    
    setTemplates(prev => 
      prev.map(t => t.id === editingTemplate.id ? editingTemplate : t)
    );
    
    if (selectedTemplate?.id === editingTemplate.id) {
      setSelectedTemplate(editingTemplate);
    }
    
    setEditingTemplate(null);
    toast({ title: "Template saved successfully" });
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (Copy)`,
      isSystem: false
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    toast({ title: "Template duplicated successfully" });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (templates.find(t => t.id === templateId)?.isSystem) {
      toast({ title: "Cannot delete system templates", variant: "destructive" });
      return;
    }
    
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(templates[0]);
    }
    toast({ title: "Template deleted successfully" });
  };

  const updatePreviewVariable = (variable: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  return (
    <div className="w-full max-w-none p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates Designer</h1>
          <p className="text-muted-foreground">
            Create and customize professional email templates for your scheduled reports
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Template List */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Templates</CardTitle>
              <CardDescription>
                Select a template to preview and edit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-transparent bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      {template.isSystem && (
                        <Badge variant="secondary" className="mt-1">
                          System
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(template);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {!template.isSystem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview and Variables */}
        <div className="flex-1 min-w-0">
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Preview Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Preview Variables
                  </CardTitle>
                  <CardDescription>
                    Customize the preview by editing these variables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTemplate.variables.slice(0, 6).map((variable) => (
                      <div key={variable}>
                        <Label htmlFor={variable} className="text-sm">
                          {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        <Input
                          id={variable}
                          value={previewVariables[variable] || ''}
                          onChange={(e) => updatePreviewVariable(variable, e.target.value)}
                          placeholder={`Enter ${variable.replace(/_/g, ' ')}...`}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Template Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Template Preview - {selectedTemplate.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList>
                      <TabsTrigger value="preview">Visual Preview</TabsTrigger>
                      <TabsTrigger value="html">HTML Source</TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto flex justify-center">
                        <div 
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                          className="email-preview"
                          style={{
                            transform: 'scale(0.8)',
                            transformOrigin: 'top center',
                            maxWidth: '600px',
                            width: '600px'
                          }}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="html" className="mt-4">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                          <code>{previewHtml}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template - {editingTemplate.name}</DialogTitle>
              <DialogDescription>
                Modify the template name, description, and HTML content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? {...prev, name: e.target.value} : null)}
                    disabled={editingTemplate.isSystem}
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate(prev => prev ? {...prev, description: e.target.value} : null)}
                    disabled={editingTemplate.isSystem}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-html">HTML Content</Label>
                <Textarea
                  id="template-html"
                  value={editingTemplate.html}
                  onChange={(e) => setEditingTemplate(prev => prev ? {...prev, html: e.target.value} : null)}
                  rows={20}
                  className="font-mono text-sm"
                  disabled={editingTemplate.isSystem}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                {!editingTemplate.isSystem && (
                  <Button onClick={handleSaveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}