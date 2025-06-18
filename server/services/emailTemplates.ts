export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  html: string;
  variables: string[];
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'professional',
    name: 'Professional Report',
    description: 'Clean, corporate design suitable for business reports',
    preview: '/templates/professional-preview.png',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{report_title}}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; }
          .content p { color: #666; line-height: 1.6; margin-bottom: 15px; }
          .report-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .report-info h3 { margin: 0 0 10px 0; color: #495057; }
          .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef; }
          .footer p { margin: 0; color: #6c757d; font-size: 14px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{report_title}}</h1>
            <p>Generated on {{generation_date}} • {{generation_time}}</p>
          </div>
          <div class="content">
            <h2>Dear {{recipient_name}},</h2>
            <p>{{email_content}}</p>
            
            <div class="report-info">
              <h3>Report Details</h3>
              <p><strong>Report Name:</strong> {{report_name}}</p>
              <p><strong>Period:</strong> {{report_period}}</p>
              <p><strong>Generated:</strong> {{generation_date}} at {{generation_time}}</p>
              <p><strong>Next Report:</strong> {{next_execution}}</p>
            </div>
            
            <p>The detailed report is attached as a PDF file. If you have any questions about this report, please don't hesitate to contact our analytics team.</p>
            
            <a href="{{dashboard_url}}" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>This is an automated report from 4Sale Analytics Platform</p>
            <p>© 2025 4Sale. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url']
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple, minimalist design focused on content',
    preview: '/templates/minimal-preview.png',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{report_title}}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #ffffff; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
          .header p { margin: 5px 0 0 0; color: #7f8c8d; }
          .content p { line-height: 1.7; margin-bottom: 15px; }
          .report-summary { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #7f8c8d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{report_title}}</h1>
            <p>{{generation_date}} • {{generation_time}}</p>
          </div>
          <div class="content">
            <p>Hello {{recipient_name}},</p>
            <p>{{email_content}}</p>
            
            <div class="report-summary">
              <strong>{{report_name}}</strong><br>
              Period: {{report_period}}<br>
              Next report: {{next_execution}}
            </div>
            
            <p>Please find the detailed report attached.</p>
            <p>Best regards,<br>4Sale Analytics Team</p>
          </div>
          <div class="footer">
            <p>4Sale Analytics Platform • Automated Report Delivery</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution']
  },
  {
    id: 'dashboard',
    name: 'Dashboard Style',
    description: 'Modern dashboard-inspired design with metrics highlights',
    preview: '/templates/dashboard-preview.png',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{report_title}}</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
          .header .subtitle { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
          .metrics { display: flex; justify-content: space-between; padding: 0 30px; margin-top: -20px; }
          .metric-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; margin: 0 5px; }
          .metric-value { font-size: 24px; font-weight: 700; color: #1f2937; margin: 0; }
          .metric-label { font-size: 12px; color: #6b7280; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .content { padding: 40px 30px 30px; }
          .content p { color: #4b5563; line-height: 1.6; margin-bottom: 16px; }
          .report-details { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .detail-label { color: #6b7280; font-weight: 500; }
          .detail-value { color: #1f2937; font-weight: 600; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 25px 30px; text-align: center; }
          .footer p { margin: 0; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{report_title}}</h1>
            <p class="subtitle">Analytics Report • {{generation_date}}</p>
          </div>
          
          <div class="metrics">
            <div class="metric-card">
              <p class="metric-value">{{metric_1_value}}</p>
              <p class="metric-label">{{metric_1_label}}</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">{{metric_2_value}}</p>
              <p class="metric-label">{{metric_2_label}}</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">{{metric_3_value}}</p>
              <p class="metric-label">{{metric_3_label}}</p>
            </div>
          </div>
          
          <div class="content">
            <p>Hi {{recipient_name}},</p>
            <p>{{email_content}}</p>
            
            <div class="report-details">
              <div class="detail-row">
                <span class="detail-label">Report Name</span>
                <span class="detail-value">{{report_name}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Report Period</span>
                <span class="detail-value">{{report_period}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Generated</span>
                <span class="detail-value">{{generation_date}} {{generation_time}}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Next Report</span>
                <span class="detail-value">{{next_execution}}</span>
              </div>
            </div>
            
            <p>The complete report with detailed analytics is attached as a PDF file.</p>
            
            <a href="{{dashboard_url}}" class="cta-button">Open Dashboard</a>
          </div>
          
          <div class="footer">
            <p>Powered by 4Sale Analytics Platform</p>
            <p>© 2025 4Sale. This report was generated automatically.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url', 'metric_1_value', 'metric_1_label', 'metric_2_value', 'metric_2_label', 'metric_3_value', 'metric_3_label']
  }
];

export function processEmailTemplate(templateHtml: string, variables: Record<string, string>): string {
  let processedHtml = templateHtml;
  
  // Replace template variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedHtml = processedHtml.replace(regex, value || '');
  });
  
  // Add default values for common variables
  const defaultVariables = {
    generation_date: new Date().toLocaleDateString(),
    generation_time: new Date().toLocaleTimeString(),
    dashboard_url: process.env.REPLIT_DEV_DOMAIN ? 
      `https://${process.env.REPLIT_DEV_DOMAIN}` : 
      'https://analytics.4sale.tech'
  };
  
  Object.entries(defaultVariables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedHtml = processedHtml.replace(regex, value);
  });
  
  return processedHtml;
}