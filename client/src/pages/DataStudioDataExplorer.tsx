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

  // Snowflake database schema from the SQL editor autocomplete data
  const snowflakeSchema: Record<string, Record<string, Record<string, string[]>>> = {
    "DATA_LAKE": {
      "DATA_PLATFORM_METRICS": {
        "DATA_VOLUME": ["DATE", "TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME", "SIZE", "PREV_SIZE", "DELTA_SIZE", "RECORDS", "PREV_ROWS_COUNT", "DELTA_ROWS_COUNT"]
      },
      "DYNAMODB": {
        "DEVICE_USER_ADV_VIEWS": ["DEVICE_ID", "USER_ADV_ID", "DATE_VIEWED", "IS_DELETED", "SYNCED", "PK_DEVICE_ADV_DATE"],
        "DEV_DEVICE_USER_ADV_VIEWS": ["DEVICE_ID", "USER_ADV_ID", "DATE_VIEWED", "IS_DELETED", "SYNCED", "PK_DEVICE_ADV_DATE"],
        "STAGING_DEVICE_USER_ADV_VIEWS": ["DEVICE_ID", "USER_ADV_ID", "DATE_VIEWED", "IS_DELETED", "SYNCED"],
        "USER_ADV_VIEWS_HOUR": ["DATE", "USER_ADV_ID", "COUNT"]
      },
      "INFORMATION_SCHEMA": {}
    },
    "DBT_CORE_PROD_DATABASE": {
      "DATA_MART": {
        "DOM_LEVEL_1_SI": ["LEVEL_1", "EN_NAME", "FULL_PATH", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Day 14", "Day 15", "Day 16", "Day 17", "Day 18", "Day 19", "Day 20", "Day 21", "Day 22", "Day 23", "Day 24", "Day 25", "Day 26", "Day 27", "Day 28", "Day 29", "Day 30", "Day 31"],
        "DOM_VERTICAL_SI": ["VERTICAL_NAME", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Day 14", "Day 15", "Day 16", "Day 17", "Day 18", "Day 19", "Day 20", "Day 21", "Day 22", "Day 23", "Day 24", "Day 25", "Day 26", "Day 27", "Day 28", "Day 29", "Day 30", "Day 31"],
        "OFFICES_STATS_REPORT": ["USER_ADV_ID", "USER_ID", "DATE_PUBLISHED", "SOURCE_TABLE", "CAT_ID", "SOURCE", "ASKING_PRICE", "TITLE", "LEVEL_1", "LEVEL_3", "LEVEL_4", "FIRST_NAME_FIXED", "LAST_NAME_FIXED", "USER_TYPE", "TOTAL_VIEWS", "MILLAGE", "PHONECALL", "CALLICON", "WHATSAPPCALL", "CHAT", "CALL", "PHONE", "WHATSAPPICON", "ENQUIRENOW", "EXTERNALURL", "TESTDRIVE"]
      },
      "OPERATIONS": {
        "USER_SEGMENTATION_PROJECT_V4": ["USER_ADV_ID", "USER_ID", "DATE_CREATED", "VERTICAL", "LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4", "TOTAL_LISTINGS_COUNT", "ACTIVE_LISTINGS_COUNT", "EXPIRED_LISTINGS_COUNT", "DELETED_LISTINGS_COUNT", "TOTAL_VIEWS", "TOTAL_CTAS", "PHONE_CALL_CTAS", "WHATSAPP_CTAS", "CHAT_CTAS", "AVG_VIEWS_PER_LISTING", "AVG_CTAS_PER_LISTING", "CONVERSION_RATE"],
        "AGGREGATED_LOSSES": ["DATE_MONTH", "VERTICAL", "LEVEL_1", "PLAN_NAME", "TOTAL_LOSSES"],
        "BUNDLES_COST": ["category_id", "bundle_id", "bundle_name", "views", "price", "description", "next_page", "is_free", "extend_period", "recommended", "badge", "visibility_link", "features", "addons", "plan_base_price", "Vertical", "Category", "Date"],
        "BUNDLES_PRICE": ["category_id", "plan_id", "name", "views", "price", "description", "next_page", "is_free", "extend_period", "recommended", "badge", "visibility_link", "features", "refreshes", "addons", "plan_base_price", "Vertical", "Category", "Date"],
        "CARS_LISTINGS_PROJECTION": ["USER_ADV_ID", "BRAND_ID", "MODEL_ID", "MAN_YEAR", "ASKING_PRICE", "FULL_PATH", "CAT_NAME", "count", "lower_bound", "average_price", "upper_bound", "percentile_10", "percentile_30", "percentile_60", "percentile_90", "PRICING"]
      },
      "INFORMATION_SCHEMA": {}
    }
  };

  // Convert the schema data to the interface format
  const databases: DatabaseInfo[] = Object.keys(snowflakeSchema).map(databaseName => ({
    name: databaseName,
    schemas: Object.keys(snowflakeSchema[databaseName]).map(schemaName => ({
      name: schemaName,
      tables: Object.keys(snowflakeSchema[databaseName][schemaName]).map(tableName => ({
        name: tableName,
        type: 'TABLE' as const,
        columns: snowflakeSchema[databaseName][schemaName][tableName].map(columnName => ({
          name: columnName,
          type: 'VARCHAR',
          nullable: true
        }))
      }))
    }))
  }));

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
      'BOOLEAN': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'VARIANT': 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    };
    return typeColors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const filterDatabases = () => {
    return databases.filter(db => 
      !searchQuery || 
      db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.schemas.some(schema => 
        schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schema.tables.some(table => 
          table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          table.columns.some(col => col.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    );
  };

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
        
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {filterDatabases().map((database) => (
              <div key={database.name} className="space-y-1">
                <Collapsible 
                  open={expandedDatabases.has(database.name)}
                  onOpenChange={() => toggleDatabase(database.name)}
                >
                  <CollapsibleTrigger className="flex items-center w-full p-2 text-left hover:bg-muted rounded-md transition-colors">
                    {expandedDatabases.has(database.name) ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <Database className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">{database.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {database.schemas.length} schemas
                    </Badge>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="ml-6 space-y-1">
                    {database.schemas.map((schema) => {
                      const schemaKey = `${database.name}.${schema.name}`;
                      return (
                        <div key={schemaKey}>
                          <Collapsible 
                            open={expandedSchemas.has(schemaKey)}
                            onOpenChange={() => toggleSchema(schemaKey)}
                          >
                            <CollapsibleTrigger className="flex items-center w-full p-2 text-left hover:bg-muted rounded-md transition-colors">
                              {expandedSchemas.has(schemaKey) ? (
                                <ChevronDown className="h-4 w-4 mr-2" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2" />
                              )}
                              <Columns className="h-4 w-4 mr-2 text-green-600" />
                              <span className="font-medium">{schema.name}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {schema.tables.length} tables
                              </Badge>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="ml-6 space-y-1">
                              {schema.tables.map((table) => {
                                const tableKey = `${database.name}.${schema.name}.${table.name}`;
                                return (
                                  <div key={tableKey}>
                                    <Collapsible 
                                      open={expandedTables.has(tableKey)}
                                      onOpenChange={() => toggleTable(tableKey)}
                                    >
                                      <CollapsibleTrigger 
                                        className="flex items-center w-full p-2 text-left hover:bg-muted rounded-md transition-colors"
                                        onClick={() => setSelectedTable(tableKey)}
                                      >
                                        {expandedTables.has(tableKey) ? (
                                          <ChevronDown className="h-4 w-4 mr-2" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 mr-2" />
                                        )}
                                        <Table className="h-4 w-4 mr-2 text-purple-600" />
                                        <span className="font-medium">{table.name}</span>
                                        <Badge variant="outline" className="ml-auto text-xs">
                                          {table.columns.length} cols
                                        </Badge>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent className="ml-6 space-y-1">
                                        {table.columns.map((column) => (
                                          <div 
                                            key={column.name}
                                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
                                            onClick={() => copyToClipboard(column.name)}
                                          >
                                            <div className="flex items-center">
                                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                                              <span className="text-sm">{column.name}</span>
                                            </div>
                                            <Badge 
                                              variant="secondary" 
                                              className={`text-xs ${getTypeColor(column.type)}`}
                                            >
                                              {column.type}
                                            </Badge>
                                          </div>
                                        ))}
                                      </CollapsibleContent>
                                    </Collapsible>
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
      </div>

      {/* Right Panel - Table Details */}
      <div className="flex-1 p-4">
        {selectedTable ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Table: {selectedTable}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`SELECT * FROM ${selectedTable} LIMIT 100;`)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy SELECT Query
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(selectedTable)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Table Name
                  </Button>
                </div>
                
                {(() => {
                  const [dbName, schemaName, tableName] = selectedTable.split('.');
                  const database = databases.find(db => db.name === dbName);
                  const schema = database?.schemas.find(s => s.name === schemaName);
                  const table = schema?.tables.find(t => t.name === tableName);
                  
                  if (!table) return null;
                  
                  return (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Columns ({table.columns.length})</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-muted px-4 py-2 font-medium text-sm border-b">
                            <div className="grid grid-cols-3 gap-4">
                              <span>Column Name</span>
                              <span>Data Type</span>
                              <span>Nullable</span>
                            </div>
                          </div>
                          <div className="max-h-96 overflow-auto">
                            {table.columns.map((column, index) => (
                              <div 
                                key={column.name}
                                className={`px-4 py-2 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                                  index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                                }`}
                                onClick={() => copyToClipboard(column.name)}
                              >
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <span className="font-medium">{column.name}</span>
                                  <Badge className={getTypeColor(column.type)}>
                                    {column.type}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {column.nullable ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Table Selected</h3>
              <p>Select a table from the left panel to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}