import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, UserPlus, Shield, Key, Copy, MoreHorizontal, Mail, Send, Crown, Users, Settings, Lock, Database, Server, Cloud, Target, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export default function AdminNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch environment configurations from database
  const { data: environmentConfigurations = [], isLoading: configsLoading, refetch: refetchConfigs } = useQuery({
    queryKey: ['/api/environment-configurations'],
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Force refetch on component mount and clear cache
  React.useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Clear cache first
        queryClient.removeQueries({ queryKey: ['/api/environment-configurations'] });
        
        // Manual fetch to ensure data is loaded
        const response = await fetch('/api/environment-configurations');
        const configs = await response.json();
        
        // Set data manually in cache
        queryClient.setQueryData(['/api/environment-configurations'], configs);
        
        // Also trigger refetch
        refetchConfigs();
      } catch (error) {
        console.error('Failed to load configurations:', error);
      }
    };
    
    loadConfigurations();
  }, []);
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

  // Migration state management
  const [currentEnvironment, setCurrentEnvironment] = useState('dev');
  const [activeIntegrationTypes, setActiveIntegrationTypes] = useState([
    'postgresql', 'redis', 's3', 'amplitude', 'braze', 'snowflake', 'sendgrid'
  ]);

  // Initialize environment databases based on active integration types
  const initializeEnvironmentDatabases = (types: string[]) => {
    const databases: any = {};
    types.forEach(type => {
      databases[type] = { 
        integrationId: '', 
        integrationName: `No ${type.charAt(0).toUpperCase() + type.slice(1)} configured`, 
        status: 'disconnected' 
      };
    });
    return databases;
  };

  const [environments, setEnvironments] = useState([
    {
      id: 'dev',
      name: 'Development',
      status: 'active',
      databases: initializeEnvironmentDatabases(['postgresql', 'redis', 's3', 'amplitude', 'braze', 'snowflake', 'sendgrid'])
    },
    {
      id: 'staging',
      name: 'Staging',
      status: 'inactive',
      databases: initializeEnvironmentDatabases(['postgresql', 'redis', 's3', 'amplitude', 'braze', 'snowflake', 'sendgrid'])
    },
    {
      id: 'production',
      name: 'Production',
      status: 'inactive',
      databases: initializeEnvironmentDatabases(['postgresql', 'redis', 's3', 'amplitude', 'braze', 'snowflake', 'sendgrid'])
    }
  ]);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showEnvConfigModal, setShowEnvConfigModal] = useState(false);
  const [showIntegrationTypesModal, setShowIntegrationTypesModal] = useState(false);
  const [selectedMigrationType, setSelectedMigrationType] = useState('');
  const [selectedSourceEnv, setSelectedSourceEnv] = useState('');
  const [selectedTargetEnv, setSelectedTargetEnv] = useState('');
  const [selectedConfigEnv, setSelectedConfigEnv] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [envConfig, setEnvConfig] = useState<{ [key: string]: string }>({});

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

  // Fetch integrations for environment configuration
  const { data: integrations = [] } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: () => apiRequest('/api/integrations'),
    staleTime: 5 * 60 * 1000,
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

  // Edit team member mutation
  const editTeamMemberMutation = useMutation({
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

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest(`/api/team/${memberId}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: (response: any) => {
      setGeneratedUserData({ id: response.id, firstName: '', lastName: '' });
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

  // Send invitation mutation (keep for backward compatibility)
  const sendInvitationMutation = useMutation({
    mutationFn: (data: InvitationData) => createTeamMemberMutation.mutateAsync(data),
    onSuccess: () => {
      setShowInviteModal(false);
      setInvitationData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
        message: ''
      });
      toast({
        title: "Invitation Sent",
        description: "Team member invitation has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Delete team member mutation
  const deleteTeamMemberMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/team/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({
        title: "Team Member Removed",
        description: "The team member has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      });
    },
  });

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    sendInvitationMutation.mutate(invitationData);
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

  // Migration handlers
  const handleSwitchEnvironment = (envId: string) => {
    setEnvironments(prev => prev.map(env => ({
      ...env,
      status: env.id === envId ? 'active' : 'inactive'
    })));
    setCurrentEnvironment(envId);
    toast({
      title: "Environment switched",
      description: `Now using ${environments.find(e => e.id === envId)?.name} environment`
    });
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

      // Start the migration
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
        toast({
          title: "Migration Completed",
          description: `Successfully migrated ${response.details?.migratedTables || 'data'} from ${sourceIntegration.name} to ${targetIntegration.name}`,
        });
        setShowMigrationModal(false);
        setSelectedMigrationType('');
        setSelectedSourceEnv('');
        setSelectedTargetEnv('');
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

  const handleConfigureEnvironment = (envId: string) => {
    setSelectedConfigEnv(envId);
    
    // Load existing configurations from database for this environment
    const envConfigs = Array.isArray(environmentConfigurations) 
      ? (environmentConfigurations as any[]).filter((config: any) => config.environmentId === envId)
      : [];
    
    // Initialize config state with database values
    const initialConfig: { [key: string]: string } = {};
    activeIntegrationTypes.forEach(type => {
      const configKey = `${type}IntegrationId`;
      const existingConfig = envConfigs.find((config: any) => config.integrationType === type);
      initialConfig[configKey] = existingConfig?.integrationId || 'none';
    });
    
    setEnvConfig(initialConfig);
    setShowEnvConfigModal(true);
  };

  const handleSaveEnvironmentConfig = async () => {
    const getIntegrationName = (integrationId: string) => {
      if (integrationId === 'none' || !integrationId) return 'No integration configured';
      const integration = integrations.find((int: any) => int.id === integrationId);
      return integration ? integration.name : 'No integration configured';
    };

    const cleanIntegrationId = (id: string) => id === 'none' ? '' : id;
    const currentEnv = environments.find(e => e.id === selectedConfigEnv);

    if (!currentEnv) return;

    try {
      // Save each integration type configuration to database
      for (const type of activeIntegrationTypes) {
        const configKey = `${type}IntegrationId`;
        const integrationId = envConfig[configKey];
        
        await apiRequest('/api/environment-configurations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            environmentId: selectedConfigEnv,
            environmentName: currentEnv.name,
            integrationType: type,
            integrationId: cleanIntegrationId(integrationId)
          })
        });
      }

      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/environment-configurations'] });

      // Update local state
      setEnvironments(prev => prev.map(env => 
        env.id === selectedConfigEnv 
          ? {
              ...env,
              databases: (() => {
                const updatedDatabases: any = {};
                activeIntegrationTypes.forEach(type => {
                  const configKey = `${type}IntegrationId`;
                  const integrationId = envConfig[configKey];
                  updatedDatabases[type] = {
                    integrationId: cleanIntegrationId(integrationId), 
                    integrationName: getIntegrationName(integrationId),
                    status: integrationId && integrationId !== 'none' ? 'connected' : 'disconnected' 
                  };
                });
                return updatedDatabases;
              })()
            }
          : env
      ));

      setShowEnvConfigModal(false);
      toast({
        title: "Environment configured",
        description: `${currentEnv.name} environment saved to database successfully`
      });
    } catch (error: any) {
      toast({
        title: "Configuration failed",
        description: error.message || "Failed to save environment configuration",
        variant: "destructive"
      });
    }
  };

  // Helper functions to filter integrations by type
  const getPostgresIntegrations = () => {
    if (!activeIntegrationTypes.includes('postgresql')) return [];
    return integrations.filter((int: any) => 
      int.type === 'postgresql' || int.type === 'database' || int.name?.toLowerCase().includes('postgres')
    );
  };

  const getRedisIntegrations = () => {
    if (!activeIntegrationTypes.includes('redis')) return [];
    return integrations.filter((int: any) => 
      int.type === 'redis' || int.name?.toLowerCase().includes('redis')
    );
  };

  const getS3Integrations = () => {
    if (!activeIntegrationTypes.includes('s3')) return [];
    return integrations.filter((int: any) => 
      int.type === 's3' || int.type === 'aws' || int.name?.toLowerCase().includes('s3')
    );
  };

  const getAmplitudeIntegrations = () => {
    if (!activeIntegrationTypes.includes('amplitude')) return [];
    return integrations.filter((int: any) => 
      int.type === 'amplitude' || int.name?.toLowerCase().includes('amplitude')
    );
  };

  const getBrazeIntegrations = () => {
    if (!activeIntegrationTypes.includes('braze')) return [];
    return integrations.filter((int: any) => 
      int.type === 'braze' || int.name?.toLowerCase().includes('braze')
    );
  };

  const getSnowflakeIntegrations = () => {
    if (!activeIntegrationTypes.includes('snowflake')) return [];
    return integrations.filter((int: any) => 
      int.type === 'snowflake' || int.name?.toLowerCase().includes('snowflake')
    );
  };

  const getSendGridIntegrations = () => {
    if (!activeIntegrationTypes.includes('sendgrid')) return [];
    return integrations.filter((int: any) => 
      int.type === 'sendgrid' || int.name?.toLowerCase().includes('sendgrid')
    );
  };

  // Get all available integration types from current integrations
  const getAvailableIntegrationTypes = () => {
    const types = new Set();
    integrations.forEach((int: any) => {
      if (int.type) types.add(int.type);
      // Add common variations
      if (int.name?.toLowerCase().includes('postgres')) types.add('postgresql');
      if (int.name?.toLowerCase().includes('redis')) types.add('redis');
      if (int.name?.toLowerCase().includes('s3')) types.add('s3');
      if (int.name?.toLowerCase().includes('amplitude')) types.add('amplitude');
      if (int.name?.toLowerCase().includes('braze')) types.add('braze');
      if (int.name?.toLowerCase().includes('snowflake')) types.add('snowflake');
      if (int.name?.toLowerCase().includes('sendgrid')) types.add('sendgrid');
    });
    return Array.from(types) as string[];
  };

  // Get integration icon and color by type
  const getIntegrationDisplay = (type: string) => {
    const displays: any = {
      postgresql: { icon: Database, color: 'blue' },
      database: { icon: Database, color: 'blue' },
      redis: { icon: Server, color: 'red' },
      s3: { icon: Cloud, color: 'green' },
      aws: { icon: Cloud, color: 'green' },
      amplitude: { icon: BarChart3, color: 'purple' },
      braze: { icon: Mail, color: 'orange' },
      snowflake: { icon: Database, color: 'cyan' },
      sendgrid: { icon: Mail, color: 'blue' }
    };
    return displays[type] || { icon: Settings, color: 'gray' };
  };

  // Update environment databases when integration types change
  const updateEnvironmentDatabases = () => {
    setEnvironments(prev => prev.map(env => ({
      ...env,
      databases: initializeEnvironmentDatabases(activeIntegrationTypes)
    })));
  };

  // Update environments when active integration types change
  React.useEffect(() => {
    setEnvironments(prev => prev.map(env => ({
      ...env,
      databases: initializeEnvironmentDatabases(activeIntegrationTypes)
    })));
  }, [activeIntegrationTypes]);

  // Load environment configurations from database
  React.useEffect(() => {
    if (Array.isArray(environmentConfigurations) && environmentConfigurations.length > 0 && integrations.length > 0) {
      setEnvironments(prev => prev.map(env => {
        const envConfigs = (environmentConfigurations as any[]).filter((config: any) => 
          config.environmentId === env.id
        );
        
        // Start with initialized databases for all active integration types
        const updatedDatabases = initializeEnvironmentDatabases(activeIntegrationTypes);
        
        // Override with saved configurations
        envConfigs.forEach((config: any) => {
          if (activeIntegrationTypes.includes(config.integrationType)) {
            const integration = integrations.find((int: any) => int.id === config.integrationId);
            updatedDatabases[config.integrationType] = {
              integrationId: config.integrationId,
              integrationName: integration ? integration.name : 'Integration not found',
              status: config.integrationId ? 'connected' : 'disconnected'
            };
          }
        });

        return {
          ...env,
          databases: updatedDatabases
        };
      }));
    }
  }, [environmentConfigurations, integrations, activeIntegrationTypes]);

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
                    onChange={(e) => setInvitationData({...invitationData, firstName: e.target.value})}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={invitationData.lastName}
                    onChange={(e) => setInvitationData({...invitationData, lastName: e.target.value})}
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
                  onChange={(e) => setInvitationData({...invitationData, email: e.target.value})}
                  placeholder="john.doe@company.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={invitationData.role} 
                  onValueChange={(value) => setInvitationData({...invitationData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(role => role.isActive).map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: role.color }}
                          />
                          {role.displayName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={invitationData.message}
                  onChange={(e) => setInvitationData({...invitationData, message: e.target.value})}
                  placeholder="Welcome to our team! We're excited to have you join us."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sendInvitationMutation.isPending}>
                  {sendInvitationMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                  <p className="text-gray-500 mb-6">Get started by inviting your first team member.</p>
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{member.firstName} {member.lastName}</h3>
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(member.status)}
                            <span className="text-xs text-muted-foreground">
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {member.lastLoginAt && (
                          <span className="text-xs text-muted-foreground">
                            Last login: {new Date(member.lastLoginAt).toLocaleDateString()}
                          </span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditUserData({
                                id: member.id,
                                firstName: member.firstName,
                                lastName: member.lastName,
                                email: member.email,
                                role: member.role
                              });
                              setShowEditModal(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => resetPasswordMutation.mutate(member.id)}
                              disabled={resetPasswordMutation.isPending}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteTeamMemberMutation.mutate(member.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
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
                            integration.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {integration.status}
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

          {/* Current Environment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Active Environment: {environments.find(e => e.status === 'active')?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeIntegrationTypes.map(type => {
                  const activeEnv = environments.find(e => e.status === 'active');
                  const dbConfig = activeEnv?.databases?.[type];
                  const dbStatus = dbConfig?.status || 'disconnected';
                  const { icon: Icon, color } = getIntegrationDisplay(type);
                  
                  return (
                    <div key={type} className={`flex items-center justify-between p-3 bg-${color}-50 rounded-lg border`}>
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 text-${color}-600 mr-2`} />
                        <span className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
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
                      const dbConfig = env.databases?.[type];
                      const dbStatus = dbConfig?.status || 'disconnected';
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
              <CardTitle>Recent Migrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No migrations found. Start your first migration to see history here.
              </div>
            </CardContent>
          </Card>

          {/* Migration Modal */}
          <Dialog open={showMigrationModal} onOpenChange={setShowMigrationModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Integration Migration</DialogTitle>
                <DialogDescription>
                  Migrate data and schema between integrations of the same type
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

          {/* Environment Configuration Modal */}
          <Dialog open={showEnvConfigModal} onOpenChange={setShowEnvConfigModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configure {environments.find(e => e.id === selectedConfigEnv)?.name} Environment</DialogTitle>
                <DialogDescription>
                  Select integrations for this environment from your configured connections
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                {activeIntegrationTypes.map(type => {
                  const { icon: Icon, color } = getIntegrationDisplay(type);
                  const integrationOptions = getIntegrationsByType(type);
                  const configKey = `${type}IntegrationId` as keyof typeof envConfig;
                  
                  return (
                    <div key={type}>
                      <Label>{type.charAt(0).toUpperCase() + type.slice(1)} Integration</Label>
                      <Select 
                        value={envConfig[configKey] || 'none'} 
                        onValueChange={(value) => setEnvConfig(prev => ({ ...prev, [configKey]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${type} integration`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No {type} integration</SelectItem>
                          {integrationOptions.map((integration: any) => (
                            <SelectItem key={integration.id} value={integration.id}>
                              <div className="flex items-center">
                                <Icon className={`h-4 w-4 mr-2 text-${color}-600`} />
                                {integration.name}
                                {integration.status === 'connected' && <span className="ml-2 text-xs text-green-600">(Connected)</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {integrationOptions.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          No {type} integrations found. Configure one in the Integrations page first.
                        </p>
                      )}
                    </div>
                  );
                })}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Integration Selection</p>
                      <p className="text-blue-700">Choose from your configured integrations. If you need to add new integrations, visit the Integrations page first.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowEnvConfigModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEnvironmentConfig}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Integration Types Management Modal */}
          <Dialog open={showIntegrationTypesModal} onOpenChange={setShowIntegrationTypesModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configure Integration Tools</DialogTitle>
                <DialogDescription>
                  Select which integration types should be available in environment configuration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Database className="h-5 w-5 text-gray-600 mt-0.5 mr-2" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-800">Available Integration Types</p>
                      <p className="text-gray-700">Based on your configured integrations:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getAvailableIntegrationTypes().map(type => (
                          <span key={type} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Active Integration Types</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select which integration types should appear in environment configuration dropdowns
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'postgresql', label: 'PostgreSQL', icon: Database, color: 'blue' },
                      { id: 'redis', label: 'Redis', icon: Server, color: 'red' },
                      { id: 's3', label: 'S3 Storage', icon: Cloud, color: 'green' },
                      { id: 'amplitude', label: 'Amplitude', icon: BarChart3, color: 'purple' },
                      { id: 'braze', label: 'Braze', icon: Mail, color: 'orange' },
                      { id: 'snowflake', label: 'Snowflake', icon: Database, color: 'cyan' },
                      { id: 'sendgrid', label: 'SendGrid', icon: Mail, color: 'blue' }
                    ].map(({ id, label, icon: Icon, color }) => (
                      <label key={id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeIntegrationTypes.includes(id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActiveIntegrationTypes(prev => [...prev, id]);
                            } else {
                              setActiveIntegrationTypes(prev => prev.filter(t => t !== id));
                            }
                          }}
                          className="rounded"
                        />
                        <Icon className={`h-4 w-4 text-${color}-600`} />
                        <span className="font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Integration Management</p>
                      <p className="text-amber-700">Only integration types with configured integrations will show actual options. Make sure to configure integrations in the Integrations page first.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowIntegrationTypesModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    setShowIntegrationTypesModal(false);
                    toast({
                      title: "Integration tools updated",
                      description: `${activeIntegrationTypes.length} integration types are now active`
                    });
                  }}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Send system notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-sync Cohorts</h4>
                    <p className="text-sm text-muted-foreground">Automatically sync cohorts to external platforms</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Retention</h4>
                    <p className="text-sm text-muted-foreground">Keep analytics data for 12 months</p>
                  </div>
                  <Select defaultValue="12">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6">
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
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">IP Restrictions</h4>
                    <p className="text-sm text-muted-foreground">Limit access to specific IP addresses</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information and role assignments.
            </DialogDescription>
          </DialogHeader>
          {editUserData && (
            <form onSubmit={(e) => {
              e.preventDefault();
              editTeamMemberMutation.mutate({
                id: editUserData.id,
                updates: {
                  firstName: editUserData.firstName,
                  lastName: editUserData.lastName,
                  email: editUserData.email,
                  role: editUserData.role
                }
              });
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={editUserData.firstName}
                      onChange={(e) => setEditUserData({...editUserData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={editUserData.lastName}
                      onChange={(e) => setEditUserData({...editUserData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select 
                    value={editUserData.role} 
                    onValueChange={(value) => setEditUserData({...editUserData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter(role => role.isActive).map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: role.color }}
                            />
                            {role.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editTeamMemberMutation.isPending}
                >
                  {editTeamMemberMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Display Modal */}
      <Dialog open={!!createdPassword} onOpenChange={() => setCreatedPassword(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Temporary Password Generated
            </DialogTitle>
            <DialogDescription>
              Share this temporary password securely with the team member. They must change it on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg border-2 border-dashed">
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono font-bold">{createdPassword}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdPassword || '');
                    toast({
                      title: "Copied!",
                      description: "Password copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• This password will expire after first use</p>
              <p>• User must change password immediately upon login</p>
              <p>• Send this password through a secure channel</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}