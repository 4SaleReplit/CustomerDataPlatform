import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  X,
  Maximize2,
  Download,
  Edit
} from 'lucide-react';

interface PresentationModalProps {
  presentationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PresentationModal({ presentationId, isOpen, onClose }: PresentationModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch presentation data
  const { data: presentation, isLoading: presentationLoading } = useQuery({
    queryKey: ['/api/presentations', presentationId],
    queryFn: async () => {
      const response = await fetch(`/api/presentations/${presentationId}`);
      if (!response.ok) throw new Error('Failed to fetch presentation');
      return response.json();
    },
    enabled: isOpen && !!presentationId
  });

  // Fetch slides data
  const { data: slides = [], isLoading: slidesLoading } = useQuery({
    queryKey: ['/api/slides', presentation?.slideIds],
    queryFn: async () => {
      if (!presentation?.slideIds?.length) return [];
      
      const slidePromises = presentation.slideIds.map(async (slideId: string) => {
        const response = await fetch(`/api/slides/${slideId}`);
        if (!response.ok) throw new Error(`Failed to fetch slide ${slideId}`);
        return response.json();
      });
      
      return Promise.all(slidePromises);
    },
    enabled: !!presentation?.slideIds?.length
  });

  // Refresh data mutation
  const refreshDataMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      
      // Find all elements with SQL queries across all slides
      const refreshPromises = slides.map(async (slide: any) => {
        const elementsWithQueries = slide.elements?.filter(
          (element: any) => (element.type === 'query' && element.dataSource?.query) ||
                           (element.type === 'metric' && element.content?.query)
        ) || [];

        for (const element of elementsWithQueries) {
          try {
            const query = element.type === 'metric' ? element.content.query : element.dataSource.query;
            
            const response = await fetch('/api/snowflake/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (element.type === 'metric') {
                element.content.data = data.rows || [];
              } else {
                element.data = data.rows || [];
              }
            }
          } catch (error) {
            console.error('Failed to refresh data for element:', element.id, error);
          }
        }
      });

      await Promise.all(refreshPromises);
      return slides;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slides'] });
      setIsRefreshing(false);
    },
    onError: () => {
      setIsRefreshing(false);
    }
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
        setCurrentSlideIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentSlideIndex, slides.length, onClose]);

  // Reset slide index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (presentationLoading || slidesLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading presentation...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!presentation || !slides.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Presentation not found</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentSlide = slides[currentSlideIndex];



  const renderSlideElement = (element: any) => {
    const style = {
      position: 'absolute' as const,
      left: `${(element.x / 1920) * 100}%`,
      top: `${(element.y / 1080) * 100}%`,
      width: element.width ? `${(element.width / 1920) * 100}%` : 'auto',
      height: element.height ? `${(element.height / 1080) * 100}%` : 'auto',
      fontSize: element.fontSize ? `${element.fontSize * 0.7}px` : '10px',
      fontFamily: element.fontFamily || 'Inter',
      fontWeight: element.fontWeight || 'normal',
      color: element.color || '#000000',
      textAlign: element.textAlign || 'left',
      textDecoration: element.textDecoration || 'none',
      textTransform: element.textTransform || 'none',
      letterSpacing: element.letterSpacing || 'normal',
      lineHeight: element.lineHeight || 'normal',
      zIndex: element.zIndex || 1
    };

    switch (element.type) {
      case 'text':
        return (
          <div key={element.id} style={style} className="pointer-events-none">
            {element.content}
          </div>
        );
      
      case 'image':
        return (
          <img
            key={element.id}
            src={element.src || element.content}
            alt=""
            style={style}
            className="pointer-events-none object-cover"
          />
        );
      
      case 'metric':
        const metricData = element.content?.data;
        const metricValue = metricData && metricData.length > 0 ? Object.values(metricData[0])[0] : '0';
        const metricStyle = element.content?.style || 'minimal';
        
        return (
          <div key={element.id} style={style} className="w-full h-full rounded overflow-hidden">
            {metricStyle === 'gradient' && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 w-full h-full flex flex-col justify-center">
                <div className="text-xs text-blue-600 mb-1">{element.content?.title || 'Metric'}</div>
                <div className="text-xl font-bold text-blue-800">
                  {typeof metricValue === 'number' ? metricValue.toLocaleString() : String(metricValue)}
                </div>
              </div>
            )}
            {metricStyle === 'solid' && (
              <div className="bg-green-500 text-white p-3 rounded-lg w-full h-full flex flex-col justify-center">
                <div className="text-xs opacity-90 mb-1">{element.content?.title || 'Metric'}</div>
                <div className="text-xl font-bold">
                  {typeof metricValue === 'number' ? metricValue.toLocaleString() : String(metricValue)}
                </div>
              </div>
            )}
            {(metricStyle === 'minimal' || !metricStyle) && (
              <div className="bg-white border-2 border-gray-200 p-3 rounded-lg w-full h-full flex flex-col justify-center">
                <div className="text-xs text-gray-600 mb-1">{element.content?.title || 'Metric'}</div>
                <div className="text-xl font-bold text-gray-900">
                  {typeof metricValue === 'number' ? metricValue.toLocaleString() : String(metricValue)}
                </div>
              </div>
            )}
            {metricStyle === 'valueOnly' && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-3xl font-bold text-gray-900">
                  {typeof metricValue === 'number' ? metricValue.toLocaleString() : String(metricValue)}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'query':
        if (element.data && Array.isArray(element.data)) {
          return (
            <div key={element.id} style={style} className="bg-white border rounded p-1 text-xs overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {Object.keys(element.data[0] || {}).map((key) => (
                      <th key={key} className="text-left p-1 font-medium text-xs">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {element.data.slice(0, 8).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      {Object.values(row).map((value: any, cellIdx: number) => (
                        <td key={cellIdx} className="p-1 text-xs">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <div key={element.id} style={style} className="bg-gray-100 border rounded p-1 text-xs">
            No data available
          </div>
        );
      
      default:
        console.log('Unknown element type:', element.type, element);
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Presentation Preview</DialogTitle>
          <DialogDescription>Preview of presentation slides with navigation controls</DialogDescription>
        </VisuallyHidden>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">{presentation.title}</h2>
              <Badge variant="outline">
                Slide {currentSlideIndex + 1} of {slides.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshDataMutation.mutate()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/design-studio?presentationId=${presentationId}`, '_blank')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {/* Slide Display */}
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-5xl aspect-video bg-white shadow-xl rounded-lg overflow-hidden relative">
              {/* Background Image */}
              {currentSlide.backgroundImage && (
                <img
                  src={currentSlide.backgroundImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              
              {/* Slide Elements */}
              {currentSlide.elements?.map(renderSlideElement)}
              
              {/* Refresh overlay */}
              {isRefreshing && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium">Refreshing data...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlideIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === slides.length - 1}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}