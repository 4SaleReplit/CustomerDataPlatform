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
  const [resizingTile, setResizingTile] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState<{ x: number; y: number } | null>(null);
  const [tempSize, setTempSize] = useState<{ width: number; height: number } | null>(null);
  const [initialTileData, setInitialTileData] = useState<DashboardTile | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const GRID_COLS = 12;
  const CELL_WIDTH = 80; // Base cell width in pixels
  const CELL_HEIGHT = 80; // Base cell height in pixels
  const GAP = 16; // Gap between tiles

  // Calculate grid dimensions
  const gridRows = Math.max(6, Math.max(...tiles.map(tile => tile.y + tile.height)));

  // Check if two tiles overlap
  const tilesOverlap = (tile1: DashboardTile, tile2: DashboardTile) => {
    return !(
      tile1.x >= tile2.x + tile2.width ||
      tile2.x >= tile1.x + tile1.width ||
      tile1.y >= tile2.y + tile2.height ||
      tile2.y >= tile1.y + tile1.height
    );
  };

  // Resolve collisions by pushing tiles down
  const resolveCollisions = useCallback((updatedTiles: DashboardTile[], modifiedTileId: string): DashboardTile[] => {
    const result = [...updatedTiles];
    const modifiedTile = result.find(t => t.id === modifiedTileId);
    if (!modifiedTile) return result;

    // Find tiles that overlap with the modified tile
    const overlappingTiles = result.filter(tile => 
      tile.id !== modifiedTileId && tilesOverlap(modifiedTile, tile)
    );

    // Push overlapping tiles down
    overlappingTiles.forEach(overlappingTile => {
      const newY = modifiedTile.y + modifiedTile.height;
      const tileIndex = result.findIndex(t => t.id === overlappingTile.id);
      if (tileIndex !== -1) {
        result[tileIndex] = { ...result[tileIndex], y: newY };
      }
    });

    // Recursively resolve any new collisions created by pushing tiles
    let hasCollisions = true;
    while (hasCollisions) {
      hasCollisions = false;
      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          if (tilesOverlap(result[i], result[j])) {
            // Push the lower tile further down
            const lowerTile = result[i].y > result[j].y ? i : j;
            const upperTile = result[i].y > result[j].y ? j : i;
            result[lowerTile] = {
              ...result[lowerTile],
              y: result[upperTile].y + result[upperTile].height
            };
            hasCollisions = true;
            break;
          }
        }
        if (hasCollisions) break;
      }
    }

    return result;
  }, []);

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

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, tileId: string, handle: string) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation(); // Prevent drag from starting
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    setResizingTile(tileId);
    setResizeHandle(handle);
    setTempSize({ width: tile.width, height: tile.height });
    setInitialTileData(tile);

    console.log(`RESIZE START: ${tileId} handle ${handle} at size (${tile.width}x${tile.height})`);
  }, [isEditMode, tiles]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();

    // Handle dragging
    if (draggedTile) {
      const pixelX = e.clientX - gridRect.left - dragOffset.x;
      const pixelY = e.clientY - gridRect.top - dragOffset.y;

      const gridPos = pixelsToGrid(pixelX, pixelY);
      
      // Constrain to grid bounds
      const constrainedX = Math.max(0, Math.min(GRID_COLS - 1, gridPos.x));
      const constrainedY = Math.max(0, gridPos.y);

      setTempPosition({ x: constrainedX, y: constrainedY });
    }

    // Handle resizing
    if (resizingTile && initialTileData && resizeHandle) {
      const mouseX = e.clientX - gridRect.left;
      const mouseY = e.clientY - gridRect.top;
      
      const tilePixelPos = gridToPixels(initialTileData.x, initialTileData.y);
      const currentWidth = initialTileData.width * CELL_WIDTH + (initialTileData.width - 1) * GAP;
      const currentHeight = initialTileData.height * CELL_HEIGHT + (initialTileData.height - 1) * GAP;

      let newWidth = initialTileData.width;
      let newHeight = initialTileData.height;

      // Calculate new dimensions based on resize handle
      if (resizeHandle.includes('right')) {
        const newPixelWidth = mouseX - tilePixelPos.x;
        newWidth = Math.max(2, Math.round(newPixelWidth / (CELL_WIDTH + GAP)));
      }
      if (resizeHandle.includes('bottom')) {
        const newPixelHeight = mouseY - tilePixelPos.y;
        newHeight = Math.max(1, Math.round(newPixelHeight / (CELL_HEIGHT + GAP)));
      }

      // Constrain to grid bounds
      newWidth = Math.min(newWidth, GRID_COLS - initialTileData.x);
      
      setTempSize({ width: newWidth, height: newHeight });
    }
  }, [draggedTile, resizingTile, dragOffset, initialTileData, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    // Handle drag completion with collision resolution
    if (draggedTile && tempPosition) {
      const tile = tiles.find(t => t.id === draggedTile);
      if (tile && (tile.x !== tempPosition.x || tile.y !== tempPosition.y)) {
        console.log(`DRAG END: Moving ${draggedTile} from (${tile.x}, ${tile.y}) to (${tempPosition.x}, ${tempPosition.y})`);
        
        // Create updated tiles array with new position
        const updatedTiles = tiles.map(t => 
          t.id === draggedTile ? { ...t, x: tempPosition.x, y: tempPosition.y } : t
        );
        
        // Resolve collisions and apply all changes
        const resolvedTiles = resolveCollisions(updatedTiles, draggedTile);
        
        // Apply position changes for all affected tiles
        resolvedTiles.forEach(resolvedTile => {
          const originalTile = tiles.find(t => t.id === resolvedTile.id);
          if (originalTile && (originalTile.x !== resolvedTile.x || originalTile.y !== resolvedTile.y)) {
            onTileMove(resolvedTile.id, { x: resolvedTile.x, y: resolvedTile.y });
          }
        });
      }
    }

    // Handle resize completion with collision resolution
    if (resizingTile && tempSize && initialTileData) {
      if (initialTileData.width !== tempSize.width || initialTileData.height !== tempSize.height) {
        console.log(`RESIZE END: Resizing ${resizingTile} from (${initialTileData.width}x${initialTileData.height}) to (${tempSize.width}x${tempSize.height})`);
        
        // Create updated tiles array with new size
        const updatedTiles = tiles.map(t => 
          t.id === resizingTile ? { ...t, width: tempSize.width, height: tempSize.height } : t
        );
        
        // Resolve collisions and apply all changes
        const resolvedTiles = resolveCollisions(updatedTiles, resizingTile);
        
        // Apply size change first
        onTileResize(resizingTile, tempSize);
        
        // Then apply position changes for displaced tiles
        resolvedTiles.forEach(resolvedTile => {
          const originalTile = tiles.find(t => t.id === resolvedTile.id);
          if (originalTile && resolvedTile.id !== resizingTile && 
              (originalTile.x !== resolvedTile.x || originalTile.y !== resolvedTile.y)) {
            onTileMove(resolvedTile.id, { x: resolvedTile.x, y: resolvedTile.y });
          }
        });
      }
    }

    // Reset all states
    setDraggedTile(null);
    setResizingTile(null);
    setResizeHandle(null);
    setTempPosition(null);
    setTempSize(null);
    setInitialTileData(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedTile, resizingTile, tempPosition, tempSize, initialTileData, tiles, onTileMove, onTileResize, resolveCollisions]);

  // Attach global mouse events
  React.useEffect(() => {
    if (draggedTile || resizingTile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTile, resizingTile, handleMouseMove, handleMouseUp]);

  // Get tile position (use temp position if dragging)
  const getTilePosition = (tile: DashboardTile) => {
    if (draggedTile === tile.id && tempPosition) {
      return tempPosition;
    }
    return { x: tile.x, y: tile.y };
  };

  // Get tile size (use temp size if resizing)
  const getTileSize = (tile: DashboardTile) => {
    if (resizingTile === tile.id && tempSize) {
      return tempSize;
    }
    return { width: tile.width, height: tile.height };
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
        const size = getTileSize(tile);
        const pixelPos = gridToPixels(position.x, position.y);
        const isDragging = draggedTile === tile.id;
        const isResizing = resizingTile === tile.id;

        return (
          <div
            key={tile.id}
            className={`absolute transition-all duration-200 ${isDragging || isResizing ? 'z-50 shadow-2xl' : 'z-10'} ${
              isEditMode ? 'cursor-move' : ''
            }`}
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y}px`,
              width: `${size.width * CELL_WIDTH + (size.width - 1) * GAP}px`,
              height: `${size.height * CELL_HEIGHT + (size.height - 1) * GAP}px`,
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
            
            {/* Resize handles - only show in edit mode */}
            {isEditMode && (
              <>
                {/* Bottom-right corner handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 opacity-50 hover:opacity-100 cursor-se-resize border border-white"
                  style={{ transform: 'translate(50%, 50%)' }}
                  onMouseDown={(e) => handleResizeMouseDown(e, tile.id, 'bottom-right')}
                />
                
                {/* Right edge handle */}
                <div
                  className="absolute top-1/2 right-0 w-2 h-8 bg-blue-500 opacity-50 hover:opacity-100 cursor-e-resize"
                  style={{ transform: 'translate(50%, -50%)' }}
                  onMouseDown={(e) => handleResizeMouseDown(e, tile.id, 'right')}
                />
                
                {/* Bottom edge handle */}
                <div
                  className="absolute bottom-0 left-1/2 w-8 h-2 bg-blue-500 opacity-50 hover:opacity-100 cursor-s-resize"
                  style={{ transform: 'translate(-50%, 50%)' }}
                  onMouseDown={(e) => handleResizeMouseDown(e, tile.id, 'bottom')}
                />
              </>
            )}
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