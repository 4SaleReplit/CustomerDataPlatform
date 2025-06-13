import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Download, 
  Upload, 
  Type, 
  BarChart3, 
  Table, 
  Image as ImageIcon, 
  Square, 
  MousePointer, 
  Play, 
  Trash2, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  RefreshCw,
  GripVertical,
  Settings,
  FileText
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { CodeMirrorSQLEditor } from '@/components/dashboard/CodeMirrorSQLEditor';
import { apiRequest } from '@/lib/queryClient';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs-dist/pdf.worker.min.js';

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

export default function ReportBuilder() {
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(75);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // SQL Editor states
  const [showSQLEditor, setShowSQLEditor] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [refreshConfig, setRefreshConfig] = useState({
    autoRefresh: false,
    refreshInterval: 300000, // 5 minutes
    refreshOnLoad: true
  });

  // Drag and drop for slide reordering
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [dragOverSlideIndex, setDragOverSlideIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with a default report
  useEffect(() => {
    if (!currentReport) {
      const defaultSlide: Slide = {
        id: nanoid(),
        name: 'Slide 1',
        elements: [],
        backgroundColor: '#ffffff'
      };

      const newReport: Report = {
        id: nanoid(),
        name: 'New Report',
        description: 'A new report created with the report builder',
        slides: [defaultSlide],
        settings: {
          schedule: 'manual',
          recipients: [],
          autoRefresh: false
        },
        status: 'draft'
      };

      setCurrentReport(newReport);
    }
  }, []);

  const currentSlide = currentReport?.slides[currentSlideIndex];

  const addSlide = () => {
    if (!currentReport) return;

    const newSlide: Slide = {
      id: nanoid(),
      name: `Slide ${currentReport.slides.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff'
    };

    const updatedReport = {
      ...currentReport,
      slides: [...currentReport.slides, newSlide]
    };

    setCurrentReport(updatedReport);
    setCurrentSlideIndex(updatedReport.slides.length - 1);
  };

  // Multiple image upload functionality
  const addImageSlideToCurrentReport = async (file: File): Promise<void> => {
    if (!currentReport) return;

    return new Promise((resolve, reject) => {
      try {
        // Create a new slide for the image
        const imageUrl = URL.createObjectURL(file);
        
        // Create an image element to get dimensions
        const img = new Image();
        img.onload = () => {
          const canvasWidth = 1920;
          const canvasHeight = 1080;
          
          // Make image fill the entire canvas space
          const elementWidth = canvasWidth;
          const elementHeight = canvasHeight;
          
          // Position at canvas origin
          const x = 0;
          const y = 0;

          const imageElement: SlideElement = {
            id: nanoid(),
            type: 'image',
            x,
            y,
            width: elementWidth,
            height: elementHeight,
            content: imageUrl,
            style: {}
          };

          const newSlide: Slide = {
            id: nanoid(),
            name: `${file.name.split('.')[0]}`,
            elements: [imageElement],
            backgroundColor: '#ffffff'
          };

          setCurrentReport(prevReport => {
            if (!prevReport) return prevReport;
            return {
              ...prevReport,
              slides: [...prevReport.slides, newSlide]
            };
          });
          
          resolve();
        };
        
        img.onerror = () => {
          console.error('Error loading image:', file.name);
          reject(new Error(`Failed to load image: ${file.name}`));
        };
        
        img.src = imageUrl;
      } catch (error) {
        console.error('Error adding image slide:', error);
        reject(error);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log(`Processing ${files.length} files...`);

    try {
      // Process files sequentially to avoid race conditions
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type;
        
        console.log(`Processing file ${i + 1}/${files.length}: ${file.name} (${fileType})`);

        if (fileType.startsWith('image/')) {
          // For images, create separate slides
          await addImageSlideToCurrentReport(file);
          console.log(`Created slide for image: ${file.name}`);
        } else if (fileType === 'application/pdf') {
          // Handle PDF
          const slides = await parsePDFFile(file);
          if (slides.length > 0) {
            setCurrentReport(prevReport => {
              if (!prevReport) return prevReport;
              return {
                ...prevReport,
                slides: [...prevReport.slides, ...slides]
              };
            });
            console.log(`Added ${slides.length} slides from PDF: ${file.name}`);
          }
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          // Handle PPTX
          const slides = await parsePPTXFile(file);
          if (slides.length > 0) {
            setCurrentReport(prevReport => {
              if (!prevReport) return prevReport;
              return {
                ...prevReport,
                slides: [...prevReport.slides, ...slides]
              };
            });
            console.log(`Added ${slides.length} slides from PPTX: ${file.name}`);
          }
        } else {
          console.warn(`Unsupported file type: ${fileType} for file: ${file.name}`);
        }
      }
      
      console.log('All files processed successfully');
    } catch (error) {
      console.error('Error processing files:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parsePDFFile = async (file: File): Promise<Slide[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const slides: Slide[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context!,
          viewport: viewport
        }).promise;

        const imageUrl = canvas.toDataURL();
        
        const imageElement: SlideElement = {
          id: nanoid(),
          type: 'image',
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          content: imageUrl,
          style: {}
        };

        const slide: Slide = {
          id: nanoid(),
          name: `${file.name} - Page ${pageNum}`,
          elements: [imageElement],
          backgroundColor: '#ffffff'
        };

        slides.push(slide);
      }

      return slides;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      return [];
    }
  };

  const parsePPTXFile = async (file: File): Promise<Slide[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const slides: Slide[] = [];

      // Get theme colors for better color extraction
      let themeXml = '';
      try {
        themeXml = zip.file('ppt/theme/theme1.xml')?.asText() || '';
      } catch (e) {
        console.log('No theme file found');
      }

      // Find all slide files
      const slideFiles = Object.keys(zip.files).filter(filename => 
        filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
      );

      slideFiles.sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
        const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
        return aNum - bNum;
      });

      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slideXml = zip.file(slideFile)?.asText();
        if (slideXml) {
          const slide = parseSlideXML(slideXml, i + 1, themeXml, zip);
          slides.push(slide);
        }
      }

      return slides;
    } catch (error) {
      console.error('Error parsing PPTX:', error);
      return [];
    }
  };

  const parseSlideXML = (slideXml: string, slideNumber: number, themeXml: string, zip: any): Slide => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(slideXml, 'text/xml');
    const elements: SlideElement[] = [];
    let elementCounter = 0;

    // Extract background color
    const bgElement = doc.querySelector('bg');
    let backgroundColor = '#ffffff';
    if (bgElement) {
      backgroundColor = extractBackgroundColor(bgElement, themeXml);
    }

    // Parse text elements
    const textElements = doc.querySelectorAll('a\\:t, t');
    textElements.forEach(textEl => {
      const text = textEl.textContent?.trim();
      if (text) {
        elementCounter++;
        const textElement: SlideElement = {
          id: nanoid(),
          type: 'text',
          x: 100 + (elementCounter * 50),
          y: 100 + (elementCounter * 80),
          width: 400,
          height: 60,
          content: text,
          style: {
            fontSize: 24,
            color: '#000000',
            textAlign: 'left'
          }
        };
        elements.push(textElement);
      }
    });

    // Parse shape elements
    const shapes = doc.querySelectorAll('p\\:sp, sp');
    shapes.forEach(shape => {
      elementCounter++;
      const shapeElement = parseShapeElement(shape, slideNumber, elementCounter, themeXml);
      if (shapeElement) {
        elements.push(shapeElement);
      }
    });

    // Parse image elements
    const pictures = doc.querySelectorAll('p\\:pic, pic');
    pictures.forEach(pic => {
      elementCounter++;
      const imageElement = parsePictureElement(pic, slideNumber, elementCounter, zip);
      if (imageElement) {
        elements.push(imageElement);
      }
    });

    // Parse table elements
    const tables = doc.querySelectorAll('a\\:tbl, tbl');
    tables.forEach(table => {
      elementCounter++;
      const tableElement = parseTableElement(table, slideNumber, elementCounter);
      if (tableElement) {
        elements.push(tableElement);
      }
    });

    const newSlide: Slide = {
      id: nanoid(),
      name: `Slide ${slideNumber}`,
      elements,
      backgroundColor
    };

    return newSlide;
  };

  const parseShapeElement = (shape: Element, slideNumber: number, counter: number, themeXml: string): SlideElement | null => {
    const textContent = shape.querySelector('a\\:t, t')?.textContent?.trim();
    
    if (textContent) {
      return {
        id: nanoid(),
        type: 'text',
        x: 100 + (counter * 30),
        y: 150 + (counter * 60),
        width: 350,
        height: 50,
        content: textContent,
        style: {
          fontSize: 18,
          color: '#000000',
          textAlign: 'left'
        }
      };
    }

    return {
      id: nanoid(),
      type: 'shape',
      x: 200 + (counter * 40),
      y: 200 + (counter * 50),
      width: 150,
      height: 100,
      content: '',
      style: {
        backgroundColor: '#e5e7eb'
      }
    };
  };

  const parsePictureElement = (pic: Element, slideNumber: number, counter: number, zip: any): SlideElement | null => {
    try {
      const embedId = pic.querySelector('a\\:blip, blip')?.getAttribute('r:embed');
      if (embedId) {
        // This would require additional processing to extract the actual image
        return {
          id: nanoid(),
          type: 'image',
          x: 300 + (counter * 20),
          y: 250 + (counter * 30),
          width: 200,
          height: 150,
          content: '/placeholder-image.png',
          style: {}
        };
      }
    } catch (error) {
      console.error('Error parsing picture element:', error);
    }
    return null;
  };

  const parseTableElement = (table: Element, slideNumber: number, counter: number): SlideElement | null => {
    const rows = table.querySelectorAll('a\\:tr, tr');
    if (rows.length > 0) {
      return {
        id: nanoid(),
        type: 'table',
        x: 150 + (counter * 25),
        y: 300 + (counter * 40),
        width: 400,
        height: 200,
        content: `Table with ${rows.length} rows`,
        style: {}
      };
    }
    return null;
  };

  const extractBackgroundColor = (bgElement: Element, themeXml: string): string => {
    const solidFill = bgElement.querySelector('a\\:solidFill, solidFill');
    if (solidFill) {
      return extractColorFromFill(solidFill, themeXml);
    }
    return '#ffffff';
  };

  const extractColorFromFill = (fillElement: Element, themeXml: string): string => {
    const srgbClr = fillElement.querySelector('a\\:srgbClr, srgbClr');
    if (srgbClr) {
      const val = srgbClr.getAttribute('val');
      return val ? `#${val}` : '#ffffff';
    }
    
    const schemeClr = fillElement.querySelector('a\\:schemeClr, schemeClr');
    if (schemeClr) {
      // For scheme colors, we'd need to parse the theme XML
      // For now, return a default color
      return '#f3f4f6';
    }
    
    return '#ffffff';
  };

  const addElement = (type: SlideElement['type']) => {
    if (!currentSlide || !currentReport) return;

    const newElement: SlideElement = {
      id: nanoid(),
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 300 : type === 'chart' ? 400 : 200,
      height: type === 'text' ? 50 : type === 'chart' ? 300 : 150,
      content: type === 'text' ? 'New text element' : type === 'chart' ? { type: 'bar', data: [] } : '',
      style: {
        fontSize: 16,
        color: '#000000',
        textAlign: 'left',
        backgroundColor: type === 'shape' ? '#e5e7eb' : 'transparent'
      }
    };

    const updatedSlide = {
      ...currentSlide,
      elements: [...currentSlide.elements, newElement]
    };

    const updatedReport = {
      ...currentReport,
      slides: currentReport.slides.map((slide, index) =>
        index === currentSlideIndex ? updatedSlide : slide
      )
    };

    setCurrentReport(updatedReport);
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    if (!currentSlide || !currentReport) return;

    const updatedSlide = {
      ...currentSlide,
      elements: currentSlide.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    };

    const updatedReport = {
      ...currentReport,
      slides: currentReport.slides.map((slide, index) =>
        index === currentSlideIndex ? updatedSlide : slide
      )
    };

    setCurrentReport(updatedReport);
  };

  const deleteElement = (elementId: string) => {
    if (!currentSlide || !currentReport) return;

    const updatedSlide = {
      ...currentSlide,
      elements: currentSlide.elements.filter(el => el.id !== elementId)
    };

    const updatedReport = {
      ...currentReport,
      slides: currentReport.slides.map((slide, index) =>
        index === currentSlideIndex ? updatedSlide : slide
      )
    };

    setCurrentReport(updatedReport);
    setSelectedElement(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
    }
  };

  const updateSelectedElement = (updates: Partial<SlideElement>) => {
    if (!selectedElement || !currentSlide) return;
    
    updateElement(selectedElement, updates);
  };

  const deleteSelectedElement = () => {
    if (!selectedElement || !currentSlide || !currentReport) return;
    
    const updatedElements = currentSlide.elements.filter(el => el.id !== selectedElement);
    const updatedSlide = { ...currentSlide, elements: updatedElements };
    const updatedSlides = [...currentReport.slides];
    updatedSlides[currentSlideIndex] = updatedSlide;
    
    setCurrentReport({ ...currentReport, slides: updatedSlides });
    setSelectedElement(null);
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (selectedElement && currentSlide) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const element = currentSlide.elements.find(el => el.id === selectedElement);
      if (!element) return;

      if (isDragging) {
        // Handle dragging/moving
        updateElement(selectedElement, {
          x: Math.max(0, element.x + deltaX / (zoom / 100)),
          y: Math.max(0, element.y + deltaY / (zoom / 100))
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing && resizeHandle) {
        // Handle resizing
        const scaleFactor = zoom / 100;
        const scaledDeltaX = deltaX / scaleFactor;
        const scaledDeltaY = deltaY / scaleFactor;
        
        let newX = element.x;
        let newY = element.y;
        let newWidth = element.width;
        let newHeight = element.height;

        switch (resizeHandle) {
          case 'nw':
            newX += scaledDeltaX;
            newY += scaledDeltaY;
            newWidth -= scaledDeltaX;
            newHeight -= scaledDeltaY;
            break;
          case 'ne':
            newY += scaledDeltaY;
            newWidth += scaledDeltaX;
            newHeight -= scaledDeltaY;
            break;
          case 'sw':
            newX += scaledDeltaX;
            newWidth -= scaledDeltaX;
            newHeight += scaledDeltaY;
            break;
          case 'se':
            newWidth += scaledDeltaX;
            newHeight += scaledDeltaY;
            break;
          case 'n':
            newY += scaledDeltaY;
            newHeight -= scaledDeltaY;
            break;
          case 's':
            newHeight += scaledDeltaY;
            break;
          case 'w':
            newX += scaledDeltaX;
            newWidth -= scaledDeltaX;
            break;
          case 'e':
            newWidth += scaledDeltaX;
            break;
        }

        // Ensure minimum size
        newWidth = Math.max(20, newWidth);
        newHeight = Math.max(20, newHeight);
        
        updateElement(selectedElement, {
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          width: newWidth,
          height: newHeight
        });
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  }, [isDragging, isResizing, selectedElement, currentSlide, dragStart, zoom, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Keyboard event handling for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault();
        deleteSelectedElement();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, deleteSelectedElement]);

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-move border-2 transition-all duration-200 ${
          isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-300'
        }`}
        style={{
          left: (element.x * (zoom / 100)) / 1.5,
          top: (element.y * (zoom / 100)) / 1.5,
          width: (element.width * (zoom / 100)) / 1.5,
          height: (element.height * (zoom / 100)) / 1.5,
          fontSize: element.style.fontSize ? `${(element.style.fontSize * (zoom / 100)) / 1.5}px` : '12px',
          color: element.style.color,
          textAlign: element.style.textAlign,
          backgroundColor: element.style.backgroundColor,
          backgroundImage: element.type === 'image' ? `url(${element.content})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
      >
        {element.type === 'text' && (
          <div className="p-2 w-full h-full overflow-hidden">
            {element.content}
          </div>
        )}
        {element.type === 'chart' && (
          <div className="p-2 w-full h-full bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <span className="ml-2 text-sm text-blue-700">Chart</span>
          </div>
        )}
        {element.type === 'table' && (
          <div className="p-2 w-full h-full bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
            <Table className="h-8 w-8 text-gray-500" />
            <span className="ml-2 text-sm text-gray-700">Table</span>
          </div>
        )}
        {element.type === 'metric' && (
          <div className="p-2 w-full h-full bg-green-50 border border-green-200 rounded flex items-center justify-center">
            <span className="text-2xl font-bold text-green-700">123</span>
          </div>
        )}
        {element.type === 'shape' && (
          <div className="w-full h-full rounded" />
        )}
        
        {/* Resize Handles */}
        {isSelected && (
          <>
            {/* Corner handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'sw')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'se')}
            />
            
            {/* Edge handles */}
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-n-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'n')}
            />
            <div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white cursor-s-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 's')}
            />
            <div
              className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-w-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'w')}
            />
            <div
              className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white cursor-e-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'e')}
            />
          </>
        )}
      </div>
    );
  };

  // Slide drag and drop handlers
  const handleSlideDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlideDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverSlideIndex(index);
  };

  const handleSlideDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedSlideIndex === null || !currentReport) return;
    
    const slides = [...currentReport.slides];
    const draggedSlide = slides[draggedSlideIndex];
    
    // Remove the dragged slide from its original position
    slides.splice(draggedSlideIndex, 1);
    
    // Insert it at the new position
    const insertIndex = draggedSlideIndex < dropIndex ? dropIndex - 1 : dropIndex;
    slides.splice(insertIndex, 0, draggedSlide);
    
    const updatedReport = {
      ...currentReport,
      slides
    };
    
    setCurrentReport(updatedReport);
    setCurrentSlideIndex(insertIndex);
    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);
  };

  const executeQuery = async () => {
    if (!currentQuery.trim()) return;
    
    setIsExecutingQuery(true);
    try {
      const response = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery })
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueryResults(data.results || []);
      } else {
        console.error('Query execution failed');
        setQueryResults([]);
      }
    } catch (error) {
      console.error('Query execution error:', error);
      setQueryResults([]);
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const saveQueryConfiguration = () => {
    if (!currentQuery.trim() || !currentTitle.trim()) return;
    
    // Add a chart element with the query results
    addElement('chart');
    setShowSQLEditor(false);
    setQueryResults(null);
    setCurrentQuery('');
    setCurrentTitle('');
  };

  if (!currentReport) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">{currentReport.name}</h1>
          <Badge variant="secondary">{currentReport.status}</Badge>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Upload File Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.pdf,.pptx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>

          {/* Element Tools */}
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" onClick={() => addElement('text')}>
            <Type className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSQLEditor(true)}>
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addElement('table')}>
            <Table className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addElement('image')}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addElement('shape')}>
            <Square className="h-4 w-4" />
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

          {/* View Controls */}
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid3X3 className={`h-4 w-4 ${showGrid ? 'text-blue-600' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center bg-white border rounded px-2 py-1">
            {zoom}%
          </span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Export */}
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Left Panel - Tools & Templates */}
        <div className="w-80 bg-white border-r flex flex-col shadow-sm">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-sm mb-3 text-gray-800">Add Elements</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addElement('text')}
                className="h-14 flex flex-col items-center gap-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <Type className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-medium">Text</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addElement('chart')}
                className="h-14 flex flex-col items-center gap-1 hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="text-xs font-medium">Chart</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addElement('table')}
                className="h-14 flex flex-col items-center gap-1 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <Table className="h-5 w-5 text-purple-600" />
                <span className="text-xs font-medium">Table</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addElement('metric')}
                className="h-14 flex flex-col items-center gap-1 hover:bg-orange-50 hover:border-orange-300 transition-colors"
              >
                <span className="text-lg font-bold text-orange-600">#</span>
                <span className="text-xs font-medium">Metric</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addElement('image')}
                className="h-14 flex flex-col items-center gap-1 hover:bg-pink-50 hover:border-pink-300 transition-colors"
              >
                <ImageIcon className="h-5 w-5 text-pink-600" />
                <span className="text-xs font-medium">Image</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addElement('shape')}
                className="h-14 flex flex-col items-center gap-1 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Square className="h-5 w-5 text-gray-600" />
                <span className="text-xs font-medium">Shape</span>
              </Button>
            </div>
          </div>
          
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-sm mb-3 text-gray-800">Data Sources</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSQLEditor(true)}
                className="w-full justify-start h-10 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">SQL Query Builder</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-10 hover:bg-green-50 hover:border-green-300 transition-colors"
                onClick={() => {/* Add CSV import functionality */}}
              >
                <Table className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium">Import CSV Data</span>
              </Button>
            </div>
          </div>
          
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold text-sm mb-3 text-gray-800">File Upload</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start h-10 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2 text-purple-600" />
                <span className="font-medium">Upload Images</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start h-10 hover:bg-orange-50 hover:border-orange-300 transition-colors"
              >
                <FileText className="h-4 w-4 mr-2 text-orange-600" />
                <span className="font-medium">Upload PDF/PPTX</span>
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <h3 className="font-bold text-sm mb-3 text-gray-800">Quick Templates</h3>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg cursor-pointer hover:bg-white hover:shadow-sm transition-all border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded border"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Blank Slide</div>
                    <div className="text-xs text-gray-500">Start with empty canvas</div>
                  </div>
                </div>
              </div>
              <div className="p-3 border rounded-lg cursor-pointer hover:bg-white hover:shadow-sm transition-all border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-gradient-to-r from-green-100 to-green-200 rounded border flex items-center justify-center">
                    <Type className="h-2 w-2 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Title Slide</div>
                    <div className="text-xs text-gray-500">Title and subtitle layout</div>
                  </div>
                </div>
              </div>
              <div className="p-3 border rounded-lg cursor-pointer hover:bg-white hover:shadow-sm transition-all border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded border flex items-center justify-center">
                    <BarChart3 className="h-2 w-2 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Chart Layout</div>
                    <div className="text-xs text-gray-500">Data visualization template</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas */}
          <div className="bg-white flex justify-center" style={{ height: `${(1080 * (zoom / 100)) / 1.5 + 20}px` }}>
            <div 
              ref={canvasRef}
              className="bg-white shadow-2xl relative border mt-2"
              style={{
                width: (1920 * (zoom / 100)) / 1.5,
                height: (1080 * (zoom / 100)) / 1.5,
                background: currentSlide?.backgroundColor || '#ffffff',
                backgroundImage: showGrid ? 'url("data:image/svg+xml,%3Csvg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23e5e7eb" fill-opacity="0.3"%3E%3Ccircle cx="1" cy="1" r="1"/%3E%3C/g%3E%3C/svg%3E")' : 'none'
              }}
              onClick={handleCanvasClick}
            >
              {currentSlide?.elements.map(renderElement)}
            </div>
          </div>

          {/* Bottom Slide Navigator */}
          <div className="bg-white border-t p-4"
               style={{ flexShrink: 0 }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Slides</h3>
              <Button size="sm" onClick={addSlide} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Slide
              </Button>
            </div>
            
            <div 
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ 
                maxWidth: `${(1920 * (zoom / 100)) / 1.5}px`,
                margin: '0 auto'
              }}
            >
              {currentReport?.slides.map((slide, index) => (
                <div
                  key={slide.id}
                  draggable
                  onDragStart={(e) => handleSlideDragStart(e, index)}
                  onDragOver={(e) => handleSlideDragOver(e, index)}
                  onDrop={(e) => handleSlideDrop(e, index)}
                  className={`flex-shrink-0 p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    index === currentSlideIndex
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${dragOverSlideIndex === index ? 'border-green-400 bg-green-50' : ''}`}
                  onClick={() => setCurrentSlideIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-gray-400" />
                    <div 
                      className="w-32 h-18 rounded border bg-white shadow-sm flex-shrink-0"
                      style={{ 
                        background: slide.backgroundColor || '#ffffff',
                        aspectRatio: '16/9'
                      }}
                    >
                      <div className="w-full h-full rounded overflow-hidden relative">
                        {slide.elements.map((element, idx) => (
                          <div
                            key={element.id}
                            className="absolute"
                            style={{
                              left: `${(element.x / 1920) * 100}%`,
                              top: `${(element.y / 1080) * 100}%`,
                              width: `${(element.width / 1920) * 100}%`,
                              height: `${(element.height / 1080) * 100}%`,
                              backgroundColor: element.type === 'text' ? 'transparent' : element.type === 'chart' ? '#dbeafe' : element.type === 'shape' ? '#f3f4f6' : 'transparent',
                              fontSize: '1px',
                              backgroundImage: element.type === 'image' ? `url(${element.content})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs truncate">{slide.name}</div>
                      <div className="text-xs text-gray-500">
                        {slide.elements.length} element{slide.elements.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-2">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 border-l bg-white shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Properties</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {selectedElement ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Element Type</Label>
                  <div className="mt-1 text-sm text-gray-600 capitalize">
                    {currentSlide?.elements.find(e => e.id === selectedElement)?.type || 'Unknown'}
                  </div>
                </div>
                
                {/* Element Properties based on type */}
                {currentSlide?.elements.find(e => e.id === selectedElement)?.type === 'text' && (
                  <div>
                    <Label className="text-sm font-medium">Content</Label>
                    <Textarea 
                      className="mt-1 min-h-20"
                      value={currentSlide?.elements.find(e => e.id === selectedElement)?.content as string || ''}
                      onChange={(e) => updateElement(selectedElement, { content: e.target.value })}
                      placeholder="Enter text content"
                    />
                  </div>
                )}

                {/* Chart/Visualization Element Configuration */}
                {currentSlide?.elements.find(e => e.id === selectedElement)?.type === 'chart' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Chart Configuration</Label>
                    
                    <div>
                      <Label className="text-xs">Chart Type</Label>
                      <Select 
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.content?.type || 'bar'}
                        onValueChange={(value) => updateElement(selectedElement, { 
                          content: { 
                            ...currentSlide?.elements.find(e => e.id === selectedElement)?.content, 
                            type: value 
                          }
                        })}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="table">Data Table</SelectItem>
                          <SelectItem value="metric">Metric Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">SQL Query</Label>
                      <Textarea 
                        className="mt-1 min-h-16 font-mono text-xs"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.content?.query || ''}
                        onChange={(e) => updateElement(selectedElement, { 
                          content: { 
                            ...currentSlide?.elements.find(e => e.id === selectedElement)?.content, 
                            query: e.target.value 
                          }
                        })}
                        placeholder="SELECT column1, column2 FROM table WHERE condition"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input 
                        className="mt-1 h-8"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.content?.title || ''}
                        onChange={(e) => updateElement(selectedElement, { 
                          content: { 
                            ...currentSlide?.elements.find(e => e.id === selectedElement)?.content, 
                            title: e.target.value 
                          }
                        })}
                        placeholder="Chart title"
                      />
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        // Execute query and update chart data
                        const element = currentSlide?.elements.find(e => e.id === selectedElement);
                        if (element?.content?.query) {
                          setCurrentQuery(element.content.query);
                          setCurrentTitle(element.content.title || '');
                          setShowSQLEditor(true);
                        }
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Edit Query & Data
                    </Button>
                  </div>
                )}

                {/* Table Element Configuration */}
                {currentSlide?.elements.find(e => e.id === selectedElement)?.type === 'table' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Table Configuration</Label>
                    
                    <div>
                      <Label className="text-xs">SQL Query</Label>
                      <Textarea 
                        className="mt-1 min-h-16 font-mono text-xs"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.content?.query || ''}
                        onChange={(e) => updateElement(selectedElement, { 
                          content: { 
                            ...currentSlide?.elements.find(e => e.id === selectedElement)?.content, 
                            query: e.target.value 
                          }
                        })}
                        placeholder="SELECT * FROM table LIMIT 100"
                      />
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        const element = currentSlide?.elements.find(e => e.id === selectedElement);
                        if (element?.content?.query) {
                          setCurrentQuery(element.content.query);
                          setCurrentTitle(element.content.title || 'Data Table');
                          setShowSQLEditor(true);
                        }
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure Data Source
                    </Button>
                  </div>
                )}

                {/* Metric Element Configuration */}
                {currentSlide?.elements.find(e => e.id === selectedElement)?.type === 'metric' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Metric Configuration</Label>
                    
                    <div>
                      <Label className="text-xs">Metric Title</Label>
                      <Input 
                        className="mt-1 h-8"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.content?.title || ''}
                        onChange={(e) => updateElement(selectedElement, { 
                          content: { 
                            ...currentSlide?.elements.find(e => e.id === selectedElement)?.content, 
                            title: e.target.value 
                          }
                        })}
                        placeholder="Total Sales"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">SQL Query (should return single value)</Label>
                      <Textarea 
                        className="mt-1 min-h-16 font-mono text-xs"
                        value={currentSlide?.elements.find(e => e.id === selectedElement)?.content?.query || ''}
                        onChange={(e) => updateElement(selectedElement, { 
                          content: { 
                            ...currentSlide?.elements.find(e => e.id === selectedElement)?.content, 
                            query: e.target.value 
                          }
                        })}
                        placeholder="SELECT COUNT(*) as value FROM table"
                      />
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => {
                        const element = currentSlide?.elements.find(e => e.id === selectedElement);
                        if (element?.content?.query) {
                          setCurrentQuery(element.content.query);
                          setCurrentTitle(element.content.title || 'Metric');
                          setShowSQLEditor(true);
                        }
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure Metric Query
                    </Button>
                  </div>
                )}

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

                  {currentSlide?.elements.find(e => e.id === selectedElement)?.type === 'text' && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Input 
                          type="number" 
                          className="mt-1 h-8"
                          value={currentSlide?.elements.find(e => e.id === selectedElement)?.style.fontSize || 16}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { 
                              ...currentSlide?.elements.find(e => e.id === selectedElement)?.style, 
                              fontSize: parseInt(e.target.value) || 16 
                            }
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Text Color</Label>
                        <Input 
                          type="color" 
                          className="mt-1 h-8 w-full"
                          value={currentSlide?.elements.find(e => e.id === selectedElement)?.style.color || '#000000'}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { 
                              ...currentSlide?.elements.find(e => e.id === selectedElement)?.style, 
                              color: e.target.value 
                            }
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Text Align</Label>
                        <Select 
                          value={currentSlide?.elements.find(e => e.id === selectedElement)?.style.textAlign || 'left'}
                          onValueChange={(value) => updateElement(selectedElement, { 
                            style: { 
                              ...currentSlide?.elements.find(e => e.id === selectedElement)?.style, 
                              textAlign: value as 'left' | 'center' | 'right'
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => deleteElement(selectedElement)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Element
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <MousePointer className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Select an element to view properties</p>
              </div>
            )}
          </div>
        </div>


      </div>

      {/* SQL Editor Dialog */}
      <Dialog open={showSQLEditor} onOpenChange={setShowSQLEditor}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>SQL Query Editor & Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
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
            
            <div className="w-96 flex flex-col min-h-0">
              <div className="mb-3">
                <Label className="text-sm font-medium">Query Results</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded border min-h-32 max-h-48 overflow-auto">
                  {isExecutingQuery ? (
                    <div className="flex items-center justify-center h-24">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      <span className="text-sm text-gray-600">Executing query...</span>
                    </div>
                  ) : queryResults ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600">
                        {queryResults.length} rows returned
                      </div>
                      {queryResults.length > 0 && (
                        <div className="overflow-auto">
                          <table className="text-xs w-full border-collapse">
                            <thead>
                              <tr className="border-b bg-gray-100">
                                {Object.keys(queryResults[0]).map((column) => (
                                  <th key={column} className="text-left p-1 font-medium border-r">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {queryResults.slice(0, 5).map((row, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="p-1 border-r">
                                      {String(value).length > 20 
                                        ? String(value).substring(0, 20) + '...' 
                                        : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {queryResults.length > 5 && (
                            <div className="text-xs text-gray-500 mt-1">
                              ... and {queryResults.length - 5} more rows
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No results yet. Run a query to see data.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Chart Type</Label>
                  <Select defaultValue="table">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="metric">Metric Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Refresh Settings</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="auto-refresh"
                        checked={refreshConfig.autoRefresh}
                        onCheckedChange={(checked) => 
                          setRefreshConfig(prev => ({ ...prev, autoRefresh: !!checked }))
                        }
                      />
                      <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
                    </div>
                    
                    {refreshConfig.autoRefresh && (
                      <div>
                        <Label className="text-xs">Refresh Interval (seconds)</Label>
                        <Input 
                          type="number" 
                          className="mt-1 h-8"
                          value={refreshConfig.refreshInterval / 1000}
                          onChange={(e) => 
                            setRefreshConfig(prev => ({ 
                              ...prev, 
                              refreshInterval: (parseInt(e.target.value) || 300) * 1000 
                            }))
                          }
                          min="10"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="refresh-on-load"
                        checked={refreshConfig.refreshOnLoad}
                        onCheckedChange={(checked) => 
                          setRefreshConfig(prev => ({ ...prev, refreshOnLoad: !!checked }))
                        }
                      />
                      <Label htmlFor="refresh-on-load" className="text-sm">Refresh on load</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSQLEditor(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveQueryConfiguration} 
              disabled={!currentQuery.trim() || !currentTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Query & Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}