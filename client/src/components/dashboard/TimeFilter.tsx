
import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TimeFilterState } from '@/types/dashboard';

interface TimeFilterProps {
  filters: TimeFilterState;
  onFiltersChange: (filters: TimeFilterState) => void;
}

const CHART_TYPES = [
  { value: 'line', label: 'Line chart' },
  { value: 'bar', label: 'Bar chart' },
  { value: 'area', label: 'Area chart' },
  { value: 'pie', label: 'Pie chart' }
];

const TIME_RANGES = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '60d', label: '60d' },
  { value: '90d', label: '90d' },
  { value: 'custom', label: 'Custom' }
];

const GRANULARITIES = [
  { value: 'realtime', label: 'Realtime' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
];

export function TimeFilter({ filters, onFiltersChange }: TimeFilterProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{from: Date | undefined; to: Date | undefined}>({
    from: filters.customDateRange?.from,
    to: filters.customDateRange?.to
  });

  const handleChartTypeChange = (value: string) => {
    onFiltersChange({ ...filters, chartType: value });
  };

  const handleTimeRangeChange = (value: string) => {
    onFiltersChange({ ...filters, timeRange: value });
  };

  const handleGranularityChange = (value: string) => {
    onFiltersChange({ ...filters, granularity: value });
  };

  const handleDateRangeSelect = (range: any) => {
    if (range && typeof range === 'object') {
      setDateRange(range);
      if (range.from && range.to) {
        onFiltersChange({
          ...filters,
          timeRange: 'custom',
          customDateRange: { from: range.from, to: range.to }
        });
        setIsDatePickerOpen(false);
      }
    }
  };

  const formatDateRange = () => {
    if (filters.timeRange === 'custom' && filters.customDateRange) {
      return `${format(filters.customDateRange.from, 'MMM d')} - ${format(filters.customDateRange.to, 'MMM d, yyyy')}`;
    }
    return TIME_RANGES.find(range => range.value === filters.timeRange)?.label || '30d';
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white border-b">
      {/* Chart Type Selector */}
      <Select value={filters.chartType} onValueChange={handleChartTypeChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CHART_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Granularity Selector */}
      <Select value={filters.granularity} onValueChange={handleGranularityChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRANULARITIES.map((granularity) => (
            <SelectItem key={granularity.value} value={granularity.value}>
              {granularity.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Time Range Buttons */}
      <div className="flex items-center gap-1">
        {TIME_RANGES.filter(range => range.value !== 'custom').map((range) => (
          <Button
            key={range.value}
            variant={filters.timeRange === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeRangeChange(range.value)}
            className="h-8 px-3"
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filters.timeRange === 'custom' ? "default" : "outline"}
            size="sm"
            className="h-8 px-3 gap-1"
          >
            <Calendar className="h-3 w-3" />
            {formatDateRange()}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Date Range</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeRangeChange('30d')}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeRangeChange('90d')}
                >
                  Last 90 days
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Custom Range</h4>
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDatePickerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (dateRange.from && dateRange.to) {
                    handleDateRangeSelect(dateRange);
                  }
                }}
                disabled={!dateRange.from || !dateRange.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Timezone Display */}
      <div className="ml-auto text-sm text-gray-500">
        (UTC+03:00)
      </div>
    </div>
  );
}
