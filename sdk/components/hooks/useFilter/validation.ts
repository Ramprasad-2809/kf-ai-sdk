import type { FilterOperator } from "../../../types/common";
import type { FieldDefinition, ValidationResult } from "../useFilter";

// ============================================================
// FIELD TYPE VALIDATION HELPERS
// ============================================================

/**
 * Validate number values based on operator
 */
export const validateNumberValue = (value: any, operator: FilterOperator): ValidationResult => {
  const errors: string[] = [];

  switch (operator) {
    case 'Between':
    case 'NotBetween':
      if (!Array.isArray(value) || value.length !== 2) {
        errors.push('Between operators require exactly two numeric values');
      } else {
        const [min, max] = value;
        if (typeof min !== 'number' || typeof max !== 'number') {
          errors.push('Between values must be numbers');
        } else if (min >= max) {
          errors.push('First value must be less than second value');
        }
      }
      break;
    case 'IN':
    case 'NIN':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push('IN/NIN operators require a non-empty array of numbers');
      } else if (!value.every((v: any) => typeof v === 'number')) {
        errors.push('All values in array must be numbers');
      }
      break;
    case 'Empty':
    case 'NotEmpty':
      // No validation needed for these operators
      break;
    default:
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push('Value must be a valid number');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate date values based on operator
 */
export const validateDateValue = (value: any, operator: FilterOperator): ValidationResult => {
  const errors: string[] = [];

  const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const parseDate = (val: any): Date | null => {
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') {
      const parsed = new Date(val);
      return isValidDate(parsed) ? parsed : null;
    }
    return null;
  };

  switch (operator) {
    case 'Between':
    case 'NotBetween':
      if (!Array.isArray(value) || value.length !== 2) {
        errors.push('Between operators require exactly two date values');
      } else {
        const [start, end] = value.map(parseDate);
        if (!start || !end) {
          errors.push('Between values must be valid dates');
        } else if (start >= end) {
          errors.push('Start date must be before end date');
        }
      }
      break;
    case 'IN':
    case 'NIN':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push('IN/NIN operators require a non-empty array of dates');
      } else if (!value.every((v: any) => parseDate(v))) {
        errors.push('All values in array must be valid dates');
      }
      break;
    case 'Empty':
    case 'NotEmpty':
      // No validation needed for these operators
      break;
    default:
      if (!parseDate(value)) {
        errors.push('Value must be a valid date');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate currency values based on operator
 */
export const validateCurrencyValue = (value: any, operator: FilterOperator): ValidationResult => {
  const errors: string[] = [];

  const isValidCurrencyObject = (val: any): boolean => {
    return val && 
           typeof val === 'object' &&
           typeof val.value === 'number' &&
           typeof val.currency === 'string' &&
           val.currency.length === 3; // Standard currency codes are 3 letters
  };

  const isValidCurrencyString = (val: any): boolean => {
    return typeof val === 'string' && /^\d+(\.\d{2})?\s[A-Z]{3}$/.test(val);
  };

  const isValidCurrency = (val: any): boolean => {
    return isValidCurrencyObject(val) || isValidCurrencyString(val) || typeof val === 'number';
  };

  switch (operator) {
    case 'Between':
    case 'NotBetween':
      if (!Array.isArray(value) || value.length !== 2) {
        errors.push('Between operators require exactly two currency values');
      } else if (!value.every(isValidCurrency)) {
        errors.push('Between values must be valid currency amounts');
      }
      break;
    case 'IN':
    case 'NIN':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push('IN/NIN operators require a non-empty array of currency values');
      } else if (!value.every(isValidCurrency)) {
        errors.push('All values in array must be valid currency amounts');
      }
      break;
    case 'Empty':
    case 'NotEmpty':
      // No validation needed for these operators
      break;
    default:
      if (!isValidCurrency(value)) {
        errors.push('Value must be a valid currency amount');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate string values based on operator
 */
export const validateStringValue = (value: any, operator: FilterOperator): ValidationResult => {
  const errors: string[] = [];

  switch (operator) {
    case 'Between':
    case 'NotBetween':
      errors.push('Between operators are not supported for string fields');
      break;
    case 'GT':
    case 'GTE':
    case 'LT':
    case 'LTE':
      errors.push('Comparison operators are not supported for string fields');
      break;
    case 'IN':
    case 'NIN':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push('IN/NIN operators require a non-empty array of strings');
      } else if (!value.every((v: any) => typeof v === 'string')) {
        errors.push('All values in array must be strings');
      }
      break;
    case 'MinLength':
      if (typeof value !== 'number' || value < 0) {
        errors.push('MinLength value must be a non-negative number');
      }
      break;
    case 'MaxLength':
      if (typeof value !== 'number' || value < 0) {
        errors.push('MaxLength value must be a non-negative number');
      }
      break;
    case 'Empty':
    case 'NotEmpty':
      // No validation needed for these operators
      break;
    default:
      if (typeof value !== 'string') {
        errors.push('Value must be a string');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate boolean values based on operator
 */
export const validateBooleanValue = (value: any, operator: FilterOperator): ValidationResult => {
  const errors: string[] = [];

  const supportedOperators: FilterOperator[] = ['EQ', 'NE', 'IN', 'NIN', 'Empty', 'NotEmpty'];

  if (!supportedOperators.includes(operator)) {
    errors.push(`Operator ${operator} is not supported for boolean fields`);
    return { isValid: false, errors };
  }

  switch (operator) {
    case 'IN':
    case 'NIN':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push('IN/NIN operators require a non-empty array of boolean values');
      } else if (!value.every((v: any) => typeof v === 'boolean')) {
        errors.push('All values in array must be boolean');
      }
      break;
    case 'Empty':
    case 'NotEmpty':
      // No validation needed for these operators
      break;
    default:
      if (typeof value !== 'boolean') {
        errors.push('Value must be a boolean (true or false)');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate select field values based on operator and available options
 */
export const validateSelectValue = (
  value: any, 
  operator: FilterOperator, 
  selectOptions?: Array<{ label: string; value: any }>
): ValidationResult => {
  const errors: string[] = [];

  if (!selectOptions || selectOptions.length === 0) {
    errors.push('No select options defined for this field');
    return { isValid: false, errors };
  }

  const validValues = selectOptions.map(option => option.value);
  const isValidOption = (val: any) => validValues.includes(val);

  switch (operator) {
    case 'Between':
    case 'NotBetween':
    case 'GT':
    case 'GTE':
    case 'LT':
    case 'LTE':
      errors.push(`Operator ${operator} is not supported for select fields`);
      break;
    case 'IN':
    case 'NIN':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push('IN/NIN operators require a non-empty array of values');
      } else if (!value.every(isValidOption)) {
        errors.push('All values must be from the available options');
      }
      break;
    case 'Empty':
    case 'NotEmpty':
      // No validation needed for these operators
      break;
    default:
      if (!isValidOption(value)) {
        errors.push('Value must be one of the available options');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================================
// FIELD DEFINITION HELPERS
// ============================================================

/**
 * Get default field definition based on field type
 */
export const getDefaultFieldDefinition = (fieldType: FieldDefinition['type']): FieldDefinition => {
  switch (fieldType) {
    case 'string':
      return {
        type: 'string',
        allowedOperators: ['EQ', 'NE', 'Contains', 'NotContains', 'IN', 'NIN', 'Empty', 'NotEmpty', 'MinLength', 'MaxLength'],
        validateValue: validateStringValue
      };
    
    case 'number':
      return {
        type: 'number',
        allowedOperators: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'Between', 'NotBetween', 'IN', 'NIN', 'Empty', 'NotEmpty'],
        validateValue: validateNumberValue
      };
    
    case 'date':
      return {
        type: 'date',
        allowedOperators: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'Between', 'NotBetween', 'IN', 'NIN', 'Empty', 'NotEmpty'],
        validateValue: validateDateValue
      };
    
    case 'boolean':
      return {
        type: 'boolean',
        allowedOperators: ['EQ', 'NE', 'IN', 'NIN', 'Empty', 'NotEmpty'],
        validateValue: validateBooleanValue
      };
    
    case 'currency':
      return {
        type: 'currency',
        allowedOperators: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'Between', 'NotBetween', 'IN', 'NIN', 'Empty', 'NotEmpty'],
        validateValue: validateCurrencyValue
      };
    
    case 'select':
      return {
        type: 'select',
        allowedOperators: ['EQ', 'NE', 'IN', 'NIN', 'Empty', 'NotEmpty'],
        validateValue: (value, operator, options) => validateSelectValue(value, operator, options?.selectOptions),
        selectOptions: []
      };
    
    default:
      // Default to string type
      return getDefaultFieldDefinition('string');
  }
};

/**
 * Create field definitions from sample data
 */
export const createFieldDefinitionsFromSample = <T>(sampleData: T): Record<keyof T, FieldDefinition> => {
  const fieldDefinitions = {} as Record<keyof T, FieldDefinition>;

  if (!sampleData || typeof sampleData !== 'object') {
    return fieldDefinitions;
  }

  Object.keys(sampleData).forEach(key => {
    const value = (sampleData as any)[key];
    const fieldKey = key as keyof T;

    if (typeof value === 'string') {
      fieldDefinitions[fieldKey] = getDefaultFieldDefinition('string');
    } else if (typeof value === 'number') {
      fieldDefinitions[fieldKey] = getDefaultFieldDefinition('number');
    } else if (typeof value === 'boolean') {
      fieldDefinitions[fieldKey] = getDefaultFieldDefinition('boolean');
    } else if (value instanceof Date) {
      fieldDefinitions[fieldKey] = getDefaultFieldDefinition('date');
    } else if (value && typeof value === 'object' && 'value' in value && 'currency' in value) {
      fieldDefinitions[fieldKey] = getDefaultFieldDefinition('currency');
    } else {
      // Default to string for complex types
      fieldDefinitions[fieldKey] = getDefaultFieldDefinition('string');
    }
  });

  return fieldDefinitions;
};