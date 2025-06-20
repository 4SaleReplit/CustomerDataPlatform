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
import { Plus, Edit3, Trash2, Calendar, Download, MoreVertical, FileText, Clock, Presentation, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Template {
  id: string;
  name: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  slideIds?: string[];
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
  const [isCreateNowDialogOpen, setIsCreateNowDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [createNowForm, setCreateNowForm] = useState({ reportName: '' });
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
      case 'hourly':
        return `${minute} * * * *`;
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

  // Execute template mutation
  const executeReportMutation = useMutation({
    mutationFn: ({ id, reportName }: { id: string, reportName: string }) => 
      apiRequest(`/api/templates/${id}/execute`, { 
        method: 'POST',
        body: JSON.stringify({ reportName })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      toast({ title: "Report created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create report", variant: "destructive" });
    }
  });

  // Execute scheduled report mutation (for immediate execution)
  const executeScheduledReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/scheduled-reports-new/${id}/execute`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presentations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-reports-new'] });
      toast({ title: "Scheduled report executed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to execute scheduled report", variant: "destructive" });
    }
  });

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const generateSmartReportName = (templateName: string, frequency: string): string => {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        return `${templateName} - ${now.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} ${now.getHours()}:00`;
      case 'daily':
        return `${templateName} - ${now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })}`;
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return `${templateName} - Week ${startOfWeek.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}`;
      case 'monthly':
        return `${templateName} - ${now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })}`;
      default:
        return `${templateName} - ${now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })}`;
    }
  };

  const handleCreateNow = async () => {
    if (!selectedTemplate || !createNowForm.reportName.trim()) {
      toast({ title: "Please enter a report name", variant: "destructive" });
      return;
    }
    
    executeReportMutation.mutate({ 
      id: selectedTemplate.id, 
      reportName: createNowForm.reportName.trim() 
    });
    
    setIsCreateNowDialogOpen(false);
    setCreateNowForm({ reportName: '' });
  };

  const handleCreateScheduledReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Generate smart report name based on schedule frequency
    const reportName = generateSmartReportName(selectedTemplate!.name, scheduleForm.frequency);

    createScheduledReportMutation.mutate({
      templateId: selectedTemplate!.id,
      name: formData.get('name') as string || reportName,
      cronExpression: scheduleForm.cronExpression,
      recipients: [], // Empty array since we're creating PDF reports, not emails
      description: formData.get('description') as string || undefined,
      timezone: formData.get('timezone') as string || 'Africa/Cairo',
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
                    {/* Template Preview - enhanced to show actual preview */}
                    <div className="mb-3">
                      {(() => {
                        // Check if template has a preview image URL
                        if (template.previewImageUrl) {
                          const thumbnailUrl = template.previewImageUrl.startsWith('/uploads/') 
                            ? `${window.location.origin}${template.previewImageUrl}`
                            : template.previewImageUrl;
                          
                          return (
                            <div className="w-full aspect-video bg-white rounded border border-gray-200 overflow-hidden">
                              <img 
                                src={thumbnailUrl} 
                                alt="Template preview" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          );
                        }

                        // If template has content, try to generate a preview from first slide
                        if (template.content) {
                          try {
                            const content = JSON.parse(template.content);
                            if (content.slides && content.slides.length > 0) {
                              const firstSlide = content.slides[0];
                              
                              // Check if first slide has elements with images
                              if (firstSlide.elements && Array.isArray(firstSlide.elements)) {
                                for (const element of firstSlide.elements) {
                                  if (element.type === 'image' && element.content) {
                                    const imageUrl = element.content.startsWith('/uploads/') 
                                      ? `${window.location.origin}${element.content}`
                                      : element.content;
                                    
                                    return (
                                      <div className="w-full aspect-video bg-white rounded border border-gray-200 overflow-hidden">
                                        <img 
                                          src={imageUrl} 
                                          alt="Template preview" 
                                          className="w-full h-full object-contain"
                                          onError={(e) => {
                                            console.log('Failed to load template preview image:', imageUrl);
                                          }}
                                        />
                                      </div>
                                    );
                                  }
                                }
                              }
                            }
                          } catch (error) {
                            console.log('Failed to parse template content for preview:', error);
                          }
                        }

                        // Default placeholder for templates without preview
                        return (
                          <div className="w-full aspect-video bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <Presentation className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Template Preview</p>
                            </div>
                          </div>
                        );
                      })()}
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
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsCreateNowDialogOpen(true);
                          }}
                          disabled={executeReportMutation.isPending}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {executeReportMutation.isPending ? 'Creating...' : 'Create Now'}
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
                            <DropdownMenuItem onClick={() => executeScheduledReportMutation.mutate(report.id)}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={scheduleForm.frequency}
                  onValueChange={(value) => setScheduleForm(prev => ({
                    ...prev,
                    frequency: value,
                    cronExpression: generateCronExpression(value, prev.dayOfWeek, prev.time)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleForm.frequency === 'weekly' && (
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select
                    value={scheduleForm.dayOfWeek}
                    onValueChange={(value) => setScheduleForm(prev => ({
                      ...prev,
                      dayOfWeek: value,
                      cronExpression: generateCronExpression(prev.frequency, value, prev.time)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scheduleForm.frequency === 'monthly' && (
                <div>
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Select
                    value={scheduleForm.dayOfMonth}
                    onValueChange={(value) => setScheduleForm(prev => ({
                      ...prev,
                      dayOfMonth: value,
                      cronExpression: generateCronExpression(prev.frequency, value, prev.time)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st</SelectItem>
                      <SelectItem value="15">15th</SelectItem>
                      <SelectItem value="last">Last day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Time</Label>
                <div className="space-y-3">
                  {/* Time Display */}
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-lg font-mono">
                        {(() => {
                          const [hour24, minute] = scheduleForm.time.split(':');
                          const hour12 = parseInt(hour24) === 0 ? 12 : parseInt(hour24) > 12 ? parseInt(hour24) - 12 : parseInt(hour24);
                          const ampm = parseInt(hour24) >= 12 ? 'PM' : 'AM';
                          return `${hour12}:${minute} ${ampm}`;
                        })()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const now = new Date();
                        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        setScheduleForm(prev => ({
                          ...prev,
                          time: currentTime,
                          cronExpression: generateCronExpression(prev.frequency, prev.dayOfWeek || prev.dayOfMonth, currentTime)
                        }));
                      }}
                    >
                      Now
                    </Button>
                  </div>
                  
                  {/* Time Controls */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 block mb-1">Hour</Label>
                      <Select
                        value={(() => {
                          const hour24 = parseInt(scheduleForm.time.split(':')[0]);
                          return hour24 === 0 ? '12' : hour24 > 12 ? (hour24 - 12).toString() : hour24.toString();
                        })()}
                        onValueChange={(value) => {
                          const currentHour24 = parseInt(scheduleForm.time.split(':')[0]);
                          const isAM = currentHour24 < 12;
                          let newHour24;
                          if (value === '12') {
                            newHour24 = isAM ? 0 : 12;
                          } else {
                            newHour24 = isAM ? parseInt(value) : parseInt(value) + 12;
                          }
                          const newTime = `${newHour24.toString().padStart(2, '0')}:${scheduleForm.time.split(':')[1]}`;
                          setScheduleForm(prev => ({
                            ...prev,
                            time: newTime,
                            cronExpression: generateCronExpression(prev.frequency, prev.dayOfWeek || prev.dayOfMonth, newTime)
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10 text-sm w-full min-w-[60px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = i + 1;
                            return (
                              <SelectItem key={i} value={hour.toString()}>
                                {hour.toString().padStart(2, '0')}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-600 block mb-1">Minute</Label>
                      <Select
                        value={scheduleForm.time.split(':')[1]}
                        onValueChange={(value) => {
                          const newTime = `${scheduleForm.time.split(':')[0]}:${value.padStart(2, '0')}`;
                          setScheduleForm(prev => ({
                            ...prev,
                            time: newTime,
                            cronExpression: generateCronExpression(prev.frequency, prev.dayOfWeek || prev.dayOfMonth, newTime)
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10 text-sm w-full min-w-[60px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => {
                            const minute = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={i} value={minute}>
                                {minute}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-600 block mb-1">AM/PM</Label>
                      <Select
                        value={parseInt(scheduleForm.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                        onValueChange={(value) => {
                          const currentHour24 = parseInt(scheduleForm.time.split(':')[0]);
                          let newHour24;
                          if (value === 'AM') {
                            newHour24 = currentHour24 >= 12 ? currentHour24 - 12 : currentHour24;
                          } else {
                            newHour24 = currentHour24 < 12 ? currentHour24 + 12 : currentHour24;
                          }
                          const newTime = `${newHour24.toString().padStart(2, '0')}:${scheduleForm.time.split(':')[1]}`;
                          setScheduleForm(prev => ({
                            ...prev,
                            time: newTime,
                            cronExpression: generateCronExpression(prev.frequency, prev.dayOfWeek || prev.dayOfMonth, newTime)
                          }));
                        }}
                      >
                        <SelectTrigger className="h-10 text-sm w-full min-w-[60px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {scheduleForm.frequency === 'custom' && (
              <div>
                <Label htmlFor="cronExpression">Custom Cron Expression</Label>
                <Input
                  value={scheduleForm.cronExpression}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, cronExpression: e.target.value }))}
                  placeholder="0 9 * * 1"
                />
                <p className="text-xs text-gray-500 mt-1">Example: "0 9 * * 1" = Every Monday at 9 AM</p>
              </div>
            )}

            {scheduleForm.frequency !== 'custom' && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Schedule:</strong> {getScheduleDescription(scheduleForm)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cron: {scheduleForm.cronExpression}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue="Africa/Cairo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Cairo">Cairo (GMT+2)</SelectItem>
                  <SelectItem value="Asia/Kuwait">Kuwait (GMT+3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createScheduledReportMutation.isPending}>
                {createScheduledReportMutation.isPending ? 'Scheduling...' : 'Schedule Report'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Now Dialog */}
      <Dialog open={isCreateNowDialogOpen} onOpenChange={setIsCreateNowDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Report Now</DialogTitle>
            <DialogDescription>
              Generate an immediate report from "{selectedTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={createNowForm.reportName}
                onChange={(e) => setCreateNowForm({ reportName: e.target.value })}
                placeholder="Enter report name..."
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Final name: "{selectedTemplate?.name} - {createNowForm.reportName || 'Report Name'}"
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateNowDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNow}
                disabled={executeReportMutation.isPending || !createNowForm.reportName.trim()}
              >
                {executeReportMutation.isPending ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}