import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Table, 
  Columns, 
  Search,
  ChevronRight,
  ChevronDown,
  Info,
  Copy,
  Eye
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

interface Table {
  name: string;
  type: 'TABLE' | 'VIEW';
  columns: Column[];
  rowCount?: number;
  description?: string;
}

interface Schema {
  name: string;
  tables: Table[];
}

interface DatabaseInfo {
  name: string;
  schemas: Schema[];
}

export function DataStudioDataExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDatabases, setExpandedDatabases] = useState<Set<string>>(new Set());
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const { toast } = useToast();

  // Sample data structure based on the Snowflake schema we've been working with
  const databases: DatabaseInfo[] = [
    {
      name: 'DATA_LAKE',
      schemas: [
        {
          name: 'RAW',
          tables: [
            {
              name: 'USER_EVENTS',
              type: 'TABLE',
              rowCount: 2847293,
              description: 'Raw user event data from application tracking',
              columns: [
                { name: 'EVENT_ID', type: 'VARCHAR', nullable: false },
                { name: 'USER_ID', type: 'VARCHAR', nullable: false },
                { name: 'EVENT_TYPE', type: 'VARCHAR', nullable: false },
                { name: 'EVENT_TIMESTAMP', type: 'TIMESTAMP', nullable: false },
                { name: 'EVENT_PROPERTIES', type: 'VARIANT', nullable: true },
                { name: 'SESSION_ID', type: 'VARCHAR', nullable: true }
              ]
            },
            {
              name: 'USER_PROFILES',
              type: 'TABLE',
              rowCount: 45672,
              description: 'User profile and demographic information',
              columns: [
                { name: 'USER_ID', type: 'VARCHAR', nullable: false },
                { name: 'EMAIL', type: 'VARCHAR', nullable: true },
                { name: 'CREATED_AT', type: 'TIMESTAMP', nullable: false },
                { name: 'LAST_ACTIVE', type: 'TIMESTAMP', nullable: true },
                { name: 'USER_SEGMENT', type: 'VARCHAR', nullable: true }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'DBT_CORE_PROD_DATABASE',
      schemas: [
        {
          name: 'OPERATIONS',
          tables: [
            {
              name: 'USER_SEGMENTATION_PROJECT_V4',
              type: 'TABLE',
              rowCount: 156892,
              description: 'Comprehensive user segmentation with behavioral and transactional data',
              columns: [
                { name: 'USER_ID', type: 'VARCHAR', nullable: false },
                { name: 'EMAIL', type: 'VARCHAR', nullable: true },
                { name: 'TOTAL_LISTINGS_COUNT', type: 'NUMBER', nullable: true },
                { name: 'TOTAL_REVENUE', type: 'NUMBER', nullable: true },
                { name: 'FIRST_PURCHASE_DATE', type: 'DATE', nullable: true },
                { name: 'LAST_PURCHASE_DATE', type: 'DATE', nullable: true },
                { name: 'SEGMENT_TIER', type: 'VARCHAR', nullable: true },
                { name: 'LIFECYCLE_STAGE', type: 'VARCHAR', nullable: true },
                { name: 'CREATED_AT', type: 'TIMESTAMP', nullable: false },
                { name: 'UPDATED_AT', type: 'TIMESTAMP', nullable: false }
              ]
            }
          ]
        },
        {
          name: 'ANALYTICS',
          tables: [
            {
              name: 'USER_COHORTS',
              type: 'VIEW',
              description: 'User cohort analysis with retention metrics',
              columns: [
                { name: 'COHORT_MONTH', type: 'DATE', nullable: false },
                { name: 'USER_COUNT', type: 'NUMBER', nullable: false },
                { name: 'RETENTION_RATE', type: 'NUMBER', nullable: true },
                { name: 'REVENUE_PER_USER', type: 'NUMBER', nullable: true }
              ]
            },
            {
              name: 'SEGMENT_PERFORMANCE',
              type: 'VIEW',
              description: 'Performance metrics by user segment',
              columns: [
                { name: 'SEGMENT_NAME', type: 'VARCHAR', nullable: false },
                { name: 'USER_COUNT', type: 'NUMBER', nullable: false },
                { name: 'CONVERSION_RATE', type: 'NUMBER', nullable: true },
                { name: 'AVERAGE_ORDER_VALUE', type: 'NUMBER', nullable: true }
              ]
            }
          ]
        }
      ]
    }
  ];

  const toggleDatabase = (dbName: string) => {
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(dbName)) {
      newExpanded.delete(dbName);
    } else {
      newExpanded.add(dbName);
    }
    setExpandedDatabases(newExpanded);
  };

  const toggleSchema = (schemaKey: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schemaKey)) {
      newExpanded.delete(schemaKey);
    } else {
      newExpanded.add(schemaKey);
    }
    setExpandedSchemas(newExpanded);
  };

  const toggleTable = (tableKey: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableKey)) {
      newExpanded.delete(tableKey);
    } else {
      newExpanded.add(tableKey);
    }
    setExpandedTables(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: text,
    });
  };

  const getTypeColor = (type: string) => {
    const typeColors: { [key: string]: string } = {
      'VARCHAR': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'NUMBER': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'TIMESTAMP': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'DATE': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      'VARIANT': 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
      'BOOLEAN': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return typeColors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const filteredDatabases = databases.filter(db =>
    searchQuery === '' ||
    db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.schemas.some(schema =>
      schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schema.tables.some(table =>
        table.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  );

  return (
    <div className="h-full flex">
      {/* Left Panel - Database Tree */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold mb-3">Database Explorer</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search databases, schemas, tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredDatabases.map((database) => (
            <div key={database.name} className="mb-2">
              <Collapsible
                open={expandedDatabases.has(database.name)}
                onOpenChange={() => toggleDatabase(database.name)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted rounded-md">
                  {expandedDatabases.has(database.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{database.name}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6">
                  {database.schemas.map((schema) => {
                    const schemaKey = `${database.name}.${schema.name}`;
                    return (
                      <div key={schemaKey} className="mb-1">
                        <Collapsible
                          open={expandedSchemas.has(schemaKey)}
                          onOpenChange={() => toggleSchema(schemaKey)}
                        >
                          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted rounded-md">
                            {expandedSchemas.has(schemaKey) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Columns className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{schema.name}</span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-6">
                            {schema.tables.map((table) => {
                              const tableKey = `${database.name}.${schema.name}.${table.name}`;
                              return (
                                <div
                                  key={tableKey}
                                  className={`flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer ${
                                    selectedTable === tableKey ? 'bg-muted' : ''
                                  }`}
                                  onClick={() => setSelectedTable(tableKey)}
                                >
                                  <Table className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm">{table.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {table.type}
                                  </Badge>
                                </div>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Table Details */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Table Details</h2>
          <p className="text-muted-foreground text-sm">
            Select a table from the explorer to view its schema and metadata
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedTable ? (
            (() => {
              const [dbName, schemaName, tableName] = selectedTable.split('.');
              const database = databases.find(db => db.name === dbName);
              const schema = database?.schemas.find(s => s.name === schemaName);
              const table = schema?.tables.find(t => t.name === tableName);

              if (!table) return <div>Table not found</div>;

              return (
                <div className="space-y-6">
                  {/* Table Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Table className="h-5 w-5" />
                            {table.name}
                            <Badge variant={table.type === 'VIEW' ? 'secondary' : 'default'}>
                              {table.type}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {dbName}.{schemaName}.{tableName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyToClipboard(`${dbName}.${schemaName}.${tableName}`)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Name
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Data
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {table.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {table.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {table.rowCount && (
                          <div className="flex items-center gap-1">
                            <Info className="h-4 w-4" />
                            <span>{table.rowCount.toLocaleString()} rows</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Columns className="h-4 w-4" />
                          <span>{table.columns.length} columns</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Columns */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Columns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {table.columns.map((column, index) => (
                          <div key={column.name}>
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{column.name}</span>
                                  {!column.nullable && (
                                    <Badge variant="destructive" className="text-xs">
                                      NOT NULL
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getTypeColor(column.type)}`}>
                                  {column.type}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(column.name)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {column.description && (
                              <p className="text-sm text-muted-foreground mt-1 ml-3">
                                {column.description}
                              </p>
                            )}
                            {index < table.columns.length - 1 && <Separator className="mt-3" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a table to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}