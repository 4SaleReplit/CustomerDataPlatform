import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Mail, Send, Settings, Play, Pause, Trash2, Plus, Users, Database, CalendarDays, TestTube } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  presentationId: string;
  presentationTitle?: string;
  cronExpression: string;
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
  errorCount: number;
  lastError: string | null;
  airflowDagId: string | null;
  airflowTaskId: string | null;
  airflowConfiguration: Record<string, any>;
  pdfDeliveryUrl: string | null;
  placeholderConfig: Record<string, any>;
  formatSettings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Presentation {
  id: string;
  title: string;
  description: string;
  slideIds: string[];
  previewImageUrl: string | null;
}

interface MailingList {
  id: string;
  name: string;
  description: string;
  emails: Array<{ name: string; email: string }>;
  subscriberCount: number;
  isActive: boolean;
}

// Schedule configuration options
const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Custom", value: "custom" }
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  const time12 = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`;
  return { label: time12, value: `${hour}:00` };
});

const WEEKDAY_OPTIONS = [
  { label: "Monday", value: "1" },
  { label: "Tuesday", value: "2" },
  { label: "Wednesday", value: "3" },
  { label: "Thursday", value: "4" },
  { label: "Friday", value: "5" },
  { label: "Saturday", value: "6" },
  { label: "Sunday", value: "0" }
];

const MONTH_DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  label: `${i + 1}${i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : i + 1 === 3 ? 'rd' : 'th'}`,
  value: (i + 1).toString()
}));

// Function to generate cron expression from user-friendly inputs
function generateCronExpression(frequency: string, time: string, weekday?: string, monthDay?: string): string {
  const [hour, minute] = time.split(':');
  
  switch (frequency) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${weekday || '1'}`;
    case 'monthly':
      return `${minute} ${hour} ${monthDay || '1'} * *`;
    default:
      return '0 9 * * 1'; // Default to Monday 9 AM
  }
}

const TIMEZONE_OPTIONS = [
  { value: "Africa/Cairo", label: "Cairo (GMT+2)" },
  { value: "Asia/Kuwait", label: "Kuwait (GMT+3)" }
];

const AVAILABLE_PLACEHOLDERS = [
  { key: "{date}", description: "Current date (YYYY-MM-DD)" },
  { key: "{time}", description: "Current time (HH:MM)" },
  { key: "{datetime}", description: "Current date and time" },
  { key: "{report_name}", description: "Name of the report" },
  { key: "{execution_count}", description: "Number of times report has been sent" },
  { key: "{recipient_count}", description: "Number of recipients" },
  { key: "{week_start}", description: "Start of current week" },
  { key: "{week_end}", description: "End of current week" },
  { key: "{month_start}", description: "Start of current month" },
  { key: "{month_end}", description: "End of current month" },
  { key: "{quarter_start}", description: "Start of current quarter" },
  { key: "{quarter_end}", description: "End of current quarter" }
];

export function ReportsScheduler() {
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    presentationId: "",
    cronExpression: "",
    timezone: "Africa/Cairo",
    emailSubject: "",
    emailBody: "",
    recipientList: [] as string[],
    ccList: [] as string[],
    bccList: [] as string[],
    isActive: true,
    airflowDagId: "",
    airflowTaskId: "send_report",
    airflowConfiguration: {
      dag_id: "",
      schedule_interval: null,
      start_date: new Date().toISOString(),
      catchup: false,
      max_active_runs: 1,
      tasks: [{
        task_id: "generate_report",
        operator: "PythonOperator",
        python_callable: "generate_pdf_report",
        op_kwargs: {}
      }, {
        task_id: "send_report",
        operator: "EmailOperator",
        to: [],
        subject: "",
        html_content: "",
        files: []
      }]
    },
    pdfDeliveryUrl: "",
    placeholderConfig: {},
    formatSettings: { format: "pdf", includeCharts: true }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scheduled reports
  const { data: scheduledReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/scheduled-reports"],
    queryFn: async () => {
      const response = await fetch('/api/scheduled-reports');
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled reports');
      }
      return response.json();
    }
  });

  // Fetch presentations for dropdown
  const { data: presentations = [], isLoading: presentationsLoading } = useQuery({
    queryKey: ["/api/presentations"],
    queryFn: async () => {
      const response = await fetch('/api/presentations');
      if (!response.ok) {
        throw new Error('Failed to fetch presentations');
      }
      return response.json();
    }
  });

  // Fetch mailing lists
  const { data: mailingLists = [] } = useQuery({
    queryKey: ["/api/mailing-lists"],
  });

  // Create scheduled report mutation
  const createReportMutation = useMutation({
    mutationFn: (data: any) => {
      // Auto-generate Airflow configuration based on form data
      const airflowConfig = generateAirflowConfiguration(data);
      return apiRequest("/api/scheduled-reports", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          airflowConfiguration: airflowConfig
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Scheduled report created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating scheduled report", description: error.message, variant: "destructive" });
    }
  });

  // Update scheduled report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/scheduled-reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      setIsEditDialogOpen(false);
      setSelectedReport(null);
      toast({ title: "Scheduled report updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating scheduled report", description: error.message, variant: "destructive" });
    }
  });

  // Delete scheduled report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/scheduled-reports/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      toast({ title: "Scheduled report deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting scheduled report", description: error.message, variant: "destructive" });
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest(`/api/scheduled-reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      toast({ title: "Report status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating report status", description: error.message, variant: "destructive" });
    }
  });

  const handleCreateReport = () => {
    createReportMutation.mutate(formData);
  };

  const handleUpdateReport = () => {
    if (selectedReport) {
      updateReportMutation.mutate({ id: selectedReport.id, data: formData });
    }
  };

  const handleDeleteReport = (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled report?")) {
      deleteReportMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  const openEditDialog = (report: ScheduledReport) => {
    setSelectedReport(report);
    setFormData({
      name: report.name,
      description: report.description || "",
      presentationId: report.presentationId,
      cronExpression: report.cronExpression,
      timezone: report.timezone,
      emailSubject: report.emailSubject,
      emailBody: report.emailBody,
      recipientList: report.recipientList,
      ccList: report.ccList,
      bccList: report.bccList,
      isActive: report.isActive,
      airflowDagId: report.airflowDagId || "",
      airflowTaskId: report.airflowTaskId || "send_report",
      airflowConfiguration: (report.airflowConfiguration as any) || {
        dag_id: "",
        schedule_interval: null,
        start_date: new Date().toISOString(),
        catchup: false,
        max_active_runs: 1,
        tasks: []
      },
      pdfDeliveryUrl: report.pdfDeliveryUrl || "",
      placeholderConfig: report.placeholderConfig,
      formatSettings: (report.formatSettings as any) || { format: "pdf", includeCharts: true }
    });
    setIsEditDialogOpen(true);
  };



  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      presentationId: "",
      cronExpression: "",
      timezone: "Africa/Cairo",
      emailSubject: "",
      emailBody: "",
      recipientList: [] as string[],
      ccList: [] as string[],
      bccList: [] as string[],
      isActive: true,
      airflowDagId: "",
      airflowTaskId: "send_report",
      airflowConfiguration: {
        dag_id: "",
        schedule_interval: null,
        start_date: new Date().toISOString(),
        catchup: false,
        max_active_runs: 1,
        tasks: [{
          task_id: "generate_report",
          operator: "PythonOperator",
          python_callable: "generate_pdf_report",
          op_kwargs: {}
        }, {
          task_id: "send_report",
          operator: "EmailOperator",
          to: [],
          subject: "",
          html_content: "",
          files: []
        }]
      },
      pdfDeliveryUrl: "",
      placeholderConfig: {},
      formatSettings: { format: "pdf", includeCharts: true }
    });
  };

  const generateAirflowConfiguration = (data: any) => {
    return {
      dag_id: data.airflowDagId || `report_${data.name?.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      schedule_interval: data.cronExpression || null,
      start_date: new Date().toISOString(),
      catchup: false,
      max_active_runs: 1,
      timezone: data.timezone || "Africa/Cairo",
      tasks: [{
        task_id: "generate_report",
        operator: "PythonOperator",
        python_callable: "generate_pdf_report",
        op_kwargs: {
          presentation_id: data.presentationId,
          format: data.formatSettings?.format || "pdf",
          include_charts: data.formatSettings?.includeCharts || true
        }
      }, {
        task_id: data.airflowTaskId || "send_report",
        operator: "EmailOperator",
        to: data.recipientList || [],
        cc: data.ccList || [],
        bcc: data.bccList || [],
        subject: data.emailSubject || "",
        html_content: data.emailBody || "",
        files: [{
          file_path: data.pdfDeliveryUrl || "/tmp/report.pdf",
          file_name: `${data.name || 'report'}.pdf`
        }]
      }]
    };
  };

  const insertPlaceholder = (placeholder: string, field: "emailSubject" | "emailBody") => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] + placeholder
    }));
  };

  const formatNextExecution = (nextExecution: string | null) => {
    if (!nextExecution) return "Not scheduled";
    const date = new Date(nextExecution);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  const getStatusBadge = (report: ScheduledReport) => {
    if (!report.isActive) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (report.errorCount > 0) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports Scheduler</h1>
          <p className="text-muted-foreground">Automate report delivery with scheduled emails</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Report</DialogTitle>
              <DialogDescription>
                Configure automated report delivery with custom schedules and email templates
              </DialogDescription>
            </DialogHeader>
            <SchedulerForm
              formData={formData}
              setFormData={setFormData}
              presentations={presentations}
              presentationsLoading={presentationsLoading}
              mailingLists={mailingLists as MailingList[]}
              onSubmit={handleCreateReport}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createReportMutation.isPending}
              insertPlaceholder={insertPlaceholder}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Reports List */}
      <div className="grid gap-4">
        {reportsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading scheduled reports...</div>
          </div>
        ) : (scheduledReports as any[])?.length === 0 ? (
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
          (scheduledReports as ScheduledReport[]).map((report: ScheduledReport) => (
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
                        {presentations.find((p: Presentation) => p.id === report.presentationId)?.title || "Unknown Report"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {report.cronExpression}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {report.recipientList.length} recipients
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(report.id, report.isActive)}
                    >
                      {report.isActive ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(report)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">NEXT EXECUTION</Label>
                    <p className="font-medium">{formatNextExecution(report.nextExecution)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">EXECUTIONS</Label>
                    <p className="font-medium">{report.executionCount} sent</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">LAST SENT</Label>
                    <p className="font-medium">
                      {report.lastExecuted ? new Date(report.lastExecuted).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>
                {report.lastError && (
                  <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    <strong>Last Error:</strong> {report.lastError}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Report</DialogTitle>
            <DialogDescription>
              Update report schedule and email configuration
            </DialogDescription>
          </DialogHeader>
          <SchedulerForm
            formData={formData}
            setFormData={setFormData}
            presentations={presentations}
            presentationsLoading={presentationsLoading}
            mailingLists={mailingLists as MailingList[]}
            onSubmit={handleUpdateReport}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={updateReportMutation.isPending}
            insertPlaceholder={insertPlaceholder}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SchedulerFormProps {
  formData: any;
  setFormData: (data: any) => void;
  presentations: Presentation[];
  presentationsLoading: boolean;
  mailingLists: MailingList[];
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  insertPlaceholder: (placeholder: string, field: "emailSubject" | "emailBody") => void;
}

function SchedulerForm({
  formData,
  setFormData,
  presentations,
  presentationsLoading,
  mailingLists,
  onSubmit,
  onCancel,
  isLoading,
  insertPlaceholder
}: SchedulerFormProps) {
  const [frequency, setFrequency] = useState("weekly");
  const [time, setTime] = useState("09:00");
  const [weekday, setWeekday] = useState("1");
  const [monthDay, setMonthDay] = useState("1");
  const [emailsInput, setEmailsInput] = useState("");

  // Generate cron expression when schedule options change
  useEffect(() => {
    if (frequency !== "custom") {
      const cronExpression = generateCronExpression(frequency, time, weekday, monthDay);
      setFormData((prev: any) => ({ ...prev, cronExpression }));
    }
  }, [frequency, time, weekday, monthDay, setFormData]);

  const handleFrequencyChange = (value: string) => {
    setFrequency(value);
  };

  const addEmailsFromInput = () => {
    if (emailsInput.trim()) {
      const newEmails = emailsInput.split(',').map(email => email.trim()).filter(email => email);
      setFormData((prev: any) => ({
        ...prev,
        recipientList: [...prev.recipientList, ...newEmails]
      }));
      setEmailsInput("");
    }
  };

  const removeEmail = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      recipientList: prev.recipientList.filter((_: any, i: number) => i !== index)
    }));
  };

  const addMailingList = (mailingList: MailingList) => {
    const emails = mailingList.emails.map(contact => contact.email);
    setFormData((prev: any) => ({
      ...prev,
      recipientList: [...Array.from(new Set([...prev.recipientList, ...emails]))]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Report Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
            placeholder="Weekly Sales Report"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="presentationId">Select Report</Label>
          <Select
            value={formData.presentationId}
            onValueChange={(value) => setFormData((prev: any) => ({ ...prev, presentationId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a report to schedule" />
            </SelectTrigger>
            <SelectContent>
              {presentationsLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading reports...</div>
              ) : presentations.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No reports available</div>
              ) : (
                presentations.map((presentation: any) => (
                  <SelectItem key={presentation.id} value={presentation.id}>
                    {presentation.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
          placeholder="Automated weekly sales performance report for stakeholders"
        />
      </div>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="What time?" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger>
                  <SelectValue placeholder="Which day?" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === "monthly" && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select value={monthDay} onValueChange={setMonthDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Which day?" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_DAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="cronExpression">Custom Cron Expression</Label>
              <Input
                id="cronExpression"
                value={formData.cronExpression}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, cronExpression: e.target.value }))}
                placeholder="0 9 * * 1 (Every Monday at 9 AM)"
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day month weekday (e.g., "0 9 * * 1" for Monday 9 AM)
              </p>
            </div>
          )}

          {frequency !== "custom" && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Schedule:</strong> {
                  frequency === 'daily' ? `Every day at ${TIME_OPTIONS.find(t => t.value === time)?.label}` :
                  frequency === 'weekly' ? `Every ${WEEKDAY_OPTIONS.find(w => w.value === weekday)?.label} at ${TIME_OPTIONS.find(t => t.value === time)?.label}` :
                  frequency === 'monthly' ? `${MONTH_DAY_OPTIONS.find(d => d.value === monthDay)?.label} of every month at ${TIME_OPTIONS.find(t => t.value === time)?.label}` :
                  'Custom schedule'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cron: {formData.cronExpression}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData((prev: any) => ({ ...prev, timezone: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((timezone) => (
                  <SelectItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailSubject">Email Subject</Label>
              <div className="flex gap-1">
                {AVAILABLE_PLACEHOLDERS.slice(0, 4).map((placeholder) => (
                  <Button
                    key={placeholder.key}
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder.key, "emailSubject")}
                    className="text-xs"
                  >
                    {placeholder.key}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              id="emailSubject"
              value={formData.emailSubject}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, emailSubject: e.target.value }))}
              placeholder="Weekly Sales Report - {date}"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailBody">Email Body</Label>
              <div className="flex gap-1 flex-wrap">
                {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                  <Button
                    key={placeholder.key}
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder.key, "emailBody")}
                    className="text-xs"
                    title={placeholder.description}
                  >
                    {placeholder.key}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              id="emailBody"
              value={formData.emailBody}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, emailBody: e.target.value }))}
              placeholder="Dear Team,&#10;&#10;Please find attached the {report_name} for the week ending {date}.&#10;&#10;Best regards"
              rows={6}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <Label>Recipients</Label>
            
            {/* Mailing Lists */}
            {mailingLists.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Add from Mailing Lists</Label>
                <div className="flex gap-2 flex-wrap">
                  {mailingLists.map((list: MailingList) => (
                    <Button
                      key={list.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addMailingList(list)}
                      disabled={!list.isActive}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {list.name} ({list.subscriberCount})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Email Entry */}
            <div className="space-y-2">
              <Label className="text-sm">Add Emails Manually</Label>
              <div className="flex gap-2">
                <Input
                  value={emailsInput}
                  onChange={(e) => setEmailsInput(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  onKeyPress={(e) => e.key === 'Enter' && addEmailsFromInput()}
                />
                <Button onClick={addEmailsFromInput} size="sm">
                  Add
                </Button>
              </div>
            </div>

            {/* Current Recipients */}
            {formData.recipientList.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Current Recipients ({formData.recipientList.length})</Label>
                <div className="flex gap-1 flex-wrap max-h-32 overflow-y-auto">
                  {formData.recipientList.map((email: string, index: number) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeEmail(index)}>
                      {email} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Airflow DAG Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Airflow DAG Configuration
          </CardTitle>
          <CardDescription>
            Configure Airflow workflow for automated report generation and delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="airflowDagId">DAG ID</Label>
              <Input
                id="airflowDagId"
                value={formData.airflowDagId}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, airflowDagId: e.target.value }))}
                placeholder="report_scheduler_weekly_sales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airflowTaskId">Task ID</Label>
              <Input
                id="airflowTaskId"
                value={formData.airflowTaskId}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, airflowTaskId: e.target.value }))}
                placeholder="send_report"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdfDeliveryUrl">PDF Delivery URL</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                PDF delivery URL will be automatically generated based on selected report
              </p>
              {formData.presentationId && (
                <p className="text-sm font-mono mt-1">
                  {window.location.origin}/api/reports/pdf/{formData.presentationId}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="airflowConfiguration">Airflow DAG Configuration (JSON)</Label>
            <Textarea
              id="airflowConfiguration"
              value={JSON.stringify(formData.airflowConfiguration, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  setFormData((prev: any) => ({ ...prev, airflowConfiguration: config }));
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              rows={8}
              className="font-mono text-sm"
              placeholder="Enter Airflow DAG configuration as JSON"
            />
            <p className="text-sm text-muted-foreground">
              Complete Airflow DAG configuration including tasks, operators, and dependencies
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, isActive: checked }))}
          />
          <Label>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}