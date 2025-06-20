import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import { Search, Filter, Download, Eye, Hash, UserCheck, RefreshCw, ChevronLeft, ChevronRight, X, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { analytics } from '@/lib/amplitude';

function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userIdSearch, setUserIdSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchingIds, setIsSearchingIds] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [isUserIdPanelOpen, setIsUserIdPanelOpen] = useState(false);
  const queryClient = useQueryClient();

  // Track page visit on component mount
  React.useEffect(() => {
    analytics.screenViewed('Users');
  }, []);

  const usersPerPage = 20;

  // Initial load of 100 users for display with total count
  const { data: allUsersData, isLoading: allUsersLoading, refetch: refetchAllUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/all');
      return response;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });

  // Fetch users by specific IDs
  const { data: idSearchData, isLoading: idSearchLoading, refetch: refetchIdSearch } = useQuery({
    queryKey: ['users', 'by-ids', userIdSearch],
    queryFn: async () => {
      if (!userIdSearch.trim()) return null;
      
      const userIds = userIdSearch.split(',').map(id => id.trim()).filter(id => id);
      const response = await apiRequest('/api/users/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      return response;
    },
    enabled: false // Only run when manually triggered
  });

  // Execute user ID search
  const executeUserIdSearch = useCallback(async () => {
    if (!userIdSearch.trim()) return;
    
    setIsSearchingIds(true);
    try {
      const result = await refetchIdSearch();
      setSearchExecuted(true);
      setCurrentPage(1);
      analytics.buttonClicked('Search Users by IDs', 'Users', {
        searchTerm: userIdSearch,
        resultCount: result.data?.rows?.length || 0
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearchingIds(false);
    }
  }, [userIdSearch, refetchIdSearch]);

  // Handle refresh functionality
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Reset to normal view and clear search state
      setSearchExecuted(false);
      setUserIdSearch('');
      setCurrentPage(1);
      // Clear cache and refetch all users
      await apiRequest('/api/users/clear-cache', { method: 'POST' });
      await refetchAllUsers();
      analytics.buttonClicked('Refresh All Users', 'Users', { cached: true, page: currentPage });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Enter key press for ID search
  const handleUserIdKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userIdSearch.trim()) {
      e.preventDefault();
      executeUserIdSearch();
    }
  };

  // Determine which data to use
  const usersData = searchExecuted ? idSearchData : allUsersData;
  const usersLoading = searchExecuted ? idSearchLoading : allUsersLoading;

  // Convert user data to consistent format and sort by paid amount and listings
  const processedUsers = usersData?.rows ? 
    usersData.rows.map((row: any[]) => {
      const userObject: any = {};
      usersData.columns.forEach((col: any, index: number) => {
        userObject[col.name] = row[index];
      });
      return {
        id: userObject.USER_ID,
        ...userObject
      };
    }).sort((a: any, b: any) => {
      // Sort by total credits spent (descending), then by paid listings count (descending)
      const aCredits = parseFloat(a.TOTAL_CREDITS_SPENT || 0);
      const bCredits = parseFloat(b.TOTAL_CREDITS_SPENT || 0);
      if (aCredits !== bCredits) {
        return bCredits - aCredits;
      }
      const aPaidListings = parseInt(a.PAID_LISTINGS_COUNT || 0);
      const bPaidListings = parseInt(b.PAID_LISTINGS_COUNT || 0);
      return bPaidListings - aPaidListings;
    }) : [];

  const filteredUsers = processedUsers.filter((user: any) => {
    // Search functionality for general search term
    const searchableFields = [
      user.USER_ID,
      user.PHONE,
      user.USER_TYPE
    ].filter(Boolean).map(field => String(field).toLowerCase());
    
    const matchesSearch = !searchTerm || searchableFields.some(field => 
      field.includes(searchTerm.toLowerCase())
    );
    
    const matchesType = userTypeFilter === 'all' || 
      (user.USER_TYPE && user.USER_TYPE.toLowerCase() === userTypeFilter);
    
    const matchesStatus = statusFilter === 'all' || 
      (user.IS_BLOCK === '0' ? 'active' : 'blocked') === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination - 20 users per page for both normal view and search results
  let totalPages, currentUsers;
  
  if (searchExecuted) {
    // Use client-side pagination for ID search results
    totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    currentUsers = filteredUsers.slice(startIndex, endIndex);
  } else {
    // For all users mode, paginate the 100 fetched users (20 per page = 5 pages)
    totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    currentUsers = filteredUsers.slice(startIndex, endIndex);
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const exportUsers = useCallback(() => {
    if (!currentUsers.length) return;
    
    // Create CSV content
    const headers = ['User ID', 'Phone', 'Type', 'Paid Listings', 'Free Listings', 'Total Listings', 'Office Listings'];
    const csvContent = [
      headers.join(','),
      ...currentUsers.map((user: any) => [
        user.USER_ID || '',
        user.PHONE || '',
        user.USER_TYPE || '',
        user.PAID_LISTINGS_COUNT || 0,
        user.FREE_LISTINGS_COUNT || 0,
        user.TOTAL_LISTINGS_COUNT || 0,
        user.OFFICE_LISTINGS_COUNT || 0
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    analytics.buttonClicked('Export Users CSV', 'Users', { count: currentUsers.length });
  }, [currentUsers]);

  if (usersLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* User ID Search Side Panel */}
      {isUserIdPanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsUserIdPanelOpen(false)} />
          <div className="relative bg-white w-80 shadow-lg">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Search with User ID(s)</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUserIdPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">User IDs</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Enter user IDs separated by commas..."
                    value={userIdSearch}
                    onChange={(e) => setUserIdSearch(e.target.value)}
                    onKeyDown={handleUserIdKeyPress}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Example: 123456, 789012, 654321
                </p>
              </div>
              <Button
                variant="default"
                onClick={() => {
                  executeUserIdSearch();
                  setIsUserIdPanelOpen(false);
                }}
                disabled={!userIdSearch.trim() || isSearchingIds}
                className="w-full"
              >
                {isSearchingIds ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search Snowflake
              </Button>
              {searchExecuted && idSearchData && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Found {idSearchData.rows.length} user(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportUsers} disabled={!currentUsers.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Data Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {!searchExecuted && usersData?.cached && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Cached Data
                </Badge>
                {usersData?.totalCount && (
                  <Badge variant="outline" className="text-xs">
                    Sample of {usersData.totalCount.toLocaleString()} users
                  </Badge>
                )}
              </div>
            )}
            {searchExecuted && idSearchData && (
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  Search Results
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {idSearchData.rows.length} users found
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* General Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by User ID, Phone, or Type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsUserIdPanelOpen(true)}
              >
                <Hash className="h-4 w-4 mr-1" />
                Search with ID
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle>
                {searchExecuted && searchTerm ? 'Search Results' : 'Users'} 
                ({!searchExecuted && usersData?.totalCount ? 
                  `${usersData.displayedCount} of ${usersData.totalCount.toLocaleString()} total` : 
                  `${filteredUsers.length} total`
                })
              </CardTitle>
              {isSearchingIds && (
                <Badge variant="secondary" className="animate-pulse">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Searching...
                </Badge>
              )}
              {!isSearchingIds && searchExecuted && (
                <Badge variant="default">
                  {filteredUsers.length} found
                </Badge>
              )}
              {!searchExecuted && searchTerm && (
                <Badge variant="outline">
                  Click "Search" to execute
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Showing {currentUsers.length} of {filteredUsers.length} users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">User ID</th>
                  <th className="text-left py-3 px-4 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Paid Listings</th>
                  <th className="text-left py-3 px-4 font-medium">Free Listings</th>
                  <th className="text-left py-3 px-4 font-medium">Total Listings</th>
                  <th className="text-left py-3 px-4 font-medium">Office Listings</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-mono text-sm">{user.USER_ID}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.PHONE || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={user.USER_TYPE === 'premium' ? 'default' : 'secondary'}>
                          {user.USER_TYPE || 'Normal'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{user.PAID_LISTINGS_COUNT || 0}</td>
                      <td className="py-3 px-4">{user.FREE_LISTINGS_COUNT || 0}</td>
                      <td className="py-3 px-4">{user.TOTAL_LISTINGS_COUNT || 0}</td>
                      <td className="py-3 px-4">{user.OFFICE_LISTINGS_COUNT || 0}</td>
                      <td className="py-3 px-4">
                        <Link href={`/users/${user.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {searchExecuted ? 'No users found matching your search criteria.' : 'No users available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}

export default Users;