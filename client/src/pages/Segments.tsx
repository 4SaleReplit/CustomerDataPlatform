
import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Play, Pause, Search, Filter, MoreHorizontal, Copy, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { trackBusinessEvent } from '@/lib/amplitude';

// Helper functions for dynamic operator selection based on data type
const getOperatorsForType = (dataType: string) => {
  const numericTypes = ['NUMBER', 'INTEGER', 'FLOAT', 'DECIMAL', 'DOUBLE'];
  const stringTypes = ['VARCHAR', 'TEXT', 'STRING', 'CHAR'];
  const dateTypes = ['DATE', 'TIMESTAMP', 'DATETIME'];
  
  if (numericTypes.some(type => dataType.toUpperCase().includes(type))) {
    return [
      { value: '>', label: '>' },
      { value: '<', label: '<' },
      { value: '=', label: '=' },
      { value: '!=', label: '!=' },
      { value: '>=', label: '>=' },
      { value: '<=', label: '<=' }
    ];
  } else if (stringTypes.some(type => dataType.toUpperCase().includes(type))) {
    return [
      { value: '=', label: '=' },
      { value: '!=', label: '!=' },
      { value: 'LIKE', label: 'Contains' },
      { value: 'NOT LIKE', label: 'Does not contain' },
      { value: 'IN', label: 'In list' },
      { value: 'NOT IN', label: 'Not in list' }
    ];
  } else if (dateTypes.some(type => dataType.toUpperCase().includes(type))) {
    return [
      { value: '>', label: 'After' },
      { value: '<', label: 'Before' },
      { value: '=', label: 'On' },
      { value: '>=', label: 'On or after' },
      { value: '<=', label: 'On or before' }
    ];
  } else {
    return [
      { value: '=', label: '=' },
      { value: '!=', label: '!=' }
    ];
  }
};

export default function Segments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    attribute: '',
    operator: '',
    value: ''
  });
  const [deleteSegmentId, setDeleteSegmentId] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Fetch segments from database
  const { data: segments = [], isLoading: segmentsLoading, refetch: refetchSegments } = useQuery({
    queryKey: ['/api/segments'],
    queryFn: () => apiRequest('/api/segments'),
  });

  // Fetch Snowflake schema for attribute dropdowns
  const { data: schemaData, isLoading: schemaLoading } = useQuery({
    queryKey: ['/api/snowflake/schema'],
    queryFn: () => apiRequest('/api/snowflake/schema'),
    staleTime: 1000 * 60 * 10, // Cache schema for 10 minutes
  });

  const availableColumns = schemaData?.columns || [];
  const selectedColumn = availableColumns.find((col: any) => col.name === selectedAttribute);
  const availableOperators = selectedColumn ? getOperatorsForType(selectedColumn.type) : [];

  // Get unique creators for filter
  const uniqueCreators = Array.from(new Set(segments.map((segment: any) => segment.createdBy).filter(Boolean)));

  // Create segment mutation
  const createSegmentMutation = useMutation({
    mutationFn: (segmentData: any) => apiRequest('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(segmentData)
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      toast({
        title: "Segment Created",
        description: "Segment tag has been created successfully.",
      });
      
      // Track segment creation in Amplitude
      trackBusinessEvent.segmentCreated(
        newSegment.name,
        newSegment.attribute,
        newSegment.operator
      );
      
      setIsCreateDialogOpen(false);
      setNewSegment({ name: '', description: '', attribute: '', operator: '', value: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create segment",
        variant: "destructive",
      });
    }
  });

  // Delete segment mutation
  const deleteSegmentMutation = useMutation({
    mutationFn: (segmentId: string) => apiRequest(`/api/segments/${segmentId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      toast({
        title: "Segment Deleted",
        description: "Segment tag has been deleted successfully.",
      });
      setDeleteSegmentId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete segment",
        variant: "destructive",
      });
    }
  });

  // Refresh segment mutation
  const refreshSegmentMutation = useMutation({
    mutationFn: (segmentId: string) => apiRequest(`/api/segments/${segmentId}/refresh`, {
      method: 'POST'
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      toast({
        title: "Segment Refreshed",
        description: `User count updated: ${data.userCount.toLocaleString()} users`,
      });
      
      // Track segment refresh in Amplitude
      trackBusinessEvent.segmentRefreshed(data.segment.id, data.userCount);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh segment",
        variant: "destructive",
      });
    }
  });

  // Filter and sort segments
  const filteredSegments = segments
    .filter((segment: any) => {
      const matchesSearch = segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (segment.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || segment.status === statusFilter;
      const matchesCreator = creatorFilter === 'all' || segment.createdBy === creatorFilter;
      return matchesSearch && matchesStatus && matchesCreator;
    })
    .sort((a: any, b: any) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
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
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredSegments.length / itemsPerPage);
  const paginatedSegments = filteredSegments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'calculating':
        return <Badge className="bg-yellow-100 text-yellow-800">Calculating</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateSegment = () => {
    if (!newSegment.name || !newSegment.attribute || !newSegment.operator || !newSegment.value) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    trackBusinessEvent.segmentCreated(newSegment.name, newSegment.attribute, newSegment.operator);

    // Build the SQL rule from the form inputs
    const rule = `${newSegment.attribute} ${newSegment.operator} ${
      newSegment.operator.includes('LIKE') ? `'%${newSegment.value}%'` : 
      isNaN(Number(newSegment.value)) ? `'${newSegment.value}'` : newSegment.value
    }`;

    const segmentData = {
      name: newSegment.name,
      description: newSegment.description,
      segmentType: 'behavioral',
      conditions: {
        attribute: newSegment.attribute,
        operator: newSegment.operator,
        value: newSegment.value,
        rule: rule
      },
      isActive: true,
      autoAssign: false
    };

    createSegmentMutation.mutate(segmentData);
  };

  const handleDeleteSegment = (segmentId: string) => {
    deleteSegmentMutation.mutate(segmentId);
  };

  const handleDuplicateSegment = (segment: any) => {
    const duplicatedSegment = {
      name: `${segment.name}_copy`,
      description: segment.description,
      attribute: segment.attribute,
      operator: segment.operator,
      value: segment.value,
      status: 'active',
      createdBy: 'Current User'
    };
    createSegmentMutation.mutate(duplicatedSegment);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Segment Tags</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Segment Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Segment Tag</DialogTitle>
              <DialogDescription>
                Define a new behavioral tag that will be computed for all users.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., is_top_lister"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment({...newSegment, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this tag represents..."
                  value={newSegment.description}
                  onChange={(e) => setNewSegment({...newSegment, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Attribute</Label>
                  <Select 
                    value={newSegment.attribute} 
                    onValueChange={(value) => {
                      setNewSegment({...newSegment, attribute: value, operator: '', value: ''});
                      setSelectedAttribute(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={schemaLoading ? "Loading..." : "Select attribute"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column: any) => (
                        <SelectItem key={column.name} value={column.name}>
                          {column.name} ({column.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select 
                    value={newSegment.operator} 
                    onValueChange={(value) => setNewSegment({...newSegment, operator: value})}
                    disabled={!selectedAttribute}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    placeholder="Value"
                    value={newSegment.value}
                    onChange={(e) => setNewSegment({...newSegment, value: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSegment}>
                Create Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search segment tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="calculating">Calculating</SelectItem>
                </SelectContent>
              </Select>
              <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {uniqueCreators.map(creator => (
                    <SelectItem key={creator} value={creator}>{creator}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="userCount-desc">Users High-Low</SelectItem>
                  <SelectItem value="userCount-asc">Users Low-High</SelectItem>
                  <SelectItem value="createdDate-desc">Newest First</SelectItem>
                  <SelectItem value="createdDate-asc">Oldest First</SelectItem>
                  <SelectItem value="updatedDate-desc">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments List */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Tags ({filteredSegments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                    Tag Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Description</th>
                  <th className="text-left py-3 px-4 font-medium">Rule</th>
                  <th className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50" onClick={() => handleSort('userCount')}>
                    Users {sortBy === 'userCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50" onClick={() => handleSort('createdAt')}>
                    Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-gray-50" onClick={() => handleSort('updatedAt')}>
                    Updated {sortBy === 'updatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Creator</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSegments.map((segment: any) => (
                  <tr key={segment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{segment.name}</td>
                    <td className="py-3 px-4 text-gray-600">{segment.description || '-'}</td>
                    <td className="py-3 px-4">
                      <code className="font-mono text-xs bg-gray-50 rounded px-2 py-1">
                        {segment.rule || `${segment.attribute} ${segment.operator} ${segment.value}`}
                      </code>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {segment.conditions?.userCount > 0 ? segment.conditions.userCount.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(segment.status || 'active')}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {segment.createdAt ? new Date(segment.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {segment.updatedAt ? new Date(segment.updatedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{segment.createdBy || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Link to={`/segments/${segment.id}`}>
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {segment.status === 'active' ? (
                          <Button variant="ghost" size="sm" title="Pause">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" title="Activate">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" title="More actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => refreshSegmentMutation.mutate(segment.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Refresh Count
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleDuplicateSegment(segment)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            
                            <Link to={`/segments/${segment.id}/edit`}>
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
                                  <AlertDialogTitle>Delete Segment Tag</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the segment tag "{segment.name}"? 
                                    This action cannot be undone and will remove the tag from all users.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteSegment(segment.id)}
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
    </div>
  );
}
