import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code, Plus, Edit, Trash2, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  html: string;
  variables: string[];
  isSystem?: boolean;
}

// All templates now come from database - no hardcoded templates

export function EmailTemplatesDesigner() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editPreviewHtml, setEditPreviewHtml] = useState('');
  const [reportName, setReportName] = useState('Sample Analytics Report');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email templates from database
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: () => apiRequest('/api/email-templates')
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: any) => apiRequest('/api/email-templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/email-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({ title: "Template updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/email-templates/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({ title: "Template deleted successfully" });
      setSelectedTemplate(null);
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  });

  // Initialize selected template
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates, selectedTemplate]);

  // Generate preview when template or report name changes
  useEffect(() => {
    if (selectedTemplate) {
      generatePreview();
    }
  }, [selectedTemplate, reportName]);

  const generatePreview = () => {
    if (!selectedTemplate || !selectedTemplate.html) return;
    
    let html = selectedTemplate.html;
    
    // Replace variables with sample data
    const sampleData = {
      report_name: reportName,
      report_download_url: '#download-report'
    };
    
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });
    
    setPreviewHtml(html);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsEditDialogOpen(true);
    
    // Initialize edit preview
    generateEditPreview(template.html || '');
  };

  const generateEditPreview = (htmlContent: string) => {
    let html = htmlContent;
    
    const sampleData = {
      report_name: reportName,
      report_download_url: '#download-report'
    };
    
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });
    
    setEditPreviewHtml(html);
  };

  const closeEditDialog = () => {
    setEditingTemplate(null);
    setIsEditDialogOpen(false);
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;
    
    // Update the templates array with the edited template
    setTemplates(prev => 
      prev.map(t => t.id === editingTemplate.id ? editingTemplate : t)
    );
    
    // Update the selected template if it's the one being edited
    if (selectedTemplate?.id === editingTemplate.id) {
      setSelectedTemplate(editingTemplate);
      // Regenerate the main preview with updated template
      generatePreview();
    }
    
    closeEditDialog();
    toast({ 
      title: "Template saved successfully",
      description: `${editingTemplate.name} has been updated`
    });
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (Copy)`,
      isSystem: false
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    toast({ title: "Template duplicated successfully" });
  };

  const deleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isSystem) {
      toast({ title: "Cannot delete system templates", variant: "destructive" });
      return;
    }
    
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    
    if (selectedTemplate?.id === templateId) {
      const remainingTemplates = templates.filter(t => t.id !== templateId);
      setSelectedTemplate(remainingTemplates.length > 0 ? remainingTemplates[0] : null);
    }
    
    toast({ title: "Template deleted successfully" });
  };

  return (
    <div className="w-full max-w-none p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates Designer</h1>
          <p className="text-muted-foreground">
            Create and customize professional email templates for your scheduled reports
          </p>
        </div>
        <Button onClick={() => {
          const newTemplate: EmailTemplate = {
            id: `template_${Date.now()}`,
            name: 'New Template',
            description: 'Custom email template',
            html: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>{{report_name}}</title></head><body><h1>{{report_name}}</h1><p>Your report content here.</p><a href="{{report_download_url}}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Report</a></body></html>',
            variables: ['report_name', 'report_download_url'],
            isSystem: false
          };
          setTemplates(prev => [...prev, newTemplate]);
          setSelectedTemplate(newTemplate);
          toast({ title: "New template created" });
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Templates</CardTitle>
              <CardDescription>Select a template to preview and edit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-transparent bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      {template.isSystem && (
                        <Badge variant="secondary" className="mt-1">
                          System
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(template);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTemplate(template);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {!template.isSystem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-3">
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Report Name Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>Configure the preview settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="report-name">Report Name</Label>
                      <Input
                        id="report-name"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        placeholder="Enter report name..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Template Preview - {selectedTemplate.name}
                  </CardTitle>
                  <CardDescription>
                    Preview how your email template will appear
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Visual Preview</TabsTrigger>
                      <TabsTrigger value="html">HTML Code</TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview" className="mt-4">
                      <div className="border rounded-lg overflow-hidden">
                        <iframe
                          srcDoc={previewHtml}
                          className="w-full h-96 border-0"
                          title="Email Template Preview"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="html" className="mt-4">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                          <code>{previewHtml}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Template - {editingTemplate?.name}</DialogTitle>
            <DialogDescription>
              Modify the template name, description, and HTML content with live preview
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="grid grid-cols-2 gap-6 h-[70vh]">
              {/* Left Panel - HTML Editor */}
              <div className="space-y-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Template Name</Label>
                    <Input
                      id="edit-name"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={editingTemplate.description || ''}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        description: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="edit-html">HTML Content</Label>
                    <Textarea
                      id="edit-html"
                      value={editingTemplate.html || ''}
                      onChange={(e) => {
                        const updatedTemplate = {
                          ...editingTemplate,
                          html: e.target.value
                        };
                        setEditingTemplate(updatedTemplate);
                        
                        // Update preview in real-time
                        generateEditPreview(e.target.value);
                      }}
                      className="mt-1 h-80 font-mono text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter your HTML template content here..."
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>

              {/* Right Panel - Live Preview */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <h3 className="font-medium text-gray-700">{reportName}</h3>
                </div>
                <div className="h-full overflow-auto">
                  <iframe
                    srcDoc={editPreviewHtml}
                    className="w-full h-full border-0"
                    title="Template Edit Preview"
                    style={{ minHeight: '400px' }}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}