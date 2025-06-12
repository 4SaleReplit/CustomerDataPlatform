import React, { useState, useRef, useCallback } from 'react';
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
  Triangle,
  Minus,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { CodeMirrorSQLEditor } from '@/components/dashboard/CodeMirrorSQLEditor';

interface SlideElement {
  id: string;
  type: 'text' | 'chart' | 'image' | 'table' | 'metric' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: any;
  style: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: string;
    borderRadius?: number;
    border?: string;
    padding?: number;
  };
}

interface Slide {
  id: string;
  name: string;
  elements: SlideElement[];
  backgroundColor: string;
  backgroundImage?: string;
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
}

export function ReportBuilder() {
  const [report, setReport] = useState<Report>({
    id: '1',
    name: 'Weekly Executive Summary',
    description: 'High-level KPIs and trends for leadership team',
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
              color: '#1a1a1a',
              backgroundColor: 'transparent'
            }
          },
          {
            id: 'subtitle-1',
            type: 'text',
            x: 100,
            y: 300,
            width: 600,
            height: 40,
            content: 'Key Performance Indicators & Business Insights',
            style: {
              fontSize: 24,
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#666666',
              backgroundColor: 'transparent'
            }
          }
        ],
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    ],
    settings: {
      schedule: 'weekly',
      recipients: [],
      autoRefresh: true
    }
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showElementEditor, setShowElementEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('elements');
  const [zoom, setZoom] = useState(75);
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSQLEditor, setShowSQLEditor] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const currentSlide = report.slides[currentSlideIndex];

  const elementTemplates = [
    { type: 'text', icon: Type, label: 'Heading', defaultContent: 'Your Heading Here', category: 'text' },
    { type: 'text', icon: Type, label: 'Body Text', defaultContent: 'Add your body text here. This is where you can describe your insights and findings.', category: 'text' },
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
        { type: 'text', content: 'Key insights and analysis go here. Explain what the data shows and its implications.', x: 450, y: 150, width: 300, height: 300, style: { fontSize: 16, lineHeight: 1.6 } }
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
    },
    {
      name: 'Two Column',
      thumbnail: '📋',
      elements: [
        { type: 'text', content: 'Section Title', x: 50, y: 50, width: 700, height: 60, style: { fontSize: 36, fontWeight: 'bold' } },
        { type: 'text', content: 'Left Column Content', x: 50, y: 150, width: 325, height: 300, style: { fontSize: 16 } },
        { type: 'text', content: 'Right Column Content', x: 425, y: 150, width: 325, height: 300, style: { fontSize: 16 } }
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
      query: 'SELECT COUNT(DISTINCT user_id) as total_users FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
      type: 'metric'
    },
    {
      name: 'Revenue Trend',
      query: 'SELECT DATE_TRUNC(\'month\', created_at) as month, SUM(total_revenue) as revenue FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 GROUP BY month ORDER BY month',
      type: 'line'
    },
    {
      name: 'User Segments',
      query: 'SELECT segment_tier, COUNT(*) as count FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 GROUP BY segment_tier',
      type: 'pie'
    },
    {
      name: 'Top Revenue Users',
      query: 'SELECT user_id, email, total_revenue FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 ORDER BY total_revenue DESC LIMIT 10',
      type: 'table'
    }
  ];

  const addElement = (template: any) => {
    const newElement: SlideElement = {
      id: Date.now().toString(),
      type: template.type,
      x: 50,
      y: 50,
      width: template.type === 'text' ? 200 : template.type === 'metric' ? 150 : 300,
      height: template.type === 'text' ? 50 : template.type === 'metric' ? 100 : 200,
      content: template.defaultContent,
      style: {
        backgroundColor: template.type === 'text' ? 'transparent' : '#ffffff',
        color: '#000000',
        fontSize: template.type === 'text' ? 16 : 14,
        fontWeight: template.type === 'text' ? 'normal' : 'normal',
        textAlign: 'left',
        borderRadius: 4,
        border: template.type === 'shape' ? '2px solid #000000' : '1px solid #e5e7eb',
        padding: 12
      }
    };

    const updatedSlides = [...report.slides];
    updatedSlides[currentSlideIndex].elements.push(newElement);
    setReport({ ...report, slides: updatedSlides });
    setSelectedElement(newElement.id);
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      name: `Slide ${report.slides.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff'
    };
    setReport({ ...report, slides: [...report.slides, newSlide] });
    setCurrentSlideIndex(report.slides.length);
  };

  const duplicateSlide = () => {
    const slideToClone = { ...currentSlide };
    slideToClone.id = Date.now().toString();
    slideToClone.name = `${slideToClone.name} Copy`;
    slideToClone.elements = slideToClone.elements.map(el => ({
      ...el,
      id: Date.now().toString() + Math.random()
    }));
    
    const updatedSlides = [...report.slides];
    updatedSlides.splice(currentSlideIndex + 1, 0, slideToClone);
    setReport({ ...report, slides: updatedSlides });
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const deleteSlide = () => {
    if (report.slides.length > 1) {
      const updatedSlides = report.slides.filter((_, index) => index !== currentSlideIndex);
      setReport({ ...report, slides: updatedSlides });
      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    }
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    const updatedSlides = [...report.slides];
    const elementIndex = updatedSlides[currentSlideIndex].elements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      updatedSlides[currentSlideIndex].elements[elementIndex] = {
        ...updatedSlides[currentSlideIndex].elements[elementIndex],
        ...updates
      };
      setReport({ ...report, slides: updatedSlides });
    }
  };

  const deleteElement = (elementId: string) => {
    const updatedSlides = [...report.slides];
    updatedSlides[currentSlideIndex].elements = updatedSlides[currentSlideIndex].elements.filter(
      el => el.id !== elementId
    );
    setReport({ ...report, slides: updatedSlides });
    setSelectedElement(null);
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
        className={`absolute cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          backgroundColor: element.style.backgroundColor,
          color: element.style.color,
          fontSize: element.style.fontSize,
          fontWeight: element.style.fontWeight,
          textAlign: element.style.textAlign as any,
          borderRadius: element.style.borderRadius,
          border: element.style.border,
          padding: element.style.padding
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element.id);
        }}
      >
        {element.type === 'text' && (
          <div className="w-full h-full flex items-center">
            {element.content}
          </div>
        )}
        {element.type === 'chart' && (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
            {element.content.chartType === 'bar' && <BarChart3 className="h-12 w-12 text-gray-400" />}
            {element.content.chartType === 'line' && <LineChart className="h-12 w-12 text-gray-400" />}
            {element.content.chartType === 'pie' && <PieChart className="h-12 w-12 text-gray-400" />}
            <div className="ml-2 text-sm text-gray-500">
              {element.content.chartType} Chart
            </div>
          </div>
        )}
        {element.type === 'table' && (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
            <Table className="h-12 w-12 text-gray-400" />
            <div className="ml-2 text-sm text-gray-500">Data Table</div>
          </div>
        )}
        {element.type === 'metric' && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">123.4K</div>
            <div className="text-sm text-blue-500">{element.content.label}</div>
          </div>
        )}
        {element.type === 'image' && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
            <Image className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {element.type === 'shape' && (
          <div 
            className="w-full h-full"
            style={{
              backgroundColor: element.style.backgroundColor || 'transparent',
              borderRadius: element.content.shape === 'circle' ? '50%' : element.style.borderRadius
            }}
          />
        )}
        
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Left Sidebar - Design Panel */}
      <div className="w-80 border-r bg-white shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Design Panel</h2>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
            <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
            <TabsTrigger value="backgrounds" className="text-xs">Backgrounds</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
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

              {/* Media */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Media</h4>
                <div className="grid grid-cols-2 gap-2">
                  {elementTemplates.filter(t => t.category === 'media').map((template, index) => {
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
                      const newSlide: Slide = {
                        id: Date.now().toString(),
                        name: template.name,
                        elements: template.elements.map((el, i) => ({
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
                      setReport({ ...report, slides: [...report.slides, newSlide] });
                      setCurrentSlideIndex(report.slides.length);
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
                      const updatedSlides = [...report.slides];
                      updatedSlides[currentSlideIndex].backgroundColor = bg.value;
                      setReport({ ...report, slides: updatedSlides });
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
                          <Database className="h-4 w-4 text-blue-600" />
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
        </Tabs>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Toolbar */}
        <div className="border-b p-3 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-gray-700">
              {report.name}
            </div>
            <Badge variant="secondary" className="text-xs">
              Slide {currentSlideIndex + 1} of {report.slides.length}
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
              background: currentSlide.backgroundColor,
              backgroundImage: showGrid ? 'url("data:image/svg+xml,%3Csvg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23e5e7eb" fill-opacity="0.3"%3E%3Ccircle cx="1" cy="1" r="1"/%3E%3C/g%3E%3C/svg%3E")' : 'none'
            }}
            onClick={handleCanvasClick}
          >
            {currentSlide.elements.map(renderElement)}
            
            {/* Rulers */}
            {showGrid && (
              <>
                <div className="absolute top-0 left-0 w-full h-4 bg-white border-b flex">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} className="flex-1 border-r border-gray-200 text-xs text-gray-400 text-center">
                      {i * 50}
                    </div>
                  ))}
                </div>
                <div className="absolute top-0 left-0 w-4 h-full bg-white border-r flex flex-col">
                  {Array.from({ length: 14 }, (_, i) => (
                    <div key={i} className="flex-1 border-b border-gray-200 text-xs text-gray-400 text-center writing-mode-vertical">
                      {i * 50}
                    </div>
                  ))}
                </div>
              </>
            )}
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
            {report.slides.map((slide, index) => (
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

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={duplicateSlide}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1" 
              onClick={deleteSlide}
              disabled={report.slides.length <= 1}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
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
                  {elementTemplates.find(t => t.type === currentSlide.elements.find(e => e.id === selectedElement)?.type)?.label || 'Element'}
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
                        size="sm" 
                        className="h-8"
                        value={currentSlide.elements.find(e => e.id === selectedElement)?.x || 0}
                        onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input 
                        type="number" 
                        size="sm" 
                        className="h-8"
                        value={currentSlide.elements.find(e => e.id === selectedElement)?.y || 0}
                        onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input 
                        type="number" 
                        size="sm" 
                        className="h-8"
                        value={currentSlide.elements.find(e => e.id === selectedElement)?.width || 0}
                        onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input 
                        type="number" 
                        size="sm" 
                        className="h-8"
                        value={currentSlide.elements.find(e => e.id === selectedElement)?.height || 0}
                        onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Font Size</Label>
                  <Slider
                    value={[currentSlide.elements.find(e => e.id === selectedElement)?.style?.fontSize || 16]}
                    onValueChange={(values) => {
                      const element = currentSlide.elements.find(e => e.id === selectedElement);
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
                    {currentSlide.elements.find(e => e.id === selectedElement)?.style?.fontSize || 16}px
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
                          currentSlide.elements.find(e => e.id === selectedElement)?.style?.textAlign === align
                            ? 'bg-blue-100'
                            : ''
                        }`}
                        onClick={() => {
                          const element = currentSlide.elements.find(e => e.id === selectedElement);
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
              placeholder="Enter your SQL query here..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSQLEditor(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSQLEditor(false)}>
              Apply Query
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}