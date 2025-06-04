import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, X, GripVertical, MoreVertical, RefreshCw, Edit, Copy, Trash2, Users, TrendingUp, TrendingDown } from 'lucide-react';
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

// Enhanced color palette
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

// Icon mapping
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'users':
      return Users;
    case 'trending-up':
      return TrendingUp;
    case 'trending-down':
      return TrendingDown;
    default:
      return Users;
  }
};

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
        const IconComponent = getIconComponent(tile.icon || 'users');
        const isPositive = metricData.change >= 0;
        
        return (
          <div className="h-full flex flex-col p-6 bg-white relative">
            {/* Header with title */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 leading-tight">{tile.title}</h3>
            </div>
            
            {/* Icon in top right */}
            <div className="absolute top-6 right-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            {/* Centered main content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center -mt-4">
              {/* Main metric value */}
              <div className="text-4xl font-bold text-gray-900 mb-3">
                {metricData.value.toLocaleString()}
              </div>
              
              {/* Change indicator */}
              <div className="flex items-center justify-center">
                <span className={`text-sm font-medium flex items-center ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="mr-1">{isPositive ? '↗' : '↘'}</span>
                  {Math.abs(metricData.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
              </div>
            </div>
          </div>
        );

      case 'chart':
        const chartData = mockData as Array<{ date: string; value: number }>;
        return (
          <div className="h-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_COLORS[0]} 
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS[0], strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, stroke: CHART_COLORS[0], strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
        const tableData = mockData as Array<{ id: number; name: string; value: number; status: string }>;
        return (
          <div className="h-full p-4">
            <ScrollArea className="h-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 text-sm font-bold text-gray-700">Name</th>
                    <th className="text-left py-3 px-3 text-sm font-bold text-gray-700">Value</th>
                    <th className="text-left py-3 px-3 text-sm font-bold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-900 font-medium">{row.name}</td>
                      <td className="py-3 px-3 text-sm text-gray-700 font-mono">{row.value}</td>
                      <td className="py-3 px-3">
                        <Badge 
                          variant={row.status === 'Active' ? 'default' : 'secondary'}
                          className={`text-xs font-medium ${
                            row.status === 'Active' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        );

      case 'funnel':
        const funnelData = mockData as Array<{ step: string; users: number; rate: number }>;
        return (
          <div className="h-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="horizontal" margin={{ top: 10, right: 30, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  dataKey="step" 
                  type="category" 
                  width={80}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '14px'
                  }}
                />
                <Bar 
                  dataKey="rate" 
                  fill={CHART_COLORS[1]}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return <div className="text-center text-gray-500 p-8 text-lg">Unknown tile type</div>;
    }
  };

  return (
    <Card 
      className={`relative h-full flex flex-col group transition-all duration-200 overflow-hidden ${
        isEditMode 
          ? 'border-2 border-dashed border-blue-400 shadow-lg bg-blue-50/30' 
          : 'border border-gray-200 shadow-sm hover:shadow-md bg-white'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-1 z-10">
        {isEditMode ? (
          <>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-sm border border-gray-200">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-sm border border-gray-200"
              onClick={() => onEdit?.(tile)}
            >
              <Settings className="h-4 w-4 text-gray-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 bg-white/95 hover:bg-red-50 text-red-600 hover:text-red-700 shadow-sm border border-red-200"
              onClick={() => onRemove?.(tile.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-md border border-gray-200">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border shadow-lg z-50">
                <DropdownMenuItem 
                  onClick={() => onEdit?.(tile)}
                  className="cursor-pointer text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Tile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDuplicate}
                  className="cursor-pointer text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Tile
                </DropdownMenuItem>
                {tile.refreshConfig.autoRefresh && (
                  <DropdownMenuItem 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="cursor-pointer text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onRemove?.(tile.id)}
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Tile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Content area - no header for metric tiles */}
      <CardContent className="flex-1 overflow-hidden p-0 bg-white">
        <div className="h-full min-h-[200px]">
          {renderTileContent()}
        </div>
      </CardContent>
    </Card>
  );
}
