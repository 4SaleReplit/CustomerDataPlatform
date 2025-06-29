import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, FileText, Calendar, Clock, Send, Users } from "lucide-react";
import { EmailTagInput } from "./EmailTagInput";
import { PDFSlideViewer } from "./PDFSlideViewer";

interface NewEmailSenderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  mode: 'one-time' | 'scheduled';
  title: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  bodyHtml: string;
  availablePlaceholders: string[];
}

interface Presentation {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string;
  previewImageUrl?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  pdfUrl?: string;
  previewImageUrl?: string;
}

export function NewEmailSenderForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode,
  title
}: NewEmailSenderFormProps) {
  const { toast } = useToast();
  
  // Form state
  const [contentType, setContentType] = useState<'report' | 'template'>('report');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [recipientList, setRecipientList] = useState<string[]>([]);
  const [ccList, setCcList] = useState<string[]>([]);
  const [bccList, setBccList] = useState<string[]>([]);
  const [reportName, setReportName] = useState('');
  
  // Scheduling state (only for scheduled mode)
  const [cronExpression, setCronExpression] = useState('');
  const [timezone, setTimezone] = useState('Africa/Cairo');
  const [frequency, setFrequency] = useState('daily');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // Monday
  
  // Preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [emailPreviewHtml, setEmailPreviewHtml] = useState('');

  // Fetch data from database
  const { data: presentations } = useQuery({
    queryKey: ['/api/presentations'],
    queryFn: () => apiRequest('/api/presentations')
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => apiRequest('/api/templates')
  });

  const { data: emailTemplates } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: () => apiRequest('/api/email-templates')
  });

  // Update PDF preview when content selection changes
  useEffect(() => {
    if (contentType === 'report' && selectedReportId) {
      const selectedReport = presentations?.find((p: Presentation) => p.id === selectedReportId);
      if (selectedReport?.pdfUrl) {
        setPdfPreviewUrl(selectedReport.pdfUrl);
      }
    } else if (contentType === 'template' && selectedTemplateId) {
      const selectedTemplate = templates?.find((t: Template) => t.id === selectedTemplateId);
      if (selectedTemplate?.pdfUrl) {
        setPdfPreviewUrl(selectedTemplate.pdfUrl);
      }
    }
  }, [contentType, selectedReportId, selectedTemplateId, presentations, templates]);

  // Update email preview when email template changes
  useEffect(() => {
    if (selectedEmailTemplateId) {
      const emailTemplate = emailTemplates?.find((et: EmailTemplate) => et.id === selectedEmailTemplateId);
      if (emailTemplate) {
        let html = emailTemplate.bodyHtml;
        
        // Replace placeholders with sample data
        const sampleData = {
          report_name: reportName || 'Sample Analytics Report',
          report_download_url: pdfPreviewUrl || '#download-report'
        };
        
        Object.entries(sampleData).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, value);
        });
        
        setEmailPreviewHtml(html);
        setEmailSubject(emailTemplate.subject);
      }
    }
  }, [selectedEmailTemplateId, reportName, pdfPreviewUrl, emailTemplates]);

  // Generate cron expression for scheduled emails
  useEffect(() => {
    if (mode === 'scheduled') {
      let cron = '';
      switch (frequency) {
        case 'daily':
          cron = `${minute} ${hour} * * *`;
          break;
        case 'weekly':
          cron = `${minute} ${hour} * * ${dayOfWeek}`;
          break;
        case 'monthly':
          cron = `${minute} ${hour} 1 * *`;
          break;
      }
      setCronExpression(cron);
    }
  }, [frequency, hour, minute, dayOfWeek, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (contentType === 'report' && !selectedReportId) {
      toast({
        title: "Validation Error",
        description: "Please select a report",
        variant: "destructive"
      });
      return;
    }
    
    if (contentType === 'template' && !selectedTemplateId) {
      toast({
        title: "Validation Error",
        description: "Please select a template",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedEmailTemplateId) {
      toast({
        title: "Validation Error",
        description: "Please select an email template",
        variant: "destructive"
      });
      return;
    }
    
    if (recipientList.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one recipient",
        variant: "destructive"
      });
      return;
    }

    const formData = {
      name: reportName || `${mode === 'one-time' ? 'One-time' : 'Scheduled'} Email - ${new Date().toLocaleDateString()}`,
      description: `${mode === 'one-time' ? 'One-time' : 'Scheduled'} email delivery`,
      contentType,
      presentationId: contentType === 'report' ? selectedReportId : '',
      templateId: contentType === 'template' ? selectedTemplateId : '',
      emailTemplate: {
        templateId: selectedEmailTemplateId,
        subject: emailSubject,
        customContent: '',
        templateVariables: {
          report_name: reportName || 'Analytics Report',
          pdf_download_url: pdfPreviewUrl,
          report_url: pdfPreviewUrl
        }
      },
      recipientList: recipientList,
      ccList: ccList,
      bccList: bccList,
      cronExpression: mode === 'scheduled' ? cronExpression : null,
      timezone: mode === 'scheduled' ? timezone : 'Africa/Cairo',
      isActive: true,
      sendOption: mode === 'one-time' ? 'now' : 'schedule',
      formatSettings: { format: "pdf", includeCharts: true }
    };

    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'one-time' ? 'Send an immediate email with report or template' : 'Schedule automated email delivery'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 overflow-y-auto px-1 pb-4">
          {/* Section One: Report Selection & Preview */}
          <Card className="flex-shrink-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Selection & Preview
              </CardTitle>
              <CardDescription>Choose what to include and preview the content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Content Selection */}
                <div className="space-y-4">
                  <div>
                    <Label>Content Type</Label>
                    <Select value={contentType} onValueChange={(value: 'report' | 'template') => setContentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="report">Existing Report</SelectItem>
                        <SelectItem value="template">Template Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {contentType === 'report' && (
                    <div>
                      <Label>Select Report</Label>
                      <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a report" />
                        </SelectTrigger>
                        <SelectContent>
                          {presentations?.map((presentation: Presentation) => (
                            <SelectItem key={presentation.id} value={presentation.id}>
                              {presentation.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {contentType === 'template' && (
                    <div>
                      <Label>Select Template</Label>
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates?.map((template: Template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Report Name</Label>
                    <Input
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name for email"
                    />
                  </div>
                </div>

                {/* Right: PDF Slide Preview */}
                <div className="space-y-2">
                  <Label>PDF Slide Preview</Label>
                  <PDFSlideViewer 
                    presentationId={contentType === 'report' ? selectedReportId : undefined}
                    templateId={contentType === 'template' ? selectedTemplateId : undefined}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Two: Email Template Selection & Final Preview */}
          <Card className="flex-shrink-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration & Preview
              </CardTitle>
              <CardDescription>Configure email settings and preview final result</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-96">
                {/* Left: Email Configuration */}
                <div className="space-y-4">
                  <div>
                    <Label>Email Template</Label>
                    <Select value={selectedEmailTemplateId} onValueChange={setSelectedEmailTemplateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose email template" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates?.map((template: EmailTemplate) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Email Subject</Label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>

                  <div>
                    <Label>Send To (Recipients)</Label>
                    <EmailTagInput
                      value={recipientList}
                      onChange={setRecipientList}
                      placeholder="Type email addresses and press comma or tab"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Type email addresses and press comma, tab, or enter to add them as tags</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CC Recipients (Optional)</Label>
                      <EmailTagInput
                        value={ccList}
                        onChange={setCcList}
                        placeholder="Type CC email addresses"
                      />
                      <p className="text-xs text-muted-foreground mt-1">CC recipients as tags</p>
                    </div>

                    <div>
                      <Label>BCC Recipients (Optional)</Label>
                      <EmailTagInput
                        value={bccList}
                        onChange={setBccList}
                        placeholder="Type BCC email addresses"
                      />
                      <p className="text-xs text-muted-foreground mt-1">BCC recipients as tags</p>
                    </div>
                  </div>

                  {mode === 'scheduled' && (
                    <div>
                      <Label>Schedule Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {mode === 'scheduled' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Hour</Label>
                        <Select value={hour} onValueChange={setHour}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Minute</Label>
                        <Select value={minute} onValueChange={setMinute}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['00', '15', '30', '45'].map(min => (
                              <SelectItem key={min} value={min}>:{min}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {frequency === 'weekly' && (
                        <div>
                          <Label>Day of Week</Label>
                          <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                              <SelectItem value="0">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label>Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Africa/Cairo">Cairo (GMT+2)</SelectItem>
                            <SelectItem value="Asia/Kuwait">Kuwait (GMT+3)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Gmail-Style Email Preview */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Gmail-Style Email Preview</Label>
                  <div className="border rounded-lg overflow-hidden h-96 bg-white">
                    {selectedEmailTemplateId ? (
                      <div className="h-full flex flex-col">
                        {/* Gmail Header Simulation */}
                        <div className="bg-gray-50 border-b p-3 flex-shrink-0">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Subject:</span>
                              <span>{emailSubject || 'Sample Subject Line'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">To:</span>
                              <span className="text-blue-600">recipient@example.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">From:</span>
                              <span className="text-gray-600">4Sale Analytics &lt;noreply@4sale.tech&gt;</span>
                            </div>
                          </div>
                        </div>
                        {/* Email Content */}
                        <div className="flex-1 overflow-auto">
                          {emailPreviewHtml ? (
                            <iframe
                              srcDoc={emailPreviewHtml}
                              className="w-full h-full border-0"
                              title="Gmail Email Preview"
                            />
                          ) : (
                            <div className="p-4 text-muted-foreground">
                              Loading email template content...
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select an email template to preview final email</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !selectedEmailTemplateId || !emailSubject || recipientList.length === 0}
              className="min-w-24"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'one-time' ? 'Sending...' : 'Scheduling...'}
                </div>
              ) : (
                mode === 'one-time' ? 'Send Email' : 'Schedule Email'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}