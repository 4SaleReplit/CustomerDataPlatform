
import React, { useState } from 'react';
import { Plus, Save, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export interface DashboardTile {
  id: string;
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
}

const TILE_TYPES = [
  { value: 'metric', label: 'Metric Card' },
  { value: 'chart', label: 'Line Chart' },
  { value: 'table', label: 'Data Table' },
  { value: 'funnel', label: 'Funnel Chart' },
  { value: 'gauge', label: 'Gauge Chart' }
];

const DATA_TABLES = [
  { value: 'users', label: 'Users' },
  { value: 'listings', label: 'Listings' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'events', label: 'Events' },
  { value: 'cohorts', label: 'Cohorts' }
];

const ICON_OPTIONS = [
  { value: 'users', label: 'Users', component: Users },
  { value: 'trending-up', label: 'Trending Up', component: TrendingUp },
  { value: 'trending-down', label: 'Trending Down', component: TrendingDown }
];

export function DashboardBuilder({ tiles, onTilesChange, isEditMode }: DashboardBuilderProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newTile, setNewTile] = useState<Partial<DashboardTile>>({
    type: 'metric',
    title: '',
    width: 4,
    height: 2,
    icon: 'users',
    dataSource: {
      table: 'users',
      query: 'SELECT COUNT(*) as value FROM users',
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
        table: 'users',
        query: 'SELECT COUNT(*) as value FROM users',
        aggregation: 'count'
      },
      refreshConfig: {
        autoRefresh: false,
        refreshOnLoad: true
      }
    });
  };

  return (
    <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
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

          {newTile.type === 'metric' && (
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={newTile.icon}
                onValueChange={(value) => setNewTile({...newTile, icon: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {ICON_OPTIONS.map((icon) => {
                    const IconComponent = icon.component;
                    return (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width (columns)</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={newTile.width}
                onChange={(e) => setNewTile({...newTile, width: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Height (rows)</Label>
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
            <Label>Data Source Table</Label>
            <Select
              value={newTile.dataSource?.table}
              onValueChange={(value) => setNewTile({
                ...newTile,
                dataSource: {...newTile.dataSource!, table: value}
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TABLES.map((table) => (
                  <SelectItem key={table.value} value={table.value}>
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Query</Label>
            <Textarea
              placeholder="Enter SQL query..."
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
                checked={newTile.refreshConfig?.refreshOnLoad || false}
                onCheckedChange={(checked) => setNewTile({
                  ...newTile,
                  refreshConfig: {
                    ...newTile.refreshConfig!,
                    refreshOnLoad: checked
                  }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Manual Refresh Available</Label>
                <p className="text-xs text-gray-500">Show refresh button in tile menu</p>
              </div>
              <Switch
                checked={newTile.refreshConfig?.autoRefresh || false}
                onCheckedChange={(checked) => setNewTile({
                  ...newTile,
                  refreshConfig: {
                    ...newTile.refreshConfig!,
                    autoRefresh: checked
                  }
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
  );
}
