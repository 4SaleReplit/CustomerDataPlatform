import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Save, X, RefreshCw } from 'lucide-react';
import { DashboardBuilder, type DashboardTile } from '@/components/dashboard/DashboardBuilder';
import { TimeFilter, type TimeFilterState } from '@/components/dashboard/TimeFilter';
import { TileEditDialog } from '@/components/dashboard/TileEditDialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Initial tiles configuration
const initialTiles: DashboardTile[] = [
  {
    id: 'tile-1',
    type: 'chart',
    title: 'User Activity Trends',
    x: 0,
    y: 0,
    width: 8,
    height: 3,
    icon: 'activity',
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
    icon: 'funnel',
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
    icon: 'users',
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
    icon: 'dollar-sign',
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
    icon: 'alert-triangle',
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
  const [tiles, setTiles] = useState<DashboardTile[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTile, setEditingTile] = useState<DashboardTile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [timeFilters, setTimeFilters] = useState<TimeFilterState>({
    chartType: 'line',
    timeRange: '30d',
    granularity: 'daily'
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const { toast } = useToast();

  // Query to fetch tiles from database - force fresh data
  const { data: dashboardTiles = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/dashboard/tiles'],
    queryFn: () => apiRequest('/api/dashboard/tiles'),
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  // Mutation to save tiles layout
  const saveTilesMutation = useMutation({
    mutationFn: async (tilesToSave: DashboardTile[]) => {
      const tileInstances = tilesToSave.map(tile => ({
        tileId: tile.id,
        dashboardId: null,
        type: tile.type,
        title: tile.title,
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height,
        icon: tile.icon,
        dataSource: tile.dataSource,
        refreshConfig: tile.refreshConfig,
        createdBy: null
      }));

      return apiRequest('/api/dashboard/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiles: tileInstances }),
      });
    },
    onSuccess: (savedTiles) => {
      console.log('Save success, received tiles:', savedTiles);
      
      // Update local state immediately with saved tiles
      if (savedTiles && Array.isArray(savedTiles)) {
        const convertedTiles = savedTiles.map((dbTile: any) => ({
          id: dbTile.tileId,
          type: dbTile.type,
          title: dbTile.title,
          x: dbTile.x,
          y: dbTile.y,
          width: dbTile.width,
          height: dbTile.height,
          icon: dbTile.icon,
          dataSource: dbTile.dataSource,
          refreshConfig: dbTile.refreshConfig
        }));
        
        console.log('Updated local state with saved tiles:', convertedTiles);
        
        // Update cache with new data to prevent refetch override
        queryClient.setQueryData(['/api/dashboard/tiles'], savedTiles);
        
        // Update reference for comparison
        lastSavedRef.current = JSON.stringify(convertedTiles.map(t => ({ 
          id: t.id, x: t.x, y: t.y, width: t.width, height: t.height 
        })));
        
        // Force state update after cache is set
        setTiles(convertedTiles);
        
        // Prevent useEffect from overriding this by keeping isInitialized true
        // (Don't call setIsInitialized here as it's already true from initial load)
      }
      
      toast({
        title: "Dashboard Saved",
        description: "Layout saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed", 
        description: error instanceof Error ? error.message : "Failed to save layout",
        variant: "destructive",
      });
    }
  });

  // Clear cache and force refresh on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/tiles'] });
  }, []);

  // Initialize tiles when data loads from database
  useEffect(() => {
    if (!isLoading && dashboardTiles && !isInitialized) {
      console.log('Loading dashboard tiles:', dashboardTiles.length, dashboardTiles);
      
      if (Array.isArray(dashboardTiles) && dashboardTiles.length > 0) {
        // Convert database tiles to frontend format
        const convertedTiles = dashboardTiles.map((dbTile: any) => ({
          id: dbTile.tileId,
          type: dbTile.type,
          title: dbTile.title,
          x: dbTile.x,
          y: dbTile.y,
          width: dbTile.width,
          height: dbTile.height,
          icon: dbTile.icon,
          dataSource: dbTile.dataSource,
          refreshConfig: dbTile.refreshConfig
        }));
        
        console.log('Setting converted tiles:', convertedTiles);
        setTiles(convertedTiles);
        
        // Store initial state for comparison
        lastSavedRef.current = JSON.stringify(convertedTiles.map(t => ({ 
          id: t.id, x: t.x, y: t.y, width: t.width, height: t.height 
        })));
      } else {
        // No tiles in database, use initial tiles
        console.log('No tiles found, using initial tiles');
        setTiles(initialTiles);
        lastSavedRef.current = JSON.stringify(initialTiles.map(t => ({ 
          id: t.id, x: t.x, y: t.y, width: t.width, height: t.height 
        })));
      }
      
      setIsInitialized(true);
    }
  }, [dashboardTiles, isLoading, isInitialized]);

  // Debounced save function that only saves when tiles actually change
  const debouncedSave = useCallback((tilesToSave: DashboardTile[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentState = JSON.stringify(tilesToSave.map(t => ({ 
        id: t.id, x: t.x, y: t.y, width: t.width, height: t.height 
      })));
      
      // Only save if tiles have actually changed positions/sizes
      if (isInitialized && currentState !== lastSavedRef.current) {
        lastSavedRef.current = currentState;
        saveTilesMutation.mutate(tilesToSave);
      }
    }, 3000); // 3 second delay
  }, [isInitialized, saveTilesMutation]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
    }
  };

  const handleManualSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    console.log("Manual save triggered with tiles:", tiles.map(t => ({ 
      id: t.id, x: t.x, y: t.y, width: t.width, height: t.height 
    })));
    
    try {
      await saveTilesMutation.mutateAsync(tiles);
      console.log("Save completed successfully");
      
      lastSavedRef.current = JSON.stringify(tiles.map(t => ({ 
        id: t.id, x: t.x, y: t.y, width: t.width, height: t.height 
      })));
      
      // Exit edit mode after successful save
      setIsEditMode(false);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleEditTile = (tile: DashboardTile) => {
    setEditingTile(tile);
  };

  const handleSaveEditedTile = (updatedTile: DashboardTile) => {
    const updatedTiles = tiles.map(tile =>
      tile.id === updatedTile.id ? updatedTile : tile
    );
    setTiles(updatedTiles);
    setEditingTile(null);
    // Disable auto-save - use manual save only
    // debouncedSave(updatedTiles);
  };

  const handleCloseEditDialog = () => {
    setEditingTile(null);
  };

  const handleRemoveTile = async (tileId: string) => {
    try {
      // Delete from database first
      await apiRequest(`/api/dashboard/tiles/${tileId}`, {
        method: 'DELETE'
      });
      
      // Update local state
      const updatedTiles = tiles.filter(tile => tile.id !== tileId);
      setTiles(updatedTiles);
      
      // Refresh the tiles from database
      refetch();
    } catch (error) {
      console.error('Failed to delete tile:', error);
    }
  };

  const handleDuplicateTile = async (tile: DashboardTile) => {
    try {
      const newTileId = `tile-${Date.now()}`;
      const newTileData = {
        tileId: newTileId,
        type: tile.type,
        title: `${tile.title} (Copy)`,
        x: Math.min(tile.x + 1, 11), // Ensure within grid bounds
        y: tile.y,
        width: tile.width,
        height: tile.height,
        icon: tile.icon,
        dataSource: tile.dataSource,
        refreshConfig: tile.refreshConfig
      };

      // Create in database first
      await apiRequest('/api/dashboard/tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTileData)
      });

      // Refresh tiles from database
      refetch();
    } catch (error) {
      console.error('Failed to duplicate tile:', error);
    }
  };

  const handleRefreshTile = (tileId: string) => {
    const updatedTiles = tiles.map(tile =>
      tile.id === tileId
        ? { ...tile, refreshConfig: { ...tile.refreshConfig, lastRefreshed: new Date() } }
        : tile
    );
    setTiles(updatedTiles);
  };

  const handleTileMove = (tileId: string, newPosition: { x: number; y: number }) => {
    const updatedTiles = tiles.map(tile =>
      tile.id === tileId
        ? { ...tile, x: newPosition.x, y: newPosition.y }
        : tile
    );
    setTiles(updatedTiles);
    debouncedSave(updatedTiles);
  };

  const handleTileResize = (tileId: string, newSize: { width: number; height: number }) => {
    const updatedTiles = tiles.map(tile =>
      tile.id === tileId
        ? { ...tile, width: newSize.width, height: newSize.height }
        : tile
    );
    setTiles(updatedTiles);
    debouncedSave(updatedTiles);
  };

  const handleTilesChange = (newTiles: DashboardTile[]) => {
    setTiles(newTiles);
    // Only manual save via button click
  };

  const handleTimeFiltersChange = (newFilters: TimeFilterState) => {
    setTimeFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header Section - Fixed at top */}
      <div className="flex-shrink-0 bg-white border-b">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Intelligence Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time insights and analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex">
              {tiles.length} tiles
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={saveTilesMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveTilesMutation.isPending ? 'Saving...' : 'Save Layout'}
              </Button>
            )}
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleEditMode}
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

        {/* Time Filters */}
        <div className="px-6 pb-4">
          <TimeFilter 
            filters={timeFilters} 
            onFiltersChange={handleTimeFiltersChange} 
          />
        </div>
      </div>

      {/* Dashboard Content - Scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
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
      <TileEditDialog
        tile={editingTile}
        isOpen={!!editingTile}
        onClose={handleCloseEditDialog}
        onSave={handleSaveEditedTile}
      />
    </div>
  );
}