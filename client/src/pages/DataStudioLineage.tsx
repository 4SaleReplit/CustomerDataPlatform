import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Table, 
  ArrowRight, 
  Search,
  GitBranch,
  Eye,
  Filter
} from 'lucide-react';

export function DataStudioLineage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const lineageData = [
    {
      id: '1',
      name: 'USER_SEGMENTATION_PROJECT_V4',
      type: 'table',
      database: 'DBT_CORE_PROD_DATABASE',
      schema: 'OPERATIONS',
      upstream: ['RAW_USER_DATA', 'USER_EVENTS'],
      downstream: ['USER_COHORTS', 'SEGMENT_ANALYSIS'],
      lastUpdated: '2 hours ago',
      updateFrequency: 'Daily at 6 AM'
    },
    {
      id: '2',
      name: 'USER_COHORTS',
      type: 'table',
      database: 'DBT_CORE_PROD_DATABASE',
      schema: 'ANALYTICS',
      upstream: ['USER_SEGMENTATION_PROJECT_V4'],
      downstream: ['COHORT_DASHBOARD', 'MARKETING_METRICS'],
      lastUpdated: '1 hour ago',
      updateFrequency: 'Every 4 hours'
    },
    {
      id: '3',
      name: 'RAW_USER_DATA',
      type: 'source',
      database: 'DATA_LAKE',
      schema: 'RAW',
      upstream: [],
      downstream: ['USER_SEGMENTATION_PROJECT_V4', 'USER_PROFILES'],
      lastUpdated: '30 minutes ago',
      updateFrequency: 'Real-time'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'table':
        return <Table className="h-4 w-4" />;
      case 'source':
        return <Database className="h-4 w-4" />;
      default:
        return <GitBranch className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'table':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'source':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Lineage</h1>
            <p className="text-muted-foreground">
              Track data dependencies and transformations across your pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Graph
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tables, views, or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="grid gap-4">
          {lineageData.map((item) => (
            <Card 
              key={item.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedNode === item.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedNode(selectedNode === item.id ? null : item.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-normal">
                        {item.database}.{item.schema}
                      </p>
                    </div>
                  </CardTitle>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Updated {item.lastUpdated}</p>
                    <p>{item.updateFrequency}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Upstream Dependencies */}
                  {item.upstream.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Upstream Dependencies ({item.upstream.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.upstream.map((upstream) => (
                          <Badge key={upstream} variant="secondary" className="text-xs">
                            {upstream}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Downstream Dependencies */}
                  {item.downstream.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Downstream Dependencies ({item.downstream.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.downstream.map((downstream) => (
                          <Badge key={downstream} variant="outline" className="text-xs">
                            {downstream}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lineage Flow Visualization */}
                  {selectedNode === item.id && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-3">Data Flow</h4>
                      <div className="flex items-center gap-2 text-sm">
                        {item.upstream.length > 0 && (
                          <>
                            <div className="flex gap-1">
                              {item.upstream.map((upstream, index) => (
                                <span key={upstream} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {upstream}
                                </span>
                              ))}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </>
                        )}
                        <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                          {item.name}
                        </span>
                        {item.downstream.length > 0 && (
                          <>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="flex gap-1">
                              {item.downstream.map((downstream) => (
                                <span key={downstream} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  {downstream}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}