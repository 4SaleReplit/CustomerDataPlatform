import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Edit3, Trash2, Calendar, Download, MoreVertical, Play, Pause, Clock, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Template {
  id: string;
  name: string;
  description?: string;
  slideIds: string[];
  previewImageUrl?: string;
  editableUrl?: string;
  pdfUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  status: 'active' | 'paused';
  emailTemplate?: string;
  emailSubject?: string;
  recipients: string[];
  ccRecipients: string[];
  bccRecipients: string[];
  emailPriority: 'normal' | 'high' | 'low';
  lastRunAt?: string;
  nextRunAt?: string;
  lastGeneratedPdfUrl?: string;
  lastGeneratedS3Key?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportsScheduler() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'weekly',
    dayOfWeek: 'monday',
    dayOfMonth: '1',
    time: '09:00',
    cronExpression: '0 9 * * 1'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to generate cron expression
  const generateCronExpression = (frequency: string, day: string, time: string) => {
    const [hour, minute] = time.split(':');
    
    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        const dayMap: Record<string, string> = {
          'sunday': '0', 'monday': '1', 'tuesday': '2', 'wednesday': '3',
          'thursday': '4', 'friday': '5', 'saturday': '6'
        };
        return `${minute} ${hour} * * ${dayMap[day]}`;
      case 'monthly':
        if (day === 'last') {
          return `${minute} ${hour} L * *`;
        }
        return `${minute} ${hour} ${day} * *`;
      default:
        return '0 9 * * 1';
    }
  };

  // Helper function to get schedule description
  const getScheduleDescription = (form: typeof scheduleForm) => {
    const timeFormat = form.time;
    switch (form.frequency) {
      case 'daily':
        return `Every day at ${timeFormat}`;
      case 'weekly':
        return `Every ${form.dayOfWeek} at ${timeFormat}`;
      case 'monthly':
        if (form.dayOfMonth === 'last') {
          return `Last day of every month at ${timeFormat}`;
        }
        return `${form.dayOfMonth === '1' ? '1st' : form.dayOfMonth === '15' ? '15th' : form.dayOfMonth} of every month at ${timeFormat}`;
      default:
        return 'Custom schedule';
    }
  };

  // Fetch templates for dropdown
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => apiRequest('/api/templates')
  });

  // Fetch scheduled reports
  const { data: scheduledReports = [], isLoading } = useQuery({
    queryKey: ['/api/scheduled-reports-new'],
    queryFn: () => apiRequest('/api/scheduled-reports-new')
  });

  // Create scheduled report mutation
  const createReportMutation = useMutation({
    mutationFn: (data: {
      templateId: string;
      name: string;
      description?: string;
      cronExpression: string;
      timezone: string;
      status: string;
      emailSubject?: string;
      recipients: string[];
      ccRecipients: string[];
      bccRecipients: string[];
      emailPriority: string;
    }) => apiRequest('/api/scheduled-reports-new', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Scheduled report created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create scheduled report", variant: "destructive" });
    }
  });

  // Update scheduled report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduledReport> }) =>
      apiRequest(`/api/scheduled-reports-new/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      setIsEditDialogOpen(false);
      setSelectedReport(null);
      toast({ title: "Report updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update report", variant: "destructive" });
    }
  });

  // Delete scheduled report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/scheduled-reports-new/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      toast({ title: "Scheduled report deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete scheduled report", variant: "destructive" });
    }
  });

  // Execute report mutation
  const executeReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/scheduled-reports-new/${id}/execute`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      toast({ title: "Report executed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to execute report", variant: "destructive" });
    }
  });

  const handleCreateReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const recipients = (formData.get('recipients') as string)
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
      
    const ccRecipients = (formData.get('ccRecipients') as string || '')
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
      
    const bccRecipients = (formData.get('bccRecipients') as string || '')
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    createReportMutation.mutate({
      templateId: formData.get('templateId') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      cronExpression: formData.get('cronExpression') as string,
      timezone: formData.get('timezone') as string || 'UTC',
      status: formData.get('status') as string || 'active',
      emailSubject: formData.get('emailSubject') as string || undefined,
      recipients,
      ccRecipients,
      bccRecipients,
      emailPriority: formData.get('emailPriority') as string || 'normal',
    });
  };

  const handleUpdateReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedReport) return;
    
    const formData = new FormData(event.currentTarget);
    
    const recipients = (formData.get('recipients') as string)
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
      
    const ccRecipients = (formData.get('ccRecipients') as string || '')
      .split(',')
      .map(email => email.trim())
      .filter(email => email);
      
    const bccRecipients = (formData.get('bccRecipients') as string || '')
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    updateReportMutation.mutate({
      id: selectedReport.id,
      data: {
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        cronExpression: formData.get('cronExpression') as string,
        timezone: formData.get('timezone') as string || 'UTC',
        status: formData.get('status') as string as 'active' | 'paused',
        emailSubject: formData.get('emailSubject') as string || undefined,
        recipients,
        ccRecipients,
        bccRecipients,
        emailPriority: formData.get('emailPriority') as string as 'normal' | 'high' | 'low',
      }
    });
  };

  const toggleReportStatus = (report: ScheduledReport) => {
    updateReportMutation.mutate({
      id: report.id,
      data: { status: report.status === 'active' ? 'paused' : 'active' }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading scheduled reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports Scheduler</h2>
          <p className="text-gray-600">Manage automated report generation and delivery</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Report</DialogTitle>
              <DialogDescription>
                Create a new scheduled report with advanced email settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReport} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateId">Template</Label>
                  <Select name="templateId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template: Template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Report Name</Label>
                  <Input name="name" id="name" required />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" id="description" rows={2} />
              </div>

              {/* Schedule Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cronExpression">Schedule (Cron)</Label>
                  <Input
                    name="cronExpression"
                    id="cronExpression"
                    placeholder="0 9 * * 1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Monday 9 AM example</p>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input name="timezone" id="timezone" defaultValue="UTC" />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Email Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailSubject">Email Subject</Label>
                    <Input name="emailSubject" id="emailSubject" />
                  </div>
                  <div>
                    <Label htmlFor="emailPriority">Priority</Label>
                    <Select name="emailPriority" defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipients">Recipients (TO)</Label>
                  <Input
                    name="recipients"
                    id="recipients"
                    placeholder="email1@example.com, email2@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ccRecipients">CC Recipients</Label>
                  <Input
                    name="ccRecipients"
                    id="ccRecipients"
                    placeholder="cc1@example.com, cc2@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="bccRecipients">BCC Recipients</Label>
                  <Input
                    name="bccRecipients"
                    id="bccRecipients"
                    placeholder="bcc1@example.com, bcc2@example.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      {scheduledReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
            <p className="text-gray-500 mb-4">Create your first scheduled report to automate report delivery</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scheduledReports.map((report: ScheduledReport) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                        {report.status === 'active' ? (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Paused
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Priority: {report.emailPriority}
                      </Badge>
                    </div>
                    <CardDescription className="mb-3">
                      {report.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedReport(report);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Report
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleReportStatus(report)}>
                        {report.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Report
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Activate Report
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => executeReportMutation.mutate(report.id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Execute Now
                      </DropdownMenuItem>
                      {report.lastGeneratedPdfUrl && (
                        <DropdownMenuItem asChild>
                          <a href={report.lastGeneratedPdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download Latest PDF
                          </a>
                        </DropdownMenuItem>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Report
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Scheduled Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{report.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteReportMutation.mutate(report.id)}
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Schedule:</span>
                    <p className="font-medium">{report.cronExpression}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Recipients:</span>
                    <p className="font-medium flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {report.recipients.length} TO
                      {report.ccRecipients?.length > 0 && `, ${report.ccRecipients.length} CC`}
                      {report.bccRecipients?.length > 0 && `, ${report.bccRecipients.length} BCC`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Timezone:</span>
                    <p className="font-medium">{report.timezone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Last Run:</span>
                    <p className="font-medium">
                      {report.lastRunAt
                        ? format(new Date(report.lastRunAt), 'MMM d, HH:mm')
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Next Run:</span>
                    <p className="font-medium">
                      {report.nextRunAt
                        ? format(new Date(report.nextRunAt), 'MMM d, HH:mm')
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Report</DialogTitle>
            <DialogDescription>
              Update report settings and email configuration
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <form onSubmit={handleUpdateReport} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Report Name</Label>
                  <Input name="name" id="edit-name" defaultValue={selectedReport.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedReport.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  name="description" 
                  id="edit-description" 
                  rows={2} 
                  defaultValue={selectedReport.description || ''} 
                />
              </div>

              {/* Schedule Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cronExpression">Schedule (Cron)</Label>
                  <Input
                    name="cronExpression"
                    id="edit-cronExpression"
                    defaultValue={selectedReport.cronExpression}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-timezone">Timezone</Label>
                  <Input 
                    name="timezone" 
                    id="edit-timezone" 
                    defaultValue={selectedReport.timezone} 
                  />
                </div>
              </div>

              {/* Email Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Email Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-emailSubject">Email Subject</Label>
                    <Input 
                      name="emailSubject" 
                      id="edit-emailSubject" 
                      defaultValue={selectedReport.emailSubject || ''} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-emailPriority">Priority</Label>
                    <Select name="emailPriority" defaultValue={selectedReport.emailPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-recipients">Recipients (TO)</Label>
                  <Input
                    name="recipients"
                    id="edit-recipients"
                    defaultValue={selectedReport.recipients.join(', ')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-ccRecipients">CC Recipients</Label>
                  <Input
                    name="ccRecipients"
                    id="edit-ccRecipients"
                    defaultValue={selectedReport.ccRecipients?.join(', ') || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-bccRecipients">BCC Recipients</Label>
                  <Input
                    name="bccRecipients"
                    id="edit-bccRecipients"
                    defaultValue={selectedReport.bccRecipients?.join(', ') || ''}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedReport(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateReportMutation.isPending}>
                  {updateReportMutation.isPending ? 'Updating...' : 'Update Report'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}