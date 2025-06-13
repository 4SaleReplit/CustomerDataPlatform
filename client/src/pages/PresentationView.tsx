import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  RefreshCw, 
  Maximize2, 
  Edit,
  Download,
  Share
} from 'lucide-react';
import { CodeMirrorSQLEditor } from '@/components/dashboard/CodeMirrorSQLEditor';

interface PresentationViewProps {
  presentationId: string;
}

export function PresentationView({ presentationId }: PresentationViewProps) {
  const [, setLocation] = useLocation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshingSlides, setRefreshingSlides] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch presentation data
  const { data: presentation, isLoading: presentationLoading } = useQuery({
    queryKey: ['/api/presentations', presentationId],
    queryFn: async () => {
      const response = await fetch(`/api/presentations/${presentationId}`);
      if (!response.ok) throw new Error('Failed to fetch presentation');
      return response.json();
    }
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
    mutationFn: async (slideId: string) => {
      const slide = slides.find(s => s.id === slideId);
      if (!slide) return;

      // Find elements with SQL queries and refresh their data
      const elementsWithQueries = slide.elements.filter(
        (element: any) => element.type === 'query' || element.dataSource?.query
      );

      for (const element of elementsWithQueries) {
        if (element.dataSource?.query) {
          const response = await fetch('/api/snowflake/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: element.dataSource.query,
              limit: element.dataSource.limit || 100
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            // Update the element's data
            element.data = data;
          }
        }
      }

      return slide;
    },
    onMutate: (slideId) => {
      setRefreshingSlides(prev => {
        const newSet = new Set(prev);
        newSet.add(slideId);
        return newSet;
      });
    },
    onSettled: (_, __, slideId) => {
      setRefreshingSlides(prev => {
        const newSet = new Set(prev);
        newSet.delete(slideId);
        return newSet;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slides'] });
    }
  });

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlay && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
        setCurrentSlideIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, slides.length, isFullscreen]);

  if (presentationLoading || slidesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (!presentation || !slides.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Presentation not found</p>
          <Button onClick={() => setLocation('/all-reports')}>
            Return to All Reports
          </Button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  const refreshAllData = async () => {
    for (const slide of slides) {
      await refreshDataMutation.mutateAsync(slide.id);
    }
  };

  const renderSlideElement = (element: any) => {
    const style = {
      position: 'absolute' as const,
      left: `${(element.x / 1920) * 100}%`,
      top: `${(element.y / 1080) * 100}%`,
      width: element.width ? `${(element.width / 1920) * 100}%` : 'auto',
      height: element.height ? `${(element.height / 1080) * 100}%` : 'auto',
      fontSize: element.fontSize ? `${element.fontSize}px` : '14px',
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
            src={element.src}
            alt=""
            style={style}
            className="pointer-events-none object-cover"
          />
        );
      
      case 'query':
        if (element.data && Array.isArray(element.data)) {
          return (
            <div key={element.id} style={style} className="bg-white border rounded p-2 text-xs overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {Object.keys(element.data[0] || {}).map((key) => (
                      <th key={key} className="text-left p-1 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {element.data.slice(0, 10).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      {Object.values(row).map((value: any, cellIdx: number) => (
                        <td key={cellIdx} className="p-1">
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
          <div key={element.id} style={style} className="bg-gray-100 border rounded p-2 text-xs">
            No data available
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-screen'} flex flex-col`}>
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/all-reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{presentation.title}</h1>
              <p className="text-sm text-gray-600">
                Slide {currentSlideIndex + 1} of {slides.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllData}
              disabled={refreshDataMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshDataMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh All Data
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/design-studio?presentationId=${presentationId}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
            >
              {isAutoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Slide Display */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-6xl aspect-video bg-white shadow-xl">
          <CardContent className="p-0 h-full relative overflow-hidden">
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
            
            {/* Refresh indicator for current slide */}
            {refreshingSlides.has(currentSlide.id) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium">Refreshing data...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Controls */}
      {!isFullscreen && (
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
      )}

      {/* Fullscreen controls */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-50 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-white text-sm px-2">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="text-white hover:bg-white hover:bg-opacity-20 ml-2"
          >
            Exit Fullscreen
          </Button>
        </div>
      )}
    </div>
  );
}