
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { analytics } from '@/lib/amplitude';

// Mock campaign events
const mockEvents = [
  {
    id: 1,
    name: 'Welcome New Users',
    type: 'campaign',
    status: 'active',
    date: '2024-06-05',
    endDate: '2024-06-30'
  },
  {
    id: 2,
    name: 'Premium Upsell',
    type: 'campaign',
    status: 'scheduled',
    date: '2024-06-10',
    endDate: '2024-06-25'
  },
  {
    id: 3,
    name: 'Summer Sale Launch',
    type: 'promotion',
    status: 'scheduled',
    date: '2024-06-15',
    endDate: '2024-08-31'
  }
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
    day: number;
  }> = [];
  
  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevMonthDay = new Date(currentYear, currentMonth, -i);
    calendarDays.push({
      date: prevMonthDay,
      isCurrentMonth: false,
      day: prevMonthDay.getDate()
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    calendarDays.push({
      date,
      isCurrentMonth: true,
      day
    });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonthDay = new Date(currentYear, currentMonth + 1, day);
    calendarDays.push({
      date: nextMonthDay,
      isCurrentMonth: false,
      day: nextMonthDay.getDate()
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1));
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockEvents.filter(event => {
      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Campaign Calendar</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => {
              analytics.buttonClicked('Month View', 'Calendar', {
                action: 'change_view_mode',
                view_mode: 'month',
                current_view: viewMode
              });
              setViewMode('month');
            }}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => {
              analytics.buttonClicked('Week View', 'Calendar', {
                action: 'change_view_mode',
                view_mode: 'week',
                current_view: viewMode
              });
              setViewMode('week');
            }}
          >
            Week
          </Button>
          <Link to="/campaigns/new">
            <Button
              onClick={() => {
                analytics.buttonClicked('New Campaign', 'Calendar', {
                  action: 'navigate_to_create',
                  destination: '/campaigns/new'
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  analytics.buttonClicked('Previous Month', 'Calendar', {
                    action: 'navigate_month',
                    direction: 'previous',
                    current_month: currentMonth,
                    current_year: currentYear
                  });
                  navigateMonth('prev');
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  analytics.buttonClicked('Today', 'Calendar', {
                    action: 'go_to_today',
                    current_month: currentMonth,
                    current_year: currentYear
                  });
                  setCurrentDate(new Date());
                }}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  analytics.buttonClicked('Next Month', 'Calendar', {
                    action: 'navigate_month',
                    direction: 'next',
                    current_month: currentMonth,
                    current_year: currentYear
                  });
                  navigateMonth('next');
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center font-medium text-gray-500 border-b">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((calendarDay, index) => {
              const events = getEventsForDate(calendarDay.date);
              const isToday = calendarDay.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border border-gray-200 
                    ${!calendarDay.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                    ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday ? 'text-blue-600' : ''}
                  `}>
                    {calendarDay.day}
                  </div>
                  
                  <div className="space-y-1">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`
                          text-xs p-1 rounded text-white truncate cursor-pointer
                          ${getStatusColor(event.status)}
                        `}
                        title={`${event.name} - ${event.status}`}
                      >
                        {event.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Active Campaigns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Scheduled Campaigns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Paused Campaigns</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
