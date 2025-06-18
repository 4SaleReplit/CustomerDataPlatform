import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Mail, Send, Play, Pause, Trash2, Plus, Users, Database, MoreVertical, Copy, Edit, Eye, CheckCircle, XCircle, AlertTriangle, Clock3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EnhancedSchedulerForm } from "@/components/EnhancedSchedulerForm";

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  presentationId: string;
  cronExpression: string | null;
  timezone: string;
  emailSubject: string;
  emailBody: string;
  recipientList: string[];
  ccList: string[];
  bccList: string[];
  isActive: boolean;
  lastExecuted: string | null;
  nextExecution: string | null;
  executionCount: number;
  successCount: number;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  sentImmediately?: boolean;
  sentAt?: string;
  emailTemplate?: {
    templateId: string;
    subject: string;
    customContent: string;
    templateVariables: Record<string, string>;
  };
  pdfDeliveryUrl?: string;
  placeholderConfig?: Record<string, any>;
  formatSettings?: { format: string; includeCharts: boolean };
}

interface Presentation {
  id: string;
  title: string;
}

interface MailingList {
  id: string;
  name: string;
  emails: string[];
  description?: string;
}

interface CustomVariable {
  name: string;
  type: 'static' | 'query' | 'timestamp' | 'formula';
  value: string;
  description: string;
}

export function EmailSender() {
  const [activeTab, setActiveTab] = useState("one-time");
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    presentationId: "",
    cronExpression: "",
    timezone: "Africa/Cairo",
    recipientList: [] as string[],
    ccList: [] as string[],
    bccList: [] as string[],
    isActive: true,
    sendOption: 'schedule' as 'now' | 'schedule',
    emailTemplate: {
      templateId: "",
      subject: "",
      customContent: "",
      templateVariables: {} as Record<string, string>
    },
    pdfDeliveryUrl: "",
    placeholderConfig: {},
    formatSettings: { format: "pdf", includeCharts: true },
    customVariables: [] as CustomVariable[]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: scheduledReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/scheduled-reports'],
    queryFn: () => apiRequest('/api/scheduled-reports')
  });

  const { data: presentations, isLoading: presentationsLoading } = useQuery({
    queryKey: ['/api/presentations'],
    queryFn: () => apiRequest('/api/presentations')
  });

  const { data: mailingLists, isLoading: mailingListsLoading } = useQuery({
    queryKey: ['/api/mailing-lists'],
    queryFn: () => apiRequest('/api/mailing-lists')
  });

  // Mutations
  const createReportMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/scheduled-reports', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: activeTab === "one-time" ? "Email sent successfully" : "Report scheduled successfully",
        description: activeTab === "one-time" ? "Your one-time email has been sent." : "Your scheduled report has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create report",
        variant: "destructive",
      });
    }
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/scheduled-reports/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
      setIsEditDialogOpen(false);
      setSelectedReport(null);
      resetForm();
      toast({
        title: "Report updated",
        description: "Your scheduled report has been updated successfully.",
      });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/scheduled-reports/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
      toast({
        title: "Report deleted",
        description: "The scheduled report has been deleted.",
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      fetch(`/api/scheduled-reports/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports'] });
      toast({
        title: "Status updated",
        description: "Report status has been updated.",
      });
    }
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      presentationId: "",
      cronExpression: "",
      timezone: "Africa/Cairo",
      recipientList: [],
      ccList: [],
      bccList: [],
      isActive: true,
      sendOption: activeTab === "one-time" ? 'now' : 'schedule',
      emailTemplate: {
        templateId: "",
        subject: "",
        customContent: "",
        templateVariables: {}
      },
      pdfDeliveryUrl: "",
      placeholderConfig: {},
      formatSettings: { format: "pdf", includeCharts: true },
      customVariables: []
    });
    setCustomVariables([]);
  };

  const handleCreateReport = (data: any) => {
    const reportData = {
      ...data,
      sendOption: activeTab === "one-time" ? 'now' : 'schedule',
      customVariables
    };
    createReportMutation.mutate(reportData);
  };

  const handleUpdateReport = (data: any) => {
    if (!selectedReport) return;
    updateReportMutation.mutate({
      id: selectedReport.id,
      ...data,
      customVariables
    });
  };

  const handleDuplicateReport = (report: ScheduledReport) => {
    const duplicatedData = {
      ...report,
      name: `${report.name} (Copy)`,
      isActive: false,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      lastExecuted: null,
      nextExecution: null,
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
      lastError: null
    };
    
    setFormData({
      name: duplicatedData.name,
      description: duplicatedData.description,
      presentationId: duplicatedData.presentationId,
      cronExpression: duplicatedData.cronExpression || "",
      timezone: duplicatedData.timezone,
      recipientList: duplicatedData.recipientList,
      ccList: duplicatedData.ccList,
      bccList: duplicatedData.bccList,
      isActive: false,
      sendOption: duplicatedData.cronExpression ? 'schedule' : 'now',
      emailTemplate: {
        templateId: "",
        subject: duplicatedData.emailSubject,
        customContent: "",
        templateVariables: {}
      },
      pdfDeliveryUrl: "",
      placeholderConfig: {},
      formatSettings: { format: "pdf", includeCharts: true },
      customVariables: []
    });
    
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (report: ScheduledReport) => {
    setSelectedReport(report);
    setFormData({
      name: report.name,
      description: report.description,
      presentationId: report.presentationId,
      cronExpression: report.cronExpression || "",
      timezone: report.timezone,
      recipientList: report.recipientList,
      ccList: report.ccList,
      bccList: report.bccList,
      isActive: report.isActive,
      sendOption: report.cronExpression ? 'schedule' : 'now',
      emailTemplate: report.emailTemplate || {
        templateId: "",
        subject: report.emailSubject,
        customContent: "",
        templateVariables: {}
      },
      pdfDeliveryUrl: report.pdfDeliveryUrl || "",
      placeholderConfig: report.placeholderConfig || {},
      formatSettings: report.formatSettings || { format: "pdf", includeCharts: true },
      customVariables: []
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive });
  };

  const handleDeleteReport = (id: string) => {
    deleteReportMutation.mutate(id);
  };

  const getStatusBadge = (report: ScheduledReport) => {
    if (report.sentImmediately) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" />Sent</Badge>;
    }
    
    if (!report.isActive) {
      return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
    }
    
    if (report.lastError) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
    }
    
    if (report.lastExecuted) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    }
    
    return <Badge variant="outline"><Clock3 className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const formatScheduleDescription = (cronExpression: string | null, timezone: string) => {
    if (!cronExpression) return "One-time email";
    
    // Simple cron description mapping
    const cronDescriptions: Record<string, string> = {
      "0 9 * * 1": "Weekly on Monday at 9:00 AM",
      "0 9 1 * *": "Monthly on 1st at 9:00 AM",
      "0 9 * * *": "Daily at 9:00 AM",
      "0 */6 * * *": "Every 6 hours"
    };
    
    return cronDescriptions[cronExpression] || `Custom schedule (${timezone})`;
  };

  const updateEmailTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      emailTemplate: {
        ...prev.emailTemplate,
        ...template
      }
    }));
  };

  // Filter reports based on active tab
  const filteredReports = (scheduledReports as ScheduledReport[] || []).filter(report => {
    if (activeTab === "one-time") {
      return report.sentImmediately === true || report.cronExpression === null;
    } else {
      return report.cronExpression !== null && !report.sentImmediately;
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Sender</h1>
          <p className="text-muted-foreground">Send one-time emails or schedule automated report delivery</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="one-time" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            One-Time Email
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="one-time" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">One-Time Emails</h2>
              <p className="text-muted-foreground">Send immediate email reports</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Send New Email
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Send One-Time Email</DialogTitle>
                  <DialogDescription>
                    Send an immediate email report with custom content and recipients
                  </DialogDescription>
                </DialogHeader>
                <EnhancedSchedulerForm
                  formData={formData}
                  setFormData={setFormData}
                  presentations={presentations}
                  presentationsLoading={presentationsLoading}
                  mailingLists={mailingLists as MailingList[]}
                  onSubmit={handleCreateReport}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createReportMutation.isPending}
                  updateEmailTemplate={updateEmailTemplate}
                  mode="one-time"
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {reportsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading one-time emails...</div>
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Send className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No one-time emails sent yet</p>
                    <p className="text-sm text-muted-foreground">Send your first email report</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report: ScheduledReport) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          {getStatusBadge(report)}
                        </div>
                        <CardDescription>{report.description}</CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {report.sentAt ? new Date(report.sentAt).toLocaleString() : 'Pending'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {report.recipientList.length} recipients
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {presentations?.find((p: Presentation) => p.id === report.presentationId)?.title || "Unknown Report"}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDuplicateReport(report)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Scheduled Emails</h2>
              <p className="text-muted-foreground">Automated report delivery on schedule</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule New Report</DialogTitle>
                  <DialogDescription>
                    Configure automated report delivery with custom variables and live email preview
                  </DialogDescription>
                </DialogHeader>
                <EnhancedSchedulerForm
                  formData={formData}
                  setFormData={setFormData}
                  presentations={presentations}
                  presentationsLoading={presentationsLoading}
                  mailingLists={mailingLists as MailingList[]}
                  onSubmit={handleCreateReport}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createReportMutation.isPending}
                  updateEmailTemplate={updateEmailTemplate}
                  mode="scheduled"
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {reportsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading scheduled reports...</div>
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No scheduled reports yet</p>
                    <p className="text-sm text-muted-foreground">Create your first automated report</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report: ScheduledReport) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          {getStatusBadge(report)}
                        </div>
                        <CardDescription>{report.description}</CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {presentations?.find((p: Presentation) => p.id === report.presentationId)?.title || "Unknown Report"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatScheduleDescription(report.cronExpression, report.timezone)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {report.recipientList.length} recipients
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDuplicateReport(report)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(report.id, report.isActive)}>
                            {report.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(report)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Scheduled Report</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{report.name}"? This action cannot be undone and will stop all future scheduled deliveries.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Report</DialogTitle>
            <DialogDescription>
              Update your scheduled report configuration
            </DialogDescription>
          </DialogHeader>
          <EnhancedSchedulerForm
            formData={formData}
            setFormData={setFormData}
            presentations={presentations}
            presentationsLoading={presentationsLoading}
            mailingLists={mailingLists as MailingList[]}
            onSubmit={handleUpdateReport}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={updateReportMutation.isPending}
            updateEmailTemplate={updateEmailTemplate}
            mode="scheduled"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}