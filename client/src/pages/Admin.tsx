
import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, UserPlus, Shield, Key, Copy, MoreHorizontal, Mail, Send, Crown, Database, Server, Cloud, Target, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, Settings } from 'lucide-react';
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
import { SimpleMigrationModal } from '@/components/migration/SimpleMigrationModal';



const allPermissions = [
  { id: 'view_dashboard', label: 'View Dashboard' },
  { id: 'view_users', label: 'View Users' },
  { id: 'edit_users', label: 'Edit Users' },
  { id: 'view_cohorts', label: 'View Cohorts' },
  { id: 'manage_cohorts', label: 'Manage Cohorts' },
  { id: 'view_campaigns', label: 'View Campaigns' },
  { id: 'manage_campaigns', label: 'Manage Campaigns' },
  { id: 'view_promotions', label: 'View Promotions' },
  { id: 'manage_promotions', label: 'Manage Promotions' },
  { id: 'manage_users', label: 'Manage Platform Users' },
  { id: 'manage_roles', label: 'Manage Roles' }
];

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isRolePreviewDialogOpen, setIsRolePreviewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: '',
    status: 'active'
  });
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [editRole, setEditRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Fetch integrations data for migration
  const { data: integrations = [] } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: () => apiRequest('/api/integrations')
  });

  // Migration state management
  const [currentEnvironment, setCurrentEnvironment] = useState('dev');
  const [environments, setEnvironments] = useState([
    {
      id: 'dev',
      name: 'Development',
      status: 'active',
      databases: {
        postgres: { url: 'postgresql://dev-user:pass@dev-host:5432/dev_db', status: 'connected' },
        redis: { url: 'redis://dev-redis:6379', status: 'connected' },
        s3: { bucket: 'dev-bucket', region: 'us-east-1', status: 'connected' }
      }
    },
    {
      id: 'staging',
      name: 'Staging',
      status: 'inactive',
      databases: {
        postgres: { url: '', status: 'disconnected' },
        redis: { url: '', status: 'disconnected' },
        s3: { bucket: '', region: 'us-east-1', status: 'disconnected' }
      }
    },
    {
      id: 'production',
      name: 'Production',
      status: 'inactive',
      databases: {
        postgres: { url: '', status: 'disconnected' },
        redis: { url: '', status: 'disconnected' },
        s3: { bucket: '', region: 'us-east-1', status: 'disconnected' }
      }
    }
  ]);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showEnvConfigModal, setShowEnvConfigModal] = useState(false);
  const [selectedSourceEnv, setSelectedSourceEnv] = useState('');
  const [selectedTargetEnv, setSelectedTargetEnv] = useState('');
  const [selectedConfigEnv, setSelectedConfigEnv] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSessionId, setMigrationSessionId] = useState('');
  const [showMigrationProgress, setShowMigrationProgress] = useState(false);
  const [envConfig, setEnvConfig] = useState({
    postgres: '',
    redis: '',
    s3Bucket: '',
    s3Region: 'us-east-1'
  });

  const { toast } = useToast();

  const filteredUsers = [].filter((user: any) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setEditRole({
      name: role.name,
      description: role.description,
      permissions: role.permissions.includes('all') ? allPermissions.map(p => p.id) : role.permissions
    });
    setIsEditRoleDialogOpen(true);
  };

  const handlePreviewRole = (role: any) => {
    setSelectedRole(role);
    setIsRolePreviewDialogOpen(true);
  };

  const handleDeleteRole = (role: any) => {
    // Role deletion functionality
    console.log('Deleting role:', role.id);
    toast({
      title: "Role Deleted",
      description: `${role.name} role has been deleted.`,
    });
  };

  const handleSaveEditRole = () => {
    // Role update functionality
    console.log('Updating role:', selectedRole.id, 'New data:', editRole);
    toast({
      title: "Role Updated",
      description: `${editRole.name} role has been updated.`,
    });
    setIsEditRoleDialogOpen(false);
    setSelectedRole(null);
  };

  const toggleEditRolePermission = (permissionId: string) => {
    setEditRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleGeneratePassword = (user: any) => {
    setSelectedUser(user);
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    setIsPasswordDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    // User deletion functionality
    console.log('Deleting user:', user.id);
    toast({
      title: "User Deleted",
      description: `${user.name} has been deleted.`,
    });
  };

  const handleSaveEditUser = () => {
    // User update functionality
    console.log('Updating user:', selectedUser.id, 'New data:', editUser);
    toast({
      title: "User Updated",
      description: `${editUser.name} has been updated.`,
    });
    setIsEditUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast({
        title: "Password Copied",
        description: "The password has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy password to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleSavePassword = () => {
    // Password update functionality
    console.log('Updating password for user:', selectedUser.id, 'New password:', generatedPassword);
    toast({
      title: "Password Updated",
      description: `Password has been updated for ${selectedUser.name}.`,
    });
    setIsPasswordDialogOpen(false);
    setGeneratedPassword('');
    setSelectedUser(null);
  };

  const handleInviteUser = () => {
    // User invitation functionality
    console.log('Inviting user:', newUser);
    setIsInviteDialogOpen(false);
    setNewUser({ name: '', email: '', role: '' });
  };

  const handleCreateRole = () => {
    // Role creation functionality
    console.log('Creating role:', newRole);
    setIsRoleDialogOpen(false);
    setNewRole({ name: '', description: '', permissions: [] });
  };

  const togglePermission = (permissionId: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
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

  const handleConfigureEnvironment = (envId: string) => {
    const env = environments.find(e => e.id === envId);
    if (env) {
      setSelectedConfigEnv(envId);
      setEnvConfig({
        postgres: env.databases.postgres.url,
        redis: env.databases.redis.url,
        s3Bucket: env.databases.s3.bucket,
        s3Region: env.databases.s3.region
      });
      setShowEnvConfigModal(true);
    }
  };

  const handleSaveEnvironmentConfig = () => {
    setEnvironments(prev => prev.map(env => 
      env.id === selectedConfigEnv 
        ? {
            ...env,
            databases: {
              postgres: { url: envConfig.postgres, status: envConfig.postgres ? 'connected' : 'disconnected' },
              redis: { url: envConfig.redis, status: envConfig.redis ? 'connected' : 'disconnected' },
              s3: { bucket: envConfig.s3Bucket, region: envConfig.s3Region, status: envConfig.s3Bucket ? 'connected' : 'disconnected' }
            }
          }
        : env
    ));
    setShowEnvConfigModal(false);
    toast({
      title: "Environment configured",
      description: `${environments.find(e => e.id === selectedConfigEnv)?.name} environment updated successfully`
    });
  };

  const handleStartMigration = async () => {
    console.log('handleStartMigration called!', { selectedSourceEnv, selectedTargetEnv });
    
    if (!selectedSourceEnv || !selectedTargetEnv) {
      console.log('Missing source or target env');
      toast({
        title: "Migration error",
        description: "Please select both source and target environments",
        variant: "destructive"
      });
      return;
    }

    // Show progress popup immediately before starting migration
    console.log('Starting migration - setting states');
    setShowMigrationModal(false);
    setShowMigrationProgress(true);
    setMigrationSessionId('initializing');
    setIsMigrating(true);
    
    console.log('States set:', { showMigrationProgress: true, migrationSessionId: 'initializing' });
    
    toast({
      title: "Migration Starting",
      description: "Progress popup is now displaying - migration will begin momentarily"
    });

    try {
      // Start PostgreSQL migration with real-time progress tracking
      const response = await apiRequest('/api/migrate-data', {
        method: 'POST',
        body: JSON.stringify({
          type: 'postgresql',
          sourceIntegrationId: selectedSourceEnv,
          targetIntegrationId: selectedTargetEnv,
          sourceEnvironment: integrations.find((i: any) => i.id === selectedSourceEnv)?.name || 'Source',
          targetEnvironment: integrations.find((i: any) => i.id === selectedTargetEnv)?.name || 'Target',
          sourceConfig: {
            connectionString: integrations.find((i: any) => i.id === selectedSourceEnv)?.credentials?.connectionString
          },
          targetConfig: {
            connectionString: integrations.find((i: any) => i.id === selectedTargetEnv)?.credentials?.connectionString
          }
        })
      });

      if (response.success && response.sessionId) {
        // Update with real session ID
        setMigrationSessionId(response.sessionId);
        setIsMigrating(false); // Allow popup interaction
        
        toast({
          title: "Migration Active",
          description: "Real-time progress tracking with session ID: " + response.sessionId.substring(0, 8)
        });
      } else {
        // Keep showing progress even without session ID
        setIsMigrating(false);
        
        toast({
          title: "Migration Running",
          description: "Progress tracking active - check server logs for details"
        });
      }
    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to start migration",
        variant: "destructive"
      });
      setIsMigrating(false);
    }
  };

  const handleMigrationComplete = () => {
    setIsMigrating(false);
    setShowMigrationProgress(false);
    setMigrationSessionId('');
    
    toast({
      title: "Migration Completed",
      description: "Data migration finished successfully"
    });
  };

  const handleMigrationError = (error: string) => {
    setIsMigrating(false);
    setShowMigrationProgress(false);
    setMigrationSessionId('');
    
    toast({
      title: "Migration Failed",
      description: error,
      variant: "destructive"
    });
  };;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Platform Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Platform Users</h2>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join the CDP platform. A temporary password will be generated.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {[].map((role: any) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteUser}>
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Last Login</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{user.name}</td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{user.role}</Badge>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                        <td className="py-3 px-4 text-gray-600">{user.lastLogin}</td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGeneratePassword(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Change Password
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                    <span className="text-red-600">Delete User</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user "{user.name}" and remove their access to the platform.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteUser(user)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Full Name</Label>
                <Input
                  id="editName"
                  value={editUser.name}
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editUser.role} onValueChange={(value) => setEditUser({...editUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="userStatus">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="userStatus" className="text-sm text-gray-600">
                      {editUser.status === 'active' ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id="userStatus"
                      checked={editUser.status === 'active'}
                      onCheckedChange={(checked) => 
                        setEditUser({...editUser, status: checked ? 'active' : 'inactive'})
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditUser}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Generation Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate New Password</DialogTitle>
              <DialogDescription>
                A new password has been generated for {selectedUser?.name}. Copy this password and share it securely with the user.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Generated Password</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Copy this password now. For security reasons, it won't be shown again after you close this dialog.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePassword}>
                Save New Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Roles & Permissions</h2>
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      placeholder="Enter role name"
                      value={newRole.name}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleDescription">Description</Label>
                    <Input
                      id="roleDescription"
                      placeholder="Describe this role"
                      value={newRole.description}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {allPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={newRole.permissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={permission.id} className="text-sm">
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole}>
                    Create Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Roles List */}
          <Card>
            <CardHeader>
              <CardTitle>All Roles ({mockRoles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Role Name</th>
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                      <th className="text-left py-3 px-4 font-medium">Users</th>
                      <th className="text-left py-3 px-4 font-medium">Permissions</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRoles.map((role) => (
                      <tr key={role.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{role.name}</td>
                        <td className="py-3 px-4 text-gray-600">{role.description}</td>
                        <td className="py-3 px-4 font-medium">{role.userCount}</td>
                        <td className="py-3 px-4">
                          {role.permissions.includes('all') ? (
                            <Badge className="bg-red-100 text-red-800">All Permissions</Badge>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {role.permissions.length} permissions
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreviewRole(role)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditRole(role)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                              {role.name !== 'Administrator' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                      <span className="text-red-600">Delete Role</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the "{role.name}" role and all users with this role will lose their permissions.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteRole(role)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete Role
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Role Dialog */}
          <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>
                  Update role information and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editRoleName">Role Name</Label>
                  <Input
                    id="editRoleName"
                    value={editRole.name}
                    onChange={(e) => setEditRole({...editRole, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRoleDescription">Description</Label>
                  <Input
                    id="editRoleDescription"
                    value={editRole.description}
                    onChange={(e) => setEditRole({...editRole, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {allPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${permission.id}`}
                          checked={editRole.permissions.includes(permission.id)}
                          onCheckedChange={() => toggleEditRolePermission(permission.id)}
                        />
                        <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEditRole}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Role Preview Dialog */}
          <Dialog open={isRolePreviewDialogOpen} onOpenChange={setIsRolePreviewDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Role Details: {selectedRole?.name}</DialogTitle>
                <DialogDescription>
                  View complete role information and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="font-medium">Role Name</Label>
                  <p className="text-sm text-gray-600">{selectedRole?.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Description</Label>
                  <p className="text-sm text-gray-600">{selectedRole?.description}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Users with this role</Label>
                  <p className="text-sm text-gray-600">{selectedRole?.userCount} users</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Permissions</Label>
                  <div className="max-h-48 overflow-y-auto">
                    {selectedRole?.permissions.includes('all') ? (
                      <Badge className="bg-red-100 text-red-800">All Permissions</Badge>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRole?.permissions.map((permissionId: string) => {
                          const permission = allPermissions.find(p => p.id === permissionId);
                          return permission ? (
                            <Badge key={permissionId} variant="outline" className="text-xs">
                              {permission.label}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsRolePreviewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="migrations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Environment Management</h2>
              <p className="text-sm text-muted-foreground">Manage multiple database environments and migrate data between them</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowMigrationModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Target className="h-4 w-4 mr-2" />
                Start Migration
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
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium">PostgreSQL</span>
                  </div>
                  {getStatusIcon(environments.find(e => e.status === 'active')?.databases.postgres.status || 'disconnected')}
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium">Redis</span>
                  </div>
                  {getStatusIcon(environments.find(e => e.status === 'active')?.databases.redis.status || 'disconnected')}
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <div className="flex items-center">
                    <Cloud className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">S3</span>
                  </div>
                  {getStatusIcon(environments.find(e => e.status === 'active')?.databases.s3.status || 'disconnected')}
                </div>
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
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        PostgreSQL
                      </div>
                      {getStatusIcon(env.databases.postgres.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Server className="h-4 w-4 mr-2" />
                        Redis
                      </div>
                      {getStatusIcon(env.databases.redis.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Cloud className="h-4 w-4 mr-2" />
                        S3
                      </div>
                      {getStatusIcon(env.databases.s3.status)}
                    </div>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium">Development → Staging</p>
                      <p className="text-sm text-muted-foreground">Migrated 15,432 records • 2 hours ago</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium">Staging → Production</p>
                      <p className="text-sm text-muted-foreground">Schema migration in progress • Started 30 minutes ago</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Migration Modal */}
          <Dialog open={showMigrationModal} onOpenChange={setShowMigrationModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Database Migration</DialogTitle>
                <DialogDescription>
                  Migrate data and schema between environments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Source Integration</Label>
                    <Select value={selectedSourceEnv} onValueChange={setSelectedSourceEnv}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source database" />
                      </SelectTrigger>
                      <SelectContent>
                        {integrations.filter((i: any) => i.type === 'postgresql').map((integration: any) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            {integration.name} ({integration.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Integration</Label>
                    <Select value={selectedTargetEnv} onValueChange={setSelectedTargetEnv}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target database" />
                      </SelectTrigger>
                      <SelectContent>
                        {integrations.filter((i: any) => i.type === 'postgresql' && i.id !== selectedSourceEnv).map((integration: any) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            {integration.name} ({integration.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Migration Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="schema" defaultChecked />
                      <Label htmlFor="schema">Migrate Schema</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="data" defaultChecked />
                      <Label htmlFor="data">Migrate Data</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="integrations" defaultChecked />
                      <Label htmlFor="integrations">Migrate Integrations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="images" defaultChecked />
                      <Label htmlFor="images">Migrate Images to S3</Label>
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
                  <Button onClick={handleStartMigration} disabled={isMigrating || !selectedSourceEnv || !selectedTargetEnv}>
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
                  Set up database connections for this environment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>PostgreSQL Connection String</Label>
                  <Input
                    type="password"
                    placeholder="postgresql://user:password@host:5432/database"
                    value={envConfig.postgres}
                    onChange={(e) => setEnvConfig(prev => ({ ...prev, postgres: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Redis Connection String</Label>
                  <Input
                    type="password"
                    placeholder="redis://user:password@host:6379"
                    value={envConfig.redis}
                    onChange={(e) => setEnvConfig(prev => ({ ...prev, redis: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>S3 Bucket Name</Label>
                    <Input
                      placeholder="my-app-bucket"
                      value={envConfig.s3Bucket}
                      onChange={(e) => setEnvConfig(prev => ({ ...prev, s3Bucket: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>S3 Region</Label>
                    <Select value={envConfig.s3Region} onValueChange={(value) => setEnvConfig(prev => ({ ...prev, s3Region: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                        <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                        <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                        <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                      </SelectContent>
                    </Select>
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

          {/* Simple Migration Modal - Fixed Implementation */}
          {console.log('Rendering SimpleMigrationModal with:', { showMigrationProgress, migrationSessionId })}
          <SimpleMigrationModal
            isOpen={showMigrationProgress}
            sessionId={migrationSessionId}
            onClose={() => setShowMigrationProgress(false)}
            onComplete={handleMigrationComplete}
            onError={handleMigrationError}
          />
          
          {/* Debug overlay to verify state */}
          {showMigrationProgress && (
            <div className="fixed top-4 right-4 bg-red-500 text-white p-2 text-xs z-[9999]">
              DEBUG: Modal should be showing. SessionId: {migrationSessionId}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
