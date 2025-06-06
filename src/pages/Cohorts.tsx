import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, RefreshCw, Filter, SortAsc, SortDesc, MoreHorizontal, Copy } from 'lucide-react';
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

// Mock cohort data
const mockCohorts = [
  {
    id: 1,
    name: 'Premium Users',
    description: 'Users with premium account type',
    userCount: 15234,
    createdDate: '2024-05-15',
    updatedDate: '2024-05-28',
    creator: 'John Smith',
    status: 'active',
    syncStatus: 'synced'
  },
  {
    id: 2,
    name: 'Active Listers',
    description: 'Users who posted listings in the last 30 days',
    userCount: 8976,
    createdDate: '2024-05-20',
    updatedDate: '2024-06-01',
    creator: 'Sarah Wilson',
    status: 'active',
    syncStatus: 'pending'
  },
  {
    id: 3,
    name: 'High Value Customers',
    description: 'Users with CLTV > $500',
    userCount: 3421,
    createdDate: '2024-05-25',
    updatedDate: '2024-06-02',
    creator: 'Mike Johnson',
    status: 'calculating',
    syncStatus: 'not_synced'
  },
  {
    id: 4,
    name: 'Electronics Enthusiasts',
    description: 'Users primarily listing in Electronics category',
    userCount: 12567,
    createdDate: '2024-05-10',
    updatedDate: '2024-05-15',
    creator: 'Emily Davis',
    status: 'active',
    syncStatus: 'synced'
  },
  // Add more mock data for pagination testing
  {
    id: 5,
    name: 'Mobile App Users',
    description: 'Users who primarily use mobile app',
    userCount: 22450,
    createdDate: '2024-04-20',
    updatedDate: '2024-05-30',
    creator: 'Alex Chen',
    status: 'active',
    syncStatus: 'synced'
  },
  {
    id: 6,
    name: 'Frequent Buyers',
    description: 'Users with 5+ purchases in last 90 days',
    userCount: 6789,
    createdDate: '2024-04-15',
    updatedDate: '2024-05-25',
    creator: 'Lisa Wang',
    status: 'paused',
    syncStatus: 'pending'
  }
];

export default function Cohorts() {
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

  // Filter cohorts
  const filteredCohorts = mockCohorts.filter(cohort => {
    const matchesSearch = cohort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cohort.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cohort.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cohort.status === statusFilter;
    const matchesSyncStatus = syncStatusFilter === 'all' || cohort.syncStatus === syncStatusFilter;
    
    return matchesSearch && matchesStatus && matchesSyncStatus;
  });

  // Sort cohorts
  const sortedCohorts = [...filteredCohorts].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'userCount':
        aValue = a.userCount;
        bValue = b.userCount;
        break;
      case 'createdDate':
        aValue = new Date(a.createdDate);
        bValue = new Date(b.createdDate);
        break;
      case 'updatedDate':
        aValue = new Date(a.updatedDate);
        bValue = new Date(b.updatedDate);
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

  const handleDeleteCohort = (cohortId: number) => {
    console.log('Deleting cohort:', cohortId);
    // Here you would typically call an API to delete the cohort
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Cohorts</h1>
        <Link to="/cohorts/new">
          <Button>
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
                    onClick={() => handleSort('createdDate')}
                  >
                    <div className="flex items-center gap-2">
                      Created At
                      {getSortIcon('createdDate')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('updatedDate')}
                  >
                    <div className="flex items-center gap-2">
                      Updated At
                      {getSortIcon('updatedDate')}
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
                    <td className="py-3 px-4 text-gray-600">{cohort.description}</td>
                    <td className="py-3 px-4 font-medium">{cohort.userCount.toLocaleString()}</td>
                    <td className="py-3 px-4">{getStatusBadge(cohort.status)}</td>
                    <td className="py-3 px-4">{getSyncStatusBadge(cohort.syncStatus)}</td>
                    <td className="py-3 px-4 text-gray-600">{cohort.createdDate}</td>
                    <td className="py-3 px-4 text-gray-600">{cohort.updatedDate}</td>
                    <td className="py-3 px-4 text-gray-600">{cohort.creator}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link to={`/cohorts/${cohort.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
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
                                    onClick={() => handleDeleteCohort(cohort.id)}
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
