import React from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft, RefreshCw, AlertCircle, Users, DollarSign, Activity, Target, Mail, Phone, Hash, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function UserProfile() {
  const { userId } = useParams();

  // Fetch user data from Snowflake
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `SELECT * FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE USER_ID = '${userId}' LIMIT 1` 
        })
      });
      return response;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Process user data
  const userProfile = userData?.success && userData?.rows?.length > 0 ? 
    (() => {
      const row = userData.rows[0];
      const columns = userData.columns || [];
      const userObject: any = {};
      
      columns.forEach((col: any, colIndex: number) => {
        userObject[col.name] = row[colIndex];
      });
      
      return userObject;
    })() : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num: any) => {
    if (num === null || num === undefined) return 'N/A';
    if (typeof num === 'number') return num.toLocaleString();
    return String(num);
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

  // Loading state
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading user profile...
        </div>
      </div>
    );
  }

  // Error state
  if (userError || !userData?.success) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-red-500 mb-2">Failed to load user profile</div>
          <div className="text-sm text-gray-500">{userData?.error || 'User not found'}</div>
          <Link to="/users">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No user found
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-2">User not found</div>
          <div className="text-sm text-gray-400">No user found with ID: {userId}</div>
          <Link to="/users">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Hash className="mr-1 h-4 w-4" />
            {userProfile.USER_ID}
          </Badge>
        </div>
      </div>

      {/* User Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="mr-2 h-4 w-4" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-medium text-lg">{userProfile.USER_ID}</h3>
              <p className="text-gray-600 flex items-center text-sm">
                <Mail className="mr-1 h-3 w-3" />
                {userProfile.EMAIL || 'No email'}
              </p>
              <p className="text-gray-600 flex items-center text-sm">
                <Phone className="mr-1 h-3 w-3" />
                {userProfile.PHONE_NUMBER || 'No phone'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {getUserTypeBadge(userProfile.USER_TYPE)}
              <Badge 
                variant={userProfile.IS_ACTIVE === 'TRUE' || userProfile.IS_ACTIVE === true ? 'default' : 'secondary'}
                className={userProfile.IS_ACTIVE === 'TRUE' || userProfile.IS_ACTIVE === true ? 'bg-green-100 text-green-800' : ''}
              >
                {userProfile.IS_ACTIVE === 'TRUE' || userProfile.IS_ACTIVE === true ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Activity Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(userProfile.TOTAL_LISTINGS_COUNT)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Paid Listings</p>
                <p className="font-medium">{formatNumber(userProfile.PAID_LISTINGS_COUNT)}</p>
              </div>
              <div>
                <p className="text-gray-600">Free Listings</p>
                <p className="font-medium">{formatNumber(userProfile.FREE_LISTINGS_COUNT)}</p>
              </div>
              <div>
                <p className="text-gray-600">Office Listings</p>
                <p className="font-medium">{formatNumber(userProfile.OFFICE_LISTINGS_COUNT)}</p>
              </div>
              <div>
                <p className="text-gray-600">Days Since Last Transaction</p>
                <p className="font-medium">{formatNumber(userProfile.DAYS_SINCE_LAST_TRANSACTION)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Customer Lifetime Value</p>
              <p className="text-2xl font-bold text-green-600">
                {userProfile.CLTV ? `${Number(userProfile.CLTV).toFixed(2)} KWD` : '0.00 KWD'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Total Credits Spent</p>
                <p className="font-medium">{formatNumber(userProfile.TOTAL_CREDITS_SPENT)} KWD</p>
              </div>
              <div>
                <p className="text-gray-600">Premium Credits Spent</p>
                <p className="font-medium">{formatNumber(userProfile.TOTAL_PREMIUM_CREDITS_SPENT)} KWD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="text-lg font-semibold">{formatDate(userProfile.CREATED_DATE)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Active</p>
              <p className="font-medium">{formatDate(userProfile.LAST_ACTIVE_DATE || userProfile.CREATED_DATE)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Listings</p>
                <p className="text-2xl font-bold">{formatNumber(userProfile.TOTAL_LISTINGS_COUNT)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Listings</p>
                <p className="text-2xl font-bold">{formatNumber(userProfile.PAID_LISTINGS_COUNT)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Free Listings</p>
                <p className="text-2xl font-bold">{formatNumber(userProfile.FREE_LISTINGS_COUNT)}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Office Listings</p>
                <p className="text-2xl font-bold">{formatNumber(userProfile.OFFICE_LISTINGS_COUNT)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information with Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-mono">{userProfile.USER_ID || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{userProfile.EMAIL || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{userProfile.PHONE || userProfile.PHONE_NUMBER || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span>{userProfile.REGION || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Account Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User Type:</span>
                      <span>{userProfile.USER_TYPE || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Status:</span>
                      <span>{userProfile.IS_ACTIVE === 'TRUE' || userProfile.IS_ACTIVE === true ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{formatDate(userProfile.CREATED_DATE)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Active:</span>
                      <span>{formatDate(userProfile.LAST_ACTIVE_DATE || userProfile.CREATED_DATE)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Basic Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CLTV:</span>
                      <span className="font-semibold text-green-600">
                        {userProfile.CLTV ? `${Number(userProfile.CLTV).toFixed(2)} KWD` : '0.00 KWD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Listings:</span>
                      <span>{formatNumber(userProfile.TOTAL_LISTINGS_COUNT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Credits Spent:</span>
                      <span>{formatNumber(userProfile.TOTAL_CREDITS_SPENT)} KWD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Since Last Transaction:</span>
                      <span>{formatNumber(userProfile.DAYS_SINCE_LAST_TRANSACTION)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Listing Counts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Listings:</span>
                      <span className="font-semibold">{formatNumber(userProfile.TOTAL_LISTINGS_COUNT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Listings:</span>
                      <span className="font-medium text-blue-600">{formatNumber(userProfile.PAID_LISTINGS_COUNT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Free Listings:</span>
                      <span className="font-medium text-green-600">{formatNumber(userProfile.FREE_LISTINGS_COUNT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Office Listings:</span>
                      <span className="font-medium text-purple-600">{formatNumber(userProfile.OFFICE_LISTINGS_COUNT)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">All Available Listing Data</h4>
                  <div className="space-y-2 text-sm">
                    {Object.keys(userProfile).filter(key => 
                      key.includes('LISTING') && !['TOTAL_LISTINGS_COUNT', 'PAID_LISTINGS_COUNT', 'FREE_LISTINGS_COUNT', 'OFFICE_LISTINGS_COUNT'].includes(key)
                    ).map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                        <span>{formatNumber(userProfile[key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Transaction Data</h4>
                  <div className="space-y-2 text-sm">
                    {Object.keys(userProfile).filter(key => 
                      key.includes('TRANSACTION') || key.includes('PAYMENT')
                    ).map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                        <span>{formatNumber(userProfile[key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Credits & Spending</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Credits Spent:</span>
                      <span className="font-semibold">{formatNumber(userProfile.TOTAL_CREDITS_SPENT)} KWD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Premium Credits Spent:</span>
                      <span className="font-medium text-orange-600">{formatNumber(userProfile.TOTAL_PREMIUM_CREDITS_SPENT)} KWD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Free Credits Spent:</span>
                      <span className="font-medium text-gray-600">{formatNumber(userProfile.TOTAL_FREE_CREDITS_SPENT)} KWD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Credits in Wallet:</span>
                      <span className="font-medium">{formatNumber(userProfile.CURRENT_CREDITS_IN_WALLET)} KWD</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">All Financial Data</h4>
                  <div className="space-y-2 text-sm">
                    {Object.keys(userProfile).filter(key => 
                      (key.includes('CREDIT') || key.includes('CLTV') || key.includes('REVENUE') || key.includes('SPENT')) && 
                      !['TOTAL_CREDITS_SPENT', 'TOTAL_PREMIUM_CREDITS_SPENT', 'TOTAL_FREE_CREDITS_SPENT', 'CURRENT_CREDITS_IN_WALLET'].includes(key)
                    ).map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                        <span>{key.includes('CREDIT') || key.includes('CLTV') || key.includes('REVENUE') || key.includes('SPENT') ? 
                          `${formatNumber(userProfile[key])} KWD` : formatNumber(userProfile[key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">Engagement Metrics</h4>
                  <div className="space-y-2 text-sm">
                    {Object.keys(userProfile).filter(key => 
                      key.includes('ACTIVITY') || key.includes('LOGIN') || key.includes('SESSION') || 
                      key.includes('VISIT') || key.includes('ENGAGEMENT') || key.includes('ACTIVE')
                    ).map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                        <span>{formatNumber(userProfile[key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-gray-800">All Other Data</h4>
                  <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
                    {Object.keys(userProfile).filter(key => 
                      !key.includes('LISTING') && !key.includes('CREDIT') && !key.includes('TRANSACTION') && 
                      !key.includes('PAYMENT') && !key.includes('ACTIVITY') && !key.includes('LOGIN') && 
                      !key.includes('SESSION') && !key.includes('VISIT') && !key.includes('ENGAGEMENT') && 
                      !key.includes('ACTIVE') && !key.includes('CLTV') && !key.includes('REVENUE') && 
                      !key.includes('SPENT') && !['USER_ID', 'EMAIL', 'PHONE', 'PHONE_NUMBER', 'REGION', 'USER_TYPE', 'IS_ACTIVE', 'CREATED_DATE', 'LAST_ACTIVE_DATE'].includes(key)
                    ).map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                        <span>{formatNumber(userProfile[key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}