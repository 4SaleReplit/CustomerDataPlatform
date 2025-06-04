import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ConnectionFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function ConnectionForm({ onSave, onCancel }: ConnectionFormProps) {
  const [connectionType, setConnectionType] = useState<string>('');
  const [formData, setFormData] = useState<any>({});
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [availableWarehouses, setAvailableWarehouses] = useState<string[]>([]);
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  const connectionTypes = [
    { value: 'snowflake', label: 'Snowflake' },
    { value: 'clickhouse', label: 'ClickHouse' },
    { value: 'postgresql', label: 'PostgreSQL' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    console.log('Testing connection with:', formData);
    setTestResult(null);
    
    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setTestResult(success ? 'success' : 'error');
      
      if (success) {
        // Mock available resources
        if (connectionType === 'snowflake') {
          setAvailableWarehouses(['COMPUTE_WH', 'ANALYTICS_WH', 'PROD_WH']);
          setAvailableSchemas(['PUBLIC', 'ANALYTICS', 'RAW_DATA']);
          setAvailableTables(['CUSTOMERS', 'ORDERS', 'PRODUCTS', 'EVENTS']);
        } else if (connectionType === 'clickhouse') {
          setAvailableSchemas(['default', 'events', 'analytics']);
          setAvailableTables(['user_events', 'page_views', 'conversions']);
        } else if (connectionType === 'postgresql') {
          setAvailableSchemas(['public', 'analytics', 'staging']);
          setAvailableTables(['users', 'orders', 'products', 'sessions']);
        }
      }
    }, 2000);
  };

  const handleSave = () => {
    const connectionData = {
      name: formData.name,
      type: connectionType,
      config: formData
    };
    onSave(connectionData);
  };

  const renderSnowflakeForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="account">Account Identifier</Label>
          <Input
            id="account"
            placeholder="xy12345.us-east-1"
            value={formData.account || ''}
            onChange={(e) => handleInputChange('account', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username || ''}
            onChange={(e) => handleInputChange('username', e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password || ''}
            onChange={(e) => handleInputChange('password', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="role">Role (Optional)</Label>
          <Input
            id="role"
            placeholder="ANALYST_ROLE"
            value={formData.role || ''}
            onChange={(e) => handleInputChange('role', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="database">Database</Label>
          <Input
            id="database"
            placeholder="PROD_DB"
            value={formData.database || ''}
            onChange={(e) => handleInputChange('database', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="warehouse">Warehouse</Label>
          {availableWarehouses.length > 0 ? (
            <Select value={formData.warehouse || ''} onValueChange={(value) => handleInputChange('warehouse', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {availableWarehouses.map((wh) => (
                  <SelectItem key={wh} value={wh}>{wh}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="warehouse"
              placeholder="COMPUTE_WH"
              value={formData.warehouse || ''}
              onChange={(e) => handleInputChange('warehouse', e.target.value)}
            />
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="schema">Schema</Label>
        {availableSchemas.length > 0 ? (
          <Select value={formData.schema || ''} onValueChange={(value) => handleInputChange('schema', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select schema" />
            </SelectTrigger>
            <SelectContent>
              {availableSchemas.map((schema) => (
                <SelectItem key={schema} value={schema}>{schema}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="schema"
            placeholder="PUBLIC"
            value={formData.schema || ''}
            onChange={(e) => handleInputChange('schema', e.target.value)}
          />
        )}
      </div>
    </div>
  );

  const renderClickHouseForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="host">Host</Label>
          <Input
            id="host"
            placeholder="localhost or your-cluster.clickhouse.cloud"
            value={formData.host || ''}
            onChange={(e) => handleInputChange('host', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            placeholder="9000"
            value={formData.port || ''}
            onChange={(e) => handleInputChange('port', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="default"
            value={formData.username || ''}
            onChange={(e) => handleInputChange('username', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password || ''}
            onChange={(e) => handleInputChange('password', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="database">Database</Label>
          <Input
            id="database"
            placeholder="default"
            value={formData.database || ''}
            onChange={(e) => handleInputChange('database', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cluster">Cluster (Optional)</Label>
          <Input
            id="cluster"
            placeholder="production"
            value={formData.cluster || ''}
            onChange={(e) => handleInputChange('cluster', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>
          <input
            type="checkbox"
            className="mr-2"
            checked={formData.secure || false}
            onChange={(e) => handleBooleanChange('secure', e.target.checked)}
          />
          Use SSL/TLS
        </Label>
      </div>
    </div>
  );

  const renderPostgreSQLForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="host">Host</Label>
          <Input
            id="host"
            placeholder="localhost"
            value={formData.host || ''}
            onChange={(e) => handleInputChange('host', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            placeholder="5432"
            value={formData.port || ''}
            onChange={(e) => handleInputChange('port', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="postgres"
            value={formData.username || ''}
            onChange={(e) => handleInputChange('username', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password || ''}
            onChange={(e) => handleInputChange('password', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="database">Database</Label>
          <Input
            id="database"
            placeholder="postgres"
            value={formData.database || ''}
            onChange={(e) => handleInputChange('database', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="schema">Schema</Label>
          {availableSchemas.length > 0 ? (
            <Select value={formData.schema || ''} onValueChange={(value) => handleInputChange('schema', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select schema" />
              </SelectTrigger>
              <SelectContent>
                {availableSchemas.map((schema) => (
                  <SelectItem key={schema} value={schema}>{schema}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="schema"
              placeholder="public"
              value={formData.schema || ''}
              onChange={(e) => handleInputChange('schema', e.target.value)}
            />
          )}
        </div>
      </div>

      <div>
        <Label>
          <input
            type="checkbox"
            className="mr-2"
            checked={formData.ssl || false}
            onChange={(e) => handleBooleanChange('ssl', e.target.checked)}
          />
          Require SSL
        </Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Connection Name</Label>
        <Input
          id="name"
          placeholder="My Production Database"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="type">Database Type</Label>
        <Select value={connectionType} onValueChange={setConnectionType}>
          <SelectTrigger>
            <SelectValue placeholder="Select database type" />
          </SelectTrigger>
          <SelectContent>
            {connectionTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {connectionType && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Details</CardTitle>
          </CardHeader>
          <CardContent>
            {connectionType === 'snowflake' && renderSnowflakeForm()}
            {connectionType === 'clickhouse' && renderClickHouseForm()}
            {connectionType === 'postgresql' && renderPostgreSQLForm()}
          </CardContent>
        </Card>
      )}

      {testResult && (
        <Card>
          <CardContent className="pt-6">
            {testResult === 'success' ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Connection successful!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Connection failed. Please check your credentials.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {availableTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTables.map((table) => (
                <Badge key={table} variant="outline">{table}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={!connectionType || !formData.name}
        >
          Test Connection
        </Button>
        <Button
          onClick={handleSave}
          disabled={testResult !== 'success'}
        >
          Save Connection
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
