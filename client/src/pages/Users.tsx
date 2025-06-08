
import React, { useState } from 'react';
import { Link } from 'wouter';
import { Search, Filter, Download, Eye, Hash, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock user data
const mockUsers = [
  {
    id: 1,
    user_id: 'USR_001_JD_2024',
    email: 'john.doe@email.com',
    name: 'John Doe',
    user_type: 'premium',
    user_roles: ['lister', 'buyer'],
    account_status: 'active',
    created_date: '2024-01-15',
    last_login: '2024-06-02',
    total_listings: 15,
    total_purchases: 12,
    cltv: 450.00
  },
  {
    id: 2,
    user_id: 'USR_002_JS_2024',
    email: 'jane.smith@email.com',
    name: 'Jane Smith',
    user_type: 'regular',
    user_roles: ['buyer'],
    account_status: 'active',
    created_date: '2024-02-20',
    last_login: '2024-06-01',
    total_listings: 0,
    total_purchases: 8,
    cltv: 180.00
  },
  {
    id: 3,
    user_id: 'USR_003_MW_2023',
    email: 'mike.wilson@email.com',
    name: 'Mike Wilson',
    user_type: 'premium',
    user_roles: ['lister'],
    account_status: 'inactive',
    created_date: '2023-12-10',
    last_login: '2024-05-28',
    total_listings: 23,
    total_purchases: 0,
    cltv: 680.00
  },
  {
    id: 4,
    user_id: 'USR_004_SJ_2024',
    email: 'sarah.johnson@email.com',
    name: 'Sarah Johnson',
    user_type: 'regular',
    user_roles: ['lister', 'buyer'],
    account_status: 'active',
    created_date: '2024-03-05',
    last_login: '2024-06-03',
    total_listings: 5,
    total_purchases: 3,
    cltv: 95.00
  },
];

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = userTypeFilter === 'all' || user.user_type === userTypeFilter;
    const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.user_roles.includes(roleFilter);
    
    return matchesSearch && matchesType && matchesStatus && matchesRole;
  });

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

  const getUserTypeBadge = (type: string) => {
    switch (type) {
      case 'premium':
        return <Badge className="bg-blue-100 text-blue-800">Premium</Badge>;
      case 'regular':
        return <Badge variant="outline">Regular</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getUserRoleBadges = (roles: string[]) => {
    return roles.map(role => {
      switch (role) {
        case 'lister':
          return <Badge key={role} className="bg-purple-100 text-purple-800 mr-1">Lister</Badge>;
        case 'buyer':
          return <Badge key={role} className="bg-orange-100 text-orange-800 mr-1">Buyer</Badge>;
        default:
          return <Badge key={role} variant="outline" className="mr-1">{role}</Badge>;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">User Explorer</h1>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Users
        </Button>
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
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">User ID</th>
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Roles</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium">Last Login</th>
                  <th className="text-left py-3 px-4 font-medium">Listings</th>
                  <th className="text-left py-3 px-4 font-medium">Purchases</th>
                  <th className="text-left py-3 px-4 font-medium">CLTV</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm font-mono">
                        <Hash className="mr-1 h-3 w-3 text-gray-400" />
                        {user.user_id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getUserTypeBadge(user.user_type)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap">
                        {getUserRoleBadges(user.user_roles)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(user.account_status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.created_date}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.last_login}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {user.total_listings}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {user.total_purchases}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      ${user.cltv.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/users/${user.id}`}>
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
        </CardContent>
      </Card>
    </div>
  );
}
