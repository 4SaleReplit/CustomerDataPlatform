
import React, { useState } from 'react';
import { Database, Plus, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConnectionForm } from '@/components/integrations/ConnectionForm';

// Mock existing connections
const mockConnections = [
  {
    id: 1,
    name: 'Production Snowflake',
    type: 'snowflake',
    status: 'connected',
    lastTested: '2024-06-03T14:30:00Z',
    warehouse: 'PROD_WH',
    database: 'CUSTOMER_DB',
    schema: 'PUBLIC'
  },
  {
    id: 2,
    name: 'Analytics PostgreSQL',
    type: 'postgresql',
    status: 'error',
    lastTested: '2024-06-03T14:00:00Z',
    database: 'analytics_db',
    schema: 'public'
  },
  {
    id: 3,
    name: 'Events ClickHouse',
    type: 'clickhouse',
    status: 'testing',
    lastTested: '2024-06-03T13:45:00Z',
    database: 'events',
    cluster: 'prod_cluster'
  }
];

export default function Integrations() {
  const [connections, setConnections] = useState(mockConnections);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      connected: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      error: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      testing: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-3 w-3" /> }
    };
    
    const variant = variants[status] || variants.error;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    return <Database className="h-4 w-4" />;
  };

  const handleTestConnection = async (connectionId: number) => {
    console.log('Testing connection:', connectionId);
    // Update connection status to testing
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId 
        ? { ...conn, status: 'testing', lastTested: new Date().toISOString() }
        : conn
    ));
    
    // Simulate API call
    setTimeout(() => {
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: Math.random() > 0.3 ? 'connected' : 'error' }
          : conn
      ));
    }, 2000);
  };

  const handleDeleteConnection = (connectionId: number) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  };

  const handleSaveConnection = (connectionData: any) => {
    const newConnection = {
      id: Date.now(),
      name: connectionData.name,
      type: connectionData.type,
      status: 'testing',
      lastTested: new Date().toISOString(),
      ...connectionData.config
    };
    
    setConnections(prev => [...prev, newConnection]);
    setIsFormOpen(false);
    
    // Auto-test the new connection
    setTimeout(() => {
      handleTestConnection(newConnection.id);
    }, 1000);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Integrations</h1>
          <p className="text-gray-600 mt-2">Connect your data warehouses and databases</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Data Connection</DialogTitle>
            </DialogHeader>
            <ConnectionForm onSave={handleSaveConnection} onCancel={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.filter(c => c.status === 'connected').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.filter(c => c.status === 'error').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testing</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connections.filter(c => c.status === 'testing').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Database/Warehouse</TableHead>
                <TableHead>Schema</TableHead>
                <TableHead>Last Tested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {getTypeIcon(connection.type)}
                    {connection.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {connection.type.charAt(0).toUpperCase() + connection.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(connection.status)}</TableCell>
                  <TableCell>
                    {connection.warehouse || connection.database || '-'}
                  </TableCell>
                  <TableCell>{connection.schema || '-'}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatTimestamp(connection.lastTested)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(connection.id)}
                        disabled={connection.status === 'testing'}
                      >
                        {connection.status === 'testing' ? 'Testing...' : 'Test'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConnection(connection.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
