import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ColoredSQLEditor } from './ColoredSQLEditor';
import { 
  Play, 
  Save, 
  Download, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table as TableIcon,
  TrendingUp,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface QueryResult {
  columns: Array<{ name: string; type: string }>;
  rows: any[][];
  success: boolean;
  error?: string;
}

interface SQLEditorProps {
  onCreateVisualization?: (data: any, chartType: string) => void;
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

const sampleQueries = [
  {
    name: "User Count by Type",
    query: "SELECT USER_TYPE, COUNT(*) as count FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE USER_TYPE IS NOT NULL GROUP BY USER_TYPE ORDER BY count DESC",
    description: "Breakdown of users by type"
  },
  {
    name: "Top 10 Users by Listings",
    query: "SELECT USER_ID, TOTAL_LISTINGS_COUNT, TOTAL_CREDITS_SPENT FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE TOTAL_LISTINGS_COUNT > 0 ORDER BY TOTAL_LISTINGS_COUNT DESC LIMIT 10",
    description: "Users with most listings"
  },
  {
    name: "Credit Spending Analysis",
    query: "SELECT USER_TYPE, AVG(TOTAL_CREDITS_SPENT) as avg_credits, SUM(TOTAL_CREDITS_SPENT) as total_credits FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE TOTAL_CREDITS_SPENT > 0 GROUP BY USER_TYPE ORDER BY total_credits DESC",
    description: "Credit usage by user type"
  },
  {
    name: "Monthly Activity Trends",
    query: "SELECT ACTIVE_MONTHS_LAST_6, COUNT(*) as user_count FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE ACTIVE_MONTHS_LAST_6 IS NOT NULL GROUP BY ACTIVE_MONTHS_LAST_6 ORDER BY ACTIVE_MONTHS_LAST_6",
    description: "User activity over time"
  }
];

export function SQLEditor({ onCreateVisualization }: SQLEditorProps) {
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedSampleQuery, setSelectedSampleQuery] = useState('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    const startTime = Date.now();
    
    try {
      const result = await apiRequest('/api/snowflake/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });
      
      setExecutionTime(Date.now() - startTime);
      setQueryResult(result);
    } catch (error) {
      setExecutionTime(Date.now() - startTime);
      setQueryResult({
        columns: [],
        rows: [],
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadSampleQuery = (sampleQuery: string) => {
    const sample = sampleQueries.find(q => q.name === sampleQuery);
    if (sample) {
      setQuery(sample.query);
      setSelectedSampleQuery(sampleQuery);
    }
  };

  const getVisualizationOptions = () => {
    if (!queryResult?.success || !queryResult.rows.length) return [];
    
    const options = [];
    const hasNumericColumns = queryResult.columns.some(col => 
      col.type === 'fixed' || col.type === 'real' || col.type === 'number'
    );
    
    // Always show table view
    options.push({ type: 'table', label: 'Table View', icon: TableIcon });
    
    if (hasNumericColumns) {
      // If we have 2 columns with one numeric, suggest bar chart
      if (queryResult.columns && queryResult.columns.length === 2) {
        options.push({ type: 'bar', label: 'Bar Chart', icon: BarChart3 });
        options.push({ type: 'pie', label: 'Pie Chart', icon: PieChart });
      }
      
      // If we have time-series data, suggest line chart
      const hasDateColumn = queryResult.columns.some(col => 
        col.type === 'date' || col.type === 'timestamp' || col.name.toLowerCase().includes('date') || col.name.toLowerCase().includes('time')
      );
      
      if (hasDateColumn) {
        options.push({ type: 'line', label: 'Line Chart', icon: LineChart });
      }
      
      // General metric view for single values
      if (queryResult.rows.length === 1 && queryResult.columns && queryResult.columns.length === 1 && hasNumericColumns) {
        options.push({ type: 'metric', label: 'Metric Card', icon: TrendingUp });
      }
    }
    
    return options;
  };

  const transformDataForChart = (chartType: string) => {
    if (!queryResult?.rows || !queryResult.columns) return [];
    
    return queryResult.rows.map(row => {
      const obj: any = {};
      queryResult.columns!.forEach((col, index) => {
        obj[col.name] = row[index];
      });
      return obj;
    });
  };

  const renderVisualization = (type: string) => {
    const data = transformDataForChart(type);
    
    switch (type) {
      case 'bar':
        if (queryResult?.columns && queryResult.columns.length === 2) {
          const xKey = queryResult.columns[0].name;
          const yKey = queryResult.columns[1].name;
          
          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={yKey} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          );
        }
        break;
        
      case 'line':
        if (queryResult?.columns && queryResult.columns.length >= 2) {
          const xKey = queryResult.columns[0].name;
          const yKey = queryResult.columns[1].name;
          
          return (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={yKey} stroke="#3B82F6" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          );
        }
        break;
        
      case 'pie':
        if (queryResult?.columns && queryResult.columns.length === 2) {
          const nameKey = queryResult.columns[0].name;
          const valueKey = queryResult.columns[1].name;
          
          return (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={data}
                  dataKey={valueKey}
                  nameKey={nameKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          );
        }
        break;
        
      case 'metric':
        if (queryResult?.rows.length === 1 && queryResult.columns.length === 1) {
          const value = queryResult.rows[0][0];
          const label = queryResult.columns[0].name;
          
          return (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="text-4xl font-bold text-primary mb-2">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                {label.replace(/_/g, ' ')}
              </div>
            </div>
          );
        }
        break;
    }
    
    return <div className="flex items-center justify-center h-48 text-muted-foreground">No visualization available</div>;
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Query Editor */}
      <Card className="flex-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              SQL Query Editor
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={selectedSampleQuery} onValueChange={loadSampleQuery}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load sample query" />
                </SelectTrigger>
                <SelectContent>
                  {sampleQueries.map((sample) => (
                    <SelectItem key={sample.name} value={sample.name}>
                      {sample.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={executeQuery} 
                disabled={!query.trim() || isExecuting}
                className="min-w-24"
              >
                {isExecuting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isExecuting ? 'Running' : 'Run Query'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md bg-white dark:bg-gray-950 min-h-32">
            <ColoredSQLEditor
              value={query}
              onChange={setQuery}
              onExecute={executeQuery}
              placeholder="Enter your SQL query here... (Ctrl+Enter to execute)"
              className="w-full h-32"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>Press Ctrl+Enter to execute</span>
            {executionTime && (
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {executionTime}ms
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {queryResult && (
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {queryResult.success ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5 text-red-500" />
                )}
                Query Results
                {queryResult.success && queryResult.rows && (
                  <Badge variant="secondary" className="ml-2">
                    {queryResult.rows.length} rows
                  </Badge>
                )}
              </CardTitle>
              {queryResult.success && queryResult.rows?.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save Query
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {queryResult.success ? (
              queryResult.rows && queryResult.rows.length > 0 ? (
                <Tabs defaultValue="table" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-5">
                    {getVisualizationOptions().map((option) => {
                      const Icon = option.icon;
                      return (
                        <TabsTrigger key={option.type} value={option.type} className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {option.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  
                  <TabsContent value="table" className="flex-1">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {queryResult.columns.map((col) => (
                              <TableHead key={col.name} className="font-medium">
                                {col.name}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {col.type}
                                </Badge>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryResult.rows.map((row, index) => (
                            <TableRow key={index}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="font-mono text-sm">
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
                    </ScrollArea>
                  </TabsContent>
                  
                  {getVisualizationOptions()
                    .filter(option => option.type !== 'table')
                    .map((option) => (
                      <TabsContent key={option.type} value={option.type} className="flex-1">
                        <div className="h-full flex flex-col">
                          <div className="flex-1">
                            {renderVisualization(option.type)}
                          </div>
                          {onCreateVisualization && (
                            <div className="pt-4 border-t">
                              <Button 
                                onClick={() => onCreateVisualization?.(
                                  transformDataForChart(option.type), 
                                  option.type
                                )}
                                className="w-full"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add to Dashboard
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                </Tabs>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Query executed successfully but returned no results
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Query Failed</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {queryResult.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}