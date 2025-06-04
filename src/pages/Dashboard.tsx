import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardBuilder, type DashboardTile } from '@/components/dashboard/DashboardBuilder';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { TimeFilter, type TimeFilterState } from '@/components/dashboard/TimeFilter';
import { TrendingUp, TrendingDown, Users, UserPlus, Clock, Target, DollarSign, Activity, Settings, RefreshCw, Eye, EyeOff, Save } from 'lucide-react';
import { TileEditDialog } from '@/components/dashboard/TileEditDialog';

// Enhanced KPI metrics data
const kpiMetrics = [
  {
    title: 'Daily Active Users',
    value: '14,234',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'blue'
  },
  {
    title: 'New Users',
    value: '1,234',
    change: '+8.2%',
    trend: 'up',
    icon: UserPlus,
    color: 'green'
  },
  {
    title: 'Revenue Today',
    value: '$45,678',
    change: '+15.3%',
    trend: 'up',
    icon: DollarSign,
    color: 'emerald'
  },
  {
    title: 'Avg Session Duration',
    value: '8m 32s',
    change: '-2.1%',
    trend: 'down',
    icon: Clock,
    color: 'orange'
  },
  {
    title: 'Conversion Rate',
    value: '3.24%',
    change: '+0.8%',
    trend: 'up',
    icon: Target,
    color: 'purple'
  },
  {
    title: 'Active Listings',
    value: '89,432',
    change: '+5.7%',
    trend: 'up',
    icon: Activity,
    color: 'indigo'
  }
];

// Updated initial dashboard tiles with refresh configuration
const initialTiles: DashboardTile[] = [
  {
    id: 'tile-1',
    type: 'chart',
    title: 'User Activity Trends',
    x: 0,
    y: 0,
    width: 8,
    height: 3,
    dataSource: {
      table: 'events',
      query: 'SELECT DATE(created_at) as date, COUNT(*) as value FROM events GROUP BY DATE(created_at)',
      aggregation: 'count',
      groupBy: 'date'
    },
    refreshConfig: {
      autoRefresh: true,
      refreshOnLoad: true,
      lastRefreshed: new Date()
    }
  },
  {
    id: 'tile-2',
    type: 'funnel',
    title: 'User Journey Funnel',
    x: 8,
    y: 0,
    width: 4,
    height: 3,
    dataSource: {
      table: 'events',
      query: 'SELECT step, COUNT(*) as users FROM user_funnel GROUP BY step',
      aggregation: 'count'
    },
    refreshConfig: {
      autoRefresh: true,
      refreshOnLoad: true,
      lastRefreshed: new Date()
    }
  },
  {
    id: 'tile-3',
    type: 'table',
    title: 'Top Performers',
    x: 0,
    y: 3,
    width: 6,
    height: 2,
    dataSource: {
      table: 'users',
      query: 'SELECT name, total_listings_count, cltv FROM users ORDER BY cltv DESC LIMIT 10'
    },
    refreshConfig: {
      autoRefresh: true,
      refreshOnLoad: false
    }
  },
  {
    id: 'tile-4',
    type: 'metric',
    title: 'Total Revenue',
    x: 6,
    y: 3,
    width: 3,
    height: 2,
    dataSource: {
      table: 'transactions',
      query: 'SELECT SUM(amount) as value FROM transactions WHERE DATE(created_at) = CURDATE()',
      aggregation: 'sum'
    },
    refreshConfig: {
      autoRefresh: true,
      refreshOnLoad: true,
      lastRefreshed: new Date()
    }
  },
  {
    id: 'tile-5',
    type: 'metric',
    title: 'Churn Risk Users',
    x: 9,
    y: 3,
    width: 3,
    height: 2,
    dataSource: {
      table: 'users',
      query: 'SELECT COUNT(*) as value FROM users WHERE lifecycle_stage = "about_to_churn"',
      aggregation: 'count'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  }
];

export default function Dashboard() {
  const [tiles, setTiles] = useState<DashboardTile[]>(initialTiles);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTile, setEditingTile] = useState<DashboardTile | null>(null);
  const [timeFilters, setTimeFilters] = useState<TimeFilterState>({
    chartType: 'line',
    timeRange: '30d',
    granularity: 'daily'
  });

  // Function to get comparison text based on granularity
  const getComparisonText = (granularity: string) => {
    switch (granularity) {
      case 'realtime':
        return 'Real-time';
      case 'hourly':
        return 'HoH';
      case 'daily':
        return 'DoD';
      case 'weekly':
        return 'WoW';
      case 'monthly':
        return 'MoM';
      case 'quarterly':
        return 'QoQ';
      default:
        return 'DoD';
    }
  };

  const handleEditTile = (tile: DashboardTile) => {
    console.log('Edit tile:', tile);
    setEditingTile(tile);
  };

  const handleSaveEditedTile = (updatedTile: DashboardTile) => {
    setTiles(prevTiles =>
      prevTiles.map(tile =>
        tile.id === updatedTile.id ? updatedTile : tile
      )
    );
    console.log('Saved edited tile:', updatedTile);
  };

  const handleCloseEditDialog = () => {
    setEditingTile(null);
  };

  const handleRemoveTile = (tileId: string) => {
    setTiles(tiles.filter(tile => tile.id !== tileId));
  };

  const handleDuplicateTile = (tile: DashboardTile) => {
    const newTile: DashboardTile = {
      ...tile,
      id: `tile-${Date.now()}`,
      title: `${tile.title} (Copy)`,
      x: tile.x + 1,
      y: tile.y,
      refreshConfig: {
        ...tile.refreshConfig,
        lastRefreshed: new Date()
      }
    };
    setTiles(prevTiles => [...prevTiles, newTile]);
    console.log('Duplicated tile:', newTile);
  };

  const handleRefreshTile = (tileId: string) => {
    console.log(`Refreshing tile: ${tileId}`);
    setTiles(prevTiles => 
      prevTiles.map(tile => 
        tile.id === tileId 
          ? { 
              ...tile, 
              refreshConfig: { 
                ...tile.refreshConfig, 
                lastRefreshed: new Date() 
              } 
            }
          : tile
      )
    );
  };

  const handleRefreshAll = () => {
    console.log('Refreshing all tiles');
    setTiles(prevTiles => 
      prevTiles.map(tile => ({
        ...tile,
        refreshConfig: {
          ...tile.refreshConfig,
          lastRefreshed: new Date()
        }
      }))
    );
  };

  const handleTimeFiltersChange = (newFilters: TimeFilterState) => {
    setTimeFilters(newFilters);
    console.log('Time filters changed:', newFilters);
    // TODO: Apply filters to dashboard data
  };

  const handleTileMove = (tileId: string, newPosition: { x: number; y: number }) => {
    setTiles(prevTiles =>
      prevTiles.map(tile =>
        tile.id === tileId
          ? { ...tile, x: newPosition.x, y: newPosition.y }
          : tile
      )
    );
  };

  const handleTileResize = (tileId: string, newSize: { width: number; height: number }) => {
    setTiles(prevTiles =>
      prevTiles.map(tile =>
        tile.id === tileId
          ? { ...tile, width: newSize.width, height: newSize.height }
          : tile
      )
    );
  };

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between p-6 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            {isEditMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isEditMode ? 'Exit Edit' : 'Edit Dashboard'}
          </Button>

          {isEditMode && (
            <>
              <DashboardBuilder
                tiles={tiles}
                onTilesChange={setTiles}
                isEditMode={isEditMode}
              />
              
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Save Layout
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={handleRefreshAll}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All
          </Button>

          <Button>Export Report</Button>
        </div>
      </div>

      {/* Time Filter Controls */}
      <TimeFilter
        filters={timeFilters}
        onFiltersChange={handleTimeFiltersChange}
      />

      <div className="p-6 space-y-6">
        {/* Enhanced KPI Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiMetrics.map((metric) => {
            const IconComponent = metric.icon;
            const isPositive = metric.trend === 'up';
            
            return (
              <Card key={metric.title} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full bg-${metric.color}-100`}>
                    <IconComponent className={`h-4 w-4 text-${metric.color}-600`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="text-xs mt-1">
                      <div className={`flex items-center justify-center ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {metric.change}
                      </div>
                      <div className="text-gray-500 mt-1">{getComparisonText(timeFilters.granularity)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom Dashboard Grid */}
        <DashboardGrid
          tiles={tiles}
          isEditMode={isEditMode}
          onEditTile={handleEditTile}
          onRemoveTile={handleRemoveTile}
          onDuplicateTile={handleDuplicateTile}
          onRefreshTile={handleRefreshTile}
          onTileMove={handleTileMove}
          onTileResize={handleTileResize}
        />
      </div>

      {/* Edit Tile Dialog */}
      <TileEditDialog
        tile={editingTile}
        isOpen={!!editingTile}
        onClose={handleCloseEditDialog}
        onSave={handleSaveEditedTile}
      />
    </div>
  );
}
