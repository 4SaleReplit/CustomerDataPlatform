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
  Cable,
  Shield
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
  const isCollapsed = state === "collapsed";
  
  // Safely get user context
  let user = null;
  try {
    const userContext = useUser();
    user = userContext?.user;
  } catch (error) {
    // User context not available, continue without user info
    console.warn('User context not available in sidebar');
  }

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
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={isCollapsed ? item.name : undefined}
                      className={`
                        group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 
                        hover:border-blue-200 hover:shadow-sm
                        ${isActive ? 
                          'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg border-blue-300' : 
                          'text-gray-700 hover:text-blue-700'
                        }
                      `}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 w-full"
                        onClick={() => trackBusinessEvent.navigationItemClicked(item.name)}
                      >
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                          ${isActive ? 
                            'bg-white/20' : 
                            'group-hover:bg-blue-100'
                          }
                        `}>
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />
                        </div>
                        {!isCollapsed && (
                          <span className="font-medium text-sm tracking-tight">{item.name}</span>
                        )}
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
          <div className="mx-2 mb-2">
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
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
