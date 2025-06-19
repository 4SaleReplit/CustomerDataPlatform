import PDFDocument from 'pdfkit';
import { pdfStorageService } from './pdfStorage';
import fs from 'fs';
import path from 'path';

export class SlideScreenshotPDFGenerator {
  
  async generateFromSlideScreenshots(presentation: any): Promise<{ pdfUrl: string; s3Key: string }> {
    try {
      // Generate PDF buffer using actual slide preview images
      const pdfBuffer = await this.createPDFFromScreenshots(presentation);
      
      // Create filename
      const filename = `${presentation.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Upload to S3
      const uploadResult = await pdfStorageService.uploadPDF(presentation.id, pdfBuffer, filename);
      
      // Update presentation record with PDF URL
      await pdfStorageService.updatePresentationPdfUrl(
        presentation.id,
        uploadResult.publicUrl,
        uploadResult.s3Key
      );
      
      console.log(`✅ Generated PDF from slide screenshots for presentation: ${presentation.title}`);
      
      return {
        pdfUrl: uploadResult.publicUrl,
        s3Key: uploadResult.s3Key
      };
    } catch (error) {
      console.error('Failed to generate PDF from screenshots:', error);
      throw error;
    }
  }

  private async createPDFFromScreenshots(presentation: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title page
        this.createTitlePage(doc, presentation);

        // Get slides from storage
        const { storage } = await import('../storage');
        const slides = presentation.slideIds ? 
          await Promise.all(presentation.slideIds.map(async (slideId: string) => {
            return await storage.getSlide(slideId);
          })) : [];

        // Use existing slide preview images directly
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          if (!slide) continue;
          
          if (i > 0) doc.addPage();
          await this.addSlideFromExistingData(doc, slide, i + 1);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private createTitlePage(doc: PDFKit.PDFDocument, presentation: any): void {
    // Header with 4Sale branding
    doc.rect(0, 0, doc.page.width, 100)
       .fillAndStroke('#1e3a8a', '#1e3a8a');

    doc.fillColor('white')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('4Sale Analytics Report', 50, 30);

    // Main title
    doc.fillColor('#1e3a8a')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(presentation.title, 50, 150);

    // Description
    if (presentation.description) {
      doc.fillColor('#4b5563')
         .fontSize(14)
         .font('Helvetica')
         .text(presentation.description, 50, 200, { width: 700 });
    }

    // Generation info
    doc.fillColor('#6b7280')
       .fontSize(12)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, doc.page.height - 100)
       .text(`Total Slides: ${presentation.slideIds?.length || 0}`, 50, doc.page.height - 80);

    // Footer
    doc.rect(0, doc.page.height - 50, doc.page.width, 50)
       .fillAndStroke('#f3f4f6', '#f3f4f6');

    doc.fillColor('#6b7280')
       .fontSize(10)
       .text('© 2025 4Sale Technologies - Business Intelligence Platform', 50, doc.page.height - 30);
  }

  private async addSlideFromExistingData(doc: PDFKit.PDFDocument, slide: any, slideNumber: number): Promise<void> {
    try {
      // Add slide header
      doc.rect(0, 0, doc.page.width, 60)
         .fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#1e3a8a')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(slide.title || `Slide ${slideNumber}`, 50, 20);

      doc.fillColor('#6b7280')
         .fontSize(12)
         .text(`Slide ${slideNumber}`, doc.page.width - 100, 25);

      // Try to find and use the first image from the slide elements
      const slideImage = await this.findSlideImage(slide);
      
      if (slideImage) {
        // Use the actual uploaded image as the slide content
        const imageY = 80;
        const maxImageHeight = doc.page.height - 140;
        const maxImageWidth = doc.page.width - 100;
        
        doc.image(slideImage, 50, imageY, { 
          width: maxImageWidth, 
          height: maxImageHeight,
          fit: [maxImageWidth, maxImageHeight]
        });
        
        console.log(`✅ Used existing image for slide ${slideNumber}: ${slideImage}`);
      } else {
        // Create a simple text-based slide if no image is found
        doc.fillColor('#374151')
           .fontSize(16)
           .text('Slide content will appear here', 50, 200, { 
             width: doc.page.width - 100,
             height: doc.page.height - 250,
             align: 'center'
           });
        
        console.log(`⚠️ No image found for slide ${slideNumber}, using text placeholder`);
      }
    } catch (error) {
      console.warn(`Failed to add slide ${slideNumber}:`, error);
      
      // Fallback content
      doc.fillColor('#9ca3af')
         .fontSize(14)
         .text(`[SLIDE ${slideNumber} - CONTENT NOT AVAILABLE]`, 50, 200, { 
           width: doc.page.width - 100,
           align: 'center'
         });
    }
  }

  private async findSlideImage(slide: any): Promise<string | null> {
    try {
      if (!slide.elements || !Array.isArray(slide.elements)) {
        return null;
      }

      // Look for the first image element in the slide
      for (const element of slide.elements) {
        if (element.type === 'image' && element.content?.uploadedImageId) {
          const { storage } = await import('../storage');
          const uploadedImage = await storage.getUploadedImage(element.content.uploadedImageId);
          
          if (uploadedImage) {
            let imageUrl = uploadedImage.url;
            if (imageUrl.startsWith('/uploads/')) {
              const relativePath = imageUrl.split('/uploads/')[1];
              const fullPath = path.join(process.cwd(), 'uploads', relativePath);
              if (fs.existsSync(fullPath)) {
                return fullPath;
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('Error finding slide image:', error);
      return null;
    }
  }
}