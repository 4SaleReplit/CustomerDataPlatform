
import React, { useState } from 'react';
import { Link } from 'wouter';
import { Search, Filter, Download, Eye, Hash, UserCheck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const usersPerPage = 10;

  // Fetch users from Snowflake with caching
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users', 'snowflake'],
    queryFn: async () => {
      const response = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'SELECT * FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE CURRENT_CREDITS_IN_WALLET != 0 AND TOTAL_CREDITS_SPENT != 0 LIMIT 100' 
        })
      });
      return response;
    },
    staleTime: Infinity, // Keep data until manually refreshed
    gcTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['users', 'snowflake'] });
      await refetchUsers();
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

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email, name, or user ID..."
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
            <CardTitle>Users ({filteredUsers.length} total)</CardTitle>
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
                      <div className="text-sm">{user.PHONE_NUMBER || 'No phone'}</div>
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
                      <Link to={`/users/${user.USER_ID || user.id}`}>
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
