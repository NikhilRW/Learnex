import {generateRoomCode} from '../../../src/shared/helpers/common/roomCodeGenerator';

describe('roomCodeGenerator', () => {
  describe('generateRoomCode', () => {
    it('should generate a code in format XXXX-XXXX', () => {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should generate codes with exactly 9 characters (including hyphen)', () => {
      const code = generateRoomCode();
      expect(code.length).toBe(9);
    });

    it('should only contain uppercase letters and numbers', () => {
      const code = generateRoomCode();
      const validChars = /^[A-Z0-9-]+$/;
      expect(code).toMatch(validChars);
    });

    it('should have hyphen at position 4 (5th character)', () => {
      const code = generateRoomCode();
      expect(code[4]).toBe('-');
    });

    it('should generate unique codes (statistical check)', () => {
      const codes = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        codes.add(generateRoomCode());
      }

      // With 36^8 possible combinations, collisions should be extremely rare
      // Allow for at most 1 collision in 100 iterations
      expect(codes.size).toBeGreaterThanOrEqual(iterations - 1);
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = generateRoomCode();
      const code2 = generateRoomCode();
      const code3 = generateRoomCode();

      // While theoretically possible to get same codes, probability is ~1 in 2.8 trillion
      // This is a sanity check
      const uniqueCodes = new Set([code1, code2, code3]);
      expect(uniqueCodes.size).toBeGreaterThanOrEqual(2);
    });
  });
});
