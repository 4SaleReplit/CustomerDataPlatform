import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings, X, Save, Plus } from 'lucide-react';
import { DashboardBuilder, type DashboardTile } from '@/components/dashboard/DashboardBuilder';
import { TileEditDialog } from '@/components/dashboard/TileEditDialog';
import { TimeFilter, type TimeFilterState } from '@/components/dashboard/TimeFilter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

const initialTiles: DashboardTile[] = [
  {
    id: 'tile-1749407882806',
    type: 'metric',
    title: 'User count',
    x: 0,
    y: 0,
    width: 4,
    height: 2,
    icon: 'users',
    dataSource: {
      query: 'SELECT COUNT(*) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4;',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
      aggregation: 'count'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: false
    }
  },
  {
    id: 'listings-metric',
    type: 'metric',
    title: 'Total Listings',
    x: 3,
    y: 3,
    width: 3,
    height: 2,
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
    id: 'full-data-table',
    type: 'table',
    title: 'Complete User Segmentation Dataset',
    x: 0,
    y: 5,
    width: 12,
    height: 4,
    icon: 'database',
    dataSource: {
      query: 'SELECT * FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 LIMIT 100',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  },
  {
    id: 'tile-1749408515094',
    type: 'metric',
    title: 'Total Listings (Copy)',
    x: 4,
    y: 3,
    width: 3,
    height: 2,
    icon: 'list',
    dataSource: {
      query: 'SELECT SUM(TOTAL_LISTINGS_COUNT) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE TOTAL_LISTINGS_COUNT IS NOT NULL',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      lastRefreshed: new Date('2025-06-08T18:48:35.094Z'),
      refreshOnLoad: true
    }
  },
  {
    id: 'lifecycle-stages',
    type: 'table',
    title: 'Customer Lifecycle Distribution',
    x: 6,
    y: 3,
    width: 6,
    height: 2,
    icon: 'pie-chart',
    dataSource: {
      query: 'SELECT USER_TYPE, COUNT(*) as count FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE USER_TYPE IS NOT NULL GROUP BY USER_TYPE ORDER BY count DESC',
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
    title: 'Total Credits Spent',
    x: 0,
    y: 3,
    width: 3,
    height: 2,
    icon: 'dollar-sign',
    dataSource: {
      query: 'SELECT SUM(CREDITS_SPENT) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE CREDITS_SPENT IS NOT NULL',
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  }
];

export default function Dashboard() {
  const { toast } = useToast();
  
  // State management
  const [tiles, setTiles] = useState<DashboardTile[]>(initialTiles);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTile, setEditingTile] = useState<DashboardTile | null>(null);
  const [timeFilters, setTimeFilters] = useState<TimeFilterState>({
    chartType: 'line',
    timeRange: '7d',
    granularity: 'day'
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load tiles from database on mount
  const loadTiles = async () => {
    try {
      const data = await apiRequest('/api/dashboard/tiles');
      if (data && Array.isArray(data) && data.length > 0) {
        const convertedTiles = data.map((dbTile: any) => ({
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
        console.log('Loaded tiles from database:', convertedTiles);
        setTiles(convertedTiles);
      }
    } catch (error) {
      console.error('Failed to load tiles:', error);
    }
    setIsLoaded(true);
  };

  // Save tiles to database
  const saveTiles = async (tilesToSave: DashboardTile[]) => {
    try {
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
        refreshConfig: tile.refreshConfig
      }));

      const response = await apiRequest('/api/dashboard/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiles: tileInstances }),
      });

      console.log('Layout saved successfully');
      return response;
    } catch (error) {
      console.error('Failed to save layout:', error);
      throw error;
    }
  };

  // Load tiles on component mount
  useEffect(() => {
    loadTiles();
  }, []);

  // Handle manual save
  const handleSaveLayout = async () => {
    try {
      await saveTiles(tiles);
      setIsEditMode(false);
      toast({
        title: "Dashboard Saved",
        description: "Layout saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save layout",
        variant: "destructive",
      });
    }
  };

  // Handle tile changes
  const handleTilesChange = (newTiles: DashboardTile[]) => {
    setTiles(newTiles);
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleEditTile = (tile: DashboardTile) => {
    setEditingTile(tile);
  };

  const handleSaveEditedTile = (updatedTile: DashboardTile) => {
    setTiles(prevTiles => 
      prevTiles.map(tile => 
        tile.id === updatedTile.id ? updatedTile : tile
      )
    );
    setEditingTile(null);
  };

  const handleRemoveTile = (tileId: string) => {
    setTiles(prevTiles => prevTiles.filter(tile => tile.id !== tileId));
  };

  const handleDuplicateTile = (tile: DashboardTile) => {
    const newTile: DashboardTile = {
      ...tile,
      id: `${tile.id}-copy-${Date.now()}`,
      title: `${tile.title} (Copy)`,
      x: tile.x + 1,
      y: tile.y + 1,
    };
    setTiles(prevTiles => [...prevTiles, newTile]);
  };

  const handleRefreshTile = (tileId: string) => {
    // Implement tile refresh logic
    console.log('Refreshing tile:', tileId);
  };

  const handleTimeFiltersChange = (newFilters: TimeFilterState) => {
    setTimeFilters(newFilters);
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time analytics and insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex">
              {tiles.length} tiles
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTiles()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveLayout}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Layout
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

      {/* Dashboard Content */}
      <div className="flex-1 p-6">
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