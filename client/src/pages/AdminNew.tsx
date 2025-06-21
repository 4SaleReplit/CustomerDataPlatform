import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, UserPlus, Shield, Key, Copy, MoreHorizontal, Mail, Send, Crown, Users, Settings, Lock, Database, Server, Cloud, Target, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, BarChart3, MessageSquare, Save, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { SimpleMigrationModal } from '@/components/migration/SimpleMigrationModal';
import { ConsoleLogModal } from '@/components/migration/ConsoleLogModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import RoleManagement from './RoleManagement';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  message?: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  isSystemRole: boolean;
  isActive: boolean;
  hierarchyLevel: number;
  canManageRoles: boolean;
  maxTeamMembers?: number;
  allowedFeatures: string[];
  createdAt: string;
  updatedAt: string;
}

interface EndpointTestResult {
  status: number;
  responseTime: number;
  isHealthy: boolean;
  error?: string;
  requestDetails?: {
    timestamp: string;
    headers: Record<string, string>;
  };
  responseDetails?: {
    headers: Record<string, string>;
    body: any;
    statusText: string;
  };
}

export default function AdminNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState<any>(null);
  const [invitationData, setInvitationData] = useState<InvitationData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
    message: ''
  });
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedUserData, setGeneratedUserData] = useState<any>(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [selectedMigrationType, setSelectedMigrationType] = useState('');
  const [selectedSourceEnv, setSelectedSourceEnv] = useState('');
  const [selectedTargetEnv, setSelectedTargetEnv] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSessionId, setMigrationSessionId] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [showIntegrationTypesModal, setShowIntegrationTypesModal] = useState(false);
  const [showEnvConfigModal, setShowEnvConfigModal] = useState(false);
  const [selectedConfigEnv, setSelectedConfigEnv] = useState('');
  const [envConfig, setEnvConfig] = useState<{ [key: string]: string }>({});
  const [currentEnvironment, setCurrentEnvironment] = useState('development');
  const [activeIntegrationTypes, setActiveIntegrationTypes] = useState(['postgresql', 'snowflake']);
  const [environmentDatabases, setEnvironmentDatabases] = useState<{ [envId: string]: { [type: string]: string } }>({
    development: {},
    staging: {},
    production: {}
  });
  const [environments, setEnvironments] = useState<Array<{id: string, name: string, status: string, databases: any}>>([
    { id: 'development', name: 'Development', status: 'active', databases: {} },
    { id: 'staging', name: 'Staging', status: 'inactive', databases: {} },
    { id: 'production', name: 'Production', status: 'inactive', databases: {} }
  ]);

  // Integration management state
  const [showCreateIntegrationModal, setShowCreateIntegrationModal] = useState(false);
  const [showEditIntegrationModal, setShowEditIntegrationModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [testingIntegrations, setTestingIntegrations] = useState<string[]>([]);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState('');
  const [integrationFormData, setIntegrationFormData] = useState<any>({});
  const [showIntegrationTypeSelector, setShowIntegrationTypeSelector] = useState(false);
  const [integrationSearchTerm, setIntegrationSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Endpoint monitoring state
  const [showAddEndpointModal, setShowAddEndpointModal] = useState(false);
  const [showEditEndpointModal, setShowEditEndpointModal] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<any>(null);
  const [endpointFormData, setEndpointFormData] = useState<any>({});
  const [testingEndpoints, setTestingEndpoints] = useState<string[]>([]);
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([]);
  const [endpointTestResults, setEndpointTestResults] = useState<Map<string, any>>(new Map());

  // Comprehensive integration templates organized by category
  const integrationTemplates: Record<string, any> = {
    // Database Integrations
    postgresql: {
      name: 'PostgreSQL',
      description: 'Connect to PostgreSQL database for data storage and queries',
      category: 'Database',
      color: 'blue',
      fields: [
        { key: 'connectionString', label: 'Connection String', type: 'text', placeholder: 'postgresql://username:password@host:5432/database?sslmode=require', required: true }
      ]
    },
    mysql: {
      name: 'MySQL',
      description: 'Connect to MySQL database for data storage and queries',
      category: 'Database',
      color: 'orange',
      fields: [
        { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
        { key: 'port', label: 'Port', type: 'text', placeholder: '3306', required: true },
        { key: 'database', label: 'Database Name', type: 'text', required: true },
        { key: 'username', label: 'Username', type: 'text', required: true },
        { key: 'password', label: 'Password', type: 'password', required: true }
      ]
    },
    mongodb: {
      name: 'MongoDB',
      description: 'Connect to MongoDB for document-based data storage',
      category: 'Database',
      color: 'green',
      fields: [
        { key: 'connectionString', label: 'Connection String', type: 'text', placeholder: 'mongodb://username:password@host:27017/database', required: true }
      ]
    },
    redis: {
      name: 'Redis',
      description: 'Connect to Redis for caching and session management',
      category: 'Database',
      color: 'red',
      fields: [
        { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
        { key: 'port', label: 'Port', type: 'text', placeholder: '6379', required: true },
        { key: 'password', label: 'Password', type: 'password' },
        { key: 'database', label: 'Database Index', type: 'text', placeholder: '0' }
      ]
    },
    snowflake: {
      name: 'Snowflake',
      description: 'Connect to Snowflake for analytics and data warehousing',
      category: 'Database',
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

    // Analytics Tools
    amplitude: {
      name: 'Amplitude',
      description: 'Track user behavior and analytics with Amplitude',
      category: 'Analytics',
      color: 'purple',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
        { key: 'serverZone', label: 'Server Zone', type: 'select', options: ['US', 'EU'], placeholder: 'US' }
      ]
    },
    mixpanel: {
      name: 'Mixpanel',
      description: 'Product analytics to track user interactions and events',
      category: 'Analytics',
      color: 'blue',
      fields: [
        { key: 'projectToken', label: 'Project Token', type: 'password', required: true },
        { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
        { key: 'projectId', label: 'Project ID', type: 'text', required: true }
      ]
    },
    googleAnalytics: {
      name: 'Google Analytics',
      description: 'Web analytics service to track website traffic and user behavior',
      category: 'Analytics',
      color: 'orange',
      fields: [
        { key: 'measurementId', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX', required: true },
        { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true }
      ]
    },
    segment: {
      name: 'Segment',
      description: 'Customer data platform for collecting and routing analytics data',
      category: 'Analytics',
      color: 'green',
      fields: [
        { key: 'writeKey', label: 'Write Key', type: 'password', required: true },
        { key: 'sourceId', label: 'Source ID', type: 'text', required: true },
        { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: true }
      ]
    },

    // Marketing Tools
    braze: {
      name: 'Braze',
      description: 'Customer engagement platform for targeted campaigns',
      category: 'Marketing',
      color: 'pink',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'restEndpoint', label: 'REST Endpoint', type: 'url', placeholder: 'https://rest.iad-01.braze.com', required: true },
        { key: 'appId', label: 'App ID', type: 'text', required: true }
      ]
    },
    sendgrid: {
      name: 'SendGrid',
      description: 'Email delivery service for transactional emails',
      category: 'Marketing',
      color: 'blue',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'fromEmail', label: 'From Email', type: 'email', placeholder: 'noreply@yourapp.com', required: true },
        { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your App' }
      ]
    },
    smtp: {
      name: 'SMTP Email Server',
      description: 'Custom SMTP server for sending emails with email and app password authentication',
      category: 'Communication',
      color: 'blue',
      fields: [
        { key: 'host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
        { key: 'port', label: 'SMTP Port', type: 'text', placeholder: '587', required: true },
        { key: 'secure', label: 'Use SSL/TLS', type: 'select', options: ['true', 'false'], placeholder: 'true', required: true },
        { key: 'email', label: 'Email Address', type: 'email', placeholder: 'your-email@gmail.com', required: true },
        { key: 'password', label: 'App Password', type: 'password', required: true },
        { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Platform Name' }
      ]
    },
    mailchimp: {
      name: 'Mailchimp',
      description: 'Email marketing platform for campaigns and automation',
      category: 'Marketing',
      color: 'yellow',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'serverPrefix', label: 'Server Prefix', type: 'text', placeholder: 'us1', required: true },
        { key: 'listId', label: 'List ID', type: 'text', required: true }
      ]
    },
    hubspot: {
      name: 'HubSpot',
      description: 'CRM and marketing automation platform',
      category: 'Marketing',
      color: 'orange',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'portalId', label: 'Portal ID', type: 'text', required: true }
      ]
    },
    salesforce: {
      name: 'Salesforce',
      description: 'Customer relationship management platform',
      category: 'Marketing',
      color: 'blue',
      fields: [
        { key: 'username', label: 'Username', type: 'text', required: true },
        { key: 'password', label: 'Password', type: 'password', required: true },
        { key: 'securityToken', label: 'Security Token', type: 'password', required: true },
        { key: 'instanceUrl', label: 'Instance URL', type: 'url', placeholder: 'https://your-instance.salesforce.com', required: true }
      ]
    },
    facebook: {
      name: 'Facebook Ads',
      description: 'Facebook advertising platform for campaign management',
      category: 'Marketing',
      color: 'blue',
      fields: [
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
        { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true },
        { key: 'appId', label: 'App ID', type: 'text', required: true },
        { key: 'appSecret', label: 'App Secret', type: 'password', required: true }
      ]
    },
    google: {
      name: 'Google Ads',
      description: 'Google advertising platform for search and display campaigns',
      category: 'Marketing',
      color: 'green',
      fields: [
        { key: 'customerId', label: 'Customer ID', type: 'text', required: true },
        { key: 'developerToken', label: 'Developer Token', type: 'password', required: true },
        { key: 'clientId', label: 'Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true }
      ]
    },

    // Communication Tools
    intercom: {
      name: 'Intercom',
      description: 'Customer messaging platform for support and engagement',
      category: 'Communication',
      color: 'blue',
      fields: [
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
        { key: 'appId', label: 'App ID', type: 'text', required: true }
      ]
    },
    zendesk: {
      name: 'Zendesk',
      description: 'Customer service platform for support ticket management',
      category: 'Communication',
      color: 'green',
      fields: [
        { key: 'subdomain', label: 'Subdomain', type: 'text', placeholder: 'your-company', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'apiToken', label: 'API Token', type: 'password', required: true }
      ]
    },
    slack: {
      name: 'Slack',
      description: 'Team communication platform for notifications and alerts',
      category: 'Communication',
      color: 'purple',
      fields: [
        { key: 'botToken', label: 'Bot Token', type: 'password', required: true },
        { key: 'channel', label: 'Default Channel', type: 'text', placeholder: '#general', required: true },
        { key: 'signingSecret', label: 'Signing Secret', type: 'password', required: true }
      ]
    },
    twillio: {
      name: 'Twilio',
      description: 'Cloud communications platform for SMS and voice',
      category: 'Communication',
      color: 'red',
      fields: [
        { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
        { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
        { key: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: '+1234567890', required: true }
      ]
    },

    // Storage & Infrastructure
    s3: {
      name: 'AWS S3',
      description: 'Amazon S3 cloud storage for file uploads and static assets',
      category: 'Storage',
      color: 'orange',
      fields: [
        { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
        { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
        { key: 'region', label: 'AWS Region', type: 'select', options: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'], placeholder: 'us-east-1', required: true },
        { key: 'bucketName', label: 'Bucket Name', type: 'text', placeholder: 'my-app-storage', required: true }
      ]
    },
    gcs: {
      name: 'Google Cloud Storage',
      description: 'Google Cloud Storage for file uploads and static assets',
      category: 'Storage',
      color: 'blue',
      fields: [
        { key: 'projectId', label: 'Project ID', type: 'text', required: true },
        { key: 'keyFile', label: 'Service Account Key (JSON)', type: 'textarea', required: true },
        { key: 'bucketName', label: 'Bucket Name', type: 'text', required: true }
      ]
    },
    azure: {
      name: 'Azure Blob Storage',
      description: 'Microsoft Azure Blob Storage for file uploads',
      category: 'Storage',
      color: 'blue',
      fields: [
        { key: 'accountName', label: 'Account Name', type: 'text', required: true },
        { key: 'accountKey', label: 'Account Key', type: 'password', required: true },
        { key: 'containerName', label: 'Container Name', type: 'text', required: true }
      ]
    }
  };



  // Load existing environment configurations on component mount
  useEffect(() => {
    const loadEnvironmentConfigurations = async () => {
      try {
        const response = await fetch('/api/environment-configurations');
        if (response.ok) {
          const configs = await response.json();
          setEnvironmentDatabases(configs);
        }
      } catch (error) {
        console.error('Failed to load environment configurations:', error);
      }
    };

    loadEnvironmentConfigurations();
  }, []);

  // Update environments when environmentDatabases changes
  useEffect(() => {
    setEnvironments([
      { id: 'development', name: 'Development', status: currentEnvironment === 'development' ? 'active' : 'inactive', databases: environmentDatabases.development },
      { id: 'staging', name: 'Staging', status: currentEnvironment === 'staging' ? 'active' : 'inactive', databases: environmentDatabases.staging },
      { id: 'production', name: 'Production', status: currentEnvironment === 'production' ? 'active' : 'inactive', databases: environmentDatabases.production }
    ]);
  }, [environmentDatabases, currentEnvironment]);

  // Helper functions
  const getIntegrationDisplay = (type: string) => {
    const displays: { [key: string]: { icon: any, color: string } } = {
      postgresql: { icon: Database, color: 'blue' },
      snowflake: { icon: Cloud, color: 'indigo' },
      mysql: { icon: Database, color: 'orange' },
      mongodb: { icon: Database, color: 'green' },
      s3: { icon: Cloud, color: 'purple' },
      braze: { icon: Settings, color: 'red' },
      amplitude: { icon: Settings, color: 'teal' }
    };
    return displays[type] || { icon: Database, color: 'gray' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSwitchEnvironment = async (envId: string) => {
    const environment = environments.find(e => e.id === envId);
    if (!environment) return;

    // Find the PostgreSQL integration for this environment
    const postgresIntegrationId = environmentDatabases?.[environment.name.toLowerCase()]?.postgresql;
    if (!postgresIntegrationId) {
      toast({
        title: "Configuration Missing",
        description: `No PostgreSQL integration configured for ${environment.name} environment`,
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('/api/switch-environment', {
        method: 'POST',
        body: JSON.stringify({
          environment: environment.name.toLowerCase(),
          integrationId: postgresIntegrationId
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        // Update environments state to reflect the switch
        setEnvironments(prev => prev.map(env => ({
          ...env,
          status: env.id === envId ? 'active' : 'inactive'
        })));
        setCurrentEnvironment(envId);
        
        toast({
          title: "Environment Switched Successfully",
          description: `Platform is now using ${environment.name} database for all operations`
        });
      }
    } catch (error: any) {
      toast({
        title: "Environment Switch Failed",
        description: error.message || "Failed to switch environment",
        variant: "destructive"
      });
    }
  };

  const handleConfigureEnvironment = (envId: string) => {
    setSelectedConfigEnv(envId);
    setShowEnvConfigModal(true);
  };

  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/team'],
    queryFn: () => apiRequest('/api/team') as Promise<TeamMember[]>,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Fetch roles for invitation dropdown
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: () => apiRequest('/api/roles') as Promise<Role[]>,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Fetch integrations for migrations and integrations tab
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: () => apiRequest('/api/integrations'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Fetch migration history
  const { data: migrationHistory = [], isLoading: isLoadingMigrations } = useQuery({
    queryKey: ['/api/migration-history'],
    queryFn: () => apiRequest('/api/migration-history'),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false
  });

  // Fetch monitored endpoints
  const { data: monitoredEndpoints = [], isLoading: endpointsLoading } = useQuery({
    queryKey: ['/api/endpoints'],
    queryFn: () => apiRequest('/api/endpoints'),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false
  });

  // Create team member mutation
  const createTeamMemberMutation = useMutation({
    mutationFn: (data: InvitationData) => apiRequest('/api/team', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      setGeneratedUserData(response);
      setCreatedPassword(response.generatedPassword);
      setShowPasswordModal(true);
      setShowInviteModal(false);
      setInvitationData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
        message: ''
      });
      toast({
        title: "Team member created",
        description: `${response.firstName} ${response.lastName} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create team member",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest(`/api/team/${memberId}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: (response: any) => {
      const member = teamMembers.find(m => m.id === response.id);
      setGeneratedUserData({ 
        id: response.id, 
        firstName: member?.firstName || 'User', 
        lastName: member?.lastName || '' 
      });
      setCreatedPassword(response.newPassword);
      setShowPasswordModal(true);
      toast({
        title: "Password changed",
        description: "New password has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change password",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Update team member mutation
  const updateTeamMemberMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) => apiRequest(`/api/team/${data.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data.updates),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      setShowEditModal(false);
      setEditUserData(null);
      toast({
        title: "Team member updated",
        description: "Team member details have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update team member",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Delete team member mutation
  const deleteTeamMemberMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/team/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({
        title: "Team member deleted",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete team member",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle create user form submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationData.firstName || !invitationData.lastName || !invitationData.email) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createTeamMemberMutation.mutate(invitationData);
  };

  // Handle edit user
  const handleEditUser = (user: TeamMember) => {
    setEditUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle update user
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editUserData) return;

    updateTeamMemberMutation.mutate({
      id: selectedUser.id,
      updates: editUserData
    });
  };

  // Handle password change
  const handleChangePassword = (memberId: string) => {
    changePasswordMutation.mutate(memberId);
  };

  // Copy password to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Password has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy password to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Generic function to get integrations by type
  const getIntegrationsByType = (type: string) => {
    return integrations.filter((int: any) => int.type === type);
  };

  // Get available integration types for migration
  const getMigratableIntegrationTypes = () => {
    const typeCounts: { [key: string]: number } = {};
    integrations.forEach((int: any) => {
      const type = int.type as string;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.keys(typeCounts).filter(type => typeCounts[type] >= 2);
  };

  const handleStartMigration = async () => {
    if (!selectedMigrationType) {
      toast({
        title: "Error",
        description: "Please select an integration type first",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSourceEnv || !selectedTargetEnv) {
      toast({
        title: "Error",
        description: "Please select both source and destination integrations",
        variant: "destructive"
      });
      return;
    }

    if (selectedSourceEnv === selectedTargetEnv) {
      toast({
        title: "Error", 
        description: "Source and destination integrations must be different",
        variant: "destructive"
      });
      return;
    }

    setIsMigrating(true);
    
    try {
      // Get source and target integration details
      const sourceIntegration = integrations.find((int: any) => int.id === selectedSourceEnv);
      const targetIntegration = integrations.find((int: any) => int.id === selectedTargetEnv);

      if (!sourceIntegration || !targetIntegration) {
        throw new Error("Could not find selected integrations");
      }

      // Start the migration using original API
      const response = await apiRequest('/api/migrate-data', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedMigrationType,
          sourceIntegrationId: selectedSourceEnv,
          targetIntegrationId: selectedTargetEnv,
          sourceEnvironment: sourceIntegration.name,
          targetEnvironment: targetIntegration.name,
          sourceConfig: sourceIntegration.credentials,
          targetConfig: targetIntegration.credentials
        })
      });

      if (response.success) {
        setMigrationSessionId(response.sessionId);
        setShowMigrationModal(false);
        setShowProgressModal(true);
        setShowConsoleModal(true);
        
        toast({
          title: "Migration Started",
          description: `Real-time migration from ${sourceIntegration.name} to ${targetIntegration.name}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.message || "An error occurred during migration",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigrationComplete = () => {
    setShowProgressModal(false);
    setShowConsoleModal(false);
    setMigrationSessionId(null);
    queryClient.invalidateQueries({ queryKey: ['/api/migration-history'] });
    toast({
      title: "Migration Completed",
      description: "Database migration finished successfully"
    });
  };

  const handleMigrationError = (error: string) => {
    setShowProgressModal(false);
    setShowConsoleModal(false);
    setMigrationSessionId(null);
    toast({
      title: "Migration Failed",
      description: error,
      variant: "destructive"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.includes('admin') || role.includes('Administrator')) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role.includes('manager') || role.includes('Manager')) return <Shield className="h-4 w-4 text-blue-500" />;
    return <Users className="h-4 w-4 text-gray-500" />;
  };

  // Integration management handlers
  const handleTestIntegrationConnection = async (integrationId: string) => {
    setTestingIntegrations(prev => [...prev, integrationId]);
    
    try {
      const response = await apiRequest(`/api/integrations/${integrationId}/test`, {
        method: 'POST'
      });
      
      toast({
        title: "Connection Test Successful",
        description: "Integration is working properly"
      });
      
      // Refresh integrations data to update status
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
    } catch (error: any) {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to test integration connection",
        variant: "destructive"
      });
    } finally {
      setTestingIntegrations(prev => prev.filter(id => id !== integrationId));
    }
  };

  const handleEditIntegration = (integration: any) => {
    setEditingIntegration(integration);
    setShowEditIntegrationModal(true);
  };

  // Integration creation mutation
  const createIntegrationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      toast({
        title: "Integration Created",
        description: "Integration has been successfully created"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      setShowCreateIntegrationModal(false);
      setSelectedIntegrationType('');
      setIntegrationFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create integration",
        variant: "destructive"
      });
    }
  });

  const handleCreateIntegration = () => {
    setShowIntegrationTypeSelector(true);
  };

  const handleSelectIntegrationType = (type: string) => {
    setSelectedIntegrationType(type);
    setIntegrationFormData({ integrationName: '' });
    setShowIntegrationTypeSelector(false);
    setShowCreateIntegrationModal(true);
  };

  const handleSubmitIntegration = () => {
    const template = integrationTemplates[selectedIntegrationType];
    if (!template) return;

    // Validate required fields
    const missingFields = template.fields
      .filter((field: any) => field.required && !integrationFormData[field.key])
      .map((field: any) => field.label);

    if (!integrationFormData.integrationName) {
      missingFields.unshift('Integration Name');
    }

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // Prepare credentials data
    const credentials = Object.entries(integrationFormData)
      .filter(([key]) => key !== 'integrationName')
      .reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

    createIntegrationMutation.mutate({
      name: integrationFormData.integrationName.trim(),
      type: selectedIntegrationType,
      description: template.description,
      credentials,
      status: 'disconnected'
    });
  };

  const renderIntegrationField = (field: any) => {
    const value = integrationFormData[field.key] || '';
    
    switch (field.type) {
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(newValue) => setIntegrationFormData(prev => ({ ...prev, [field.key]: newValue }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'password':
        return (
          <Input
            type="password"
            value={value}
            onChange={(e) => setIntegrationFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setIntegrationFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            rows={4}
          />
        );
      default:
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => setIntegrationFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
          />
        );
    }
  };

  // Filter integrations based on search and category
  const getFilteredIntegrations = () => {
    const allIntegrations = Object.entries(integrationTemplates);
    
    return allIntegrations.filter(([key, template]) => {
      const matchesSearch = integrationSearchTerm === '' || 
        template.name.toLowerCase().includes(integrationSearchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(integrationSearchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  // Get unique categories
  const getCategories = () => {
    const categories = new Set(Object.values(integrationTemplates).map((template: any) => template.category));
    return ['All', ...Array.from(categories).sort()];
  };

  // Endpoint monitoring mutations
  const createEndpointMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/endpoints', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      toast({
        title: "Endpoint Added",
        description: "Endpoint monitoring has been configured"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/endpoints'] });
      setShowAddEndpointModal(false);
      setEndpointFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Endpoint",
        description: error.message || "Failed to configure endpoint monitoring",
        variant: "destructive"
      });
    }
  });

  const autoDiscoverMutation = useMutation({
    mutationFn: () => apiRequest('/api/endpoints/auto-discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: (data: any) => {
      toast({
        title: "Auto-Discovery Complete",
        description: `Discovered and added ${data.discovered} endpoints for monitoring. ${data.errors > 0 ? `${data.errors} errors occurred.` : ''}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/endpoints'] });
    },
    onError: (error: any) => {
      toast({
        title: "Auto-Discovery Failed",
        description: error.message || "Failed to auto-discover endpoints",
        variant: "destructive"
      });
    }
  });

  const refreshAllMutation = useMutation({
    mutationFn: () => apiRequest('/api/endpoints/refresh-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: (data: any) => {
      toast({
        title: "Status Refresh Complete",
        description: `Tested ${data.summary?.total || 0} endpoints. ${data.summary?.healthy || 0} healthy, ${data.summary?.unhealthy || 0} down. Avg response: ${data.summary?.averageResponseTime || 0}ms`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/endpoints'] });
    },
    onError: (error: any) => {
      toast({
        title: "Status Refresh Failed",
        description: error.message || "Failed to refresh endpoint status",
        variant: "destructive"
      });
    }
  });

  const handleAutoDiscoverEndpoints = () => {
    autoDiscoverMutation.mutate();
  };

  const handleRefreshAllEndpoints = () => {
    refreshAllMutation.mutate();
  };

  const toggleEndpointMutation = useMutation({
    mutationFn: ({ endpointId, isActive }: { endpointId: string, isActive: boolean }) => 
      apiRequest(`/api/endpoints/${endpointId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/endpoints'] });
      toast({
        title: "Endpoint Updated",
        description: "Monitoring status has been updated"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update endpoint",
        variant: "destructive"
      });
    }
  });

  const handleToggleEndpoint = (endpointId: string, isActive: boolean) => {
    toggleEndpointMutation.mutate({ endpointId, isActive });
  };

  const updateEndpointMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/endpoints/${data.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/endpoints'] });
      setShowEditEndpointModal(false);
      setEditingEndpoint(null);
      toast({
        title: "Endpoint Updated",
        description: "Endpoint configuration has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update endpoint",
        variant: "destructive"
      });
    }
  });

  const handleUpdateEndpoint = () => {
    const requiredFields = ['name', 'url'];
    const missingFields = requiredFields.filter(field => !endpointFormData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    updateEndpointMutation.mutate({
      ...endpointFormData,
      id: editingEndpoint.id
    });
  };

  const testEndpointMutation = useMutation({
    mutationFn: (endpointId: string) => apiRequest(`/api/endpoints/${endpointId}/test`, {
      method: 'POST'
    }),
    onSuccess: (data: any, endpointId: string) => {
      queryClient.invalidateQueries({ queryKey: ['/api/endpoints'] });
      setTestingEndpoints(prev => prev.filter(id => id !== endpointId));
      
      // Store detailed test results for expandable view
      setEndpointTestResults(prev => new Map(prev.set(endpointId, data)));
      
      toast({
        title: "Endpoint Test Complete",
        description: `Status: ${data.status} - Response time: ${data.responseTime}ms`
      });
    },
    onError: (error: any, endpointId: string) => {
      setTestingEndpoints(prev => prev.filter(id => id !== endpointId));
      toast({
        title: "Endpoint Test Failed",
        description: error.message || "Failed to test endpoint",
        variant: "destructive"
      });
    }
  });

  const handleTestEndpoint = async (endpointId: string) => {
    setTestingEndpoints(prev => [...prev, endpointId]);
    testEndpointMutation.mutate(endpointId);
  };

  const toggleEndpointExpansion = (endpointId: string) => {
    setExpandedEndpoints(prev => 
      prev.includes(endpointId) 
        ? prev.filter(id => id !== endpointId)
        : [...prev, endpointId]
    );
  };

  const handleAddEndpoint = () => {
    setEndpointFormData({
      name: '',
      url: '',
      method: 'GET',
      expectedStatus: 200,
      checkInterval: 300,
      timeout: 30,
      alertEmail: true,
      alertSlack: false,
      isActive: true
    });
    setShowAddEndpointModal(true);
  };

  const handleSubmitEndpoint = () => {
    const requiredFields = ['name', 'url'];
    const missingFields = requiredFields.filter(field => !endpointFormData[field]);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    createEndpointMutation.mutate(endpointFormData);
  };

  const handleTestConnection = async (integrationId: string) => {
    setTestingIntegrations(prev => [...prev, integrationId]);
    try {
      const response = await apiRequest(`/api/integrations/${integrationId}/test`, {
        method: 'POST'
      });
      toast({
        title: "Connection Test Complete",
        description: response.message || "Connection test completed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
    } catch (error: any) {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive"
      });
    } finally {
      setTestingIntegrations(prev => prev.filter(id => id !== integrationId));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage team members, roles, and system settings
          </p>
        </div>
        
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add New Team Member
              </DialogTitle>
              <DialogDescription>
                Create a new team member account with auto-generated password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={invitationData.firstName}
                    onChange={(e) => setInvitationData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={invitationData.lastName}
                    onChange={(e) => setInvitationData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitationData.email}
                  onChange={(e) => setInvitationData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@company.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={invitationData.role} onValueChange={(value) => setInvitationData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTeamMemberMutation.isPending}>
                  {createTeamMemberMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Team Member
            </DialogTitle>
            <DialogDescription>
              Update team member information and role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editUserData?.firstName || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editUserData?.lastName || ''}
                  onChange={(e) => setEditUserData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editEmail">Email Address</Label>
              <Input
                id="editEmail"
                type="email"
                value={editUserData?.email || ''}
                onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select 
                value={editUserData?.role || ''} 
                onValueChange={(value) => setEditUserData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTeamMemberMutation.isPending}>
                {updateTeamMemberMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update User
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Generated Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Generated
            </DialogTitle>
            <DialogDescription>
              {generatedUserData && (
                <>User account for {generatedUserData.firstName} {generatedUserData.lastName} has been created. Please copy and share this password securely.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="font-mono text-lg font-semibold text-gray-800">
                  {createdPassword}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createdPassword && copyToClipboard(createdPassword)}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Save this password now. It won't be shown again. The user will be required to change it on first login.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowPasswordModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Endpoint Monitoring
          </TabsTrigger>
          <TabsTrigger value="migrations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Migrations
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getRoleIcon(member.role)}
                        <div>
                          <div className="font-semibold">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(member.status)}
                        <Badge variant="outline">{member.role}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangePassword(member.id)}>
                              <Key className="h-4 w-4 mr-2" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteTeamMemberMutation.mutate(member.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Integration Management</h2>
              <p className="text-sm text-muted-foreground">Manage external service connections and data source integrations</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/integrations'] })}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Refresh All
              </Button>
              <Button onClick={handleCreateIntegration} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          </div>

          {/* Integration Statistics Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Database className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm w-full">
                  <p className="font-medium text-blue-800">Integration Overview</p>
                  <p className="text-blue-700 mb-3">Connected services and data sources:</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">
                        {integrations?.filter(i => i.status === 'connected').length || 0}
                      </div>
                      <div className="text-xs text-blue-600">Connected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">
                        {integrations?.filter(i => i.status === 'disconnected').length || 0}
                      </div>
                      <div className="text-xs text-blue-600">Disconnected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">
                        {integrations?.filter(i => i.type === 'postgresql').length || 0}
                      </div>
                      <div className="text-xs text-blue-600">Databases</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-900">
                        {integrations?.filter(i => ['snowflake', 'amplitude', 'braze', 's3'].includes(i.type)).length || 0}
                      </div>
                      <div className="text-xs text-blue-600">Services</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations?.map((integration: any) => (
              <Card key={integration.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        integration.type === 'postgresql' ? 'bg-green-100' :
                        integration.type === 'snowflake' ? 'bg-blue-100' :
                        integration.type === 's3' ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        <Database className={`h-5 w-5 ${
                          integration.type === 'postgresql' ? 'text-green-600' :
                          integration.type === 'snowflake' ? 'text-blue-600' :
                          integration.type === 's3' ? 'text-purple-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg font-semibold break-words">{integration.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{integration.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {integration.status === 'connected' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge className={
                        integration.status === 'connected' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }>
                        {integration.status}
                      </Badge>
                    </div>

                    {integration.metadata && (
                      <div className="space-y-2">
                        {integration.type === 'postgresql' && (
                          <div className="grid grid-cols-2 gap-2 p-2 bg-green-50 rounded border border-green-100">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-green-900">
                                {integration.metadata.tables || 0}
                              </div>
                              <div className="text-xs text-green-600">Tables</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold text-green-900">
                                {integration.metadata.size || 'N/A'}
                              </div>
                              <div className="text-xs text-green-600">Size</div>
                            </div>
                          </div>
                        )}
                        {integration.type === 'snowflake' && (
                          <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50 rounded border border-blue-100">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-blue-900">
                                {integration.metadata.tables || 0}
                              </div>
                              <div className="text-xs text-blue-600">Tables</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold text-blue-900">
                                {integration.metadata.schemas || 0}
                              </div>
                              <div className="text-xs text-blue-600">Schemas</div>
                            </div>
                          </div>
                        )}
                        {integration.type === 's3' && (
                          <div className="grid grid-cols-2 gap-2 p-2 bg-purple-50 rounded border border-purple-100">
                            <div className="text-center">
                              <div className="text-sm font-semibold text-purple-900">
                                {integration.metadata.objectCount || 0}
                              </div>
                              <div className="text-xs text-purple-600">Objects</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold text-purple-900">
                                {integration.metadata.region || 'N/A'}
                              </div>
                              <div className="text-xs text-purple-600">Region</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestIntegrationConnection(integration.id)}
                        disabled={testingIntegrations.includes(integration.id)}
                        className="flex-1 text-xs font-medium hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                      >
                        {testingIntegrations.includes(integration.id) ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {testingIntegrations.includes(integration.id) ? 'Testing...' : 'Test'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditIntegration(integration)}
                        className="flex-1 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {integrations?.length === 0 && (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations configured</h3>
              <p className="text-gray-500 mb-4">Add your first integration to get started with data connections.</p>
              <Button onClick={() => setShowCreateIntegrationModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Endpoint Monitoring</h2>
              <p className="text-sm text-muted-foreground">Monitor API endpoints, track uptime, and receive alerts when services go down</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleRefreshAllEndpoints}
                disabled={refreshAllMutation.isPending}
              >
                {refreshAllMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
              <Button 
                onClick={handleAutoDiscoverEndpoints}
                disabled={autoDiscoverMutation.isPending}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {autoDiscoverMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Auto-Discover Endpoints
                  </>
                )}
              </Button>
              <Button onClick={handleAddEndpoint} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </div>
          </div>

          {/* Monitoring Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Endpoints</p>
                    <p className="text-2xl font-bold">{monitoredEndpoints.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Healthy</p>
                    <p className="text-2xl font-bold text-green-600">
                      {monitoredEndpoints.filter((e: any) => e.lastStatus >= 200 && e.lastStatus < 300).length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Down</p>
                    <p className="text-2xl font-bold text-red-600">
                      {monitoredEndpoints.filter((e: any) => e.lastStatus >= 400 || e.lastStatus === 0).length}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold">
                      {monitoredEndpoints.length > 0 
                        ? Math.round(monitoredEndpoints.reduce((acc: number, e: any) => acc + (e.lastResponseTime || 0), 0) / monitoredEndpoints.length)
                        : 0}ms
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Endpoints List */}
          {endpointsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading endpoints...</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {monitoredEndpoints.map((endpoint: any) => {
                const isExpanded = expandedEndpoints.includes(endpoint.id);
                const setIsExpanded = (expanded: boolean) => {
                  if (expanded) {
                    setExpandedEndpoints(prev => [...prev, endpoint.id]);
                  } else {
                    setExpandedEndpoints(prev => prev.filter(id => id !== endpoint.id));
                  }
                };
                const lastTestResult: EndpointTestResult | undefined = endpointTestResults.get(endpoint.id);
                const setLastTestResult = (result: EndpointTestResult | null) => {
                  setEndpointTestResults(prev => {
                    const newMap = new Map(prev);
                    if (result) {
                      newMap.set(endpoint.id, result);
                    } else {
                      newMap.delete(endpoint.id);
                    }
                    return newMap;
                  });
                };
                
                return (
                  <Card key={endpoint.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {endpoint.lastStatus >= 200 && endpoint.lastStatus < 300 ? (
                              <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              </div>
                            ) : endpoint.lastStatus >= 400 || endpoint.lastStatus === 0 ? (
                              <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="h-5 w-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-yellow-100 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                              </div>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{endpoint.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{endpoint.url}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {endpoint.method}
                              </span>
                              {endpoint.lastStatus && (
                                <Badge 
                                  className={`${
                                    endpoint.lastStatus >= 200 && endpoint.lastStatus < 300 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : endpoint.lastStatus >= 400 
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }`}
                                >
                                  {endpoint.lastStatus}
                                </Badge>
                              )}
                              {endpoint.lastResponseTime && (
                                <span className="text-xs text-gray-500">
                                  {endpoint.lastResponseTime}ms
                                </span>
                              )}
                              {endpoint.lastCheckedAt && (
                                <span className="text-xs text-gray-500">
                                  Last checked: {new Date(endpoint.lastCheckedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Collapse
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Details
                              </>
                            )}
                          </Button>
                          <Switch 
                            checked={endpoint.isActive}
                            onCheckedChange={(checked) => handleToggleEndpoint(endpoint.id, checked)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!testingEndpoints.includes(endpoint.id)) {
                                setTestingEndpoints(prev => [...prev, endpoint.id]);
                                try {
                                  const response = await fetch(`/api/endpoints/${endpoint.id}/test`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' }
                                  });
                                  const result = await response.json();
                                  setLastTestResult(result);
                                  if (!isExpanded) setIsExpanded(true);
                                } catch (error) {
                                  console.error('Test failed:', error);
                                } finally {
                                  setTestingEndpoints(prev => prev.filter(id => id !== endpoint.id));
                                }
                              }
                            }}
                            disabled={testingEndpoints.includes(endpoint.id)}
                          >
                            {testingEndpoints.includes(endpoint.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Test Now
                              </>
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingEndpoint(endpoint);
                                setEndpointFormData({
                                  name: endpoint.name,
                                  url: endpoint.url,
                                  method: endpoint.method,
                                  expectedStatus: endpoint.expectedStatus || 200,
                                  checkInterval: endpoint.checkInterval || 300,
                                  timeout: endpoint.timeout || 30,
                                  alertEmail: endpoint.alertEmail || false,
                                  alertSlack: endpoint.alertSlack || false,
                                  isActive: endpoint.isActive
                                });
                                setShowEditEndpointModal(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Expandable Details Section */}
                      {isExpanded && (
                        <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Request Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <Send className="h-4 w-4 mr-2 text-blue-600" />
                                Request Details
                              </h4>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Method</span>
                                  <p className="text-sm font-mono bg-white px-2 py-1 rounded border mt-1">{endpoint.method}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">URL</span>
                                  <p className="text-sm font-mono bg-white px-2 py-1 rounded border mt-1 break-all">{endpoint.url}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">Headers</span>
                                  <div className="bg-white rounded border mt-1 p-2">
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify({
                                      'User-Agent': '4Sale CDP Monitor/1.0',
                                      'Accept': 'application/json, text/plain, */*',
                                      'Cache-Control': 'no-cache'
                                    }, null, 2)}</pre>
                                  </div>
                                </div>
                                {lastTestResult?.requestDetails && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500 uppercase">Last Request Timestamp</span>
                                    <p className="text-sm bg-white px-2 py-1 rounded border mt-1">{lastTestResult.requestDetails.timestamp}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Response Details */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <Database className="h-4 w-4 mr-2 text-green-600" />
                                Response Details
                              </h4>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                {lastTestResult?.responseDetails ? (
                                  <>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 uppercase">Status</span>
                                      <p className={`text-sm font-mono px-2 py-1 rounded border mt-1 ${
                                        lastTestResult.responseDetails.status >= 200 && lastTestResult.responseDetails.status < 300 
                                          ? 'bg-green-50 text-green-800 border-green-200' 
                                          : 'bg-red-50 text-red-800 border-red-200'
                                      }`}>
                                        {lastTestResult.responseDetails.status} {lastTestResult.responseDetails.statusText}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 uppercase">Response Time</span>
                                      <p className="text-sm bg-white px-2 py-1 rounded border mt-1">{lastTestResult.responseTime}ms</p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 uppercase">Headers</span>
                                      <div className="bg-white rounded border mt-1 p-2 max-h-32 overflow-y-auto">
                                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {JSON.stringify(lastTestResult.responseDetails.headers || {}, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 uppercase">Response Body</span>
                                      <div className="bg-white rounded border mt-1 p-2 max-h-40 overflow-y-auto">
                                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {typeof lastTestResult.responseDetails.body === 'object' 
                                            ? JSON.stringify(lastTestResult.responseDetails.body, null, 2)
                                            : lastTestResult.responseDetails.body
                                          }
                                        </pre>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-500 uppercase">Timestamp</span>
                                      <p className="text-sm bg-white px-2 py-1 rounded border mt-1">{lastTestResult.responseDetails.timestamp}</p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-8">
                                    <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Click "Test Now" to see response details</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Error Information */}
                          {lastTestResult?.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Error Details
                              </h4>
                              <p className="text-sm text-red-700">{lastTestResult.error}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Alert Configuration Display */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Check every {endpoint.checkInterval}s</span>
                          <span>Timeout: {endpoint.timeout}s</span>
                          {endpoint.alertEmail && (
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              Email alerts
                            </span>
                          )}
                          {endpoint.alertSlack && (
                            <span className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Slack alerts
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {monitoredEndpoints.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints configured</h3>
                  <p className="text-gray-500 mb-4">Add your first endpoint to start monitoring your API health.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={handleAutoDiscoverEndpoints}
                      disabled={autoDiscoverMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {autoDiscoverMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Discovering...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Refresh and Monitor All Endpoints
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleAddEndpoint}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Endpoint Manually
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="migrations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Environment Management</h2>
              <p className="text-sm text-muted-foreground">Manage multiple database environments and migrate data between them</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowIntegrationTypesModal(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Tools
              </Button>
              <Button onClick={() => setShowMigrationModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Target className="h-4 w-4 mr-2" />
                Start Migration
              </Button>
            </div>
          </div>

          {/* Active Integration Types Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Database className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm w-full">
                  <p className="font-medium text-blue-800">Active Integration Types</p>
                  <p className="text-blue-700 mb-3">Available integrations from your configured services:</p>
                  
                  {/* Show all available integrations */}
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-600 mb-2">All Configured Integrations:</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {integrations.map((integration: any) => (
                        <div key={integration.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center">
                            <Database className="h-3 w-3 text-gray-500 mr-2" />
                            <div>
                              <span className="text-xs font-medium">{integration.name}</span>
                              <p className="text-xs text-gray-400">{integration.type}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            integration.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {integration.status === 'connected' ? 'connected' : 'disconnected'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Show selected tools for migration */}
                  <div>
                    <h5 className="text-xs font-medium text-gray-600 mb-2">Selected Tools for Migration:</h5>
                    <div className="flex flex-wrap gap-2">
                      {activeIntegrationTypes.map(type => {
                        const { icon: Icon, color } = getIntegrationDisplay(type);
                        return (
                          <span key={type} className={`px-2 py-1 bg-${color}-100 text-${color}-800 rounded text-xs font-medium flex items-center`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowIntegrationTypesModal(true)}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
          </div>

          {/* Available Integration Types Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Integration Types Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeIntegrationTypes.map(type => {
                  const typeIntegrations = integrations.filter((i: any) => i.type === type);
                  
                  // Show best status among all integrations of this type
                  let dbStatus = 'disconnected';
                  let statusText = 'No integrations';
                  
                  if (typeIntegrations.length > 0) {
                    const connectedCount = typeIntegrations.filter((i: any) => i.status === 'connected').length;
                    if (connectedCount > 0) {
                      dbStatus = 'connected';
                      statusText = `${connectedCount}/${typeIntegrations.length} connected`;
                    } else {
                      dbStatus = 'disconnected';
                      statusText = `${typeIntegrations.length} disconnected`;
                    }
                  }
                  
                  const { icon: Icon, color } = getIntegrationDisplay(type);
                  
                  return (
                    <div key={type} className={`flex items-center justify-between p-3 bg-${color}-50 rounded-lg border`}>
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 text-${color}-600 mr-2`} />
                        <div>
                          <span className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                          <p className="text-xs text-gray-600">{statusText}</p>
                        </div>
                      </div>
                      {getStatusIcon(dbStatus)}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Environment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {environments.map((env) => (
              <Card key={env.id} className={`border-2 ${env.status === 'active' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {env.status === 'active' && <CheckCircle className="h-4 w-4 text-green-600 mr-2" />}
                      {env.name}
                    </CardTitle>
                    <Badge variant={env.status === 'active' ? 'default' : 'secondary'}>
                      {env.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Database Status */}
                  <div className="space-y-2">
                    {activeIntegrationTypes.map(type => {
                      const selectedIntegrationId = env.databases?.[type];
                      const typeIntegrations = integrations.filter((i: any) => i.type === type);
                      
                      // Only show connected if a specific integration is assigned to this environment
                      let dbStatus = 'disconnected';
                      if (selectedIntegrationId) {
                        const selectedIntegration = integrations.find((i: any) => i.id === selectedIntegrationId);
                        dbStatus = selectedIntegration?.status || 'disconnected';
                      }
                      // If no integration is assigned to this environment, always show disconnected
                      
                      const { icon: Icon, color } = getIntegrationDisplay(type);
                      
                      return (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Icon className={`h-4 w-4 mr-2 text-${color}-600`} />
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                          {getStatusIcon(dbStatus)}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {env.status !== 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSwitchEnvironment(env.id)}
                        className="flex-1"
                      >
                        Switch to {env.name}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleConfigureEnvironment(env.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Migration History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Migrations ({(migrationHistory as any[])?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMigrations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (migrationHistory as any[])?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No migrations found. Start your first migration to see history here.
                </div>
              ) : (
                <div className="space-y-3">
                  {(migrationHistory as any[]).map((migration: any) => (
                    <div key={migration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        {migration.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600 mr-3" />}
                        {migration.status === 'failed' && <XCircle className="h-4 w-4 text-red-600 mr-3" />}
                        {migration.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-600 mr-3" />}
                        {migration.status === 'pending' && <AlertTriangle className="h-4 w-4 text-yellow-600 mr-3" />}
                        <div>
                          <p className="font-medium">{migration.sourceIntegrationName || 'Unknown Source'} → {migration.targetIntegrationName || 'Unknown Target'}</p>
                          <p className="text-sm text-muted-foreground">
                            {migration.completedItems ? `Migrated ${migration.completedItems} of ${migration.totalItems || 0} records` : 'Migration details'} • 
                            {migration.createdAt ? new Date(migration.createdAt).toLocaleString() : 'Unknown time'}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        migration.status === 'completed' ? 'bg-green-100 text-green-800' :
                        migration.status === 'failed' ? 'bg-red-100 text-red-800' :
                        migration.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {migration.status === 'completed' ? 'Completed' :
                         migration.status === 'failed' ? 'Failed' :
                         migration.status === 'in_progress' ? 'In Progress' :
                         'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Send notifications for system events</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-backup</h4>
                  <p className="text-sm text-muted-foreground">Automatically backup system data</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                </div>
                <Select defaultValue="8">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Migration Modal - Checkpoint System Restored */}
      <Dialog open={showMigrationModal} onOpenChange={setShowMigrationModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Integration Migration</span>
            </DialogTitle>
            <DialogDescription>
              Migrate data and schema between integrations of the same type with real-time console logging
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Integration Type Selection */}
            <div>
              <Label>Integration Type</Label>
              <Select value={selectedMigrationType} onValueChange={(value) => {
                setSelectedMigrationType(value);
                setSelectedSourceEnv('');
                setSelectedTargetEnv('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select integration type to migrate" />
                </SelectTrigger>
                <SelectContent>
                  {getMigratableIntegrationTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        <Badge variant="outline" className="text-xs">
                          {getIntegrationsByType(type).length} available
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Only types with 2+ integrations are available for migration
              </p>
            </div>

            {/* Source and Destination Selection - Only show when type is selected */}
            {selectedMigrationType && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Integration</Label>
                  <Select value={selectedSourceEnv} onValueChange={setSelectedSourceEnv}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select source ${selectedMigrationType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getIntegrationsByType(selectedMigrationType)
                        .map((integration: any) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            <div className="flex items-center space-x-2">
                              <Database className="h-4 w-4" />
                              <span>{integration.name}</span>
                              <Badge 
                                variant={integration.status === 'connected' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {integration.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Choose the integration to migrate FROM</p>
                </div>
                <div>
                  <Label>Destination Integration</Label>
                  <Select value={selectedTargetEnv} onValueChange={setSelectedTargetEnv}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select destination ${selectedMigrationType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getIntegrationsByType(selectedMigrationType)
                        .filter((integration: any) => integration.id !== selectedSourceEnv)
                        .map((integration: any) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            <div className="flex items-center space-x-2">
                              <Database className="h-4 w-4" />
                              <span>{integration.name}</span>
                              <Badge 
                                variant={integration.status === 'connected' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {integration.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Choose the integration to migrate TO</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Migration Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="schema" defaultChecked />
                  <Label htmlFor="schema">Create Schema</Label>
                  <p className="text-xs text-muted-foreground ml-6">Create tables, indexes, and constraints in destination database</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="data" defaultChecked />
                  <Label htmlFor="data">Migrate Data</Label>
                  <p className="text-xs text-muted-foreground ml-6">Copy all table data from source to destination</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sequences" defaultChecked />
                  <Label htmlFor="sequences">Reset Sequences</Label>
                  <p className="text-xs text-muted-foreground ml-6">Update auto-increment sequences to match data</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Migration Warning</p>
                  <p className="text-yellow-700">This will overwrite data in the target environment. Make sure you have backups.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowMigrationModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartMigration} disabled={isMigrating || !selectedMigrationType || !selectedSourceEnv || !selectedTargetEnv}>
                {isMigrating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  'Start Migration'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Types Configuration Modal */}
      <Dialog open={showIntegrationTypesModal} onOpenChange={setShowIntegrationTypesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configure Integration Types</span>
            </DialogTitle>
            <DialogDescription>
              Select which integration types to use for multi-stage environment management (Dev, Staging, Production)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {['postgresql', 'snowflake', 'mysql', 'mongodb', 's3', 'braze', 'amplitude'].map(type => {
                const { icon: Icon, color } = getIntegrationDisplay(type);
                const isActive = activeIntegrationTypes.includes(type);
                const hasIntegrations = integrations.some((i: any) => i.type === type);
                return (
                  <div key={type} className={`flex items-center justify-between p-3 border rounded-lg ${!hasIntegrations ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={!hasIntegrations}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveIntegrationTypes(prev => [...prev, type]);
                          } else {
                            setActiveIntegrationTypes(prev => prev.filter(t => t !== type));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <Icon className={`h-4 w-4 text-${color}-600`} />
                      <span className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {integrations.filter((i: any) => i.type === type).length} configured
                      </span>
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Selected' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Selected integration types will support multi-stage environments (Development, Staging, Production). 
                You can assign different integration instances to each environment stage.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowIntegrationTypesModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowIntegrationTypesModal(false);
                toast({
                  title: "Integration types updated",
                  description: `Selected ${activeIntegrationTypes.length} integration types for environment management`
                });
              }}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Environment Configuration Modal */}
      <Dialog open={showEnvConfigModal} onOpenChange={setShowEnvConfigModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Configure {environments.find(e => e.id === selectedConfigEnv)?.name} Environment</span>
            </DialogTitle>
            <DialogDescription>
              Select integration instances for each integration type in this environment stage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {activeIntegrationTypes.map(type => {
              const { icon: Icon, color } = getIntegrationDisplay(type);
              const typeIntegrations = integrations.filter((i: any) => i.type === type);
              const currentSelection = environmentDatabases[selectedConfigEnv]?.[type] || '';
              
              return (
                <div key={type} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-2 text-${color}-600`} />
                      <h4 className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)} Integration</h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {typeIntegrations.length} available
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-integration`}>Select Integration Instance</Label>
                    <select
                      id={`${type}-integration`}
                      value={currentSelection}
                      onChange={async (e) => {
                        const newValue = e.target.value;
                        
                        // Update local state
                        setEnvironmentDatabases(prev => ({
                          ...prev,
                          [selectedConfigEnv]: {
                            ...prev[selectedConfigEnv],
                            [type]: newValue
                          }
                        }));
                        
                        // Save to database
                        try {
                          await fetch('/api/environment-configurations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              environmentId: selectedConfigEnv,
                              integrationType: type,
                              integrationId: newValue
                            })
                          });
                          
                          toast({
                            title: "Configuration saved",
                            description: `${type} integration assigned to ${environments.find(e => e.id === selectedConfigEnv)?.name}`
                          });
                        } catch (error) {
                          console.error('Failed to save environment configuration:', error);
                          toast({
                            title: "Save failed",
                            description: "Could not save environment configuration",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select {type} integration --</option>
                      {typeIntegrations.map((integration: any) => (
                        <option key={integration.id} value={integration.id}>
                          {integration.name} ({integration.status === 'connected' ? '✓ Connected' : '⚠ Disconnected'})
                        </option>
                      ))}
                    </select>
                    
                    {currentSelection && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {(() => {
                          const selectedIntegration = integrations.find((i: any) => i.id === currentSelection);
                          return selectedIntegration ? (
                            <div className="text-sm">
                              <p className="font-medium">{selectedIntegration.name}</p>
                              <p className="text-gray-600">{selectedIntegration.type}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                selectedIntegration.status === 'connected' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedIntegration.status}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Integration not found</p>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> Each environment stage can use different integration instances. 
                For example, Development can use a local PostgreSQL while Production uses a cloud instance.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEnvConfigModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Environment configured",
                  description: `${environments.find(e => e.id === selectedConfigEnv)?.name} environment has been updated`
                });
                setShowEnvConfigModal(false);
              }}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Type Selector Modal */}
      <Dialog open={showIntegrationTypeSelector} onOpenChange={setShowIntegrationTypeSelector}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Choose Integration Type
            </DialogTitle>
            <DialogDescription>
              Select the type of integration you want to add from our comprehensive catalog
            </DialogDescription>
          </DialogHeader>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 py-4 border-b">
            <div className="flex-1">
              <Input
                placeholder="Search integrations..."
                value={integrationSearchTerm}
                onChange={(e) => setIntegrationSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {getCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category} {category !== 'All' && `(${Object.values(integrationTemplates).filter((t: any) => t.category === category).length})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Database">Database</TabsTrigger>
              <TabsTrigger value="Analytics">Analytics</TabsTrigger>
              <TabsTrigger value="Marketing">Marketing</TabsTrigger>
              <TabsTrigger value="Communication">Communication</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedCategory} className="mt-4">
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredIntegrations().map(([type, template]) => (
                    <Card 
                      key={type} 
                      className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 hover:border-blue-300"
                      onClick={() => handleSelectIntegrationType(type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-${template.color}-100 flex-shrink-0`}>
                            <Database className={`h-5 w-5 text-${template.color}-600`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm mb-1 truncate">{template.name}</h3>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{template.description}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-xs bg-${template.color}-50 text-${template.color}-700 border-${template.color}-200`}
                            >
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {getFilteredIntegrations().length === 0 && (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No integrations found</h3>
                    <p className="text-gray-500">Try adjusting your search or category filter</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {getFilteredIntegrations().length} of {Object.keys(integrationTemplates).length} integrations
            </div>
            <Button variant="outline" onClick={() => setShowIntegrationTypeSelector(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Integration Modal */}
      <Dialog open={showCreateIntegrationModal} onOpenChange={setShowCreateIntegrationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create {integrationTemplates[selectedIntegrationType]?.name}
            </DialogTitle>
            <DialogDescription>
              Configure your {integrationTemplates[selectedIntegrationType]?.name} integration
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitIntegration(); }} className="space-y-4">
            <div>
              <Label htmlFor="integrationName">Integration Name</Label>
              <Input
                id="integrationName"
                value={integrationFormData.integrationName || ''}
                onChange={(e) => setIntegrationFormData(prev => ({ ...prev, integrationName: e.target.value }))}
                placeholder="Enter a unique name for this integration"
                required
              />
            </div>

            {integrationTemplates[selectedIntegrationType]?.fields.map((field: any) => (
              <div key={field.key}>
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderIntegrationField(field)}
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
              </div>
            ))}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateIntegrationModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createIntegrationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createIntegrationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Integration
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Integration Modal */}
      <Dialog open={showEditIntegrationModal} onOpenChange={setShowEditIntegrationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit Integration: {editingIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Modify integration settings and test connection
            </DialogDescription>
          </DialogHeader>
          {editingIntegration && (
            <form onSubmit={(e) => { e.preventDefault(); /* TODO: Implement edit functionality */ }} className="space-y-4">
              <div>
                <Label htmlFor="editIntegrationName">Integration Name</Label>
                <Input
                  id="editIntegrationName"
                  defaultValue={editingIntegration.name}
                  placeholder="Enter integration name"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Integration name cannot be changed</p>
              </div>

              <div>
                <Label>Integration Type</Label>
                <Input
                  value={integrationTemplates[editingIntegration.type]?.name || editingIntegration.type}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Integration type cannot be changed</p>
              </div>

              <div>
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  {editingIntegration.status === 'connected' ? (
                    <Badge className="status-connected">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditIntegrationModal(false)}
                >
                  Close
                </Button>
                <Button 
                  type="button"
                  onClick={() => handleTestConnection(editingIntegration.id)}
                  disabled={testingIntegrations.includes(editingIntegration.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testingIntegrations.includes(editingIntegration.id) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Endpoint Modal */}
      <Dialog open={showAddEndpointModal} onOpenChange={setShowAddEndpointModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Endpoint Monitor</DialogTitle>
            <DialogDescription>
              Configure a new endpoint to monitor for uptime and performance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Basic Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monitor Name *
                  </label>
                  <Input
                    value={endpointFormData.name || ''}
                    onChange={(e) => setEndpointFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., User API, Payment Gateway"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTTP Method
                  </label>
                  <Select 
                    value={endpointFormData.method || 'GET'} 
                    onValueChange={(value) => setEndpointFormData(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint URL *
                </label>
                <Input
                  value={endpointFormData.url || ''}
                  onChange={(e) => setEndpointFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/health"
                />
              </div>
            </div>

            {/* Monitoring Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Monitoring Settings</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Status Code
                  </label>
                  <Input
                    type="number"
                    value={endpointFormData.expectedStatus || 200}
                    onChange={(e) => setEndpointFormData(prev => ({ ...prev, expectedStatus: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Interval (seconds)
                  </label>
                  <Select 
                    value={String(endpointFormData.checkInterval || 300)} 
                    onValueChange={(value) => setEndpointFormData(prev => ({ ...prev, checkInterval: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (seconds)
                  </label>
                  <Input
                    type="number"
                    value={endpointFormData.timeout || 30}
                    onChange={(e) => setEndpointFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Alert Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Alert Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={endpointFormData.alertEmail || false}
                    onCheckedChange={(checked) => setEndpointFormData(prev => ({ ...prev, alertEmail: checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Email Alerts</div>
                    <div className="text-xs text-gray-500">Send email notifications when endpoint goes down</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={endpointFormData.alertSlack || false}
                    onCheckedChange={(checked) => setEndpointFormData(prev => ({ ...prev, alertSlack: checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Slack Alerts</div>
                    <div className="text-xs text-gray-500">Send Slack messages when endpoint goes down</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={endpointFormData.isActive !== false}
                    onCheckedChange={(checked) => setEndpointFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Enable Monitoring</div>
                    <div className="text-xs text-gray-500">Start monitoring this endpoint immediately</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEndpointModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEndpoint}
              disabled={createEndpointMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createEndpointMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Endpoint
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Endpoint Modal */}
      <Dialog open={showEditEndpointModal} onOpenChange={setShowEditEndpointModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Endpoint Monitor</DialogTitle>
            <DialogDescription>
              Update configuration for endpoint monitoring
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Basic Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monitor Name *
                  </label>
                  <Input
                    value={endpointFormData.name || ''}
                    onChange={(e) => setEndpointFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., User API, Payment Gateway"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTTP Method
                  </label>
                  <Select 
                    value={endpointFormData.method || 'GET'}
                    onValueChange={(value) => setEndpointFormData(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint URL *
                </label>
                <Input
                  value={endpointFormData.url || ''}
                  onChange={(e) => setEndpointFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/health"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Status Code
                  </label>
                  <Input
                    type="number"
                    value={endpointFormData.expectedStatus || 200}
                    onChange={(e) => setEndpointFormData(prev => ({ ...prev, expectedStatus: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Interval
                  </label>
                  <Select 
                    value={endpointFormData.checkInterval?.toString() || '300'}
                    onValueChange={(value) => setEndpointFormData(prev => ({ ...prev, checkInterval: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (seconds)
                  </label>
                  <Input
                    type="number"
                    value={endpointFormData.timeout || 30}
                    onChange={(e) => setEndpointFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Alert Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Alert Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={endpointFormData.alertEmail || false}
                    onCheckedChange={(checked) => setEndpointFormData(prev => ({ ...prev, alertEmail: checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Email Alerts</div>
                    <div className="text-xs text-gray-500">Send email notifications when endpoint goes down</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={endpointFormData.alertSlack || false}
                    onCheckedChange={(checked) => setEndpointFormData(prev => ({ ...prev, alertSlack: checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Slack Alerts</div>
                    <div className="text-xs text-gray-500">Send Slack messages when endpoint goes down</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={endpointFormData.isActive !== false}
                    onCheckedChange={(checked) => setEndpointFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <div>
                    <div className="text-sm font-medium">Enable Monitoring</div>
                    <div className="text-xs text-gray-500">Keep monitoring this endpoint</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditEndpointModal(false);
              setEditingEndpoint(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateEndpoint}
              disabled={updateEndpointMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateEndpointMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Endpoint
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Console Log Modal */}
      {showConsoleModal && migrationSessionId && (
        <ConsoleLogModal
          isOpen={showConsoleModal}
          onClose={() => setShowConsoleModal(false)}
          sessionId={migrationSessionId}
          migrationData={null} // Will be populated by polling
        />
      )}
    </div>
  );
}