import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { state } = useSidebar();
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
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <NavLink
                        to={item.href}
                        end={item.href === '/'}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
