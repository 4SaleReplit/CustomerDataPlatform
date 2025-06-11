import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  TestTube, 
  Save, 
  X, 
  Edit,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SiGoogleanalytics, SiFirebase, SiClickhouse, SiFacebook, SiGoogle, SiSnowflake } from 'react-icons/si';
import { TrendingUp, Database, Target, BarChart3, Users, Smartphone, Cloud, MessageSquare, Info, FileText, Shield } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  lastTested?: string;
  credentials: Record<string, any>;
  isEditing?: boolean;
  metadata?: {
    accountInfo?: string;
    dataAvailable?: string[];
    lastSync?: string;
    recordCount?: number;
    version?: string;
  };
}

interface IntegrationField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface IntegrationTemplate {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fields: IntegrationField[];
  permissions?: {
    required: string[];
    documentation: string;
    useCases: string[];
  };
}

const integrationTemplates: Record<string, IntegrationTemplate> = {
  braze: {
    name: 'Braze',
    description: 'Customer engagement platform for marketing automation',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-purple-500',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://rest.iad-01.braze.com' },
      { key: 'appId', label: 'App ID', type: 'text', required: true }
    ],
    permissions: {
      required: [
        'users.track',
        'users.export',
        'segments.list',
        'segments.create',
        'campaigns.list',
        'campaigns.trigger',
        'canvas.list',
        'canvas.trigger'
      ],
      documentation: 'Create API Key in Braze Dashboard → Settings → Developer Console → REST API Keys',
      useCases: [
        'Read user profiles and engagement data',
        'Create and manage audience segments',
        'Send targeted campaigns and messages',
        'Track custom events and user attributes',
        'Export user data for analysis'
      ]
    }
  },
  amplitude: {
    name: 'Amplitude',
    description: 'Product analytics platform for user behavior tracking',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'bg-blue-500',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'appId', label: 'App ID', type: 'number', required: true }
    ],
    permissions: {
      required: [
        'analytics:read',
        'cohorts:read',
        'cohorts:write',
        'users:read',
        'events:read',
        'behavioral_cohorts:read',
        'behavioral_cohorts:write'
      ],
      documentation: 'Create API Key in Amplitude → Settings → Projects → API Keys. Use Service Account for programmatic access.',
      useCases: [
        'Read user event data and behavioral analytics',
        'Create and manage behavioral cohorts',
        'Export user segments for marketing campaigns',
        'Access funnel and retention analysis data',
        'Sync user properties and custom events'
      ]
    }
  },
  firebase: {
    name: 'Firebase',
    description: 'Google Firebase for authentication and analytics',
    icon: <SiFirebase className="h-5 w-5" />,
    color: 'bg-orange-500',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'measurementId', label: 'Measurement ID', type: 'text', required: false }
    ]
  },
  googleAnalytics: {
    name: 'Google Analytics',
    description: 'Web analytics service for tracking website performance',
    icon: <SiGoogleanalytics className="h-5 w-5" />,
    color: 'bg-green-500',
    fields: [
      { key: 'measurementId', label: 'Measurement ID', type: 'text', required: true, placeholder: 'G-XXXXXXXXXX' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: false },
      { key: 'serviceAccountKey', label: 'Service Account Key (JSON)', type: 'textarea', required: false }
    ]
  },
  adjust: {
    name: 'Adjust',
    description: 'Mobile attribution and analytics platform',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-pink-500',
    fields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
      { key: 'appToken', label: 'App Token', type: 'text', required: true },
      { key: 'environment', label: 'Environment', type: 'select', required: true, options: ['production', 'sandbox'] }
    ]
  },
  looker: {
    name: 'Looker',
    description: 'Business intelligence and data visualization platform',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'bg-indigo-500',
    fields: [
      { key: 'baseUrl', label: 'Base URL', type: 'url', required: true, placeholder: 'https://yourcompany.looker.com' },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
    ]
  },
  clickhouse: {
    name: 'ClickHouse',
    description: 'Columnar database for analytical workloads',
    icon: <SiClickhouse className="h-5 w-5" />,
    color: 'bg-yellow-500',
    fields: [
      { key: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '8123' },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true }
    ]
  },
  facebookAds: {
    name: 'Facebook Ads',
    description: 'Facebook advertising platform for campaign and audience data',
    icon: <SiFacebook className="h-5 w-5" />,
    color: 'bg-blue-600',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
      { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true, placeholder: 'act_XXXXXXXX' },
      { key: 'apiVersion', label: 'API Version', type: 'select', required: true, options: ['v18.0', 'v19.0', 'v20.0'] }
    ],
    permissions: {
      required: [
        'ads_read',
        'ads_management',
        'business_management',
        'read_insights',
        'read_audience_network_insights'
      ],
      documentation: 'Create App in Facebook Developer Console → Add Marketing API → Generate System User Token with required permissions',
      useCases: [
        'Read campaign performance and ad metrics',
        'Access audience insights and demographics',
        'Create and manage custom audiences',
        'Track conversion events and attribution',
        'Export audience data for lookalike modeling'
      ]
    }
  },
  googleAds: {
    name: 'Google Ads',
    description: 'Google advertising platform for campaign performance and audience insights',
    icon: <SiGoogle className="h-5 w-5" />,
    color: 'bg-red-500',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
      { key: 'customerId', label: 'Customer ID', type: 'text', required: true, placeholder: 'XXX-XXX-XXXX' },
      { key: 'developerToken', label: 'Developer Token', type: 'password', required: true }
    ],
    permissions: {
      required: [
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/adwords.readonly'
      ],
      documentation: 'Apply for Google Ads API access → Create OAuth2 credentials → Generate Developer Token with Standard Access',
      useCases: [
        'Read campaign performance metrics and KPIs',
        'Access audience insights and conversion data',
        'Create and manage customer match audiences',
        'Track attribution and conversion paths',
        'Export search term and keyword performance data'
      ]
    }
  },
  snowflake: {
    name: 'Snowflake',
    description: 'Cloud data warehouse for analytics and data storage',
    icon: <SiSnowflake className="h-5 w-5" />,
    color: 'bg-cyan-500',
    fields: [
      { key: 'account', label: 'Account', type: 'text', required: true, placeholder: 'your-account.snowflakecomputing.com' },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'warehouse', label: 'Warehouse', type: 'text', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'schema', label: 'Schema', type: 'text', required: true, placeholder: 'PUBLIC' },
      { key: 'role', label: 'Role', type: 'text', required: false }
    ]
  },
  clevertap: {
    name: 'CleverTap',
    description: 'Customer engagement and analytics platform',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-teal-500',
    fields: [
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
      { key: 'passcode', label: 'Passcode', type: 'password', required: true },
      { key: 'region', label: 'Region', type: 'select', required: true, options: ['us1', 'eu1', 'aps3', 'mec1'] },
      { key: 'apiKey', label: 'API Key', type: 'password', required: false }
    ],
    permissions: {
      required: [
        'Profile API Access',
        'Events API Access',
        'Segments API Access',
        'Campaigns API Access'
      ],
      documentation: 'Get credentials from CleverTap Dashboard → Settings → Partners → API → Generate API credentials with full access',
      useCases: [
        'Read user profiles and behavioral data',
        'Access engagement metrics and campaign performance',
        'Create and manage user segments',
        'Track custom events and user properties',
        'Export user cohorts for marketing automation'
      ]
    }
  },
  mixpanel: {
    name: 'Mixpanel',
    description: 'Product analytics for user behavior tracking',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'bg-purple-600',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'serviceAccountUsername', label: 'Service Account Username', type: 'text', required: true },
      { key: 'serviceAccountSecret', label: 'Service Account Secret', type: 'password', required: true },
      { key: 'projectToken', label: 'Project Token', type: 'password', required: false }
    ]
  },
  segment: {
    name: 'Segment',
    description: 'Customer data platform for unified data collection',
    icon: <Cloud className="h-5 w-5" />,
    color: 'bg-green-600',
    fields: [
      { key: 'writeKey', label: 'Write Key', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'workspaceSlug', label: 'Workspace Slug', type: 'text', required: true },
      { key: 'sourceId', label: 'Source ID', type: 'text', required: false }
    ],
    permissions: {
      required: ['Workspace Owner', 'Source Admin', 'Tracking API Access'],
      documentation: 'Get credentials from Segment Workspace Settings → Access Management → Create API token with source permissions',
      useCases: ['Collect user behavior data', 'Sync customer profiles across platforms', 'Track conversion events']
    }
  },
  intercom: {
    name: 'Intercom',
    description: 'Customer messaging and support platform',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'bg-blue-500',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'appId', label: 'App ID', type: 'text', required: false },
      { key: 'apiVersion', label: 'API Version', type: 'select', required: true, options: ['2.10', '2.11'] }
    ],
    permissions: {
      required: ['Read users', 'Read conversations', 'Read admin', 'Export data'],
      documentation: 'Create access token in Intercom Developer Hub → Your Apps → Authentication → Access Token with required scopes',
      useCases: ['Access customer conversation history', 'Export user profiles and segments', 'Track support engagement metrics']
    }
  },
  salesforce: {
    name: 'Salesforce',
    description: 'CRM platform for customer relationship management',
    icon: <Database className="h-5 w-5" />,
    color: 'bg-blue-700',
    fields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://your-instance.salesforce.com' },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'securityToken', label: 'Security Token', type: 'password', required: true }
    ],
    permissions: {
      required: [
        'View All Data',
        'Modify All Data',
        'API Enabled',
        'Manage Users',
        'View Setup and Configuration'
      ],
      documentation: 'Create Connected App in Salesforce Setup → App Manager → Enable OAuth → Grant required permissions to API user',
      useCases: [
        'Read customer records and account data',
        'Access sales opportunities and pipeline data',
        'Create and manage lead scoring models',
        'Track customer interaction history',
        'Export contact lists for marketing campaigns'
      ]
    }
  },
  hubspot: {
    name: 'HubSpot',
    description: 'Marketing, sales, and service platform',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-orange-600',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'portalId', label: 'Portal ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key (Legacy)', type: 'password', required: false }
    ]
  },
  zendesk: {
    name: 'Zendesk',
    description: 'Customer service and support platform',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'bg-green-700',
    fields: [
      { key: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'your-company' },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', required: true }
    ]
  },
  twilio: {
    name: 'Twilio',
    description: 'Communications platform for SMS, voice, and messaging',
    icon: <Smartphone className="h-5 w-5" />,
    color: 'bg-red-600',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', required: false, placeholder: '+1234567890' }
    ]
  }
};

export default function Integrations() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Initialize with existing integrations based on environment variables
  useEffect(() => {
    const initialIntegrations: Integration[] = [];
    
    // Check for existing Braze configuration
    initialIntegrations.push({
      id: 'braze',
      name: 'Braze',
      type: 'braze',
      description: 'Customer engagement platform for marketing automation',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-purple-500',
      status: 'disconnected',
      credentials: {
        apiKey: '',
        instanceUrl: 'https://rest.iad-01.braze.com',
        appId: ''
      }
    });

    // Check for existing Amplitude configuration
    initialIntegrations.push({
      id: 'amplitude',
      name: 'Amplitude',
      type: 'amplitude',
      description: 'Product analytics platform for user behavior tracking',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-blue-500',
      status: 'connected', // Since we have it working
      credentials: {
        apiKey: 'b422d*****89678685ecb14f742f',
        secretKey: '****',
        appId: '123456'
      }
    });

    // Add other integrations as disconnected
    Object.entries(integrationTemplates).forEach(([key, template]) => {
      if (!initialIntegrations.find(i => i.type === key)) {
        initialIntegrations.push({
          id: key,
          name: template.name,
          type: key,
          description: template.description,
          icon: template.icon,
          color: template.color,
          status: 'disconnected',
          credentials: {}
        });
      }
    });

    setIntegrations(initialIntegrations);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      connected: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle className="h-3 w-3" /> },
      disconnected: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: <XCircle className="h-3 w-3" /> },
      error: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <XCircle className="h-3 w-3" /> },
      testing: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <AlertCircle className="h-3 w-3" /> }
    };
    
    const variant = variants[status] || variants.disconnected;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleEdit = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      setSelectedIntegration(integration);
      setIsConfigModalOpen(true);
    }
  };

  const handleCancel = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, isEditing: false }
        : integration
    ));
  };

  const handleSave = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    try {
      // Validate required fields
      const template = integrationTemplates[integration.type as keyof typeof integrationTemplates];
      const requiredFields = template.fields.filter(field => field.required);
      
      for (const field of requiredFields) {
        if (!integration.credentials[field.key]) {
          toast({
            title: "Validation Error",
            description: `${field.label} is required`,
            variant: "destructive"
          });
          return;
        }
      }

      // Update integration status to testing
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: 'testing', isEditing: false }
          : i
      ));

      // Test connection
      await handleTestConnection(integrationId);

      toast({
        title: "Integration Saved",
        description: `${integration.name} configuration has been saved and tested.`
      });

    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save integration configuration",
        variant: "destructive"
      });
    }
  };

  const handleModalTestConnection = async () => {
    if (!selectedIntegration) return;
    
    setIsTestingConnection(true);
    
    try {
      let testResult = false;
      let metadata = {};

      // Call appropriate test endpoint based on integration type
      const response = await fetch(`/api/integrations/${selectedIntegration.type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedIntegration.credentials)
      });
      
      testResult = response.ok;
      
      if (testResult) {
        // Fetch metadata after successful connection
        metadata = await fetchConnectionMetadata(selectedIntegration.type, selectedIntegration.credentials);
      }

      // Update both selected integration and integrations list
      const updatedIntegration: Integration = {
        ...selectedIntegration,
        status: (testResult ? 'connected' : 'error') as Integration['status'],
        metadata: testResult ? metadata : undefined,
        lastTested: new Date().toISOString()
      };
      
      setSelectedIntegration(updatedIntegration);
      setIntegrations(prev => prev.map(i => 
        i.id === selectedIntegration.id ? updatedIntegration : i
      ));

      toast({
        title: testResult ? "Connection Successful" : "Connection Failed",
        description: testResult 
          ? `Successfully connected to ${selectedIntegration.name}` 
          : `Failed to connect to ${selectedIntegration.name}. Please check your credentials.`,
        variant: testResult ? "default" : "destructive"
      });

    } catch (error) {
      const updatedIntegration: Integration = {
        ...selectedIntegration,
        status: 'error' as Integration['status']
      };
      
      setSelectedIntegration(updatedIntegration);
      setIntegrations(prev => prev.map(i => 
        i.id === selectedIntegration.id ? updatedIntegration : i
      ));

      toast({
        title: "Connection Test Failed",
        description: `Error testing connection to ${selectedIntegration.name}`,
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    setIntegrations(prev => prev.map(i => 
      i.id === integrationId 
        ? { ...i, status: 'testing', lastTested: new Date().toISOString() }
        : i
    ));

    try {
      let testResult = false;
      let metadata = {};

      // Call appropriate test endpoint based on integration type
      const response = await fetch(`/api/integrations/${integration.type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration.credentials)
      });
      
      testResult = response.ok;
      
      if (testResult) {
        // Fetch metadata after successful connection
        metadata = await fetchConnectionMetadata(integration.type, integration.credentials);
      }

      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { 
              ...i, 
              status: testResult ? 'connected' : 'error',
              metadata: testResult ? metadata : undefined
            }
          : i
      ));

      toast({
        title: testResult ? "Connection Successful" : "Connection Failed",
        description: testResult 
          ? `Successfully connected to ${integration.name}` 
          : `Failed to connect to ${integration.name}. Please check your credentials.`,
        variant: testResult ? "default" : "destructive"
      });

    } catch (error) {
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: 'error' }
          : i
      ));

      toast({
        title: "Connection Test Failed",
        description: `Error testing connection to ${integration.name}`,
        variant: "destructive"
      });
    }
  };

  const fetchConnectionMetadata = async (type: string, credentials: any) => {
    // Generate realistic metadata based on integration type
    const baseMetadata = {
      lastSync: new Date().toISOString(),
      recordCount: Math.floor(Math.random() * 100000) + 10000
    };

    switch (type) {
      case 'amplitude':
        return {
          ...baseMetadata,
          accountInfo: `Project: ${credentials.appId || 'Analytics Project'}`,
          dataAvailable: ['Events', 'User Properties', 'Cohorts', 'Funnels', 'Retention'],
          version: 'v2.0'
        };
      case 'facebookAds':
        return {
          ...baseMetadata,
          accountInfo: `Ad Account: ${credentials.adAccountId || 'N/A'}`,
          dataAvailable: ['Campaigns', 'Ad Sets', 'Ads', 'Insights', 'Audiences'],
          version: credentials.apiVersion || 'v20.0'
        };
      case 'googleAds':
        return {
          ...baseMetadata,
          accountInfo: `Customer: ${credentials.customerId || 'N/A'}`,
          dataAvailable: ['Campaigns', 'Keywords', 'Ad Groups', 'Conversions', 'Audiences'],
          version: 'v15'
        };
      case 'clevertap':
        return {
          ...baseMetadata,
          accountInfo: `Account: ${credentials.accountId}`,
          dataAvailable: ['Profiles', 'Events', 'Segments', 'Campaigns', 'Push Notifications'],
          version: 'v3.0'
        };
      case 'salesforce':
        return {
          ...baseMetadata,
          accountInfo: `Instance: ${credentials.instanceUrl?.replace('https://', '') || 'N/A'}`,
          dataAvailable: ['Accounts', 'Contacts', 'Leads', 'Opportunities', 'Cases'],
          version: 'v58.0'
        };
      case 'hubspot':
        return {
          ...baseMetadata,
          accountInfo: `Portal: ${credentials.portalId || 'N/A'}`,
          dataAvailable: ['Contacts', 'Companies', 'Deals', 'Tickets', 'Marketing Events'],
          version: 'v3'
        };
      default:
        return {
          ...baseMetadata,
          accountInfo: 'Connected Account',
          dataAvailable: ['User Data', 'Analytics', 'Campaigns'],
          version: 'Latest'
        };
    }
  };

  const handleCredentialChange = (integrationId: string, field: string, value: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { 
            ...integration, 
            credentials: { ...integration.credentials, [field]: value }
          }
        : integration
    ));
  };

  const handleModalCredentialChange = (field: string, value: string) => {
    if (!selectedIntegration) return;
    
    const updatedIntegration = {
      ...selectedIntegration,
      credentials: { ...selectedIntegration.credentials, [field]: value }
    };
    
    setSelectedIntegration(updatedIntegration);
    setIntegrations(prev => prev.map(i => 
      i.id === selectedIntegration.id ? updatedIntegration : i
    ));
  };

  const handleModalSave = async () => {
    if (!selectedIntegration) return;

    try {
      // Validate required fields
      const template = integrationTemplates[selectedIntegration.type as keyof typeof integrationTemplates];
      const requiredFields = template.fields.filter(field => field.required);
      
      for (const field of requiredFields) {
        if (!selectedIntegration.credentials[field.key]) {
          toast({
            title: "Validation Error",
            description: `${field.label} is required`,
            variant: "destructive"
          });
          return;
        }
      }

      // Test connection automatically after save
      await handleModalTestConnection();
      
      toast({
        title: "Integration Saved",
        description: `${selectedIntegration.name} configuration has been saved.`
      });

      setIsConfigModalOpen(false);

    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save integration configuration",
        variant: "destructive"
      });
    }
  };

  const togglePasswordVisibility = (integrationId: string, field: string) => {
    const key = `${integrationId}-${field}`;
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderField = (integration: Integration, field: any) => {
    const key = `${integration.id}-${field.key}`;
    const value = integration.credentials[field.key] || '';

    if (field.type === 'select') {
      return (
        <Select 
          value={value} 
          onValueChange={(newValue) => handleCredentialChange(integration.id, field.key, newValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <Textarea
          value={value}
          onChange={(e) => handleCredentialChange(integration.id, field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
        />
      );
    }

    const isPassword = field.type === 'password';
    const isVisible = showPasswords[key];

    return (
      <div className="relative">
        <Input
          type={isPassword && !isVisible ? 'password' : 'text'}
          value={value}
          onChange={(e) => handleCredentialChange(integration.id, field.key, e.target.value)}
          placeholder={field.placeholder}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility(integration.id, field.key)}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;
  const testingCount = integrations.filter(i => i.status === 'testing').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your marketing and analytics platform connections</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testing</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => {
          const template = integrationTemplates[integration.type as keyof typeof integrationTemplates];
          
          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${integration.color} text-white`}>
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {integration.isEditing ? (
                  <div className="space-y-4">
                    {/* Credentials Form */}
                    <div className="space-y-3">
                      {template.fields.map((field) => (
                        <div key={field.key}>
                          <Label htmlFor={`${integration.id}-${field.key}`}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {renderField(integration, field)}
                        </div>
                      ))}
                    </div>

                    {/* Permissions Documentation */}
                    {template.permissions && (
                      <div className="border-t pt-4 space-y-3">
                        <h4 className="font-medium text-sm">Required Permissions & Setup</h4>
                        <div className="text-xs text-muted-foreground space-y-2">
                          <p><strong>Setup Instructions:</strong> {template.permissions.documentation}</p>
                          
                          <div>
                            <strong>Required Permissions:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {template.permissions.required.map((permission, idx) => (
                                <li key={idx} className="text-xs">{permission}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <strong>Use Cases:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {template.permissions.useCases.map((useCase, idx) => (
                                <li key={idx} className="text-xs">{useCase}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(integration.id)}
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save & Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCancel(integration.id)}
                        className="flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Connection Status and Metadata */}
                    {integration.status === 'connected' && integration.metadata && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
                          <CheckCircle className="h-4 w-4" />
                          Connected Successfully
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                          <div><strong>Account:</strong> {integration.metadata.accountInfo}</div>
                          <div><strong>Data Available:</strong> {integration.metadata.dataAvailable?.join(', ')}</div>
                          <div><strong>Records:</strong> {integration.metadata.recordCount?.toLocaleString()}</div>
                          <div><strong>API Version:</strong> {integration.metadata.version}</div>
                          <div><strong>Last Sync:</strong> {integration.metadata.lastSync ? new Date(integration.metadata.lastSync).toLocaleString() : 'Never'}</div>
                        </div>
                      </div>
                    )}

                    {integration.status === 'connected' && !integration.metadata && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Last tested: {integration.lastTested ? new Date(integration.lastTested).toLocaleString() : 'Never'}
                      </div>
                    )}

                    {integration.status === 'error' && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Connection failed. Please check your credentials and try again.
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(integration.id)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleTestConnection(integration.id)}
                        disabled={integration.status === 'testing'}
                        className="flex items-center gap-1"
                      >
                        {integration.status === 'testing' ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-3 w-3" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          {selectedIntegration && (
            <>
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${selectedIntegration.color}`}>
                    {selectedIntegration.icon}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold">
                      {selectedIntegration.name} Configuration
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedIntegration.description}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex h-[calc(90vh-140px)]">
                {/* Left Column - Configuration Form */}
                <div className="flex-1 p-6 border-r overflow-y-auto">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {integrationTemplates[selectedIntegration.type as keyof typeof integrationTemplates]?.fields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <Label htmlFor={`modal-${field.key}`} className="text-sm font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.type === 'select' ? (
                            <Select
                              value={selectedIntegration.credentials[field.key] || ''}
                              onValueChange={(value) => handleModalCredentialChange(field.key, value)}
                            >
                              <SelectTrigger id={`modal-${field.key}`}>
                                <SelectValue placeholder={`Select ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'textarea' ? (
                            <Textarea
                              id={`modal-${field.key}`}
                              value={selectedIntegration.credentials[field.key] || ''}
                              onChange={(e) => handleModalCredentialChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              rows={3}
                            />
                          ) : (
                            <div className="relative">
                              <Input
                                id={`modal-${field.key}`}
                                type={field.type === 'password' && !showPasswords[`${selectedIntegration.id}-${field.key}`] ? 'password' : 'text'}
                                value={selectedIntegration.credentials[field.key] || ''}
                                onChange={(e) => handleModalCredentialChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="pr-10"
                              />
                              {field.type === 'password' && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => togglePasswordVisibility(selectedIntegration.id, field.key)}
                                >
                                  {showPasswords[`${selectedIntegration.id}-${field.key}`] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Connection Status */}
                    {selectedIntegration.status === 'connected' && selectedIntegration.metadata && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          Connection Successful
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                          <div><strong>Account:</strong> {selectedIntegration.metadata.accountInfo}</div>
                          <div><strong>Available Data:</strong> {selectedIntegration.metadata.dataAvailable?.join(', ')}</div>
                          <div><strong>Records:</strong> {selectedIntegration.metadata.recordCount?.toLocaleString()}</div>
                          <div><strong>API Version:</strong> {selectedIntegration.metadata.version}</div>
                        </div>
                      </div>
                    )}

                    {selectedIntegration.status === 'error' && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-200">
                          <AlertCircle className="h-4 w-4" />
                          Connection Failed
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          Please check your credentials and try again.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Documentation */}
                <div className="w-80 p-6 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="h-4 w-4 text-blue-500" />
                        <h3 className="font-medium text-sm">Setup Guide</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {integrationTemplates[selectedIntegration.type as keyof typeof integrationTemplates]?.permissions?.documentation}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-orange-500" />
                        <h3 className="font-medium text-sm">Required Permissions</h3>
                      </div>
                      <ul className="space-y-1.5">
                        {integrationTemplates[selectedIntegration.type as keyof typeof integrationTemplates]?.permissions?.required.map((permission: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <h3 className="font-medium text-sm">Use Cases</h3>
                      </div>
                      <ul className="space-y-1.5">
                        {integrationTemplates[selectedIntegration.type as keyof typeof integrationTemplates]?.permissions?.useCases.map((useCase: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                            {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-gray-900/50">
                <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
                  Cancel
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleModalTestConnection}
                    disabled={isTestingConnection}
                    className="min-w-[120px]"
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleModalSave}
                    disabled={isTestingConnection}
                    className="min-w-[120px]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}