import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FolderPlus, 
  File, 
  MoreHorizontal, 
  Search,
  Grid,
  List,
  Upload,
  Download,
  Edit,
  Trash2,
  Copy,
  Move,
  Share,
  Star,
  Clock,
  User,
  FilePlus,
  Eye,
  ChevronRight,
  Home
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface FolderItem {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  lastModified: string;
  createdBy: string;
  isShared: boolean;
  parentId?: string;
}

interface FileItem {
  id: string;
  name: string;
  type: 'dashboard' | 'explore' | 'query' | 'report';
  lastModified: string;
  size: string;
  createdBy: string;
  folderId?: string;
  isStarred: boolean;
  isShared: boolean;
  tags: string[];
}

export function DataStudioFiles() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [editingItem, setEditingItem] = useState<FolderItem | FileItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: FolderItem | FileItem | null }>({ open: false, item: null });
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'dashboard' | 'explore' | 'query' | 'report'>('dashboard');
  const { toast } = useToast();

  const folders: FolderItem[] = [
    { id: '1', name: 'Marketing Dashboards', description: 'Customer acquisition and campaign performance', itemCount: 12, lastModified: '2 days ago', createdBy: 'admin', isShared: true },
    { id: '2', name: 'Product Analytics', description: 'Feature usage and product metrics', itemCount: 8, lastModified: '1 week ago', createdBy: 'product_team', isShared: false },
    { id: '3', name: 'Financial Reports', description: 'Revenue and cost analysis', itemCount: 5, lastModified: '3 days ago', createdBy: 'finance_team', isShared: true },
    { id: '4', name: 'User Segmentation', description: 'Customer behavior and segment analysis', itemCount: 15, lastModified: '1 day ago', createdBy: 'data_team', isShared: false },
    { id: '5', name: 'Executive Summary', description: 'High-level KPIs for leadership', itemCount: 3, lastModified: '4 hours ago', createdBy: 'admin', isShared: true, parentId: '1' },
  ];

  const files: FileItem[] = [
    { id: '1', name: 'Q4 Revenue Dashboard', type: 'dashboard', lastModified: '2 hours ago', size: '1.2 MB', createdBy: 'finance_team', folderId: '3', isStarred: true, isShared: true, tags: ['revenue', 'quarterly'] },
    { id: '2', name: 'User Cohort Analysis', type: 'explore', lastModified: '1 day ago', size: '856 KB', createdBy: 'data_team', folderId: '4', isStarred: false, isShared: false, tags: ['cohorts', 'users'] },
    { id: '3', name: 'Conversion Funnel Query', type: 'query', lastModified: '3 days ago', size: '2.1 KB', createdBy: 'marketing_team', folderId: '1', isStarred: true, isShared: true, tags: ['conversion', 'funnel'] },
    { id: '4', name: 'Customer Lifetime Value', type: 'dashboard', lastModified: '1 week ago', size: '1.8 MB', createdBy: 'product_team', folderId: '2', isStarred: false, isShared: false, tags: ['ltv', 'customers'] },
    { id: '5', name: 'Monthly KPI Report', type: 'report', lastModified: '5 hours ago', size: '945 KB', createdBy: 'admin', isStarred: true, isShared: true, tags: ['kpi', 'monthly'] },
  ];

  const currentFolderData = currentFolder ? folders.find(f => f.id === currentFolder) : null;
  const currentFolderItems = currentFolder ? folders.filter(f => f.parentId === currentFolder) : folders.filter(f => !f.parentId);
  const currentFiles = currentFolder ? files.filter(f => f.folderId === currentFolder) : files.filter(f => !f.folderId);

  const breadcrumbs = [];
  if (currentFolder) {
    const folder = folders.find(f => f.id === currentFolder);
    if (folder) {
      breadcrumbs.push({ name: folder.name, id: folder.id });
      // Add parent breadcrumbs if nested
      let parent = folder.parentId ? folders.find(f => f.id === folder.parentId) : null;
      while (parent) {
        breadcrumbs.unshift({ name: parent.name, id: parent.id });
        parent = parent.parentId ? folders.find(f => f.id === parent.parentId) : null;
      }
    }
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName,
      description: newFolderDescription,
      itemCount: 0,
      lastModified: 'Just now',
      createdBy: 'current_user',
      isShared: false,
      parentId: currentFolder || undefined
    };
    
    toast({
      title: "Folder created",
      description: `"${newFolderName}" has been created successfully.`,
    });
    
    setNewFolderName('');
    setNewFolderDescription('');
    setShowNewFolder(false);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: newFileName,
      type: newFileType,
      lastModified: 'Just now',
      size: '0 KB',
      createdBy: 'current_user',
      folderId: currentFolder || undefined,
      isStarred: false,
      isShared: false,
      tags: []
    };
    
    toast({
      title: "File created",
      description: `"${newFileName}" has been created successfully.`,
    });
    
    setNewFileName('');
    setShowNewFile(false);
  };

  const handleDeleteItem = () => {
    if (!deleteDialog.item) return;
    
    toast({
      title: "Item deleted",
      description: `"${deleteDialog.item.name}" has been deleted successfully.`,
    });
    
    setDeleteDialog({ open: false, item: null });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'dashboard': return '📊';
      case 'explore': return '🔍';
      case 'query': return '📝';
      case 'report': return '📋';
      default: return '📄';
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'dashboard': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'explore': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'query': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'report': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">File System</h1>
            <p className="text-muted-foreground">
              Organize and manage your dashboards, reports, and visualizations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showNewFile} onOpenChange={setShowNewFile}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-name">File Name</Label>
                    <Input 
                      id="file-name" 
                      placeholder="Enter file name" 
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="file-type">File Type</Label>
                    <Select value={newFileType} onValueChange={(value: any) => setNewFileType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="explore">Explore</SelectItem>
                        <SelectItem value="query">SQL Query</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewFile(false)}>Cancel</Button>
                    <Button onClick={handleCreateFile}>Create File</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
              <DialogTrigger asChild>
                <Button size="sm">
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
                    <Input 
                      id="folder-name" 
                      placeholder="Enter folder name" 
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder-description">Description (optional)</Label>
                    <Textarea 
                      id="folder-description" 
                      placeholder="Enter folder description" 
                      value={newFolderDescription}
                      onChange={(e) => setNewFolderDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentFolder(null)}
            className="p-1 h-auto"
          >
            <Home className="h-4 w-4" />
          </Button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="h-4 w-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder(crumb.id)}
                className="p-1 h-auto font-medium"
              >
                {crumb.name}
              </Button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
        {currentFolderItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Folders</h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
              {currentFolderItems.map((folder) => (
                <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1"
                        onClick={() => setCurrentFolder(folder.id)}
                      >
                        <Folder className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{folder.name}</h4>
                            {folder.isShared && (
                              <Badge variant="secondary" className="text-xs">Shared</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {folder.itemCount} items • {folder.lastModified}
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
                          <DropdownMenuItem onClick={() => setCurrentFolder(folder.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteDialog({ open: true, item: folder })}
                          >
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
        )}

        {currentFolderItems.length > 0 && currentFiles.length > 0 && <Separator />}

        {/* Files Section */}
        {currentFiles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Files</h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {currentFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl flex-shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{file.name}</h4>
                            {file.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            {file.isShared && (
                              <Badge variant="secondary" className="text-xs">Shared</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-xs ${getFileTypeColor(file.type)}`}>
                              {file.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {file.createdBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {file.lastModified}
                            </span>
                          </div>
                          {file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {file.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
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
                            Open
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
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Move className="h-4 w-4 mr-2" />
                            Move
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteDialog({ open: true, item: file })}
                          >
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
        )}

        {/* Empty State */}
        {currentFolderItems.length === 0 && currentFiles.length === 0 && (
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {currentFolder ? 'This folder is empty' : 'No files or folders'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first {currentFolder ? 'item' : 'folder or file'} to get started
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowNewFolder(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button variant="outline" onClick={() => setShowNewFile(true)}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{deleteDialog.item?.name}"
              {deleteDialog.item && 'itemCount' in deleteDialog.item && deleteDialog.item.itemCount > 0 
                ? ` and all ${deleteDialog.item.itemCount} items inside it.`
                : '.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}