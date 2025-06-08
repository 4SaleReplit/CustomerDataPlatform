import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Edit, Save, X, AlertTriangle, TrendingUp, TrendingDown, Users, Calendar, DollarSign, Activity, Target, Star, Mail, Phone, MapPin, Clock, Hash, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Enhanced mock user profile data
const mockUserProfile = {
  id: 1,
  user_id: 'USR_001_JD_2024', // Added user ID
  email: 'john.doe@email.com',
  name: 'John Doe',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  user_type: 'premium',
  user_roles: ['lister', 'buyer'], // Added user roles
  account_status: 'active',
  created_date: '2024-01-15T10:30:00Z',
  last_login: '2024-06-02T14:22:00Z',
  
  // Financial Metrics
  total_listings: 15,
  paid_listings_count: 8,
  total_purchases: 12, // Added purchase count
  cltv: 450.00,
  current_credits: 125,
  total_spent: 1250.00,
  avg_monthly_spend: 125.00,
  
  // Behavioral Metrics
  favorite_vertical: 'Electronics',
  verticals_listed_in: ['Electronics', 'Home & Garden', 'Automotive'],
  lifecycle_stage: 'active_user',
  engagement_score: 85,
  satisfaction_score: 4.2,
  avg_session_duration: '12m 34s',
  monthly_active_days: 18,
  
  // Risk Analysis
  churn_risk_score: 25, // 0-100, lower is better
  churn_risk_level: 'low',
  churn_factors: [
    { factor: 'Recent Activity', impact: 'positive', score: 8 },
    { factor: 'Payment History', impact: 'positive', score: 9 },
    { factor: 'Support Tickets', impact: 'neutral', score: 6 },
    { factor: 'Feature Usage', impact: 'positive', score: 7 }
  ],
  
  // Advanced Analytics
  conversion_rate: 68.5,
  avg_listing_views: 245,
  response_rate: 94,
  listing_success_rate: 72,
  referral_count: 3,
  
  listings: [
    { id: 1, title: 'iPhone 13 Pro', category: 'Electronics', date: '2024-05-28', status: 'active', views: 156, inquiries: 8 },
    { id: 2, title: 'Garden Tools Set', category: 'Home & Garden', date: '2024-05-25', status: 'sold', views: 89, inquiries: 12 },
    { id: 3, title: 'Car Tires', category: 'Automotive', date: '2024-05-20', status: 'active', views: 234, inquiries: 15 },
  ],
  
  transactions: [
    { id: 1, date: '2024-05-28', type: 'listing_fee', amount: 25.00, status: 'completed' },
    { id: 2, date: '2024-05-25', type: 'promotion', amount: 15.00, status: 'completed' },
    { id: 3, date: '2024-05-20', type: 'listing_fee', amount: 25.00, status: 'completed' },
  ],
  
  cohorts: ['Premium Users', 'Active Listers', 'Electronics Enthusiasts'],
  
  // Communication History
  support_tickets: 2,
  last_support_contact: '2024-04-15',
  email_opens: 85,
  email_clicks: 42,
  communication_preference: 'email'
};

export default function UserProfile() {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(mockUserProfile);

  const handleSave = () => {
    console.log('Saving user data:', editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(mockUserProfile);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChurnRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFactorImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUserRoleBadges = (roles: string[]) => {
    return roles.map(role => {
      switch (role) {
        case 'lister':
          return <Badge key={role} className="bg-purple-100 text-purple-800">Lister</Badge>;
        case 'buyer':
          return <Badge key={role} className="bg-orange-100 text-orange-800">Buyer</Badge>;
        default:
          return <Badge key={role} variant="outline">{role}</Badge>;
      }
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900">360° User Profile</h1>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Hash className="mr-1 h-4 w-4" />
            {mockUserProfile.user_id}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
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
              Edit User
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced User Summary */}
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
              <h3 className="font-medium text-lg">{mockUserProfile.name}</h3>
              <p className="text-gray-600 flex items-center text-sm">
                <Mail className="mr-1 h-3 w-3" />
                {mockUserProfile.email}
              </p>
              <p className="text-gray-600 flex items-center text-sm">
                <Phone className="mr-1 h-3 w-3" />
                {mockUserProfile.phone}
              </p>
              <p className="text-gray-600 flex items-center text-sm">
                <MapPin className="mr-1 h-3 w-3" />
                {mockUserProfile.location}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">{mockUserProfile.user_type}</Badge>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {mockUserProfile.account_status}
              </Badge>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-1 flex items-center">
                <UserCheck className="mr-1 h-3 w-3" />
                User Roles:
              </p>
              <div className="flex flex-wrap gap-1">
                {getUserRoleBadges(mockUserProfile.user_roles)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Engagement Score</span>
                <span className="text-sm font-medium">{mockUserProfile.engagement_score}%</span>
              </div>
              <Progress value={mockUserProfile.engagement_score} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Active Days</p>
                <p className="font-medium">{mockUserProfile.monthly_active_days}/30</p>
              </div>
              <div>
                <p className="text-gray-600">Avg Session</p>
                <p className="font-medium">{mockUserProfile.avg_session_duration}</p>
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
              <p className="text-2xl font-bold text-green-600">${mockUserProfile.cltv.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Total Spent</p>
                <p className="font-medium">${mockUserProfile.total_spent}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg Monthly</p>
                <p className="font-medium">${mockUserProfile.avg_monthly_spend}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${mockUserProfile.churn_risk_level === 'high' ? 'border-red-200' : mockUserProfile.churn_risk_level === 'medium' ? 'border-yellow-200' : 'border-green-200'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Churn Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Risk Score</span>
                <Badge className={getChurnRiskColor(mockUserProfile.churn_risk_level)}>
                  {mockUserProfile.churn_risk_level} ({mockUserProfile.churn_risk_score}%)
                </Badge>
              </div>
              <Progress value={100 - mockUserProfile.churn_risk_score} className="h-2" />
            </div>
            <div className="text-sm">
              <p className="text-gray-600 mb-2">Key Factors:</p>
              <div className="space-y-1">
                {mockUserProfile.churn_factors.slice(0, 2).map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="flex items-center">
                      {getFactorImpactIcon(factor.impact)}
                      <span className="ml-1 text-xs">{factor.factor}</span>
                    </span>
                    <span className="text-xs font-medium">{factor.score}/10</span>
                  </div>
                ))}
              </div>
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
                <p className="text-2xl font-bold">{mockUserProfile.total_listings}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold">{mockUserProfile.total_purchases}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold">{mockUserProfile.response_rate}%</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction Score</p>
                <p className="text-2xl font-bold flex items-center">
                  {mockUserProfile.satisfaction_score}
                  <Star className="h-4 w-4 text-yellow-500 ml-1" />
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="user_id">User ID</Label>
                    <Input
                      id="user_id"
                      value={editData.user_id}
                      onChange={(e) => setEditData({...editData, user_id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user_type">User Type</Label>
                    <Select value={editData.user_type} onValueChange={(value) => setEditData({...editData, user_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">User ID:</span> {mockUserProfile.user_id}</p>
                      <p><span className="font-medium">Internal ID:</span> {mockUserProfile.id}</p>
                      <p><span className="font-medium">Created:</span> {formatDate(mockUserProfile.created_date)}</p>
                      <p><span className="font-medium">Last Login:</span> {formatDate(mockUserProfile.last_login)}</p>
                      <p><span className="font-medium">Lifecycle Stage:</span> {mockUserProfile.lifecycle_stage}</p>
                      <p><span className="font-medium">Favorite Vertical:</span> {mockUserProfile.favorite_vertical}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Activity Summary</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Total Listings:</span> {mockUserProfile.total_listings}</p>
                      <p><span className="font-medium">Paid Listings:</span> {mockUserProfile.paid_listings_count}</p>
                      <p><span className="font-medium">Total Purchases:</span> {mockUserProfile.total_purchases}</p>
                      <p><span className="font-medium">Success Rate:</span> {mockUserProfile.listing_success_rate}%</p>
                      <p><span className="font-medium">Referrals:</span> {mockUserProfile.referral_count}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">User Roles & Verticals</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Roles:</p>
                        <div className="flex flex-wrap gap-2">
                          {getUserRoleBadges(mockUserProfile.user_roles)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Verticals Listed In:</p>
                        <div className="flex flex-wrap gap-2">
                          {mockUserProfile.verticals_listed_in.map((vertical) => (
                            <Badge key={vertical} variant="outline">{vertical}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="listings" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Title</th>
                      <th className="text-left py-2">Category</th>
                      <th className="text-left py-2">Date Posted</th>
                      <th className="text-left py-2">Views</th>
                      <th className="text-left py-2">Inquiries</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUserProfile.listings.map((listing) => (
                      <tr key={listing.id} className="border-b">
                        <td className="py-2">{listing.title}</td>
                        <td className="py-2">{listing.category}</td>
                        <td className="py-2">{listing.date}</td>
                        <td className="py-2">{listing.views}</td>
                        <td className="py-2">{listing.inquiries}</td>
                        <td className="py-2">
                          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                            {listing.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUserProfile.transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-2">{transaction.date}</td>
                        <td className="py-2">{transaction.type}</td>
                        <td className="py-2">${transaction.amount.toFixed(2)}</td>
                        <td className="py-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {transaction.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="risk-analysis" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Churn Risk Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockUserProfile.churn_factors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center">
                              {getFactorImpactIcon(factor.impact)}
                              <span className="ml-2 font-medium">{factor.factor}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={factor.score * 10} className="w-20 h-2" />
                              <span className="text-sm font-medium">{factor.score}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Mitigation Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <h5 className="font-medium text-blue-900">Recommended Actions</h5>
                          <ul className="text-sm text-blue-800 mt-2 space-y-1">
                            <li>• Send personalized engagement email</li>
                            <li>• Offer listing promotion discount</li>
                            <li>• Schedule check-in call</li>
                          </ul>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                          <h5 className="font-medium text-green-900">Retention Score</h5>
                          <p className="text-sm text-green-800 mt-1">
                            Based on current metrics, retention probability is <strong>85%</strong>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Communication Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Email Open Rate</span>
                      <span className="font-medium">{mockUserProfile.email_opens}%</span>
                    </div>
                    <Progress value={mockUserProfile.email_opens} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Email Click Rate</span>
                      <span className="font-medium">{mockUserProfile.email_clicks}%</span>
                    </div>
                    <Progress value={mockUserProfile.email_clicks} className="h-2" />
                    
                    <div className="text-sm">
                      <p><span className="font-medium">Support Tickets:</span> {mockUserProfile.support_tickets}</p>
                      <p><span className="font-medium">Last Contact:</span> {mockUserProfile.last_support_contact}</p>
                      <p><span className="font-medium">Preferred Channel:</span> {mockUserProfile.communication_preference}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Behavioral Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Peak Activity Time</span>
                        <span className="font-medium">2-4 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Time to List</span>
                        <span className="font-medium">2.3 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Feature Adoption</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Mobile Usage</span>
                        <span className="font-medium">65%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cohorts" className="mt-6">
              <div>
                <h4 className="font-medium mb-4">Active Cohort Memberships</h4>
                <div className="flex flex-wrap gap-2">
                  {mockUserProfile.cohorts.map((cohort) => (
                    <Badge key={cohort} className="bg-blue-100 text-blue-800">{cohort}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
