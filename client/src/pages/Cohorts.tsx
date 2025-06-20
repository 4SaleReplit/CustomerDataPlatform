import React, { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/lib/amplitude';
import { Plus, Eye, Edit, Trash2, RefreshCw, Filter, SortAsc, SortDesc, MoreHorizontal, Copy, BarChart3 } from 'lucide-react';
import amplitudeLogo from '@assets/AMPL_1749419466685.png';
import brazeLogo from '@assets/BRZE_1749419981281.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  conditions: any;
  userCount: number | null;
  status: string;
  syncStatus: string;
  calculationQuery: string | null;
  lastCalculatedAt: string | null;
  calculationError: string | null;
  autoRefresh: boolean;
  refreshFrequencyHours: number;
  nextRefreshAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  brazeLastSyncedAt: string | null;
  brazeSegmentId: string | null;
  brazeSyncStatus: string;
}



function Cohorts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicatingCohort, setDuplicatingCohort] = useState<any>(null);
  const [newCohortName, setNewCohortName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track page visit on component mount
  React.useEffect(() => {
    analytics.screenViewed('Cohorts');
  }, []);

  // Fetch cohorts from database
  const { data: cohorts = [], isLoading, error } = useQuery({
    queryKey: ['/api/cohorts'],
    queryFn: () => apiRequest('/api/cohorts'),
  });

  // Delete cohort function
  const deleteCohort = async (cohortId: string, cohortName?: string) => {
    try {
      await apiRequest(`/api/cohorts/${cohortId}`, { method: 'DELETE' });
      if (cohortName) {
        analytics.cohortDeleted(cohortId, cohortName, 0); // We don't have user count for deleted cohorts
      }
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts'] });
      toast({
        title: "Cohort deleted",
        description: "The cohort has been successfully deleted."
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the cohort. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Sync to Amplitude function
  const syncToAmplitude = async (cohortId: string, cohortName: string) => {
    try {
      const response = await apiRequest(`/api/cohorts/${cohortId}/sync-amplitude`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: "data-team@yourcompany.com" })
      });
      
      analytics.cohortSynced(cohortId, cohortName, 'Amplitude', response.syncedUserCount || 0);
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts'] });
      toast({
        title: "Sync successful",
        description: `Cohort "${cohortName}" synced to Amplitude with ${response.syncedUserCount} users.`
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync cohort to Amplitude. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Sync to Braze function
  const syncToBraze = async (cohortId: string, cohortName: string) => {
    try {
      const response = await apiRequest(`/api/cohorts/${cohortId}/sync-braze`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      analytics.cohortSynced(cohortId, cohortName, 'Braze', response.syncedUserCount || 0);
      queryClient.invalidateQueries({ queryKey: ['/api/cohorts'] });
      toast({
        title: "Sync successful",
        description: `Cohort "${cohortName}" synced to Braze with ${response.syncedUserCount} users.`
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync cohort to Braze. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter cohorts
  const filteredCohorts = cohorts.filter((cohort: Cohort) => {
    const matchesSearch = cohort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cohort.description && cohort.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || cohort.status === statusFilter;
    const matchesSyncStatus = syncStatusFilter === 'all' || cohort.syncStatus === syncStatusFilter;
    
    return matchesSearch && matchesStatus && matchesSyncStatus;
  });

  // Sort cohorts
  const sortedCohorts = [...filteredCohorts].sort((a: Cohort, b: Cohort) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'userCount':
        aValue = a.userCount || 0;
        bValue = b.userCount || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate cohorts
  const totalPages = Math.ceil(sortedCohorts.length / itemsPerPage);
  const paginatedCohorts = sortedCohorts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'calculating':
        return <Badge className="bg-yellow-100 text-yellow-800">Calculating</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Synced</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'not_synced':
        return <Badge variant="outline">Not Synced</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDuplicateCohort = (cohort: any) => {
    setDuplicatingCohort(cohort);
    setNewCohortName(`${cohort.name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const confirmDuplicate = () => {
    if (duplicatingCohort && newCohortName.trim()) {
      console.log('Creating duplicate cohort:', {
        ...duplicatingCohort,
        name: newCohortName,
        id: Date.now() // Generate new ID
      });
      // Here you would typically call an API to create the duplicate cohort
      setDuplicateDialogOpen(false);
      setDuplicatingCohort(null);
      setNewCohortName('');
    }
  };

  const handleDeleteCohort = (cohortId: string, cohortName: string) => {
    deleteCohort(cohortId, cohortName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Cohorts</h1>
        <Link to="/cohorts/new">
          <Button onClick={() => analytics.buttonClicked('Create Cohort', 'Cohorts', { 
            action: 'navigate_to_create',
            destination: '/cohorts/new'
          })}>
            <Plus className="mr-2 h-4 w-4" />
            Create Cohort
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search cohorts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="calculating">Calculating</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={syncStatusFilter} onValueChange={setSyncStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sync Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sync Status</SelectItem>
                  <SelectItem value="synced">Synced</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="not_synced">Not Synced</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                analytics.buttonClicked('Clear Filters', 'Cohorts', {
                  action: 'clear_filters',
                  filters_cleared: ['search', 'status', 'sync_status']
                });
                setSearchTerm('');
                setStatusFilter('all');
                setSyncStatusFilter('all');
                setCurrentPage(1);
              }}>
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cohorts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Cohorts ({filteredCohorts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Description</th>
                  <th 
                    className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('userCount')}
                  >
                    <div className="flex items-center gap-2">
                      Users
                      {getSortIcon('userCount')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Sync Status</th>
                  <th 
                    className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Created At
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center gap-2">
                      Updated At
                      {getSortIcon('updatedAt')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Creator</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCohorts.map((cohort) => (
                  <tr key={cohort.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{cohort.name}</td>
                    <td className="py-3 px-4 text-gray-600">{cohort.description || '-'}</td>
                    <td className="py-3 px-4 font-medium">{cohort.userCount ? cohort.userCount.toLocaleString() : '-'}</td>
                    <td className="py-3 px-4">{getStatusBadge(cohort.status)}</td>
                    <td className="py-3 px-4">{getSyncStatusBadge(cohort.syncStatus)}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(cohort.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(cohort.updatedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-600">{cohort.createdBy || 'System'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link to={`/cohorts/${cohort.id}`}>
                          <Button variant="ghost" size="sm" onClick={() => analytics.buttonClicked('View Cohort', 'Cohorts', {
                            action: 'view_cohort',
                            cohort_id: cohort.id,
                            cohort_name: cohort.name,
                            cohort_status: cohort.status
                          })}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            analytics.buttonClicked('Sync to Amplitude', 'Cohorts', {
                              action: 'sync_amplitude',
                              cohort_id: cohort.id,
                              cohort_name: cohort.name,
                              sync_status: cohort.syncStatus,
                              is_resync: cohort.syncStatus === 'synced'
                            });
                            syncToAmplitude(cohort.id, cohort.name);
                          }}
                          title={cohort.syncStatus === 'synced' ? 'Re-sync to Amplitude' : 'Sync to Amplitude'}
                          className={cohort.syncStatus === 'synced' ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'}
                        >
                          <img 
                            src={amplitudeLogo} 
                            alt="Amplitude" 
                            className="h-6 w-6 rounded-full"
                          />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            analytics.buttonClicked('Sync to Braze', 'Cohorts', {
                              action: 'sync_braze',
                              cohort_id: cohort.id,
                              cohort_name: cohort.name,
                              braze_sync_status: cohort.brazeSyncStatus,
                              is_resync: cohort.brazeSyncStatus === 'synced'
                            });
                            syncToBraze(cohort.id, cohort.name);
                          }}
                          title={cohort.brazeSyncStatus === 'synced' ? 'Re-sync to Braze' : 'Sync to Braze'}
                          className={cohort.brazeSyncStatus === 'synced' ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}
                        >
                          <img 
                            src={brazeLogo} 
                            alt="Braze" 
                            className="h-6 w-6 rounded-full"
                          />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => syncToAmplitude(cohort.id, cohort.name)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync to Amplitude
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => syncToBraze(cohort.id, cohort.name)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync to Braze
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleDuplicateCohort(cohort)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            
                            <Link to={`/cohorts/${cohort.id}/edit`}>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Cohort</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the cohort "{cohort.name}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCohort(cohort.id, cohort.name)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Cohort Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Cohort</DialogTitle>
            <DialogDescription>
              Enter a name for the new cohort. All settings from "{duplicatingCohort?.name}" will be copied.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                className="col-span-3"
                placeholder="Enter cohort name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDuplicate} disabled={!newCohortName.trim()}>
              Create Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Memoize Cohorts component to prevent unnecessary re-renders during navigation
export default React.memo(Cohorts);
