import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Mail, Send, FileText, Database, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  title?: string;
  description?: string;
  lastRefreshed?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  templateType: string;
  availablePlaceholders?: string[];
}

interface Presentation {
  id: string;
  title: string;
  description?: string;
}

interface ContentTypeSchedulerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formData: any;
  onFormDataChange: (data: any) => void;
  presentations: Presentation[];
  templates: Template[];
  emailTemplates?: EmailTemplate[];
  isLoading?: boolean;
  mode: 'create' | 'edit';
  title: string;
}

export function ContentTypeSchedulerForm({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  presentations = [],
  templates = [],
  emailTemplates = [],
  isLoading = false,
  mode,
  title
}: ContentTypeSchedulerFormProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customVariables, setCustomVariables] = useState<any[]>([]);
  const { toast } = useToast();

  // Helper function to get selected content name
  const getSelectedContentName = () => {
    if (formData.contentType === 'template' && formData.templateId) {
      const selectedTemplate = templates.find(t => t.id === formData.templateId);
      return selectedTemplate?.name || selectedTemplate?.title || 'Selected Template';
    }
    if (formData.contentType === 'report' && formData.presentationId) {
      const selectedPresentation = presentations.find(p => p.id === formData.presentationId);
      return selectedPresentation?.title || 'Selected Report';
    }
    return 'Your Report';
  };

  // Helper function to process email template variables
  const processEmailTemplate = (template: string, variables: Record<string, string>) => {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, value);
    });
    return processed;
  };

  // Helper function to generate HTML preview
  const generateEmailPreviewHTML = (content: string, variables: Record<string, string>) => {
    let processedContent = processEmailTemplate(content, variables);
    
    // Convert line breaks to HTML
    processedContent = processedContent.replace(/\n/g, '<br>');
    
    // Convert URLs to clickable links
    processedContent = processedContent.replace(
      /https?:\/\/[^\s]+/g,
      '<a href="$&" class="text-blue-600 underline" target="_blank">$&</a>'
    );
    
    // Style download links specially
    processedContent = processedContent.replace(
      /#download-link/g,
      '<a href="#" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">📄 Download PDF Report</a>'
    );
    
    // Style dashboard links
    processedContent = processedContent.replace(
      /#dashboard-link/g,
      '<a href="#" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">📊 View Dashboard</a>'
    );

    // If no content, show default template
    if (!processedContent.trim()) {
      return `
        <div class="space-y-4">
          <p>Dear <strong>${variables.recipient_name}</strong>,</p>
          <p>Your <strong>${variables.report_name}</strong> report for <strong>${variables.date}</strong> is ready.</p>
          <div class="my-4">
            <a href="${variables.pdf_download_url}" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">📄 Download PDF Report</a>
          </div>
          <p>You can also <a href="${variables.dashboard_url}" class="text-blue-600 underline">view the dashboard online</a>.</p>
          <p>Best regards,<br><strong>${variables.company_name}</strong></p>
        </div>
      `;
    }
    
    return `<div class="space-y-3">${processedContent}</div>`;
  };

  // Helper function to generate email template preview with HTML template
  const generateTemplateEmailPreview = (emailTemplate: EmailTemplate | null, variables: Record<string, string>) => {
    if (!emailTemplate) {
      return generateEmailPreviewHTML('', variables);
    }

    let processedHtml = processEmailTemplate(emailTemplate.bodyHtml, variables);
    
    // Apply variable substitution to the HTML template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedHtml = processedHtml.replace(regex, value);
    });

    return processedHtml;
  };

  // Initialize form data
  useEffect(() => {
    if (!formData.contentType) {
      onFormDataChange({
        ...formData,
        contentType: 'report'
      });
    }
  }, []);

  const handleContentTypeChange = (value: 'template' | 'report') => {
    onFormDataChange({
      ...formData,
      contentType: value,
      presentationId: value === 'report' ? formData.presentationId : '',
      templateId: value === 'template' ? formData.templateId : ''
    });
  };

  const handleRefreshTemplate = async () => {
    if (!formData.templateId) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/templates/${formData.templateId}/refresh`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Template refreshed",
          description: "Template data has been updated with latest information.",
        });
      } else {
        throw new Error('Failed to refresh template');
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh template data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a report name.",
        variant: "destructive",
      });
      return;
    }

    if (formData.contentType === 'template' && !formData.templateId) {
      toast({
        title: "Validation Error",
        description: "Please select a template.",
        variant: "destructive",
      });
      return;
    }

    if (formData.contentType === 'report' && !formData.presentationId) {
      toast({
        title: "Validation Error",
        description: "Please select a report.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.recipientList?.length) {
      toast({
        title: "Validation Error",
        description: "Please add at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      ...formData,
      customVariables
    });
  };

  const handleRecipientChange = (value: string) => {
    const emails = value.split(',').map(email => email.trim()).filter(email => email);
    onFormDataChange({
      ...formData,
      recipientList: emails
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Configure your email delivery settings and content selection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => onFormDataChange({
                  ...formData,
                  name: e.target.value
                })}
                placeholder="Enter report name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => onFormDataChange({
                  ...formData,
                  description: e.target.value
                })}
                placeholder="Brief description"
              />
            </div>
          </div>

          {/* Content Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Content Type Selection
              </CardTitle>
              <CardDescription>
                Choose whether to send a template (with auto-refresh) or a specific report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select 
                  value={formData.contentType || 'report'} 
                  onValueChange={handleContentTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="report">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <div>
                          <div>Specific Report</div>
                          <div className="text-xs text-muted-foreground">Send existing report as-is</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="template">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <div>
                          <div>Template (Auto-refresh)</div>
                          <div className="text-xs text-muted-foreground">Refresh data before sending</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Selection */}
              {formData.contentType === 'template' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Select Template</Label>
                    {formData.templateId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshTemplate}
                        disabled={isRefreshing}
                        className="flex items-center gap-2"
                      >
                        {isRefreshing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Refresh Now
                      </Button>
                    )}
                  </div>
                  <Select 
                    value={formData.templateId || ''} 
                    onValueChange={(value) => onFormDataChange({
                      ...formData,
                      templateId: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template to send" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col items-start">
                            <div className="font-medium">{template.name || template.title}</div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground">{template.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.templateId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-3 w-3" />
                      Template will be refreshed automatically before sending
                    </div>
                  )}
                </div>
              )}

              {/* Report Selection */}
              {formData.contentType === 'report' && (
                <div className="space-y-2">
                  <Label>Select Report</Label>
                  <Select 
                    value={formData.presentationId || ''} 
                    onValueChange={(value) => onFormDataChange({
                      ...formData,
                      presentationId: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a report to send" />
                    </SelectTrigger>
                    <SelectContent>
                      {presentations.map((presentation) => (
                        <SelectItem key={presentation.id} value={presentation.id}>
                          <div className="flex flex-col items-start">
                            <div className="font-medium">{presentation.title}</div>
                            {presentation.description && (
                              <div className="text-xs text-muted-foreground">{presentation.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                <Textarea
                  id="recipients"
                  value={formData.recipientList?.join(', ') || ''}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  placeholder="user1@example.com, user2@example.com"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cc">CC (optional)</Label>
                  <Textarea
                    id="cc"
                    value={formData.ccList?.join(', ') || ''}
                    onChange={(e) => {
                      const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                      onFormDataChange({
                        ...formData,
                        ccList: emails
                      });
                    }}
                    placeholder="cc1@example.com, cc2@example.com"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bcc">BCC (optional)</Label>
                  <Textarea
                    id="bcc"
                    value={formData.bccList?.join(', ') || ''}
                    onChange={(e) => {
                      const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                      onFormDataChange({
                        ...formData,
                        bccList: emails
                      });
                    }}
                    placeholder="bcc1@example.com, bcc2@example.com"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Template & Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Template & Live Preview
              </CardTitle>
              <CardDescription>
                Select an email template and configure the subject with date parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Template Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Template</Label>
                    <Select
                      value={formData.emailTemplate?.templateId || ''}
                      onValueChange={(value) => onFormDataChange({
                        ...formData,
                        emailTemplate: {
                          ...formData.emailTemplate,
                          templateId: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an email template" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates && emailTemplates.length > 0 ? (
                          emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <div className="font-medium">{template.name || 'Untitled Template'}</div>
                                <div className="text-xs text-muted-foreground">{template.description || 'No description'}</div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-templates" disabled>
                            No templates available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={formData.emailTemplate?.subject || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        emailTemplate: {
                          ...formData.emailTemplate,
                          subject: e.target.value
                        }
                      })}
                      placeholder="e.g., Analytics Report - {report_name}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {`{report_name}`} for dynamic report names
                    </p>
                  </div>

                  {/* Report Name Configuration */}
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Report Configuration</Label>
                    <div>
                      <Label className="text-xs">{`{report_name}`}</Label>
                      <Input
                        placeholder="Weekly Analytics Dashboard"
                        value={formData.emailTemplate?.reportName || ''}
                        onChange={(e) => onFormDataChange({
                          ...formData,
                          emailTemplate: {
                            ...formData.emailTemplate,
                            reportName: e.target.value
                          }
                        })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Template Sections Configuration */}
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Template Sections</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="showHeader"
                          checked={formData.emailTemplate?.sections?.showHeader !== false}
                          onChange={(e) => onFormDataChange({
                            ...formData,
                            emailTemplate: {
                              ...formData.emailTemplate,
                              sections: {
                                ...formData.emailTemplate?.sections,
                                showHeader: e.target.checked
                              }
                            }
                          })}
                          className="rounded"
                        />
                        <Label htmlFor="showHeader" className="text-xs">Header Section</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="showSummary"
                          checked={formData.emailTemplate?.sections?.showSummary !== false}
                          onChange={(e) => onFormDataChange({
                            ...formData,
                            emailTemplate: {
                              ...formData.emailTemplate,
                              sections: {
                                ...formData.emailTemplate?.sections,
                                showSummary: e.target.checked
                              }
                            }
                          })}
                          className="rounded"
                        />
                        <Label htmlFor="showSummary" className="text-xs">Summary Section</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="showMetrics"
                          checked={formData.emailTemplate?.sections?.showMetrics !== false}
                          onChange={(e) => onFormDataChange({
                            ...formData,
                            emailTemplate: {
                              ...formData.emailTemplate,
                              sections: {
                                ...formData.emailTemplate?.sections,
                                showMetrics: e.target.checked
                              }
                            }
                          })}
                          className="rounded"
                        />
                        <Label htmlFor="showMetrics" className="text-xs">Metrics Section</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="showFooter"
                          checked={formData.emailTemplate?.sections?.showFooter !== false}
                          onChange={(e) => onFormDataChange({
                            ...formData,
                            emailTemplate: {
                              ...formData.emailTemplate,
                              sections: {
                                ...formData.emailTemplate?.sections,
                                showFooter: e.target.checked
                              }
                            }
                          })}
                          className="rounded"
                        />
                        <Label htmlFor="showFooter" className="text-xs">Footer Section</Label>
                      </div>
                    </div>
                  </div>

                  {/* Recipients Configuration */}
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Email Recipients</Label>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">To (Recipients)</Label>
                        <Input
                          placeholder="user1@example.com, user2@example.com"
                          value={formData.emailTemplate?.recipients || ''}
                          onChange={(e) => onFormDataChange({
                            ...formData,
                            emailTemplate: {
                              ...formData.emailTemplate,
                              recipients: e.target.value
                            }
                          })}
                          className="text-xs"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">CC (Carbon Copy)</Label>
                        <Input
                          placeholder="manager@example.com, team@example.com"
                          value={formData.emailTemplate?.cc || ''}
                          onChange={(e) => onFormDataChange({
                            ...formData,
                            emailTemplate: {
                              ...formData.emailTemplate,
                              cc: e.target.value
                            }
                          })}
                          className="text-xs"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">BCC (Blind Carbon Copy)</Label>
                        <Input
                          placeholder="admin@example.com"
                          value={formData.emailTemplate?.bcc || ''}
                          onChange={(e) => onFormDataChange({
                            ...formData,
                            emailTemplate: {
                              ...formData.emailTemplate,
                              bcc: e.target.value
                            }
                          })}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Fully Rendered Email Preview */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Email Preview</Label>
                  <div className="border rounded-lg bg-gray-50 overflow-hidden">
                    {/* Email Headers */}
                    <div className="bg-white border-b p-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">From: 4Sale Analytics &lt;reports@4sale.tech&gt;</span>
                        <span className="text-gray-500">{new Date().toLocaleDateString()}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        To: {formData.emailTemplate?.recipients || 'recipient@example.com'}
                      </div>
                      
                      {formData.emailTemplate?.cc && (
                        <div className="text-sm text-gray-600">
                          CC: {formData.emailTemplate.cc}
                        </div>
                      )}
                      
                      {formData.emailTemplate?.bcc && (
                        <div className="text-sm text-gray-600">
                          BCC: {formData.emailTemplate.bcc}
                        </div>
                      )}
                      
                      <div className="font-medium text-gray-900">
                        Subject: {(() => {
                          const subject = formData.emailTemplate?.subject || 'Email Subject';
                          const reportName = formData.emailTemplate?.reportName || 'Analytics Report';
                          return subject.replace(/{report_name}/g, reportName);
                        })()}
                      </div>
                    </div>
                    
                    {/* Fully Rendered Email Body */}
                    <div className="bg-white">
                      <iframe
                        className="w-full h-[450px] border-0"
                        style={{ backgroundColor: 'white' }}
                        srcDoc={(() => {
                          try {
                            if (!emailTemplates || emailTemplates.length === 0) {
                              return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="padding: 40px; font-family: Arial, sans-serif; text-align: center;">
<p>No email templates available. Please create templates first.</p>
</body></html>`;
                            }

                            const selectedTemplate = emailTemplates.find(t => t.id === formData.emailTemplate?.templateId);
                            const reportName = formData.emailTemplate?.reportName || 'Analytics Report';
                            const sections = formData.emailTemplate?.sections || {
                              showHeader: true,
                              showSummary: true,
                              showMetrics: true,
                              showFooter: true
                            };
                            
                            if (selectedTemplate && selectedTemplate.bodyHtml) {
                              let htmlContent = selectedTemplate.bodyHtml;
                              try {
                                htmlContent = htmlContent.replace(/{report_name}/g, reportName);
                              } catch (replaceError) {
                                console.warn('Template replacement error:', replaceError);
                                htmlContent = selectedTemplate.bodyHtml;
                              }
                              
                              return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            ${!sections.showHeader ? 'display: none;' : ''}
        }
        .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .email-body {
            padding: 30px;
        }
        .summary-section {
            ${!sections.showSummary ? 'display: none;' : ''}
        }
        .metrics-section {
            ${!sections.showMetrics ? 'display: none;' : ''}
        }
        .email-footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
            ${!sections.showFooter ? 'display: none;' : ''}
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 0;
        }
        .highlight {
            background: #e3f2fd;
            padding: 15px;
            border-left: 4px solid #2196f3;
            margin: 15px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 10px 0;
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${sections.showHeader ? `
        <div class="email-header">
            <h1>📊 ${reportName}</h1>
        </div>
        ` : ''}
        <div class="email-body">
            ${sections.showSummary ? `
            <div class="summary-section">
                <h2>Executive Summary</h2>
                <div class="highlight">
                    <p>Your ${reportName} has been generated successfully. This automated report contains key insights and metrics from your latest data analysis.</p>
                </div>
            </div>
            ` : ''}
            
            ${sections.showMetrics ? `
            <div class="metrics-section">
                <h3>Report Metrics</h3>
                <p style="color: #666; font-size: 14px;">
                    Report generated successfully with latest data from your analytics dashboard.
                </p>
            </div>
            ` : ''}
            
            <div style="margin: 20px 0;">
                ${htmlContent}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="btn">View Full Report</a>
            </div>
        </div>
        ${sections.showFooter ? `
        <div class="email-footer">
            <p>Best regards,<br><strong>4Sale Analytics Team</strong></p>
            <p style="font-size: 12px; color: #999;">
                This is an automated report. Please do not reply to this email.
            </p>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
                            } else {
                              return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview</title>
    <style>
        body {
            margin: 0;
            padding: 40px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
        }
        .placeholder {
            text-align: center;
            color: #666;
            font-size: 18px;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="placeholder">
        <p>📧 Select an email template to see the preview</p>
        <p style="font-size: 14px; color: #999; margin-top: 10px;">Configure sections and report name to customize the layout</p>
    </div>
</body>
</html>`;
                            }
                          } catch (error) {
                            console.error('Email preview error:', error);
                            return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="padding: 40px; font-family: Arial, sans-serif; text-align: center;">
<p>Error loading email preview. Please try again.</p>
</body></html>`;
                          }
                        })()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {mode === 'create' ? 'Create & Send' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}