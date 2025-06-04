
import React from 'react';
import { DashboardTileComponent } from './DashboardTile';
import type { DashboardTile } from './DashboardBuilder';

interface DashboardGridProps {
  tiles: DashboardTile[];
  isEditMode: boolean;
  onEditTile: (tile: DashboardTile) => void;
  onRemoveTile: (tileId: string) => void;
  onDuplicateTile: (tile: DashboardTile) => void;
  onRefreshTile: (tileId: string) => void;
  onTileMove: (tileId: string, newPosition: { x: number; y: number }) => void;
  onTileResize: (tileId: string, newSize: { width: number; height: number }) => void;
}

export function DashboardGrid({
  tiles,
  isEditMode,
  onEditTile,
  onRemoveTile,
  onDuplicateTile,
  onRefreshTile,
  onTileMove,
  onTileResize
}: DashboardGridProps) {
  const gridCols = 12;
  const gridRows = Math.max(6, Math.max(...tiles.map(tile => tile.y + tile.height)));

  return (
    <div 
      className="relative grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 80px)`,
        minHeight: `${gridRows * 80}px`
      }}
    >
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className="relative"
          style={{
            gridColumn: `${tile.x + 1} / span ${tile.width}`,
            gridRow: `${tile.y + 1} / span ${tile.height}`
          }}
        >
          <DashboardTileComponent
            tile={tile}
            isEditMode={isEditMode}
            onEdit={onEditTile}
            onRemove={onRemoveTile}
            onDuplicate={onDuplicateTile}
            onRefresh={onRefreshTile}
          />
        </div>
      ))}
    </div>
  );
}
