import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { PresentationModal } from '@/components/PresentationModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
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
  Image as ImageIcon,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Table,
  FileDown,
  Folder,
  File,
  Download,
  FolderOpen,
  ArrowUpDown,
  Filter,
  SortAsc,
  SortDesc,
  HardDrive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { TemplatesManager } from '@/components/TemplatesManager';

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

interface S3Item {
  type: 'file' | 'folder';
  name: string;
  path: string;
  size: number;
  lastModified: string | null;
  key: string;
  extension?: string;
}

export function DataStudioReports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('reports');
  const [showNewReport, setShowNewReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>('');
  const [refreshingReports, setRefreshingReports] = useState<Set<string>>(new Set());
  const [refreshProgress, setRefreshProgress] = useState<Record<string, { current: number; total: number; startTime: number }>>({});
  const [showSuccessToast, setShowSuccessToast] = useState<{ show: boolean; message: string; reportId?: string }>({ show: false, message: '' });
  
  // New report form state
  const [newReportForm, setNewReportForm] = useState({
    name: '',
    description: '',
    schedule: 'manual',
    recipients: '',
    autoRefresh: false
  });

  // S3 Explorer state
  const [s3Items, setS3Items] = useState<S3Item[]>([]);
  const [s3Loading, setS3Loading] = useState(false);
  const [s3Search, setS3Search] = useState('');
  const [s3SortBy, setS3SortBy] = useState('name');
  const [s3SortOrder, setS3SortOrder] = useState<'asc' | 'desc'>('asc');
  const [s3TypeFilter, setS3TypeFilter] = useState<'all' | 'files' | 'folders'>('all');
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  
  const { toast } = useToast();

  // S3 data fetching
  const fetchS3Items = async (prefix = '', search = '', sortBy = 'name', sortOrder = 'asc') => {
    setS3Loading(true);
    try {
      const params = new URLSearchParams({
        prefix,
        search,
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/s3/browse?${params}`);
      if (!response.ok) throw new Error('Failed to fetch S3 items');
      
      const data = await response.json();
      setS3Items(data.items);
      
      // Update breadcrumbs
      if (prefix) {
        const parts = prefix.split('/').filter(Boolean);
        setBreadcrumbs(parts);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error('Error fetching S3 items:', error);
      toast({
        title: "Error",
        description: "Failed to load S3 bucket contents",
        variant: "destructive"
      });
    } finally {
      setS3Loading(false);
    }
  };

  // Load S3 items when tab becomes active
  useEffect(() => {
    if (activeTab === 's3-explorer') {
      fetchS3Items(currentPrefix, s3Search, s3SortBy, s3SortOrder);
    }
  }, [activeTab, currentPrefix, s3Search, s3SortBy, s3SortOrder]);

  // S3 Helper functions
  const handleFolderClick = (folderPath: string) => {
    setCurrentPrefix(folderPath);
  };

  const handleBackClick = () => {
    if (breadcrumbs.length > 0) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const newPrefix = newBreadcrumbs.length > 0 ? newBreadcrumbs.join('/') + '/' : '';
      setCurrentPrefix(newPrefix);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    const newPrefix = newBreadcrumbs.length > 0 ? newBreadcrumbs.join('/') + '/' : '';
    setCurrentPrefix(newPrefix);
  };

  const handleFileDownload = (key: string) => {
    window.open(`/api/s3/download/${encodeURIComponent(key)}`, '_blank');
  };

  const handleFileDelete = async (key: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const response = await fetch(`/api/s3/delete/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete file');
      
      toast({
        title: "Success",
        description: `"${name}" deleted successfully`
      });
      
      // Refresh the current view
      fetchS3Items(currentPrefix, s3Search, s3SortBy, s3SortOrder);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (item: S3Item) => {
    if (item.type === 'folder') return Folder;
    
    const ext = item.extension?.toLowerCase();
    switch (ext) {
      case 'pdf': return FileText;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return ImageIcon;
      case 'mp4':
      case 'avi':
      case 'mov': return Play;
      default: return File;
    }
  };

  // Filter S3 items based on search and type filter
  const filteredS3Items = s3Items.filter(item => {
    const matchesSearch = !s3Search || 
      item.name.toLowerCase().includes(s3Search.toLowerCase()) ||
      item.path.toLowerCase().includes(s3Search.toLowerCase());
    
    const matchesType = s3TypeFilter === 'all' || 
      (s3TypeFilter === 'files' && item.type === 'file') ||
      (s3TypeFilter === 'folders' && item.type === 'folder');
    
    return matchesSearch && matchesType;
  });

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

  // Fetch all slides data for accurate data point calculation and preview thumbnails
  const { data: allSlidesData = {} } = useQuery({
    queryKey: ['/api/all-slides-data', presentations],
    queryFn: async () => {
      if (!presentations.length) return {};
      
      const presentationSlidePromises = presentations.map(async (presentation: any) => {
        if (!presentation.slideIds?.length) return { presentationId: presentation.id, slides: [], firstSlide: null };
        
        try {
          // Fetch all slides for this presentation
          const slidePromises = presentation.slideIds.map(async (slideId: string) => {
            const response = await fetch(`/api/slides/${slideId}`);
            if (response.ok) {
              return response.json();
            }
            return null;
          });
          
          const slides = await Promise.all(slidePromises);
          const validSlides = slides.filter(slide => slide !== null);
          
          return { 
            presentationId: presentation.id, 
            slides: validSlides,
            firstSlide: validSlides[0] || null
          };
        } catch (error) {
          console.error('Failed to fetch slides for presentation:', presentation.id, error);
        }
        return { presentationId: presentation.id, slides: [], firstSlide: null };
      });
      
      const results = await Promise.all(presentationSlidePromises);
      return results.reduce((acc, result) => {
        acc[result.presentationId] = result;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: presentations.length > 0
  });

  // Extract first slide data for previews (backward compatibility)
  const slidePreviewsData = Object.keys(allSlidesData).reduce((acc, presentationId) => {
    acc[presentationId] = allSlidesData[presentationId]?.firstSlide || null;
    return acc;
  }, {} as Record<string, any>);

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

  // Handle PDF download
  const handleDownloadPDF = async (reportId: string, reportName: string) => {
    try {
      // Show loading state
      toast({
        title: "Generating PDF",
        description: "Creating PDF report, please wait...",
        duration: 3000,
      });

      // First try to get existing PDF URL or generate new one
      const response = await fetch(`/api/presentations/${reportId}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.pdfUrl) {
          // Open PDF in new tab
          window.open(data.pdfUrl, '_blank');
          
          toast({
            title: "PDF Ready",
            description: `PDF for "${reportName}" is ready to download`,
            duration: 5000,
          });
        } else {
          throw new Error(data.message || 'Failed to generate PDF');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Refresh report data function
  // Generate thumbnails for presentations that don't have preview images
  const generateMissingThumbnails = async () => {
    const presentationsWithoutThumbnails = presentations.filter((p: any) => !p.previewImageUrl);
    
    for (const presentation of presentationsWithoutThumbnails) {
      const presentationData = allSlidesData[presentation.id];
      if (presentationData?.slides?.length > 0) {
        // Find first slide with an image element
        for (const slide of presentationData.slides) {
          if (slide?.elements) {
            const imageElement = slide.elements.find((element: any) => 
              element.type === 'image' && (element.content || element.uploadedImageId)
            );
            
            if (imageElement) {
              const previewUrl = imageElement.content || 
                (imageElement.uploadedImageId ? `/uploads/${imageElement.uploadedImageId}` : null);
              
              if (previewUrl) {
                try {
                  await fetch(`/api/presentations/${presentation.id}`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      previewImageUrl: previewUrl
                    })
                  });
                  console.log(`Generated thumbnail for presentation: ${presentation.title}`);
                } catch (error) {
                  console.error(`Failed to generate thumbnail for ${presentation.title}:`, error);
                }
                break; // Use first image found
              }
            }
          }
        }
      }
    }
    
    // Refresh presentations data after thumbnail generation
    if (presentationsWithoutThumbnails.length > 0) {
      refetch();
    }
  };

  // Auto-generate thumbnails when data loads
  useEffect(() => {
    if (presentations.length > 0 && Object.keys(allSlidesData).length > 0) {
      generateMissingThumbnails();
    }
  }, [presentations, allSlidesData]);

  const handleRefreshReport = async (reportId: string) => {
    try {
      // Add to refreshing reports
      setRefreshingReports(prev => {
        const newSet = new Set(prev);
        newSet.add(reportId);
        return newSet;
      });
      
      const startTime = Date.now();
      
      // Get all slides for this presentation to find actual queries
      const presentationData = allSlidesData[reportId];
      if (!presentationData) {
        throw new Error('No slides found for this report');
      }

      // Access the slides array from the presentation data structure
      const allSlides = presentationData.slides || [];
      const dataQueries: Array<{ slideId: string; elementId: string; query: string; elementType: string; title: string }> = [];
      
      console.log('Starting refresh for report:', reportId);
      console.log('Found slides:', allSlides.length);
      
      // Extract all actual queries from slide elements
      allSlides.forEach((slide: any, slideIndex: number) => {
        console.log(`Processing slide ${slideIndex + 1}:`, slide.title || slide.id);
        if (slide?.elements) {
          console.log(`  Found ${slide.elements.length} elements`);
          slide.elements.forEach((element: any, elementIndex: number) => {
            // Check ALL elements, not just data visualization types
            console.log(`  Element ${elementIndex + 1}:`, {
              type: element.type,
              id: element.id,
              title: element.title || element.content?.title || 'Untitled',
              hasDataSource: !!element.dataSource,
              hasContentQuery: !!element.content?.query,
              hasDirectQuery: !!element.query,
              contentType: element.content?.type,
              fullContent: element.content
            });

            let query: string | null = null;
            
            // Check for queries in ALL elements that might have data
            if (element.type === 'chart' || element.type === 'table' || element.type === 'metric') {
              // Standard location - dataSource.query
              if (element.dataSource?.query) {
                query = element.dataSource.query;
                console.log('    Query found in dataSource');
              }
              // Alternative location - content.query (common for metrics)
              else if (element.content?.query) {
                query = element.content.query;
                console.log('    Query found in content');
              }
              // Direct query property
              else if (element.query) {
                query = element.query;
                console.log('    Query found in element.query');
              }
              // Sometimes queries are stored as strings in content for charts/tables
              else if (typeof element.content === 'object' && element.content?.data && element.content?.query) {
                query = element.content.query;
                console.log('    Query found in content data object');
              }
              
              if (query && typeof query === 'string' && query.trim().toLowerCase().includes('select')) {
                console.log('    Adding valid SQL query:', query.substring(0, 50) + '...');
                dataQueries.push({
                  slideId: slide.id,
                  elementId: element.id,
                  query: query.trim(),
                  elementType: element.type,
                  title: element.title || element.content?.title || `${element.type} visualization`
                });
              } else if (query) {
                console.log('    Found query but not valid SQL:', typeof query, query);
              } else {
                console.log('    No query found for data element:', element.type, element.id);
              }
            } else {
              console.log('    Skipping non-data element:', element.type);
            }
          });
        } else {
          console.log(`  Slide has no elements`);
        }
      });

      console.log(`Total queries found: ${dataQueries.length}`);

      const totalQueries = dataQueries.length;
      
      if (totalQueries === 0) {
        throw new Error('No data queries found in this report');
      }
      
      // Initialize progress tracking
      setRefreshProgress(prev => ({
        ...prev,
        [reportId]: { current: 0, total: totalQueries, startTime }
      }));

      // Group queries by type for better reporting
      const queryByType = dataQueries.reduce((acc, query) => {
        acc[query.elementType] = (acc[query.elementType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Query breakdown by type:', queryByType);

      // Execute each actual query
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < dataQueries.length; i++) {
        const queryInfo = dataQueries[i];
        
        console.log(`Executing query ${i + 1}/${totalQueries} for ${queryInfo.elementType}: ${queryInfo.title}`);
        
        try {
          // Execute the actual query
          const response = await fetch('/api/snowflake/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: queryInfo.query
            })
          });

          if (response.ok) {
            successCount++;
            console.log(`  ✓ Success for ${queryInfo.title}`);
          } else {
            failureCount++;
            console.warn(`  ✗ Failed for ${queryInfo.title}:`, response.status);
          }
        } catch (error) {
          failureCount++;
          console.warn(`  ✗ Error for ${queryInfo.title}:`, error);
        }
        
        // Update progress
        setRefreshProgress(prev => ({
          ...prev,
          [reportId]: { 
            current: i + 1, 
            total: totalQueries, 
            startTime 
          }
        }));

        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const endTime = Date.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);

      // Create detailed description
      const typeDescriptions = Object.entries(queryByType)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ');

      const resultDescription = failureCount > 0 
        ? `Refreshed ${successCount}/${totalQueries} queries (${failureCount} failed) including ${typeDescriptions} in ${totalTime} seconds`
        : `Successfully refreshed ${totalQueries} ${totalQueries === 1 ? 'query' : 'queries'} including ${typeDescriptions} in ${totalTime} seconds`;

      console.log('Refresh completed:', { successCount, failureCount, totalTime });

      // Generate and save updated preview image after successful refresh
      if (successCount > 0) {
        try {
          await generateAndSavePreviewImage(reportId);
          console.log('Preview image updated for report:', reportId);
        } catch (error) {
          console.warn('Failed to update preview image:', error);
        }
      }

      // Show success toast
      toast({
        title: failureCount > 0 ? "Report Partially Refreshed" : "Report Data Refreshed",
        description: resultDescription,
        variant: failureCount > 0 ? "destructive" : "default",
        duration: 8000,
      });

    } catch (error) {
      console.error('Error refreshing report:', error);
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh report data",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      // Remove from refreshing reports
      setRefreshingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      
      // Clear progress
      setRefreshProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[reportId];
        return newProgress;
      });
    }
  };

  // Slide thumbnail generator and cache
  const [thumbnailCache, setThumbnailCache] = useState<Record<string, string>>({});
  const slideRenderRef = useRef<HTMLDivElement>(null);

  // Generate and save persistent preview image for a report
  const generateAndSavePreviewImage = async (reportId: string): Promise<void> => {
    const presentationData = allSlidesData[reportId];
    if (!presentationData?.slides?.length) {
      throw new Error('No slides found for preview generation');
    }

    // Use first slide with content for preview, or first slide if none have content
    const slideWithContent = presentationData.slides.find((slide: any) => 
      slide?.elements?.some((el: any) => el.type === 'chart' || el.type === 'table' || el.type === 'metric')
    ) || presentationData.slides[0];

    if (!slideWithContent) {
      throw new Error('No suitable slide found for preview');
    }

    // Generate thumbnail
    const thumbnailDataUrl = await generateThumbnail(slideWithContent, slideWithContent.id);
    if (!thumbnailDataUrl) {
      throw new Error('Failed to generate thumbnail');
    }

    // Convert data URL to blob
    const response = await fetch(thumbnailDataUrl);
    const blob = await response.blob();

    // Create form data for upload
    const formData = new FormData();
    formData.append('file', blob, `report-preview-${reportId}-${Date.now()}.png`);

    // Upload image
    const uploadResponse = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload preview image');
    }

    const uploadedImage = await uploadResponse.json();

    // Update presentation with preview image ID and refresh timestamp
    const updateResponse = await fetch(`/api/presentations/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        previewImageId: uploadedImage.id,
        lastRefreshed: new Date().toISOString()
      })
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update presentation with preview image');
    }
  };

  // Generate thumbnail from slide data
  const generateThumbnail = async (slideData: any, slideId: string): Promise<string | null> => {
    if (!slideData || !slideData.elements?.length) {
      return null;
    }

    try {
      // Create a temporary container for rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.height = '450px';
      tempContainer.style.backgroundColor = slideData.backgroundColor || '#ffffff';
      document.body.appendChild(tempContainer);

      // Render slide elements
      slideData.elements.forEach((element: any) => {
        const elementDiv = document.createElement('div');
        elementDiv.style.position = 'absolute';
        elementDiv.style.left = `${element.x || 0}px`;
        elementDiv.style.top = `${element.y || 0}px`;
        elementDiv.style.width = `${element.width || 100}px`;
        elementDiv.style.height = `${element.height || 50}px`;
        elementDiv.style.fontSize = `${element.fontSize || 14}px`;
        elementDiv.style.color = element.color || '#000000';
        elementDiv.style.backgroundColor = element.backgroundColor || 'transparent';
        elementDiv.style.fontWeight = element.fontWeight || 'normal';
        elementDiv.style.textAlign = element.textAlign || 'left';
        elementDiv.style.display = 'flex';
        elementDiv.style.alignItems = 'center';
        elementDiv.style.justifyContent = element.textAlign === 'center' ? 'center' : 'flex-start';
        elementDiv.style.padding = '4px';
        elementDiv.style.boxSizing = 'border-box';
        elementDiv.style.overflow = 'hidden';
        elementDiv.style.wordBreak = 'break-word';

        if (element.type === 'text') {
          elementDiv.textContent = element.content || 'Text';
        } else if (element.type === 'chart') {
          elementDiv.style.backgroundColor = '#3b82f6';
          elementDiv.style.color = '#ffffff';
          elementDiv.style.justifyContent = 'center';
          elementDiv.textContent = 'CHART';
        } else if (element.type === 'table') {
          elementDiv.style.backgroundColor = '#10b981';
          elementDiv.style.color = '#ffffff';
          elementDiv.style.justifyContent = 'center';
          elementDiv.textContent = 'TABLE';
        } else if (element.type === 'metric') {
          elementDiv.style.backgroundColor = '#f59e0b';
          elementDiv.style.color = '#ffffff';
          elementDiv.style.justifyContent = 'center';
          elementDiv.textContent = element.content || 'METRIC';
        } else if (element.type === 'shape') {
          elementDiv.style.borderRadius = element.borderRadius ? `${element.borderRadius}px` : '0px';
        }

        tempContainer.appendChild(elementDiv);
      });

      // Generate thumbnail using html2canvas
      const canvas = await html2canvas(tempContainer, {
        width: 800,
        height: 450,
        scale: 0.4, // Scale down for thumbnail
        useCORS: true,
        allowTaint: false
      });

      // Cleanup
      document.body.removeChild(tempContainer);

      // Convert to data URL
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  };

  // Generate thumbnails for all slides
  useEffect(() => {
    const generateThumbnails = async () => {
      if (!slidePreviewsData || Object.keys(slidePreviewsData).length === 0) return;

      const newThumbnails: Record<string, string> = {};
      
      for (const [presentationId, slideData] of Object.entries(slidePreviewsData)) {
        if (slideData && !thumbnailCache[presentationId]) {
          const thumbnail = await generateThumbnail(slideData, presentationId);
          if (thumbnail) {
            newThumbnails[presentationId] = thumbnail;
          }
        }
      }

      if (Object.keys(newThumbnails).length > 0) {
        setThumbnailCache(prev => ({ ...prev, ...newThumbnails }));
      }
    };

    generateThumbnails();
  }, [slidePreviewsData]);

  // Slide preview component
  const SlidePreview = ({ slideData, presentationId }: { slideData: any; presentationId: string }) => {
    // First check if presentation has a generated preview image
    const presentation = presentations.find((p: any) => p.id === presentationId);
    if (presentation?.previewImageUrl) {
      const thumbnailUrl = presentation.previewImageUrl.startsWith('/uploads/') 
        ? `${window.location.origin}${presentation.previewImageUrl}`
        : presentation.previewImageUrl;
      
      return (
        <div className="w-full aspect-video bg-white rounded border border-gray-200 overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt="Report preview" 
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // Look for images in all slides of the presentation
    const presentationData = allSlidesData[presentationId];
    if (presentationData?.slides?.length > 0) {
      // Find first slide with an image element
      for (const slide of presentationData.slides) {
        if (slide?.elements) {
          const imageElement = slide.elements.find((element: any) => 
            element.type === 'image' && (element.content || element.uploadedImageId)
          );
          
          if (imageElement) {
            const imageUrl = imageElement.content || 
              (imageElement.uploadedImageId ? `/uploads/${imageElement.uploadedImageId}` : null);
            
            if (imageUrl) {
              const thumbnailUrl = imageUrl.startsWith('/uploads/') 
                ? `${window.location.origin}${imageUrl}`
                : imageUrl;
              
              return (
                <div className="w-full aspect-video bg-white rounded border border-gray-200 overflow-hidden">
                  <img 
                    src={thumbnailUrl} 
                    alt="Slide preview" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Hide broken images
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              );
            }
          }
        }
      }
    }

    // Fallback to cached thumbnail if available
    const thumbnailUrl = thumbnailCache[presentationId];
    if (thumbnailUrl) {
      return (
        <div className="w-full aspect-video bg-white rounded border border-gray-200 overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt="Slide preview" 
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // Default empty state with presentation icon
    return (
      <div className="w-full aspect-video bg-gradient-to-r from-blue-50 to-blue-100 rounded border border-blue-200 flex items-center justify-center">
        <Presentation className="h-8 w-8 text-blue-400" />
      </div>
    );
  };

  // Calculate actual data points from all slide elements across all slides
  const calculateDataPoints = (presentationId: string): number => {
    const presentationData = allSlidesData[presentationId];
    if (!presentationData || !presentationData.slides) return 0;

    let totalDataPoints = 0;
    
    // Count data visualization elements across all slides
    presentationData.slides.forEach((slide: any) => {
      if (slide && slide.elements) {
        const dataElements = slide.elements.filter((element: any) => 
          element.type === 'chart' || 
          element.type === 'table' || 
          element.type === 'metric'
        );
        totalDataPoints += dataElements.length;
      }
    });

    return totalDataPoints;
  };

  // Transform presentations to match Report interface
  const reports: Report[] = presentations.map((presentation: any) => {
    const dataPoints = calculateDataPoints(presentation.id);
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
                    <Input 
                      id="report-name" 
                      placeholder="Enter report name" 
                      value={newReportForm.name}
                      onChange={(e) => setNewReportForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="report-schedule">Schedule</Label>
                    <Select 
                      value={newReportForm.schedule} 
                      onValueChange={(value) => setNewReportForm(prev => ({ ...prev, schedule: value }))}
                    >
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
                  <Textarea 
                    id="report-description" 
                    placeholder="Enter report description" 
                    value={newReportForm.description}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="report-recipients">Recipients (email addresses)</Label>
                  <Textarea 
                    id="report-recipients" 
                    placeholder="Enter email addresses separated by commas"
                    className="min-h-20"
                    value={newReportForm.recipients}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, recipients: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto-refresh" 
                    checked={newReportForm.autoRefresh}
                    onCheckedChange={(checked) => setNewReportForm(prev => ({ ...prev, autoRefresh: checked }))}
                  />
                  <Label htmlFor="auto-refresh">Auto-refresh data before sending</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowNewReport(false);
                    // Reset form
                    setNewReportForm({
                      name: '',
                      description: '',
                      schedule: 'manual',
                      recipients: '',
                      autoRefresh: false
                    });
                  }}>Cancel</Button>
                  <Button 
                    onClick={() => {
                      // Store form data in localStorage to persist across navigation
                      localStorage.setItem('newReportFormData', JSON.stringify(newReportForm));
                      setShowNewReport(false);
                      window.location.href = '/reports/builder';
                    }}
                    disabled={!newReportForm.name.trim()}
                  >Create & Open Builder</Button>
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
            <TabsTrigger value="s3-explorer">S3 Bucket Explorer</TabsTrigger>
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
                            <DropdownMenuItem onClick={() => handleRefreshReport(report.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh Data
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(report.id, report.name)}>
                              <FileDown className="h-4 w-4 mr-2" />
                              Download PDF
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
                      {/* Slide Preview - always show preview area */}
                      <div className="mb-3">
                        <SlidePreview slideData={slidePreviewsData[report.id]} presentationId={report.id} />
                      </div>
                      
                      {/* Progress indicator during refresh */}
                      {refreshingReports.has(report.id) && refreshProgress[report.id] && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">Refreshing data...</span>
                            <span className="text-sm text-blue-700">
                              {refreshProgress[report.id].current} / {refreshProgress[report.id].total} queries
                            </span>
                          </div>
                          <Progress 
                            value={(refreshProgress[report.id].current / refreshProgress[report.id].total) * 100} 
                            className="w-full h-2" 
                          />
                          <div className="text-xs text-blue-600 mt-1">
                            {((Date.now() - refreshProgress[report.id].startTime) / 1000).toFixed(1)}s elapsed
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {report.description}
                      </p>
                      
                      {/* Download PDF Button */}
                      <div className="mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(report.id, report.name)}
                          className="w-full h-9"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Download PDF Report
                        </Button>
                      </div>
                      
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
        <TemplatesManager />
      </TabsContent>

          <TabsContent value="s3-explorer" className="space-y-4 mt-4">
            {/* S3 Explorer Header with Search and Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search files and folders..."
                    value={s3Search}
                    onChange={(e) => setS3Search(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Select value={s3TypeFilter} onValueChange={(value: 'all' | 'files' | 'folders') => setS3TypeFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="files">Files Only</SelectItem>
                    <SelectItem value="folders">Folders Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select value={s3SortBy} onValueChange={setS3SortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="lastModified">Modified</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setS3SortOrder(s3SortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {s3SortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchS3Items(currentPrefix, s3Search, s3SortBy, s3SortOrder)}
                  disabled={s3Loading}
                >
                  <RefreshCw className={`h-4 w-4 ${s3Loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <HardDrive className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">4sale-cdp-assets</span>
                <span className="text-gray-400">/</span>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => handleBreadcrumbClick(index)}
                    >
                      {crumb}
                    </button>
                    {index < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
                  </React.Fragment>
                ))}
                {breadcrumbs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackClick}
                    className="ml-auto"
                  >
                    <FolderOpen className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
            )}

            {/* S3 Items Display */}
            {s3Loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading S3 bucket contents...</p>
              </div>
            ) : filteredS3Items.length === 0 ? (
              <div className="text-center py-8">
                <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No items found</p>
                <p className="text-sm text-gray-500">
                  {s3Search ? 'Try adjusting your search criteria' : 'This folder is empty'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Items Summary */}
                <div className="text-sm text-gray-600 mb-4">
                  {filteredS3Items.length} items ({filteredS3Items.filter(i => i.type === 'folder').length} folders, {filteredS3Items.filter(i => i.type === 'file').length} files)
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredS3Items.map((item) => {
                    const IconComponent = getFileIcon(item);
                    return (
                      <Card 
                        key={item.key} 
                        className="hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => item.type === 'folder' ? handleFolderClick(item.path) : undefined}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <IconComponent 
                                className={`h-5 w-5 flex-shrink-0 ${
                                  item.type === 'folder' 
                                    ? 'text-blue-600' 
                                    : item.extension === 'pdf' 
                                      ? 'text-red-600'
                                      : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(item.extension || '')
                                        ? 'text-green-600'
                                        : 'text-gray-600'
                                }`} 
                              />
                              <span className="text-sm font-medium truncate" title={item.name}>
                                {item.name}
                              </span>
                            </div>
                            {item.type === 'file' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleFileDownload(item.key)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.path)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Path
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleFileDelete(item.key, item.name)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-500">
                            {item.type === 'file' && (
                              <div className="flex justify-between">
                                <span>Size:</span>
                                <span>{formatFileSize(item.size)}</span>
                              </div>
                            )}
                            {item.lastModified && (
                              <div className="flex justify-between">
                                <span>Modified:</span>
                                <span>{new Date(item.lastModified).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="capitalize">
                                {item.type === 'file' ? (item.extension?.toUpperCase() || 'File') : 'Folder'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
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