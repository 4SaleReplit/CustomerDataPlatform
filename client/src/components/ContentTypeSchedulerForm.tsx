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
  title: string;
  description?: string;
  lastRefreshed?: string;
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
  isLoading = false,
  mode,
  title
}: ContentTypeSchedulerFormProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customVariables, setCustomVariables] = useState<any[]>([]);
  const { toast } = useToast();

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                            <div className="font-medium">{template.title}</div>
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

          {/* Email Template */}
          <Card>
            <CardHeader>
              <CardTitle>Email Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder="Enter email subject"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={formData.emailTemplate?.customContent || ''}
                  onChange={(e) => onFormDataChange({
                    ...formData,
                    emailTemplate: {
                      ...formData.emailTemplate,
                      customContent: e.target.value
                    }
                  })}
                  placeholder="Enter email content..."
                  rows={4}
                />
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