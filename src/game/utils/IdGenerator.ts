/**
 * Utility for generating unique IDs
 */

/**
 * Generates a unique random ID
 * @returns Random alphanumeric string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
