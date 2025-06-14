import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { SimpleDashboardGrid } from './SimpleDashboardGrid';

export interface DashboardTile {
  id: string;
  databaseId?: string; // Database ID for API calls
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'gauge';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  icon?: string;
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

const TILE_TYPES = [
  { value: 'metric', label: 'Metric' },
  { value: 'chart', label: 'Chart' },
  { value: 'table', label: 'Table' },
  { value: 'funnel', label: 'Funnel' },
  { value: 'gauge', label: 'Gauge' }
];

export function DashboardBuilder({ 
  tiles, 
  onTilesChange, 
  isEditMode, 
  onEditTile, 
  onRemoveTile, 
  onDuplicateTile, 
  onRefreshTile 
}: DashboardBuilderProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newTile, setNewTile] = useState<Partial<DashboardTile>>({
    type: 'metric',
    title: '',
    width: 4,
    height: 2,
    icon: 'users',
    dataSource: {
      table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
      query: 'SELECT COUNT(*) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
      aggregation: 'count'
    },
    refreshConfig: {
      autoRefresh: false,
      refreshOnLoad: true
    }
  });

  const addTile = () => {
    const tile: DashboardTile = {
      id: `tile-${Date.now()}`,
      type: newTile.type as DashboardTile['type'],
      title: newTile.title || `New ${newTile.type}`,
      x: 0,
      y: 0,
      width: newTile.width || 4,
      height: newTile.height || 2,
      icon: newTile.icon,
      dataSource: newTile.dataSource!,
      refreshConfig: newTile.refreshConfig || {
        autoRefresh: false,
        refreshOnLoad: true
      }
    };

    onTilesChange([...tiles, tile]);
    setIsConfigOpen(false);
    setNewTile({
      type: 'metric',
      title: '',
      width: 4,
      height: 2,
      icon: 'users',
      dataSource: {
        table: 'DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
        query: 'SELECT COUNT(*) as value FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4',
        aggregation: 'count'
      },
      refreshConfig: {
        autoRefresh: false,
        refreshOnLoad: true
      }
    });
  };

  const handleRemoveTile = (tileId: string) => {
    onTilesChange(tiles.filter(tile => tile.id !== tileId));
  };

  const handleDuplicateTile = (tile: DashboardTile) => {
    const newTile: DashboardTile = {
      ...tile,
      id: `tile-${Date.now()}`,
      x: tile.x + 1,
      y: tile.y + 1
    };
    onTilesChange([...tiles, newTile]);
  };

  const handleTileMove = (tileId: string, newPosition: { x: number; y: number }) => {
    console.log(`DRAG: Moving tile ${tileId} from (${tiles.find(t => t.id === tileId)?.x}, ${tiles.find(t => t.id === tileId)?.y}) to (${newPosition.x}, ${newPosition.y})`);
    const updatedTiles = tiles.map(tile => 
      tile.id === tileId 
        ? { ...tile, x: newPosition.x, y: newPosition.y }
        : tile
    );
    console.log(`DRAG: Updated tiles state:`, updatedTiles.map(t => ({ id: t.id, x: t.x, y: t.y })));
    onTilesChange(updatedTiles);
  };

  const handleTileResize = (tileId: string, newSize: { width: number; height: number }) => {
    console.log(`DRAG: Resizing tile ${tileId} from (${tiles.find(t => t.id === tileId)?.width}x${tiles.find(t => t.id === tileId)?.height}) to (${newSize.width}x${newSize.height})`);
    const updatedTiles = tiles.map(tile => 
      tile.id === tileId 
        ? { ...tile, width: newSize.width, height: newSize.height }
        : tile
    );
    console.log(`DRAG: Updated tiles state:`, updatedTiles.map(t => ({ id: t.id, width: t.width, height: t.height })));
    onTilesChange(updatedTiles);
  };

  return (
    <div className="space-y-6">
      {/* Add Tile Button - Prominent position in edit mode */}
      {isEditMode && (
        <div className="flex justify-center">
          <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Add Tile
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[500px]">
              <SheetHeader>
                <SheetTitle>Add New Tile</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Tile Type</Label>
                  <Select
                    value={newTile.type}
                    onValueChange={(value) => setNewTile({...newTile, type: value as DashboardTile['type']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TILE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Enter tile title..."
                    value={newTile.title}
                    onChange={(e) => setNewTile({...newTile, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={newTile.width}
                      onChange={(e) => setNewTile({...newTile, width: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={newTile.height}
                      onChange={(e) => setNewTile({...newTile, height: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Snowflake Query</Label>
                  <Textarea
                    placeholder="Enter SQL query for Snowflake..."
                    value={newTile.dataSource?.query}
                    onChange={(e) => setNewTile({
                      ...newTile,
                      dataSource: {...newTile.dataSource!, query: e.target.value}
                    })}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Refresh Configuration</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto Refresh on Dashboard Load</Label>
                      <p className="text-xs text-gray-500">Refresh data when dashboard is loaded</p>
                    </div>
                    <Switch
                      checked={newTile.refreshConfig?.refreshOnLoad}
                      onCheckedChange={(checked) => setNewTile({
                        ...newTile,
                        refreshConfig: {...newTile.refreshConfig!, refreshOnLoad: checked}
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto Refresh (Real-time)</Label>
                      <p className="text-xs text-gray-500">Automatically refresh data periodically</p>
                    </div>
                    <Switch
                      checked={newTile.refreshConfig?.autoRefresh}
                      onCheckedChange={(checked) => setNewTile({
                        ...newTile,
                        refreshConfig: {...newTile.refreshConfig!, autoRefresh: checked}
                      })}
                    />
                  </div>
                </div>

                <Button onClick={addTile} className="w-full">
                  Add Tile
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Dashboard Grid - Show tiles */}
      <SimpleDashboardGrid
        tiles={tiles}
        isEditMode={isEditMode}
        onEditTile={onEditTile || (() => {})}
        onRemoveTile={onRemoveTile || handleRemoveTile}
        onDuplicateTile={onDuplicateTile || handleDuplicateTile}
        onRefreshTile={onRefreshTile || (() => {})}
        onTileMove={handleTileMove}
        onTileResize={handleTileResize}
      />
    </div>
  );
}