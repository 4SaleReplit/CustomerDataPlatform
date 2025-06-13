import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PresentationModal } from '@/components/PresentationModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Plus, 
  Search,
  Calendar,
  Send,
  RefreshCw,
  Edit,
  Copy,
  Trash2,
  Play,
  Clock,
  Users,
  Mail,
  Settings,
  Eye,
  MoreHorizontal,
  Presentation,
  Image,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Report {
  id: string;
  name: string;
  description: string;
  slides: number;
  dataPoints: number;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  lastSent: string;
  lastExecution?: string;
  nextSend?: string;
  status: 'active' | 'paused' | 'draft';
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

interface ScheduledJob {
  id: string;
  reportName: string;
  schedule: string;
  nextRun: string;
  recipients: number;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
}

export function DataStudioReports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('reports');
  const [showNewReport, setShowNewReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>('');

  // Fetch presentations from database
  const { data: presentations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/presentations'],
    queryFn: async () => {
      const response = await fetch('/api/presentations');
      if (!response.ok) {
        throw new Error('Failed to fetch presentations');
      }
      return response.json();
    }
  });

  // Handle delete report
  const handleDeleteReport = async (reportId: string, reportName: string) => {
    if (!confirm(`Are you sure you want to delete the report "${reportName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/presentations/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert(`Report "${reportName}" deleted successfully!`);
        refetch(); // Refresh the list
      } else {
        throw new Error('Failed to delete report');
      }
    } catch (error) {
      console.error('Delete report error:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  // Transform presentations to match Report interface
  const reports: Report[] = presentations.map((presentation: any) => {
    // Calculate data points (chart/table elements) from slides
    let dataPoints = 0;
    if (presentation.slideIds?.length) {
      // Estimate based on slide count - will be improved with actual slide data
      dataPoints = Math.max(1, Math.floor(presentation.slideIds.length * 1.5));
    }

    const createdDate = new Date(presentation.createdAt);
    const modifiedDate = new Date(presentation.updatedAt || presentation.createdAt);

    return {
      id: presentation.id,
      name: presentation.title,
      description: presentation.description || 'Custom presentation created in Design Studio',
      slides: presentation.slideIds?.length || 0,
      dataPoints,
      schedule: 'manual' as const,
      recipients: [],
      lastSent: 'Never',
      lastExecution: presentation.lastExecution ? new Date(presentation.lastExecution).toLocaleDateString() : undefined,
      status: 'draft' as const,
      createdBy: presentation.createdBy || 'admin',
      createdAt: createdDate.toLocaleDateString(),
      lastModified: modifiedDate.toLocaleDateString()
    };
  });

  const scheduledJobs: ScheduledJob[] = [
    {
      id: '1',
      reportName: 'Weekly Executive Summary',
      schedule: 'Every Monday 8:00 AM',
      nextRun: 'in 5 days',
      recipients: 2,
      status: 'scheduled'
    },
    {
      id: '2',
      reportName: 'User Engagement Dashboard',
      schedule: 'Daily 9:00 AM',
      nextRun: 'in 23 hours',
      recipients: 2,
      status: 'scheduled'
    },
    {
      id: '3',
      reportName: 'Monthly Revenue Report',
      schedule: 'First Monday of month 10:00 AM',
      nextRun: 'in 3 weeks',
      recipients: 3,
      status: 'scheduled'
    }
  ];

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'running': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getScheduleIcon = (schedule: string) => {
    switch (schedule) {
      case 'daily': return <Clock className="h-4 w-4" />;
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'monthly': return <Calendar className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports Builder</h1>
            <p className="text-muted-foreground">
              Create automated slide-based reports with Canva-like builder and scheduling
            </p>
          </div>
          <Dialog open={showNewReport} onOpenChange={setShowNewReport}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input id="report-name" placeholder="Enter report name" />
                  </div>
                  <div>
                    <Label htmlFor="report-schedule">Schedule</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea id="report-description" placeholder="Enter report description" />
                </div>
                <div>
                  <Label htmlFor="report-recipients">Recipients (email addresses)</Label>
                  <Textarea 
                    id="report-recipients" 
                    placeholder="Enter email addresses separated by commas"
                    className="min-h-20"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-refresh" />
                  <Label htmlFor="auto-refresh">Auto-refresh data before sending</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewReport(false)}>Cancel</Button>
                  <Button onClick={() => {
                    setShowNewReport(false);
                    // Navigate to builder - would be handled by routing
                    window.location.href = '/reports/builder';
                  }}>Create & Open Builder</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="reports">All Reports</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading reports...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Failed to load reports</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reports found</p>
                <p className="text-sm text-gray-500">Create your first report in Design Studio</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Presentation className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-base">{report.name}</CardTitle>
                          <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                            {report.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setSelectedPresentationId(report.id);
                              setShowPresentationModal(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `/design-studio?presentationId=${report.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit in Design Studio
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh Data
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 mr-2" />
                              Send Now
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteReport(report.id, report.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {report.description}
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Presentation className="h-3 w-3" />
                            {report.slides} slides
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {report.dataPoints} data points
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {report.createdAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Modified {report.lastModified}
                          </span>
                        </div>
                        {report.lastExecution && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <RefreshCw className="h-3 w-3" />
                              Last execution: {report.lastExecution}
                            </span>
                            <span className="flex items-center gap-1">
                              {getScheduleIcon(report.schedule)}
                              {report.schedule}
                            </span>
                          </div>
                        )}
                        {report.schedule !== 'manual' && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last sent: {report.lastSent}</span>
                            {report.nextSend && (
                              <span className="text-green-600">Next: {report.nextSend}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4 mt-4">
            <div className="space-y-3">
              {scheduledJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{job.reportName}</h4>
                            <p className="text-sm text-muted-foreground">{job.schedule}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job.recipients} recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Next run: {job.nextRun}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Run Now
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Clock className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Executive Summary', description: 'High-level KPIs and trends', slides: 6, preview: 'executive.jpg' },
                { name: 'Sales Performance', description: 'Revenue and pipeline analysis', slides: 8, preview: 'sales.jpg' },
                { name: 'Marketing Report', description: 'Campaign performance and ROI', slides: 10, preview: 'marketing.jpg' },
                { name: 'Product Metrics', description: 'User engagement and feature usage', slides: 7, preview: 'product.jpg' },
                { name: 'Financial Overview', description: 'P&L and budget analysis', slides: 12, preview: 'financial.jpg' },
                { name: 'Customer Analytics', description: 'Customer behavior and satisfaction', slides: 9, preview: 'customer.jpg' },
              ].map((template) => (
                <Card key={template.name} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-3 flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-xs text-blue-600">Preview</p>
                      </div>
                    </div>
                    <h4 className="font-medium mb-1">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{template.slides} slides</span>
                      <Button size="sm" variant="outline">Use Template</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Presentation Modal */}
      <PresentationModal
        presentationId={selectedPresentationId}
        isOpen={showPresentationModal}
        onClose={() => {
          setShowPresentationModal(false);
          setSelectedPresentationId('');
        }}
      />
    </div>
  );
}