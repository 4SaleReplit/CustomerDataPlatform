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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Database, BarChart, LineChart, PieChart, Table, Activity, Eye, Save, Loader2 } from 'lucide-react';
import { CodeMirrorSQLEditor } from './CodeMirrorSQLEditor';
import { EChartsRenderer, ChartType } from '@/components/charts/EChartsRenderer';
import { ChartTypeSelector } from '@/components/charts/ChartTypeSelector';
import type { DashboardTile } from './DashboardBuilder';
import { useToast } from '@/hooks/use-toast';

interface AddTileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tile: DashboardTile) => void;
  editTile?: DashboardTile | null;
}

const TILE_TYPES = [
  { value: 'metric', label: 'Metric Card', icon: Activity },
  { value: 'chart', label: 'Line Chart', icon: LineChart },
  { value: 'bar', label: 'Bar Chart', icon: BarChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'table', label: 'Data Table', icon: Table }
];

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function AddTileDialog({ isOpen, onClose, onSave, editTile }: AddTileDialogProps) {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('query');
  const [tileConfig, setTileConfig] = useState({
    title: editTile?.title || '',
    type: (editTile?.type || 'metric') as DashboardTile['type'],
    chartType: (editTile?.chartType || 'line') as ChartType,
    query: editTile?.dataSource?.query || 'SELECT COUNT(*) as total_users FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
    width: editTile?.width || 4,
    height: editTile?.height || 2
  });
  
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [hasExecuted, setHasExecuted] = useState(false);

  // Reset form when editTile changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setTileConfig({
        title: editTile?.title || '',
        type: (editTile?.type || 'metric') as DashboardTile['type'],
        chartType: (editTile?.chartType || 'line') as ChartType,
        query: editTile?.dataSource?.query || 'SELECT COUNT(*) as total_users FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
        width: editTile?.width || 4,
        height: editTile?.height || 2
      });
      setQueryResult([]);
      setExecutionError(null);
      setHasExecuted(false);
      setCurrentTab('query');
    }
  }, [isOpen, editTile]);

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
          query: tileConfig.query
        }),
      });

      if (!response.ok) {
        throw new Error(`SQL execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Query execution failed');
      }

      // Convert rows array to objects using column names
      const columns = result.columns || [];
      const rows = result.rows || [];
      const convertedData = rows.map((row: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: any, index: number) => {
          obj[col.name] = row[index];
        });
        return obj;
      });

      setQueryResult(convertedData);
      setHasExecuted(true);
      
      toast({
        title: "Query executed successfully",
        description: `Retrieved ${rows.length} rows`
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
                {typeof metricValue === 'number' ? metricValue.toLocaleString() : String(metricValue || 0)}
              </div>
              <div className="text-muted-foreground">{tileConfig.title || 'Metric Value'}</div>
            </div>
          </div>
        );

      case 'chart':
      case 'bar':
      case 'pie':
        const chartData = data.map((row, idx) => ({
          name: Object.values(row)[0]?.toString() || `Item ${idx + 1}`,
          value: Number(Object.values(row)[1]) || 0,
          x: Object.values(row)[0]?.toString() || `Item ${idx + 1}`,
          y: Number(Object.values(row)[1]) || 0,
          category: Object.values(row)[0]?.toString() || `Item ${idx + 1}`
        }));

        return (
          <div className="w-full h-[300px]">
            <EChartsRenderer
              type={tileConfig.chartType}
              data={chartData}
              width="100%"
              height={300}
              theme="light"
            />
          </div>
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
      id: editTile?.id || `tile-${Date.now()}`,
      type: tileConfig.type,
      title: tileConfig.title,
      x: editTile?.x || 0,
      y: editTile?.y || 0,
      width: tileConfig.width,
      height: tileConfig.height,
      chartType: tileConfig.chartType,
      dataSource: {
        table: 'custom',
        query: tileConfig.query,
        aggregation: 'custom'
      },
      refreshConfig: {
        autoRefresh: editTile?.refreshConfig?.autoRefresh || false,
        refreshOnLoad: editTile?.refreshConfig?.refreshOnLoad || true
      }
    };

    onSave(newTile);
    onClose();
    
    // Reset form
    setTileConfig({
      title: '',
      type: 'metric',
      chartType: 'line',
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
          <DialogTitle>{editTile ? 'Edit Tile' : 'Add New Tile'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="query">SQL Query</TabsTrigger>
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
                  
                  {(tileConfig.type === 'chart' || tileConfig.type === 'bar' || tileConfig.type === 'pie') && (
                    <div className="space-y-2">
                      <Label>Chart Type</Label>
                      <ChartTypeSelector
                        onSelectChartType={(chartType) => setTileConfig({ ...tileConfig, chartType })}
                        trigger={
                          <Button variant="outline" className="w-full justify-start">
                            <BarChart className="h-4 w-4 mr-2" />
                            {tileConfig.chartType.charAt(0).toUpperCase() + tileConfig.chartType.slice(1)} Chart
                          </Button>
                        }
                      />
                    </div>
                  )}
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
                    />
                  </div>
                </div>

                {/* Data Preview Section */}
                {hasExecuted && (
                  <div className="space-y-2">
                    <Label>Data Preview</Label>
                    <div className="h-48 border rounded-lg overflow-hidden">
                      {executionError ? (
                        <div className="p-4 text-destructive">
                          <strong>Error:</strong> {executionError}
                        </div>
                      ) : queryResult.length > 0 ? (
                        <div className="h-full overflow-auto">
                          <TableComponent className="min-w-full">
                            <TableHeader className="sticky top-0 z-10 bg-background">
                              <TableRow>
                                {Object.keys(queryResult[0] || {}).map((column) => (
                                  <TableHead key={column} className="whitespace-nowrap px-4 py-2 font-semibold bg-muted">
                                    {column}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {queryResult.slice(0, 10).map((row, idx) => (
                                <TableRow key={idx}>
                                  {Object.values(row).map((value, colIdx) => (
                                    <TableCell key={colIdx} className="whitespace-nowrap px-4 py-2">
                                      {value?.toString() || 'NULL'}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </TableComponent>
                          {queryResult.length > 10 && (
                            <div className="p-2 text-sm text-muted-foreground text-center bg-background border-t sticky bottom-0">
                              Showing first 10 rows of {queryResult.length} total rows
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-muted-foreground">
                          No data returned from query
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
            {editTile ? 'Save Edits' : 'Add Tile to Dashboard'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}