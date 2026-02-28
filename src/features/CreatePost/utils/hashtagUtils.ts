/**
 * Extracts hashtags from a text string.
 * Returns an array of tags without the '#' prefix.
 */
export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex) || [];
  return matches
    .map(tag => tag.replace('#', '').trim())
    .filter(tag => tag.length > 0);
};

/**
 * Generates search keywords from a text string.
 * Normalises to lowercase, strips punctuation, and deduplicates.
 */
export const generateSearchKeywords = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/#/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);

  return [...new Set(words)];
};
