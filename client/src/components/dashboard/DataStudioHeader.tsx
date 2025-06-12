import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  Save,
  Share,
  Settings,
  Database,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';

interface DataStudioHeaderProps {
  activeTab: string;
  onSave?: () => void;
  onShare?: () => void;
}

const getTabInfo = (tabId: string) => {
  switch (tabId) {
    case 'bi-interface':
      return {
        title: 'SQL Editor',
        description: 'Write and execute SQL queries with advanced autocomplete',
        icon: Database,
        actions: [
          { label: 'New Query', icon: Plus },
          { label: 'Save Query', icon: Save }
        ]
      };
    case 'worksheets':
      return {
        title: 'Worksheets',
        description: 'Create and manage data worksheets',
        icon: FileSpreadsheet,
        actions: [
          { label: 'New Worksheet', icon: Plus }
        ]
      };
    case 'visualizations':
      return {
        title: 'Visualization Gallery',
        description: 'Browse and manage saved visualizations',
        icon: BarChart3,
        actions: [
          { label: 'New Visualization', icon: Plus },
          { label: 'Save', icon: Save }
        ]
      };
    case 'reports':
      return {
        title: 'Reports',
        description: 'Generate and manage analytical reports',
        icon: TrendingUp,
        actions: [
          { label: 'New Report', icon: Plus },
          { label: 'Save Report', icon: Save }
        ]
      };
    case 'analytics':
      return {
        title: 'Analytics',
        description: 'Advanced analytics and insights',
        icon: Activity,
        actions: [
          { label: 'New Analysis', icon: Plus },
          { label: 'Export', icon: Share }
        ]
      };
    default:
      return {
        title: 'Data Studio',
        description: 'Business intelligence and analytics platform',
        icon: Database,
        actions: []
      };
  }
};

export function DataStudioHeader({ activeTab, onSave, onShare }: DataStudioHeaderProps) {
  const tabInfo = getTabInfo(activeTab);
  const IconComponent = tabInfo.icon;

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        {/* Tab Info */}
        <div className="flex items-center space-x-3 flex-1">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{tabInfo.title}</h1>
            <p className="text-sm text-muted-foreground">{tabInfo.description}</p>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-4 h-8" />

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {tabInfo.actions.map((action, index) => {
            const ActionIcon = action.icon;
            const isMainAction = action.icon === Plus;
            
            return (
              <Button
                key={index}
                variant={isMainAction ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (action.icon === Save && onSave) {
                    onSave();
                  } else if (action.icon === Share && onShare) {
                    onShare();
                  }
                }}
                className="h-9"
              >
                <ActionIcon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
          
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare} className="h-9">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-9">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}