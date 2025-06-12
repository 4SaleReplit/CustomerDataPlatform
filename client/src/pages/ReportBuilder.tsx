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
        name: 'Cover Slide',
        elements: [],
        backgroundColor: '#ffffff'
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
  const [draggedElement, setDraggedElement] = useState<SlideElement | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSQLEditor, setShowSQLEditor] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const currentSlide = report.slides[currentSlideIndex];

  const elementTemplates = [
    { type: 'text', icon: Type, label: 'Text Box', defaultContent: 'Click to edit text' },
    { type: 'chart', icon: BarChart3, label: 'Bar Chart', defaultContent: { chartType: 'bar', query: '' } },
    { type: 'chart', icon: LineChart, label: 'Line Chart', defaultContent: { chartType: 'line', query: '' } },
    { type: 'chart', icon: PieChart, label: 'Pie Chart', defaultContent: { chartType: 'pie', query: '' } },
    { type: 'table', icon: Table, label: 'Data Table', defaultContent: { query: '' } },
    { type: 'metric', icon: TrendingUp, label: 'KPI Metric', defaultContent: { query: '', label: 'Metric' } },
    { type: 'image', icon: Image, label: 'Image', defaultContent: { src: '', alt: 'Image' } },
    { type: 'shape', icon: Square, label: 'Rectangle', defaultContent: { shape: 'rectangle' } },
    { type: 'shape', icon: Circle, label: 'Circle', defaultContent: { shape: 'circle' } },
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
    <div className="h-full flex">
      {/* Left Sidebar - Elements & Tools */}
      <div className="w-64 border-r bg-gray-50 p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-3">Elements</h3>
          <div className="space-y-2">
            {elementTemplates.map((template, index) => {
              const Icon = template.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => addElement(template)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {template.label}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-3">Quick Queries</h3>
          <div className="space-y-2">
            {predefinedQueries.map((query, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  setCurrentQuery(query.query);
                  setShowSQLEditor(true);
                }}
              >
                <div className="text-left">
                  <div className="font-medium">{query.name}</div>
                  <div className="text-xs text-muted-foreground">{query.type}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-3">Properties</h3>
          {selectedElement && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowElementEditor(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Properties
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => selectedElement && deleteElement(selectedElement)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="border-b p-3 flex items-center justify-between bg-white">
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
            <Button size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send Report
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? 'bg-blue-50' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div 
            ref={canvasRef}
            className="mx-auto bg-white shadow-lg relative"
            style={{
              width: 800 * (zoom / 100),
              height: 600 * (zoom / 100),
              transform: `scale(1)`,
              backgroundColor: currentSlide.backgroundColor,
              backgroundImage: showGrid ? 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.4"%3E%3Ccircle cx="1" cy="1" r="1"/%3E%3C/g%3E%3C/svg%3E")' : 'none'
            }}
            onClick={handleCanvasClick}
          >
            {currentSlide.elements.map(renderElement)}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Slides */}
      <div className="w-64 border-l bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Slides</h3>
          <Button size="sm" onClick={addSlide}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {report.slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                index === currentSlideIndex 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => setCurrentSlideIndex(index)}
            >
              <div className="aspect-video bg-white border rounded mb-2 relative overflow-hidden">
                <div className="text-xs text-gray-400 absolute inset-0 flex items-center justify-center">
                  {slide.elements.length} elements
                </div>
              </div>
              <div className="text-sm font-medium">{slide.name}</div>
              <div className="text-xs text-gray-500">{index + 1}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={duplicateSlide}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={deleteSlide}
            disabled={report.slides.length <= 1}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
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