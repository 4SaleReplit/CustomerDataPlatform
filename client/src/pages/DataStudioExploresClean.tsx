import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  PieChart, 
  BarChart3, 
  LineChart, 
  Plus, 
  Search,
  Filter,
  Play,
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
import { CodeMirrorSQLEditor } from '@/components/dashboard/CodeMirrorSQLEditor';
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
  query: string;
  visualizationType: 'line' | 'bar' | 'pie' | 'table' | 'number';
  tags: string[];
  createdBy: string;
  lastModified: string;
  isPublic: boolean;
  icon: React.ReactNode;
}

export function DataStudioExplores() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showNewExplore, setShowNewExplore] = useState(false);
  const [newExploreQuery, setNewExploreQuery] = useState('');

  // Sample explores data
  const explores: Explore[] = [
    {
      id: '1',
      name: 'User Segmentation Overview',
      description: 'Complete view of user segmentation data with listings and revenue metrics',
      query: 'SELECT * FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 LIMIT 100',
      visualizationType: 'table',
      tags: ['users', 'segmentation', 'overview'],
      createdBy: 'Sarah Chen',
      lastModified: '2 hours ago',
      isPublic: true,
      icon: <Database className="h-6 w-6" />
    },
    {
      id: '2',
      name: 'Total Listings Count',
      description: 'Sum of all listing counts across all users',
      query: 'SELECT SUM(TOTAL_LISTINGS_COUNT) as total_listings FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE TOTAL_LISTINGS_COUNT IS NOT NULL',
      visualizationType: 'number',
      tags: ['listings', 'metrics'],
      createdBy: 'Mike Johnson',
      lastModified: '1 day ago',
      isPublic: false,
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      id: '3',
      name: 'Listings by User Type',
      description: 'Distribution of listings across different user types',
      query: 'SELECT USER_TYPE, COUNT(*) as user_count, AVG(TOTAL_LISTINGS_COUNT) as avg_listings FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE USER_TYPE IS NOT NULL GROUP BY USER_TYPE ORDER BY avg_listings DESC',
      visualizationType: 'bar',
      tags: ['user_type', 'distribution'],
      createdBy: 'Emma Davis',
      lastModified: '3 hours ago',
      isPublic: true,
      icon: <BarChart3 className="h-6 w-6" />
    }
  ];

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'line': return <LineChart className="h-4 w-4" />;
      case 'bar': return <BarChart3 className="h-4 w-4" />;
      case 'pie': return <PieChart className="h-4 w-4" />;
      case 'number': return <TrendingUp className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const filteredExplores = explores.filter(explore => {
    const matchesSearch = explore.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         explore.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || explore.visualizationType === selectedType;
    return matchesSearch && matchesType;
  });

  const renderVisualizationPreview = (explore: Explore) => {
    switch (explore.visualizationType) {
      case 'line':
        return (
          <div className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-around p-2">
              {[40, 30, 60, 80, 50].map((height, i) => (
                <div key={i} className="w-1 bg-blue-500 rounded-t" style={{ height: `${height}%` }} />
              ))}
            </div>
            <LineChart className="h-8 w-8 text-blue-600 z-10" />
          </div>
        );
      case 'bar':
        return (
          <div className="h-32 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-around p-2">
              {[60, 40, 80, 70, 50].map((height, i) => (
                <div key={i} className="w-3 bg-green-500 rounded-t" style={{ height: `${height}%` }} />
              ))}
            </div>
            <BarChart3 className="h-8 w-8 text-green-600 z-10" />
          </div>
        );
      case 'pie':
        return (
          <div className="h-32 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-8 border-purple-500 border-r-purple-300 border-b-purple-300" />
            </div>
            <PieChart className="h-8 w-8 text-purple-600 z-10" />
          </div>
        );
      case 'number':
        return (
          <div className="h-32 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded flex items-center justify-center flex-col">
            <div className="text-2xl font-bold text-orange-600">1,234</div>
            <div className="text-sm text-orange-500">Total Count</div>
          </div>
        );
      default:
        return (
          <div className="h-32 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded flex items-center justify-center">
            <Database className="h-8 w-8 text-gray-500" />
          </div>
        );
    }
  };

  const handleDuplicateExplore = (explore: Explore) => {
    console.log('Duplicating explore:', explore.name);
  };

  const handleDeleteExplore = (explore: Explore) => {
    console.log('Deleting explore:', explore.name);
  };

  const handleRunQuery = (explore: Explore) => {
    console.log('Running query for explore:', explore.name);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Data Explores</h1>
            <p className="text-muted-foreground">Create and manage data explorations</p>
          </div>
          
          {/* New Explore Dialog */}
          <Dialog open={showNewExplore} onOpenChange={setShowNewExplore}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Explore
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
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
                    <Select defaultValue="line">
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
                  <div className="mt-2">
                    <CodeMirrorSQLEditor
                      value={newExploreQuery}
                      onChange={setNewExploreQuery}
                      placeholder="SELECT USER_TYPE, COUNT(*) as user_count, AVG(TOTAL_LISTINGS_COUNT) as avg_listings FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE USER_TYPE IS NOT NULL GROUP BY USER_TYPE ORDER BY avg_listings DESC"
                      className="min-h-32"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="explore-tags">Tags (comma separated)</Label>
                  <Input id="explore-tags" placeholder="users, revenue, monthly" />
                </div>
                <div className="flex justify-between pt-4">
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Test Query
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowNewExplore(false)}>Cancel</Button>
                    <Button onClick={() => setShowNewExplore(false)}>Create Explore</Button>
                  </div>
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
              <SelectItem value="line">Line Charts</SelectItem>
              <SelectItem value="bar">Bar Charts</SelectItem>
              <SelectItem value="pie">Pie Charts</SelectItem>
              <SelectItem value="table">Tables</SelectItem>
              <SelectItem value="number">Metrics</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
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
                      <Link href={`/data-studio/explores/${explore.id}`}>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/data-studio/explores/${explore.id}/edit`}>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={() => handleDuplicateExplore(explore)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRunQuery(explore)}>
                        <Play className="h-4 w-4 mr-2" />
                        Run Query
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteExplore(explore)}>
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
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>by {explore.createdBy}</span>
                  <span>{explore.lastModified}</span>
                </div>
                
                {/* Visualization Preview */}
                <div className="mb-3">
                  {renderVisualizationPreview(explore)}
                </div>
                
                <div className="p-2 bg-muted/50 rounded text-xs font-mono">
                  {explore.query.length > 60 ? `${explore.query.substring(0, 60)}...` : explore.query}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}