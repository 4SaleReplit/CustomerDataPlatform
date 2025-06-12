import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Grid3X3, 
  FileText, 
  Database, 
  BarChart3, 
  Settings,
  Plus,
  Save,
  Share
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  isEditMode?: boolean;
}

const navigationTabs = [
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: LayoutDashboard,
    description: 'View and manage dashboards'
  },
  {
    id: 'tiles',
    label: 'Tiles',
    icon: Grid3X3,
    description: 'Manage dashboard tiles'
  },
  {
    id: 'worksheets',
    label: 'Worksheets',
    icon: FileText,
    description: 'Create data worksheets'
  },
  {
    id: 'sql-editor',
    label: 'SQL Editor',
    icon: Database,
    description: 'Write and execute SQL queries'
  },
  {
    id: 'visualizations',
    label: 'Visualizations',
    icon: BarChart3,
    description: 'Create charts and graphs'
  }
];

export function DashboardNavbar({ 
  activeTab, 
  onTabChange, 
  onSave, 
  onShare, 
  isEditMode 
}: DashboardNavbarProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        {/* Main Navigation */}
        <nav className="flex items-center space-x-1 flex-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "h-8 px-3 text-sm font-medium transition-colors",
                  isActive && "bg-muted text-foreground shadow-sm"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </nav>

        <Separator orientation="vertical" className="mx-3 h-6" />

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {activeTab === 'dashboards' && (
            <>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Dashboard
              </Button>
              {onSave && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onSave}
                  disabled={!isEditMode}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              )}
            </>
          )}
          
          {activeTab === 'sql-editor' && (
            <>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Query
              </Button>
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save Query
              </Button>
            </>
          )}

          {activeTab === 'worksheets' && (
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Worksheet
            </Button>
          )}

          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Description */}
      <div className="px-4 py-2 text-sm text-muted-foreground border-t bg-muted/30">
        {navigationTabs.find(tab => tab.id === activeTab)?.description}
      </div>
    </div>
  );
}