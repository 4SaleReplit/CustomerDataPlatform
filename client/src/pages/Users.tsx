
import React, { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { Search, Filter, Download, Eye, Hash, UserCheck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchingIds, setIsSearchingIds] = useState(false);
  const [searchMode, setSearchMode] = useState<'all' | 'ids'>('all');
  const [searchExecuted, setSearchExecuted] = useState(false);
  const queryClient = useQueryClient();

  // Track page visit on component mount
  React.useEffect(() => {
    analytics.screenViewed('Users');
  }, []);

  const usersPerPage = 10;

  // Fetch 100 users for display with total count
  const { data: allUsersData, isLoading: allUsersLoading, refetch: refetchAllUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/all');
      return response;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    enabled: searchMode === 'all'
  });

  // Fetch users by specific IDs
  const { data: idSearchData, isLoading: idSearchLoading, refetch: refetchIdSearch } = useQuery({
    queryKey: ['users', 'by-ids', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return null;
      
      // Parse comma-separated user IDs
      const userIds = searchTerm.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
      
      if (userIds.length === 0) return null;

      const response = await apiRequest('/api/users/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      return response;
    },
    enabled: false, // Disable automatic execution
    staleTime: 1000 * 60 * 5, // 5 minutes for ID searches
  });

  // Execute user ID search
  const executeUserIdSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearchingIds(true);
    setSearchExecuted(true);
    
    try {
      await refetchIdSearch();
      analytics.buttonClicked('Search User IDs', 'Users', { 
        searchTerm,
        userIdCount: searchTerm.split(',').length 
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearchingIds(false);
    }
  };

  // Handle Enter key press for ID search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchMode === 'ids' && searchTerm.trim()) {
      e.preventDefault();
      executeUserIdSearch();
    }
  };

  // Handle search mode changes
  const handleSearchModeChange = (mode: 'all' | 'ids') => {
    setSearchMode(mode);
    setSearchTerm('');
    setSearchExecuted(false);
    setCurrentPage(1);
    analytics.buttonClicked(`Switch to ${mode === 'all' ? 'All Users' : 'ID Search'}`, 'Users');
  };

  // Determine which data to use
  const usersData = searchMode === 'ids' ? idSearchData : allUsersData;
  const usersLoading = searchMode === 'ids' ? idSearchLoading : allUsersLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (searchMode === 'all') {
        // Clear cache and refetch all users
        await apiRequest('/api/users/clear-cache', { method: 'POST' });
        await refetchAllUsers();
        analytics.buttonClicked('Refresh All Users', 'Users', { cached: true, page: currentPage });
      } else {
        await refetchIdSearch();
        analytics.buttonClicked('Refresh ID Search', 'Users', { searchTerm });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Process and filter users data
  const processedUsers = usersData?.success && usersData?.rows ? 
    usersData.rows.map((row: any[], index: number) => {
      const columns = usersData.columns || [];
      const userObject: any = {};
      
      columns.forEach((col: any, colIndex: number) => {
        userObject[col.name] = row[colIndex];
      });
      
      return {
        id: index + 1,
        ...userObject
      };
    }) : [];

  const filteredUsers = processedUsers.filter((user: any) => {
    // Skip text search if we're in ID search mode
    if (searchMode === 'ids') {
      return true; // Show all results from ID search
    }
    
    const searchableFields = [
      user.USER_ID,
      user.EMAIL,
      user.PHONE_NUMBER,
      user.USER_TYPE
    ].filter(Boolean).map(field => String(field).toLowerCase());
    
    const matchesSearch = !searchTerm || searchableFields.some(field => 
      field.includes(searchTerm.toLowerCase())
    );
    
    const matchesType = userTypeFilter === 'all' || 
      (user.USER_TYPE && user.USER_TYPE.toLowerCase() === userTypeFilter);
    
    return matchesSearch && matchesType;
  });

  // Pagination - simplified for 100 user display and ID search
  let totalPages, currentUsers;
  
  if (searchMode === 'all') {
    // For all users mode, show all 100 fetched users without pagination
    totalPages = 1;
    currentUsers = processedUsers;
  } else {
    // Use client-side pagination for ID search results
    totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    currentUsers = filteredUsers.slice(startIndex, endIndex);
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getUserTypeBadge = (type: string) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'premium':
      case 'vip':
        return <Badge className="bg-blue-100 text-blue-800">Premium</Badge>;
      case 'regular':
      case 'standard':
        return <Badge variant="outline">Regular</Badge>;
      case 'lister':
        return <Badge className="bg-purple-100 text-purple-800">Lister</Badge>;
      case 'browser':
        return <Badge className="bg-green-100 text-green-800">Browser</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num: any) => {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num === 'number') return num.toLocaleString();
    return String(num);
  };

  if (usersLoading || isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading users from Snowflake...
        </div>
      </div>
    );
  }

  if (!usersData?.success) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load users</div>
          <div className="text-sm text-gray-500">{usersData?.error || 'Unknown error'}</div>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">User Explorer</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
        </div>
      </div>

      {/* Search Mode Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Search Mode:</span>
            <div className="flex gap-2">
              <Button
                variant={searchMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSearchModeChange('all')}
              >
                All Users (Cached)
              </Button>
              <Button
                variant={searchMode === 'ids' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSearchModeChange('ids')}
              >
                <Hash className="h-4 w-4 mr-1" />
                Search by User IDs
              </Button>
            </div>
            {usersData?.cached && (
              <div className="flex items-center gap-2 ml-auto">
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
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={searchMode === 'ids' 
                      ? "Enter user IDs separated by commas (e.g., 12345, 67890, 54321)..." 
                      : "Search by email, name, or user ID..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pl-10"
                  />
                </div>
                {searchMode === 'ids' ? (
                  <Button
                    variant="default"
                    onClick={executeUserIdSearch}
                    disabled={!searchTerm.trim() || isSearchingIds}
                  >
                    {isSearchingIds ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search
                  </Button>
                ) : (
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
                )}
              </div>
              {searchMode === 'ids' && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter specific user IDs separated by commas (e.g., 12345, 67890) and click Search to query Snowflake
                </p>
              )}
            </div>
            
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="lister">Lister</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle>
                {searchMode === 'ids' && searchTerm ? 'Search Results' : 'Users'} 
                ({searchMode === 'all' && usersData?.totalCount ? 
                  `${usersData.displayedCount} of ${usersData.totalCount.toLocaleString()} total` : 
                  `${filteredUsers.length} total`
                })
              </CardTitle>
              {searchMode === 'ids' && isSearchingIds && (
                <Badge variant="secondary" className="animate-pulse">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Searching...
                </Badge>
              )}
              {searchMode === 'ids' && !isSearchingIds && searchExecuted && (
                <Badge variant="default">
                  {filteredUsers.length} found
                </Badge>
              )}
              {searchMode === 'ids' && !searchExecuted && searchTerm && (
                <Badge variant="outline">
                  Click "Search Users" to execute
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
                  <th className="text-left py-3 px-4 font-medium">Total Credits Spent</th>
                  <th className="text-left py-3 px-4 font-medium">Premium Credits Spent</th>
                  <th className="text-left py-3 px-4 font-medium">Free Credits Spent</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm font-mono">
                        <Hash className="mr-1 h-3 w-3 text-gray-400" />
                        {user.USER_ID || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{user.PHONE || user.PHONE_NUMBER}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getUserTypeBadge(user.USER_TYPE)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{formatNumber(user.PAID_LISTINGS_COUNT)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{formatNumber(user.FREE_LISTINGS_COUNT)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{formatNumber(user.TOTAL_LISTINGS_COUNT)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{formatNumber(user.OFFICE_LISTINGS_COUNT)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{formatNumber(user.TOTAL_CREDITS_SPENT)} KWD</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{formatNumber(user.TOTAL_PREMIUM_CREDITS_SPENT)} KWD</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-600">{formatNumber(user.TOTAL_FREE_CREDITS_SPENT)} KWD</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link 
                        to={`/users/${user.USER_ID || user.id}`}
                        onClick={() => analytics.userProfileViewed(String(user.USER_ID || user.id), 'Overview', 'Users')}
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
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
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 
                      ? i + 1 
                      : currentPage >= totalPages - 2 
                        ? totalPages - 4 + i 
                        : currentPage - 2 + i;
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-9"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
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
  );
}

// Memoize Users component to prevent unnecessary re-renders during navigation
export default React.memo(Users);
