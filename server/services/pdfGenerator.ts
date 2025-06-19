import PDFDocument from 'pdfkit';
import { createCanvas } from 'canvas';
import { pdfStorageService } from './pdfStorage';
import fs from 'fs';
import path from 'path';

export interface SlideElement {
  id: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'image';
  content?: any;
  position: { x: number; y: number; width: number; height: number };
  styling?: any;
}

export interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  slides: Slide[];
}

export class PDFGeneratorService {
  
  async generatePresentationPDF(presentation: any): Promise<Buffer> {
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

        // Use existing preview images instead of generating new slides
        for (let i = 0; i < presentation.slides.length; i++) {
          const slide = presentation.slides[i];
          if (i > 0) doc.addPage();
          await this.addExistingSlideImage(doc, slide, i + 1);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private createTitlePage(doc: PDFKit.PDFDocument, presentation: Presentation): void {
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
       .text(`Total Slides: ${presentation.slides.length}`, 50, doc.page.height - 80);

    // Footer
    doc.rect(0, doc.page.height - 50, doc.page.width, 50)
       .fillAndStroke('#f3f4f6', '#f3f4f6');

    doc.fillColor('#6b7280')
       .fontSize(10)
       .text('© 2025 4Sale Technologies - Business Intelligence Platform', 50, doc.page.height - 30);
  }

  private async createSlidePageFromData(doc: PDFKit.PDFDocument, slide: any, slideNumber: number): Promise<void> {
    // Background
    if (slide.backgroundColor && slide.backgroundColor !== '#ffffff') {
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill(slide.backgroundColor);
    }

    // Check if slide has a background image from uploaded images
    if (slide.backgroundImage) {
      await this.renderBackgroundImage(doc, slide.backgroundImage);
    }

    // Slide header
    doc.rect(0, 0, doc.page.width, 60)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    doc.fillColor('#1e3a8a')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(slide.title || `Slide ${slideNumber}`, 50, 20);

    doc.fillColor('#6b7280')
       .fontSize(12)
       .text(`Slide ${slideNumber}`, doc.page.width - 100, 25);

    // Process slide elements from database
    if (slide.elements && Array.isArray(slide.elements)) {
      for (const element of slide.elements) {
        await this.renderElementFromData(doc, element);
      }
    }
  }

  private createSlidePage(doc: PDFKit.PDFDocument, slide: Slide, slideNumber: number): void {
    // Background
    if (slide.backgroundColor) {
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill(slide.backgroundColor);
    }

    // Slide header
    doc.rect(0, 0, doc.page.width, 60)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    doc.fillColor('#1e3a8a')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(slide.title, 50, 20);

    doc.fillColor('#6b7280')
       .fontSize(12)
       .text(`Slide ${slideNumber}`, doc.page.width - 100, 25);

    // Process slide elements
    slide.elements.forEach(element => {
      this.renderElement(doc, element);
    });
  }

  private renderElement(doc: PDFKit.PDFDocument, element: SlideElement): void {
    // Handle missing or invalid position data
    const position = element.position || { x: 50, y: 100, width: 200, height: 100 };
    const { x, y, width, height } = position;
    const adjustedY = y + 80; // Offset for header

    switch (element.type) {
      case 'text':
        this.renderTextElement(doc, element, x, adjustedY, width, height);
        break;
      case 'metric':
        this.renderMetricElement(doc, element, x, adjustedY, width, height);
        break;
      case 'table':
        this.renderTableElement(doc, element, x, adjustedY, width, height);
        break;
      case 'chart':
        this.renderChartElement(doc, element, x, adjustedY, width, height);
        break;
      default:
        this.renderPlaceholderElement(doc, element, x, adjustedY, width, height);
    }
  }

  private renderTextElement(doc: PDFKit.PDFDocument, element: SlideElement, x: number, y: number, width: number, height: number): void {
    const content = element.content?.text || 'Text Element';
    const fontSize = element.styling?.fontSize || 12;
    const color = element.styling?.color || '#000000';

    doc.fillColor(color)
       .fontSize(fontSize)
       .text(content, x, y, { width, height });
  }

  private renderMetricElement(doc: PDFKit.PDFDocument, element: SlideElement, x: number, y: number, width: number, height: number): void {
    const value = element.content?.value || '0';
    const label = element.content?.label || 'Metric';

    // Background box
    doc.rect(x, y, width, height)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    // Metric value
    doc.fillColor('#1e3a8a')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(value, x + 10, y + 10, { width: width - 20 });

    // Metric label
    doc.fillColor('#6b7280')
       .fontSize(12)
       .font('Helvetica')
       .text(label, x + 10, y + height - 30, { width: width - 20 });
  }

  private renderTableElement(doc: PDFKit.PDFDocument, element: SlideElement, x: number, y: number, width: number, height: number): void {
    const data = element.content?.data || [];
    const headers = element.content?.headers || [];

    if (headers.length === 0 || data.length === 0) {
      this.renderPlaceholderElement(doc, element, x, y, width, height);
      return;
    }

    const cellWidth = width / headers.length;
    const cellHeight = 20;

    // Draw headers
    headers.forEach((header: string, index: number) => {
      const cellX = x + (index * cellWidth);
      doc.rect(cellX, y, cellWidth, cellHeight)
         .fillAndStroke('#1e3a8a', '#1e3a8a');
      
      doc.fillColor('white')
         .fontSize(10)
         .text(header, cellX + 5, y + 5, { width: cellWidth - 10 });
    });

    // Draw data rows (limited to fit in height)
    const maxRows = Math.floor((height - cellHeight) / cellHeight);
    const rowsToShow = Math.min(data.length, maxRows);

    for (let rowIndex = 0; rowIndex < rowsToShow; rowIndex++) {
      const row = data[rowIndex];
      const rowY = y + cellHeight + (rowIndex * cellHeight);

      headers.forEach((header: string, colIndex: number) => {
        const cellX = x + (colIndex * cellWidth);
        const cellValue = row[header] || '';

        doc.rect(cellX, rowY, cellWidth, cellHeight)
           .stroke('#e2e8f0');

        doc.fillColor('#374151')
           .fontSize(9)
           .text(String(cellValue), cellX + 5, rowY + 5, { width: cellWidth - 10 });
      });
    }
  }

  private renderChartElement(doc: PDFKit.PDFDocument, element: SlideElement, x: number, y: number, width: number, height: number): void {
    // Chart placeholder with type info
    doc.rect(x, y, width, height)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    const chartType = element.content?.chartType || 'chart';
    doc.fillColor('#6b7280')
       .fontSize(14)
       .text(`[${chartType.toUpperCase()} CHART]`, x + 10, y + height/2 - 10, { width: width - 20 });

    // Add data summary if available
    if (element.content?.data) {
      const dataCount = Array.isArray(element.content.data) ? element.content.data.length : 'N/A';
      doc.fontSize(10)
         .text(`Data Points: ${dataCount}`, x + 10, y + height/2 + 10);
    }
  }

  private renderPlaceholderElement(doc: PDFKit.PDFDocument, element: SlideElement, x: number, y: number, width: number, height: number): void {
    doc.rect(x, y, width, height)
       .fillAndStroke('#f3f4f6', '#d1d5db');

    doc.fillColor('#9ca3af')
       .fontSize(12)
       .text(`[${element.type.toUpperCase()}]`, x + 10, y + height/2 - 6, { width: width - 20 });
  }

  private async renderElementFromData(doc: PDFKit.PDFDocument, element: any): Promise<void> {
    if (!element || !element.position) return;

    const { x, y, width, height } = element.position;
    const adjustedY = y + 80; // Offset for header

    try {
      switch (element.type) {
        case 'image':
          await this.renderImageElementFromData(doc, element, x, adjustedY, width, height);
          break;
        case 'text':
          this.renderTextElementFromData(doc, element, x, adjustedY, width, height);
          break;
        case 'chart':
          this.renderChartElementFromData(doc, element, x, adjustedY, width, height);
          break;
        case 'table':
          this.renderTableElementFromData(doc, element, x, adjustedY, width, height);
          break;
        case 'metric':
          this.renderMetricElementFromData(doc, element, x, adjustedY, width, height);
          break;
        default:
          this.renderPlaceholderElementFromData(doc, element, x, adjustedY, width, height);
      }
    } catch (error) {
      console.warn(`Failed to render element ${element.type}:`, error);
      this.renderPlaceholderElementFromData(doc, element, x, adjustedY, width, height);
    }
  }

  private async renderImageElementFromData(doc: PDFKit.PDFDocument, element: any, x: number, y: number, width: number, height: number): Promise<void> {
    try {
      // Get image from uploaded images or content URL
      let imageUrl: string | undefined = undefined;
      
      if (element.content?.uploadedImageId) {
        const { storage } = await import('../storage');
        const uploadedImage = await storage.getUploadedImage(element.content.uploadedImageId);
        if (uploadedImage) {
          imageUrl = uploadedImage.url;
        }
      } else if (element.content?.url) {
        imageUrl = element.content.url;
      }

      if (imageUrl && typeof imageUrl === 'string') {
        let finalImagePath = imageUrl;
        
        // For local uploads, construct full path
        if (imageUrl.startsWith('/uploads/')) {
          const relativePath = imageUrl.split('/uploads/')[1];
          finalImagePath = path.join(process.cwd(), 'uploads', relativePath);
        }
        
        // Check if file exists before adding to PDF
        if (fs.existsSync(finalImagePath)) {
          doc.image(finalImagePath, x, y, { width, height, fit: [width, height] });
          console.log(`✅ Rendered image in PDF: ${finalImagePath}`);
        } else {
          console.warn(`Image file not found: ${finalImagePath}`);
          this.renderImagePlaceholder(doc, x, y, width, height, 'IMAGE FILE NOT FOUND');
        }
      } else {
        console.warn('No valid image URL found in element');
        this.renderImagePlaceholder(doc, x, y, width, height, 'NO IMAGE URL');
      }
    } catch (error) {
      console.warn('Failed to render image element:', error);
      this.renderImagePlaceholder(doc, x, y, width, height, 'IMAGE ERROR');
    }
  }

  private renderImagePlaceholder(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, message: string): void {
    doc.rect(x, y, width, height)
       .fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#6b7280')
       .fontSize(12)
       .text(`[${message}]`, x + 10, y + height/2 - 6, { width: width - 20, align: 'center' });
  }

  private async renderBackgroundImage(doc: PDFKit.PDFDocument, backgroundImageId: string): Promise<void> {
    try {
      const { storage } = await import('../storage');
      const uploadedImage = await storage.getUploadedImage(backgroundImageId);
      
      if (uploadedImage) {
        let imageUrl = uploadedImage.url;
        if (imageUrl.startsWith('/uploads/')) {
          imageUrl = `./uploads/${imageUrl.split('/uploads/')[1]}`;
        }
        
        // Add background image covering the full page
        doc.image(imageUrl, 0, 0, { 
          width: doc.page.width, 
          height: doc.page.height,
          fit: [doc.page.width, doc.page.height]
        });
      }
    } catch (error) {
      console.warn('Failed to render background image:', error);
    }
  }

  private renderTextElementFromData(doc: PDFKit.PDFDocument, element: any, x: number, y: number, width: number, height: number): void {
    const content = element.content?.text || element.content?.content || 'Text Element';
    const fontSize = element.styling?.fontSize || element.style?.fontSize || 12;
    const color = element.styling?.color || element.style?.color || '#000000';

    doc.fillColor(color)
       .fontSize(fontSize)
       .text(content, x, y, { width, height });
  }

  private renderChartElementFromData(doc: PDFKit.PDFDocument, element: any, x: number, y: number, width: number, height: number): void {
    // Chart placeholder with actual chart type from data
    doc.rect(x, y, width, height)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    const chartType = element.content?.chartType || element.chartType || 'chart';
    doc.fillColor('#6b7280')
       .fontSize(14)
       .text(`[${chartType.toUpperCase()} CHART]`, x + 10, y + height/2 - 10, { width: width - 20 });

    if (element.content?.title) {
      doc.fontSize(10)
         .text(element.content.title, x + 10, y + height/2 + 10);
    }
  }

  private renderTableElementFromData(doc: PDFKit.PDFDocument, element: any, x: number, y: number, width: number, height: number): void {
    const data = element.content?.data || element.data || [];
    const headers = element.content?.headers || element.headers || [];

    if (headers.length === 0 || data.length === 0) {
      this.renderPlaceholderElementFromData(doc, element, x, y, width, height);
      return;
    }

    const cellWidth = width / headers.length;
    const cellHeight = 20;

    // Draw headers
    headers.forEach((header: string, index: number) => {
      const cellX = x + (index * cellWidth);
      doc.rect(cellX, y, cellWidth, cellHeight)
         .fillAndStroke('#1e3a8a', '#1e3a8a');
      
      doc.fillColor('white')
         .fontSize(10)
         .text(header, cellX + 5, y + 5, { width: cellWidth - 10 });
    });

    // Draw data rows (limited to fit in height)
    const maxRows = Math.floor((height - cellHeight) / cellHeight);
    const rowsToShow = Math.min(data.length, maxRows);

    for (let rowIndex = 0; rowIndex < rowsToShow; rowIndex++) {
      const row = data[rowIndex];
      const rowY = y + cellHeight + (rowIndex * cellHeight);

      headers.forEach((header: string, colIndex: number) => {
        const cellX = x + (colIndex * cellWidth);
        const cellValue = row[header] || '';

        doc.rect(cellX, rowY, cellWidth, cellHeight)
           .stroke('#e2e8f0');

        doc.fillColor('#374151')
           .fontSize(9)
           .text(String(cellValue), cellX + 5, rowY + 5, { width: cellWidth - 10 });
      });
    }
  }

  private renderMetricElementFromData(doc: PDFKit.PDFDocument, element: any, x: number, y: number, width: number, height: number): void {
    const value = element.content?.value || element.value || '0';
    const label = element.content?.label || element.label || 'Metric';

    // Background box
    doc.rect(x, y, width, height)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    // Metric value
    doc.fillColor('#1e3a8a')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(String(value), x + 10, y + 10, { width: width - 20 });

    // Metric label
    doc.fillColor('#6b7280')
       .fontSize(12)
       .font('Helvetica')
       .text(String(label), x + 10, y + height - 30, { width: width - 20 });
  }

  private renderPlaceholderElementFromData(doc: PDFKit.PDFDocument, element: any, x: number, y: number, width: number, height: number): void {
    doc.rect(x, y, width, height)
       .fillAndStroke('#f3f4f6', '#d1d5db');

    doc.fillColor('#9ca3af')
       .fontSize(12)
       .text(`[${(element.type || 'ELEMENT').toUpperCase()}]`, x + 10, y + height/2 - 6, { width: width - 20 });
  }

  private async addExistingSlideImage(doc: PDFKit.PDFDocument, slide: any, slideNumber: number): Promise<void> {
    try {
      // Look for existing slide preview image in presentation
      const presentationPreviewImage = await this.findSlidePreviewImage(slide.id);
      
      if (presentationPreviewImage) {
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

        // Add the actual slide preview image
        const imageY = 80; // Below header
        const imageHeight = doc.page.height - 140; // Leave space for header and footer
        const imageWidth = doc.page.width - 100;
        
        doc.image(presentationPreviewImage, 50, imageY, { 
          width: imageWidth, 
          height: imageHeight,
          fit: [imageWidth, imageHeight]
        });
        
        console.log(`✅ Used existing slide preview image for slide ${slideNumber}`);
      } else {
        // Fallback to original slide creation if no preview image exists
        await this.createSlidePageFromData(doc, slide, slideNumber);
        console.log(`⚠️ No preview image found for slide ${slideNumber}, generated content instead`);
      }
    } catch (error) {
      console.warn(`Failed to use preview image for slide ${slideNumber}:`, error);
      // Fallback to original method
      await this.createSlidePageFromData(doc, slide, slideNumber);
    }
  }

  private async findSlidePreviewImage(slideId: string): Promise<string | null> {
    try {
      // Check if there's a preview image for this specific slide
      // This would typically be stored when the slide is previewed in the browser
      const previewImagePath = path.join(process.cwd(), 'uploads', 'slide-previews', `${slideId}.png`);
      
      if (fs.existsSync(previewImagePath)) {
        return previewImagePath;
      }

      // Alternative: Look for uploaded images associated with this slide
      const { storage } = await import('../storage');
      const slide = await storage.getSlide(slideId);
      
      if (slide?.elements) {
        // Find the first image element in the slide
        for (const element of slide.elements) {
          if (element.type === 'image' && element.content?.uploadedImageId) {
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
      }

      return null;
    } catch (error) {
      console.warn('Error finding slide preview image:', error);
      return null;
    }
  }

  async generateAndStorePDF(presentation: Presentation): Promise<{ pdfUrl: string; s3Key: string }> {
    try {
      // Generate PDF buffer
      const pdfBuffer = await this.generatePresentationPDF(presentation);
      
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
      
      console.log(`✅ Generated and stored PDF for presentation: ${presentation.title}`);
      
      return {
        pdfUrl: uploadResult.publicUrl,
        s3Key: uploadResult.s3Key
      };
    } catch (error) {
      console.error('Failed to generate and store PDF:', error);
      throw error;
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();