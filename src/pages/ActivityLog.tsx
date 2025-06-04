import React, { useState } from 'react';
import { Calendar, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

// Mock activity log data
const mockActivityLogs = [
  {
    id: 1,
    timestamp: '2024-06-03T14:30:00Z',
    user: 'John Doe',
    action: 'create',
    type: 'campaign',
    entityName: 'Welcome New Users',
    details: 'Created new upselling campaign targeting new users',
    ipAddress: '192.168.1.100'
  },
  {
    id: 2,
    timestamp: '2024-06-03T14:15:00Z',
    user: 'Jane Smith',
    action: 'edit',
    type: 'cohort',
    entityName: 'High Value Customers',
    details: 'Updated cohort criteria to include users with >$500 LTV',
    ipAddress: '192.168.1.101'
  },
  {
    id: 3,
    timestamp: '2024-06-03T14:00:00Z',
    user: 'Mike Johnson',
    action: 'duplicate',
    type: 'segment',
    entityName: 'Active Mobile Users',
    details: 'Duplicated segment as "Active Mobile Users (Copy)"',
    ipAddress: '192.168.1.102'
  },
  {
    id: 4,
    timestamp: '2024-06-03T13:45:00Z',
    user: 'Sarah Wilson',
    action: 'delete',
    type: 'campaign',
    entityName: 'Old Promotion Campaign',
    details: 'Permanently deleted inactive campaign',
    ipAddress: '192.168.1.103'
  },
  {
    id: 5,
    timestamp: '2024-06-03T13:30:00Z',
    user: 'John Doe',
    action: 'submit',
    type: 'dashboard',
    entityName: 'Q2 Performance Dashboard',
    details: 'Published dashboard with updated metrics',
    ipAddress: '192.168.1.100'
  },
  {
    id: 6,
    timestamp: '2024-06-03T13:15:00Z',
    user: 'Admin User',
    action: 'refresh',
    type: 'system',
    entityName: 'Data Sync',
    details: 'Manually triggered data refresh from external sources',
    ipAddress: '192.168.1.1'
  },
  {
    id: 7,
    timestamp: '2024-06-03T13:00:00Z',
    user: 'Jane Smith',
    action: 'create',
    type: 'cohort',
    entityName: 'Churned Users',
    details: 'Created cohort for users inactive for 30+ days',
    ipAddress: '192.168.1.101'
  },
  {
    id: 8,
    timestamp: '2024-06-03T12:45:00Z',
    user: 'Mike Johnson',
    action: 'edit',
    type: 'dashboard',
    entityName: 'Sales Dashboard',
    details: 'Updated dashboard layout and added new KPI widgets',
    ipAddress: '192.168.1.102'
  }
];

export default function ActivityLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'cohort', label: 'Cohorts' },
    { value: 'segment', label: 'Segments' },
    { value: 'campaign', label: 'Upselling Campaigns' },
    { value: 'dashboard', label: 'Dashboards' },
    { value: 'system', label: 'System' }
  ];

  const actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'edit', label: 'Edit' },
    { value: 'delete', label: 'Delete' },
    { value: 'duplicate', label: 'Duplicate' },
    { value: 'submit', label: 'Submit' },
    { value: 'refresh', label: 'Refresh' }
  ];

  const filteredLogs = mockActivityLogs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesType && matchesAction;
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      edit: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      duplicate: 'bg-purple-100 text-purple-800',
      submit: 'bg-orange-100 text-orange-800',
      refresh: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={variants[action] || 'bg-gray-100 text-gray-800'}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      cohort: 'bg-indigo-100 text-indigo-800',
      segment: 'bg-cyan-100 text-cyan-800',
      campaign: 'bg-pink-100 text-pink-800',
      dashboard: 'bg-yellow-100 text-yellow-800',
      system: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={variants[type] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleRefresh = () => {
    console.log('Refreshing activity logs...');
    // Here you would typically refetch the data
  };

  const handleExport = () => {
    console.log('Exporting activity logs...');
    // Here you would typically export the filtered data
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockActivityLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockActivityLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search users, entities, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>{getTypeBadge(log.type)}</TableCell>
                  <TableCell className="font-medium">{log.entityName}</TableCell>
                  <TableCell className="max-w-md truncate">{log.details}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">
                    {log.ipAddress}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
