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
  slideNumber: number;
}

export function PDFSlideViewer({ presentationId, templateId, className }: PDFSlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);

  const contentId = presentationId || templateId;

  // Fetch slides for the selected content
  const { data: slidesData, isLoading } = useQuery({
    queryKey: ['/api/presentations', contentId],
    queryFn: () => {
      if (presentationId) {
        return apiRequest(`/api/presentations/${presentationId}`);
      } else if (templateId) {
        return apiRequest(`/api/templates/${templateId}`);
      }
      return null;
    },
    enabled: !!contentId
  });

  // Fetch presentation/template data for PDF URL
  const { data: contentData } = useQuery({
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

  useEffect(() => {
    if (slidesData?.slides) {
      const sortedSlides = slidesData.slides
        .map((slide: any, index: number) => ({
          id: slide.id,
          content: slide.content,
          slideNumber: slide.slideNumber || index + 1
        }))
        .sort((a: Slide, b: Slide) => a.slideNumber - b.slideNumber);
      setSlides(sortedSlides);
      setCurrentSlide(0);
    }
  }, [slidesData]);

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
        {currentSlideData?.content ? (
          <div className="w-full h-full flex items-center justify-center overflow-hidden rounded">
            {currentSlideData.content.includes('<img') || currentSlideData.content.includes('uploads/') ? (
              <div 
                className="w-full h-full object-contain"
                dangerouslySetInnerHTML={{ __html: currentSlideData.content }}
              />
            ) : currentSlideData.content.startsWith('uploads/') ? (
              <img 
                src={`/${currentSlideData.content}`}
                alt={`Slide ${currentSlide + 1}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-center"
                dangerouslySetInnerHTML={{ __html: currentSlideData.content }}
              />
            )}
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