import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Settings, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, Info, BookOpen, Shield, Target, Loader2 } from "lucide-react";
import { SiFacebook, SiGoogle, SiSnowflake, SiTwilio, SiMixpanel, SiIntercom, SiSalesforce, SiHubspot, SiZendesk } from "react-icons/si";
import brazeIconPath from "@assets/BRZE_1749419981281.png";

// Use the actual Integration type from schema
import type { Integration } from '@shared/schema';

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
  setupGuide: {
    title: string;
    steps: string[];
    documentation?: string;
  };
  permissions: {
    required: string[];
    documentation: string;
  };
  useCases: string[];
}

const integrationTemplates: Record<string, IntegrationTemplate> = {
  braze: {
    name: 'Braze',
    description: 'Customer engagement platform for marketing automation',
    icon: <img src={brazeIconPath} alt="Braze" className="h-6 w-6" />,
    color: 'bg-purple-500',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://rest.iad-01.braze.com' },
      { key: 'appId', label: 'App ID', type: 'text', required: true }
    ],
    setupGuide: {
      title: 'Create API Key in Braze Dashboard',
      steps: [
        'Log in to your Braze project dashboard',
        'Navigate to Settings → Developer Console',
        'Click "Create New API Key"',
        'Select required permissions: users.track, users.export, segments.list, segments.create, campaigns.trigger',
        'Copy the API Key and your REST endpoint URL'
      ],
      documentation: 'https://www.braze.com/docs/api/basics/'
    },
    permissions: {
      required: ['users.track', 'users.export', 'segments.list', 'segments.create', 'campaigns.trigger', 'canvas.list', 'canvas.trigger'],
      documentation: 'Create API Key in Braze Dashboard → Settings → Developer Console → REST API Keys'
    },
    useCases: [
      'Read user profiles and engagement data',
      'Create and manage audience segments',
      'Send targeted campaigns and messages',
      'Track custom events and user attributes',
      'Export user data for analysis'
    ]
  },
  amplitude: {
    name: 'Amplitude',
    description: 'Product analytics for user behavior tracking',
    icon: <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">A</div>,
    color: 'bg-blue-500',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'appId', label: 'App ID', type: 'text', required: true }
    ],
    setupGuide: {
      title: 'Get Amplitude API Credentials',
      steps: [
        'Go to your Amplitude project settings',
        'Navigate to General → Project Settings',
        'Copy your Project API Key and Secret Key',
        'Find your App ID in the project overview',
        'Ensure your account has cohort creation permissions'
      ]
    },
    permissions: {
      required: ['cohorts:read', 'cohorts:write', 'users:read', 'events:read'],
      documentation: 'Get credentials from Amplitude → Settings → Project Settings → API Keys'
    },
    useCases: [
      'Access user behavioral analytics',
      'Create and sync user cohorts',
      'Export user event data',
      'Analyze user journey funnels',
      'Track product engagement metrics'
    ]
  },
  facebook: {
    name: 'Facebook Ads',
    description: 'Social media advertising platform for targeted campaigns',
    icon: <SiFacebook className="h-6 w-6 text-blue-600" />,
    color: 'bg-blue-600',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true, placeholder: 'act_123456789' },
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true }
    ],
    setupGuide: {
      title: 'Create Facebook App and Get Access Token',
      steps: [
        'Go to Facebook Developers → Create App',
        'Add Marketing API product to your app',
        'Generate an access token with ads_read and ads_management permissions',
        'Get your Ad Account ID from Facebook Ads Manager',
        'Use Graph API Explorer to test your token'
      ]
    },
    permissions: {
      required: ['ads_read', 'ads_management', 'business_management'],
      documentation: 'Create app at developers.facebook.com → Add Marketing API → Generate access token'
    },
    useCases: [
      'Import advertising campaign performance data',
      'Create custom audiences from user segments',
      'Sync conversion events and attribution',
      'Access demographic and interest data',
      'Export campaign metrics and insights'
    ]
  },
  google: {
    name: 'Google Ads',
    description: 'Search and display advertising platform',
    icon: <SiGoogle className="h-6 w-6 text-red-500" />,
    color: 'bg-red-500',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
      { key: 'customerId', label: 'Customer ID', type: 'text', required: true, placeholder: '123-456-7890' },
      { key: 'developerToken', label: 'Developer Token', type: 'password', required: true }
    ],
    setupGuide: {
      title: 'Set up Google Ads API Access',
      steps: [
        'Create a project in Google Cloud Console',
        'Enable Google Ads API',
        'Create OAuth 2.0 credentials',
        'Get your Customer ID from Google Ads',
        'Apply for a Developer Token',
        'Generate refresh token using OAuth playground'
      ]
    },
    permissions: {
      required: ['https://www.googleapis.com/auth/adwords'],
      documentation: 'Set up at console.cloud.google.com → Enable Google Ads API → Create credentials'
    },
    useCases: [
      'Import search campaign performance data',
      'Create customer match audiences',
      'Export search term and keyword performance data',
      'Access conversion tracking data',
      'Analyze ad performance metrics'
    ]
  },
  snowflake: {
    name: 'Snowflake',
    description: 'Cloud data warehouse for analytics and data storage',
    icon: <SiSnowflake className="h-6 w-6 text-blue-500" />,
    color: 'bg-cyan-500',
    fields: [
      { key: 'account', label: 'Account', type: 'text', required: true, placeholder: 'your-account.snowflakecomputing.com' },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'warehouse', label: 'Warehouse', type: 'text', required: true, placeholder: 'COMPUTE_WH' },
      { key: 'database', label: 'Database', type: 'text', required: true, placeholder: 'MY_DATABASE' },
      { key: 'schema', label: 'Schema', type: 'text', required: true, placeholder: 'PUBLIC' },
      { key: 'role', label: 'Role', type: 'text', required: false }
    ],
    setupGuide: {
      title: 'Create Snowflake User and Database Access',
      steps: [
        'Create a dedicated user account in Snowflake',
        'Grant necessary permissions to databases and schemas',
        'Ensure user has access to required warehouse',
        'Test connection using provided credentials',
        'Configure IP whitelisting if required'
      ]
    },
    permissions: {
      required: ['USAGE on WAREHOUSE', 'USAGE on DATABASE', 'USAGE on SCHEMA', 'SELECT on TABLES'],
      documentation: 'Create user in Snowflake → Grant permissions → Test connection'
    },
    useCases: [
      'Query customer data for segmentation',
      'Access transaction and behavioral data',
      'Run analytics on large datasets',
      'Export user cohorts for marketing automation',
      'Store and analyze cross-platform user data'
    ]
  },
  postgresql: {
    name: 'PostgreSQL',
    description: 'Relational database for data storage and analytics',
    icon: <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">PG</div>,
    color: 'bg-blue-600',
    fields: [
      { key: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '5432' },
      { key: 'database', label: 'Database', type: 'text', required: true, placeholder: 'mydatabase' },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'ssl', label: 'SSL Mode', type: 'select', required: true, options: ['require', 'prefer', 'allow', 'disable'] }
    ],
    setupGuide: {
      title: 'Configure PostgreSQL Connection',
      steps: [
        'Ensure PostgreSQL server is running and accessible',
        'Create a dedicated user account with appropriate permissions',
        'Grant necessary database permissions (SELECT, INSERT, UPDATE, DELETE)',
        'Configure SSL settings based on your security requirements',
        'Test connection using provided credentials'
      ]
    },
    permissions: {
      required: ['CONNECT', 'SELECT', 'INSERT', 'UPDATE', 'DELETE on tables'],
      documentation: 'Create user in PostgreSQL → Grant permissions → Configure SSL → Test connection'
    },
    useCases: [
      'Store and query customer data',
      'Manage user sessions and authentication',
      'Analytics and reporting data storage',
      'Real-time data processing',
      'Application state persistence'
    ]
  },
  clevertap: {
    name: 'CleverTap',
    description: 'Customer engagement and analytics platform',
    icon: <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded flex items-center justify-center text-white font-bold text-xs">CT</div>,
    color: 'bg-teal-500',
    fields: [
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
      { key: 'passcode', label: 'Passcode', type: 'password', required: true },
      { key: 'region', label: 'Region', type: 'select', required: true, options: ['us1', 'eu1', 'aps3', 'mec1'] },
      { key: 'token', label: 'Token', type: 'password', required: false }
    ],
    setupGuide: {
      title: 'Get CleverTap API Credentials',
      steps: [
        'Log in to your CleverTap dashboard',
        'Go to Settings → Engage → API',
        'Copy your Account ID and Passcode',
        'Select your data center region',
        'Enable API access for your account'
      ]
    },
    permissions: {
      required: ['profiles:read', 'profiles:write', 'events:read', 'segments:read'],
      documentation: 'Get credentials from CleverTap Dashboard → Settings → API'
    },
    useCases: [
      'Access user profiles and behavioral data',
      'Create and sync user segments',
      'Export user cohorts for marketing automation',
      'Track custom events and user properties',
      'Analyze user engagement patterns'
    ]
  },
  mixpanel: {
    name: 'Mixpanel',
    description: 'Product analytics for user behavior tracking',
    icon: <SiMixpanel className="h-6 w-6 text-purple-600" />,
    color: 'bg-purple-600',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'serviceAccountUsername', label: 'Service Account Username', type: 'text', required: true },
      { key: 'serviceAccountSecret', label: 'Service Account Secret', type: 'password', required: true },
      { key: 'projectToken', label: 'Project Token', type: 'password', required: false }
    ],
    setupGuide: {
      title: 'Create Mixpanel Service Account',
      steps: [
        'Go to your Mixpanel project settings',
        'Navigate to Access Security → Service Accounts',
        'Create a new service account',
        'Copy the username and secret',
        'Ensure the account has necessary permissions'
      ]
    },
    permissions: {
      required: ['read:events', 'read:profiles', 'write:profiles'],
      documentation: 'Create service account in Mixpanel → Project Settings → Access Security → Service Accounts'
    },
    useCases: [
      'Access user event and behavioral data',
      'Export user profiles for segmentation',
      'Create custom user cohorts',
      'Track product usage analytics',
      'Analyze user journey and retention'
    ]
  },
  segment: {
    name: 'Segment',
    description: 'Customer data platform for unified data collection',
    icon: <div className="h-6 w-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">S</div>,
    color: 'bg-green-600',
    fields: [
      { key: 'writeKey', label: 'Write Key', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'workspaceSlug', label: 'Workspace Slug', type: 'text', required: true },
      { key: 'sourceId', label: 'Source ID', type: 'text', required: false }
    ],
    setupGuide: {
      title: 'Get Segment API Credentials',
      steps: [
        'Go to your Segment workspace',
        'Navigate to Settings → API Access',
        'Create a new API token with required permissions',
        'Copy your workspace slug from the URL',
        'Get source ID from source settings if needed'
      ]
    },
    permissions: {
      required: ['Workspace Owner', 'Source Admin', 'Tracking API Access'],
      documentation: 'Get credentials from Segment Workspace Settings → Access Management → Create API token with source permissions'
    },
    useCases: [
      'Collect user behavior data',
      'Sync customer profiles across platforms',
      'Track conversion events',
      'Unify data from multiple sources',
      'Export user segments for marketing'
    ]
  },
  intercom: {
    name: 'Intercom',
    description: 'Customer messaging and support platform',
    icon: <SiIntercom className="h-6 w-6 text-blue-600" />,
    color: 'bg-blue-500',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'appId', label: 'App ID', type: 'text', required: false },
      { key: 'apiVersion', label: 'API Version', type: 'select', required: true, options: ['2.10', '2.11'] }
    ],
    setupGuide: {
      title: 'Create Intercom Access Token',
      steps: [
        'Go to your Intercom app settings',
        'Navigate to Developer Hub → Your Apps',
        'Create a new app or select existing',
        'Generate an access token with required scopes',
        'Copy the token and app ID'
      ]
    },
    permissions: {
      required: ['Read users', 'Read conversations', 'Read contacts'],
      documentation: 'Create access token in Intercom Developer Hub → Your Apps → Authentication → Access Token with required scopes'
    },
    useCases: [
      'Access customer conversation history',
      'Export user profiles and segments',
      'Track support engagement metrics',
      'Sync customer support data',
      'Analyze customer satisfaction trends'
    ]
  },
  salesforce: {
    name: 'Salesforce',
    description: 'CRM platform for customer relationship management',
    icon: <SiSalesforce className="h-6 w-6 text-blue-600" />,
    color: 'bg-blue-700',
    fields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://your-instance.salesforce.com' },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'securityToken', label: 'Security Token', type: 'password', required: false }
    ],
    setupGuide: {
      title: 'Create Salesforce Connected App',
      steps: [
        'Log in to Salesforce Setup',
        'Navigate to App Manager → New Connected App',
        'Enable OAuth settings with required scopes',
        'Get Client ID and Client Secret',
        'Generate or reset your security token'
      ]
    },
    permissions: {
      required: ['api', 'refresh_token', 'offline_access'],
      documentation: 'Create connected app in Salesforce Setup → App Manager → New Connected App → Enable OAuth'
    },
    useCases: [
      'Access customer and lead data',
      'Sync sales and opportunity information',
      'Export contact lists for marketing campaigns',
      'Track customer lifecycle stages',
      'Integrate CRM data with marketing platforms'
    ]
  },
  hubspot: {
    name: 'HubSpot',
    description: 'Marketing, sales, and service platform',
    icon: <SiHubspot className="h-6 w-6 text-orange-600" />,
    color: 'bg-orange-600',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'portalId', label: 'Portal ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key (Legacy)', type: 'password', required: false }
    ],
    setupGuide: {
      title: 'Create HubSpot Private App',
      steps: [
        'Go to HubSpot account settings',
        'Navigate to Integrations → Private Apps',
        'Create a new private app',
        'Configure required scopes and permissions',
        'Copy the access token'
      ]
    },
    permissions: {
      required: ['contacts', 'companies', 'deals', 'marketing-events'],
      documentation: 'Create private app in HubSpot → Settings → Integrations → Private Apps → Create app with required scopes'
    },
    useCases: [
      'Access contact and company data',
      'Sync marketing campaign performance',
      'Export lead scoring and attribution data',
      'Track customer journey stages',
      'Integrate with marketing automation workflows'
    ]
  },
  zendesk: {
    name: 'Zendesk',
    description: 'Customer service and support ticketing platform',
    icon: <SiZendesk className="h-6 w-6 text-green-600" />,
    color: 'bg-green-700',
    fields: [
      { key: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'your-company' },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'apiToken', label: 'API Token', type: 'password', required: true }
    ],
    setupGuide: {
      title: 'Generate Zendesk API Token',
      steps: [
        'Log in to your Zendesk instance',
        'Go to Admin Center → Channels → API',
        'Enable token access and create new token',
        'Copy the API token',
        'Ensure your user has admin permissions'
      ]
    },
    permissions: {
      required: ['Admin', 'Agent'],
      documentation: 'Generate token in Zendesk Admin Center → Channels → API → Token Access'
    },
    useCases: [
      'Access customer support tickets',
      'Export user satisfaction scores',
      'Track support response times',
      'Sync customer service interactions',
      'Analyze support team performance'
    ]
  },
  twilio: {
    name: 'Twilio',
    description: 'Communications platform for SMS, voice, and messaging',
    icon: <SiTwilio className="h-6 w-6 text-red-600" />,
    color: 'bg-red-600',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', required: false, placeholder: '+1234567890' }
    ],
    setupGuide: {
      title: 'Get Twilio Account Credentials',
      steps: [
        'Log in to your Twilio Console',
        'Find your Account SID on the dashboard',
        'Copy your Auth Token (click to reveal)',
        'Purchase a phone number if needed',
        'Ensure your account has necessary permissions'
      ]
    },
    permissions: {
      required: ['Voice', 'SMS', 'Account'],
      documentation: 'Get credentials from Twilio Console → Account → API keys & tokens'
    },
    useCases: [
      'Send SMS notifications and alerts',
      'Track communication engagement',
      'Implement two-factor authentication',
      'Automate voice and messaging workflows',
      'Monitor communication delivery rates'
    ]
  }
};

// Memoized integration card component for performance optimization
const IntegrationCard = memo(({ integration, template, getStatusBadge, handleConfigureIntegration, deleteIntegrationMutation }: {
  integration: Integration;
  template: IntegrationTemplate;
  getStatusBadge: (status: string) => React.ReactNode;
  handleConfigureIntegration: (integration: Integration) => void;
  deleteIntegrationMutation: any;
}) => (
  <Card className="card hover:shadow-xl transition-all duration-300 slide-up group">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex-shrink-0">
            {template?.icon}
          </div>
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
              {integration.name}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              {integration.description}
            </CardDescription>
          </div>
        </div>
        <div className="flex-shrink-0">
          {getStatusBadge(integration.status)}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="text-sm text-muted-foreground space-y-2 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium">Created:</span>
          <span>{new Date(integration.createdAt).toLocaleDateString()}</span>
        </div>
        {integration.lastUsedAt && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Last used:</span>
            <span>{new Date(integration.lastUsedAt).toLocaleDateString()}</span>
          </div>
        )}
        
        {/* Database-specific metadata */}
        {integration.metadata && typeof integration.metadata === 'object' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-600 mb-2">
              {integration.type === 'postgresql' ? 'DATABASE METRICS' : 
               integration.type === 'snowflake' ? 'WAREHOUSE METRICS' : 'DATA METRICS'}
            </div>
            <div className="space-y-1">
              {(() => {
                const metadata = integration.metadata as any;
                
                if (integration.type === 'postgresql') {
                  return (
                    <>
                      {metadata?.tableCount && (
                        <div className="flex justify-between">
                          <span>Tables:</span>
                          <span className="font-medium text-blue-600">{metadata.tableCount}</span>
                        </div>
                      )}
                      {metadata?.userTables && metadata?.views && (
                        <div className="flex justify-between">
                          <span>User/Views:</span>
                          <span className="font-medium text-blue-600">{metadata.userTables}/{metadata.views}</span>
                        </div>
                      )}
                      {metadata?.size && (
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium text-green-600">{metadata.size}</span>
                        </div>
                      )}
                      {metadata?.schemas && Array.isArray(metadata.schemas) && (
                        <div className="flex justify-between">
                          <span>Schemas:</span>
                          <span className="font-medium text-purple-600">{metadata.schemas.length}</span>
                        </div>
                      )}
                    </>
                  );
                }
                
                if (integration.type === 'snowflake') {
                  return (
                    <>
                      {metadata?.tableCount && (
                        <div className="flex justify-between">
                          <span>Tables:</span>
                          <span className="font-medium text-blue-600">{metadata.tableCount}</span>
                        </div>
                      )}
                      {metadata?.viewCount && (
                        <div className="flex justify-between">
                          <span>Views:</span>
                          <span className="font-medium text-blue-600">{metadata.viewCount}</span>
                        </div>
                      )}
                      {metadata?.sizeGB && (
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium text-green-600">{metadata.sizeGB} GB</span>
                        </div>
                      )}
                      {metadata?.warehouse && (
                        <div className="flex justify-between">
                          <span>Warehouse:</span>
                          <span className="font-medium text-purple-600">{metadata.warehouse}</span>
                        </div>
                      )}
                      {metadata?.schemas && Array.isArray(metadata.schemas) && (
                        <div className="flex justify-between">
                          <span>Schemas:</span>
                          <span className="font-medium text-purple-600">{metadata.schemas.length}</span>
                        </div>
                      )}
                    </>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleConfigureIntegration(integration)}
          className="flex-1 font-medium hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <Settings className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Test
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
        >
          Pause
        </Button>
      </div>
    </CardContent>
  </Card>
));

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch integrations from database with fresh data
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: () => apiRequest('/api/integrations') as Promise<Integration[]>,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch on window focus
    refetchOnMount: true, // Refetch on component mount
    refetchOnReconnect: true, // Refetch on network reconnect
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
      // Update existing integration
      updateIntegrationMutation.mutate({
        id: selectedIntegration.id,
        data: {
          credentials: formData,
          status: 'disconnected' // Reset status when credentials change
        }
      });
    } else if (selectedTemplate) {
      // Create new integration
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

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;
    
    setIsTestingConnection(true);
    try {
      // Test with current form credentials instead of saved ones
      const testCredentials = { ...formData };
      
      // Validate required fields
      const template = integrationTemplates[selectedIntegration.type];
      const missingFields = template?.fields.filter(field => 
        field.required && !testCredentials[field.key]
      ) || [];
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing required fields",
          description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`/api/integrations/${selectedIntegration.type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCredentials)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Connection successful",
          description: "Integration is working correctly with current credentials."
        });
      } else {
        toast({
          title: "Connection failed",
          description: result.error || "Failed to connect with provided credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test failed",
        description: "An error occurred while testing the connection.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestNewIntegration = async (templateKey: string) => {
    if (!templateKey || !formData) return;

    setIsTestingConnection(true);
    
    try {
      // Test connection using the integration test endpoints
      const response = await apiRequest(`/api/integrations/${templateKey}/test`, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        toast({
          title: "Connection successful",
          description: "Your credentials are working correctly."
        });
      } else {
        toast({
          title: "Connection failed",
          description: response.error || "Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection test failed",
        description: "Unable to test connection. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

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
        <Button onClick={handleAddIntegration} className="btn-primary px-6 py-3 text-sm font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map((integration: Integration) => {
          const template = integrationTemplates[integration.type];
          return (
            <Card key={integration.id} className="card hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      {template?.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                        {integration.name}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Compact connection info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(integration.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>{new Date(integration.updatedAt).toLocaleString()}</span>
                  </div>
                  {integration.metadata?.lastTested && (
                    <div className="flex justify-between">
                      <span>Last tested:</span>
                      <span>{new Date(integration.metadata.lastTested).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Snowflake specific info - compact */}
                {integration.type === 'snowflake' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded border border-blue-100">
                      <div className="font-medium text-blue-900">Database</div>
                      <div className="text-blue-700 truncate">{integration.credentials.database}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded border border-green-100">
                      <div className="font-medium text-green-900">Warehouse</div>
                      <div className="text-green-700 truncate">{integration.credentials.warehouse}</div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleConfigureIntegration(integration)}
                    className="flex-1 text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => testConnectionMutation.mutate(integration.id)}
                    disabled={testConnectionMutation.isPending || integration.status === 'paused'}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    {testConnectionMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    Test
                  </Button>
                  <Button 
                    variant={integration.status === 'paused' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => handlePauseToggle(integration)}
                    className="text-xs"
                  >
                    {integration.status === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Integration Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="modal-enhanced max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="modal-header space-y-3">
            <DialogTitle className="text-2xl font-bold tracking-tight">Add New Integration</DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              Choose a platform to integrate with your customer data platform
            </DialogDescription>
          </DialogHeader>

          {!selectedTemplate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {Object.entries(integrationTemplates).map(([key, template]) => (
                <Card 
                  key={key}
                  className="card cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-blue-200 group"
                  onClick={() => handleTemplateSelect(key)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 group-hover:border-blue-200 transition-colors">
                        {template.icon}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Configuration Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold tracking-tight">Configuration</h3>
                  <p className="text-muted-foreground">Enter your credentials to connect {integrationTemplates[selectedTemplate].name}</p>
                </div>
                
                <div className="space-y-5">
                  {integrationTemplates[selectedTemplate].fields.map((field) => (
                    <div key={field.key} className="space-y-3">
                      <Label htmlFor={field.key} className="text-sm font-medium text-foreground">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="relative">
                        {renderField(field, formData[field.key], (value) => 
                          setFormData(prev => ({ ...prev, [field.key]: value }))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documentation Panel */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl space-y-6 flex flex-col h-fit">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center text-blue-900">
                    <BookOpen className="h-5 w-5 mr-3 text-blue-600" />
                    Setup Guide
                  </h4>
                  <div className="bg-white p-4 rounded-xl border border-blue-100">
                    <p className="text-sm font-medium mb-3 text-gray-800">{integrationTemplates[selectedTemplate].setupGuide.title}</p>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside leading-relaxed">
                      {integrationTemplates[selectedTemplate].setupGuide.steps.map((step, index) => (
                        <li key={index} className="pl-2">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center text-blue-900">
                    <Shield className="h-5 w-5 mr-3 text-green-600" />
                    Required Permissions
                  </h4>
                  <div className="bg-white p-4 rounded-xl border border-blue-100">
                    <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside leading-relaxed">
                      {integrationTemplates[selectedTemplate].permissions.required.map((permission, index) => (
                        <li key={index} className="pl-2">{permission}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-600 mt-3 p-2 bg-gray-50 rounded-lg border">
                      {integrationTemplates[selectedTemplate].permissions.documentation}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h4 className="text-lg font-semibold flex items-center text-blue-900">
                    <Target className="h-5 w-5 mr-3 text-purple-600" />
                    Use Cases
                  </h4>
                  <div className="bg-white p-4 rounded-xl border border-blue-100">
                    <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside leading-relaxed">
                      {integrationTemplates[selectedTemplate].useCases.map((useCase, index) => (
                        <li key={index} className="pl-2">{useCase}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6 border-t border-blue-200">
                  <Button 
                    onClick={() => handleTestNewIntegration(selectedTemplate)} 
                    variant="outline" 
                    disabled={isTestingConnection}
                    className="flex-1 font-medium border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                  <Button onClick={handleSaveIntegration} className="flex-1 btn-primary font-medium">
                    Save Configuration
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedTemplate('')} className="font-medium">
                    Back
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Configure Integration Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Update your integration credentials and settings
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Configuration Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuration</h3>
                {integrationTemplates[selectedIntegration.type]?.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    {renderField(field, formData[field.key], (value) => 
                      setFormData(prev => ({ ...prev, [field.key]: value }))
                    )}
                  </div>
                ))}
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleTestConnection} 
                    variant="outline" 
                    disabled={isTestingConnection}
                    className="flex-1"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                  <Button onClick={handleSaveIntegration} className="flex-1">
                    Save Configuration
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    onClick={() => deleteIntegrationMutation.mutate(selectedIntegration.id)}
                    disabled={deleteIntegrationMutation.isPending}
                    className="w-full"
                  >
                    {deleteIntegrationMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Integration
                  </Button>
                </div>
              </div>

              {/* Documentation Panel */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold flex items-center mb-2">
                    <Info className="h-4 w-4 mr-2" />
                    Integration Details
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Status: {getStatusBadge(selectedIntegration.status)}</div>
                    <div>Created: {new Date(selectedIntegration.createdAt).toLocaleDateString()}</div>
                    {selectedIntegration.lastUsedAt && (
                      <div>Last used: {new Date(selectedIntegration.lastUsedAt).toLocaleDateString()}</div>
                    )}
                    {selectedIntegration.metadata?.lastTested && (
                      <div>Last tested: {new Date(selectedIntegration.metadata.lastTested).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                {integrationTemplates[selectedIntegration.type] && (
                  <>
                    <div>
                      <h4 className="font-semibold flex items-center mb-2">
                        <Shield className="h-4 w-4 mr-2" />
                        Required Permissions
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {integrationTemplates[selectedIntegration.type].permissions.required.map((permission, index) => (
                          <li key={index}>{permission}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold flex items-center mb-2">
                        <Target className="h-4 w-4 mr-2" />
                        Use Cases
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {integrationTemplates[selectedIntegration.type].useCases.map((useCase, index) => (
                          <li key={index}>{useCase}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}