import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Play, 
  ArrowLeft,
  BarChart3,
  LineChart,
  PieChart,
  Database,
  TrendingUp,
  Eye
} from 'lucide-react';
import { CodeMirrorSQLEditor } from '@/components/dashboard/CodeMirrorSQLEditor';

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
}

export function DataStudioExploreEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [visualizationType, setVisualizationType] = useState<string>('line');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load explore data
  useEffect(() => {
    const mockExplore: Explore = {
      id: id || '1',
      name: 'User Segmentation Analysis',
      description: 'Analyze user segments and their listing patterns',
      query: 'SELECT USER_SEGMENT, COUNT(*) as user_count, AVG(TOTAL_LISTINGS_COUNT) as avg_listings\nFROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4\nWHERE USER_SEGMENT IS NOT NULL\nGROUP BY USER_SEGMENT\nORDER BY avg_listings DESC',
      visualizationType: 'bar',
      tags: ['users', 'segments', 'listings'],
      createdBy: 'Sarah Chen',
      lastModified: '2 hours ago',
      isPublic: true
    };
    
    setName(mockExplore.name);
    setDescription(mockExplore.description);
    setQuery(mockExplore.query);
    setVisualizationType(mockExplore.visualizationType);
    setTags(mockExplore.tags.join(', '));
    setIsPublic(mockExplore.isPublic);
  }, [id]);

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'line': return <LineChart className="h-5 w-5" />;
      case 'bar': return <BarChart3 className="h-5 w-5" />;
      case 'pie': return <PieChart className="h-5 w-5" />;
      case 'number': return <TrendingUp className="h-5 w-5" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    try {
      const response = await fetch('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setQueryResults(result);
    } catch (error) {
      console.error('Query execution failed:', error);
      setQueryResults({ 
        error: error instanceof Error ? error.message : 'Query execution failed. Please check your query syntax and try again.' 
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const saveExplore = async () => {
    setIsSaving(true);
    try {
      // Here you would make API call to save the explore
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Saving explore:', { name, description, query, visualizationType, tags, isPublic });
      setLocation(`/data-studio/explores/${id}`);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderVisualization = () => {
    if (isExecuting) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Generating visualization...</p>
          </div>
        </div>
      );
    }

    if (queryResults?.error) {
      return (
        <div className="h-64 flex items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-600 text-sm font-medium mb-2">Query Error</div>
            <p className="text-red-500 text-xs max-w-md">{queryResults.error}</p>
          </div>
        </div>
      );
    }

    if (queryResults && queryResults.rows && queryResults.columns) {
      const value = queryResults.rows[0]?.[0];
      const firstCol = queryResults.columns[0]?.name || queryResults.columns[0];
      
      return (
        <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center">
            {getVisualizationIcon(visualizationType)}
            <div className="mt-2">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {visualizationType === 'number' ? 
                  (typeof value === 'number' ? value.toLocaleString() : value) :
                  `${queryResults.rows.length} records`
                }
              </div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {visualizationType === 'number' ? firstCol : `${visualizationType} Chart Preview`}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center">
          {getVisualizationIcon(visualizationType)}
          <p className="text-sm text-muted-foreground mt-2">Run query to preview visualization</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/data-studio/explores/${id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to View
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Edit Explore</h1>
              <p className="text-muted-foreground">Modify your data exploration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/data-studio/explores/${id}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
            <Button onClick={saveExplore} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="explore-name">Name</Label>
                  <Input 
                    id="explore-name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter explore name" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="explore-description">Description</Label>
                  <Input 
                    id="explore-description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="explore-type">Visualization Type</Label>
                  <Select value={visualizationType} onValueChange={setVisualizationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="table">Data Table</SelectItem>
                      <SelectItem value="number">Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="explore-tags">Tags</Label>
                  <Input 
                    id="explore-tags" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="users, revenue, monthly" 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="explore-public">Public Access</Label>
                  <Switch 
                    id="explore-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Visualization Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Visualization Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {renderVisualization()}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - SQL Editor */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>SQL Query</CardTitle>
                  <Button onClick={executeQuery} disabled={isExecuting} size="sm">
                    {isExecuting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Query
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-full">
                <CodeMirrorSQLEditor
                  value={query}
                  onChange={setQuery}
                  placeholder="SELECT * FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 LIMIT 100"
                  className="h-full min-h-96"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Query Results */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  Query Results
                  {queryResults && queryResults.rows && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({queryResults.rows.length} rows)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                {isExecuting ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm">Executing query...</p>
                    </div>
                  </div>
                ) : queryResults?.error ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-red-600 text-sm font-medium mb-2">Query Error</div>
                      <p className="text-red-500 text-xs max-w-md">{queryResults.error}</p>
                      <Button onClick={executeQuery} size="sm" className="mt-4">
                        <Play className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : queryResults && queryResults.rows && queryResults.columns ? (
                  <div className="h-96 overflow-hidden">
                    <div className="overflow-auto h-full border rounded-lg">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50 sticky top-0">
                            {queryResults.columns.map((col: any, idx: number) => (
                              <th key={idx} className="border-b border-border p-2 text-left font-semibold text-xs">
                                {col.name || col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResults.rows.slice(0, 100).map((row: any[], rowIdx: number) => (
                            <tr key={rowIdx} className="hover:bg-muted/25">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="border-b border-border p-2 text-xs">
                                  {cell?.toString() || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <div className="text-center">
                      <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Run query to see results</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}