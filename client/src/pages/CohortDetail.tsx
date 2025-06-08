import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Edit, Users, TrendingUp, Calendar, User, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock cohort data - in real app this would come from API
const mockCohortData: Record<string, any> = {
  '1': {
    id: 1,
    name: 'Premium Users',
    description: 'Users with premium account type',
    userCount: 15234,
    createdDate: '2024-05-15',
    updatedDate: '2024-05-28',
    creator: 'John Smith',
    status: 'active',
    syncStatus: 'synced',
    conditions: [
      { attribute: 'user_type', operator: 'equals', value: 'premium' }
    ],
    stats: {
      avgCltv: 450.75,
      conversionRate: 12.5,
      churnRate: 3.2,
      avgListings: 8.5,
      totalRevenue: 6875234.50
    }
  },
  '2': {
    id: 2,
    name: 'Active Listers',
    description: 'Users who posted listings in the last 30 days',
    userCount: 8976,
    createdDate: '2024-05-20',
    updatedDate: '2024-06-01',
    creator: 'Sarah Wilson',
    status: 'active',
    syncStatus: 'pending',
    conditions: [
      { attribute: 'last_listing_date', operator: 'within_days', value: '30' }
    ],
    stats: {
      avgCltv: 320.45,
      conversionRate: 8.7,
      churnRate: 5.1,
      avgListings: 12.3,
      totalRevenue: 2890456.75
    }
  }
};

export default function CohortDetail() {
  const { cohortId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [cohortData, setCohortData] = useState(cohortId ? mockCohortData[cohortId] || null : null);

  if (!cohortData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/cohorts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cohorts
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cohort Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>The cohort you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving cohort:', cohortData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/cohorts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cohorts
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Cohort' : cohortData.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Cohort
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{cohortData.userCount.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg CLTV</p>
                <p className="text-2xl font-bold">${cohortData.stats.avgCltv}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{cohortData.stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold">{cohortData.stats.churnRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${(cohortData.stats.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Cohort Name</Label>
                <Input
                  id="name"
                  value={cohortData.name}
                  onChange={(e) => setCohortData({ ...cohortData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={cohortData.description}
                  onChange={(e) => setCohortData({ ...cohortData, description: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cohortData.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Badge variant="outline">{condition.attribute}</Badge>
                    <span className="text-sm text-gray-500">{condition.operator}</span>
                    <Badge>{condition.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge(cohortData.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sync Status</span>
                {getSyncStatusBadge(cohortData.syncStatus)}
              </div>
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-medium">{cohortData.createdDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm font-medium">{cohortData.updatedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Creator</p>
                  <p className="text-sm font-medium">{cohortData.creator}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
