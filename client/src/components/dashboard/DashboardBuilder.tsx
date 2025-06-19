import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SimpleDashboardGrid } from './SimpleDashboardGrid';
import { AddTileDialog } from './AddTileDialog';

export interface DashboardTile {
  id: string;
  databaseId?: string; // Database ID for API calls
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'gauge' | 'bar' | 'pie';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  icon?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'column' | 'heatmap' | 'radar' | 'funnel' | 'gauge' | 'sankey' | 'treemap' | 'sunburst' | 'graph' | 'candlestick' | 'boxplot' | 'parallel' | 'tree' | 'map' | 'pictorial' | 'themeRiver' | 'calendar';
  dataSource: {
    table: string;
    query: string;
    aggregation?: string;
    groupBy?: string;
  };
  refreshConfig: {
    autoRefresh: boolean;
    refreshOnLoad: boolean;
    lastRefreshed?: Date;
  };
  lastRefreshAt?: string; // Database timestamp for last refresh
}

interface DashboardBuilderProps {
  tiles: DashboardTile[];
  onTilesChange: (tiles: DashboardTile[]) => void;
  isEditMode: boolean;
  onEditTile?: (tile: DashboardTile) => void;
  onRemoveTile?: (tileId: string) => void;
  onDuplicateTile?: (tile: DashboardTile) => void;
  onRefreshTile?: (tileId: string) => void;
}

export function DashboardBuilder({ 
  tiles, 
  onTilesChange, 
  isEditMode, 
  onEditTile, 
  onRemoveTile, 
  onDuplicateTile, 
  onRefreshTile 
}: DashboardBuilderProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddTile = (tile: DashboardTile) => {
    onTilesChange([...tiles, tile]);
  };

  const handleRemoveTile = (tileId: string) => {
    onTilesChange(tiles.filter(tile => tile.id !== tileId));
  };

  const handleDuplicateTile = (tile: DashboardTile) => {
    const duplicatedTile: DashboardTile = {
      ...tile,
      id: `tile-${Date.now()}`,
      x: tile.x + 1,
      y: tile.y + 1
    };
    onTilesChange([...tiles, duplicatedTile]);
  };

  const handleLayoutChange = (updatedTiles: DashboardTile[]) => {
    onTilesChange(updatedTiles);
  };

  return (
    <div className="space-y-4">
      {isEditMode && (
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Tile
            </Button>
          </div>
        </div>
      )}

      <SimpleDashboardGrid
        tiles={tiles}
        onLayoutChange={handleLayoutChange}
        isEditMode={isEditMode}
        onEditTile={onEditTile || (() => {})}
        onRemoveTile={onRemoveTile || handleRemoveTile}
        onDuplicateTile={onDuplicateTile || handleDuplicateTile}
        onRefreshTile={onRefreshTile || (() => {})}
      />

      <AddTileDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddTile}
      />
    </div>
  );
}