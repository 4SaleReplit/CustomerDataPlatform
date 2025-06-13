import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
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
import { Switch } from '@/components/ui/switch';
import PiZip from 'pizzip';
import * as pdfjsLib from 'pdfjs-dist';
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
  FileText,
  Database
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
    fontFamily?: string;
    fontStyle?: string;
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
  const [location] = useLocation();
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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [currentEditingElement, setCurrentEditingElement] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [refreshConfig, setRefreshConfig] = useState({
    autoRefresh: false,
    refreshOnLoad: true,
    refreshInterval: 300000
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const pngUploaderRef = useRef<HTMLInputElement>(null);
  const currentSlide = currentReport?.slides[currentSlideIndex];

  // Auto-create new report when accessing designer route
  useEffect(() => {
    if (location === '/reports/designer' && view === 'list' && !currentReport) {
      createNewReport();
    }
  }, [location, view, currentReport]);

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

  const addImageSlideToCurrentReport = async (file: File) => {
    if (!currentReport) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        const img = document.createElement('img');
        img.onload = () => {
          // Fill the entire canvas (1920x1080) with the image
          const canvasWidth = 1920;
          const canvasHeight = 1080;
          
          // Use full canvas dimensions
          const imageWidth = canvasWidth;
          const imageHeight = canvasHeight;
          
          // Position at top-left corner to fill entire canvas
          const x = 0;
          const y = 0;
          
          const newSlide: Slide = {
            id: `slide-${Date.now()}`,
            name: `${file.name.replace(/\.[^/.]+$/, '')}`,
            elements: [
              {
                id: `image-${Date.now()}`,
                type: 'image',
                x: Math.round(x),
                y: Math.round(y),
                width: Math.round(imageWidth),
                height: Math.round(imageHeight),
                content: imageUrl,
                style: {
                  fontSize: 16,
                  fontWeight: 'normal',
                  textAlign: 'center',
                  color: '#000000',
                  backgroundColor: 'transparent',
                  fontFamily: 'Arial'
                }
              }
            ],
            backgroundColor: '#ffffff'
          };
          
          // Add the new slide to the current report
          const updatedSlides = [...currentReport.slides, newSlide];
          const updatedReport = { ...currentReport, slides: updatedSlides };
          setCurrentReport(updatedReport);
          updateReportInList(updatedReport);
          
          // Switch to the new slide
          setCurrentSlideIndex(updatedSlides.length - 1);
        };
        
        img.src = imageUrl;
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error adding image slide:', error);
    }
  };

  // Image parsing function
  const parseImageFile = async (file: File): Promise<Slide[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imageUrl = e.target?.result as string;
          
          // Create a new image element to get dimensions
          const img = new window.Image();
          img.onload = () => {
            // Fill the entire canvas (1920x1080) with the image
            const canvasWidth = 1920;
            const canvasHeight = 1080;
            
            // Use full canvas dimensions
            const imageWidth = canvasWidth;
            const imageHeight = canvasHeight;
            
            // Position at top-left corner to fill entire canvas
            const x = 0;
            const y = 0;
            
            const slide: Slide = {
              id: `slide-${Date.now()}`,
              name: `${file.name.replace(/\.[^/.]+$/, '')}`,
              elements: [
                {
                  id: `image-${Date.now()}`,
                  type: 'image',
                  x: Math.round(x),
                  y: Math.round(y),
                  width: Math.round(imageWidth),
                  height: Math.round(imageHeight),
                  content: imageUrl,
                  style: {
                    fontSize: 16,
                    fontWeight: 'normal',
                    textAlign: 'center',
                    color: '#000000',
                    backgroundColor: 'transparent',
                    fontFamily: 'Arial'
                  }
                }
              ],
              backgroundColor: '#ffffff'
            };
            
            resolve([slide]);
          };
          
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = imageUrl;
        } catch (error) {
          reject(new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  };

  // PDF parsing function
  const parsePDFFile = async (file: File): Promise<Slide[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Empty or invalid PDF file");
          }

          // Set up PDF.js worker - use CDN version that matches the installed package
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const slides: Slide[] = [];

          // Parse each page as a slide with precise positioning
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale: 1.0 });
              const textContent = await page.getTextContent();
              
              const elements: SlideElement[] = [];
              
              // Process each text item individually to preserve exact formatting
              textContent.items.forEach((item: any, index: number) => {
                if (item.str && item.str.trim() && item.str.trim().length > 0) {
                  const text = item.str.trim();
                  const transform = item.transform;
                  
                  // Extract precise positioning and dimensions
                  const pdfX = transform[4];
                  const pdfY = transform[5];
                  const fontSize = Math.abs(transform[0]) || item.height || 12;
                  
                  // Convert PDF coordinates to canvas coordinates (1920x1080)
                  const canvasX = Math.max(20, Math.min(1900, (pdfX / viewport.width) * 1920));
                  const canvasY = Math.max(20, Math.min(1060, ((viewport.height - pdfY) / viewport.height) * 1080));
                  
                  // Calculate precise text dimensions
                  const charWidth = fontSize * 0.55; // More accurate character width
                  const textWidth = Math.max(30, Math.min(350, text.length * charWidth + 20));
                  const textHeight = Math.max(fontSize + 6, fontSize * 1.4);
                  
                  // Ensure elements stay within canvas bounds
                  const elementWidth = Math.min(textWidth, 1920 - canvasX - 20);
                  const elementHeight = Math.min(textHeight, 1080 - canvasY - 20);
                  
                  // Extract font information from PDF
                  let fontFamily = 'Arial';
                  let fontWeight = 'normal';
                  
                  if (item.fontName) {
                    const fontName = item.fontName.toLowerCase();
                    if (fontName.includes('bold')) fontWeight = 'bold';
                    if (fontName.includes('times')) fontFamily = 'Times New Roman';
                    else if (fontName.includes('helvetica')) fontFamily = 'Helvetica';
                    else if (fontName.includes('calibri')) fontFamily = 'Calibri';
                    else if (fontName.includes('arial')) fontFamily = 'Arial';
                  }
                  
                  // Analyze content for styling hints
                  const isNumeric = /^\d+(\.\d+)?%?$/.test(text);
                  const isTitle = fontSize > 16 && text.length < 80;
                  const isHeader = fontSize > 12 && /^[A-Z\s\d%▲▼-]+$/.test(text);
                  const isLargeText = fontSize > 14;
                  
                  // Override font weight for headers and titles
                  if (isTitle || isHeader || isLargeText) fontWeight = 'bold';
                  
                  // Determine text alignment based on position
                  let textAlign: 'left' | 'center' | 'right' = 'left';
                  const centerZone = canvasX > 300 && canvasX < 500;
                  const rightZone = canvasX > 600;
                  
                  if (centerZone) textAlign = 'center';
                  else if (rightZone) textAlign = 'right';
                  
                  elements.push({
                    id: `pdf-text-${pageNum}-${index + 1}`,
                    type: 'text',
                    x: Math.round(canvasX),
                    y: Math.round(canvasY),
                    width: Math.round(elementWidth),
                    height: Math.round(elementHeight),
                    content: text,
                    style: {
                      fontSize: Math.max(8, Math.min(24, Math.round(fontSize))),
                      fontWeight: fontWeight,
                      textAlign: textAlign,
                      color: '#000000',
                      backgroundColor: 'transparent',
                      fontFamily: fontFamily
                    }
                  });
                }
              });

              // If no text found, create a placeholder
              if (elements.length === 0) {
                elements.push({
                  id: `text-${pageNum}-1`,
                  type: 'text',
                  x: 100,
                  y: 200,
                  width: 400,
                  height: 60,
                  content: `Page ${pageNum} Content`,
                  style: {
                    fontSize: 18,
                    fontWeight: 'normal',
                    textAlign: 'left',
                    color: '#000000',
                    backgroundColor: 'transparent',
                    fontFamily: 'Arial'
                  }
                });
              }

              slides.push({
                id: `slide-${pageNum}`,
                name: `Page ${pageNum}`,
                elements,
                backgroundColor: '#ffffff'
              });
            } catch (pageError) {
              console.warn(`Error parsing PDF page ${pageNum}:`, pageError);
              // Create fallback slide
              slides.push({
                id: `slide-${pageNum}`,
                name: `Page ${pageNum}`,
                elements: [{
                  id: `text-${pageNum}-1`,
                  type: 'text',
                  x: 100,
                  y: 200,
                  width: 400,
                  height: 60,
                  content: `Page ${pageNum} - Content could not be parsed`,
                  style: {
                    fontSize: 16,
                    fontWeight: 'normal',
                    textAlign: 'left',
                    color: '#666666',
                    backgroundColor: 'transparent',
                    fontFamily: 'Arial'
                  }
                }],
                backgroundColor: '#ffffff'
              });
            }
          }

          if (slides.length === 0) {
            throw new Error("No pages found in PDF");
          }

          resolve(slides);
        } catch (error) {
          console.error('PDF parsing error:', error);
          reject(new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read PDF file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const parsePPTXFile = async (file: File): Promise<Slide[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Empty or invalid file");
          }

          const zip = new PiZip(arrayBuffer);
          const slides: Slide[] = [];

          // Validate PPTX structure
          const presentationFile = zip.file("ppt/presentation.xml");
          if (!presentationFile) {
            throw new Error("Invalid PowerPoint file - missing presentation structure");
          }

          const presentationXml = presentationFile.asText();
          
          // Extract theme and master slide information for proper styling
          const themeFile = zip.file("ppt/theme/theme1.xml");
          const themeXml = themeFile ? themeFile.asText() : "";
          
          const relsFile = zip.file("ppt/_rels/presentation.xml.rels");
          const relationshipsXml = relsFile ? relsFile.asText() : "";

          // Parse slide relationships with proper mapping
          const slideIdPattern = /<p:sldId[^>]*id="([^"]*)"[^>]*r:id="([^"]*)"/g;
          const slideReferences = [];
          let match;
          
          while ((match = slideIdPattern.exec(presentationXml)) !== null) {
            slideReferences.push({
              slideId: match[1],
              relationshipId: match[2]
            });
          }

          if (slideReferences.length === 0) {
            throw new Error("No slides found in presentation");
          }

          // Build relationship mapping for slide paths
          const relationshipMap = new Map();
          const relationshipPattern = /<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"/g;
          let relMatch;
          
          while ((relMatch = relationshipPattern.exec(relationshipsXml)) !== null) {
            relationshipMap.set(relMatch[1], relMatch[2]);
          }

          // Process each slide with comprehensive parsing
          for (let i = 0; i < slideReferences.length; i++) {
            try {
              const slideRef = slideReferences[i];
              const slidePath = relationshipMap.get(slideRef.relationshipId);
              
              if (slidePath) {
                const fullSlidePath = slidePath.startsWith('slides/') ? `ppt/${slidePath}` : `ppt/slides/${slidePath}`;
                const slideFile = zip.file(fullSlidePath);
                
                if (slideFile) {
                  const slideXml = slideFile.asText();
                  const slideLayoutFile = await extractSlideLayout(slideXml, zip);
                  const slideMasterFile = await extractSlideMaster(slideXml, zip);
                  
                  const parsedSlide = parseSlideXMLProfessional(
                    slideXml, 
                    i + 1, 
                    zip, 
                    themeXml, 
                    slideLayoutFile, 
                    slideMasterFile
                  );
                  slides.push(parsedSlide);
                }
              }
            } catch (slideError) {
              console.error(`Error parsing slide ${i + 1}:`, slideError);
              // Create a placeholder slide with error information
              slides.push({
                id: `slide-${i + 1}`,
                name: `Slide ${i + 1}`,
                elements: [{
                  id: `error-${i + 1}`,
                  type: 'text',
                  x: 100,
                  y: 250,
                  width: 600,
                  height: 100,
                  content: `Slide ${i + 1} - Error during parsing. Complex elements may not be displayed correctly.`,
                  style: {
                    fontSize: 16,
                    fontWeight: 'normal',
                    textAlign: 'center',
                    color: '#cc6600',
                    backgroundColor: '#fff3cd',
                    fontFamily: 'Arial'
                  }
                }],
                backgroundColor: '#ffffff'
              });
            }
          }

          if (slides.length === 0) {
            throw new Error("Unable to parse any slides from the presentation");
          }

          resolve(slides);
        } catch (error) {
          console.error('PowerPoint parsing error:', error);
          reject(new Error(`Failed to parse PowerPoint: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper functions for professional PowerPoint parsing
  const extractSlideLayout = async (slideXml: string, zip: any): Promise<string> => {
    try {
      const layoutRelPattern = /<p:sldLayoutId[^>]*r:id="([^"]*)"/;
      const layoutMatch = slideXml.match(layoutRelPattern);
      if (layoutMatch) {
        const layoutRelsFile = zip.file("ppt/slides/_rels/slide1.xml.rels");
        if (layoutRelsFile) {
          const layoutRelsXml = layoutRelsFile.asText();
          const layoutTargetPattern = new RegExp(`<Relationship[^>]*Id="${layoutMatch[1]}"[^>]*Target="([^"]*)"`);
          const targetMatch = layoutRelsXml.match(layoutTargetPattern);
          if (targetMatch) {
            const layoutFile = zip.file(`ppt/${targetMatch[1]}`);
            return layoutFile ? layoutFile.asText() : "";
          }
        }
      }
    } catch (error) {
      console.warn("Could not extract slide layout:", error);
    }
    return "";
  };

  const extractSlideMaster = async (slideXml: string, zip: any): Promise<string> => {
    try {
      const masterFile = zip.file("ppt/slideMasters/slideMaster1.xml");
      return masterFile ? masterFile.asText() : "";
    } catch (error) {
      console.warn("Could not extract slide master:", error);
    }
    return "";
  };

  const parseSlideXMLProfessional = (
    slideXml: string, 
    slideNumber: number, 
    zip: any, 
    themeXml: string, 
    layoutXml: string, 
    masterXml: string
  ): Slide => {
    const elements: SlideElement[] = [];
    let elementCounter = 0;

    try {
      // Parse XML using DOMParser for better handling
      const parser = new DOMParser();
      const slideDoc = parser.parseFromString(slideXml, 'text/xml');
      
      // Extract slide background
      let backgroundColor = '#ffffff';
      const bgElement = slideDoc.querySelector('p\\:bg, bg');
      if (bgElement) {
        backgroundColor = extractBackgroundColor(bgElement, themeXml);
      }

      // Extract all shape elements from the slide
      const shapes = slideDoc.querySelectorAll('p\\:sp, sp');
      
      shapes.forEach((shape, index) => {
        try {
          const element = parseShapeElement(shape, slideNumber, elementCounter++, themeXml);
          if (element) {
            elements.push(element);
          }
        } catch (error) {
          console.warn(`Error parsing shape ${index}:`, error);
        }
      });

      // Extract image elements
      const pics = slideDoc.querySelectorAll('p\\:pic, pic');
      pics.forEach((pic, index) => {
        try {
          const element = parsePictureElement(pic, slideNumber, elementCounter++, zip);
          if (element) {
            elements.push(element);
          }
        } catch (error) {
          console.warn(`Error parsing picture ${index}:`, error);
        }
      });

      // Extract table elements
      const tables = slideDoc.querySelectorAll('a\\:tbl, tbl');
      tables.forEach((table, index) => {
        try {
          const element = parseTableElement(table, slideNumber, elementCounter++);
          if (element) {
            elements.push(element);
          }
        } catch (error) {
          console.warn(`Error parsing table ${index}:`, error);
        }
      });

    } catch (error) {
      console.error(`Error parsing slide ${slideNumber} XML:`, error);
      // Create fallback text element
      elements.push({
        id: `fallback-${slideNumber}`,
        type: 'text',
        x: 100,
        y: 250,
        width: 600,
        height: 100,
        content: `Slide ${slideNumber} - Complex content detected. Some elements may not display correctly.`,
        style: {
          fontSize: 18,
          fontWeight: 'normal',
          textAlign: 'center',
          color: '#666666',
          backgroundColor: 'transparent',
          fontFamily: 'Arial'
        }
      });
    }

    return {
      id: `slide-${slideNumber}`,
      name: `Slide ${slideNumber}`,
      elements,
      backgroundColor
    };
  };

  // Professional PowerPoint element parsing functions
  const parseShapeElement = (shape: Element, slideNumber: number, counter: number, themeXml: string): SlideElement | null => {
    try {
      const spPr = shape.querySelector('p\\:spPr, spPr');
      if (!spPr) return null;

      // Extract positioning and dimensions
      const xfrm = spPr.querySelector('a\\:xfrm, xfrm');
      if (!xfrm) return null;

      const off = xfrm.querySelector('a\\:off, off');
      const ext = xfrm.querySelector('a\\:ext, ext');
      
      if (!off || !ext) return null;

      const x = Math.max(0, emuToPixels(off.getAttribute('x') || '0'));
      const y = Math.max(0, emuToPixels(off.getAttribute('y') || '0'));
      const width = Math.max(50, emuToPixels(ext.getAttribute('cx') || '100'));
      const height = Math.max(20, emuToPixels(ext.getAttribute('cy') || '50'));

      // Extract text content
      const txBody = shape.querySelector('p\\:txBody, txBody');
      let textContent = '';
      let textStyle: any = {
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#000000',
        backgroundColor: 'transparent',
        fontFamily: 'Arial'
      };

      if (txBody) {
        const paragraphs = txBody.querySelectorAll('a\\:p, p');
        const textParts: string[] = [];
        
        paragraphs.forEach(para => {
          const runs = para.querySelectorAll('a\\:r, r');
          let paraText = '';
          
          runs.forEach(run => {
            const text = run.querySelector('a\\:t, t');
            if (text) {
              paraText += text.textContent || '';
            }
            
            // Extract text formatting
            const rPr = run.querySelector('a\\:rPr, rPr');
            if (rPr) {
              const fontSize = rPr.getAttribute('sz');
              if (fontSize) textStyle.fontSize = Math.max(8, parseInt(fontSize) / 100);
              
              const bold = rPr.getAttribute('b');
              if (bold === '1') textStyle.fontWeight = 'bold';
              
              const fontRef = rPr.querySelector('a\\:latin, latin');
              if (fontRef) {
                textStyle.fontFamily = fontRef.getAttribute('typeface') || 'Arial';
              }
            }
          });
          
          if (paraText.trim()) {
            textParts.push(paraText.trim());
          }
        });
        
        textContent = textParts.join('\n');
      }

      // Extract shape fill and styling
      const solidFill = spPr.querySelector('a\\:solidFill, solidFill');
      if (solidFill) {
        const color = extractColorFromFill(solidFill, themeXml);
        if (color !== 'transparent') {
          textStyle.backgroundColor = color;
        }
      }

      // Create element based on content
      if (textContent.trim()) {
        return {
          id: `pptx-text-${slideNumber}-${counter}`,
          type: 'text',
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
          content: textContent,
          style: textStyle
        };
      } else {
        // Check for shape geometry
        const prstGeom = spPr.querySelector('a\\:prstGeom, prstGeom');
        const shapeType = prstGeom?.getAttribute('prst') || 'rect';
        
        return {
          id: `pptx-shape-${slideNumber}-${counter}`,
          type: 'shape',
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
          content: { shape: shapeType === 'ellipse' ? 'circle' : 'rectangle' },
          style: textStyle
        };
      }
    } catch (error) {
      console.warn('Error parsing shape element:', error);
      return null;
    }
  };

  const parsePictureElement = (pic: Element, slideNumber: number, counter: number, zip: any): SlideElement | null => {
    try {
      const spPr = pic.querySelector('p\\:spPr, spPr, pic\\:spPr');
      if (!spPr) return null;

      // Extract positioning
      const xfrm = spPr.querySelector('a\\:xfrm, xfrm');
      if (!xfrm) return null;

      const off = xfrm.querySelector('a\\:off, off');
      const ext = xfrm.querySelector('a\\:ext, ext');
      
      if (!off || !ext) return null;

      const x = Math.max(0, emuToPixels(off.getAttribute('x') || '0'));
      const y = Math.max(0, emuToPixels(off.getAttribute('y') || '0'));
      const width = Math.max(50, emuToPixels(ext.getAttribute('cx') || '100'));
      const height = Math.max(50, emuToPixels(ext.getAttribute('cy') || '100'));

      // Extract image reference
      const blip = pic.querySelector('a\\:blip, blip');
      if (blip) {
        const embedId = blip.getAttribute('r:embed');
        if (embedId) {
          // For now, create placeholder for image
          return {
            id: `pptx-image-${slideNumber}-${counter}`,
            type: 'image',
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
            content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEyMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUI5QjlCIi8+CjxjaXJjbGUgY3g9IjE0MCIgY3k9IjYwIiByPSIxMCIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K',
            style: {
              fontSize: 16,
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#000000',
              backgroundColor: 'transparent',
              fontFamily: 'Arial'
            }
          };
        }
      }
    } catch (error) {
      console.warn('Error parsing picture element:', error);
    }
    return null;
  };

  const parseTableElement = (table: Element, slideNumber: number, counter: number): SlideElement | null => {
    try {
      // Extract table content and convert to text representation
      const rows = table.querySelectorAll('a\\:tr, tr');
      const tableData: string[] = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('a\\:tc, tc');
        const rowData: string[] = [];
        
        cells.forEach(cell => {
          const text = cell.textContent?.trim() || '';
          rowData.push(text);
        });
        
        if (rowData.length > 0) {
          tableData.push(rowData.join(' | '));
        }
      });

      if (tableData.length > 0) {
        return {
          id: `pptx-table-${slideNumber}-${counter}`,
          type: 'text',
          x: 50,
          y: 50 + (counter * 80),
          width: 700,
          height: Math.max(100, tableData.length * 25),
          content: tableData.join('\n'),
          style: {
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'left',
            color: '#000000',
            backgroundColor: '#f8f9fa',
            fontFamily: 'Arial'
          }
        };
      }
    } catch (error) {
      console.warn('Error parsing table element:', error);
    }
    return null;
  };

  const extractBackgroundColor = (bgElement: Element, themeXml: string): string => {
    try {
      const solidFill = bgElement.querySelector('a\\:solidFill, solidFill');
      if (solidFill) {
        return extractColorFromFill(solidFill, themeXml);
      }
    } catch (error) {
      console.warn('Error extracting background color:', error);
    }
    return '#ffffff';
  };

  const extractColorFromFill = (fillElement: Element, themeXml: string): string => {
    try {
      // Extract RGB color
      const srgbClr = fillElement.querySelector('a\\:srgbClr, srgbClr');
      if (srgbClr) {
        const val = srgbClr.getAttribute('val');
        return val ? `#${val}` : '#000000';
      }

      // Extract scheme color
      const schemeClr = fillElement.querySelector('a\\:schemeClr, schemeClr');
      if (schemeClr) {
        const val = schemeClr.getAttribute('val');
        // Map common scheme colors
        const colorMap: { [key: string]: string } = {
          'bg1': '#ffffff',
          'tx1': '#000000',
          'bg2': '#f8f9fa',
          'tx2': '#333333',
          'accent1': '#0d6efd',
          'accent2': '#198754',
          'accent3': '#dc3545',
          'accent4': '#ffc107',
          'accent5': '#6f42c1',
          'accent6': '#fd7e14'
        };
        return colorMap[val || ''] || '#000000';
      }
    } catch (error) {
      console.warn('Error extracting color:', error);
    }
    return 'transparent';
  };

  const emuToPixels = (emu: string | number): number => {
    const emuValue = typeof emu === 'string' ? parseInt(emu) : emu;
    return Math.round((emuValue || 0) / 9525);
  };

  const parseSlideXML = (slideXml: string, slideNumber: number): Slide => {
    const elements: SlideElement[] = [];
    let elementCounter = 0;

    // Helper function to convert EMU (English Metric Units) to pixels
    const emuToPixels = (emu: string | number): number => {
      const emuValue = typeof emu === 'string' ? parseInt(emu) : emu;
      return Math.round(emuValue / 9525); // 1 pixel = 9525 EMUs
    };

    // Helper function to extract color from XML
    const extractColor = (xml: string): string => {
      // Look for RGB values
      const rgbMatch = xml.match(/val="([0-9A-Fa-f]{6})"/);
      if (rgbMatch) {
        return `#${rgbMatch[1]}`;
      }
      
      // Look for scheme colors and convert to approximate values
      const schemeColors: { [key: string]: string } = {
        'dk1': '#000000',
        'lt1': '#ffffff',
        'dk2': '#1f497d',
        'lt2': '#eeece1',
        'accent1': '#4f81bd',
        'accent2': '#f79646',
        'accent3': '#9cbb58',
        'accent4': '#8064a2',
        'accent5': '#4bacc6',
        'accent6': '#f24693'
      };
      
      for (const [scheme, color] of Object.entries(schemeColors)) {
        if (xml.includes(`val="${scheme}"`)) {
          return color;
        }
      }
      
      return '#000000'; // Default to black
    };

    // Helper function to extract font information
    const extractFontInfo = (xml: string) => {
      const fontMatch = xml.match(/<a:latin[^>]*typeface="([^"]*)"/);
      const sizeMatch = xml.match(/<a:sz[^>]*val="(\d+)"/);
      const boldMatch = xml.includes('<a:b val="1"') || xml.includes('<a:b/>');
      const italicMatch = xml.includes('<a:i val="1"') || xml.includes('<a:i/>');
      
      return {
        fontFamily: fontMatch ? fontMatch[1] : 'Arial',
        fontSize: sizeMatch ? Math.round(parseInt(sizeMatch[1]) / 100) : 16,
        fontWeight: boldMatch ? 'bold' : 'normal',
        fontStyle: italicMatch ? 'italic' : 'normal'
      };
    };

    // Parse shapes with proper positioning and styling
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(slideXml, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('XML parsing error');
      }
      
      // Get all shape elements
      const shapes = xmlDoc.getElementsByTagName('p:sp');
      
      for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      elementCounter++;
      
      // Extract positioning from xfrm (transform)
      const xfrm = shape.getElementsByTagName('a:xfrm')[0];
      let x = 60, y = 60, width = 200, height = 100;
      
      if (xfrm) {
        const off = xfrm.getElementsByTagName('a:off')[0];
        const ext = xfrm.getElementsByTagName('a:ext')[0];
        
        if (off) {
          x = emuToPixels(off.getAttribute('x') || '0');
          y = emuToPixels(off.getAttribute('y') || '0');
        }
        
        if (ext) {
          width = emuToPixels(ext.getAttribute('cx') || '1905000');
          height = emuToPixels(ext.getAttribute('cy') || '952500');
        }
      }
      
      // Extract text content
      const textElements = shape.getElementsByTagName('a:t');
      let textContent = '';
      let textStyle = {
        fontSize: 16,
        fontWeight: 'normal' as const,
        textAlign: 'left' as 'left' | 'center' | 'right',
        color: '#000000',
        backgroundColor: 'transparent',
        fontFamily: 'Arial',
        fontStyle: 'normal'
      };
      
      for (let j = 0; j < textElements.length; j++) {
        const textElement = textElements[j];
        textContent += textElement.textContent || '';
        
        // Extract text formatting
        const parentRun = textElement.closest('a:r');
        if (parentRun) {
          const rPr = parentRun.getElementsByTagName('a:rPr')[0];
          if (rPr) {
            const fontInfo = extractFontInfo(rPr.outerHTML);
            textStyle.fontSize = fontInfo.fontSize;
            textStyle.fontWeight = fontInfo.fontWeight as any;
            textStyle.fontFamily = fontInfo.fontFamily;
            
            // Extract text color
            const solidFill = rPr.getElementsByTagName('a:solidFill')[0];
            if (solidFill) {
              textStyle.color = extractColor(solidFill.outerHTML);
            }
          }
        }
      }
      
      // Extract shape fill color
      let backgroundColor = 'transparent';
      const spPr = shape.getElementsByTagName('p:spPr')[0];
      if (spPr) {
        const solidFill = spPr.getElementsByTagName('a:solidFill')[0];
        if (solidFill) {
          backgroundColor = extractColor(solidFill.outerHTML);
        }
        
        const gradFill = spPr.getElementsByTagName('a:gradFill')[0];
        if (gradFill) {
          // For gradients, use the first color as background
          const firstStop = gradFill.getElementsByTagName('a:gs')[0];
          if (firstStop) {
            backgroundColor = extractColor(firstStop.outerHTML);
          }
        }
      }
      
      // Extract text alignment
      const algn = shape.querySelector('a:pPr a:algn');
      if (algn) {
        const algnVal = algn.getAttribute('val');
        if (algnVal === 'ctr') textStyle.textAlign = 'center';
        else if (algnVal === 'r') textStyle.textAlign = 'right';
        else textStyle.textAlign = 'left';
      }
      
      // Determine element type and create appropriate element
      if (textContent.trim()) {
        // Text element
        elements.push({
          id: `text-${slideNumber}-${elementCounter}`,
          type: 'text',
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.max(50, width),
          height: Math.max(20, height),
          content: textContent.trim(),
          style: {
            ...textStyle,
            backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : 'transparent'
          }
        });
      } else {
        // Check if it's a rectangle, circle, or other shape
        const prstGeom = spPr?.getElementsByTagName('a:prstGeom')[0];
        const shapeType = prstGeom?.getAttribute('prst') || 'rect';
        
        let elementType: 'shape' | 'image' = 'shape';
        let shapeContent: any = { shape: 'rectangle' };
        
        // Map PowerPoint shape types to our shape types
        if (shapeType === 'ellipse' || shapeType === 'circle') {
          shapeContent = { shape: 'circle' };
        } else if (shapeType.includes('rect')) {
          shapeContent = { shape: 'rectangle' };
        }
        
        elements.push({
          id: `shape-${slideNumber}-${elementCounter}`,
          type: elementType,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.max(50, width),
          height: Math.max(50, height),
          content: shapeContent,
          style: {
            fontSize: 16,
            fontWeight: 'normal',
            textAlign: 'left',
            color: '#000000',
            backgroundColor: backgroundColor
          }
        });
      }
    }

    // Extract slide background
    let slideBackground = '#ffffff';
    const bgElement = xmlDoc.getElementsByTagName('p:bg')[0];
    if (bgElement) {
      const solidFill = bgElement.getElementsByTagName('a:solidFill')[0];
      if (solidFill) {
        slideBackground = extractColor(solidFill.outerHTML);
      }
    }

    return {
      id: `slide-${slideNumber}`,
      name: `Slide ${slideNumber}`,
      elements,
      backgroundColor: slideBackground
    };
    } catch (error) {
      // If XML parsing fails, create a fallback slide
      console.warn(`Error parsing slide ${slideNumber} XML:`, error);
      return {
        id: `slide-${slideNumber}`,
        name: `Slide ${slideNumber}`,
        elements: [{
          id: `text-${slideNumber}-fallback`,
          type: 'text',
          x: 100,
          y: 200,
          width: 400,
          height: 60,
          content: `Slide ${slideNumber} - Content could not be parsed`,
          style: {
            fontSize: 16,
            fontWeight: 'normal',
            textAlign: 'left',
            color: '#666666',
            backgroundColor: 'transparent',
            fontFamily: 'Arial'
          }
        }],
        backgroundColor: '#ffffff'
      };
    }
  };

  const handlePngUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !currentReport) return;

    try {
      // Process each selected image file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        if (!fileExtension || !['png', 'jpg', 'jpeg'].includes(fileExtension)) {
          console.warn(`Skipping ${file.name}: not a valid image file`);
          continue;
        }

        await addImageSlideToCurrentReport(file);
      }
    } catch (error) {
      console.error('Error adding PNG slides:', error);
      alert('Failed to add some image slides. Please try again.');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!fileExtension || !['pptx', 'pdf', 'png', 'jpg', 'jpeg'].includes(fileExtension)) {
      alert('Please select a valid PowerPoint (.pptx), PDF (.pdf), or image (.png, .jpg, .jpeg) file');
      return;
    }

    setIsUploading(true);
    try {
      // For PNG/JPG files, if we have a current report, add as new slide
      if (['png', 'jpg', 'jpeg'].includes(fileExtension) && currentReport) {
        await addImageSlideToCurrentReport(file);
        setShowUploader(false);
        return;
      }

      // For other file types or when no current report, create new report
      let slides: Slide[] = [];
      
      if (fileExtension === 'pptx') {
        slides = await parsePPTXFile(file);
      } else if (fileExtension === 'pdf') {
        slides = await parsePDFFile(file);
      } else if (['png', 'jpg', 'jpeg'].includes(fileExtension)) {
        slides = await parseImageFile(file);
      }
      
      const uploadedReport: Report = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: `Imported from ${file.name} (${fileExtension.toUpperCase()})`,
        lastModified: 'Just now',
        status: 'draft',
        slides,
        settings: {
          schedule: 'manual',
          recipients: [],
          autoRefresh: false
        }
      };

      setReports([uploadedReport, ...reports]);
      setShowUploader(false);
      openDesigner(uploadedReport.id);
    } catch (error) {
      console.error('Error parsing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to parse ${fileExtension?.toUpperCase()} file: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
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
      name: 'Executive Summary',
      thumbnail: '🎯',
      elements: [
        { type: 'text', content: 'Executive Summary', x: 60, y: 40, width: 680, height: 60, style: { fontSize: 42, fontWeight: 'bold', color: '#1f2937' } },
        { type: 'text', content: 'Key Performance Indicators', x: 60, y: 120, width: 680, height: 30, style: { fontSize: 18, color: '#6b7280' } },
        { type: 'metric', content: { title: 'Total Revenue', label: 'Revenue', value: '$2.4M', change: '+12%' }, x: 60, y: 180, width: 200, height: 140 },
        { type: 'metric', content: { title: 'Active Users', label: 'Users', value: '45.2K', change: '+8%' }, x: 290, y: 180, width: 200, height: 140 },
        { type: 'metric', content: { title: 'Conversion Rate', label: 'Conversion', value: '3.8%', change: '+0.3%' }, x: 520, y: 180, width: 200, height: 140 },
        { type: 'text', content: 'This quarter shows strong performance across all key metrics with double-digit revenue growth and improved user engagement.', x: 60, y: 350, width: 660, height: 60, style: { fontSize: 16, lineHeight: '1.5', color: '#374151' } }
      ]
    },
    {
      name: 'Data Insights',
      thumbnail: '📊',
      elements: [
        { type: 'text', content: 'Data Analysis & Insights', x: 60, y: 40, width: 680, height: 60, style: { fontSize: 38, fontWeight: 'bold', color: '#1f2937' } },
        { type: 'chart', content: { title: 'Performance Trends', chartType: 'line', query: '' }, x: 60, y: 120, width: 360, height: 280 },
        { type: 'table', content: { title: 'Top Segments', query: '' }, x: 450, y: 120, width: 290, height: 280 },
        { type: 'text', content: 'Key Findings:', x: 60, y: 420, width: 680, height: 30, style: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' } },
        { type: 'text', content: '• Performance increased 25% over last quarter\n• Top 3 segments drive 80% of total value\n• Seasonal trends indicate Q4 growth opportunity', x: 60, y: 460, width: 680, height: 80, style: { fontSize: 14, lineHeight: '1.6', color: '#374151' } }
      ]
    },
    {
      name: 'Financial Overview',
      thumbnail: '💰',
      elements: [
        { type: 'text', content: 'Financial Performance', x: 60, y: 40, width: 680, height: 60, style: { fontSize: 38, fontWeight: 'bold', color: '#1f2937' } },
        { type: 'text', content: 'Q3 2024 Results', x: 60, y: 100, width: 680, height: 30, style: { fontSize: 18, color: '#6b7280' } },
        { type: 'metric', content: { title: 'Revenue', label: 'Total Revenue', value: '$2.4M', change: '+12.5%' }, x: 60, y: 150, width: 160, height: 120 },
        { type: 'metric', content: { title: 'Profit', label: 'Net Profit', value: '$480K', change: '+18.2%' }, x: 240, y: 150, width: 160, height: 120 },
        { type: 'metric', content: { title: 'Margin', label: 'Profit Margin', value: '20%', change: '+2.1%' }, x: 420, y: 150, width: 160, height: 120 },
        { type: 'metric', content: { title: 'EBITDA', label: 'EBITDA', value: '$720K', change: '+15.8%' }, x: 600, y: 150, width: 160, height: 120 },
        { type: 'chart', content: { title: 'Revenue Trend (12 Months)', chartType: 'bar', query: '' }, x: 60, y: 300, width: 700, height: 200 }
      ]
    },
    {
      name: 'Customer Analytics',
      thumbnail: '👥',
      elements: [
        { type: 'text', content: 'Customer Analytics Dashboard', x: 60, y: 40, width: 680, height: 60, style: { fontSize: 36, fontWeight: 'bold', color: '#1f2937' } },
        { type: 'metric', content: { title: 'Total Customers', label: 'Customers', value: '12.8K', change: '+15%' }, x: 60, y: 120, width: 170, height: 130 },
        { type: 'metric', content: { title: 'New Acquisitions', label: 'New This Month', value: '1.2K', change: '+22%' }, x: 250, y: 120, width: 170, height: 130 },
        { type: 'metric', content: { title: 'Retention Rate', label: 'Retention', value: '94.5%', change: '+1.2%' }, x: 440, y: 120, width: 170, height: 130 },
        { type: 'metric', content: { title: 'Avg. LTV', label: 'Customer LTV', value: '$1,250', change: '+8%' }, x: 630, y: 120, width: 170, height: 130 },
        { type: 'chart', content: { title: 'Customer Segmentation', chartType: 'pie', query: '' }, x: 60, y: 280, width: 340, height: 220 },
        { type: 'table', content: { title: 'Top Customer Segments', query: '' }, x: 420, y: 280, width: 380, height: 220 }
      ]
    },
    {
      name: 'Title Slide',
      thumbnail: '🎬',
      elements: [
        { type: 'text', content: 'Quarterly Business Review', x: 100, y: 180, width: 600, height: 90, style: { fontSize: 52, fontWeight: 'bold', textAlign: 'center', color: '#ffffff' } },
        { type: 'text', content: 'Q3 2024 Performance Summary', x: 100, y: 290, width: 600, height: 50, style: { fontSize: 24, textAlign: 'center', color: '#f3f4f6' } },
        { type: 'text', content: 'Prepared by: Analytics Team', x: 100, y: 420, width: 600, height: 30, style: { fontSize: 16, textAlign: 'center', color: '#d1d5db' } }
      ]
    },
    {
      name: 'WBR Template',
      thumbnail: '📋',
      elements: [
        { type: 'text', content: 'Weekly Business Review', x: 60, y: 40, width: 680, height: 60, style: { fontSize: 42, fontWeight: 'bold', color: '#1f2937' } },
        { type: 'text', content: 'Week Ending: [Date]', x: 60, y: 100, width: 680, height: 30, style: { fontSize: 18, color: '#6b7280' } },
        { type: 'text', content: 'KEY METRICS', x: 60, y: 150, width: 200, height: 30, style: { fontSize: 16, fontWeight: 'bold', color: '#374151' } },
        { type: 'metric', content: { title: 'Weekly Revenue', label: 'Revenue', value: '[Add Query]', change: '' }, x: 60, y: 180, width: 160, height: 100 },
        { type: 'metric', content: { title: 'New Customers', label: 'Customers', value: '[Add Query]', change: '' }, x: 240, y: 180, width: 160, height: 100 },
        { type: 'metric', content: { title: 'Active Users', label: 'Users', value: '[Add Query]', change: '' }, x: 420, y: 180, width: 160, height: 100 },
        { type: 'metric', content: { title: 'Conversion Rate', label: 'Conversion', value: '[Add Query]', change: '' }, x: 600, y: 180, width: 160, height: 100 }
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

  const handleMouseDown = (e: React.MouseEvent, elementId: string, action: 'drag' | 'resize', handle?: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElement(elementId);

    const element = currentSlide?.elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - ((element.x * zoom / 100) / 2);
    const offsetY = e.clientY - rect.top - ((element.y * zoom / 100) / 2);

    setDragOffset({ x: offsetX, y: offsetY });

    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle || null);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left) * (100 / zoom);
      const mouseY = (e.clientY - rect.top) * (100 / zoom);

      if (action === 'drag') {
        const newX = Math.max(0, Math.min(1920 - element.width, (mouseX * 2) - (dragOffset.x * 200 / zoom)));
        const newY = Math.max(0, Math.min(1080 - element.height, (mouseY * 2) - (dragOffset.y * 200 / zoom)));
        
        updateElement(elementId, { x: newX, y: newY });
      } else if (action === 'resize') {
        let newWidth = element.width;
        let newHeight = element.height;
        let newX = element.x;
        let newY = element.y;

        switch (handle) {
          case 'se': // bottom-right
            newWidth = Math.max(50, mouseX - element.x);
            newHeight = Math.max(30, mouseY - element.y);
            break;
          case 'sw': // bottom-left
            newWidth = Math.max(50, element.x + element.width - mouseX);
            newHeight = Math.max(30, mouseY - element.y);
            newX = Math.max(0, mouseX);
            break;
          case 'ne': // top-right
            newWidth = Math.max(50, mouseX - element.x);
            newHeight = Math.max(30, element.y + element.height - mouseY);
            newY = Math.max(0, mouseY);
            break;
          case 'nw': // top-left
            newWidth = Math.max(50, element.x + element.width - mouseX);
            newHeight = Math.max(30, element.y + element.height - mouseY);
            newX = Math.max(0, mouseX);
            newY = Math.max(0, mouseY);
            break;
        }

        updateElement(elementId, { 
          x: newX, 
          y: newY, 
          width: Math.min(newWidth, 1000 - newX), 
          height: Math.min(newHeight, 700 - newY) 
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleElementDoubleClick = (elementId: string) => {
    const element = currentSlide?.elements.find(el => el.id === elementId);
    if (!element) return;

    if (element.type === 'chart' || element.type === 'table' || element.type === 'metric') {
      // Open SQL editor for data elements
      const content = element.content as any;
      setCurrentQuery(content.query || '');
      setCurrentTitle(content.title || '');
      setCurrentEditingElement(elementId);
      
      // Load existing refresh configuration
      const existingConfig = content.refreshConfig || {};
      setRefreshConfig({
        autoRefresh: existingConfig.autoRefresh || false,
        refreshOnLoad: existingConfig.refreshOnLoad !== undefined ? existingConfig.refreshOnLoad : true,
        refreshInterval: existingConfig.refreshInterval || 300000
      });
      
      // Load existing query results if available
      if (content.queryResults) {
        setQueryResults(content.queryResults);
      }
      
      setShowSQLEditor(true);
    }
  };

  const executeQuery = async () => {
    if (!currentQuery.trim()) return;
    
    setIsExecutingQuery(true);
    try {
      const response = await fetch('/api/dashboard/tiles/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentQuery }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueryResults(data);
      } else {
        console.error('Query execution failed');
      }
    } catch (error) {
      console.error('Error executing query:', error);
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const saveQueryToElement = () => {
    if (currentEditingElement && currentReport) {
      const element = currentSlide?.elements.find(el => el.id === currentEditingElement);
      if (element && (element.type === 'chart' || element.type === 'table' || element.type === 'metric')) {
        const updatedContent = {
          ...element.content,
          title: currentTitle,
          query: currentQuery,
          refreshConfig: refreshConfig,
          queryResults: queryResults // Store the query results for display
        };
        updateElement(currentEditingElement, { content: updatedContent });
      }
    }
    setShowSQLEditor(false);
    setCurrentEditingElement(null);
    setCurrentTitle('');
    setQueryResults(null);
  };

  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute select-none group ${isSelected ? 'border-2 border-blue-500 shadow-lg' : 'border-2 border-transparent hover:border-blue-300'} ${isDragging && selectedElement === element.id ? 'shadow-2xl z-50' : ''}`}
        style={{
          left: (element.x * (zoom / 100)) / 2,
          top: (element.y * (zoom / 100)) / 2,
          width: (element.width * (zoom / 100)) / 2,
          height: (element.height * (zoom / 100)) / 2,
          fontSize: Math.max(8, (element.style.fontSize || 16) * (zoom / 100)),
          color: element.style.color || '#000000',
          backgroundColor: element.style.backgroundColor || 'transparent',
          textAlign: element.style.textAlign || 'left',
          fontWeight: element.style.fontWeight || 'normal',
          fontFamily: (element.style as any).fontFamily || 'Arial',
          display: 'flex',
          alignItems: 'center',
          justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
          padding: '8px',
          boxSizing: 'border-box',
          cursor: isDragging && selectedElement === element.id ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id, 'drag')}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element.id);
        }}
        onDoubleClick={() => handleElementDoubleClick(element.id)}
      >
        {element.type === 'text' && (
          <div 
            className="w-full h-full p-2 text-overflow-ellipsis relative"
            style={{ 
              fontFamily: (element.style as any).fontFamily || 'Arial',
              fontStyle: (element.style as any).fontStyle || 'normal',
              fontSize: `${(element.style.fontSize || 16) * (zoom / 100)}px`,
              fontWeight: element.style.fontWeight || 'normal',
              color: element.style.color || '#000000',
              textAlign: element.style.textAlign || 'left',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflow: 'hidden',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: element.style.textAlign === 'center' ? 'center' : 'flex-start',
              justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
              flexDirection: 'column',
              border: isSelected ? '2px solid #3b82f6' : element.id.includes('pdf') ? '1px solid #e5e7eb' : '1px solid transparent',
              minHeight: '20px',
              backgroundColor: element.style.backgroundColor || (element.id.includes('pdf') ? 'rgba(255, 255, 255, 0.95)' : 'transparent')
            }}
          >
            {/* PDF Content Indicator */}
            {element.id.includes('pdf') && !isSelected && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center" title="PDF Content">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
            
            <div style={{ 
              width: '100%', 
              height: '100%',
              textAlign: element.style.textAlign || 'left',
              overflow: 'auto',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              wordBreak: 'break-word',
              hyphens: 'auto'
            }}>
              {typeof element.content === 'string' ? element.content : 'Text Element'}
            </div>
          </div>
        )}
        {element.type === 'image' && (
          <div className="w-full h-full relative overflow-hidden rounded border">
            <img 
              src={element.content as string}
              alt="Uploaded image"
              className="w-full h-full object-contain"
              style={{
                borderRadius: '4px'
              }}
            />
            {/* Image indicator */}
            {!isSelected && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium shadow">
                IMG
              </div>
            )}
          </div>
        )}
        {element.type === 'chart' && (
          <div className="w-full h-full bg-white border rounded p-2 flex flex-col pointer-events-none">
            <div className="font-semibold text-sm mb-2 text-gray-700 border-b pb-1">
              {element.content?.title || 'Chart Title'}
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <BarChart3 className="h-8 w-8" />
              <span className="ml-2">Chart Visualization</span>
            </div>
          </div>
        )}
        {element.type === 'table' && (
          <div className="w-full h-full bg-white border rounded p-2 flex flex-col pointer-events-none">
            <div className="font-semibold text-sm mb-2 text-gray-700 border-b pb-1">
              {element.content?.title || 'Table Title'}
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <Table className="h-8 w-8" />
              <span className="ml-2">Data Table</span>
            </div>
          </div>
        )}
        {element.type === 'metric' && (
          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-blue-100 border rounded p-4 pointer-events-none">
            <div className="text-2xl font-bold text-blue-900">
              {(() => {
                if (element.content?.queryResults && element.content.queryResults.rows && element.content.queryResults.rows.length > 0) {
                  const value = element.content.queryResults.rows[0][0];
                  if (typeof value === 'number') {
                    return value.toLocaleString();
                  }
                  return value || '0';
                }
                return element.content?.value || '0';
              })()}
            </div>
            <div className="text-sm text-blue-600">
              {element.content?.title || element.content?.label || 'Metric'}
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

        {/* Resize handles for selected elements */}
        {isSelected && !previewMode && (
          <>
            {/* Corner handles */}
            <div
              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize"
              style={{ top: -6, left: -6 }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'nw')}
            />
            <div
              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize"
              style={{ top: -6, right: -6 }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'ne')}
            />
            <div
              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize"
              style={{ bottom: -6, left: -6 }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'sw')}
            />
            <div
              className="absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize"
              style={{ bottom: -6, right: -6 }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'se')}
            />

            {/* Data element indicator */}
            {(element.type === 'chart' || element.type === 'table' || element.type === 'metric') && (
              <div
                className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleElementDoubleClick(element.id);
                }}
                title="Double-click to edit query"
              >
                <Database className="w-3 h-3 text-white" />
              </div>
            )}
          </>
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
            <div className="flex gap-3">
              <Button onClick={() => setShowUploader(true)} className="bg-purple-600 hover:bg-purple-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>



              <Button onClick={createNewReport} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
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

        {/* File Upload Dialog */}
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Presentation or Document</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Upload PowerPoint (.pptx), PDF (.pdf), or image files (.png, .jpg) to convert them into editable presentations in the design studio.
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pptx,.pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {isUploading ? 'Processing...' : 'Click to upload file'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Supports PowerPoint (.pptx) and PDF (.pdf) files
                  </div>
                </label>
              </div>
              
              {isUploading && (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Parsing document...</span>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Supported formats:</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>• PowerPoint (.pptx) - Preserves fonts, colors, positioning, and formatting</div>
                  <div>• PDF (.pdf) - Extracts text content and converts pages to editable slides</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                The uploaded document will be converted to editable slides where you can add data visualizations and modify content.
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              {/* Slide Management */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide">Slide Management</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      if (!currentReport) return;
                      const newSlide: Slide = {
                        id: Date.now().toString(),
                        name: `Slide ${currentReport.slides.length + 1}`,
                        elements: [],
                        backgroundColor: '#ffffff'
                      };
                      const updatedSlides = [...currentReport.slides, newSlide];
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                      setCurrentSlideIndex(updatedSlides.length - 1);
                    }}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Slide
                  </Button>
                  
                  <input
                    type="file"
                    ref={pngUploaderRef}
                    accept=".png,.jpg,.jpeg"
                    onChange={handlePngUpload}
                    multiple
                    className="hidden"
                  />
                  <Button
                    onClick={() => pngUploaderRef.current?.click()}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={!currentReport}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Add PNG as Slide
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (!currentReport || currentReport.slides.length <= 1) return;
                      const newSlides = [...currentReport.slides];
                      const duplicatedSlide = {
                        ...newSlides[currentSlideIndex],
                        id: Date.now().toString(),
                        name: `${newSlides[currentSlideIndex].name} Copy`,
                        elements: newSlides[currentSlideIndex].elements.map(el => ({
                          ...el,
                          id: `${Date.now()}-${Math.random()}`
                        }))
                      };
                      newSlides.splice(currentSlideIndex + 1, 0, duplicatedSlide);
                      const updatedReport = { ...currentReport, slides: newSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                      setCurrentSlideIndex(currentSlideIndex + 1);
                    }}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={!currentReport || currentReport.slides.length <= 1}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Current Slide
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (!currentReport || currentReport.slides.length <= 1) return;
                      const newSlides = [...currentReport.slides];
                      newSlides.splice(currentSlideIndex, 1);
                      const updatedReport = { ...currentReport, slides: newSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                    }}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={!currentReport || currentReport.slides.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Current Slide
                  </Button>
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
                        id: `${Date.now()}`,
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
                          x: 60,
                          y: 80,
                          width: 160,
                          height: 120,
                          content: { title: 'KPI 1', label: 'Metric', value: '100', change: '+5%' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-2`,
                          type: 'metric',
                          x: 240,
                          y: 80,
                          width: 160,
                          height: 120,
                          content: { title: 'KPI 2', label: 'Metric', value: '200', change: '+10%' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-3`,
                          type: 'metric',
                          x: 420,
                          y: 80,
                          width: 160,
                          height: 120,
                          content: { title: 'KPI 3', label: 'Metric', value: '300', change: '+15%' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-4`,
                          type: 'metric',
                          x: 600,
                          y: 80,
                          width: 160,
                          height: 120,
                          content: { title: 'KPI 4', label: 'Metric', value: '400', change: '+20%' },
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
                          height: 200,
                          content: { chartType: 'line', title: 'Trend' },
                          style: { fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
                        },
                        {
                          id: `${Date.now()}-3`,
                          type: 'text',
                          x: 50,
                          y: 120,
                          width: 300,
                          height: 200,
                          content: 'Add your content here...',
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
                    onClick={() => {
                      if (!currentReport) return;
                      const newSlide: Slide = {
                        id: Date.now().toString(),
                        name: `Slide ${currentReport.slides.length + 1}`,
                        elements: [],
                        backgroundColor: '#ffffff'
                      };
                      const updatedSlides = [...currentReport.slides, newSlide];
                      const updatedReport = { ...currentReport, slides: updatedSlides };
                      setCurrentReport(updatedReport);
                      updateReportInList(updatedReport);
                      setCurrentSlideIndex(updatedSlides.length - 1);
                    }}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Slide
                  </Button>
                </div>
              </div>

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
                        x: 200,
                        y: 100,
                        width: 1520,
                        height: 160,
                        content: 'Slide Title',
                        style: { fontSize: 72, fontWeight: 'bold', textAlign: 'left', color: '#000000', backgroundColor: 'transparent' }
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
              width: (1920 * (zoom / 100)) / 2,
              height: (1080 * (zoom / 100)) / 2,
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
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>SQL Query Editor & Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left side - Query Editor */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Title Input */}
              <div className="mb-3">
                <Label htmlFor="tile-title" className="text-sm font-medium">
                  Visualization Title
                </Label>
                <Input
                  id="tile-title"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="Enter a title for this visualization"
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Button 
                  onClick={executeQuery} 
                  disabled={isExecutingQuery || !currentQuery.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isExecutingQuery ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Query
                    </>
                  )}
                </Button>
                <Badge variant="secondary" className="text-xs">
                  Press Ctrl+Enter to run
                </Badge>
              </div>
              
              <div className="flex-1 min-h-0">
                <CodeMirrorSQLEditor
                  value={currentQuery}
                  onChange={setCurrentQuery}
                  onExecute={executeQuery}
                />
              </div>
            </div>

            {/* Right side - Configuration & Results */}
            <div className="w-80 flex flex-col gap-4">
              {/* Refresh Configuration */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Refresh Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Auto Refresh</Label>
                    <Switch
                      checked={refreshConfig.autoRefresh}
                      onCheckedChange={(checked) => 
                        setRefreshConfig(prev => ({ ...prev, autoRefresh: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Refresh on Load</Label>
                    <Switch
                      checked={refreshConfig.refreshOnLoad}
                      onCheckedChange={(checked) => 
                        setRefreshConfig(prev => ({ ...prev, refreshOnLoad: checked }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Refresh Interval</Label>
                    <Select 
                      value={refreshConfig.refreshInterval.toString()}
                      onValueChange={(value) => 
                        setRefreshConfig(prev => ({ ...prev, refreshInterval: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60000">1 minute</SelectItem>
                        <SelectItem value="300000">5 minutes</SelectItem>
                        <SelectItem value="600000">10 minutes</SelectItem>
                        <SelectItem value="1800000">30 minutes</SelectItem>
                        <SelectItem value="3600000">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Query Results */}
              {queryResults && (
                <Card className="flex-1 p-4 min-h-0">
                  <h4 className="font-medium mb-3">Query Results</h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    {queryResults.rows?.length || 0} rows returned
                  </div>
                  <div className="overflow-auto max-h-48 border rounded">
                    {queryResults.rows && queryResults.rows.length > 0 ? (
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {Object.keys(queryResults.rows[0]).map((key) => (
                              <th key={key} className="p-2 text-left border-r">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResults.rows.slice(0, 10).map((row: any, index: number) => (
                            <tr key={index} className="border-b">
                              {Object.values(row).map((value: any, colIndex: number) => (
                                <td key={colIndex} className="p-2 border-r">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No data returned
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setShowSQLEditor(false);
              setCurrentEditingElement(null);
              setQueryResults(null);
            }}>
              Cancel
            </Button>
            <Button onClick={saveQueryToElement}>
              Save Query & Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}