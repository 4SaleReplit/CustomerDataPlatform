import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home,
  BarChart3, 
  Database, 
  FileSpreadsheet, 
  Settings, 
  User,
  ChevronRight,
  ChevronDown,
  Activity,
  PieChart,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Share2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: Home 
  },
  { 
    id: 'data-studio', 
    label: 'Data Studio', 
    icon: Database,
    children: [
      { id: 'bi-interface', label: 'SQL Editor', icon: Database },
      { id: 'worksheets', label: 'Worksheets', icon: FileSpreadsheet },
      { id: 'visualizations', label: 'Visualizations', icon: BarChart3 },
      { id: 'reports', label: 'Reports', icon: TrendingUp },
      { id: 'analytics', label: 'Analytics', icon: Activity }
    ]
  },
  { 
    id: 'cohorts', 
    label: 'Cohorts', 
    icon: Users 
  },
  { 
    id: 'campaigns', 
    label: 'Campaigns', 
    icon: Calendar 
  },
  { 
    id: 'integrations', 
    label: 'Integrations', 
    icon: Settings,
    children: [
      { id: 'amplitude', label: 'Amplitude', icon: Target },
      { id: 'braze', label: 'Braze', icon: Share2 },
      { id: 'snowflake', label: 'Snowflake', icon: Database },
      { id: 'api-keys', label: 'API Keys', icon: Zap }
    ]
  }
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['data-studio']);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActiveOrChild = (item: NavItem): boolean => {
    if (item.id === activeTab) return true;
    if (item.children) {
      return item.children.some(child => child.id === activeTab);
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const Icon = item.icon;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.id === activeTab;
    const hasActiveChild = item.children?.some(child => child.id === activeTab);
    const shouldHighlight = isActive || hasActiveChild;

    return (
      <div key={item.id} className="w-full">
        <div 
          className={cn(
            "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer group",
            level === 0 ? 'mb-1' : 'mb-0.5',
            shouldHighlight
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
            level > 0 ? 'ml-4 pl-6' : ''
          )}
          onClick={() => {
            if (item.children) {
              toggleExpanded(item.id);
            } else {
              onTabChange(item.id);
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className={cn(
              "flex items-center justify-center w-5 h-5",
              shouldHighlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <span className={cn(
              "font-medium transition-colors",
              shouldHighlight ? 'text-blue-700 dark:text-blue-300' : 'group-hover:text-gray-900 dark:group-hover:text-white'
            )}>
              {item.label}
            </span>
          </div>
          
          {item.children && (
            <div className="flex-shrink-0 transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
        
        {item.children && isExpanded && (
          <div className="mt-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
            {item.children.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">CDP Analytics</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Business Intelligence Platform</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => renderNavItem(item))}
      </div>
      
      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
            <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Super Administrator</p>
          </div>
          <Settings className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>
      </div>
    </div>
  );
}