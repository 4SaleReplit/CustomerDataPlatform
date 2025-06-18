import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, UserPlus, Shield, Key, Copy, MoreHorizontal, Mail, Send, Crown, Users, Settings, Lock, Database, Server, Cloud, Target, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, BarChart3 } from 'lucide-react';
import { SimpleMigrationModal } from '@/components/migration/SimpleMigrationModal';
import { ConsoleLogModal } from '@/components/migration/ConsoleLogModal';
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

  // Fetch integrations for migrations
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="migrations" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
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

        <TabsContent value="migrations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Database Migrations</h2>
              <p className="text-sm text-muted-foreground">Migrate data between different database integrations</p>
            </div>
            <Button 
              onClick={() => setShowMigrationModal(true)} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={(integrations as any[]).filter((i: any) => i.type === 'postgresql').length < 2}
            >
              <Database className="h-4 w-4 mr-2" />
              Start Migration
            </Button>
          </div>

          {/* Integration Information */}
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure database integrations in the Integrations tab to enable migrations between different data sources.
              </p>
            </CardContent>
          </Card>

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
              <p className="text-xs text-muted-foreground mt-1">Choose the type of integration to migrate between</p>
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

            {/* Migration Options */}
            {selectedMigrationType && selectedSourceEnv && selectedTargetEnv && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Migration Details</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This will migrate all data and schema from the source to the destination integration.
                      The destination will be completely overwritten.
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Schema recreation with CASCADE drop</li>
                      <li>• Batch data migration (1000 rows per batch)</li>
                      <li>• Sequence reset for auto-increment fields</li>
                      <li>• Real-time console logging</li>
                    </ul>
                  </div>
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
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMigrationModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStartMigration} 
                disabled={isMigrating || !selectedSourceEnv || !selectedTargetEnv}
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Migration...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Start Migration
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Real-time Migration Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Database Migration Progress</DialogTitle>
            <DialogDescription>
              Real-time migration status with detailed progress tracking
            </DialogDescription>
          </DialogHeader>
          {migrationSessionId && (
            <MigrationProgress
              sessionId={migrationSessionId}
              onComplete={handleMigrationComplete}
              onError={handleMigrationError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}