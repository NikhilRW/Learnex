import {AVATAR_COLORS} from '../constants/common';
import {AvatarInfo} from '../types';

/**
 * Generate consistent avatar color based on user ID
 * @param id - User ID
 * @returns Hex color code
 */
export const getAvatarColor = (id: string): string => {
  const charSum = id
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[charSum % AVATAR_COLORS.length];
};

/**
 * Extract initials from a name
 * @param name - Full name
 * @returns User initials (1-2 characters)
 */
export const getInitials = (name: string): string => {
  const nameParts = name.split(' ');
  const firstInitial = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() : '';
  const lastInitial =
    nameParts.length > 1
      ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
      : '';
  return lastInitial ? `${firstInitial}${lastInitial}` : firstInitial;
};

/**
 * Determine avatar text color based on background color
 * @param backgroundColor - Background color hex code
 * @returns Text color (black or white)
 */
export const getAvatarTextColor = (backgroundColor: string): string => {
  // Extract hue from color (simple approach based on color code)
  const colorCode = parseInt(backgroundColor.replace('#', ''), 16);
  const avatarHue = colorCode % 360;
  return avatarHue > 30 && avatarHue < 190 ? '#202124' : '#ffffff';
};

/**
 * Get complete avatar information for a user
 * @param id - User ID
 * @param name - User name
 * @returns Avatar info with initials, color, and text color
 */
export const getAvatarInfo = (id: string, name: string): AvatarInfo => {
  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(id);
  const textColor = getAvatarTextColor(backgroundColor);

  return {
    initials,
    backgroundColor,
    textColor,
  };
};
