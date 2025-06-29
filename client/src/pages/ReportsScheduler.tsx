import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Mail, Send, Settings, Play, Pause, Trash2, Plus, Users, Database, CalendarDays, TestTube, MoreVertical, Copy, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplateBuilder } from "@/components/EmailTemplateBuilder";
// import { EnhancedSchedulerForm } from "@/components/EnhancedSchedulerForm";

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
  emailTemplate: {
    templateId: string;
    subject: string;
    customContent: string;
    templateVariables: Record<string, string>;
  };
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

interface CustomVariable {
  name: string;
  type: 'static' | 'query' | 'timestamp' | 'formula';
  value: string;
  description: string;
}

export function ReportsScheduler() {
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [previewHtml, setPreviewHtml] = useState('');
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

  // Function to format cron expression to user-friendly description
  const formatScheduleDescription = (cronExpression: string, timezone: string = 'Africa/Cairo'): string => {
    if (!cronExpression) return 'Not scheduled';
    
    try {
      const parts = cronExpression.split(' ');
      if (parts.length !== 5) return cronExpression;
      
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      
      // Convert 24-hour to 12-hour format
      const timeFormatted = new Date(`2000-01-01T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const timezoneShort = timezone.split('/')[1] || timezone;
      
      // Daily schedule
      if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Daily at ${timeFormatted} (${timezoneShort})`;
      }
      
      // Weekly schedule
      if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[parseInt(dayOfWeek)] || 'Unknown';
        return `Every ${dayName} at ${timeFormatted} (${timezoneShort})`;
      }
      
      // Monthly schedule
      if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
        const dayNum = parseInt(dayOfMonth);
        const suffix = dayNum === 1 ? 'st' : dayNum === 2 ? 'nd' : dayNum === 3 ? 'rd' : 'th';
        return `${dayNum}${suffix} of every month at ${timeFormatted} (${timezoneShort})`;
      }
      
      // Quarterly schedule (every 3 months)
      if (dayOfMonth === '1' && month === '*/3' && dayOfWeek === '*') {
        return `Quarterly at ${timeFormatted} (${timezoneShort})`;
      }
      
      // Default fallback to cron expression
      return `${cronExpression} (${timezoneShort})`;
    } catch (error) {
      return cronExpression;
    }
  };

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
      return apiRequest("/api/scheduled-reports", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-reports"] });
      
      if (formData.sendOption === 'now') {
        toast({ 
          title: "Email sent successfully!", 
          description: `Report sent to ${formData.recipientList.length} recipient(s)`
        });
      } else {
        toast({ title: "Scheduled report created successfully" });
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (formData.sendOption === 'now') {
        toast({ 
          title: "Failed to send email", 
          description: error.message, 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error creating scheduled report", description: error.message, variant: "destructive" });
      }
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
    // Validate required fields
    if (!formData.name.trim()) {
      toast({ title: "Report name is required", variant: "destructive" });
      return;
    }
    
    if (!formData.presentationId) {
      toast({ title: "Please select a presentation", variant: "destructive" });
      return;
    }
    
    if (formData.recipientList.length === 0) {
      toast({ title: "Please add at least one recipient", variant: "destructive" });
      return;
    }

    // Check if this is a "Send Now" request
    if (formData.sendOption === 'now') {
      // Validate email content for Send Now
      if (!formData.emailTemplate.subject?.trim()) {
        toast({ title: "Email subject is required for Send Now", variant: "destructive" });
        return;
      }
      
      if (!formData.emailTemplate.customContent?.trim()) {
        toast({ title: "Email content is required for Send Now", variant: "destructive" });
        return;
      }

      // For "Send Now", we need to prepare the data differently
      const sendNowData = {
        ...formData,
        cronExpression: null, // Null for one-time sends
        isActive: false, // One-time sends are not active schedules
        sendOption: 'now',
        // Ensure email template has proper data
        emailTemplate: {
          ...formData.emailTemplate,
          subject: formData.emailTemplate.subject || formData.name,
          customContent: formData.emailTemplate.customContent || 'Your analytics report is ready.',
          templateId: formData.emailTemplate.templateId || 'professional'
        }
      };
      console.log('Sending immediate email with validated data:', sendNowData);
      createReportMutation.mutate(sendNowData);
    } else {
      // Regular scheduled report - validate schedule
      if (!formData.cronExpression) {
        toast({ title: "Please configure schedule settings", variant: "destructive" });
        return;
      }
      createReportMutation.mutate(formData);
    }
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

  const handleDuplicateReport = (report: ScheduledReport) => {
    setFormData({
      name: `${report.name} (Copy)`,
      description: report.description || "",
      presentationId: report.presentationId,
      cronExpression: report.cronExpression,
      timezone: report.timezone,
      recipientList: report.recipientList,
      ccList: report.ccList,
      bccList: report.bccList,
      isActive: false, // Start duplicates as inactive
      sendOption: 'schedule',
      emailTemplate: report.emailTemplate || {
        templateId: "",
        subject: "",
        customContent: "",
        templateVariables: {}
      },
      pdfDeliveryUrl: report.pdfDeliveryUrl || "",
      placeholderConfig: report.placeholderConfig,
      formatSettings: (report.formatSettings as any) || { format: "pdf", includeCharts: true },
      customVariables: (report as any).customVariables || []
    });
    setCustomVariables((report as any).customVariables || []);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (report: ScheduledReport) => {
    setSelectedReport(report);
    setFormData({
      name: report.name,
      description: report.description || "",
      presentationId: report.presentationId,
      cronExpression: report.cronExpression,
      timezone: report.timezone,
      recipientList: report.recipientList,
      ccList: report.ccList,
      bccList: report.bccList,
      isActive: report.isActive,
      sendOption: 'schedule',
      emailTemplate: report.emailTemplate || {
        templateId: "",
        subject: "",
        customContent: "",
        templateVariables: {}
      },
      pdfDeliveryUrl: report.pdfDeliveryUrl || "",
      placeholderConfig: report.placeholderConfig,
      formatSettings: (report.formatSettings as any) || { format: "pdf", includeCharts: true },
      customVariables: (report as any).customVariables || []
    });
    setCustomVariables((report as any).customVariables || []);
    setIsEditDialogOpen(true);
  };



  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      presentationId: "",
      cronExpression: "",
      timezone: "Africa/Cairo",
      recipientList: [] as string[],
      ccList: [] as string[],
      bccList: [] as string[],
      isActive: true,
      sendOption: 'schedule',
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

  const updateEmailTemplate = (emailTemplate: any) => {
    setFormData(prev => ({
      ...prev,
      emailTemplate
    }));
  };

  // Add custom variable
  const addCustomVariable = () => {
    const newVariable: CustomVariable = {
      name: '',
      type: 'static',
      value: '',
      description: ''
    };
    setCustomVariables(prev => [...prev, newVariable]);
    setFormData(prev => ({
      ...prev,
      customVariables: [...prev.customVariables, newVariable]
    }));
  };

  // Update custom variable
  const updateCustomVariable = (index: number, field: keyof CustomVariable, value: string) => {
    const updatedVariables = [...customVariables];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    setCustomVariables(updatedVariables);
    setFormData(prev => ({
      ...prev,
      customVariables: updatedVariables
    }));
  };

  // Remove custom variable
  const removeCustomVariable = (index: number) => {
    const updatedVariables = customVariables.filter((_, i) => i !== index);
    setCustomVariables(updatedVariables);
    setFormData(prev => ({
      ...prev,
      customVariables: updatedVariables
    }));
  };

  // Generate email preview
  const generateEmailPreview = () => {
    if (!formData.emailTemplate.templateId) return '';

    // Get selected template HTML
    const emailTemplates = [
      {
        id: 'professional',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">4Sale Analytics</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your Report is Ready</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">{report_title}</h2>
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0;">{email_content}</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Report Details</h3>
                <p style="margin: 5px 0;"><strong>Report:</strong> {report_name}</p>
                <p style="margin: 5px 0;"><strong>Period:</strong> {report_period}</p>
                <p style="margin: 5px 0;"><strong>Generated:</strong> {generation_date}</p>
              </div>
            </div>
            <div style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Powered by 4Sale Analytics Platform</p>
            </div>
          </div>
        `
      }
    ];

    const template = emailTemplates.find(t => t.id === formData.emailTemplate.templateId);
    if (!template) return '';

    let html = template.html;
    
    // Replace built-in template variables
    const builtInVars = {
      report_title: formData.emailTemplate.subject || 'Weekly Analytics Report',
      email_content: formData.emailTemplate.customContent || 'Your custom email content will appear here.',
      report_name: formData.name || 'Analytics Report',
      report_period: 'Last 7 days',
      generation_date: new Date().toLocaleDateString(),
      generation_time: new Date().toLocaleTimeString(),
      ...formData.emailTemplate.templateVariables
    };

    // Replace built-in variables
    Object.entries(builtInVars).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      html = html.replace(regex, value);
    });

    // Replace custom variables
    customVariables.forEach(variable => {
      if (variable.name && variable.value) {
        const regex = new RegExp(`{${variable.name}}`, 'g');
        let processedValue = variable.value;
        
        // Process different variable types
        switch (variable.type) {
          case 'timestamp':
            processedValue = new Date().toLocaleString();
            break;
          case 'query':
            processedValue = `[Query Result: ${variable.value}]`;
            break;
          case 'formula':
            processedValue = `[Calculated: ${variable.value}]`;
            break;
          default:
            processedValue = variable.value;
        }
        
        html = html.replace(regex, processedValue);
      }
    });

    return html;
  };

  // Update preview when form data changes
  useEffect(() => {
    const preview = generateEmailPreview();
    setPreviewHtml(preview);
  }, [formData.emailTemplate, customVariables]);

  const formatNextExecution = (nextExecution: string | null) => {
    if (!nextExecution) return "Not scheduled";
    const date = new Date(nextExecution);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  const getStatusBadge = (report: ScheduledReport) => {
    if (!report.isActive) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Paused</Badge>;
    }
    if (report.errorCount > 0) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
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
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Report</DialogTitle>
              <DialogDescription>
                Configure automated report delivery with custom variables and live email preview
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <Label htmlFor="presentationId">Template</Label>
                  <Select value={formData.presentationId} onValueChange={(value) => setFormData(prev => ({ ...prev, presentationId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {presentations?.map((presentation) => (
                        <SelectItem key={presentation.id} value={presentation.id}>
                          {presentation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter report description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateReport} disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? "Creating..." : "Create Report"}
                </Button>
              </div>
            </div>
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
                        Duplicate
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
                            <AlertDialogAction 
                              onClick={() => handleDeleteReport(report.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Report
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {report.cronExpression ? (
                  // Scheduled report display
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
                ) : (
                  // One-time send display
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">SCHEDULE</Label>
                      <p className="font-medium text-muted-foreground">No schedule</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">SENT AT</Label>
                      <p className="font-medium">
                        {report.lastExecuted ? new Date(report.lastExecuted).toLocaleString() : "Processing..."}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">RECIPIENTS</Label>
                      <p className="font-medium">{report.recipientList?.length || 0} recipients</p>
                    </div>
                  </div>
                )}
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
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Report</DialogTitle>
            <DialogDescription>
              Update report schedule with custom variables and live email preview
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Report Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <Label htmlFor="edit-presentationId">Template</Label>
                <Select value={formData.presentationId} onValueChange={(value) => setFormData(prev => ({ ...prev, presentationId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {presentations?.map((presentation) => (
                      <SelectItem key={presentation.id} value={presentation.id}>
                        {presentation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter report description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateReport} disabled={updateReportMutation.isPending}>
                {updateReportMutation.isPending ? "Updating..." : "Update Report"}
              </Button>
            </div>
          </div>
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
  updateEmailTemplate: (emailTemplate: any) => void;
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
  updateEmailTemplate
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

      {/* Email Template Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Configuration
          </CardTitle>
          <CardDescription>
            Choose and customize professional email templates for your scheduled reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTemplateBuilder
            value={formData.emailTemplate}
            onChange={updateEmailTemplate}
            presentations={presentations}
          />
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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