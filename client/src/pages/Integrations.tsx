import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, Settings, CheckCircle, XCircle, AlertTriangle, Clock, 
  Info, Loader2, Database, BarChart3, MessageSquare, Mail, 
  Snowflake, Palette, Pause, Play, Trash2
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing' | 'paused';
  lastTested: string | null;
  credentials?: Record<string, any>;
  configuration?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  description?: string;
}

interface IntegrationTemplate {
  name: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  fields: IntegrationField[];
}

const integrationTemplates: Record<string, IntegrationTemplate> = {
  postgresql: {
    name: 'PostgreSQL Database',
    description: 'Connect to PostgreSQL database for data storage and queries',
    category: 'Database',
    icon: Database,
    color: 'blue',
    fields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { key: 'port', label: 'Port', type: 'text', placeholder: '5432', required: true },
      { key: 'database', label: 'Database Name', type: 'text', placeholder: 'mydatabase', required: true },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'postgres', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'ssl', label: 'SSL Mode', type: 'select', options: ['disable', 'require', 'prefer'], placeholder: 'require' }
    ]
  },
  redis: {
    name: 'Redis Cache',
    description: 'Connect to Redis for caching and session management',
    category: 'Cache',
    icon: Database,
    color: 'red',
    fields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { key: 'port', label: 'Port', type: 'text', placeholder: '6379', required: true },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'database', label: 'Database Index', type: 'text', placeholder: '0' }
    ]
  },
  snowflake: {
    name: 'Snowflake Data Warehouse',
    description: 'Connect to Snowflake for analytics and data warehousing',
    category: 'Analytics',
    icon: Snowflake,
    color: 'blue',
    fields: [
      { key: 'account', label: 'Account', type: 'text', placeholder: 'your-account', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'schema', label: 'Schema', type: 'text', placeholder: 'PUBLIC' },
      { key: 'warehouse', label: 'Warehouse', type: 'text', required: true }
    ]
  },
  amplitude: {
    name: 'Amplitude Analytics',
    description: 'Track user behavior and analytics with Amplitude',
    category: 'Analytics',
    icon: BarChart3,
    color: 'purple',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'serverZone', label: 'Server Zone', type: 'select', options: ['US', 'EU'], placeholder: 'US' }
    ]
  },
  braze: {
    name: 'Braze Marketing',
    description: 'Customer engagement platform for targeted campaigns',
    category: 'Marketing',
    icon: MessageSquare,
    color: 'pink',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'restEndpoint', label: 'REST Endpoint', type: 'url', placeholder: 'https://rest.iad-01.braze.com', required: true },
      { key: 'appId', label: 'App ID', type: 'text', required: true }
    ]
  },
  sendgrid: {
    name: 'SendGrid Email',
    description: 'Email delivery service for transactional emails',
    category: 'Communication',
    icon: Mail,
    color: 'blue',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'fromEmail', label: 'From Email', type: 'email', placeholder: 'noreply@yourapp.com', required: true },
      { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your App' }
    ]
  }
};

const IntegrationCard = ({ integration, onConfigure, onTest, onPause, onDelete, onPreview }: {
  integration: Integration;
  onConfigure: (integration: Integration) => void;
  onTest: (integration: Integration) => void;
  onPause: (integration: Integration) => void;
  onDelete: (integration: Integration) => void;
  onPreview: (integration: Integration) => void;
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const template = integrationTemplates[integration.type];
  const Icon = template?.icon || Database;

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await onTest(integration);
    setIsTestingConnection(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="status-connected px-3 py-1 text-xs font-medium"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge className="status-error px-3 py-1 text-xs font-medium"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'testing':
        return <Badge className="status-warning px-3 py-1 text-xs font-medium"><Clock className="h-3 w-3 mr-1" />Testing</Badge>;
      case 'paused':
        return <Badge className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1 text-xs font-medium"><Clock className="h-3 w-3 mr-1" />Paused</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 text-xs font-medium"><AlertTriangle className="h-3 w-3 mr-1" />Disconnected</Badge>;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${template?.color || 'gray'}-100`}>
              <Icon className={`h-5 w-5 text-${template?.color || 'gray'}-600`} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold truncate">{integration.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{integration.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPause(integration);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {integration.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(integration);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            {getStatusBadge(integration.status)}
          </div>

          {integration.lastTested && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Tested</span>
              <span className="text-sm text-gray-900">
                {new Date(integration.lastTested).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleTestConnection();
              }}
              disabled={isTestingConnection}
              className="flex-1 text-xs font-medium hover:bg-green-50 hover:border-green-300 hover:text-green-700"
            >
              {isTestingConnection ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3 mr-1" />
              )}
              {isTestingConnection ? 'Testing...' : 'Test'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onConfigure(integration);
              }}
              className="flex-1 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            >
              <Settings className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onPreview(integration)}
            className="w-full text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <Info className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewIntegration, setPreviewIntegration] = useState<Integration | null>(null);

  // Fetch integrations from database
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: () => apiRequest('/api/integrations') as Promise<Integration[]>,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/integrations', {
      method: 'POST',
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      setShowAddModal(false);
      setFormData({});
      setSelectedTemplate('');
      toast({
        title: "Integration created",
        description: "Your integration has been successfully configured."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create integration. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/integrations/${id}`, {
      method: 'PATCH',
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      setIsConfigModalOpen(false);
      setSelectedIntegration(null);
      toast({
        title: "Integration updated",
        description: "Your integration has been successfully updated."
      });
    }
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/integrations/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration deleted",
        description: "The integration has been removed."
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/integrations/${id}/test`, {
      method: 'POST'
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      if (result.success) {
        toast({
          title: "Connection successful",
          description: "Integration is working correctly."
        });
      } else {
        toast({
          title: "Connection failed",
          description: result.error || "Please check your credentials.",
          variant: "destructive"
        });
      }
    }
  });

  const handleConfigureIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setFormData(integration.credentials || {});
    setIsConfigModalOpen(true);
  };

  const handleAddIntegration = () => {
    setShowAddModal(true);
    setSelectedTemplate('');
    setFormData({});
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setFormData({});
  };

  const handleSaveIntegration = () => {
    if (selectedIntegration) {
      updateIntegrationMutation.mutate({
        id: selectedIntegration.id,
        data: {
          credentials: formData,
          status: 'disconnected'
        }
      });
    } else if (selectedTemplate) {
      const template = integrationTemplates[selectedTemplate];
      createIntegrationMutation.mutate({
        name: template.name,
        type: selectedTemplate,
        description: template.description,
        credentials: formData,
        status: 'disconnected'
      });
    }
  };

  const handleTestConnection = async (integration: Integration) => {
    setIsTestingConnection(true);
    
    if (selectedIntegration && Object.keys(formData).length > 0) {
      try {
        const response = await fetch(`/api/integrations/${integration.id}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials: formData })
        });
        
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Connection successful",
            description: "Integration is working correctly with current settings."
          });
        } else {
          toast({
            title: "Connection failed",
            description: result.error || "Please check your credentials.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Test failed",
          description: "Unable to test connection. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      testConnectionMutation.mutate(integration.id);
    }
    
    setIsTestingConnection(false);
  };

  const handlePauseToggle = (integration: Integration) => {
    const newStatus = integration.status === 'paused' ? 'connected' : 'paused';
    updateIntegrationMutation.mutate({
      id: integration.id,
      data: { status: newStatus }
    });
  };

  const renderField = (field: IntegrationField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
      default:
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 fade-in">
      <div className="page-header flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Integrations</h1>
          <p className="text-xl text-muted-foreground">Connect and manage your data sources and marketing platforms</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleAddIntegration} className="btn-primary px-6 py-3 text-sm font-medium">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration: Integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConfigure={handleConfigureIntegration}
            onTest={handleTestConnection}
            onPause={handlePauseToggle}
            onDelete={(int) => deleteIntegrationMutation.mutate(int.id)}
            onPreview={setPreviewIntegration}
          />
        ))}
      </div>

      {/* Configuration Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Integration</DialogTitle>
            <DialogDescription>
              Update your integration settings and credentials
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 gap-4">
                {integrationTemplates[selectedIntegration.type]?.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderField(field, formData[field.key], (value) => 
                      setFormData(prev => ({ ...prev, [field.key]: value }))
                    )}
                    {field.description && (
                      <p className="text-xs text-gray-500">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleTestConnection(selectedIntegration)}
                  disabled={isTestingConnection}
                  variant="outline"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button onClick={handleSaveIntegration}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Integration Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Integration</DialogTitle>
            <DialogDescription>
              Choose an integration type and configure your connection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {!selectedTemplate ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(integrationTemplates).map(([key, template]) => {
                  const Icon = template.icon;
                  return (
                    <Card 
                      key={key} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                      onClick={() => handleTemplateSelect(key)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg bg-${template.color}-100`}>
                            <Icon className={`h-6 w-6 text-${template.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            <Badge variant="secondary" className="mt-2">{template.category}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <Button variant="outline" size="sm" onClick={() => setSelectedTemplate('')}>
                    ← Back
                  </Button>
                  <h3 className="text-lg font-semibold">{integrationTemplates[selectedTemplate].name}</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {integrationTemplates[selectedTemplate].fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key} className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field, formData[field.key], (value) => 
                        setFormData(prev => ({ ...prev, [field.key]: value }))
                      )}
                      {field.description && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveIntegration}>
                    Create Integration
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewIntegration} onOpenChange={() => setPreviewIntegration(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Integration Details</DialogTitle>
            <DialogDescription>
              View integration information and configuration
            </DialogDescription>
          </DialogHeader>

          {previewIntegration && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{previewIntegration.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <p className="text-sm text-gray-900 mt-1">{integrationTemplates[previewIntegration.type]?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {/* Badge component for status */}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(previewIntegration.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm text-gray-900 mt-1">{previewIntegration.description}</p>
              </div>

              {previewIntegration.lastTested && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Tested</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(previewIntegration.lastTested).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}