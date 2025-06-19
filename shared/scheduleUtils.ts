const cronParser = require('cron-parser');

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
    const interval = cronParser.parseExpression(cronExpression, { tz: timezone });
    return interval.next().toDate();
  } catch (error) {
    return null;
  }
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return 'Not scheduled';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}