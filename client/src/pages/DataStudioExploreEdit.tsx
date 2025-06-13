import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Save, 
  Play, 
  ArrowLeft,
  BarChart3,
  LineChart,
  PieChart as LucidePieChart,
  Database,
  TrendingUp,
  Eye
} from 'lucide-react';
import { CodeMirrorSQLEditor } from '@/components/dashboard/CodeMirrorSQLEditor';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
      name: 'User Type Analysis',
      description: 'Analyze user types and their listing patterns',
      query: 'SELECT USER_TYPE, COUNT(*) as user_count, AVG(TOTAL_LISTINGS_COUNT) as avg_listings\nFROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4\nWHERE USER_TYPE IS NOT NULL\nGROUP BY USER_TYPE\nORDER BY avg_listings DESC',
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
      case 'pie': return <LucidePieChart className="h-5 w-5" />;
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

  // Get available visualization options based on query results
  const getVisualizationOptions = () => {
    if (!queryResults?.success || !queryResults.rows?.length) return [
      { value: 'table', label: 'Table View', icon: Database }
    ];
    
    const options = [{ value: 'table', label: 'Table View', icon: Database }];
    const hasNumericColumns = queryResults.columns?.some((col: any) => 
      col.type === 'fixed' || col.type === 'real' || col.type === 'number' || col.type === 'FIXED'
    );
    
    if (hasNumericColumns && queryResults.columns?.length >= 2) {
      options.push({ value: 'bar', label: 'Bar Chart', icon: BarChart3 });
      options.push({ value: 'line', label: 'Line Chart', icon: LineChart });
      options.push({ value: 'pie', label: 'Pie Chart', icon: PieChart });
    }
    
    if (queryResults.rows?.length === 1 && queryResults.columns?.length === 1 && hasNumericColumns) {
      options.push({ value: 'number', label: 'Metric Card', icon: TrendingUp });
    }
    
    return options;
  };

  // Transform data for chart rendering
  const transformDataForChart = () => {
    if (!queryResults?.rows || !queryResults?.columns) return [];
    
    return queryResults.rows.slice(0, 50).map((row: any[]) => {
      const item: any = {};
      queryResults.columns.forEach((col: any, index: number) => {
        const colName = col.name || col;
        item[colName] = row[index];
      });
      return item;
    });
  };

  const renderVisualization = () => {
    if (isExecuting) {
      return (
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Generating visualization...</p>
          </div>
        </div>
      );
    }

    if (queryResults?.error) {
      return (
        <div className="h-96 flex items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-600 text-sm font-medium mb-2">Query Error</div>
            <p className="text-red-500 text-xs max-w-md">{queryResults.error}</p>
          </div>
        </div>
      );
    }

    if (!queryResults?.success || !queryResults.rows?.length) {
      return (
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <div className="text-center">
            <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No Data</p>
            <p className="text-muted-foreground">Execute query to see visualization</p>
          </div>
        </div>
      );
    }

    const data = transformDataForChart();
    const firstCol = queryResults.columns?.[0]?.name || queryResults.columns?.[0];
    const secondCol = queryResults.columns?.[1]?.name || queryResults.columns?.[1];

    switch (visualizationType) {
      case 'bar':
        if (queryResults.columns?.length >= 2) {
          return (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={firstCol} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={secondCol} fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }
        break;
        
      case 'line':
        if (queryResults.columns?.length >= 2) {
          return (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={firstCol} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey={secondCol} stroke="#3B82F6" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          );
        }
        break;
        
      case 'pie':
        if (queryResults.columns?.length >= 2) {
          const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];
          const pieData = data.map((item: any, index: number) => ({
            name: item[firstCol],
            value: parseFloat(item[secondCol]) || 0,
            fill: COLORS[index % COLORS.length]
          }));
          
          return (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          );
        }
        break;
        
      case 'number':
        if (queryResults.rows?.length === 1 && queryResults.columns?.length === 1) {
          const value = queryResults.rows[0][0];
          return (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-4">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div className="text-xl text-muted-foreground">
                  {firstCol}
                </div>
              </div>
            </div>
          );
        }
        break;
        
      case 'table':
      default:
        return (
          <div className="h-96 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {queryResults.columns?.map((col: any, idx: number) => (
                    <TableHead key={idx} className="font-medium">
                      {col.name || col}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {col.type}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryResults.rows?.slice(0, 100).map((row: any[], rowIdx: number) => (
                  <TableRow key={rowIdx}>
                    {row.map((cell: any, cellIdx: number) => (
                      <TableCell key={cellIdx} className="font-mono text-sm">
                        {cell === null ? (
                          <span className="text-muted-foreground italic">null</span>
                        ) : (
                          String(cell)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
    }
    
    return (
      <div className="h-96 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">
            Visualization not available for this data structure
          </div>
          <p className="text-sm text-muted-foreground">
            Try selecting Table View or execute a query with appropriate data structure
          </p>
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
                <div className="flex items-center justify-between">
                  <CardTitle>Visualization Preview</CardTitle>
                  <Select value={visualizationType} onValueChange={setVisualizationType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getVisualizationOptions().map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
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