/**
 * Type guard to check if a value is a plain object (Record).
 * Validates at runtime that:
 * - The value is of type 'object'
 * - It's not null (since typeof null === 'object')
 * - It's not an array
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely get a string value from a record.
 */
export function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Safely get a boolean value from a record.
 */
export function getBoolean(obj: Record<string, unknown>, key: string): boolean | undefined {
  const value = obj[key];
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Safely get an array value from a record.
 */
export function getArray(obj: Record<string, unknown>, key: string): unknown[] | undefined {
  const value = obj[key];
  return Array.isArray(value) ? value : undefined;
}

/**
 * Safely get a nested record value from a record.
 */
export function getRecord(
  obj: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = obj[key];
  return isRecord(value) ? value : undefined;
}
