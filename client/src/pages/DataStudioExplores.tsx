import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  PieChart, 
  BarChart3, 
  LineChart, 
  Plus, 
  Search,
  Filter,
  Play,
  Save,
  Settings,
  Database,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Explore {
  id: string;
  name: string;
  description: string;
  type: 'chart' | 'table' | 'metric';
  visualizationType: 'line' | 'bar' | 'pie' | 'table' | 'number';
  query: string;
  lastModified: string;
  createdBy: string;
  tags: string[];
  isPublic: boolean;
}

interface Metric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export function DataStudioExplores() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showNewExplore, setShowNewExplore] = useState(false);
  const [activeTab, setActiveTab] = useState('explores');

  // Sample explores data
  const explores: Explore[] = [
    {
      id: '1',
      name: 'User Growth Trend',
      description: 'Monthly user acquisition and retention analysis',
      type: 'chart',
      visualizationType: 'line',
      query: 'SELECT DATE_TRUNC(\'month\', created_at) as month, COUNT(*) as users FROM users GROUP BY month ORDER BY month',
      lastModified: '2 hours ago',
      createdBy: 'data_team',
      tags: ['users', 'growth', 'monthly'],
      isPublic: true
    },
    {
      id: '2',
      name: 'Revenue by Segment',
      description: 'Revenue breakdown across user segments',
      type: 'chart',
      visualizationType: 'bar',
      query: 'SELECT segment_tier, SUM(total_revenue) as revenue FROM user_segmentation GROUP BY segment_tier',
      lastModified: '1 day ago',
      createdBy: 'finance_team',
      tags: ['revenue', 'segments', 'financial'],
      isPublic: false
    },
    {
      id: '3',
      name: 'Active Users',
      description: 'Current active user count across all platforms',
      type: 'metric',
      visualizationType: 'number',
      query: 'SELECT COUNT(DISTINCT user_id) as active_users FROM user_events WHERE event_timestamp >= CURRENT_DATE - INTERVAL \'30 days\'',
      lastModified: '30 minutes ago',
      createdBy: 'product_team',
      tags: ['users', 'activity', 'kpi'],
      isPublic: true
    },
    {
      id: '4',
      name: 'User Segments Distribution',
      description: 'Distribution of users across different segments',
      type: 'chart',
      visualizationType: 'pie',
      query: 'SELECT segment_tier, COUNT(*) as count FROM user_segmentation GROUP BY segment_tier',
      lastModified: '4 hours ago',
      createdBy: 'marketing_team',
      tags: ['segments', 'distribution', 'users'],
      isPublic: true
    },
    {
      id: '5',
      name: 'Top Revenue Customers',
      description: 'List of highest revenue generating customers',
      type: 'table',
      visualizationType: 'table',
      query: 'SELECT user_id, email, total_revenue FROM user_segmentation ORDER BY total_revenue DESC LIMIT 100',
      lastModified: '6 hours ago',
      createdBy: 'sales_team',
      tags: ['customers', 'revenue', 'top'],
      isPublic: false
    }
  ];

  // Sample metrics for quick insights
  const quickMetrics: Metric[] = [
    { name: 'Total Users', value: '156,892', change: '+12.5%', trend: 'up' },
    { name: 'Monthly Revenue', value: '$2.4M', change: '+8.2%', trend: 'up' },
    { name: 'Active Sessions', value: '23,451', change: '-2.1%', trend: 'down' },
    { name: 'Conversion Rate', value: '3.8%', change: '+0.3%', trend: 'up' }
  ];

  const filteredExplores = explores.filter(explore => {
    const matchesSearch = explore.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         explore.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         explore.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || explore.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'line': return <LineChart className="h-4 w-4" />;
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'pie': return <PieChart className="h-4 w-4" />;
      case 'number': return <TrendingUp className="h-4 w-4" />;
      case 'table': return <Database className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getMetricIcon = (name: string) => {
    if (name.toLowerCase().includes('user')) return <Users className="h-5 w-5" />;
    if (name.toLowerCase().includes('revenue')) return <DollarSign className="h-5 w-5" />;
    if (name.toLowerCase().includes('session')) return <Calendar className="h-5 w-5" />;
    return <TrendingUp className="h-5 w-5" />;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Explores</h1>
            <p className="text-muted-foreground">
              Create and manage data visualizations and analysis queries
            </p>
          </div>
          <Dialog open={showNewExplore} onOpenChange={setShowNewExplore}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Explore
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Explore</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="explore-name">Name</Label>
                    <Input id="explore-name" placeholder="Enter explore name" />
                  </div>
                  <div>
                    <Label htmlFor="explore-type">Visualization Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="number">Metric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="explore-description">Description</Label>
                  <Input id="explore-description" placeholder="Enter description" />
                </div>
                <div>
                  <Label htmlFor="explore-query">SQL Query</Label>
                  <Textarea 
                    id="explore-query" 
                    placeholder="SELECT * FROM..." 
                    className="min-h-32 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="explore-tags">Tags (comma separated)</Label>
                  <Input id="explore-tags" placeholder="users, revenue, monthly" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewExplore(false)}>Cancel</Button>
                  <Button onClick={() => setShowNewExplore(false)}>Create Explore</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search explores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="chart">Charts</SelectItem>
              <SelectItem value="table">Tables</SelectItem>
              <SelectItem value="metric">Metrics</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="explores">All Explores</TabsTrigger>
            <TabsTrigger value="metrics">Quick Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="explores" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExplores.map((explore) => (
                <Card key={explore.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getVisualizationIcon(explore.visualizationType)}
                        <CardTitle className="text-base">{explore.name}</CardTitle>
                        {explore.isPublic && (
                          <Badge variant="secondary" className="text-xs">Public</Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Run Query
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {explore.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {explore.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>by {explore.createdBy}</span>
                      <span>{explore.lastModified}</span>
                    </div>
                    <div className="mt-3 p-2 bg-muted/50 rounded text-xs font-mono">
                      {explore.query.length > 60 ? `${explore.query.substring(0, 60)}...` : explore.query}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickMetrics.map((metric) => (
                <Card key={metric.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getMetricIcon(metric.name)}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                          <p className="text-2xl font-bold">{metric.value}</p>
                          <p className={`text-sm ${getTrendColor(metric.trend)}`}>
                            {metric.change} from last month
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Create Custom Metric</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input placeholder="Metric name" />
                  <Input placeholder="SQL query or formula" />
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Metric
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}