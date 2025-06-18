import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code, Palette, Type, Mail } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  html: string;
  variables: string[];
}

interface EmailTemplateBuilderProps {
  value?: {
    templateId?: string;
    subject?: string;
    customContent?: string;
    templateVariables?: Record<string, string>;
  };
  onChange: (value: {
    templateId: string;
    subject: string;
    customContent: string;
    templateVariables: Record<string, string>;
  }) => void;
  presentations?: Array<{ id: string; title: string }>;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'professional',
    name: 'Professional Report',
    description: 'Clean, corporate design suitable for business reports',
    preview: '',
    html: '',
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url']
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple, minimalist design focused on content',
    preview: '',
    html: '',
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution']
  },
  {
    id: 'dashboard',
    name: 'Dashboard Style',
    description: 'Modern dashboard-inspired design with metrics highlights',
    preview: '',
    html: '',
    variables: ['report_title', 'recipient_name', 'email_content', 'report_name', 'report_period', 'generation_date', 'generation_time', 'next_execution', 'dashboard_url', 'metric_1_value', 'metric_1_label', 'metric_2_value', 'metric_2_label', 'metric_3_value', 'metric_3_label']
  }
];

export function EmailTemplateBuilder({ value, onChange, presentations = [] }: EmailTemplateBuilderProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(value?.templateId || 'professional');
  const [subject, setSubject] = useState(value?.subject || '');
  const [customContent, setCustomContent] = useState(value?.customContent || '');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>(
    value?.templateVariables || {}
  );

  const selectedTemplate = emailTemplates.find(t => t.id === selectedTemplateId) || emailTemplates[0];

  useEffect(() => {
    if (onChange) {
      onChange({
        templateId: selectedTemplateId,
        subject,
        customContent,
        templateVariables
      });
    }
  }, [selectedTemplateId, subject, customContent, templateVariables, onChange]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    // Initialize template variables with defaults
    const defaultVariables: Record<string, string> = {
      report_title: subject || 'Weekly Analytics Report',
      recipient_name: 'Valued Customer',
      report_name: 'Analytics Dashboard Report',
      report_period: 'Last 7 days',
      metric_1_value: '12.5K',
      metric_1_label: 'Total Users',
      metric_2_value: '85%',
      metric_2_label: 'Engagement',
      metric_3_value: '$45.2K',
      metric_3_label: 'Revenue'
    };
    
    setTemplateVariables(defaultVariables);
  };

  const updateVariable = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };



  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="template-select">Email Template</Label>
        <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an email template" />
          </SelectTrigger>
          <SelectContent>
            {emailTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs text-muted-foreground">{template.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Email Configuration */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
          />
        </div>
        
        <div>
          <Label htmlFor="content">Email Content</Label>
          <Textarea
            id="content"
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder="Enter your custom email message..."
            rows={4}
          />
        </div>
      </div>

      {/* Key Template Variables */}
      <div className="space-y-2">
        <Label>Template Variables</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['report_title', 'recipient_name', 'report_period'].map((variable) => (
            <div key={variable}>
              <Label htmlFor={variable} className="text-sm">
                {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
              <Input
                id={variable}
                value={templateVariables[variable] || ''}
                onChange={(e) => updateVariable(variable, e.target.value)}
                placeholder={`Enter ${variable.replace(/_/g, ' ')}...`}
                className="text-sm"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Additional variables will be populated automatically from report data.{' '}
          <span className="underline cursor-pointer">View all templates</span> for advanced customization.
        </p>
      </div>
    </div>
  );
}