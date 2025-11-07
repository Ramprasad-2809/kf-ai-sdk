import type { 
  CurrencyValue, 
  JSONValue
} from '../types/base-fields';

/**
 * Field validation utilities for runtime type checking
 */

/**
 * Validate if a value is a valid ID field
 */
export function isValidIdField(value: any): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate if a value is a valid string field with optional length constraints
 */
export function isValidStringField(
  value: any, 
  minLength?: number, 
  maxLength?: number
): value is string {
  if (typeof value !== 'string') return false;
  
  if (minLength !== undefined && value.length < minLength) return false;
  if (maxLength !== undefined && value.length > maxLength) return false;
  
  return true;
}

/**
 * Validate if a value is a valid number field with optional precision
 */
export function isValidNumberField(
  value: any, 
  precision?: number
): value is number {
  if (typeof value !== 'number' || isNaN(value)) return false;
  
  if (precision !== undefined) {
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    return decimalPlaces <= precision;
  }
  
  return true;
}

/**
 * Validate if a value is a valid currency field
 */
export function isValidCurrencyField(value: any): value is CurrencyValue {
  if (typeof value === 'string') {
    // Simple string format validation (should contain number and currency)
    return /^\d+\.?\d*\s+[A-Z]{3}$|^[A-Z]{3}\s+\d+\.?\d*$/.test(value);
  }
  
  if (typeof value === 'object' && value !== null) {
    return typeof value.value === 'number' && 
           typeof value.currency === 'string' &&
           value.currency.length === 3;
  }
  
  return false;
}

/**
 * Validate if a value is valid JSON
 */
export function isValidJSONField(value: any): value is JSONValue {
  try {
    JSON.parse(JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a value matches one of the allowed select options
 */
export function isValidSelectField<T extends string>(
  value: any, 
  allowedValues: readonly T[]
): value is T {
  return typeof value === 'string' && allowedValues.includes(value as T);
}

/**
 * Validate if a value is a valid lookup field (reference ID)
 */
export function isValidLookupField(value: any): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate if a value is a valid array field
 */
export function isValidArrayField<T>(
  value: any, 
  itemValidator: (item: any) => item is T
): value is T[] {
  if (!Array.isArray(value)) return false;
  return value.every(item => itemValidator(item));
}

/**
 * Validate if a value is a valid date field
 */
export function isValidDateField(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Validate if a value is a valid boolean field
 */
export function isValidBooleanField(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Generic field validator that checks if a value matches the expected field type
 */
export function validateField<T>(
  value: any,
  fieldType: 'id' | 'string' | 'number' | 'boolean' | 'date' | 'currency' | 'json' | 'array',
  constraints?: {
    minLength?: number;
    maxLength?: number;
    precision?: number;
    allowedValues?: readonly string[];
    itemValidator?: (item: any) => item is any;
  }
): value is T {
  switch (fieldType) {
    case 'id':
      return isValidIdField(value);
    case 'string':
      return isValidStringField(value, constraints?.minLength, constraints?.maxLength);
    case 'number':
      return isValidNumberField(value, constraints?.precision);
    case 'boolean':
      return isValidBooleanField(value);
    case 'date':
      return isValidDateField(value);
    case 'currency':
      return isValidCurrencyField(value);
    case 'json':
      return isValidJSONField(value);
    case 'array':
      return constraints?.itemValidator 
        ? isValidArrayField(value, constraints.itemValidator)
        : Array.isArray(value);
    default:
      return false;
  }
}