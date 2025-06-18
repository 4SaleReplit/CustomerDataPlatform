import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, Send, MoreHorizontal, Copy, Pause, Play, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  cronExpression: string | null;
  isActive: boolean;
  recipientList: string[];
  lastExecuted: string | null;
  nextExecution: string | null;
  successCount: number;
  errorCount: number;
  sentImmediately?: boolean;
  emailSubject: string;
}

interface EmailFormData {
  name: string;
  description: string;
  presentationId: string;
  subject: string;
  content: string;
  recipients: string;
  cronExpression: string;
  timezone: string;
  sendOption: 'now' | 'schedule';
}

export function EmailSender() {
  const [activeTab, setActiveTab] = useState<"scheduler" | "one-time">("scheduler");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EmailFormData>({
    name: '',
    description: '',
    presentationId: '',
    subject: '',
    content: '',
    recipients: '',
    cronExpression: '0 9 * * 1',
    timezone: 'Africa/Cairo',
    sendOption: 'schedule'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/scheduled-reports'],
    queryFn: () => apiRequest('/api/scheduled-reports')
  });

  const { data: presentations = [] } = useQuery({
    queryKey: ['/api/presentations'],
    queryFn: () => apiRequest('/api/presentations')
  });

  // Separate scheduled reports from one-time emails
  const scheduledReports = reports.filter((report: ScheduledReport) => 
    report.cronExpression && !report.sentImmediately
  );
  
  const oneTimeEmails = reports.filter((report: ScheduledReport) => 
    !report.cronExpression || report.sentImmediately
  );

  const toggleReportStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest(`/api/scheduled-reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
      toast({ title: "Report status updated successfully" });
    }
  });

  const duplicateReport = useMutation({
    mutationFn: (reportId: string) =>
      apiRequest(`/api/scheduled-reports/${reportId}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
      toast({ title: "Report duplicated successfully" });
    }
  });

  const deleteReport = useMutation({
    mutationFn: (reportId: string) =>
      apiRequest(`/api/scheduled-reports/${reportId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
      toast({ title: "Report deleted successfully" });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const recipientList = formData.recipients.split(',').map(email => email.trim()).filter(email => email);
      
      const requestData = {
        name: formData.name,
        description: formData.description,
        presentationId: formData.presentationId,
        cronExpression: formData.sendOption === 'now' ? null : formData.cronExpression,
        timezone: formData.timezone,
        recipientList,
        ccList: [],
        bccList: [],
        isActive: formData.sendOption === 'schedule',
        sendOption: formData.sendOption,
        emailTemplate: {
          subject: formData.subject,
          customContent: formData.content,
          templateId: 'professional'
        },
        formatSettings: {
          format: 'pdf',
          includeCharts: true
        },
        customVariables: []
      };

      await apiRequest('/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      toast({ 
        title: formData.sendOption === 'now' ? "Email sent successfully" : "Report scheduled successfully" 
      });
      
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        presentationId: '',
        subject: '',
        content: '',
        recipients: '',
        cronExpression: '0 9 * * 1',
        timezone: 'Africa/Cairo',
        sendOption: activeTab === 'one-time' ? 'now' : 'schedule'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: formData.sendOption === 'now' ? "Failed to send email" : "Failed to schedule report",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNextExecution = (nextExecution: string | null) => {
    if (!nextExecution) return "No schedule";
    return new Date(nextExecution).toLocaleString();
  };

  const getStatusBadge = (report: ScheduledReport) => {
    if (report.sentImmediately) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Sent</Badge>;
    }
    if (report.isActive) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Paused</Badge>;
  };

  const ReportCard = ({ report, showSchedule = true }: { report: ScheduledReport; showSchedule?: boolean }) => (
    <Card key={report.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50">
              {report.sentImmediately ? <Send className="w-4 h-4 text-blue-600" /> : <Calendar className="w-4 h-4 text-blue-600" />}
            </div>
            <div>
              <CardTitle className="text-lg">{report.name}</CardTitle>
              <CardDescription className="text-sm">{report.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(report)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => duplicateReport.mutate(report.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                {!report.sentImmediately && (
                  <DropdownMenuItem onClick={() => toggleReportStatus.mutate({ id: report.id, isActive: !report.isActive })}>
                    {report.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {report.isActive ? 'Pause' : 'Resume'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => deleteReport.mutate(report.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {report.recipientList.length} recipient{report.recipientList.length !== 1 ? 's' : ''}
            </div>
            {showSchedule && report.nextExecution && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatNextExecution(report.nextExecution)}
              </div>
            )}
          </div>
          
          {report.lastExecuted && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last executed:</span>
              <span>{new Date(report.lastExecuted).toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Success/Error:</span>
            <span className="text-green-600">{report.successCount} / <span className="text-red-600">{report.errorCount}</span></span>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-500">Subject:</span>
            <p className="text-gray-900 truncate">{report.emailSubject}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmailForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Report Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter report name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="presentation">Presentation</Label>
          <Select 
            value={formData.presentationId} 
            onValueChange={(value) => setFormData({ ...formData, presentationId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select presentation" />
            </SelectTrigger>
            <SelectContent>
              {presentations.map((presentation: any) => (
                <SelectItem key={presentation.id} value={presentation.id}>
                  {presentation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Enter email subject"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Email Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter email content"
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipients">Recipients</Label>
        <Textarea
          id="recipients"
          value={formData.recipients}
          onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
          placeholder="Enter email addresses separated by commas"
          rows={2}
          required
        />
      </div>

      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <Select 
              value={formData.cronExpression} 
              onValueChange={(value) => setFormData({ ...formData, cronExpression: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0 9 * * 1">Weekly (Monday 9 AM)</SelectItem>
                <SelectItem value="0 9 * * *">Daily (9 AM)</SelectItem>
                <SelectItem value="0 9 1 * *">Monthly (1st day, 9 AM)</SelectItem>
                <SelectItem value="0 9 * * 0">Weekly (Sunday 9 AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
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
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCreateDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : activeTab === 'one-time' ? "Send Now" : "Schedule Report"}
        </Button>
      </div>
    </form>
  );

  // Update sendOption when tab changes
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      sendOption: activeTab === 'one-time' ? 'now' : 'schedule'
    }));
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Sender</h1>
          <p className="text-gray-600 mt-1">Send scheduled reports and one-time emails</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Mail className="w-4 h-4 mr-2" />
              New Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {activeTab === 'one-time' ? 'Send One-Time Email' : 'Schedule Report'}
              </DialogTitle>
              <DialogDescription>
                {activeTab === 'one-time' 
                  ? 'Send an immediate email report'
                  : 'Configure your scheduled email report'
                }
              </DialogDescription>
            </DialogHeader>
            <EmailForm />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "scheduler" | "one-time")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Scheduler
          </TabsTrigger>
          <TabsTrigger value="one-time" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            One-Time Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduler" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Automated reports sent on a recurring schedule
              </CardDescription>
            </CardHeader>
          </Card>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : scheduledReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled reports</h3>
                <p className="text-gray-600 mb-4">Create your first scheduled report to automate email delivery</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Scheduled Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledReports.map((report) => (
                <ReportCard key={report.id} report={report} showSchedule={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="one-time" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                One-Time Emails
              </CardTitle>
              <CardDescription>
                Instant email reports sent immediately without scheduling
              </CardDescription>
            </CardHeader>
          </Card>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : oneTimeEmails.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No one-time emails sent</h3>
                <p className="text-gray-600 mb-4">Send your first instant email report</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Send One-Time Email
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oneTimeEmails.map((report) => (
                <ReportCard key={report.id} report={report} showSchedule={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailSender;