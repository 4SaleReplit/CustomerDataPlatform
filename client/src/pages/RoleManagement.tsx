import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, Settings, Users, Shield, Crown, Eye, Edit, Trash2, ChevronDown, ChevronRight,
  Database, CreditCard, MessageSquare, Mail, Bell, Lock, Key, UserCheck,
  BarChart3, Workflow, Calendar, Target, Globe, FileText, Search, Download
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color: string;
  isSystemRole: boolean;
  isActive: boolean;
  permissions: Record<string, any>;
  hierarchyLevel: number;
  canManageRoles: boolean;
  maxTeamMembers?: number;
  allowedFeatures: string[];
  restrictions: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  resource: string;
  action: string;
  isSystemPermission: boolean;
  requiresElevation: boolean;
  dependencies: string[];
}

// Comprehensive permission categories and templates
const PERMISSION_CATEGORIES = {
  'dashboard': {
    name: 'Dashboard & Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'bg-blue-500',
    permissions: [
      { resource: 'dashboard', action: 'view', name: 'View Dashboard', description: 'Access to view dashboard and analytics' },
      { resource: 'dashboard', action: 'edit', name: 'Edit Dashboard', description: 'Modify dashboard layouts and configurations' },
      { resource: 'dashboard', action: 'create', name: 'Create Dashboards', description: 'Create new dashboard instances' },
      { resource: 'dashboard', action: 'delete', name: 'Delete Dashboards', description: 'Remove dashboard instances' },
      { resource: 'dashboard', action: 'export', name: 'Export Data', description: 'Export dashboard data and reports' }
    ]
  },
  'cohorts': {
    name: 'Cohort Management',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-green-500',
    permissions: [
      { resource: 'cohorts', action: 'view', name: 'View Cohorts', description: 'Access to view cohort lists and details' },
      { resource: 'cohorts', action: 'create', name: 'Create Cohorts', description: 'Create new user cohorts' },
      { resource: 'cohorts', action: 'edit', name: 'Edit Cohorts', description: 'Modify existing cohorts' },
      { resource: 'cohorts', action: 'delete', name: 'Delete Cohorts', description: 'Remove cohorts' },
      { resource: 'cohorts', action: 'calculate', name: 'Calculate Cohorts', description: 'Trigger cohort calculations' },
      { resource: 'cohorts', action: 'sync', name: 'Sync to Platforms', description: 'Sync cohorts to external platforms' }
    ]
  },
  'campaigns': {
    name: 'Campaign Management',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-purple-500',
    permissions: [
      { resource: 'campaigns', action: 'view', name: 'View Campaigns', description: 'Access to view marketing campaigns' },
      { resource: 'campaigns', action: 'create', name: 'Create Campaigns', description: 'Create new marketing campaigns' },
      { resource: 'campaigns', action: 'edit', name: 'Edit Campaigns', description: 'Modify existing campaigns' },
      { resource: 'campaigns', action: 'delete', name: 'Delete Campaigns', description: 'Remove campaigns' },
      { resource: 'campaigns', action: 'launch', name: 'Launch Campaigns', description: 'Start campaign execution' },
      { resource: 'campaigns', action: 'pause', name: 'Pause Campaigns', description: 'Pause or stop running campaigns' }
    ]
  },
  'integrations': {
    name: 'Integration Management',
    icon: <Workflow className="h-5 w-5" />,
    color: 'bg-orange-500',
    permissions: [
      { resource: 'integrations', action: 'view', name: 'View Integrations', description: 'Access to view platform integrations' },
      { resource: 'integrations', action: 'create', name: 'Add Integrations', description: 'Connect new platforms' },
      { resource: 'integrations', action: 'edit', name: 'Configure Integrations', description: 'Modify integration settings' },
      { resource: 'integrations', action: 'delete', name: 'Remove Integrations', description: 'Disconnect platforms' },
      { resource: 'integrations', action: 'test', name: 'Test Connections', description: 'Test integration connectivity' }
    ]
  },
  'team': {
    name: 'Team Management',
    icon: <UserCheck className="h-5 w-5" />,
    color: 'bg-indigo-500',
    permissions: [
      { resource: 'team', action: 'view', name: 'View Team Members', description: 'Access to view team member list' },
      { resource: 'team', action: 'invite', name: 'Invite Members', description: 'Send team invitations' },
      { resource: 'team', action: 'edit', name: 'Edit Member Profiles', description: 'Modify team member information' },
      { resource: 'team', action: 'remove', name: 'Remove Members', description: 'Remove team members' },
      { resource: 'team', action: 'assign_roles', name: 'Assign Roles', description: 'Change member roles and permissions' }
    ]
  },
  'admin': {
    name: 'System Administration',
    icon: <Shield className="h-5 w-5" />,
    color: 'bg-red-500',
    permissions: [
      { resource: 'system', action: 'configure', name: 'System Configuration', description: 'Access to system settings' },
      { resource: 'roles', action: 'manage', name: 'Manage Roles', description: 'Create and modify user roles' },
      { resource: 'permissions', action: 'manage', name: 'Manage Permissions', description: 'Assign and revoke permissions' },
      { resource: 'audit', action: 'view', name: 'View Audit Logs', description: 'Access to system audit trails' },
      { resource: 'billing', action: 'manage', name: 'Billing Management', description: 'Manage subscription and billing' }
    ]
  }
};

const ROLE_TEMPLATES = [
  {
    name: 'Marketing Manager',
    displayName: 'Marketing Manager',
    description: 'Full access to campaigns and cohorts with team management capabilities',
    color: '#8B5CF6',
    hierarchyLevel: 8,
    permissions: ['cohorts.*', 'campaigns.*', 'dashboard.view', 'dashboard.edit', 'integrations.view'],
    features: ['advanced_analytics', 'campaign_automation', 'cohort_sync'],
    maxTeamMembers: 50
  },
  {
    name: 'Data Analyst',
    displayName: 'Data Analyst',
    description: 'Read-only access to data with dashboard creation permissions',
    color: '#06B6D4',
    hierarchyLevel: 5,
    permissions: ['dashboard.*', 'cohorts.view', 'campaigns.view', 'integrations.view'],
    features: ['advanced_analytics', 'data_export'],
    maxTeamMembers: 10
  },
  {
    name: 'Campaign Specialist',
    displayName: 'Campaign Specialist',
    description: 'Focused on campaign management with limited cohort access',
    color: '#F59E0B',
    hierarchyLevel: 6,
    permissions: ['campaigns.*', 'cohorts.view', 'dashboard.view', 'integrations.view'],
    features: ['campaign_automation'],
    maxTeamMembers: 20
  },
  {
    name: 'Integration Admin',
    displayName: 'Integration Administrator',
    description: 'Manages platform connections and data integrations',
    color: '#10B981',
    hierarchyLevel: 7,
    permissions: ['integrations.*', 'dashboard.view', 'cohorts.view'],
    features: ['integration_management', 'data_sync'],
    maxTeamMembers: 5
  },
  {
    name: 'Viewer',
    displayName: 'Read-Only Viewer',
    description: 'View-only access to dashboards and basic analytics',
    color: '#6B7280',
    hierarchyLevel: 2,
    permissions: ['dashboard.view', 'cohorts.view', 'campaigns.view'],
    features: ['basic_analytics'],
    maxTeamMembers: 100
  }
];

const AVAILABLE_FEATURES = [
  { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Access to detailed analytics and insights' },
  { id: 'campaign_automation', name: 'Campaign Automation', description: 'Automated campaign management features' },
  { id: 'cohort_sync', name: 'Cohort Synchronization', description: 'Sync cohorts to external platforms' },
  { id: 'data_export', name: 'Data Export', description: 'Export data in various formats' },
  { id: 'integration_management', name: 'Integration Management', description: 'Manage platform integrations' },
  { id: 'data_sync', name: 'Data Synchronization', description: 'Real-time data synchronization' },
  { id: 'basic_analytics', name: 'Basic Analytics', description: 'Standard analytics and reporting' },
  { id: 'team_collaboration', name: 'Team Collaboration', description: 'Collaborative features and sharing' },
  { id: 'custom_reports', name: 'Custom Reports', description: 'Create custom reports and dashboards' },
  { id: 'api_access', name: 'API Access', description: 'Access to REST API endpoints' }
];

export default function RoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Form state for role creation/editing
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    hierarchyLevel: 5,
    canManageRoles: false,
    maxTeamMembers: undefined as number | undefined,
    isActive: true,
    selectedPermissions: [] as string[],
    allowedFeatures: [] as string[],
    restrictions: {
      ipWhitelist: [] as string[],
      timeRestrictions: {
        enabled: false,
        allowedHours: { start: '09:00', end: '17:00' },
        allowedDays: [1, 2, 3, 4, 5] // Monday to Friday
      },
      dataAccessLimits: {
        maxRecords: undefined as number | undefined,
        allowedDataSources: [] as string[]
      }
    }
  });

  // Fetch roles and permissions
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: () => apiRequest('/api/roles') as Promise<Role[]>,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: () => apiRequest('/api/permissions') as Promise<Permission[]>,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });
    return grouped;
  }, [permissions]);

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setShowCreateModal(false);
      resetForm();
      toast({
        title: "Role Created",
        description: "The new role has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setShowEditModal(false);
      setSelectedRole(null);
      resetForm();
      toast({
        title: "Role Updated",
        description: "The role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Role Deleted",
        description: "The role has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      color: '#3B82F6',
      hierarchyLevel: 5,
      canManageRoles: false,
      maxTeamMembers: undefined,
      isActive: true,
      selectedPermissions: [],
      allowedFeatures: [],
      restrictions: {
        ipWhitelist: [],
        timeRestrictions: {
          enabled: false,
          allowedHours: { start: '09:00', end: '17:00' },
          allowedDays: [1, 2, 3, 4, 5]
        },
        dataAccessLimits: {
          maxRecords: undefined,
          allowedDataSources: []
        }
      }
    });
  };

  const applyTemplate = (template: typeof ROLE_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: template.displayName,
      description: template.description,
      color: template.color,
      hierarchyLevel: template.hierarchyLevel,
      selectedPermissions: template.permissions,
      allowedFeatures: template.features,
      maxTeamMembers: template.maxTeamMembers
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, ...formData });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const startEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      color: role.color,
      hierarchyLevel: role.hierarchyLevel,
      canManageRoles: role.canManageRoles,
      maxTeamMembers: role.maxTeamMembers,
      isActive: role.isActive,
      selectedPermissions: [], // Would need to fetch from role-permissions junction
      allowedFeatures: role.allowedFeatures,
      restrictions: {
        ipWhitelist: (role.restrictions as any)?.ipWhitelist || [],
        timeRestrictions: {
          enabled: (role.restrictions as any)?.timeRestrictions?.enabled || false,
          allowedHours: (role.restrictions as any)?.timeRestrictions?.allowedHours || { start: '09:00', end: '17:00' },
          allowedDays: (role.restrictions as any)?.timeRestrictions?.allowedDays || [1, 2, 3, 4, 5]
        },
        dataAccessLimits: {
          maxRecords: (role.restrictions as any)?.dataAccessLimits?.maxRecords || undefined,
          allowedDataSources: (role.restrictions as any)?.dataAccessLimits?.allowedDataSources || []
        }
      }
    });
    setShowEditModal(true);
  };

  const getRoleIcon = (hierarchyLevel: number) => {
    if (hierarchyLevel >= 9) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (hierarchyLevel >= 7) return <Shield className="h-5 w-5 text-blue-500" />;
    if (hierarchyLevel >= 5) return <Users className="h-5 w-5 text-green-500" />;
    return <Eye className="h-5 w-5 text-gray-500" />;
  };

  const isLoading = rolesLoading || permissionsLoading;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Role Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Create and manage customized roles with granular permission controls
          </p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <RoleFormModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            title="Create New Role"
            description="Design a customized role with specific permissions and restrictions"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isLoading={createRoleMutation.isPending}
            permissionsByCategory={permissionsByCategory}
            roleTemplates={ROLE_TEMPLATES}
            availableFeatures={AVAILABLE_FEATURES}
            onApplyTemplate={applyTemplate}
            onReset={resetForm}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse">
              <CardHeader className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="group hover:shadow-xl transition-all duration-300 border-l-4" style={{ borderLeftColor: role.color }}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(role.hierarchyLevel)}
                    <div>
                      <CardTitle className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                        {role.displayName}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Level {role.hierarchyLevel} • {role.name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {role.isSystemRole && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        System
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {role.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Members:</span>
                    <span className="font-medium">
                      {role.maxTeamMembers ? role.maxTeamMembers.toLocaleString() : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Features:</span>
                    <span className="font-medium">{role.allowedFeatures.length}</span>
                  </div>
                  {role.canManageRoles && (
                    <div className="flex items-center text-sm text-amber-600">
                      <Key className="h-3 w-3 mr-1" />
                      <span>Can manage roles</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => startEdit(role)}
                    className="flex-1 hover:bg-blue-50 hover:border-blue-200"
                    disabled={role.isSystemRole}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteRoleMutation.mutate(role.id)}
                    disabled={role.isSystemRole || deleteRoleMutation.isPending}
                    className="hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Role Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <RoleFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          title="Edit Role"
          description="Modify role permissions and settings"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isLoading={updateRoleMutation.isPending}
          permissionsByCategory={permissionsByCategory}
          roleTemplates={ROLE_TEMPLATES}
          availableFeatures={AVAILABLE_FEATURES}
          onApplyTemplate={applyTemplate}
          onReset={resetForm}
          isEditMode={true}
        />
      </Dialog>
    </div>
  );
}

// Comprehensive Role Form Modal Component
function RoleFormModal({
  open,
  onOpenChange,
  title,
  description,
  formData,
  setFormData,
  onSubmit,
  isLoading,
  permissionsByCategory,
  roleTemplates,
  availableFeatures,
  onApplyTemplate,
  onReset,
  isEditMode = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  permissionsByCategory: Record<string, Permission[]>;
  roleTemplates: typeof ROLE_TEMPLATES;
  availableFeatures: typeof AVAILABLE_FEATURES;
  onApplyTemplate: (template: typeof ROLE_TEMPLATES[0]) => void;
  onReset: () => void;
  isEditMode?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        <DialogDescription className="text-base">{description}</DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="basic" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="basic" className="h-full overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    placeholder="Marketing Manager"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Internal Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="marketing_manager"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Role description and responsibilities..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="color">Role Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="hierarchyLevel">Hierarchy Level (1-10)</Label>
                  <Input
                    id="hierarchyLevel"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.hierarchyLevel}
                    onChange={(e) => setFormData({...formData, hierarchyLevel: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTeamMembers">Max Team Members</Label>
                  <Input
                    id="maxTeamMembers"
                    type="number"
                    min="1"
                    value={formData.maxTeamMembers || ''}
                    onChange={(e) => setFormData({...formData, maxTeamMembers: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Unlimited"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="canManageRoles"
                    checked={formData.canManageRoles}
                    onCheckedChange={(checked) => setFormData({...formData, canManageRoles: checked})}
                  />
                  <Label htmlFor="canManageRoles">Can manage other roles</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Role is active</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Permission Categories</h3>
                <Badge variant="outline">
                  {formData.selectedPermissions.length} selected
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                  <Collapsible
                    key={categoryKey}
                    open={activeCategory === categoryKey}
                    onOpenChange={(open) => setActiveCategory(open ? categoryKey : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${category.color} text-white`}>
                                {category.icon}
                              </div>
                              <div>
                                <h4 className="font-medium">{category.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {category.permissions.length} permissions available
                                </p>
                              </div>
                            </div>
                            {activeCategory === categoryKey ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Card className="mt-2">
                        <CardContent className="pt-4 space-y-3">
                          {category.permissions.map((permission) => {
                            const permissionKey = `${permission.resource}.${permission.action}`;
                            return (
                              <div key={permissionKey} className="flex items-start space-x-3 p-3 rounded-lg border">
                                <Checkbox
                                  id={permissionKey}
                                  checked={formData.selectedPermissions.includes(permissionKey)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData({
                                        ...formData,
                                        selectedPermissions: [...formData.selectedPermissions, permissionKey]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        selectedPermissions: formData.selectedPermissions.filter((p: string) => p !== permissionKey)
                                      });
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={permissionKey} className="font-medium cursor-pointer">
                                    {permission.name}
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Features</h3>
              <div className="grid grid-cols-2 gap-4">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-start space-x-3 p-4 rounded-lg border">
                    <Checkbox
                      id={feature.id}
                      checked={formData.allowedFeatures.includes(feature.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            allowedFeatures: [...formData.allowedFeatures, feature.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            allowedFeatures: formData.allowedFeatures.filter((f: string) => f !== feature.id)
                          });
                        }
                      }}
                    />
                    <div>
                      <Label htmlFor={feature.id} className="font-medium cursor-pointer">
                        {feature.name}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="restrictions" className="h-full overflow-y-auto p-6 space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Access Restrictions</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Switch
                        id="timeRestrictions"
                        checked={formData.restrictions.timeRestrictions.enabled}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          restrictions: {
                            ...formData.restrictions,
                            timeRestrictions: { ...formData.restrictions.timeRestrictions, enabled: checked }
                          }
                        })}
                      />
                      <Label htmlFor="timeRestrictions">Time-based access restrictions</Label>
                    </div>
                    
                    {formData.restrictions.timeRestrictions.enabled && (
                      <div className="ml-6 space-y-3 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={formData.restrictions.timeRestrictions.allowedHours.start}
                              onChange={(e) => setFormData({
                                ...formData,
                                restrictions: {
                                  ...formData.restrictions,
                                  timeRestrictions: {
                                    ...formData.restrictions.timeRestrictions,
                                    allowedHours: { ...formData.restrictions.timeRestrictions.allowedHours, start: e.target.value }
                                  }
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={formData.restrictions.timeRestrictions.allowedHours.end}
                              onChange={(e) => setFormData({
                                ...formData,
                                restrictions: {
                                  ...formData.restrictions,
                                  timeRestrictions: {
                                    ...formData.restrictions.timeRestrictions,
                                    allowedHours: { ...formData.restrictions.timeRestrictions.allowedHours, end: e.target.value }
                                  }
                                }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Data Access Limits</Label>
                    <div className="mt-2 space-y-3">
                      <div>
                        <Label htmlFor="maxRecords">Maximum Records Per Query</Label>
                        <Input
                          id="maxRecords"
                          type="number"
                          value={formData.restrictions.dataAccessLimits.maxRecords || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            restrictions: {
                              ...formData.restrictions,
                              dataAccessLimits: {
                                ...formData.restrictions.dataAccessLimits,
                                maxRecords: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }
                          })}
                          placeholder="No limit"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Role Templates</h3>
              <p className="text-muted-foreground mb-6">
                Start with a predefined role template and customize as needed
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleTemplates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: template.color }}
                          />
                          <div>
                            <CardTitle className="text-lg">{template.displayName}</CardTitle>
                            <CardDescription className="text-sm">
                              Level {template.hierarchyLevel}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Permissions:</span>
                          <span className="font-medium">{template.permissions.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Features:</span>
                          <span className="font-medium">{template.features.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Max Members:</span>
                          <span className="font-medium">{template.maxTeamMembers}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApplyTemplate(template)}
                        className="w-full"
                      >
                        Apply Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex space-x-2">
          {!isEditMode && (
            <Button variant="outline" onClick={onReset}>
              Reset Form
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update Role' : 'Create Role'
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}