import React, { useState, useRef, useCallback } from 'react';
import { DashboardTileComponent } from './DashboardTile';
import type { DashboardTile } from './DashboardBuilder';

interface SimpleDashboardGridProps {
  tiles: DashboardTile[];
  isEditMode: boolean;
  onEditTile: (tile: DashboardTile) => void;
  onRemoveTile: (tileId: string) => void;
  onDuplicateTile: (tile: DashboardTile) => void;
  onRefreshTile: (tileId: string) => void;
  onTileMove: (tileId: string, newPosition: { x: number; y: number }) => void;
  onTileResize: (tileId: string, newSize: { width: number; height: number }) => void;
}

export function SimpleDashboardGrid({
  tiles,
  isEditMode,
  onEditTile,
  onRemoveTile,
  onDuplicateTile,
  onRefreshTile,
  onTileMove,
  onTileResize
}: SimpleDashboardGridProps) {
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const GRID_COLS = 12;
  const CELL_WIDTH = 80; // Base cell width in pixels
  const CELL_HEIGHT = 80; // Base cell height in pixels
  const GAP = 16; // Gap between tiles

  // Calculate grid dimensions
  const gridRows = Math.max(6, Math.max(...tiles.map(tile => tile.y + tile.height)));

  // Convert grid position to pixel position
  const gridToPixels = (gridX: number, gridY: number) => ({
    x: gridX * (CELL_WIDTH + GAP),
    y: gridY * (CELL_HEIGHT + GAP)
  });

  // Convert pixel position to grid position
  const pixelsToGrid = (pixelX: number, pixelY: number) => ({
    x: Math.round(pixelX / (CELL_WIDTH + GAP)),
    y: Math.round(pixelY / (CELL_HEIGHT + GAP))
  });

  const handleMouseDown = useCallback((e: React.MouseEvent, tileId: string) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggedTile(tileId);
    setDragOffset({ x: offsetX, y: offsetY });
    setTempPosition({ x: tile.x, y: tile.y });

    console.log(`DRAG START: ${tileId} at (${tile.x}, ${tile.y})`);
  }, [isEditMode, tiles]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedTile || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const pixelX = e.clientX - gridRect.left - dragOffset.x;
    const pixelY = e.clientY - gridRect.top - dragOffset.y;

    const gridPos = pixelsToGrid(pixelX, pixelY);
    
    // Constrain to grid bounds
    const constrainedX = Math.max(0, Math.min(GRID_COLS - 1, gridPos.x));
    const constrainedY = Math.max(0, gridPos.y);

    setTempPosition({ x: constrainedX, y: constrainedY });
  }, [draggedTile, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (!draggedTile || !tempPosition) return;

    const tile = tiles.find(t => t.id === draggedTile);
    if (tile && (tile.x !== tempPosition.x || tile.y !== tempPosition.y)) {
      console.log(`DRAG END: Moving ${draggedTile} from (${tile.x}, ${tile.y}) to (${tempPosition.x}, ${tempPosition.y})`);
      onTileMove(draggedTile, tempPosition);
    }

    setDraggedTile(null);
    setTempPosition(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedTile, tempPosition, tiles, onTileMove]);

  // Attach global mouse events
  React.useEffect(() => {
    if (draggedTile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTile, handleMouseMove, handleMouseUp]);

  // Get tile position (use temp position if dragging)
  const getTilePosition = (tile: DashboardTile) => {
    if (draggedTile === tile.id && tempPosition) {
      return tempPosition;
    }
    return { x: tile.x, y: tile.y };
  };

  return (
    <div 
      ref={gridRef}
      className="relative"
      style={{
        width: `${GRID_COLS * (CELL_WIDTH + GAP)}px`,
        height: `${gridRows * (CELL_HEIGHT + GAP)}px`,
        margin: '0 auto'
      }}
    >
      {tiles.map((tile) => {
        const position = getTilePosition(tile);
        const pixelPos = gridToPixels(position.x, position.y);
        const isDragging = draggedTile === tile.id;

        return (
          <div
            key={tile.id}
            className={`absolute transition-all duration-200 ${isDragging ? 'z-50 shadow-2xl' : 'z-10'} ${
              isEditMode ? 'cursor-move' : ''
            }`}
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y}px`,
              width: `${tile.width * CELL_WIDTH + (tile.width - 1) * GAP}px`,
              height: `${tile.height * CELL_HEIGHT + (tile.height - 1) * GAP}px`,
              transform: isDragging ? 'scale(1.05)' : 'scale(1)',
              opacity: isDragging ? 0.9 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, tile.id)}
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
        );
      })}
      
      {/* Grid background for visual reference in edit mode */}
      {isEditMode && (
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {Array.from({ length: gridRows }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border border-gray-300"
                style={{
                  left: `${col * (CELL_WIDTH + GAP)}px`,
                  top: `${row * (CELL_HEIGHT + GAP)}px`,
                  width: `${CELL_WIDTH}px`,
                  height: `${CELL_HEIGHT}px`
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}