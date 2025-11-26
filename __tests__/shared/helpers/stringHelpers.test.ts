import {
  getUsernameForLogo,
  getRandomColors,
} from '../../../src/shared/helpers/common/stringHelpers';

describe('stringHelpers', () => {
  describe('getUsernameForLogo', () => {
    it('should return first letters of first and third word when 3+ words', () => {
      expect(getUsernameForLogo('John Michael Doe')).toBe('JD');
      expect(getUsernameForLogo('Alice Bob Charlie David')).toBe('AC');
    });

    it('should return first letters of first and second word when 2 words', () => {
      expect(getUsernameForLogo('John Doe')).toBe('JD');
      expect(getUsernameForLogo('Alice Smith')).toBe('AS');
    });

    it('should return first two letters when single word with 2+ chars', () => {
      expect(getUsernameForLogo('John')).toBe('Jo');
      expect(getUsernameForLogo('Alice')).toBe('Al');
    });

    it('should return single letter when single char word', () => {
      expect(getUsernameForLogo('J')).toBe('J');
    });

    it('should handle empty string', () => {
      expect(getUsernameForLogo('')).toBe('');
    });

    it('should handle names with extra spaces', () => {
      // Note: Current implementation splits by single space
      expect(getUsernameForLogo('John  Doe')).toBe('JD'); // Empty string becomes a part
    });
  });

  describe('getRandomColors', () => {
    it('should return a valid hex color string', () => {
      const color = getRandomColors();
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should return a color from the predefined colors array', () => {
      const validColors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFF00',
        '#FFA500',
        '#800080',
        '#FFC0CB',
        '#A52A2A',
        '#808080',
        '#000000',
        '#00FFFF',
        '#FF00FF',
        '#00FF7F',
        '#008080',
        '#000080',
        '#808000',
        '#800000',
        '#FF7F50',
        '#4B0082',
        '#EE82EE',
        '#FFD700',
        '#C0C0C0',
        '#CD7F32',
      ];

      // Run multiple times to ensure randomness returns valid colors
      for (let i = 0; i < 20; i++) {
        const color = getRandomColors();
        expect(validColors).toContain(color);
      }
    });
  });
});
