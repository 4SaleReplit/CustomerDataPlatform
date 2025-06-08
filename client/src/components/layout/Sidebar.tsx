import React from 'react';
import { NavLink } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

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

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Database className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold text-white">CDP</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
