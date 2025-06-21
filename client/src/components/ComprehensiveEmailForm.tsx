import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Star, Archive, Tag } from "lucide-react";

interface ComprehensiveEmailFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formData: any;
  onFormDataChange: (data: any) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  title: string;
}

export function ComprehensiveEmailForm({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  isLoading = false,
  mode,
  title
}: ComprehensiveEmailFormProps) {
  const { toast } = useToast();
  const [previewHtml, setPreviewHtml] = useState('');

  // Fetch data for dropdowns
  const { data: presentations } = useQuery({
    queryKey: ['/api/presentations'],
    queryFn: () => apiRequest('/api/presentations')
  });

  const { data: emailTemplates } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: () => apiRequest('/api/email-templates')
  });

  // Debug logging
  useEffect(() => {
    console.log('Email templates loaded:', emailTemplates);
  }, [emailTemplates]);

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => apiRequest('/api/templates')
  });

  // Generate Gmail-style preview
  const generateGmailPreview = () => {
    const selectedEmailTemplate = emailTemplates?.find(t => t.id === formData.emailTemplate?.templateId);
    let html = selectedEmailTemplate?.html || getDefaultEmailTemplate();
    
    // Replace variables
    const variables = {
      report_name: formData.reportName || 'Sample Report',
      report_download_url: '#download-report'
    };
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });

    const subject = (formData.emailTemplate?.subject || 'Report Ready').replace(/{report_name}/g, variables.report_name);

    const gmailWrapper = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <!-- Gmail Header -->
        <div style="background: white; border-radius: 8px 8px 0 0; border: 1px solid #dadce0; padding: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 32px; height: 32px; background: #1a73e8; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 14px; font-weight: bold;">4S</span>
            </div>
            <div>
              <div style="font-weight: 500; color: #202124;">4Sale Analytics Team</div>
              <div style="font-size: 13px; color: #5f6368;">&lt;analytics@4sale.tech&gt;</div>
            </div>
          </div>
          
          <div style="margin-bottom: 8px;">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
              <span style="color: #5f6368; font-size: 13px;">to</span>
              <span style="color: #202124; font-size: 13px;">${formData.recipientList?.join(', ') || 'recipient@example.com'}</span>
            </div>
            ${formData.ccList?.length > 0 ? `
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <span style="color: #5f6368; font-size: 13px;">cc</span>
                <span style="color: #202124; font-size: 13px;">${formData.ccList.join(', ')}</span>
              </div>
            ` : ''}
            ${formData.bccList?.length > 0 ? `
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <span style="color: #5f6368; font-size: 13px;">bcc</span>
                <span style="color: #202124; font-size: 13px;">${formData.bccList.join(', ')}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Actions -->
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <div style="padding: 4px 8px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #5f6368; display: flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Important
            </div>
            <div style="padding: 4px 8px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #5f6368; display: flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 8V7l-3 2-3-2v1l3 2 3-2zm1-5H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 6c0 1.66-1.34 3-3 3S2 7.66 2 6s1.34-3 3-3 3 1.34 3 3zm0 2v6l-5-5 5-1z"/></svg>
              Reports
            </div>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 400; color: #202124; margin: 0 0 16px 0;">${subject}</h2>
        </div>
        
        <!-- Email Content -->
        <div style="background: white; border: 1px solid #dadce0; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
          ${html}
        </div>
      </div>
    `;

    setPreviewHtml(gmailWrapper);
  };

  const getDefaultEmailTemplate = () => {
    // Use first available email template from database, or return empty if none
    if (emailTemplates && emailTemplates.length > 0) {
      return emailTemplates[0].html || '';
    }
    return '';
  };

  useEffect(() => {
    if (isOpen) {
      generateGmailPreview();
    }
  }, [isOpen, formData, emailTemplates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Email name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.emailTemplate?.subject?.trim()) {
      toast({
        title: "Validation Error", 
        description: "Email subject is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.recipientList?.length) {
      toast({
        title: "Validation Error",
        description: "At least one recipient is required", 
        variant: "destructive"
      });
      return;
    }

    if (formData.contentType === 'report' && !formData.presentationId) {
      toast({
        title: "Validation Error",
        description: "Please select a report",
        variant: "destructive"
      });
      return;
    }

    if (formData.contentType === 'template' && !formData.templateId) {
      toast({
        title: "Validation Error",
        description: "Please select a template",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configure and preview your email before sending
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
            {/* Left Panel - Configuration */}
            <div className="space-y-4 overflow-y-auto pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Selection</CardTitle>
                  <CardDescription>Choose what to include in your email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Content Type</Label>
                    <RadioGroup
                      value={formData.contentType || 'report'}
                      onValueChange={(value) => onFormDataChange({
                        ...formData,
                        contentType: value,
                        presentationId: '',
                        templateId: ''
                      })}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="report" id="report" />
                        <Label htmlFor="report">Existing Report</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="template" id="template" />
                        <Label htmlFor="template">Template Report</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.contentType === 'report' && (
                    <div>
                      <Label htmlFor="presentation">Select Report</Label>
                      <Select
                        value={formData.presentationId || ''}
                        onValueChange={(value) => onFormDataChange({
                          ...formData,
                          presentationId: value,
                          reportName: presentations?.find(p => p.id === value)?.title || ''
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a report..." />
                        </SelectTrigger>
                        <SelectContent>
                          {presentations?.map((presentation) => (
                            <SelectItem key={presentation.id} value={presentation.id}>
                              {presentation.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Report Preview */}
                      {formData.presentationId && (
                        <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">
                              {presentations?.find(p => p.id === formData.presentationId)?.title || 'Selected Report'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {presentations?.find(p => p.id === formData.presentationId)?.description || 'Report description'}
                            </div>
                            {presentations?.find(p => p.id === formData.presentationId)?.previewImageUrl && (
                              <div className="mt-2">
                                <img 
                                  src={presentations?.find(p => p.id === formData.presentationId)?.previewImageUrl} 
                                  alt="Report preview"
                                  className="w-full max-w-48 rounded border"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.contentType === 'template' && (
                    <div>
                      <Label htmlFor="template">Select Template</Label>
                      <Select
                        value={formData.templateId || ''}
                        onValueChange={(value) => onFormDataChange({
                          ...formData,
                          templateId: value,
                          reportName: templates?.find(t => t.id === value)?.name || ''
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates?.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Template Preview */}
                      {formData.templateId && (
                        <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">
                              {templates?.find(t => t.id === formData.templateId)?.name || 'Selected Template'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {templates?.find(t => t.id === formData.templateId)?.description || 'Template description'}
                            </div>
                            {templates?.find(t => t.id === formData.templateId)?.slides && (
                              <div className="mt-2">
                                <div className="text-xs text-muted-foreground mb-1">
                                  {JSON.parse(templates?.find(t => t.id === formData.templateId)?.slides || '[]').length} slides
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                                  {JSON.parse(templates?.find(t => t.id === formData.templateId)?.slides || '[]').slice(0, 4).map((slide: any, index: number) => (
                                    <div key={index} className="flex-shrink-0 w-24 h-16 bg-gray-100 rounded border hover:border-blue-300 transition-colors">
                                      {slide.elements?.find((el: any) => el.type === 'image' && (el.content || el.uploadedImageId)) ? (
                                        <img 
                                          src={slide.elements.find((el: any) => el.type === 'image' && (el.content || el.uploadedImageId))?.content || `/api/images/${slide.elements.find((el: any) => el.type === 'image' && el.uploadedImageId)?.uploadedImageId}`}
                                          alt={`Slide ${index + 1}`}
                                          className="w-full h-full object-cover rounded"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500" style={{ display: slide.elements?.find((el: any) => el.type === 'image') ? 'none' : 'flex' }}>
                                        Slide {index + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Template</CardTitle>
                  <CardDescription>Choose how your email will look</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="emailTemplate">Email Template</Label>
                    <Select
                      value={formData.emailTemplate?.templateId || ''}
                      onValueChange={(value) => {
                        const selectedTemplate = emailTemplates?.find(t => t.id === value);
                        onFormDataChange({
                          ...formData,
                          emailTemplate: {
                            ...formData.emailTemplate,
                            templateId: value,
                            subject: selectedTemplate?.name || '',
                            customContent: selectedTemplate?.html || ''
                          }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose email template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates && emailTemplates.length > 0 ? (
                          emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-templates" disabled>
                            No email templates available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
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
                      placeholder="Weekly Report - {report_name}"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Preview Section */}
              {(formData.contentType === 'report' && formData.selectedReport) || 
               (formData.contentType === 'template' && formData.selectedTemplate) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Preview</CardTitle>
                    <CardDescription>
                      Preview of selected {formData.contentType === 'report' ? 'report' : 'template'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formData.contentType === 'report' ? (
                      <div className="space-y-2">
                        <div className="font-medium">
                          {presentations?.find(p => p.id === formData.selectedReport)?.title || 'Selected Report'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {presentations?.find(p => p.id === formData.selectedReport)?.description || 'Report description'}
                        </div>
                        {presentations?.find(p => p.id === formData.selectedReport)?.previewImageUrl && (
                          <div className="mt-2">
                            <img 
                              src={presentations?.find(p => p.id === formData.selectedReport)?.previewImageUrl} 
                              alt="Report preview"
                              className="w-full max-w-sm rounded border"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="font-medium">
                          {templates?.find(t => t.id === formData.selectedTemplate)?.name || 'Selected Template'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {templates?.find(t => t.id === formData.selectedTemplate)?.description || 'Template description'}
                        </div>
                        {templates?.find(t => t.id === formData.selectedTemplate)?.slides && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">
                              {JSON.parse(templates?.find(t => t.id === formData.selectedTemplate)?.slides || '[]').length} slides
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                              {JSON.parse(templates?.find(t => t.id === formData.selectedTemplate)?.slides || '[]').map((slide: any, index: number) => (
                                <div key={index} className="flex-shrink-0 w-32 h-20 bg-gray-50 rounded border hover:border-blue-300 transition-colors">
                                  {slide.elements?.find((el: any) => el.type === 'image' && (el.content || el.uploadedImageId)) ? (
                                    <img 
                                      src={slide.elements.find((el: any) => el.type === 'image' && (el.content || el.uploadedImageId))?.content || `/api/images/${slide.elements.find((el: any) => el.type === 'image' && el.uploadedImageId)?.uploadedImageId}`}
                                      alt={`Slide ${index + 1}`}
                                      className="w-full h-full object-cover rounded"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500" style={{ display: slide.elements?.find((el: any) => el.type === 'image') ? 'none' : 'flex' }}>
                                    Slide {index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recipients</CardTitle>
                  <CardDescription>Configure who will receive the email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Email Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        name: e.target.value
                      })}
                      placeholder="Weekly Analytics Report"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                    <Textarea
                      id="recipients"
                      value={formData.recipientList?.join(', ') || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        recipientList: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                      })}
                      placeholder="user1@example.com, user2@example.com"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cc">CC (optional)</Label>
                    <Input
                      id="cc"
                      value={formData.ccList?.join(', ') || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        ccList: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                      })}
                      placeholder="cc@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bcc">BCC (optional)</Label>
                    <Input
                      id="bcc"
                      value={formData.bccList?.join(', ') || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        bccList: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                      })}
                      placeholder="bcc@example.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Gmail Preview */}
            <div className="flex flex-col h-full">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Gmail Preview
                  </CardTitle>
                  <CardDescription>
                    How your email will appear in Gmail inbox
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <div className="border rounded-lg overflow-hidden bg-white h-full">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full border-0"
                      title="Gmail Email Preview"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}