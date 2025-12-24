import type { Filter, FilterOperator, FilterRHSType, LogicalOperator } from "../../../types/common";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Internal filter condition with ID for management
 * Supports both simple conditions and nested logical groups
 */
export interface FilterConditionWithId {
  /** Unique identifier for internal management */
  id: string;
  /** Filter operator (can be condition or logical operator) */
  operator: FilterOperator | LogicalOperator;
  /** Left-hand side field name (required for condition operators) */
  lhsField?: string;
  /** Right-hand side value (required for condition operators) */
  rhsValue?: any;
  /** Right-hand side type (defaults to Constant) */
  rhsType?: FilterRHSType;
  /** Nested conditions (for logical operators: And, Or, Not) */
  children?: FilterConditionWithId[];
  /** Validation state */
  isValid: boolean;
  /** Specific validation errors */
  validationErrors?: string[];
}

export interface FilterState {
  /** Logical operator for combining conditions */
  logicalOperator: LogicalOperator;
  /** Array of filter conditions with IDs */
  conditions: FilterConditionWithId[];
}

export interface FieldDefinition {
  /** Field data type */
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'select';
  /** Operators allowed for this field type */
  allowedOperators: FilterOperator[];
  /** Custom value validation function */
  validateValue?: (value: any, operator: FilterOperator) => ValidationResult;
  /** Value transformation function */
  transformValue?: (value: any) => any;
  /** Options for select fields */
  selectOptions?: Array<{ label: string; value: any }>;
}

export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of error messages */
  errors: string[];
}

export interface ValidationError {
  /** ID of the condition with errors */
  conditionId: string;
  /** Field name */
  field: string;
  /** Error message */
  message: string;
}

export interface UseFilterOptions<T = any> {
  /** Initial filter conditions */
  initialConditions?: FilterConditionWithId[];
  /** Initial logical operator */
  initialLogicalOperator?: LogicalOperator;
  /** Field definitions for validation */
  fieldDefinitions?: Record<keyof T, FieldDefinition>;
  /** Whether to validate conditions on change */
  validateOnChange?: boolean;
  /** Callback when condition is added */
  onConditionAdd?: (condition: FilterConditionWithId) => void;
  /** Callback when condition is updated */
  onConditionUpdate?: (condition: FilterConditionWithId) => void;
  /** Callback when condition is removed */
  onConditionRemove?: (conditionId: string) => void;
  /** Callback when validation errors occur */
  onValidationError?: (errors: ValidationError[]) => void;
}

export interface UseFilterReturn {
  // Current state
  /** Array of current filter conditions */
  conditions: FilterConditionWithId[];
  /** Current logical operator */
  logicalOperator: LogicalOperator;
  /** SDK-formatted filter payload for API calls */
  filterPayload: Filter | undefined;
  /** Overall validation state */
  isValid: boolean;
  /** Array of validation errors */
  validationErrors: ValidationError[];

  // Condition management
  /** Add a new filter condition */
  addCondition: (condition: Omit<FilterConditionWithId, 'id' | 'isValid'>) => string;
  /** Update an existing condition */
  updateCondition: (id: string, updates: Partial<FilterConditionWithId>) => boolean;
  /** Remove a condition by ID */
  removeCondition: (id: string) => boolean;
  /** Clear all conditions */
  clearConditions: () => void;
  /** Get a specific condition by ID */
  getCondition: (id: string) => FilterConditionWithId | undefined;

  // Logical operator management
  /** Set the root logical operator */
  setLogicalOperator: (operator: LogicalOperator) => void;

  // Bulk operations
  /** Replace all conditions */
  setConditions: (conditions: FilterConditionWithId[]) => void;
  /** Replace a specific condition */
  replaceCondition: (id: string, newCondition: Omit<FilterConditionWithId, 'id' | 'isValid'>) => boolean;

  // Validation
  /** Validate a single condition */
  validateCondition: (condition: Partial<FilterConditionWithId>) => ValidationResult;
  /** Validate all current conditions */
  validateAllConditions: () => ValidationResult;

  // State management
  /** Export current filter state */
  exportState: () => FilterState;
  /** Import a filter state */
  importState: (state: FilterState) => void;
  /** Reset to initial state */
  resetToInitial: () => void;

  // Utilities
  /** Get total number of conditions */
  getConditionCount: () => number;
  /** Whether any conditions exist */
  hasConditions: boolean;
  /** Whether more conditions can be added */
  canAddCondition: boolean;
}
