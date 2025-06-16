
import React, { useRef } from 'react';
import GridLayout from 'react-grid-layout';
import { DashboardTileComponent } from './DashboardTile';
import type { DashboardTile } from './DashboardBuilder';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DashboardGrid.css';

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
  const lastLayoutRef = useRef<any[]>([]);
  
  // Convert tiles to react-grid-layout format
  const layout = tiles.map(tile => ({
    i: tile.id,
    x: tile.x,
    y: tile.y,
    w: tile.width,
    h: tile.height,
    minW: 2,
    minH: 1,
    maxW: 12,
    maxH: 6,
    static: !isEditMode
  }));

  const handleLayoutChange = (newLayout: any[]) => {
    if (!isEditMode) return;
    

    
    // Process all layout changes in edit mode
    newLayout.forEach(item => {
      const tile = tiles.find(t => t.id === item.i);
      if (tile) {
        const positionChanged = tile.x !== item.x || tile.y !== item.y;
        const sizeChanged = tile.width !== item.w || tile.height !== item.h;
        
        if (positionChanged) {

          onTileMove(item.i, { x: item.x, y: item.y });
        }
        
        if (sizeChanged) {

          onTileResize(item.i, { width: item.w, height: item.h });
        }
      }
    });
    
    lastLayoutRef.current = newLayout.map(item => ({ ...item }));
  };

  if (!isEditMode) {
    // Static grid for view mode
    const gridCols = 12;
    const gridRows = Math.max(24, Math.max(...tiles.map(tile => tile.y + tile.height)));

    return (
      <div 
        className="relative grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 20px)`,
          minHeight: `${gridRows * 20}px`
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

  return (
    <div className="dashboard-grid-container relative">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={20}
        width={1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={false}
        preventCollision={false}
        compactType={null}
        autoSize={true}
        allowOverlap={true}
        isBounded={false}
        transformScale={1}
      >
        {tiles.map((tile) => (
          <div key={tile.id} className="dashboard-tile-wrapper relative">
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
      </GridLayout>
    </div>
  );
}
