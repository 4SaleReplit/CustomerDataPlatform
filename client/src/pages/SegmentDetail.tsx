
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Users, TrendingUp, Calendar, User, RefreshCw, Save, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock segment data
const mockSegmentData: Record<string, any> = {
  '1': {
    id: 1,
    name: 'is_top_lister',
    description: 'Users with more than 10 total listings',
    rule: 'total_listings_count > 10',
    userCount: 5432,
    status: 'active',
    createdDate: '2024-01-15',
    updatedDate: '2024-06-01',
    createdBy: 'John Smith',
    conditions: [
      { attribute: 'total_listings_count', operator: '>', value: '10' }
    ],
    stats: {
      avgCltv: 485.23,
      conversionRate: 12.5,
      churnRate: 3.2,
      avgListings: 15.7,
      totalRevenue: 2641256.75
    }
  },
  '2': {
    id: 2,
    name: 'is_high_value',
    description: 'Users with CLTV > $500',
    rule: 'cltv > 500',
    userCount: 2341,
    status: 'active',
    createdDate: '2024-02-20',
    updatedDate: '2024-05-28',
    createdBy: 'Sarah Wilson',
    conditions: [
      { attribute: 'cltv', operator: '>', value: '500' }
    ],
    stats: {
      avgCltv: 745.89,
      conversionRate: 18.3,
      churnRate: 2.1,
      avgListings: 8.5,
      totalRevenue: 1745632.10
    }
  }
};

export default function SegmentDetail() {
  const { segmentId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [segmentData, setSegmentData] = useState(segmentId ? mockSegmentData[segmentId] || null : null);

  if (!segmentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Segment Not Found</h2>
          <p className="text-gray-600 mb-4">The segment you're looking for doesn't exist.</p>
          <Link to="/segments">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Segments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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

  const handleSave = () => {
    console.log('Saving segment:', segmentData);
    setIsEditing(false);
  };

  const handleStatusToggle = () => {
    const newStatus = segmentData.status === 'active' ? 'inactive' : 'active';
    setSegmentData({ ...segmentData, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/segments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Segments
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{segmentData.name}</h1>
            <p className="text-gray-600">{segmentData.description}</p>
          </div>
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
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant={segmentData.status === 'active' ? 'outline' : 'default'}
                onClick={handleStatusToggle}
              >
                {segmentData.status === 'active' ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Segment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Segment Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={segmentData.name}
                      onChange={(e) => setSegmentData({...segmentData, name: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1 font-mono">{segmentData.name}</p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(segmentData.status)}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={segmentData.description}
                    onChange={(e) => setSegmentData({...segmentData, description: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{segmentData.description}</p>
                )}
              </div>

              <div>
                <Label>Rule Logic</Label>
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    {segmentData.conditions.map((condition: any, index: number) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <Select value={condition.attribute}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="total_listings_count">Total Listings</SelectItem>
                            <SelectItem value="cltv">CLTV</SelectItem>
                            <SelectItem value="user_type">User Type</SelectItem>
                            <SelectItem value="registration_date">Registration Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={condition.operator}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=">">&gt;</SelectItem>
                            <SelectItem value="<">&lt;</SelectItem>
                            <SelectItem value="=">=</SelectItem>
                            <SelectItem value="!=">!=</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input value={condition.value} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <code className="block mt-1 p-3 bg-gray-50 rounded text-sm font-mono">
                    {segmentData.rule}
                  </code>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">${segmentData.stats?.avgCltv?.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Avg CLTV</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{segmentData.stats?.conversionRate}%</p>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <RefreshCw className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <p className="text-2xl font-bold">{segmentData.stats?.churnRate}%</p>
                  <p className="text-sm text-gray-600">Churn Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">{segmentData.stats?.avgListings}</p>
                  <p className="text-sm text-gray-600">Avg Listings</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${segmentData.stats?.totalRevenue?.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="font-bold text-lg">{segmentData.userCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge(segmentData.status)}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Created By</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{segmentData.createdBy}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Created At</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{new Date(segmentData.createdDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Last Updated</Label>
                <div className="flex items-center gap-2 mt-1">
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{new Date(segmentData.updatedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Recalculate Segment
              </Button>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                View Users
              </Button>
              <Button variant="outline" className="w-full">
                Export Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
