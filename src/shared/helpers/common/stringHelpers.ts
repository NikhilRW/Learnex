import {colors} from '../../../constants/style';

export function getUsernameForLogo(username: string): string {
  const parts = username.split(' ');
  if (parts.length >= 3) {
    return parts[0][0] + parts[2][0];
  } else if (parts.length === 2) {
    return parts[0][0] + parts[1][0];
  } else if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0][0] + parts[0][1];
  } else {
    return parts[0][0] || '';
  }
}

export function getRandomColors(): string {
  return colors[Math.floor(Math.random() * colors.length)];
}
