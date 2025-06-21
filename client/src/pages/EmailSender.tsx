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
import { NewEmailSenderForm } from "@/components/NewEmailSenderForm";
import { SimpleEmailListView } from "@/components/SimpleEmailListView";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contentType: 'report' as 'template' | 'report',
    presentationId: "",
    templateId: "",
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

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => apiRequest('/api/templates')
  });

  const { data: emailTemplates, isLoading: emailTemplatesLoading } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: () => apiRequest('/api/email-templates')
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
      contentType: 'report',
      presentationId: "",
      templateId: "",
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

  const handleCreateReport = async (data: any) => {
    // Handle template refresh before sending if content type is template
    if (data.contentType === 'template' && data.templateId) {
      try {
        // Refresh template data before sending
        await apiRequest(`/api/templates/${data.templateId}/refresh`, { method: 'POST' });
        toast({
          title: "Template refreshed",
          description: "Template data has been refreshed before sending.",
        });
      } catch (error) {
        console.error('Failed to refresh template:', error);
        toast({
          title: "Warning",
          description: "Failed to refresh template, continuing with existing data.",
          variant: "destructive",
        });
      }
    }

    // Clean the data to ensure it's JSON serializable
    const sanitizedData = {
      name: data.name || '',
      description: data.description || '',
      contentType: data.contentType || 'report',
      presentationId: data.presentationId || '',
      templateId: data.templateId || '',
      cronExpression: data.cronExpression || '',
      timezone: data.timezone || 'Africa/Cairo',
      recipientList: Array.isArray(data.recipientList) ? data.recipientList : [],
      ccList: Array.isArray(data.ccList) ? data.ccList : [],
      bccList: Array.isArray(data.bccList) ? data.bccList : [],
      isActive: Boolean(data.isActive),
      sendOption: activeTab === "one-time" ? 'now' : 'schedule',
      emailTemplate: {
        templateId: data.emailTemplate?.templateId || '',
        subject: data.emailTemplate?.subject || '',
        customContent: data.emailTemplate?.customContent || '',
        templateVariables: data.emailTemplate?.templateVariables || {}
      },
      pdfDeliveryUrl: data.pdfDeliveryUrl || '',
      placeholderConfig: data.placeholderConfig || {},
      formatSettings: data.formatSettings || { format: "pdf", includeCharts: true },
      customVariables: Array.isArray(customVariables) ? customVariables.map(cv => ({
        name: cv.name || '',
        type: cv.type || 'static',
        value: cv.value || '',
        description: cv.description || ''
      })) : []
    };
    
    console.log('Sanitized report data:', sanitizedData);
    createReportMutation.mutate(sanitizedData);
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
      contentType: 'report',
      presentationId: duplicatedData.presentationId,
      templateId: "",
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
      contentType: 'report',
      presentationId: report.presentationId,
      templateId: "",
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



  const updateEmailTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      emailTemplate: {
        ...prev.emailTemplate,
        ...template
      }
    }));
  };

  // Filter reports based on active tab and search/filter criteria
  const filteredReports = (scheduledReports as ScheduledReport[] || []).filter(report => {
    // Tab filtering
    const matchesTab = activeTab === "one-time" 
      ? (report.sentImmediately === true || report.cronExpression === null)
      : (report.cronExpression !== null && !report.sentImmediately);
    
    if (!matchesTab) return false;
    
    // Search filtering
    const matchesSearch = searchTerm === "" || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (presentations?.find(p => p.id === report.presentationId)?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filtering
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && report.isActive) ||
      (statusFilter === "paused" && !report.isActive) ||
      (statusFilter === "sent" && report.sentImmediately) ||
      (statusFilter === "error" && report.lastError);
    
    // Type filtering for scheduled reports
    const matchesType = typeFilter === "all" || activeTab === "one-time" ||
      (typeFilter === "daily" && report.cronExpression?.includes("* * *")) ||
      (typeFilter === "weekly" && report.cronExpression?.includes("* * 1")) ||
      (typeFilter === "monthly" && report.cronExpression?.includes("1 * *"));
    
    return matchesSearch && matchesStatus && matchesType;
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
              <NewEmailSenderForm
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSubmit={handleCreateReport}
                isLoading={createReportMutation.isPending}
                mode="one-time"
                title="Send One-Time Email"
              />
            </Dialog>
          </div>

          <SimpleEmailListView
            reports={filteredReports}
            mode="one-time"
            onEdit={openEditDialog}
            onDuplicate={handleDuplicateReport}
            onDelete={handleDeleteReport}
            onToggleActive={() => {}}
            presentations={presentations}
          />
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
              <NewEmailSenderForm
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSubmit={handleCreateReport}
                isLoading={createReportMutation.isPending}
                mode="scheduled"
                title="Schedule New Report"
              />
            </Dialog>
          </div>

          <SimpleEmailListView
            reports={filteredReports}
            mode="scheduled"
            onEdit={openEditDialog}
            onDuplicate={handleDuplicateReport}
            onDelete={handleDeleteReport}
            onToggleActive={(id, isActive) => handleToggleActive(id, isActive)}
            presentations={presentations}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <NewEmailSenderForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdateReport}
        isLoading={updateReportMutation.isPending}
        mode={selectedReport?.cronExpression ? "scheduled" : "one-time"}
        title="Edit Email"
      />
    </div>
  );
}