/**
 * Generates a unique room code for meetings
 * Format: XXXX-XXXX where X is alphanumeric
 * @returns string
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 4;
  const segments = 2;

  const generateSegment = () => {
    let segment = '';
    for (let i = 0; i < length; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return segment;
  };

  const code = Array(segments)
    .fill(null)
    .map(() => generateSegment())
    .join('-');

  return code;
}
