/** Currency value format - supports both object and string representations */
type CurrencyValueType =
  | { value: number; currency: string }
  | string;

/** Valid JSON value types */
type JSONValueType =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValueType }
  | JSONValueType[];

/**
 * Data formatting utilities for display and conversion
 */

/**
 * Format currency value for display
 */
export function formatCurrency(value: CurrencyValueType): string {
  if (typeof value === 'string') {
    return value; // Already formatted
  }
  
  if (typeof value === 'object' && value !== null) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: value.currency,
    });
    return formatter.format(value.value);
  }
  
  return 'Invalid Currency';
}

/**
 * Parse currency string to currency object
 */
export function parseCurrency(value: string): CurrencyValueType | null {
  // Try to parse "USD 100.50" or "100.50 USD" format
  const match = value.match(/^(?:([A-Z]{3})\s+(\d+\.?\d*))|(?:(\d+\.?\d*)\s+([A-Z]{3}))$/);
  
  if (match) {
    const currency = match[1] || match[4];
    const amount = parseFloat(match[2] || match[3]);
    
    if (!isNaN(amount)) {
      return { value: amount, currency };
    }
  }
  
  return null;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    short: { dateStyle: 'short' as const },
    medium: { dateStyle: 'medium' as const },
    long: { dateStyle: 'long' as const },
  }[format];
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    short: { dateStyle: 'short' as const, timeStyle: 'short' as const },
    medium: { dateStyle: 'medium' as const, timeStyle: 'medium' as const },
    long: { dateStyle: 'long' as const, timeStyle: 'long' as const },
  }[format];
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format number with precision
 */
export function formatNumber(value: number, precision: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Invalid Number';
  }
  
  return value.toFixed(precision);
}

/**
 * Format JSON value for display
 */
export function formatJSON(value: JSONValueType, indent: number = 2): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    return 'Invalid JSON';
  }
}

/**
 * Format array values for display
 */
export function formatArray<T>(
  array: T[], 
  formatter?: (item: T) => string,
  separator: string = ', '
): string {
  if (!Array.isArray(array)) {
    return 'Invalid Array';
  }
  
  if (formatter) {
    return array.map(formatter).join(separator);
  }
  
  return array.map(item => String(item)).join(separator);
}

/**
 * Format boolean for display
 */
export function formatBoolean(value: boolean, options?: {
  trueLabel?: string;
  falseLabel?: string;
}): string {
  if (typeof value !== 'boolean') {
    return 'Invalid Boolean';
  }
  
  return value 
    ? (options?.trueLabel || 'Yes')
    : (options?.falseLabel || 'No');
}

/**
 * Truncate string with ellipsis
 */
export function truncateString(value: string, maxLength: number = 50): string {
  if (typeof value !== 'string') {
    return 'Invalid String';
  }
  
  if (value.length <= maxLength) {
    return value;
  }
  
  return value.slice(0, maxLength - 3) + '...';
}

/**
 * Format text area content for display (handle line breaks)
 */
export function formatTextArea(value: string, maxLines?: number): string {
  if (typeof value !== 'string') {
    return 'Invalid Text';
  }
  
  const lines = value.split('\n');
  
  if (maxLines && lines.length > maxLines) {
    return lines.slice(0, maxLines).join('\n') + '\n...';
  }
  
  return value;
}

/**
 * Generic formatter that automatically detects field type and formats accordingly
 */
export function formatFieldValue(
  value: any,
  fieldType?: 'id' | 'string' | 'textarea' | 'number' | 'boolean' | 'date' | 'datetime' | 'currency' | 'json' | 'array'
): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Auto-detect type if not provided
  if (!fieldType) {
    if (typeof value === 'boolean') fieldType = 'boolean';
    else if (typeof value === 'number') fieldType = 'number';
    else if (value instanceof Date) fieldType = 'datetime';
    else if (Array.isArray(value)) fieldType = 'array';
    else if (typeof value === 'object') fieldType = 'json';
    else fieldType = 'string';
  }
  
  switch (fieldType) {
    case 'id':
    case 'string':
      return String(value);
    case 'textarea':
      return formatTextArea(String(value));
    case 'number':
      return formatNumber(value);
    case 'boolean':
      return formatBoolean(value);
    case 'date':
      return formatDate(value);
    case 'datetime':
      return formatDateTime(value);
    case 'currency':
      return formatCurrency(value);
    case 'json':
      return formatJSON(value);
    case 'array':
      return formatArray(value);
    default:
      return String(value);
  }
}