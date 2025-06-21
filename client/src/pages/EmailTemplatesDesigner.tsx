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
  bodyHtml: string;
  availablePlaceholders: string[];
  isSystemTemplate?: boolean;
  templateType?: string;
  subject?: string;
}

export function EmailTemplatesDesigner() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [reportName, setReportName] = useState('Sample Analytics Report');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email templates from database
  const { data: templates = [], isLoading } = useQuery({
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
      setIsCreateDialogOpen(false);
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
    if (!selectedTemplate || !selectedTemplate.bodyHtml) return;
    
    let html = selectedTemplate.bodyHtml;
    
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
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTemplate({
      id: '',
      name: '',
      description: '',
      bodyHtml: getDefaultTemplateHtml(),
      availablePlaceholders: ['report_name', 'report_download_url'],
      templateType: 'report',
      subject: '{{report_name}} - Report Ready'
    });
    setIsCreateDialogOpen(true);
  };

  const getDefaultTemplateHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
    .content { padding: 40px 30px; }
    .download-btn { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{report_name}}</h1>
    </div>
    <div class="content">
      <p>Your report is ready for review.</p>
      <p>Click the button below to download your report:</p>
      <a href="{{report_download_url}}" class="download-btn">Download Report</a>
    </div>
    <div class="footer">
      <p>© 2025 4Sale Analytics Platform</p>
    </div>
  </div>
</body>
</html>`;
  };

  const handleCreateTemplate = () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.bodyHtml) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const templateData = {
      name: editingTemplate.name,
      description: editingTemplate.description,
      templateType: editingTemplate.templateType || 'report',
      subject: editingTemplate.subject || '{{report_name}} - Report Ready',
      bodyHtml: editingTemplate.bodyHtml,
      availablePlaceholders: editingTemplate.availablePlaceholders,
      isSystemTemplate: false,
      isActive: true
    };

    createTemplateMutation.mutate(templateData);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.bodyHtml) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const templateData = {
      name: editingTemplate.name,
      description: editingTemplate.description,
      templateType: editingTemplate.templateType || 'report',
      subject: editingTemplate.subject || '{{report_name}} - Report Ready',
      bodyHtml: editingTemplate.bodyHtml,
      availablePlaceholders: editingTemplate.availablePlaceholders
    };

    updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateData });
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    const templateData = {
      name: `${template.name} (Copy)`,
      description: template.description,
      templateType: template.templateType || 'report',
      subject: template.subject || '{{report_name}} - Report Ready',
      bodyHtml: template.bodyHtml,
      availablePlaceholders: template.availablePlaceholders,
      isSystemTemplate: false,
      isActive: true
    };
    
    createTemplateMutation.mutate(templateData);
  };

  const deleteTemplate = (templateId: string) => {
    deleteTemplateMutation.mutate(templateId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Templates Designer</h1>
          <p className="text-muted-foreground">Create and manage professional email templates</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No email templates found</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates</CardTitle>
                <CardDescription>Select a template to preview and edit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {templates.map((template: EmailTemplate) => (
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
                        {template.isSystemTemplate && (
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
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Editor and Preview Panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedTemplate ? selectedTemplate.name : 'Select a Template'}
                    </CardTitle>
                    <CardDescription>
                      {selectedTemplate ? selectedTemplate.description : 'Choose a template from the list to preview'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="report-name">Report Name:</Label>
                    <Input
                      id="report-name"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="editor">HTML Editor</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="mt-4">
                      {previewHtml ? (
                        <div className="border rounded-lg overflow-hidden">
                          <iframe
                            srcDoc={previewHtml}
                            className="w-full h-96 border-0"
                            title="Email Preview"
                          />
                        </div>
                      ) : (
                        <div className="h-96 border rounded-lg flex items-center justify-center text-muted-foreground">
                          Loading preview...
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="editor" className="mt-4">
                      <div className="grid grid-cols-2 gap-4 h-[500px]">
                        {/* HTML Code Editor */}
                        <div className="space-y-2">
                          <Label>HTML Code</Label>
                          <Textarea
                            value={selectedTemplate.bodyHtml}
                            onChange={(e) => {
                              const updatedTemplate = {
                                ...selectedTemplate,
                                bodyHtml: e.target.value
                              };
                              setSelectedTemplate(updatedTemplate);
                              // Update preview in real-time
                              let html = e.target.value;
                              const sampleData = {
                                report_name: reportName,
                                report_download_url: '#download-report'
                              };
                              Object.entries(sampleData).forEach(([key, value]) => {
                                const regex = new RegExp(`{{${key}}}`, 'g');
                                html = html.replace(regex, value);
                              });
                              setPreviewHtml(html);
                            }}
                            className="h-full font-mono text-sm resize-none"
                            placeholder="Enter HTML content"
                          />
                        </div>
                        
                        {/* Live Preview */}
                        <div className="space-y-2">
                          <Label>Live Preview</Label>
                          <div className="border rounded-lg overflow-hidden h-full">
                            <iframe
                              srcDoc={previewHtml}
                              className="w-full h-full border-0"
                              title="Live Email Preview"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => {
                            if (selectedTemplate) {
                              const templateData = {
                                name: selectedTemplate.name,
                                description: selectedTemplate.description,
                                templateType: selectedTemplate.templateType || 'report',
                                subject: selectedTemplate.subject || '{{report_name}} - Report Ready',
                                bodyHtml: selectedTemplate.bodyHtml,
                                availablePlaceholders: selectedTemplate.availablePlaceholders
                              };
                              updateTemplateMutation.mutate({ id: selectedTemplate.id, data: templateData });
                            }
                          }}
                          disabled={updateTemplateMutation.isPending}
                        >
                          {updateTemplateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                          Reset
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="h-96 border rounded-lg flex items-center justify-center text-muted-foreground">
                    Select a template to see the preview and editor
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Email Template</DialogTitle>
            <DialogDescription>
              Design a new email template with HTML content and variables
            </DialogDescription>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value
                    })}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value
                    })}
                    placeholder="Enter template description"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-html">HTML Content</Label>
                <Textarea
                  id="template-html"
                  value={editingTemplate.bodyHtml}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    bodyHtml: e.target.value
                  })}
                  className="h-64 font-mono text-sm"
                  placeholder="Enter HTML content"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              disabled={createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Modify the template content and settings
            </DialogDescription>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-template-name">Template Name</Label>
                  <Input
                    id="edit-template-name"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value
                    })}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-template-description">Description</Label>
                  <Input
                    id="edit-template-description"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value
                    })}
                    placeholder="Enter template description"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-template-html">HTML Content</Label>
                <Textarea
                  id="edit-template-html"
                  value={editingTemplate.bodyHtml}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    bodyHtml: e.target.value
                  })}
                  className="h-64 font-mono text-sm"
                  placeholder="Enter HTML content"
                />
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
            <Button 
              onClick={handleUpdateTemplate}
              disabled={updateTemplateMutation.isPending}
            >
              {updateTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}