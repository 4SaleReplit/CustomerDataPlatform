import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, X, GripVertical, MoreVertical, RefreshCw, Edit, Copy, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { DashboardTile } from './DashboardBuilder';

interface DashboardTileProps {
  tile: DashboardTile;
  isEditMode: boolean;
  onEdit?: (tile: DashboardTile) => void;
  onRemove?: (tileId: string) => void;
  onDuplicate?: (tile: DashboardTile) => void;
  onRefresh?: (tileId: string) => void;
}

// Mock data generators based on tile type
const generateMockData = (tile: DashboardTile) => {
  switch (tile.type) {
    case 'metric':
      return { value: Math.floor(Math.random() * 10000), change: Math.floor(Math.random() * 20) - 10 };
    case 'chart':
      return Array.from({ length: 7 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: Math.floor(Math.random() * 1000) + 500
      }));
    case 'table':
      return Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 100),
        status: Math.random() > 0.5 ? 'Active' : 'Inactive'
      }));
    case 'funnel':
      return [
        { step: 'Registration', users: 1000, rate: 100 },
        { step: 'Verification', users: 850, rate: 85 },
        { step: 'First Action', users: 680, rate: 68 },
        { step: 'Purchase', users: 450, rate: 45 }
      ];
    default:
      return null;
  }
};

export function DashboardTileComponent({ tile, isEditMode, onEdit, onRemove, onDuplicate, onRefresh }: DashboardTileProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const mockData = generateMockData(tile);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    console.log(`Refreshing tile: ${tile.title}`);
    
    // Simulate refresh delay
    setTimeout(() => {
      onRefresh(tile.id);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(tile);
    }
  };

  const renderTileContent = () => {
    switch (tile.type) {
      case 'metric':
        const metricData = mockData as { value: number; change: number };
        return (
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-gray-900">{metricData.value.toLocaleString()}</div>
            <div className={`text-sm flex items-center justify-center mt-2 ${
              metricData.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metricData.change >= 0 ? '↗' : '↘'} {Math.abs(metricData.change)}% from last period
            </div>
          </div>
        );

      case 'chart':
        const chartData = mockData as Array<{ date: string; value: number }>;
        return (
          <div className="h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
        const tableData = mockData as Array<{ id: number; name: string; value: number; status: string }>;
        return (
          <ScrollArea className="h-full max-h-[300px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Value</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-2 px-2">{row.name}</td>
                      <td className="py-2 px-2">{row.value}</td>
                      <td className="py-2 px-2">
                        <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        );

      case 'funnel':
        const funnelData = mockData as Array<{ step: string; users: number; rate: number }>;
        return (
          <div className="h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="step" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="rate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return <div className="text-center text-gray-500">Unknown tile type</div>;
    }
  };

  // Calculate dynamic height based on tile height
  const tileHeight = tile.height * 80 - 40; // Account for padding and header
  const contentHeight = Math.max(150, tileHeight - 80); // Minimum height with header space

  return (
    <Card 
      className={`relative h-full flex flex-col group ${isEditMode ? 'border-dashed border-2 border-blue-300' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {isEditMode ? (
          <>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <GripVertical className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => onEdit?.(tile)}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={() => onRemove?.(tile.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white/80 hover:bg-white shadow-sm">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border shadow-md">
                <DropdownMenuItem 
                  onClick={() => onEdit?.(tile)}
                  className="cursor-pointer"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Tile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDuplicate}
                  className="cursor-pointer"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Duplicate Tile
                </DropdownMenuItem>
                {tile.refreshConfig.autoRefresh && (
                  <DropdownMenuItem 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onRemove?.(tile.id)}
                  className="cursor-pointer text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Remove Tile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate pr-16">{tile.title}</CardTitle>
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <Badge variant="outline" className="text-xs">
                {tile.dataSource.table}
              </Badge>
            )}
            {tile.refreshConfig.lastRefreshed && (
              <Badge variant="secondary" className="text-xs">
                Updated: {new Date(tile.refreshConfig.lastRefreshed).toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <div 
          className="h-full"
          style={{ 
            height: `${contentHeight}px`,
            minHeight: '150px'
          }}
        >
          {renderTileContent()}
        </div>
      </CardContent>
    </Card>
  );
}
