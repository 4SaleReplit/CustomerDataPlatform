
import React, { useRef, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { DashboardTileComponent } from './DashboardTile';
import type { DashboardTile } from './DashboardBuilder';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DashboardGrid.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

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
  const userDraggedRef = useRef<boolean>(false);
  
  // Convert tiles to react-grid-layout format with static positioning
  const layouts = {
    lg: tiles.map(tile => ({
      i: tile.id,
      x: tile.x,
      y: tile.y,
      w: tile.width,
      h: tile.height,
      minW: 2,
      minH: 1,
      maxW: 12,
      maxH: 6,
      static: !isEditMode // Make tiles static in view mode
    }))
  };

  // Track when user initiates drag/resize
  const handleDragStart = () => {
    userDraggedRef.current = true;
  };

  const handleDragStop = () => {
    userDraggedRef.current = false;
  };

  const handleLayoutChange = (layout: any[]) => {
    if (!isEditMode || !userDraggedRef.current) return;
    
    // Only process changes when user actually dragged/resized a tile
    layout.forEach(item => {
      const tile = tiles.find(t => t.id === item.i);
      if (tile) {
        // Only update if there's an actual change from user interaction
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
    
    // Store current layout for comparison
    lastLayoutRef.current = layout.map(item => ({ ...item }));
  };

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  if (!isEditMode) {
    // Static grid for view mode
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

  return (
    <div className="dashboard-grid-container relative">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={80}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleDragStart}
        onResizeStop={handleDragStop}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={false}
        preventCollision={false}
        compactType={null}
        verticalCompact={false}
        autoSize={true}
        allowOverlap={true}
        isBounded={false}
        transformScale={1}
        droppingItem={{ i: '__dropping-elem__', w: 1, h: 1 }}
        style={{ minHeight: 'auto' }}
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
      </ResponsiveGridLayout>
    </div>
  );
}
