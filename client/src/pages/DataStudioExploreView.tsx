import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Play, 
  Copy, 
  ArrowLeft,
  BarChart3,
  LineChart,
  PieChart,
  Database,
  TrendingUp
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

export function DataStudioExploreView() {
  const { id } = useParams<{ id: string }>();
  const [explore, setExplore] = useState<Explore | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);

  // Mock data - replace with actual API call
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
    if (!explore) return;
    
    setIsExecuting(true);
    try {
      const response = await fetch('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: explore.query })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      setQueryResults(result);
    } catch (error) {
      console.error('Query execution failed:', error);
      setQueryResults({ error: 'Query execution failed. Please check your query syntax and try again.' });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderVisualization = () => {
    if (isExecuting) {
      return (
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Generating Visualization...</p>
          </div>
        </div>
      );
    }

    if (queryResults && queryResults.rows && queryResults.columns) {
      const value = queryResults.rows[0]?.[0];
      const firstCol = queryResults.columns[0]?.name || queryResults.columns[0];
      
      return (
        <div className="h-96 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-lg p-8 flex items-center justify-center flex-col">
          <div className="text-center">
            {getVisualizationIcon(explore!.visualizationType)}
            <div className="mt-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {explore!.visualizationType === 'number' ? 
                  (typeof value === 'number' ? value.toLocaleString() : value) :
                  `${queryResults.rows.length} records`
                }
              </div>
              <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                {explore!.visualizationType === 'number' ? firstCol : `${explore!.visualizationType} Chart`}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Query executed successfully
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-96 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {getVisualizationIcon(explore!.visualizationType)}
          </div>
          <p className="text-lg font-medium">Visualization Preview</p>
          <p className="text-muted-foreground">Run query to see visualization</p>
          <Button className="mt-4" onClick={executeQuery} disabled={isExecuting}>
            <Play className="h-4 w-4 mr-2" />
            Run Query
          </Button>
        </div>
      </div>
    );
  };

  if (!explore) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/data-studio/explores">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explores
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getVisualizationIcon(explore.visualizationType)}
                <h1 className="text-2xl font-bold">{explore.name}</h1>
                {explore.isPublic && (
                  <Badge variant="secondary">Public</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{explore.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(explore.query)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Query
            </Button>
            <Button onClick={executeQuery} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Query
                </>
              )}
            </Button>
            <Link href={`/data-studio/explores/${explore.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            {renderVisualization()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Query */}
          <Card>
            <CardHeader>
              <CardTitle>SQL Query</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeMirrorSQLEditor
                value={explore.query}
                onChange={() => {}} // Read-only in view mode
                placeholder=""
                className="min-h-32"
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Explore Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Created by</label>
                <p className="text-sm text-muted-foreground">{explore.createdBy}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Last modified</label>
                <p className="text-sm text-muted-foreground">{explore.lastModified}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {explore.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Visualization Type</label>
                <div className="flex items-center gap-2 mt-1">
                  {getVisualizationIcon(explore.visualizationType)}
                  <span className="text-sm capitalize">{explore.visualizationType}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Query Results */}
        {queryResults && queryResults.rows && queryResults.columns && (
          <Card>
            <CardHeader>
              <CardTitle>Query Results ({queryResults.rows.length} rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-80 border rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50 sticky top-0">
                      {queryResults.columns.map((col: any, idx: number) => (
                        <th key={idx} className="border-b border-border p-3 text-left font-semibold text-sm">
                          {col.name || col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.rows.slice(0, 100).map((row: any[], rowIdx: number) => (
                      <tr key={rowIdx} className="hover:bg-muted/25">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="border-b border-border p-3 text-sm">
                            {cell?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}