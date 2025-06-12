import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  Save, 
  Send, 
  RefreshCw, 
  Eye, 
  Download,
  Upload,
  Copy,
  Trash2,
  Move,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Type,
  Image,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Target,
  Layers,
  MousePointer,
  Square,
  Circle,
  Settings,
  ArrowLeft,
  Edit3,
  Play,
  Palette,
  FileText
} from 'lucide-react';
import { CodeMirrorSQLEditor } from '@/components/dashboard/CodeMirrorSQLEditor';

interface SlideElement {
  id: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: any;
  style: {
    fontSize?: number;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
  };
}

interface Slide {
  id: string;
  name: string;
  elements: SlideElement[];
  backgroundColor: string;
}

interface Report {
  id: string;
  name: string;
  description: string;
  slides: Slide[];
  settings: {
    schedule: string;
    recipients: string[];
    autoRefresh: boolean;
  };
  lastModified?: string;
  status?: 'draft' | 'published' | 'scheduled';
}

export function ReportBuilder() {
  const [view, setView] = useState<'list' | 'designer'>('list');
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      name: 'Weekly Executive Summary',
      description: 'High-level KPIs and trends for leadership team',
      lastModified: '2 hours ago',
      status: 'published',
      slides: [
        {
          id: '1',
          name: 'Title Slide',
          elements: [
            {
              id: 'title-1',
              type: 'text',
              x: 100,
              y: 200,
              width: 600,
              height: 80,
              content: 'Weekly Executive Summary',
              style: {
                fontSize: 48,
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#ffffff',
                backgroundColor: 'transparent'
              }
            }
          ],
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      ],
      settings: {
        schedule: 'weekly',
        recipients: ['team@company.com'],
        autoRefresh: true
      }
    },
    {
      id: '2',
      name: 'Monthly Performance Report',
      description: 'Comprehensive performance metrics and analysis',
      lastModified: '1 day ago',
      status: 'draft',
      slides: [
        {
          id: '2',
          name: 'Cover',
          elements: [],
          backgroundColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
        }
      ],
      settings: {
        schedule: 'monthly',
        recipients: [],
        autoRefresh: true
      }
    },
    {
      id: '3',
      name: 'Sales Dashboard',
      description: 'Real-time sales metrics and forecasting',
      lastModified: '3 days ago',
      status: 'scheduled',
      slides: [
        {
          id: '3',
          name: 'Dashboard',
          elements: [],
          backgroundColor: '#ffffff'
        }
      ],
      settings: {
        schedule: 'daily',
        recipients: ['sales@company.com'],
        autoRefresh: true
      }
    }
  ]);

  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('elements');
  const [zoom, setZoom] = useState(75);
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSQLEditor, setShowSQLEditor] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const currentSlide = currentReport?.slides[currentSlideIndex];

  const openDesigner = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      setCurrentReport(report);
      setView('designer');
      setCurrentSlideIndex(0);
      setSelectedElement(null);
    }
  };

  const createNewReport = () => {
    const newReport: Report = {
      id: Date.now().toString(),
      name: 'Untitled Report',
      description: 'New presentation report',
      lastModified: 'Just now',
      status: 'draft',
      slides: [
        {
          id: Date.now().toString(),
          name: 'Title Slide',
          elements: [],
          backgroundColor: '#ffffff'
        }
      ],
      settings: {
        schedule: 'weekly',
        recipients: [],
        autoRefresh: true
      }
    };
    setReports([newReport, ...reports]);
    openDesigner(newReport.id);
  };

  const duplicateReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const newReport: Report = {
        ...report,
        id: Date.now().toString(),
        name: `${report.name} Copy`,
        lastModified: 'Just now',
        status: 'draft'
      };
      setReports([newReport, ...reports]);
    }
  };

  const deleteReport = (reportId: string) => {
    setReports(reports.filter(r => r.id !== reportId));
  };

  const elementTemplates = [
    { type: 'text', icon: Type, label: 'Heading', defaultContent: 'Your Heading Here', category: 'text' },
    { type: 'text', icon: FileText, label: 'Body Text', defaultContent: 'Add your body text here. This is where you can describe your insights and findings.', category: 'text' },
    { type: 'chart', icon: BarChart3, label: 'Bar Chart', defaultContent: { chartType: 'bar', query: '', title: 'Chart Title' }, category: 'data' },
    { type: 'chart', icon: LineChart, label: 'Line Chart', defaultContent: { chartType: 'line', query: '', title: 'Trend Analysis' }, category: 'data' },
    { type: 'chart', icon: PieChart, label: 'Pie Chart', defaultContent: { chartType: 'pie', query: '', title: 'Distribution' }, category: 'data' },
    { type: 'table', icon: Table, label: 'Data Table', defaultContent: { query: '', title: 'Data Overview' }, category: 'data' },
    { type: 'metric', icon: TrendingUp, label: 'KPI Card', defaultContent: { query: '', label: 'Key Metric', value: '0', change: '+0%' }, category: 'data' },
    { type: 'image', icon: Image, label: 'Image', defaultContent: { src: '', alt: 'Image' }, category: 'media' },
    { type: 'shape', icon: Square, label: 'Rectangle', defaultContent: { shape: 'rectangle' }, category: 'shapes' },
    { type: 'shape', icon: Circle, label: 'Circle', defaultContent: { shape: 'circle' }, category: 'shapes' },
  ];

  const slideTemplates = [
    {
      name: 'Title Slide',
      thumbnail: '📊',
      elements: [
        { type: 'text', content: 'Presentation Title', x: 50, y: 200, width: 700, height: 80, style: { fontSize: 48, fontWeight: 'bold', textAlign: 'center' } },
        { type: 'text', content: 'Subtitle or description', x: 50, y: 300, width: 700, height: 40, style: { fontSize: 24, textAlign: 'center', color: '#666' } }
      ]
    },
    {
      name: 'Content Slide',
      thumbnail: '📈',
      elements: [
        { type: 'text', content: 'Slide Title', x: 50, y: 50, width: 700, height: 60, style: { fontSize: 36, fontWeight: 'bold' } },
        { type: 'chart', content: { chartType: 'bar', title: 'Performance Data' }, x: 50, y: 150, width: 350, height: 300 },
        { type: 'text', content: 'Key insights and analysis go here.', x: 450, y: 150, width: 300, height: 300, style: { fontSize: 16 } }
      ]
    },
    {
      name: 'Metrics Dashboard',
      thumbnail: '📊',
      elements: [
        { type: 'text', content: 'Key Metrics', x: 50, y: 50, width: 700, height: 60, style: { fontSize: 36, fontWeight: 'bold' } },
        { type: 'metric', content: { label: 'Total Users', value: '156K', change: '+12%' }, x: 50, y: 150, width: 200, height: 120 },
        { type: 'metric', content: { label: 'Revenue', value: '$2.4M', change: '+8%' }, x: 300, y: 150, width: 200, height: 120 },
        { type: 'metric', content: { label: 'Conversion', value: '3.8%', change: '+0.3%' }, x: 550, y: 150, width: 200, height: 120 }
      ]
    }
  ];

  const backgroundTemplates = [
    { name: 'Clean White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f8f9fa' },
    { name: 'Professional Blue', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Corporate Green', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    { name: 'Modern Purple', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Warm Orange', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Dark Theme', value: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' }
  ];

  const predefinedQueries = [
    {
      name: 'Total Users',
      query: 'SELECT COUNT(*) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
      type: 'metric'
    },
    {
      name: 'Revenue Trend',
      query: 'SELECT DATE_TRUNC(\'month\', created_at) as month, SUM(revenue) as total FROM revenue_table GROUP BY month ORDER BY month',
      type: 'line_chart'
    },
    {
      name: 'User Distribution',
      query: 'SELECT segment, COUNT(*) as count FROM user_segments GROUP BY segment',
      type: 'pie_chart'
    }
  ];

  const addElement = (template: any) => {
    if (!currentSlide || !currentReport) return;
    
    const newElement: SlideElement = {
      id: Date.now().toString(),
      type: template.type,
      x: 100,
      y: 100,
      width: template.type === 'text' ? 300 : 250,
      height: template.type === 'text' ? 50 : 200,
      content: template.defaultContent,
      style: {
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#000000',
        backgroundColor: 'transparent'
      }
    };

    const updatedSlides = [...currentReport.slides];
    updatedSlides[currentSlideIndex].elements.push(newElement);
    const updatedReport = { ...currentReport, slides: updatedSlides };
    setCurrentReport(updatedReport);
    updateReportInList(updatedReport);
  };

  const addSlide = () => {
    if (!currentReport) return;
    
    const newSlide: Slide = {
      id: Date.now().toString(),
      name: `Slide ${currentReport.slides.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff'
    };
    const updatedReport = { 
      ...currentReport, 
      slides: [...currentReport.slides, newSlide] 
    };
    setCurrentReport(updatedReport);
    updateReportInList(updatedReport);
    setCurrentSlideIndex(currentReport.slides.length);
  };

  const deleteElement = (elementId: string) => {
    if (!currentReport) return;
    
    const updatedSlides = [...currentReport.slides];
    updatedSlides[currentSlideIndex].elements = updatedSlides[currentSlideIndex].elements.filter(
      el => el.id !== elementId
    );
    const updatedReport = { ...currentReport, slides: updatedSlides };
    setCurrentReport(updatedReport);
    updateReportInList(updatedReport);
    setSelectedElement(null);
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    if (!currentReport) return;
    
    const updatedSlides = [...currentReport.slides];
    const elementIndex = updatedSlides[currentSlideIndex].elements.findIndex(
      el => el.id === elementId
    );
    if (elementIndex !== -1) {
      updatedSlides[currentSlideIndex].elements[elementIndex] = {
        ...updatedSlides[currentSlideIndex].elements[elementIndex],
        ...updates
      };
      const updatedReport = { ...currentReport, slides: updatedSlides };
      setCurrentReport(updatedReport);
      updateReportInList(updatedReport);
    }
  };

  const updateReportInList = (updatedReport: Report) => {
    setReports(reports.map(r => r.id === updatedReport.id ? updatedReport : r));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  };

  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-pointer border-2 ${isSelected ? 'border-blue-500' : 'border-transparent'} hover:border-blue-300`}
        style={{
          left: element.x * (zoom / 100),
          top: element.y * (zoom / 100),
          width: element.width * (zoom / 100),
          height: element.height * (zoom / 100),
          fontSize: (element.style.fontSize || 16) * (zoom / 100),
          color: element.style.color,
          backgroundColor: element.style.backgroundColor,
          textAlign: element.style.textAlign,
          fontWeight: element.style.fontWeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
          padding: '8px',
          boxSizing: 'border-box'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element.id);
        }}
      >
        {element.type === 'text' && (
          <div style={{ width: '100%', height: '100%' }}>
            {typeof element.content === 'string' ? element.content : 'Text Element'}
          </div>
        )}
        {element.type === 'chart' && (
          <div className="w-full h-full bg-gray-100 border rounded flex items-center justify-center text-gray-500">
            <BarChart3 className="h-8 w-8" />
            <span className="ml-2">Chart</span>
          </div>
        )}
        {element.type === 'metric' && (
          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-blue-100 border rounded p-4">
            <div className="text-2xl font-bold text-blue-900">
              {element.content?.value || '0'}
            </div>
            <div className="text-sm text-blue-600">
              {element.content?.label || 'Metric'}
            </div>
          </div>
        )}
        {element.type === 'shape' && (
          <div 
            className="w-full h-full border-2 border-gray-400"
            style={{
              borderRadius: element.content?.shape === 'circle' ? '50%' : '0',
              backgroundColor: element.style.backgroundColor || 'transparent'
            }}
          />
        )}
      </div>
    );
  };

  if (view === 'list') {
    return (
      <div className="h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports Builder</h1>
              <p className="text-gray-600 mt-1">Create and manage presentation reports with live data</p>
            </div>
            <Button onClick={createNewReport} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                    <Badge 
                      variant={report.status === 'published' ? 'default' : report.status === 'scheduled' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-4xl opacity-50">📊</div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{report.slides.length} slides</span>
                    <span>{report.lastModified}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => openDesigner(report.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => duplicateReport(report.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Create New Card */}
            <Card 
              className="border-dashed border-2 border-gray-300 hover:border-blue-500 cursor-pointer transition-colors"
              onClick={createNewReport}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
                <Plus className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Create New Report</h3>
                <p className="text-sm text-center">Start building a new presentation report with data visualizations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Designer View
  return (
    <div className="h-full flex bg-gray-50">
      {/* Left Sidebar - Design Panel */}
      <div className="w-80 border-r bg-white shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setView('list')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Design Studio</h2>
              <p className="text-sm text-gray-600">{currentReport?.name}</p>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5 mx-4 mt-4">
            <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
            <TabsTrigger value="backgrounds" className="text-xs">Backgrounds</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
            <TabsTrigger value="slides" className="text-xs">Slides Designer</TabsTrigger>
          </TabsList>

          <TabsContent value="elements" className="px-4 pb-4 h-full overflow-y-auto">
            <div className="space-y-6 mt-4">
              {/* Text Elements */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Text</h4>
                <div className="grid grid-cols-2 gap-2">
                  {elementTemplates.filter(t => t.category === 'text').map((template, index) => {
                    const Icon = template.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-16 flex flex-col gap-1"
                        onClick={() => addElement(template)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{template.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Data Visualizations */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Data Viz</h4>
                <div className="grid grid-cols-2 gap-2">
                  {elementTemplates.filter(t => t.category === 'data').map((template, index) => {
                    const Icon = template.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-16 flex flex-col gap-1"
                        onClick={() => addElement(template)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{template.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Shapes */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Shapes</h4>
                <div className="grid grid-cols-3 gap-2">
                  {elementTemplates.filter(t => t.category === 'shapes').map((template, index) => {
                    const Icon = template.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-12 flex flex-col gap-1"
                        onClick={() => addElement(template)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="px-4 pb-4 h-full overflow-y-auto">
            <div className="space-y-4 mt-4">
              <h4 className="font-medium text-sm uppercase tracking-wide">Slide Templates</h4>
              <div className="space-y-3">
                {slideTemplates.map((template, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (!currentReport) return;
                      const newSlide: Slide = {
                        id: Date.now().toString(),
                        name: template.name,
                        elements: template.elements.map((el: any, i: number) => ({
                          id: `${Date.now()}-${i}`,
                          type: el.type as any,
                          x: el.x,
                          y: el.y,
                          width: el.width,
                          height: el.height,
                          content: el.content,
                          style: { ...el.style, backgroundColor: 'transparent' }
                        })),
                        backgroundColor: '#ffffff'
                      };
                      const updatedReport = { ...currentReport, slides: [...currentReport.slides, newSlide] };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                      setCurrentSlideIndex(currentReport.slides.length);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-3 flex items-center justify-center text-3xl">
                        {template.thumbnail}
                      </div>
                      <h5 className="font-medium text-sm">{template.name}</h5>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="backgrounds" className="px-4 pb-4 h-full overflow-y-auto">
            <div className="space-y-4 mt-4">
              <h4 className="font-medium text-sm uppercase tracking-wide">Backgrounds</h4>
              <div className="grid grid-cols-2 gap-3">
                {backgroundTemplates.map((bg, index) => (
                  <div
                    key={index}
                    className="aspect-video rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                    style={{ background: bg.value }}
                    onClick={() => {
                      if (!currentReport) return;
                      const updatedSlides = [...currentReport.slides];
                      updatedSlides[currentSlideIndex].backgroundColor = bg.value;
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                    }}
                  >
                    <div className="w-full h-full rounded-lg flex items-end p-2">
                      <span className="text-xs bg-black/50 text-white px-2 py-1 rounded">
                        {bg.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="px-4 pb-4 h-full overflow-y-auto">
            <div className="space-y-4 mt-4">
              <h4 className="font-medium text-sm uppercase tracking-wide">Data Sources</h4>
              <div className="space-y-2">
                {predefinedQueries.map((query, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setCurrentQuery(query.query);
                      setShowSQLEditor(true);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">{query.name}</h5>
                          <p className="text-xs text-muted-foreground">{query.type} visualization</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setShowSQLEditor(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Custom Query
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="slides" className="px-4 pb-4 h-full overflow-y-auto">
            <div className="space-y-6 mt-4">
              {/* Slide Management */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Slide Management</h4>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={addSlide}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Slide
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      if (!currentReport || !currentSlide) return;
                      const newSlide: Slide = {
                        ...currentSlide,
                        id: Date.now().toString(),
                        name: `${currentSlide.name} Copy`,
                        elements: currentSlide.elements.map(el => ({
                          ...el,
                          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        }))
                      };
                      const updatedReport = { 
                        ...currentReport, 
                        slides: [...currentReport.slides, newSlide] 
                      };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                      setCurrentSlideIndex(currentReport.slides.length);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Current Slide
                  </Button>
                  {currentReport && currentReport.slides.length > 1 && (
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => {
                        if (!currentReport) return;
                        const updatedSlides = currentReport.slides.filter((_, index) => index !== currentSlideIndex);
                        const updatedReport = { ...currentReport, slides: updatedSlides };
                        setCurrentReport(updatedReport);
                        updateReportInList(updatedReport);
                        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Current Slide
                    </Button>
                  )}
                </div>
              </div>

              {/* Layout Presets */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Layout Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() => {
                      if (!currentReport) return;
                      const titleElement: SlideElement = {
                        id: Date.now().toString(),
                        type: 'text',
                        x: 100,
                        y: 50,
                        width: 600,
                        height: 80,
                        content: 'Slide Title',
                        style: { fontSize: 36, fontWeight: 'bold', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                      };
                      const updatedSlides = [...currentReport.slides];
                      updatedSlides[currentSlideIndex].elements = [titleElement];
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                    }}
                  >
                    <Type className="h-5 w-5" />
                    <span className="text-xs">Title Only</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() => {
                      if (!currentReport) return;
                      const elements: SlideElement[] = [
                        {
                          id: `${Date.now()}-1`,
                          type: 'text',
                          x: 50,
                          y: 50,
                          width: 300,
                          height: 60,
                          content: 'Title',
                          style: { fontSize: 28, fontWeight: 'bold', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-2`,
                          type: 'chart',
                          x: 400,
                          y: 50,
                          width: 350,
                          height: 300,
                          content: { chartType: 'bar', title: 'Chart' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        }
                      ];
                      const updatedSlides = [...currentReport.slides];
                      updatedSlides[currentSlideIndex].elements = elements;
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                    }}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Title + Chart</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() => {
                      if (!currentReport) return;
                      const elements: SlideElement[] = [
                        {
                          id: `${Date.now()}-1`,
                          type: 'metric',
                          x: 50,
                          y: 100,
                          width: 200,
                          height: 120,
                          content: { label: 'KPI 1', value: '100%', change: '+5%' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'center', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-2`,
                          type: 'metric',
                          x: 300,
                          y: 100,
                          width: 200,
                          height: 120,
                          content: { label: 'KPI 2', value: '85%', change: '+2%' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'center', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-3`,
                          type: 'metric',
                          x: 550,
                          y: 100,
                          width: 200,
                          height: 120,
                          content: { label: 'KPI 3', value: '92%', change: '+8%' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'center', color: '#000000', backgroundColor: 'transparent' }
                        }
                      ];
                      const updatedSlides = [...currentReport.slides];
                      updatedSlides[currentSlideIndex].elements = elements;
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                    }}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs">KPI Dashboard</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() => {
                      if (!currentReport) return;
                      const elements: SlideElement[] = [
                        {
                          id: `${Date.now()}-1`,
                          type: 'text',
                          x: 50,
                          y: 50,
                          width: 350,
                          height: 60,
                          content: 'Analysis Title',
                          style: { fontSize: 28, fontWeight: 'bold', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-2`,
                          type: 'text',
                          x: 50,
                          y: 150,
                          width: 350,
                          height: 200,
                          content: 'Key insights and detailed analysis will be presented here. This layout provides ample space for explanatory text.',
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-3`,
                          type: 'chart',
                          x: 450,
                          y: 50,
                          width: 300,
                          height: 300,
                          content: { chartType: 'line', title: 'Supporting Data' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        }
                      ];
                      const updatedSlides = [...currentReport.slides];
                      updatedSlides[currentSlideIndex].elements = elements;
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                    }}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Text + Chart</span>
                  </Button>
                </div>
              </div>

              {/* Design Tools */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Design Tools</h4>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      if (!currentReport) return;
                      // Clear all elements
                      const updatedSlides = [...currentReport.slides];
                      updatedSlides[currentSlideIndex].elements = [];
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                      setSelectedElement(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Elements
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => {
                      if (!currentReport || !currentSlide) return;
                      // Reset slide background to white
                      const updatedSlides = [...currentReport.slides];
                      updatedSlides[currentSlideIndex].backgroundColor = '#ffffff';
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                    }}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Reset Background
                  </Button>
                </div>
              </div>

              {/* Slide Settings */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Slide Settings</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Slide Name</Label>
                    <Input 
                      className="mt-1"
                      value={currentSlide?.name || ''}
                      onChange={(e) => {
                        if (!currentReport) return;
                        const updatedSlides = [...currentReport.slides];
                        updatedSlides[currentSlideIndex].name = e.target.value;
                        const updatedReport = { ...currentReport, slides: updatedSlides };
                        setCurrentReport(updatedReport);
                        updateReportInList(updatedReport);
                      }}
                      placeholder="Enter slide name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Slide Order</Label>
                    <div className="flex gap-1 mt-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentSlideIndex === 0}
                        onClick={() => {
                          if (!currentReport || currentSlideIndex === 0) return;
                          const updatedSlides = [...currentReport.slides];
                          [updatedSlides[currentSlideIndex - 1], updatedSlides[currentSlideIndex]] = 
                          [updatedSlides[currentSlideIndex], updatedSlides[currentSlideIndex - 1]];
                          const updatedReport = { ...currentReport, slides: updatedSlides };
                          setCurrentReport(updatedReport);
                          updateReportInList(updatedReport);
                          setCurrentSlideIndex(currentSlideIndex - 1);
                        }}
                      >
                        ←
                      </Button>
                      <span className="flex-1 text-center text-sm py-1">
                        {currentSlideIndex + 1} of {currentReport?.slides.length}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!currentReport || currentSlideIndex === currentReport.slides.length - 1}
                        onClick={() => {
                          if (!currentReport || currentSlideIndex === currentReport.slides.length - 1) return;
                          const updatedSlides = [...currentReport.slides];
                          [updatedSlides[currentSlideIndex], updatedSlides[currentSlideIndex + 1]] = 
                          [updatedSlides[currentSlideIndex + 1], updatedSlides[currentSlideIndex]];
                          const updatedReport = { ...currentReport, slides: updatedSlides };
                          setCurrentReport(updatedReport);
                          updateReportInList(updatedReport);
                          setCurrentSlideIndex(currentSlideIndex + 1);
                        }}
                      >
                        →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Export & Preview</h4>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {previewMode ? 'Exit' : 'Start'} Presentation Mode
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Export as Images
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Toolbar */}
        <div className="border-b p-3 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-gray-700">
              {currentReport?.name}
            </div>
            <Badge variant="secondary" className="text-xs">
              Slide {currentSlideIndex + 1} of {currentReport?.slides.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="border-b p-2 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? 'bg-blue-100' : ''}
            >
              <Grid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            {selectedElement && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={() => selectedElement && deleteElement(selectedElement)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-16 text-center bg-white border rounded px-2 py-1">
              {zoom}%
            </span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center">
          <div 
            ref={canvasRef}
            className="bg-white shadow-2xl relative border"
            style={{
              width: 1000 * (zoom / 100),
              height: 700 * (zoom / 100),
              background: currentSlide?.backgroundColor || '#ffffff',
              backgroundImage: showGrid ? 'url("data:image/svg+xml,%3Csvg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23e5e7eb" fill-opacity="0.3"%3E%3Ccircle cx="1" cy="1" r="1"/%3E%3C/g%3E%3C/svg%3E")' : 'none'
            }}
            onClick={handleCanvasClick}
          >
            {currentSlide?.elements.map(renderElement)}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Slides & Properties */}
      <div className="w-80 border-l bg-white shadow-sm flex flex-col">
        {/* Slides Panel */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Slides</h3>
            <Button size="sm" onClick={addSlide} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Slide
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentReport?.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
                  index === currentSlideIndex 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => setCurrentSlideIndex(index)}
              >
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 border rounded mb-2 relative overflow-hidden flex items-center justify-center">
                  <div className="text-2xl opacity-50">
                    {index === 0 ? '📊' : '📈'}
                  </div>
                  <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1 rounded">
                    {slide.elements.length}
                  </div>
                </div>
                <div className="text-sm font-medium truncate">{slide.name}</div>
                <div className="text-xs text-gray-500">Slide {index + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="flex-1 p-4 overflow-y-auto">
          {selectedElement ? (
            <div className="space-y-4">
              <h3 className="font-semibold">Element Properties</h3>
              
              {/* Element info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium">
                  {elementTemplates.find(t => t.type === currentSlide?.elements.find(e => e.id === selectedElement)?.type)?.label || 'Element'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ID: {selectedElement.slice(-8)}
                </div>
              </div>

              {/* Style controls */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Position & Size</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input 
                        type="number" 
                        className="h-8"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.x || 0}
                        onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input 
                        type="number" 
                        className="h-8"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.y || 0}
                        onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input 
                        type="number" 
                        className="h-8"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.width || 0}
                        onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input 
                        type="number" 
                        className="h-8"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.height || 0}
                        onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Font Size</Label>
                  <Slider
                    value={[currentSlide?.elements.find(e => e.id === selectedElement)?.style?.fontSize || 16]}
                    onValueChange={(values) => {
                      const element = currentSlide?.elements.find(e => e.id === selectedElement);
                      if (element) {
                        updateElement(selectedElement, {
                          style: { ...element.style, fontSize: values[0] }
                        });
                      }
                    }}
                    max={72}
                    min={8}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {currentSlide?.elements.find(e => e.id === selectedElement)?.style?.fontSize || 16}px
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Text Align</Label>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {['left', 'center', 'right'].map((align) => (
                      <Button
                        key={align}
                        variant="outline"
                        size="sm"
                        className={`h-8 ${
                          currentSlide?.elements.find(e => e.id === selectedElement)?.style?.textAlign === align
                            ? 'bg-blue-100'
                            : ''
                        }`}
                        onClick={() => {
                          const element = currentSlide?.elements.find(e => e.id === selectedElement);
                          if (element) {
                            updateElement(selectedElement, {
                              style: { ...element.style, textAlign: align as any }
                            });
                          }
                        }}
                      >
                        {align}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <MousePointer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select an element to edit properties</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SQL Editor Dialog */}
      <Dialog open={showSQLEditor} onOpenChange={setShowSQLEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>SQL Query Editor</DialogTitle>
          </DialogHeader>
          <div className="h-96">
            <CodeMirrorSQLEditor
              value={currentQuery}
              onChange={setCurrentQuery}
              onExecute={() => {
                console.log('Executing query:', currentQuery);
                setShowSQLEditor(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}