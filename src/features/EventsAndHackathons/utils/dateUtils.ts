import {format, parseISO, isAfter, isWithinInterval} from 'date-fns';

/**
 * Event status type
 */
export interface EventStatus {
  type: 'upcoming' | 'live' | 'ended';
  text: string;
}

/**
 * Format a date for display
 * @param dateString ISO date string
 * @returns Formatted date
 */
export const formatDate = (dateString: string): string => {
  try {
    // Some date strings might already be formatted or invalid
    if (!dateString || dateString === 'Invalid Date') {
      return 'TBA';
    }

    // If it's already formatted like "25 May 2023", return as is
    if (/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(dateString)) {
      return dateString;
    }

    const date = parseISO(dateString);
    if (isNaN(date.getTime())) {
      return 'TBA';
    }

    return format(date, 'dd MMM yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'TBA';
  }
};

/**
 * Get event status based on start and end dates
 * @param startDate Event start date
 * @param endDate Event end date
 * @returns Status object with type and text
 */
export const getEventStatus = (
  startDate: string,
  endDate: string,
): EventStatus => {
  try {
    const now = new Date();
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {type: 'upcoming', text: 'Dates TBA'};
    }

    // Check if event has ended
    if (isAfter(now, end)) {
      return {type: 'ended', text: 'Ended'};
    }

    // Check if event is live
    if (isWithinInterval(now, {start, end})) {
      const hoursLeft = Math.round(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60),
      );
      if (hoursLeft < 24) {
        return {type: 'live', text: `Live • ${hoursLeft}h left`};
      }
      const daysLeft = Math.round(hoursLeft / 24);
      return {type: 'live', text: `Live • ${daysLeft}d left`};
    }

    // Event is upcoming
    const daysToStart = Math.round(
      (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysToStart <= 7) {
      if (daysToStart === 0) {
        const hoursToStart = Math.round(
          (start.getTime() - now.getTime()) / (1000 * 60 * 60),
        );
        return {type: 'upcoming', text: `Starts in ${hoursToStart}h`};
      }
      if (daysToStart === 1) {
        return {type: 'upcoming', text: 'Starts tomorrow'};
      }
      return {type: 'upcoming', text: `Starts in ${daysToStart} days`};
    }

    return {type: 'upcoming', text: formatDate(startDate)};
  } catch (error) {
    console.error('Error calculating event status:', error);
    return {type: 'upcoming', text: formatDate(startDate)};
  }
};

/**
 * Get source string from event source
 * @param source Event source (string or enum)
 * @returns Normalized source string
 */
export const getSourceString = (source: string | number): string => {
  if (typeof source === 'string') {
    return source.toLowerCase();
  }
  // Assuming EventSource enum: HACKEREARTH = 0, DEVFOLIO = 1
  return source === 0 ? 'hackerearth' : 'devfolio';
};

/**
 * Get background color based on source
 * @param source Source string
 * @returns Background color
 */
export const getSourceBackgroundColor = (source: string): string => {
  return source === 'hackerearth' ? '#3176B9' : '#6C4AA0';
};
