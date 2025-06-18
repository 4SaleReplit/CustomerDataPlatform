import nodemailer from 'nodemailer';

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      secure: true,
      port: 465,
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error('Gmail credentials not configured');
        return false;
      }

      const mailOptions = {
        from: `"4Sale Analytics Platform" <${process.env.GMAIL_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: process.env.GMAIL_USER,
        headers: {
          'X-Mailer': '4Sale Analytics Platform v2.0',
          'X-Priority': '3',
          'Importance': 'Normal',
          'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
          'X-Entity-ID': '4sale-analytics-platform',
          'X-Report-Abuse': `abuse@4sale.tech`,
          'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=Unsubscribe>, <https://4sale.tech/unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Return-Path': process.env.GMAIL_USER,
          'Message-ID': `<${Date.now()}-${Math.random().toString(36)}@4sale.tech>`,
          'MIME-Version': '1.0',
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Spam-Status': 'No',
          'X-Authenticated-Sender': process.env.GMAIL_USER
        },
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      console.log(`Sending email to: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
      
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Gmail SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('Gmail SMTP connection failed:', error);
      return false;
    }
  }

  async sendReportEmail(emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    html: string;
    attachments?: any[];
  }): Promise<boolean> {
    const attachments = emailData.attachments?.map(att => ({
      filename: att.filename || 'report.pdf',
      content: att.content || Buffer.from('Generated report content'),
      contentType: 'application/pdf'
    }));

    return await this.sendEmail({
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      subject: emailData.subject,
      html: emailData.html,
      attachments
    });
  }
}

export const emailService = new EmailService();
export default emailService;