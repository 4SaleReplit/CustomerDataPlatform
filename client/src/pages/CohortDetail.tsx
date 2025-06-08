import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Edit, Users, Calendar, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import amplitudeLogo from '@assets/AMPL_1749419466685.png';
import brazeLogo from '@assets/BRZE_1749419981281.png';

export default function CohortDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    autoRefresh: true,
    refreshFrequencyHours: 24
  });

  // Fetch cohort data from API
  const { data: cohort, isLoading, error } = useQuery({
    queryKey: ['/api/cohorts', id],
    queryFn: () => apiRequest(`/api/cohorts/${id}`),
    enabled: !!id
  });

  // Update form when cohort data loads
  React.useEffect(() => {
    if (cohort) {
      setEditForm({
        name: cohort.name || '',
        description: cohort.description || '',
        autoRefresh: cohort.autoRefresh ?? true,
        refreshFrequencyHours: cohort.refreshFrequencyHours || 24
      });
    }
  }, [cohort]);

  // Sync to Amplitude
  const syncToAmplitude = async () => {
    try {
      const response = await apiRequest(`/api/cohorts/${id}/sync-amplitude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: "data-team@yourcompany.com" })
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts', id] });
      toast({
        title: "Sync successful",
        description: `Cohort synced to Amplitude with ${response.syncedUserCount} users.`
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync cohort to Amplitude. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Sync to Braze
  const syncToBraze = async () => {
    try {
      const response = await apiRequest(`/api/cohorts/${id}/sync-braze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts', id] });
      toast({
        title: "Sync successful",
        description: `Cohort synced to Braze with ${response.syncedUserCount} users.`
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync cohort to Braze. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Refresh cohort user count
  const refreshUserCount = async () => {
    try {
      const response = await apiRequest(`/api/cohorts/${id}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts', id] });
      toast({
        title: "Refresh successful",
        description: `Cohort user count updated: ${response.userCount.toLocaleString()} users.`
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh cohort user count. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save cohort updates
  const handleSave = async () => {
    try {
      await apiRequest(`/api/cohorts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts', id] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Cohort updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update cohort.",
        variant: "destructive"
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { text: 'Active', className: 'bg-green-100 text-green-800' },
      'draft': { text: 'Draft', className: 'bg-gray-100 text-gray-800' },
      'calculating': { text: 'Calculating', className: 'bg-blue-100 text-blue-800' },
      'error': { text: 'Error', className: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['draft'];
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  // Get sync status badge
  const getSyncStatusBadge = (status: string) => {
    const statusConfig = {
      'synced': { text: 'Synced', className: 'bg-green-100 text-green-800' },
      'pending': { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      'not_synced': { text: 'Not Synced', className: 'bg-gray-100 text-gray-800' },
      'error': { text: 'Error', className: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['not_synced'];
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/cohorts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cohorts
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">Loading cohort details...</div>
        </div>
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/cohorts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cohorts
              </Button>
            </Link>
          </div>
          <div className="text-center py-12 text-red-600">
            Error loading cohort: {error?.message || 'Cohort not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/cohorts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cohorts
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="text-2xl font-bold border-none p-0 h-auto"
                  />
                ) : (
                  cohort.name
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="mt-2"
                    placeholder="Cohort description..."
                  />
                ) : (
                  cohort.description || 'No description provided'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Sync buttons */}
            <Button
              onClick={syncToAmplitude}
              className="flex items-center gap-2"
              variant="outline"
            >
              <img src={amplitudeLogo} alt="Amplitude" className="h-5 w-5 rounded-full" />
              Sync to Amplitude
            </Button>
            
            <Button
              onClick={syncToBraze}
              className="flex items-center gap-2"
              variant="outline"
            >
              <img src={brazeLogo} alt="Braze" className="h-5 w-5 rounded-full" />
              Sync to Braze
            </Button>
            
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Cohort
              </Button>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Cohort details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cohort Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {cohort.userCount ? cohort.userCount.toLocaleString() : '-'}
                    </div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">{getStatusBadge(cohort.status)}</div>
                    <div className="text-sm text-gray-600 mt-1">Status</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">{getSyncStatusBadge(cohort.syncStatus)}</div>
                    <div className="text-sm text-gray-600 mt-1">Amplitude Sync</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold">{getSyncStatusBadge(cohort.brazeSyncStatus || 'not_synced')}</div>
                    <div className="text-sm text-gray-600 mt-1">Braze Sync</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings card */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Cohort Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoRefresh">Auto Refresh</Label>
                      <p className="text-sm text-gray-600">Automatically recalculate cohort users</p>
                    </div>
                    <input
                      type="checkbox"
                      id="autoRefresh"
                      checked={editForm.autoRefresh}
                      onChange={(e) => setEditForm({...editForm, autoRefresh: e.target.checked})}
                      className="h-4 w-4"
                    />
                  </div>
                  
                  {editForm.autoRefresh && (
                    <div>
                      <Label htmlFor="refreshFrequency">Refresh Frequency (hours)</Label>
                      <Input
                        type="number"
                        id="refreshFrequency"
                        value={editForm.refreshFrequencyHours}
                        onChange={(e) => setEditForm({...editForm, refreshFrequencyHours: parseInt(e.target.value) || 24})}
                        min="1"
                        max="168"
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Metadata and actions */}
          <div className="space-y-6">
            {/* Metadata card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{new Date(cohort.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated</span>
                  <span className="font-medium">{new Date(cohort.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created by</span>
                  <span className="font-medium">{cohort.createdBy || 'System'}</span>
                </div>
                {cohort.lastCalculatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Calculated</span>
                    <span className="font-medium">{new Date(cohort.lastCalculatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sync status card */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amplitude</span>
                  {getSyncStatusBadge(cohort.syncStatus)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Braze</span>
                  {getSyncStatusBadge(cohort.brazeSyncStatus || 'not_synced')}
                </div>
                {cohort.lastSyncedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Synced</span>
                    <span className="font-medium text-sm">{new Date(cohort.lastSyncedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}