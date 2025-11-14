// ============================================================
// EXPRESSION TREE VALIDATOR
// ============================================================
// Evaluates backend expression trees for form validation

import type { 
  ExpressionTree, 
  EvaluationContext, 
  ValidationResult 
} from './types';

// ============================================================
// SYSTEM VALUES
// ============================================================

/**
 * Get current system values for expression evaluation
 */
function getSystemValues(): Record<string, any> {
  const now = new Date();
  
  return {
    NOW: now,
    TODAY: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    CURRENT_USER: {
      // These would typically come from auth context
      EmpId: 1,
      Email: 'user@example.com',
      FirstName: 'John',
      LastName: 'Doe',
      Role: 'User'
    },
    CURRENT_USER_ID: 1
  };
}

// ============================================================
// EXPRESSION FUNCTIONS
// ============================================================

/**
 * Built-in functions for expression evaluation
 */
const FUNCTIONS = {
  // String functions
  CONCAT: (...args: any[]) => args.map(arg => String(arg || '')).join(''),
  TRIM: (str: string) => String(str || '').trim(),
  LENGTH: (str: string) => String(str || '').length,
  UPPER: (str: string) => String(str || '').toUpperCase(),
  LOWER: (str: string) => String(str || '').toLowerCase(),
  SUBSTRING: (str: string, start: number, length?: number) => {
    const s = String(str || '');
    return length !== undefined ? s.substring(start, start + length) : s.substring(start);
  },
  CONTAINS: (str: string, search: string) => {
    return String(str || '').includes(String(search || ''));
  },

  // Date functions
  YEAR: (date: Date) => new Date(date).getFullYear(),
  MONTH: (date: Date) => new Date(date).getMonth() + 1, // 1-based
  DAY: (date: Date) => new Date(date).getDate(),
  DATE_DIFF: (date1: Date, date2: Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  ADD_DAYS: (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  ADD_MONTHS: (date: Date, months: number) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  // Math functions
  SUM: (...args: number[]) => args.reduce((sum, val) => sum + (Number(val) || 0), 0),
  AVG: (...args: number[]) => {
    const nums = args.filter(val => !isNaN(Number(val)));
    return nums.length > 0 ? nums.reduce((sum, val) => sum + Number(val), 0) / nums.length : 0;
  },
  MIN: (...args: number[]) => Math.min(...args.map(val => Number(val) || 0)),
  MAX: (...args: number[]) => Math.max(...args.map(val => Number(val) || 0)),
  ROUND: (num: number) => Math.round(Number(num) || 0),
  FLOOR: (num: number) => Math.floor(Number(num) || 0),
  CEIL: (num: number) => Math.ceil(Number(num) || 0),
  ABS: (num: number) => Math.abs(Number(num) || 0),

  // Conditional functions
  IF: (condition: any, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,

  // Validation functions
  IS_NULL: (value: any) => value === null || value === undefined,
  IS_EMPTY: (value: string) => !value || String(value).trim() === '',
  IS_NUMBER: (value: any) => !isNaN(Number(value)) && value !== '' && value !== null && value !== undefined,
  IS_DATE: (value: any) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  // System functions
  AUTO_NUMBER: () => Math.floor(Math.random() * 10000) + 1000, // Mock implementation
  UUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }),

  // Array functions
  ARRAY_LENGTH: (arr: any[]) => Array.isArray(arr) ? arr.length : 0,
  ARRAY_CONTAINS: (arr: any[], value: any) => Array.isArray(arr) ? arr.includes(value) : false,
  ARRAY_JOIN: (arr: any[], separator: string = ',') => Array.isArray(arr) ? arr.join(separator) : ''
};

// ============================================================
// EXPRESSION EVALUATOR
// ============================================================

/**
 * Evaluate an expression tree node
 */
function evaluateNode(node: ExpressionTree, context: EvaluationContext): any {
  switch (node.Type) {
    case 'Literal':
      return node.Value;

    case 'SystemIdentifier':
      if (node.Property) {
        const systemValue = context.systemValues[node.Name!];
        return getNestedValue(systemValue, node.Property.Name);
      }
      return context.systemValues[node.Name!];

    case 'Identifier':
      if (node.Property) {
        const value = getIdentifierValue(node, context);
        return getNestedValue(value, node.Property.Name);
      }
      return getIdentifierValue(node, context);

    case 'MemberExpression':
      if (!node.Arguments || node.Arguments.length === 0) {
        throw new Error('MemberExpression requires Arguments array');
      }
      
      const object = evaluateNode(node.Arguments[0], context);
      const propertyName = node.Arguments[0].Property?.Name;
      
      if (propertyName) {
        return getNestedValue(object, propertyName);
      }
      return object;

    case 'BinaryExpression':
      if (!node.Arguments || node.Arguments.length !== 2) {
        throw new Error('BinaryExpression requires exactly 2 arguments');
      }
      
      const left = evaluateNode(node.Arguments[0], context);
      const right = evaluateNode(node.Arguments[1], context);
      
      return evaluateBinaryOperation(node.Operator!, left, right);

    case 'LogicalExpression':
      if (!node.Arguments || node.Arguments.length < 2) {
        throw new Error('LogicalExpression requires at least 2 arguments');
      }
      
      return evaluateLogicalOperation(node.Operator!, node.Arguments, context);

    case 'CallExpression':
      if (!node.Callee) {
        throw new Error('CallExpression requires Callee');
      }
      
      const func = FUNCTIONS[node.Callee as keyof typeof FUNCTIONS];
      if (!func) {
        throw new Error(`Unknown function: ${node.Callee}`);
      }
      
      const args = (node.Arguments || []).map(arg => evaluateNode(arg, context));
      return (func as any)(...args);

    case 'AssignmentExpression':
      if (!node.Arguments || node.Arguments.length !== 1) {
        throw new Error('AssignmentExpression requires exactly 1 argument');
      }
      
      return evaluateNode(node.Arguments[0], context);

    default:
      throw new Error(`Unknown expression type: ${node.Type}`);
  }
}

/**
 * Get value from identifier based on source
 */
function getIdentifierValue(node: ExpressionTree, context: EvaluationContext): any {
  const { Name, Source } = node;
  
  if (!Name) {
    throw new Error('Identifier requires Name');
  }

  switch (Source) {
    case 'Input':
    default:
      // Default to form values for field references
      return context.formValues[Name];
  }
}

/**
 * Get nested property value
 */
function getNestedValue(obj: any, propertyPath: string): any {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  return obj[propertyPath];
}

/**
 * Evaluate binary operation
 */
function evaluateBinaryOperation(operator: string, left: any, right: any): any {
  switch (operator) {
    case '==':
      return left == right;
    case '!=':
      return left != right;
    case '>':
      return Number(left) > Number(right);
    case '<':
      return Number(left) < Number(right);
    case '>=':
      return Number(left) >= Number(right);
    case '<=':
      return Number(left) <= Number(right);
    case '+':
      return Number(left) + Number(right);
    case '-':
      return Number(left) - Number(right);
    case '*':
      return Number(left) * Number(right);
    case '/':
      return Number(left) / Number(right);
    default:
      throw new Error(`Unknown binary operator: ${operator}`);
  }
}

/**
 * Evaluate logical operation
 */
function evaluateLogicalOperation(operator: string, args: ExpressionTree[], context: EvaluationContext): boolean {
  switch (operator) {
    case 'AND':
      return args.every(arg => Boolean(evaluateNode(arg, context)));
    case 'OR':
      return args.some(arg => Boolean(evaluateNode(arg, context)));
    default:
      throw new Error(`Unknown logical operator: ${operator}`);
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Evaluate a complete expression tree
 */
export function evaluateExpression(
  expressionTree: ExpressionTree,
  formValues: Record<string, any>,
  referenceData: Record<string, any> = {}
): any {
  const context: EvaluationContext = {
    formValues,
    systemValues: getSystemValues(),
    referenceData
  };
  
  try {
    return evaluateNode(expressionTree, context);
  } catch (error) {
    console.warn('Expression evaluation failed:', error);
    return false; // Default to false for validation expressions
  }
}

/**
 * Validate a field using backend validation rules
 */
export function validateField(
  fieldName: string,
  fieldValue: any,
  validationRules: Array<{ Id: string; Condition: { ExpressionTree: ExpressionTree }; Message: string }>,
  formValues: Record<string, any>,
  referenceData: Record<string, any> = {}
): ValidationResult {
  // If no validation rules, field is valid
  if (!validationRules || validationRules.length === 0) {
    return { isValid: true };
  }

  // Set current field value in form values
  const currentFormValues = { ...formValues, [fieldName]: fieldValue };

  // Check each validation rule
  for (const rule of validationRules) {
    try {
      const isValid = evaluateExpression(
        rule.Condition.ExpressionTree,
        currentFormValues,
        referenceData
      );

      if (!isValid) {
        return {
          isValid: false,
          message: rule.Message,
          fieldName
        };
      }
    } catch (error) {
      console.warn(`Validation rule ${rule.Id} failed to evaluate:`, error);
      // Continue with other rules if one fails
    }
  }

  return { isValid: true };
}

/**
 * Validate all cross-field validation rules
 */
export function validateCrossField(
  validationRules: Array<{ Id: string; Condition: { ExpressionTree: ExpressionTree }; Message: string }>,
  formValues: Record<string, any>,
  referenceData: Record<string, any> = {}
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const rule of validationRules) {
    try {
      const isValid = evaluateExpression(
        rule.Condition.ExpressionTree,
        formValues,
        referenceData
      );

      if (!isValid) {
        results.push({
          isValid: false,
          message: rule.Message,
          fieldName: rule.Id
        });
      }
    } catch (error) {
      console.warn(`Cross-field validation rule ${rule.Id} failed:`, error);
    }
  }

  return results;
}

/**
 * Calculate computed field value
 */
export function calculateComputedValue(
  expressionTree: ExpressionTree,
  formValues: Record<string, any>,
  referenceData: Record<string, any> = {}
): any {
  try {
    return evaluateExpression(expressionTree, formValues, referenceData);
  } catch (error) {
    console.warn('Computed field calculation failed:', error);
    return null;
  }
}

/**
 * Calculate default field value
 */
export function calculateDefaultValue(
  expressionTree: ExpressionTree,
  formValues: Record<string, any> = {},
  referenceData: Record<string, any> = {}
): any {
  try {
    return evaluateExpression(expressionTree, formValues, referenceData);
  } catch (error) {
    console.warn('Default value calculation failed:', error);
    return null;
  }
}