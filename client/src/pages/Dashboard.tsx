import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings, X, Save, Plus } from 'lucide-react';
import { DashboardBuilder, type DashboardTile } from '@/components/dashboard/DashboardBuilder';
import { TileEditDialog } from '@/components/dashboard/TileEditDialog';
import { TimeFilter, type TimeFilterState } from '@/components/dashboard/TimeFilter';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DataStudioHeader } from '@/components/dashboard/DataStudioHeader';
import { SQLEditor } from '@/components/dashboard/SQLEditor';
import { Worksheets } from '@/components/dashboard/Worksheets';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { trackEvent } from '@/lib/amplitude';

const initialTiles: DashboardTile[] = [
  {
    id: 'tile-1749407882806',
    type: 'metric',
    title: 'Total Users',
    x: 0,
    y: 0,
    width: 3,
    height: 3,
    icon: 'users',
    dataSource: {
      query: 'SELECT COUNT(DISTINCT USER_ID) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE USER_ID IS NOT NULL',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  },
  {
    id: 'total-credits-metric',
    type: 'metric',
    title: 'Total Credits',
    x: 3,
    y: 0,
    width: 3,
    height: 3,
    icon: 'credit-card',
    dataSource: {
      query: 'SELECT SUM(TOTAL_CREDITS_SPENT) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE TOTAL_CREDITS_SPENT IS NOT NULL',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  },
  {
    id: 'listings-metric',
    type: 'metric',
    title: 'Total Listings',
    x: 6,
    y: 0,
    width: 3,
    height: 3,
    icon: 'list',
    dataSource: {
      query: 'SELECT SUM(TOTAL_LISTINGS_COUNT) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE TOTAL_LISTINGS_COUNT IS NOT NULL',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  },
  {
    id: 'lifecycle-stages',
    type: 'chart',
    title: 'User Lifecycle Stages',
    x: 9,
    y: 0,
    width: 3,
    height: 3,
    icon: 'pie-chart',
    dataSource: {
      query: 'SELECT LIFECYCLE_STAGE as name, COUNT(*) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE LIFECYCLE_STAGE IS NOT NULL GROUP BY LIFECYCLE_STAGE ORDER BY value DESC',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  },
  {
    id: 'tile-1749408515094',
    type: 'chart',
    title: 'Top Countries by User Count',
    x: 0,
    y: 3,
    width: 6,
    height: 4,
    icon: 'bar-chart',
    dataSource: {
      query: 'SELECT COUNTRY as name, COUNT(DISTINCT USER_ID) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE COUNTRY IS NOT NULL GROUP BY COUNTRY ORDER BY value DESC LIMIT 10',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  },
  {
    id: 'full-data-table',
    type: 'table',
    title: 'Complete User Segmentation Dataset',
    x: 6,
    y: 3,
    width: 6,
    height: 4,
    icon: 'database',
    dataSource: {
      query: 'SELECT * FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 LIMIT 100',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: false
    }
  }
];

function Dashboard() {
  const { toast } = useToast();
  
  // State management
  const [tiles, setTiles] = useState<DashboardTile[]>(initialTiles);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTile, setEditingTile] = useState<DashboardTile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [timeFilters, setTimeFilters] = useState<TimeFilterState>({
    chartType: 'line',
    timeRange: '7d',
    granularity: 'day'
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load tiles from database - memoized to prevent unnecessary calls
  const loadTiles = useCallback(async () => {
    if (isLoaded) return; // Don't reload if already loaded
    
    try {
      const response = await apiRequest('/api/dashboard/tiles');
      console.log('Loaded tiles from database:', response);
      
      if (response && Array.isArray(response)) {
        // Map database tiles to frontend format
        const mappedTiles = response.map((dbTile: any) => ({
          ...dbTile,
          id: dbTile.id, // Use the tile ID from database
          databaseId: dbTile.id // Store the database ID for reference
        }));
        setTiles(mappedTiles);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load tiles:', error);
      // Use initial tiles as fallback
      setTiles(initialTiles);
      setIsLoaded(true);
    }
  }, [isLoaded]);

  // Load tiles on component mount
  useEffect(() => {
    loadTiles();
  }, [loadTiles]);

  // Track page view when component mounts
  useEffect(() => {
    trackEvent('Page Viewed', {
      page_name: 'dashboard'
    });
  }, []);

  // Event handlers
  const handleTilesChange = useCallback((newTiles: DashboardTile[]) => {
    setTiles(newTiles);
  }, []);

  const handleEditTile = (tile: DashboardTile) => {
    setEditingTile(tile);
  };

  const handleSaveEditedTile = (updatedTile: DashboardTile) => {
    setTiles(prev => prev.map(tile => 
      tile.id === updatedTile.id ? updatedTile : tile
    ));
    setEditingTile(null);
    
    toast({
      title: "Tile Updated",
      description: "Your tile configuration has been saved.",
    });
  };

  const handleRemoveTile = useCallback((tileId: string) => {
    setTiles(prev => prev.filter(tile => tile.id !== tileId));
    
    toast({
      title: "Tile Removed",
      description: "The tile has been removed from your dashboard.",
    });
  }, [toast]);

  const handleDuplicateTile = (tile: DashboardTile) => {
    const newTile: DashboardTile = {
      ...tile,
      id: `${tile.id}-copy-${Date.now()}`,
      title: `${tile.title} (Copy)`,
      x: tile.x + 1,
      y: tile.y + 1
    };
    
    setTiles(prev => [...prev, newTile]);
    
    toast({
      title: "Tile Duplicated",
      description: "A copy of the tile has been added to your dashboard.",
    });
  };

  const handleRefreshTile = useCallback(async (tileId: string) => {
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    // Invalidate and refetch the tile's data
    await queryClient.invalidateQueries({
      queryKey: ['/api/snowflake/query', tileId]
    });
    
    toast({
      title: "Tile Refreshed",
      description: `${tile.title} has been refreshed with the latest data.`,
    });
  }, [tiles, toast]);

  const handleToggleEditMode = () => {
    setIsEditMode(prev => !prev);
    
    if (!isEditMode) {
      toast({
        title: "Edit Mode Enabled",
        description: "You can now rearrange and modify your dashboard tiles.",
      });
    }
  };

  const handleSaveLayout = async () => {
    try {
      // Save layout to database
      await apiRequest('/api/dashboard/layout', {
        method: 'POST',
        body: JSON.stringify({ tiles }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast({
        title: "Layout Saved",
        description: "Your dashboard layout has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save dashboard layout",
        variant: "destructive",
      });
    }
  };

  const handleGlobalRefresh = async () => {
    setIsLoading(true);
    
    try {
      // Refresh all tiles by invalidating their queries
      const refreshPromises = tiles.map(tile => {
        return queryClient.fetchQuery({
          queryKey: ['/api/snowflake/query', tile.id],
          queryFn: async () => {
            const response = await apiRequest('/api/snowflake/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: tile.dataSource.query })
            });
            
            // Store refreshed data in localStorage
            const timestamp = new Date();
            localStorage.setItem(`tile-${tile.id}-lastRefresh`, timestamp.toISOString());
            localStorage.setItem(`tile-${tile.id}-data`, JSON.stringify(response));
            
            return response;
          }
        });
      });
      
      await Promise.all(refreshPromises);
      
      toast({
        title: "Dashboard Refreshed",
        description: "All tile data has been refreshed successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeFiltersChange = (newFilters: TimeFilterState) => {
    setTimeFilters(newFilters);
  };

  // Handler functions for BI interface
  const handleCreateVisualization = (data: any, chartType: string, query?: string) => {
    // Create a new tile from SQL editor visualization
    const newTile: DashboardTile = {
      id: `sql-viz-${Date.now()}`,
      type: chartType as any,
      title: `SQL ${chartType} Chart`,
      x: 0,
      y: 0,
      width: 6,
      height: 4,
      dataSource: {
        table: 'custom',
        query: query || '', // Store the original query from SQL editor
        aggregation: chartType
      },
      refreshConfig: {
        autoRefresh: false,
        refreshOnLoad: false
      }
    };
    
    setTiles(prev => [...prev, newTile]);
    setActiveTab('dashboards');
    
    toast({
      title: "Visualization Added",
      description: "Chart has been added to your dashboard.",
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    const isDataStudioTab = ['bi-interface', 'worksheets', 'visualizations', 'reports', 'analytics'].includes(activeTab);
    
    switch (activeTab) {
      case 'bi-interface':
        return (
          <div className="flex-1 flex flex-col">
            <DataStudioHeader activeTab={activeTab} />
            <div className="flex-1">
              <SQLEditor onCreateVisualization={handleCreateVisualization} />
            </div>
          </div>
        );
      
      case 'worksheets':
        return (
          <div className="flex-1 flex flex-col">
            <DataStudioHeader activeTab={activeTab} />
            <div className="flex-1">
              <Worksheets onCreateNew={() => setActiveTab('bi-interface')} />
            </div>
          </div>
        );
      
      case 'visualizations':
        return (
          <div className="flex-1 flex flex-col">
            <DataStudioHeader activeTab={activeTab} />
            <div className="flex-1 p-6">
              <div className="max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">Chart Gallery</h3>
                    <p className="text-sm text-muted-foreground">Browse saved chart visualizations</p>
                  </div>
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">Dashboard Templates</h3>
                    <p className="text-sm text-muted-foreground">Pre-built dashboard layouts</p>
                  </div>
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">Custom Views</h3>
                    <p className="text-sm text-muted-foreground">User-created visualizations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'reports':
        return (
          <div className="flex-1 flex flex-col">
            <DataStudioHeader activeTab={activeTab} />
            <div className="flex-1 p-6">
              <div className="max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">Scheduled Reports</h3>
                    <p className="text-sm text-muted-foreground">Automated report generation</p>
                  </div>
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">Custom Reports</h3>
                    <p className="text-sm text-muted-foreground">Build custom analytical reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'analytics':
        return (
          <div className="flex-1 flex flex-col">
            <DataStudioHeader activeTab={activeTab} />
            <div className="flex-1 p-6">
              <div className="max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">User Analytics</h3>
                    <p className="text-sm text-muted-foreground">Deep dive into user behavior</p>
                  </div>
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">Performance Metrics</h3>
                    <p className="text-sm text-muted-foreground">Platform performance analysis</p>
                  </div>
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold mb-2">Predictive Models</h3>
                    <p className="text-sm text-muted-foreground">ML-powered insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'cohorts':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Cohorts</h2>
                <p className="text-muted-foreground">Manage user cohorts and segments for targeted campaigns</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">User Segments</h3>
                  <p className="text-sm text-muted-foreground">Create and manage user segments</p>
                </div>
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">Behavioral Cohorts</h3>
                  <p className="text-sm text-muted-foreground">Group users by behavior patterns</p>
                </div>
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">Sync to Platforms</h3>
                  <p className="text-sm text-muted-foreground">Export cohorts to marketing platforms</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'campaigns':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Campaigns</h2>
                <p className="text-muted-foreground">Create and manage marketing campaigns across platforms</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">Email Campaigns</h3>
                  <p className="text-sm text-muted-foreground">Design and send targeted email campaigns</p>
                </div>
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">Send personalized push notifications</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'integrations':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Integrations</h2>
                <p className="text-muted-foreground">Configure platform integrations and API connections</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">Amplitude</h3>
                  <p className="text-sm text-muted-foreground">Product analytics integration</p>
                </div>
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">Braze</h3>
                  <p className="text-sm text-muted-foreground">Customer engagement platform</p>
                </div>
                <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold mb-2">Snowflake</h3>
                  <p className="text-sm text-muted-foreground">Data warehouse connection</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'home':
      default:
        return (
          <div className="flex-1 flex flex-col">
            {/* Dashboard Controls */}
            <div className="border-b bg-gradient-to-r from-white to-blue-50/30 backdrop-blur-sm">
              <div className="page-header flex items-center justify-between px-8 py-6">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
                    Home Dashboard
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Core analytics dashboard - Super Admin only
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="hidden sm:flex px-4 py-2 text-sm font-medium border-blue-200 text-blue-700 bg-blue-50">
                    {tiles.length} active tiles
                  </Badge>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleGlobalRefresh}
                    disabled={isLoading}
                    className="px-6 py-3 font-medium border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh All'}
                  </Button>
                  {isEditMode && (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleSaveLayout}
                      className="px-6 py-3 font-medium border-green-200 hover:bg-green-50 hover:border-green-300 transition-all"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Layout
                    </Button>
                  )}
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="default"
                    onClick={handleToggleEditMode}
                    className={isEditMode ? "btn-primary px-6 py-3 font-medium" : "px-6 py-3 font-medium hover:bg-gray-50 transition-all"}
                  >
                    {isEditMode ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Exit Edit
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Layout
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Time Filters */}
              <div className="px-8 pb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 p-4">
                  <TimeFilter 
                    filters={timeFilters} 
                    onFiltersChange={handleTimeFiltersChange} 
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Dashboard Content */}
            <div className="flex-1 p-8 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/20 shadow-lg p-6">
                <DashboardBuilder
                  tiles={tiles}
                  onTilesChange={handleTilesChange}
                  isEditMode={isEditMode}
                  onEditTile={handleEditTile}
                  onRemoveTile={handleRemoveTile}
                  onDuplicateTile={handleDuplicateTile}
                  onRefreshTile={handleRefreshTile}
                />
              </div>
            </div>

            {/* Edit Dialog */}
            {editingTile && (
              <TileEditDialog
                tile={editingTile}
                isOpen={!!editingTile}
                onClose={() => setEditingTile(null)}
                onSave={handleSaveEditedTile}
              />
            )}
          </div>
        );
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;