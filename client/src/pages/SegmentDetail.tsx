
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Edit, Users, TrendingUp, Calendar, User, RefreshCw, Save, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { trackBusinessEvent } from '@/lib/amplitude';



function SegmentDetail() {
  const { segmentId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [segmentData, setSegmentData] = useState<any>(null);

  // Track page visit
  useEffect(() => {
    trackBusinessEvent.pageViewed('segment-detail');
  }, []);

  // Fetch segment data from API
  const { data: segment, isLoading, error } = useQuery({
    queryKey: ['segments', segmentId],
    queryFn: async () => {
      const response = await apiRequest(`/api/segments/${segmentId}`);
      return response;
    },
    enabled: !!segmentId,
  });

  useEffect(() => {
    if (segment) {
      setSegmentData(segment);
    }
  }, [segment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading segment details...</p>
        </div>
      </div>
    );
  }

  if (error || !segmentData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
                    {getStatusBadge(segmentData.isActive ? 'active' : 'inactive')}
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
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={segmentData.conditions?.attribute || ''}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TOTAL_CREDITS_SPENT">Total Credits Spent</SelectItem>
                            <SelectItem value="TOTAL_LISTINGS_COUNT">Total Listings</SelectItem>
                            <SelectItem value="USER_TYPE">User Type</SelectItem>
                            <SelectItem value="CURRENT_CREDITS_IN_WALLET">Current Credits</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={segmentData.conditions?.operator || ''}>
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
                        <Input value={segmentData.conditions?.value || ''} />
                      </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                      {segmentData.conditions?.rule || 'No rule defined'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Segment Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{segmentData.conditions?.userCount?.toLocaleString() || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">
                    {segmentData.conditions?.lastCalculatedAt ? 
                      new Date(segmentData.conditions.lastCalculatedAt).toLocaleDateString() : 
                      'Never'
                    }
                  </p>
                  <p className="text-sm text-gray-600">Last Calculated</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Segment Type</p>
                <p className="text-lg font-semibold capitalize">
                  {segmentData.segmentType || 'Unknown'}
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
                <span className="font-bold text-lg">{segmentData.conditions?.userCount?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge(segmentData.isActive ? 'active' : 'inactive')}
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
                  <span className="text-sm">{segmentData.createdBy || 'System'}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Created At</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {segmentData.createdAt ? new Date(segmentData.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Last Updated</Label>
                <div className="flex items-center gap-2 mt-1">
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {segmentData.updatedAt ? new Date(segmentData.updatedAt).toLocaleDateString() : 'Unknown'}
                  </span>
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

// Memoize SegmentDetail component for SPA behavior
export default React.memo(SegmentDetail);
