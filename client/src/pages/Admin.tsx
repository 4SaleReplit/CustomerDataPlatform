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

interface MigrationHistory {
  id: string;
  sourceIntegrationId: string;
  targetIntegrationId: string;
  sourceIntegrationName?: string;
  targetIntegrationName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalItems: number;
  completedItems: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export default function AdminClean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [newMember, setNewMember] = useState<InvitationData>({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    message: ''
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [selectedSourceEnv, setSelectedSourceEnv] = useState('');
  const [selectedTargetEnv, setSelectedTargetEnv] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  // API Queries
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery({
    queryKey: ['/api/team']
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['/api/roles']
  });

  const { data: integrations = [], isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['/api/integrations']
  });

  const { data: migrationHistory = [], isLoading: isLoadingMigrations } = useQuery({
    queryKey: ['/api/migration-history']
  });

  // Mutations
  const createTeamMemberMutation = useMutation({
    mutationFn: (data: InvitationData) => apiRequest('/api/team/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      setShowInviteModal(false);
      setNewMember({ email: '', firstName: '', lastName: '', role: '', message: '' });
      toast({
        title: "Team member invited",
        description: "Invitation sent successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to invite team member",
        variant: "destructive"
      });
    }
  });

  const sendInvitationMutation = useMutation({
    mutationFn: (data: InvitationData) => createTeamMemberMutation.mutateAsync(data),
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The team member has been invited successfully"
      });
    }
  });

  // Handlers
  const handleInviteMember = () => {
    if (!newMember.email || !newMember.firstName || !newMember.lastName || !newMember.role) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    createTeamMemberMutation.mutate(newMember);
  };

  const handleStartMigration = async () => {
    if (!selectedSourceEnv || !selectedTargetEnv) {
      toast({
        title: "Migration error",
        description: "Please select both source and target integrations",
        variant: "destructive"
      });
      return;
    }

    setIsMigrating(true);
    try {
      await apiRequest('/api/start-migration', {
        method: 'POST',
        body: JSON.stringify({
          sourceIntegrationId: selectedSourceEnv,
          targetIntegrationId: selectedTargetEnv
        })
      });
      
      setShowMigrationModal(false);
      queryClient.invalidateQueries({ queryKey: ['/api/migration-history'] });
      toast({
        title: "Migration started",
        description: "The migration process has been initiated"
      });
    } catch (error: any) {
      toast({
        title: "Migration failed",
        description: error.message || "Failed to start migration",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your team, roles, and system settings</p>
          </div>
        </div>

        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="migrations">Migrations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Team Members</h2>
                <p className="text-sm text-muted-foreground">Manage team members and their permissions</p>
              </div>
              <Button onClick={() => setShowInviteModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>

            {/* Team Members List */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members ({(teamMembers as any[])?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTeam ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (teamMembers as any[])?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No team members found. Invite your first team member to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(teamMembers as TeamMember[]).map((member: TeamMember) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{member.role}</Badge>
                          <Badge className={member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Management Tab */}
          <TabsContent value="roles" className="space-y-6">
            <RoleManagement />
          </TabsContent>

          {/* Migrations Tab */}
          <TabsContent value="migrations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Database Migration</h2>
                <p className="text-sm text-muted-foreground">Migrate data between different database integrations</p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => setShowMigrationModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Target className="h-4 w-4 mr-2" />
                  Start Migration
                </Button>
              </div>
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
                    {(migrationHistory as MigrationHistory[]).map((migration: MigrationHistory) => (
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">System Settings</h2>
              <p className="text-sm text-muted-foreground">Configure system-wide settings and preferences</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  System settings will be configured here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite Member Modal */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to a new team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newMember.firstName}
                    onChange={(e) => setNewMember(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newMember.lastName}
                    onChange={(e) => setNewMember(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@company.com"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(roles as Role[]).map((role: Role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Custom Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={newMember.message}
                  onChange={(e) => setNewMember(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Welcome to our team!"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember} disabled={createTeamMemberMutation.isPending}>
                {createTeamMemberMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Migration Modal */}
        <Dialog open={showMigrationModal} onOpenChange={setShowMigrationModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Database Migration</DialogTitle>
              <DialogDescription>
                Migrate data and schema between integrations
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
                      {(integrations as any[]).filter((i: any) => i.type === 'postgresql').map((integration: any) => (
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
                      {(integrations as any[]).filter((i: any) => i.type === 'postgresql' && i.id !== selectedSourceEnv).map((integration: any) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          {integration.name} ({integration.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      </div>
    </div>
  );
}