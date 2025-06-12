import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  BarChart3, 
  Users, 
  Target, 
  Tags, 
  Megaphone, 
  Calendar, 
  Settings,
  Database,
  FileText,
  Cable,
  Shield,
  LogOut,
  Home,
  PieChart,
  Activity,
  TrendingUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { trackBusinessEvent } from '@/lib/amplitude';
import { useUser } from '@/contexts/UserContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigation = [
  { name: 'Home', href: '/', icon: Home, children: [] },
  { 
    name: 'Data Studio', 
    href: '/data-studio', 
    icon: PieChart,
    children: [
      { name: 'Dashboards', href: '/data-studio/dashboards', icon: BarChart3 },
      { name: 'Explores', href: '/data-studio/explores', icon: PieChart },
      { name: 'SQL Editor', href: '/data-studio/sql', icon: Database },
      { name: 'File System', href: '/data-studio/files', icon: FileText },
      { name: 'Lineage', href: '/data-studio/lineage', icon: Activity },
      { name: 'Data Explorer', href: '/data-studio/explorer', icon: BarChart3 }
    ]
  },
  { name: 'Reports Builder', href: '/reports', icon: FileText, children: [] },
  { name: 'Ask Amplitude', href: '/ask', icon: Shield },
  { 
    name: 'Marketing Analytics', 
    href: '/marketing', 
    icon: Megaphone,
    children: [
      { name: 'User Explorer', href: '/users', icon: Users },
      { name: 'Cohorts', href: '/cohorts', icon: Target },
      { name: 'Segment Tags', href: '/segments', icon: Tags },
      { name: 'Upselling Campaigns', href: '/campaigns', icon: Megaphone }
    ]
  },
  { name: 'Integrations', href: '/integrations', icon: Cable },
  { name: 'Admin', href: '/admin', icon: Settings },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [expandedItems, setExpandedItems] = useState<string[]>(['Home', 'Product Analytics', 'Marketing Analytics']);
  
  // Safely get user context
  let user = null;
  let logout = null;
  try {
    const userContext = useUser();
    user = userContext?.user;
    logout = userContext?.logout;
  } catch (error) {
    // User context not available, continue without user info
    console.warn('User context not available in sidebar');
  }

  const handleLogout = () => {
    if (logout) {
      logout();
      setLocation('/login');
    }
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Database className="h-6 w-6 text-white flex-shrink-0" />
          </div>
          {!isCollapsed && (
            <div className="space-y-1">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">CDP</span>
              <p className="text-xs text-muted-foreground font-medium">Analytics Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : "text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href || 
                  (item.href !== '/' && location.startsWith(item.href));
                const isExpanded = expandedItems.includes(item.name);
                const hasChildren = item.children && item.children.length > 0;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    {hasChildren ? (
                      <Collapsible 
                        open={isExpanded} 
                        onOpenChange={() => toggleExpanded(item.name)}
                        className="w-full"
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            isActive={isActive}
                            tooltip={isCollapsed ? item.name : undefined}
                            className="w-full justify-between hover:bg-accent hover:text-accent-foreground"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              {!isCollapsed && (
                                <span className="font-medium text-sm">{item.name}</span>
                              )}
                            </div>
                            {!isCollapsed && hasChildren && (
                              isExpanded ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children?.map((child) => {
                              const childIsActive = location === child.href;
                              return (
                                <SidebarMenuSubItem key={child.name}>
                                  <SidebarMenuSubButton asChild isActive={childIsActive}>
                                    <Link
                                      href={child.href}
                                      onClick={() => trackBusinessEvent.navigationItemClicked(child.name)}
                                    >
                                      <child.icon className="h-4 w-4" />
                                      <span>{child.name}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          href={item.href}
                          onClick={() => trackBusinessEvent.navigationItemClicked(item.name)}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="font-medium text-sm">{item.name}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {user && (
          <div className="mx-2 mb-2 space-y-2">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate tracking-tight">
                    {user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-medium">
                    {user.role === 'administrator' ? 'Administrator' : 'User'}
                  </p>
                </div>
              )}
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm" 
              className={`w-full flex items-center gap-2 ${isCollapsed ? 'px-2' : 'px-3'}`}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
