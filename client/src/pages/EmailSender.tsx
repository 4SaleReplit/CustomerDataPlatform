import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, Send, MoreHorizontal, Copy, Pause, Play, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EnhancedSchedulerForm } from "@/components/EnhancedSchedulerForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export function EmailSender() {
  const [activeTab, setActiveTab] = useState<"scheduler" | "one-time">("scheduler");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/scheduled-reports'],
    queryFn: () => apiRequest('/api/scheduled-reports')
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
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Email</DialogTitle>
              <DialogDescription>
                Configure your email settings and template
              </DialogDescription>
            </DialogHeader>
            <EnhancedSchedulerForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
              }}
              hideOneTimeOption={activeTab === "scheduler"}
              defaultSendOption={activeTab === "one-time" ? "now" : "schedule"}
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