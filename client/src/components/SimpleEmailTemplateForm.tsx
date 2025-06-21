import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface SimpleEmailTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formData: any;
  onFormDataChange: (data: any) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  title: string;
}

export function SimpleEmailTemplateForm({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  isLoading = false,
  mode,
  title
}: SimpleEmailTemplateFormProps) {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.subject?.trim()) {
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
    
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new email template' : 'Edit email template'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        name: e.target.value
                      })}
                      placeholder="My Email Template"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        subject: e.target.value
                      })}
                      placeholder="Weekly Report - {report_name}"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reportName">Report Name</Label>
                    <Input
                      id="reportName"
                      value={formData.reportName || ''}
                      onChange={(e) => onFormDataChange({
                        ...formData,
                        reportName: e.target.value
                      })}
                      placeholder="Analytics Dashboard"
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

            {/* Right Panel - Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <div className="text-sm">
                      <strong>To:</strong> {formData.recipientList?.join(', ') || 'No recipients'}
                    </div>
                    {formData.ccList?.length > 0 && (
                      <div className="text-sm">
                        <strong>CC:</strong> {formData.ccList.join(', ')}
                      </div>
                    )}
                    {formData.bccList?.length > 0 && (
                      <div className="text-sm">
                        <strong>BCC:</strong> {formData.bccList.join(', ')}
                      </div>
                    )}
                    <div className="text-sm">
                      <strong>Subject:</strong> {(formData.subject || 'Email Subject').replace(/{report_name}/g, formData.reportName || 'Analytics Report')}
                    </div>
                    <hr />
                    <div className="bg-white p-4 rounded border">
                      <h3 className="text-lg font-semibold mb-3">📊 {formData.reportName || 'Analytics Report'}</h3>
                      <p className="text-gray-600 mb-4">
                        Your report has been generated successfully and is ready for review.
                      </p>
                      <div className="bg-blue-50 p-3 rounded mb-4">
                        <p className="text-blue-800 text-sm">
                          This automated report contains the latest data from your analytics dashboard.
                        </p>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Thank you for using our analytics platform.
                      </p>
                      <div className="text-sm text-gray-500 border-t pt-3">
                        <p>Best regards,<br /><strong>4Sale Analytics Team</strong></p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Update Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}