import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Database, BarChart, LineChart, PieChart, Table, Activity, Eye, Save, Loader2 } from 'lucide-react';
import { CodeMirrorSQLEditor } from './CodeMirrorSQLEditor';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import type { DashboardTile } from './DashboardBuilder';
import { useToast } from '@/hooks/use-toast';

interface AddTileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tile: DashboardTile) => void;
}

const TILE_TYPES = [
  { value: 'metric', label: 'Metric Card', icon: Activity },
  { value: 'chart', label: 'Line Chart', icon: LineChart },
  { value: 'bar', label: 'Bar Chart', icon: BarChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'table', label: 'Data Table', icon: Table }
];

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function AddTileDialog({ isOpen, onClose, onSave }: AddTileDialogProps) {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('query');
  const [tileConfig, setTileConfig] = useState({
    title: '',
    type: 'metric' as DashboardTile['type'],
    query: 'SELECT COUNT(*) as total_users FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
    width: 4,
    height: 2
  });
  
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [hasExecuted, setHasExecuted] = useState(false);

  const executeQuery = async () => {
    if (!tileConfig.query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);

    try {
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: tileConfig.query,
          limit: 100
        }),
      });

      if (!response.ok) {
        throw new Error(`SQL execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      setQueryResult(result.data || []);
      setHasExecuted(true);
      setCurrentTab('preview');
      
      toast({
        title: "Query executed successfully",
        description: `Retrieved ${result.data?.length || 0} rows`
      });
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Query execution failed');
      toast({
        title: "Query execution failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderDataPreview = () => {
    if (!hasExecuted) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <div className="text-center">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Execute your query to see data preview</p>
          </div>
        </div>
      );
    }

    if (executionError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2">Query Error</h4>
          <p className="text-red-600 text-sm">{executionError}</p>
        </div>
      );
    }

    if (queryResult.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data returned from query</p>
        </div>
      );
    }

    const columns = Object.keys(queryResult[0]);
    const previewRows = queryResult.slice(0, 10);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{queryResult.length} rows</Badge>
            <Badge variant="outline">{columns.length} columns</Badge>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="text-left p-2 font-medium border-r">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    {columns.map((col) => (
                      <td key={col} className="p-2 border-r">
                        {row[col]?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {queryResult.length > 10 && (
          <p className="text-xs text-muted-foreground">
            Showing first 10 rows of {queryResult.length} total rows
          </p>
        )}
      </div>
    );
  };

  const renderVisualization = () => {
    if (!hasExecuted || queryResult.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Execute query and select visualization type to see preview</p>
          </div>
        </div>
      );
    }

    const data = queryResult.slice(0, 20); // Limit for visualization

    switch (tileConfig.type) {
      case 'metric':
        const metricValue = data[0] ? Object.values(data[0])[0] : 0;
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue}
              </div>
              <div className="text-muted-foreground">{tileConfig.title || 'Metric Value'}</div>
            </div>
          </div>
        );

      case 'chart':
        const chartData = data.map((row, idx) => ({
          name: Object.values(row)[0]?.toString() || `Item ${idx + 1}`,
          value: Number(Object.values(row)[1]) || 0
        }));
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        const barData = data.map((row, idx) => ({
          name: Object.values(row)[0]?.toString() || `Item ${idx + 1}`,
          value: Number(Object.values(row)[1]) || 0
        }));
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = data.slice(0, 6).map((row, idx) => ({
          name: Object.values(row)[0]?.toString() || `Item ${idx + 1}`,
          value: Number(Object.values(row)[1]) || 0
        }));
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'table':
        return renderDataPreview();

      default:
        return renderDataPreview();
    }
  };

  const handleSave = () => {
    if (!tileConfig.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tile title",
        variant: "destructive"
      });
      return;
    }

    if (!tileConfig.query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query",
        variant: "destructive"
      });
      return;
    }

    if (!hasExecuted) {
      toast({
        title: "Error",
        description: "Please execute the query first to validate it",
        variant: "destructive"
      });
      return;
    }

    const newTile: DashboardTile = {
      id: `tile-${Date.now()}`,
      type: tileConfig.type,
      title: tileConfig.title,
      x: 0,
      y: 0,
      width: tileConfig.width,
      height: tileConfig.height,
      dataSource: {
        table: 'custom',
        query: tileConfig.query,
        aggregation: 'custom'
      },
      refreshConfig: {
        autoRefresh: false,
        refreshOnLoad: true
      }
    };

    onSave(newTile);
    onClose();
    
    // Reset form
    setTileConfig({
      title: '',
      type: 'metric',
      query: 'SELECT COUNT(*) as total_users FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
      width: 4,
      height: 2
    });
    setQueryResult([]);
    setHasExecuted(false);
    setExecutionError(null);
    setCurrentTab('query');

    toast({
      title: "Tile added successfully",
      description: "Your new tile has been added to the dashboard"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Tile</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query">SQL Query</TabsTrigger>
              <TabsTrigger value="preview">Data Preview</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="query" className="h-full space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tile Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter tile title..."
                      value={tileConfig.title}
                      onChange={(e) => setTileConfig({ ...tileConfig, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Visualization Type</Label>
                    <Select
                      value={tileConfig.type}
                      onValueChange={(value) => setTileConfig({ ...tileConfig, type: value as DashboardTile['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TILE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>SQL Query</Label>
                    <Button 
                      onClick={executeQuery} 
                      disabled={isExecuting || !tileConfig.query.trim()}
                      size="sm"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute Query
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="h-64 border rounded-lg overflow-hidden">
                    <CodeMirrorSQLEditor
                      value={tileConfig.query}
                      onChange={(value) => setTileConfig({ ...tileConfig, query: value })}
                      height="100%"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (columns)</Label>
                    <Select
                      value={tileConfig.width.toString()}
                      onValueChange={(value) => setTileConfig({ ...tileConfig, width: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 columns</SelectItem>
                        <SelectItem value="3">3 columns</SelectItem>
                        <SelectItem value="4">4 columns</SelectItem>
                        <SelectItem value="6">6 columns</SelectItem>
                        <SelectItem value="8">8 columns</SelectItem>
                        <SelectItem value="12">12 columns (full width)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (rows)</Label>
                    <Select
                      value={tileConfig.height.toString()}
                      onValueChange={(value) => setTileConfig({ ...tileConfig, height: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 row</SelectItem>
                        <SelectItem value="2">2 rows</SelectItem>
                        <SelectItem value="3">3 rows</SelectItem>
                        <SelectItem value="4">4 rows</SelectItem>
                        <SelectItem value="6">6 rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full overflow-auto">
                    {renderDataPreview()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualization" className="h-full mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Visualization Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full overflow-auto">
                    {renderVisualization()}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Separator />
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasExecuted || !tileConfig.title.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Add Tile to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}