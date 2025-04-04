import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

/**
 * A utility function for conditionally joining class names.
 * Combines clsx for handling conditionals and twMerge to properly merge Tailwind classes.
 *
 * @param inputs Class values to be conditionally joined
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
