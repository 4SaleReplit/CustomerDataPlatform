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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Edit3, Trash2, Calendar, Download, MoreVertical, FileText, Clock, Presentation } from "lucide-react";
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
  emailSubject?: string;
  recipients: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  lastGeneratedPdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export function TemplatesManager() {
  const [activeTab, setActiveTab] = useState<'templates' | 'scheduled'>('templates');
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: () => apiRequest('/api/templates')
  });

  // Fetch scheduled reports
  const { data: scheduledReports = [], isLoading: scheduledLoading } = useQuery({
    queryKey: ['/api/scheduled-reports-new'],
    queryFn: () => apiRequest('/api/scheduled-reports-new')
  });

  // Fetch presentations for template creation
  const { data: presentations = [] } = useQuery({
    queryKey: ['/api/presentations'],
    queryFn: () => apiRequest('/api/presentations')
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  });

  // Create scheduled report mutation
  const createScheduledReportMutation = useMutation({
    mutationFn: (data: {
      templateId: string;
      name: string;
      cronExpression: string;
      recipients: string[];
      description?: string;
      timezone?: string;
      emailSubject?: string;
    }) => apiRequest('/api/scheduled-reports-new', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      setIsScheduleDialogOpen(false);
      setSelectedTemplate(null);
      toast({ title: "Scheduled report created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create scheduled report", variant: "destructive" });
    }
  });

  // Update scheduled report status mutation
  const updateScheduledReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) =>
      apiRequest(`/api/scheduled-reports-new/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  });

  // Delete scheduled report mutation
  const deleteScheduledReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/scheduled-reports-new/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      toast({ title: "Scheduled report deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete scheduled report", variant: "destructive" });
    }
  });

  // Execute scheduled report mutation
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

  const handleCreateScheduledReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const recipients = (formData.get('recipients') as string)
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    createScheduledReportMutation.mutate({
      templateId: selectedTemplate!.id,
      name: formData.get('name') as string,
      cronExpression: formData.get('cronExpression') as string,
      recipients,
      description: formData.get('description') as string || undefined,
      timezone: formData.get('timezone') as string || 'UTC',
      emailSubject: formData.get('emailSubject') as string || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Tab Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Templates & Scheduled Reports</h2>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'templates' ? 'default' : 'outline'}
            onClick={() => setActiveTab('templates')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            variant={activeTab === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setActiveTab('scheduled')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled Reports
          </Button>
        </div>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Templates</h3>
            <Button onClick={() => window.location.href = '/design-studio?mode=template'}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                <p className="text-gray-500 mb-4">Create your first template to get started with automated reporting</p>
                <Button onClick={() => window.location.href = '/design-studio?mode=template'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template: Template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Presentation className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base">{template.name}</CardTitle>
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
                              setSelectedTemplate(template);
                              setIsScheduleDialogOpen(true);
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `/design-studio?mode=template&templateId=${template.id}`}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit in Design Studio
                          </DropdownMenuItem>
                          {template.pdfUrl && (
                            <DropdownMenuItem asChild>
                              <a href={template.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
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
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Template
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {template.description && (
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Template Preview - same as report preview */}
                    <div className="mb-3">
                      {template.previewImageUrl ? (
                        <div className="w-full aspect-video bg-white rounded border border-gray-200 overflow-hidden">
                          <img 
                            src={template.previewImageUrl.startsWith('/uploads/') 
                              ? `${window.location.origin}${template.previewImageUrl}`
                              : template.previewImageUrl
                            } 
                            alt="Template preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <Presentation className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Template Preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{template.slideIds?.length || 0} slides</span>
                        <span>Created {format(new Date(template.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/design-studio?mode=template&templateId=${template.id}`}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsScheduleDialogOpen(true);
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Scheduled Reports</h3>
          </div>

          {scheduledLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : scheduledReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
                <p className="text-gray-500 mb-4">Schedule automated reports from your templates</p>
                <Button onClick={() => setActiveTab('templates')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {scheduledReports.map((report: ScheduledReport) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{report.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {report.description || 'No description'}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                          <div>Schedule: {report.cronExpression}</div>
                          <div>Recipients: {report.recipients.length}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateScheduledReportMutation.mutate({
                                id: report.id,
                                status: report.status === 'active' ? 'paused' : 'active'
                              })}
                            >
                              {report.status === 'active' ? 'Pause' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => executeReportMutation.mutate(report.id)}>
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
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Scheduled Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the scheduled report "{report.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteScheduledReportMutation.mutate(report.id)}
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Report Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Create a scheduled report from template: {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateScheduledReport} className="space-y-4">
            <div>
              <Label htmlFor="name">Report Name</Label>
              <Input name="name" id="name" required />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea name="description" id="description" />
            </div>
            <div>
              <Label htmlFor="cronExpression">Schedule (Cron Expression)</Label>
              <Input
                name="cronExpression"
                id="cronExpression"
                placeholder="0 9 * * 1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Example: "0 9 * * 1" = Every Monday at 9 AM</p>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input name="timezone" id="timezone" defaultValue="UTC" />
            </div>
            <div>
              <Label htmlFor="emailSubject">Email Subject (Optional)</Label>
              <Input name="emailSubject" id="emailSubject" />
            </div>
            <div>
              <Label htmlFor="recipients">Recipients (Email Addresses)</Label>
              <Input
                name="recipients"
                id="recipients"
                placeholder="email1@example.com, email2@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createScheduledReportMutation.isPending}>
                {createScheduledReportMutation.isPending ? 'Creating...' : 'Schedule Report'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}