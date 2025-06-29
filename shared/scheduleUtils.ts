export function formatCronToHumanReadable(cronExpression: string, timezone?: string): string {
  try {
    const fields = cronExpression.split(' ');
    if (fields.length !== 5) {
      return 'Invalid schedule';
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

    // Handle common patterns
    if (cronExpression === '0 0 * * *') {
      return 'Daily at midnight';
    }
    if (cronExpression === '0 9 * * *') {
      return 'Daily at 9:00 AM';
    }
    if (cronExpression === '0 9 * * 1') {
      return 'Weekly on Monday at 9:00 AM';
    }
    if (cronExpression === '0 9 1 * *') {
      return 'Monthly on the 1st at 9:00 AM';
    }

    // Parse hour and minute
    let timeStr = '';
    if (hour !== '*' && minute !== '*') {
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      const displayMinute = minuteNum.toString().padStart(2, '0');
      timeStr = `at ${displayHour}:${displayMinute} ${ampm}`;
    }

    // Parse frequency
    if (dayOfMonth !== '*' && month !== '*') {
      return `Monthly on day ${dayOfMonth} ${timeStr}`;
    }
    
    if (dayOfWeek !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[parseInt(dayOfWeek)] || dayOfWeek;
      return `Weekly on ${dayName} ${timeStr}`;
    }
    
    if (hour !== '*' && minute !== '*') {
      return `Daily ${timeStr}`;
    }

    return cronExpression; // Fallback to raw cron
  } catch (error) {
    return cronExpression;
  }
}

export function getNextRunTime(cronExpression: string, timezone: string = 'UTC'): Date | null {
  try {
    // Simple next run calculation for common patterns
    const now = new Date();
    
    if (cronExpression === '0 9 * * *') {
      // Daily at 9 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }
    
    if (cronExpression === '0 9 * * 1') {
      // Weekly on Monday at 9 AM
      const nextMonday = new Date(now);
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday;
    }
    
    // Default to 24 hours from now
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } catch (error) {
    return null;
  }
}

export function formatDateTime(date: Date | string | null, timezone?: string): string {
  if (!date) return 'Not scheduled';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // If timezone is provided, format in that timezone
  if (timezone) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
        hour12: false
      }).format(dateObj);
    } catch (error) {
      console.error('Timezone formatting error:', error);
      // Fallback to manual timezone calculation
      return formatWithManualTimezone(dateObj, timezone);
    }
  }
  
  // Default formatting without timezone conversion
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatWithManualTimezone(date: Date, timezone: string): string {
  // Manual timezone calculation for Africa/Cairo (+2) and Asia/Kuwait (+3)
  let offsetHours = 0;
  if (timezone === 'Africa/Cairo') {
    offsetHours = 2;
  } else if (timezone === 'Asia/Kuwait') {
    offsetHours = 3;
  }
  
  const localTime = new Date(date.getTime() + (offsetHours * 60 * 60 * 1000));
  return localTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric', 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });
}