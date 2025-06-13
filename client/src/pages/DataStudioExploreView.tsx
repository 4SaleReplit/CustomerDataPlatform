import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Edit, 
  Play, 
  Copy, 
  ArrowLeft,
  BarChart3,
  LineChart,
  PieChart as LucidePieChart,
  Database,
  TrendingUp,
  RefreshCw
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

export function DataStudioExploreView() {
  const { id } = useParams<{ id: string }>();
  const [explore, setExplore] = useState<Explore | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);

  // Load explore data and execute query automatically
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
    setExplore(mockExplore);
    
    // Auto-execute query to load cached visualization
    executeQuery(mockExplore.query);
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

  const executeQuery = async (query?: string) => {
    const queryToExecute = query || explore?.query;
    if (!queryToExecute) return;

    setIsExecuting(true);
    try {
      const response = await fetch('/api/snowflake/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryToExecute }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setQueryResults(result);
    } catch (error) {
      console.error('Query execution failed:', error);
      setQueryResults({ 
        error: error instanceof Error ? error.message : 'Query execution failed' 
      });
    } finally {
      setIsExecuting(false);
    }
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
            <p className="text-sm">Loading visualization...</p>
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

    switch (explore?.visualizationType) {
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

  if (!explore) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex h-14 items-center gap-4 px-6">
          <Link href="/data-studio/explores">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explores
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            {getVisualizationIcon(explore.visualizationType)}
            <h1 className="text-lg font-semibold">{explore.name}</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => executeQuery()} disabled={isExecuting} variant="outline" size="sm">
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            
            <Link href={`/data-studio/explores/${explore.id}/edit`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Explore Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{explore.name}</h1>
            <p className="text-muted-foreground mb-4">{explore.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Created by {explore.createdBy}</span>
              <span>•</span>
              <span>Last modified {explore.lastModified}</span>
              <span>•</span>
              <Badge variant={explore.isPublic ? "default" : "secondary"}>
                {explore.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {explore.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visualization */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getVisualizationIcon(explore.visualizationType)}
                Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderVisualization()}
            </CardContent>
          </Card>

          {/* Query */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SQL Query</span>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 border rounded-md">
                <CodeMirrorSQLEditor
                  value={explore.query}
                  onChange={() => {}}
                  readOnly={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Query Results Summary */}
        {queryResults?.success && (
          <Card>
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-medium">{queryResults.rows?.length || 0}</span>
                  <span className="text-muted-foreground ml-1">rows returned</span>
                </div>
                <div>
                  <span className="font-medium">{queryResults.columns?.length || 0}</span>
                  <span className="text-muted-foreground ml-1">columns</span>
                </div>
                <div>
                  <span className="font-medium">
                    {queryResults.executionTime ? `${queryResults.executionTime}ms` : 'N/A'}
                  </span>
                  <span className="text-muted-foreground ml-1">execution time</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}