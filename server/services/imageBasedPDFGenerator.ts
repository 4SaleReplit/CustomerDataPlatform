import PDFDocument from 'pdfkit';
import { pdfStorageService } from './pdfStorage';
import fs from 'fs';
import path from 'path';

export class ImageBasedPDFGenerator {
  
  async generateFromUploadedImages(presentation: any): Promise<{ pdfUrl: string; s3Key: string }> {
    try {
      // Create PDF buffer using only uploaded images from slides
      const pdfBuffer = await this.createPDFFromImages(presentation);
      
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
      
      console.log(`✅ Generated PDF from uploaded images for presentation: ${presentation.title}`);
      
      return {
        pdfUrl: uploadResult.publicUrl,
        s3Key: uploadResult.s3Key
      };
    } catch (error) {
      console.error('Failed to generate PDF from images:', error);
      throw error;
    }
  }

  private async createPDFFromImages(presentation: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 30, bottom: 30, left: 30, right: 30 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title page
        this.createTitlePage(doc, presentation);

        // Find all uploaded images from presentation slides
        const slideImages = await this.findAllSlideImages(presentation);
        
        console.log(`Found ${slideImages.length} slide images for PDF generation`);

        // Add each image as a full page
        for (let i = 0; i < slideImages.length; i++) {
          const slideImage = slideImages[i];
          doc.addPage();
          await this.addImagePage(doc, slideImage, i + 1);
        }

        // If no images found, add a simple message
        if (slideImages.length === 0) {
          doc.addPage();
          doc.fillColor('#374151')
             .fontSize(16)
             .text('No slide images found for this presentation', 50, 200, { 
               width: doc.page.width - 100,
               align: 'center'
             });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private createTitlePage(doc: PDFKit.PDFDocument, presentation: any): void {
    // Header
    doc.rect(0, 0, doc.page.width, 80)
       .fillAndStroke('#1e3a8a', '#1e3a8a');

    doc.fillColor('white')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('4Sale Analytics Report', 40, 25);

    // Main title
    doc.fillColor('#1e3a8a')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(presentation.title, 40, 120);

    // Description
    if (presentation.description) {
      doc.fillColor('#4b5563')
         .fontSize(12)
         .font('Helvetica')
         .text(presentation.description, 40, 160, { width: 700 });
    }

    // Generation info
    doc.fillColor('#6b7280')
       .fontSize(10)
       .text(`Generated: ${new Date().toLocaleDateString()}`, 40, doc.page.height - 80)
       .text(`Total Slides: ${presentation.slideIds?.length || 0}`, 40, doc.page.height - 65);
  }

  private async addImagePage(doc: PDFKit.PDFDocument, slideImage: any, slideNumber: number): Promise<void> {
    try {
      // Add slide header
      doc.rect(0, 0, doc.page.width, 50)
         .fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#1e3a8a')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(slideImage.title || `Slide ${slideNumber}`, 30, 15);

      doc.fillColor('#6b7280')
         .fontSize(10)
         .text(`Slide ${slideNumber}`, doc.page.width - 80, 20);

      // Add the full uploaded image
      const imageY = 60;
      const maxImageHeight = doc.page.height - 100;
      const maxImageWidth = doc.page.width - 60;
      
      if (fs.existsSync(slideImage.imagePath)) {
        doc.image(slideImage.imagePath, 30, imageY, { 
          width: maxImageWidth, 
          height: maxImageHeight,
          fit: [maxImageWidth, maxImageHeight]
        });
        
        console.log(`✅ Added slide image ${slideNumber}: ${slideImage.imagePath}`);
      } else {
        // Fallback if image file doesn't exist
        doc.fillColor('#9ca3af')
           .fontSize(12)
           .text(`[IMAGE NOT FOUND: ${slideImage.imagePath}]`, 30, imageY + 50, { 
             width: maxImageWidth,
             align: 'center'
           });
      }
    } catch (error) {
      console.warn(`Failed to add image page ${slideNumber}:`, error);
      
      // Fallback content
      doc.fillColor('#9ca3af')
         .fontSize(12)
         .text(`[SLIDE ${slideNumber} - IMAGE ERROR]`, 30, 100, { 
           width: doc.page.width - 60,
           align: 'center'
         });
    }
  }

  private async findAllSlideImages(presentation: any): Promise<any[]> {
    const slideImages: any[] = [];
    
    try {
      if (!presentation.slideIds || !Array.isArray(presentation.slideIds)) {
        console.log('No slideIds found in presentation');
        return slideImages;
      }

      // Load storage dynamically to avoid circular imports
      const { storage } = await import('../storage');

      // Process each slide to find uploaded images
      for (const slideId of presentation.slideIds) {
        try {
          const slide = await storage.getSlide(slideId);
          
          if (slide?.elements && Array.isArray(slide.elements)) {
            // Find all image elements in this slide
            for (const element of slide.elements) {
              if (element.type === 'image' && element.content?.uploadedImageId) {
                const uploadedImage = await storage.getUploadedImage(element.content.uploadedImageId);
                
                if (uploadedImage) {
                  let imageUrl = uploadedImage.url;
                  if (imageUrl.startsWith('/uploads/')) {
                    const relativePath = imageUrl.split('/uploads/')[1];
                    const fullPath = path.join(process.cwd(), 'uploads', relativePath);
                    
                    if (fs.existsSync(fullPath)) {
                      slideImages.push({
                        title: slide.title,
                        imagePath: fullPath,
                        slideId: slideId
                      });
                      console.log(`Found slide image: ${fullPath}`);
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing slide ${slideId}:`, error);
        }
      }

      return slideImages;
    } catch (error) {
      console.error('Error finding slide images:', error);
      return slideImages;
    }
  }
}