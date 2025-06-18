import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, Send, MoreHorizontal, Copy, Pause, Play, Edit, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { EnhancedSchedulerForm } from "@/components/EnhancedSchedulerForm";

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
  presentationId?: string;
  emailTemplate?: {
    subject: string;
    customContent: string;
    templateId: string;
  };
}

export function EmailSender() {
  const [activeTab, setActiveTab] = useState<"scheduler" | "one-time">("scheduler");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
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
    !report.sentImmediately && report.cronExpression
  );
  
  const oneTimeEmails = reports.filter((report: ScheduledReport) => 
    report.sentImmediately || !report.cronExpression
  );

  const duplicateReport = useMutation({
    mutationFn: (report: ScheduledReport) =>
      apiRequest('/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify({
          ...report,
          id: undefined,
          name: `${report.name} (Copy)`,
          isActive: false
        })
      }),
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

  const toggleReportStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest(`/api/scheduled-reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      }),
    onSuccess: () => {
      toast({ title: "Report status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
    }
  });

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

  const handleEditReport = (report: ScheduledReport) => {
    setSelectedReport(report);
    setIsEditDialogOpen(true);
  };

  const handlePreviewReport = (report: ScheduledReport) => {
    setSelectedReport(report);
    setIsPreviewDialogOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
  };

  const handleEditSubmit = (data: any) => {
    setIsEditDialogOpen(false);
    setSelectedReport(null);
    queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
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
                <DropdownMenuItem onClick={() => handlePreviewReport(report)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicateReport.mutate(report)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                {!report.sentImmediately && (
                  <>
                    <DropdownMenuItem onClick={() => handleEditReport(report)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleReportStatus.mutate({ id: report.id, isActive: !report.isActive })}>
                      {report.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {report.isActive ? 'Pause' : 'Resume'}
                    </DropdownMenuItem>
                  </>
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
              <span className="text-gray-500">{report.sentImmediately ? 'Sent At:' : 'Last executed:'}</span>
              <span>{new Date(report.lastExecuted).toLocaleString()}</span>
            </div>
          )}
          
          {!report.sentImmediately && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Success/Error:</span>
              <span className="text-green-600">{report.successCount} / <span className="text-red-600">{report.errorCount}</span></span>
            </div>
          )}
          
          <div className="text-sm">
            <span className="text-gray-500">Subject:</span>
            <p className="text-gray-900 truncate">{report.emailSubject}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmailPreview = ({ report }: { report: ScheduledReport }) => (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-2">Email Preview</h3>
        <div className="bg-white border rounded p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <div>
              <span className="font-medium">Subject:</span> {report.emailSubject}
            </div>
            <div>
              <span className="font-medium">To:</span> {report.recipientList.join(', ')}
            </div>
            <hr />
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>4SALE TECHNOLOGIES</strong><br />
                Business Analytics & Intelligence Platform
              </div>
              <div>
                <strong>Analytics Report:</strong> {report.name}
              </div>
              <div>
                Dear Valued Client,
              </div>
              <div>
                {report.emailTemplate?.customContent || 'Your report is ready.'}
              </div>
              <div className="text-sm text-gray-600 mt-4">
                <strong>REPORT INFORMATION:</strong><br />
                Report ID: RPT-{new Date().getFullYear()}{(new Date().getMonth()+1).toString().padStart(2,'0')}{new Date().getDate().toString().padStart(2,'0')}-{Math.random().toString(36).substr(2,6).toUpperCase()}<br />
                Generated: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}<br />
                Report Type: Business Intelligence Dashboard
              </div>
              <div className="text-sm text-gray-500 mt-4">
                ---<br />
                4Sale Technologies<br />
                Advanced Business Intelligence & Analytics Solutions<br />
                © {new Date().getFullYear()} 4Sale Technologies. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Sender</h1>
          <p className="text-muted-foreground">
            Schedule automated reports and send one-time emails
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Mail className="w-4 h-4 mr-2" />
              New Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
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
            <EnhancedSchedulerForm
              mode={activeTab === 'one-time' ? 'one-time' : 'schedule'}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
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
                Emails sent immediately without scheduling
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

      {/* Edit Report Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Update the report configuration and settings
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <EnhancedSchedulerForm
              mode="schedule"
              initialData={selectedReport}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedReport(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Report Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how the email will appear to recipients
            </DialogDescription>
          </DialogHeader>
          {selectedReport && <EmailPreview report={selectedReport} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailSender;