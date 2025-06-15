import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  FileText, 
  Calendar, 
  User, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Share
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface Worksheet {
  id: string;
  name: string;
  description: string;
  query: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
}

interface WorksheetsProps {
  onOpenWorksheet?: (worksheet: Worksheet) => void;
  onCreateNew?: () => void;
}

export function Worksheets({ onOpenWorksheet, onCreateNew }: WorksheetsProps) {
  const [worksheets] = useState<Worksheet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(worksheets.flatMap(w => w.tags)));

  const filteredWorksheets = worksheets.filter(worksheet => {
    const matchesSearch = worksheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worksheet.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || worksheet.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleWorksheetAction = (action: string, worksheet: Worksheet) => {
    switch (action) {
      case 'open':
        onOpenWorksheet?.(worksheet);
        break;
      case 'edit':
        // Handle edit
        break;
      case 'duplicate':
        // Handle duplicate
        break;
      case 'delete':
        // Handle delete
        break;
      case 'share':
        // Handle share
        break;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Worksheets</h2>
          <p className="text-muted-foreground">
            Manage and organize your data analysis worksheets
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Worksheet
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search worksheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Tags:</span>
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Worksheets Grid */}
      <div className="flex-1">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorksheets.map((worksheet) => (
              <Card key={worksheet.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{worksheet.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {worksheet.description}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleWorksheetAction('open', worksheet)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWorksheetAction('edit', worksheet)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleWorksheetAction('duplicate', worksheet)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleWorksheetAction('share', worksheet)}>
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleWorksheetAction('delete', worksheet)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {worksheet.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Query Preview */}
                    <div className="bg-muted rounded p-2">
                      <code className="text-xs text-muted-foreground break-all">
                        {worksheet.query.substring(0, 100)}
                        {worksheet.query.length > 100 && '...'}
                      </code>
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        {worksheet.createdBy}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {worksheet.updatedAt.toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleWorksheetAction('open', worksheet)}
                      >
                        <FileText className="mr-2 h-3 w-3" />
                        Open
                      </Button>
                      {worksheet.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWorksheets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No worksheets found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || selectedTag 
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first worksheet to get started"
                }
              </p>
              {!searchTerm && !selectedTag && (
                <Button onClick={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Worksheet
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}