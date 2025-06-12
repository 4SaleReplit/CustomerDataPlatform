import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LayoutDashboard, 
  Plus, 
  Search,
  Grid,
  List,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  FolderPlus,
  Folder,
  Eye,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  folderId?: string;
  folderName?: string;
  tileCount: number;
  lastModified: string;
  createdBy: string;
  isPublic: boolean;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  dashboardCount: number;
  lastModified: string;
}

export function DataStudioDashboards() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewDashboard, setShowNewDashboard] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Sample data - in real app this would come from API
  const folders: Folder[] = [
    { id: '1', name: 'Marketing Dashboards', description: 'Customer and campaign analytics', dashboardCount: 8, lastModified: '2 days ago' },
    { id: '2', name: 'Product Analytics', description: 'Feature usage and performance metrics', dashboardCount: 12, lastModified: '1 week ago' },
    { id: '3', name: 'Financial Reports', description: 'Revenue and cost analysis', dashboardCount: 5, lastModified: '3 days ago' },
    { id: '4', name: 'Executive Summary', description: 'High-level KPIs and trends', dashboardCount: 3, lastModified: '1 day ago' },
  ];

  const dashboards: Dashboard[] = [
    { id: '1', name: 'Customer Acquisition Funnel', description: 'Track user journey from signup to conversion', folderId: '1', folderName: 'Marketing Dashboards', tileCount: 8, lastModified: '2 hours ago', createdBy: 'admin', isPublic: true },
    { id: '2', name: 'Revenue Overview', description: 'Monthly revenue trends and forecasts', folderId: '3', folderName: 'Financial Reports', tileCount: 6, lastModified: '1 day ago', createdBy: 'finance_team', isPublic: false },
    { id: '3', name: 'User Engagement Metrics', description: 'Daily and weekly user activity patterns', folderId: '2', folderName: 'Product Analytics', tileCount: 12, lastModified: '3 hours ago', createdBy: 'product_team', isPublic: true },
    { id: '4', name: 'Campaign Performance', description: 'Marketing campaign ROI and effectiveness', folderId: '1', folderName: 'Marketing Dashboards', tileCount: 10, lastModified: '1 week ago', createdBy: 'marketing_team', isPublic: true },
    { id: '5', name: 'Executive KPIs', description: 'Key performance indicators for leadership', folderId: '4', folderName: 'Executive Summary', tileCount: 5, lastModified: '12 hours ago', createdBy: 'admin', isPublic: false },
  ];

  const filteredDashboards = dashboards.filter(dashboard => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dashboard.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || dashboard.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const handleCreateDashboard = () => {
    // Navigate to dashboard builder
    console.log('Creating new dashboard...');
    setShowNewDashboard(false);
  };

  const handleCreateFolder = () => {
    // Create new folder
    console.log('Creating new folder...');
    setShowNewFolder(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboards</h1>
            <p className="text-muted-foreground">
              Create and manage interactive dashboards with tiles and visualizations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input id="folder-name" placeholder="Enter folder name" />
                  </div>
                  <div>
                    <Label htmlFor="folder-description">Description (optional)</Label>
                    <Textarea id="folder-description" placeholder="Enter folder description" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewDashboard} onOpenChange={setShowNewDashboard}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Dashboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dashboard-name">Dashboard Name</Label>
                    <Input id="dashboard-name" placeholder="Enter dashboard name" />
                  </div>
                  <div>
                    <Label htmlFor="dashboard-description">Description</Label>
                    <Textarea id="dashboard-description" placeholder="Enter dashboard description" />
                  </div>
                  <div>
                    <Label htmlFor="dashboard-folder">Folder</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="root">Root (No folder)</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewDashboard(false)}>Cancel</Button>
                    <Button onClick={handleCreateDashboard}>Create Dashboard</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedFolder || 'all'} onValueChange={(value) => setSelectedFolder(value === 'all' ? null : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Folders Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Folders</h3>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Folder className="h-8 w-8 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{folder.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {folder.dashboardCount} dashboards • {folder.lastModified}
                        </p>
                        {folder.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {folder.description}
                          </p>
                        )}
                      </div>
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
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Dashboards Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              Dashboards {selectedFolder && `in ${folders.find(f => f.id === selectedFolder)?.name}`}
            </h3>
            <Badge variant="outline">
              {filteredDashboards.length} dashboard{filteredDashboards.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredDashboards.map((dashboard) => (
              <Card key={dashboard.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <LayoutDashboard className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{dashboard.name}</h4>
                          {dashboard.isPublic && (
                            <Badge variant="secondary" className="text-xs">Public</Badge>
                          )}
                        </div>
                        {dashboard.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {dashboard.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{dashboard.tileCount} tiles</span>
                          <span>by {dashboard.createdBy}</span>
                          <span>{dashboard.lastModified}</span>
                        </div>
                        {dashboard.folderName && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Folder className="h-3 w-3 mr-1" />
                              {dashboard.folderName}
                            </Badge>
                          </div>
                        )}
                      </div>
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
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}