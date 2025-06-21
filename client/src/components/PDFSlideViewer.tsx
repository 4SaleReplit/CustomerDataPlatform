import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PDFSlideViewerProps {
  presentationId?: string;
  templateId?: string;
  className?: string;
}

interface Slide {
  id: string;
  content: string;
  elements?: any[];
  slideNumber: number;
}

export function PDFSlideViewer({ presentationId, templateId, className }: PDFSlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);

  const contentId = presentationId || templateId;

  // Fetch presentation/template data to get slideIds
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: presentationId ? ['/api/presentations', presentationId] : ['/api/templates', templateId],
    queryFn: () => {
      if (presentationId) {
        return apiRequest(`/api/presentations/${presentationId}`);
      } else if (templateId) {
        return apiRequest(`/api/templates/${templateId}`);
      }
      return null;
    },
    enabled: !!(presentationId || templateId)
  });

  // Fetch individual slides using slideIds
  const { data: slidesArray = [], isLoading: slidesLoading } = useQuery({
    queryKey: ['/api/slides', contentData?.slideIds],
    queryFn: async () => {
      if (!contentData?.slideIds?.length) return [];
      
      const slidePromises = contentData.slideIds.map(async (slideId: string) => {
        const response = await fetch(`/api/slides/${slideId}`);
        if (!response.ok) throw new Error(`Failed to fetch slide ${slideId}`);
        return response.json();
      });
      
      return Promise.all(slidePromises);
    },
    enabled: !!contentData?.slideIds?.length
  });

  const isLoading = contentLoading || slidesLoading;

  useEffect(() => {
    console.log('PDFSlideViewer - slidesArray:', slidesArray);
    console.log('PDFSlideViewer - contentData:', contentData);
    
    if (slidesArray?.length) {
      const sortedSlides = slidesArray
        .map((slide: any, index: number) => ({
          id: slide.id,
          content: slide.content,
          elements: slide.elements,
          slideNumber: slide.slideNumber || index + 1
        }))
        .sort((a: Slide, b: Slide) => a.slideNumber - b.slideNumber);
      console.log('PDFSlideViewer - sortedSlides:', sortedSlides);
      setSlides(sortedSlides);
      setCurrentSlide(0);
    }
  }, [slidesArray]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (!contentId) {
    return (
      <div className={`border rounded-lg h-64 flex items-center justify-center text-muted-foreground ${className}`}>
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select content to preview slides</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`border rounded-lg h-64 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading slides...</p>
        </div>
      </div>
    );
  }

  if (!slides.length) {
    return (
      <div className={`border rounded-lg h-64 flex items-center justify-center text-muted-foreground ${className}`}>
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No slides available</p>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Slide Content */}
      <div className="h-64 bg-white flex items-center justify-center p-2 relative">
        {currentSlideData ? (
          <div className="w-full h-full relative bg-white rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {(currentSlideData as any).elements?.map((element: any) => {
              const style = {
                position: 'absolute' as const,
                left: `${(element.x / 1920) * 100}%`,
                top: `${(element.y / 1080) * 100}%`,
                width: element.width ? `${(element.width / 1920) * 100}%` : 'auto',
                height: element.height ? `${(element.height / 1080) * 100}%` : 'auto',
                fontSize: element.fontSize ? `${element.fontSize * 0.5}px` : '7px', // Scale down for preview
                fontFamily: element.fontFamily || 'Inter',
                fontWeight: element.fontWeight || 'normal',
                color: element.color || '#000000',
                textAlign: element.textAlign || 'left',
                zIndex: element.zIndex || 1
              };

              if (element.type === 'image') {
                const imageSrc = element.content || (element.uploadedImageId ? `/uploads/${element.uploadedImageId}` : null);
                if (imageSrc) {
                  return (
                    <img
                      key={element.id}
                      src={imageSrc}
                      alt="Slide element"
                      style={style}
                      className="object-contain"
                    />
                  );
                }
              } else if (element.type === 'text') {
                return (
                  <div
                    key={element.id}
                    style={style}
                    className="overflow-hidden"
                  >
                    {element.content}
                  </div>
                );
              } else if (element.type === 'chart') {
                return (
                  <div
                    key={element.id}
                    style={style}
                    className="bg-gray-100 border border-gray-300 flex items-center justify-center text-xs text-gray-500"
                  >
                    Chart
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Slide {currentSlide + 1}</p>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="bg-gray-50 border-t px-4 py-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} of {slides.length}
          </span>
          {contentData?.pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(contentData.pdfUrl, '_blank')}
              className="ml-4"
            >
              View PDF
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}