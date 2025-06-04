import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardTile } from './DashboardBuilder';

interface TileEditDialogProps {
  tile: DashboardTile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTile: DashboardTile) => void;
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

export function TileEditDialog({ tile, isOpen, onClose, onSave }: TileEditDialogProps) {
  const [editedTile, setEditedTile] = useState<DashboardTile | null>(null);

  useEffect(() => {
    if (tile) {
      setEditedTile({ ...tile });
    }
  }, [tile]);

  const handleSave = () => {
    if (editedTile) {
      onSave(editedTile);
      onClose();
    }
  };

  const handleClose = () => {
    setEditedTile(null);
    onClose();
  };

  if (!editedTile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[400px] sm:w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Tile Type</Label>
            <Select
              value={editedTile.type}
              onValueChange={(value) => setEditedTile({
                ...editedTile, 
                type: value as DashboardTile['type']
              })}
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
              value={editedTile.title}
              onChange={(e) => setEditedTile({
                ...editedTile, 
                title: e.target.value
              })}
            />
          </div>

          {editedTile.type === 'metric' && (
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={editedTile.icon || 'users'}
                onValueChange={(value) => setEditedTile({
                  ...editedTile,
                  icon: value
                })}
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
                value={editedTile.width}
                onChange={(e) => setEditedTile({
                  ...editedTile, 
                  width: parseInt(e.target.value)
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Height (rows)</Label>
              <Input
                type="number"
                min="1"
                max="6"
                value={editedTile.height}
                onChange={(e) => setEditedTile({
                  ...editedTile, 
                  height: parseInt(e.target.value)
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data Source Table</Label>
            <Select
              value={editedTile.dataSource.table}
              onValueChange={(value) => setEditedTile({
                ...editedTile,
                dataSource: { ...editedTile.dataSource, table: value }
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
              value={editedTile.dataSource.query}
              onChange={(e) => setEditedTile({
                ...editedTile,
                dataSource: { ...editedTile.dataSource, query: e.target.value }
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
                checked={editedTile.refreshConfig.refreshOnLoad}
                onCheckedChange={(checked) => setEditedTile({
                  ...editedTile,
                  refreshConfig: {
                    ...editedTile.refreshConfig,
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
                checked={editedTile.refreshConfig.autoRefresh}
                onCheckedChange={(checked) => setEditedTile({
                  ...editedTile,
                  refreshConfig: {
                    ...editedTile.refreshConfig,
                    autoRefresh: checked
                  }
                })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
