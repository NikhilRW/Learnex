import {PRIORITY_COLORS} from '../constants/common';

/**
 * Gets the color associated with a task priority level
 * @param priority - The priority level (high, medium, low)
 * @returns The hex color code for the priority
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return PRIORITY_COLORS.high;
    case 'medium':
      return PRIORITY_COLORS.medium;
    case 'low':
      return PRIORITY_COLORS.low;
    default:
      return PRIORITY_COLORS.default;
  }
};
