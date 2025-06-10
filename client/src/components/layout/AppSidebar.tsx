import React from 'react';
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
  Cable
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
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'User Explorer', href: '/users', icon: Users },
  { name: 'Cohorts', href: '/cohorts', icon: Target },
  { name: 'Segment Tags', href: '/segments', icon: Tags },
  { name: 'Upselling Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Campaign Calendar', href: '/calendar', icon: Calendar },
  { name: 'Activity Log', href: '/activity-log', icon: FileText },
  { name: 'Integrations', href: '/integrations', icon: Cable },
  { name: 'Admin', href: '/admin', icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { state } = useSidebar();
  const { user } = useUser();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <Database className="h-8 w-8 text-blue-500 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xl font-bold">CDP</span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location === item.href || 
                  (item.href !== '/' && location.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                        onClick={() => trackBusinessEvent.navigationItemClicked(item.name)}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {user && (
          <div className="px-3 py-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
