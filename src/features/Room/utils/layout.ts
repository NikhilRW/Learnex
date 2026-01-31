import {LayoutConfig} from '../types/object';

/**
 * Calculate grid layout configuration for participants
 * @param participantsCount - Total number of participants
 * @param screenSharingId - ID of participant who is screen sharing (if any)
 * @param pinnedId - ID of pinned participant (if any)
 * @param screenHeight - Available screen height
 * @returns Layout configuration with columns and item height
 */
export const calculateGridLayout = (
  participantsCount: number,
  screenSharingId: string | null,
  pinnedId: string | null,
  screenHeight: number,
): LayoutConfig => {
  let numColumns = 1;
  let itemHeight = screenHeight * 0.8;

  if (screenSharingId) {
    // Screen sharing participant gets full view
    numColumns = 1;
    itemHeight = screenHeight * 0.7;
  } else if (pinnedId && participantsCount > 1) {
    // Pinned participant gets larger view
    numColumns = 1;
    itemHeight = screenHeight * 0.7;
  } else if (participantsCount >= 4) {
    // 4+ participants: 2 column grid
    numColumns = 2;
    const numRows = Math.ceil(participantsCount / 2);
    itemHeight = (screenHeight / numRows) * 0.85;
    itemHeight = Math.max(itemHeight, screenHeight * 0.25);
  } else {
    // 1-3 participants: single column
    numColumns = 1;
    if (participantsCount === 1) {
      itemHeight = screenHeight * 0.8;
    } else if (participantsCount === 2) {
      itemHeight = screenHeight * 0.4;
    } else if (participantsCount === 3) {
      itemHeight = screenHeight * 0.3;
    }
  }

  return {
    numColumns,
    itemHeight,
  };
};

/**
 * Calculate layout for unpinned participants when one is pinned
 * @param unpinnedCount - Number of unpinned participants
 * @param screenHeight - Available screen height
 * @returns Layout configuration for unpinned participants
 */
export const calculateUnpinnedLayout = (
  unpinnedCount: number,
  screenHeight: number,
): LayoutConfig => {
  const numColumns = Math.min(unpinnedCount, 3); // Max 3 columns for unpinned
  const itemHeight =
    (screenHeight * 0.3) / Math.ceil(unpinnedCount / numColumns);

  return {
    numColumns,
    itemHeight,
  };
};
