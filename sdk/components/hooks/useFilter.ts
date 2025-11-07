import { useState, useCallback, useMemo, useEffect } from "react";
import type { Filter, FilterOperator, FilterRHSType } from "../../types/common";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface FilterConditionWithId {
  /** Unique identifier for internal management */
  id: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Left-hand side field name */
  lhsField: string;
  /** Right-hand side value */
  rhsValue: any;
  /** Right-hand side type (defaults to Constant) */
  rhsType?: FilterRHSType;
  /** Validation state */
  isValid: boolean;
  /** Specific validation errors */
  validationErrors?: string[];
}

export interface FilterState {
  /** Logical operator for combining conditions */
  logicalOperator: "AND" | "OR";
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
  initialLogicalOperator?: "AND" | "OR";
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
  logicalOperator: "AND" | "OR";
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
  setLogicalOperator: (operator: "AND" | "OR") => void;
  
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

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Generate a unique ID for conditions
 */
const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Validate a filter condition
 */
const validateFilterCondition = <T>(
  condition: Partial<FilterConditionWithId>,
  fieldDefinitions?: Record<keyof T, FieldDefinition>
): ValidationResult => {
  const errors: string[] = [];

  // Check required fields
  if (!condition.operator) {
    errors.push('Operator is required');
  }
  if (!condition.lhsField) {
    errors.push('Field is required');
  }

  // Validate operator-specific requirements
  if (condition.operator && condition.rhsValue !== undefined) {
    switch (condition.operator) {
      case 'Between':
      case 'NotBetween':
        if (!Array.isArray(condition.rhsValue) || condition.rhsValue.length !== 2) {
          errors.push('Between operators require an array of two values');
        }
        break;
      case 'IN':
      case 'NIN':
        if (!Array.isArray(condition.rhsValue) || condition.rhsValue.length === 0) {
          errors.push('IN/NIN operators require a non-empty array');
        }
        break;
      case 'Empty':
      case 'NotEmpty':
        // These operators don't need RHS values
        break;
      default:
        if (condition.rhsValue === null || condition.rhsValue === undefined || condition.rhsValue === '') {
          errors.push('Value is required for this operator');
        }
        break;
    }
  }

  // Field-specific validation
  if (fieldDefinitions && condition.lhsField && condition.operator) {
    const fieldDef = fieldDefinitions[condition.lhsField as keyof T];
    if (fieldDef) {
      // Check if operator is allowed for this field
      if (!fieldDef.allowedOperators.includes(condition.operator)) {
        errors.push(`Operator ${condition.operator} is not allowed for field ${condition.lhsField}`);
      }
      
      // Custom field validation
      if (fieldDef.validateValue && condition.rhsValue !== undefined) {
        const fieldValidation = fieldDef.validateValue(condition.rhsValue, condition.operator);
        if (!fieldValidation.isValid) {
          errors.push(...fieldValidation.errors);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Convert filter state to SDK Filter format
 */
const buildFilterPayload = (
  conditions: FilterConditionWithId[],
  logicalOperator: "AND" | "OR"
): Filter | undefined => {
  if (conditions.length === 0) {
    return undefined;
  }

  const validConditions = conditions.filter(c => c.isValid);
  if (validConditions.length === 0) {
    return undefined;
  }

  return {
    Operator: logicalOperator,
    Condition: validConditions.map(c => ({
      Operator: c.operator,
      LHSField: c.lhsField,
      RHSValue: c.rhsValue,
      RHSType: c.rhsType || "Constant"
    }))
  };
};

// ============================================================
// MAIN HOOK
// ============================================================

export function useFilter<T = any>(
  options: UseFilterOptions<T> = {}
): UseFilterReturn {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [filterState, setFilterState] = useState<FilterState>({
    logicalOperator: options.initialLogicalOperator || "AND",
    conditions: options.initialConditions || []
  });

  // Store initial state for reset functionality
  const [initialState] = useState<FilterState>({
    logicalOperator: options.initialLogicalOperator || "AND",
    conditions: options.initialConditions || []
  });

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateCondition = useCallback((condition: Partial<FilterConditionWithId>): ValidationResult => {
    return validateFilterCondition(condition, options.fieldDefinitions);
  }, [options.fieldDefinitions]);

  const validateAllConditions = useCallback((): ValidationResult => {
    const allErrors: string[] = [];
    
    filterState.conditions.forEach(condition => {
      const validation = validateCondition(condition);
      if (!validation.isValid) {
        allErrors.push(...validation.errors.map(err => `Condition ${condition.id}: ${err}`));
      }
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }, [filterState.conditions, validateCondition]);

  // ============================================================
  // CONDITION MANAGEMENT
  // ============================================================

  const addCondition = useCallback((condition: Omit<FilterConditionWithId, 'id' | 'isValid'>): string => {
    const id = generateId();
    const validation = validateCondition(condition);
    
    const newCondition: FilterConditionWithId = {
      ...condition,
      id,
      isValid: validation.isValid,
      validationErrors: validation.errors
    };

    setFilterState(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));

    if (options.onConditionAdd) {
      options.onConditionAdd(newCondition);
    }

    return id;
  }, [validateCondition, options]);

  const updateCondition = useCallback((id: string, updates: Partial<FilterConditionWithId>): boolean => {
    let found = false;
    
    setFilterState(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition => {
        if (condition.id === id) {
          found = true;
          const updatedCondition = { ...condition, ...updates };
          const validation = validateCondition(updatedCondition);
          
          const finalCondition = {
            ...updatedCondition,
            isValid: validation.isValid,
            validationErrors: validation.errors
          };

          if (options.onConditionUpdate) {
            options.onConditionUpdate(finalCondition);
          }

          return finalCondition;
        }
        return condition;
      })
    }));

    return found;
  }, [validateCondition, options]);

  const removeCondition = useCallback((id: string): boolean => {
    let found = false;
    
    setFilterState(prev => ({
      ...prev,
      conditions: prev.conditions.filter(condition => {
        if (condition.id === id) {
          found = true;
          if (options.onConditionRemove) {
            options.onConditionRemove(id);
          }
          return false;
        }
        return true;
      })
    }));

    return found;
  }, [options]);

  const clearConditions = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      conditions: []
    }));
  }, []);

  const getCondition = useCallback((id: string): FilterConditionWithId | undefined => {
    return filterState.conditions.find(condition => condition.id === id);
  }, [filterState.conditions]);

  // ============================================================
  // LOGICAL OPERATOR MANAGEMENT
  // ============================================================

  const setLogicalOperator = useCallback((operator: "AND" | "OR") => {
    setFilterState(prev => ({
      ...prev,
      logicalOperator: operator
    }));
  }, []);

  // ============================================================
  // BULK OPERATIONS
  // ============================================================

  const setConditions = useCallback((conditions: FilterConditionWithId[]) => {
    const validatedConditions = conditions.map(condition => {
      const validation = validateCondition(condition);
      return {
        ...condition,
        isValid: validation.isValid,
        validationErrors: validation.errors
      };
    });

    setFilterState(prev => ({
      ...prev,
      conditions: validatedConditions
    }));
  }, [validateCondition]);

  const replaceCondition = useCallback((id: string, newCondition: Omit<FilterConditionWithId, 'id' | 'isValid'>): boolean => {
    let found = false;
    
    setFilterState(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition => {
        if (condition.id === id) {
          found = true;
          const validation = validateCondition(newCondition);
          return {
            ...newCondition,
            id,
            isValid: validation.isValid,
            validationErrors: validation.errors
          };
        }
        return condition;
      })
    }));

    return found;
  }, [validateCondition]);

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const exportState = useCallback((): FilterState => ({
    logicalOperator: filterState.logicalOperator,
    conditions: filterState.conditions.map(condition => ({ ...condition })) // Deep copy
  }), [filterState]);

  const importState = useCallback((state: FilterState) => {
    const validatedConditions = state.conditions.map(condition => {
      const validation = validateCondition(condition);
      return {
        ...condition,
        isValid: validation.isValid,
        validationErrors: validation.errors
      };
    });

    setFilterState({
      logicalOperator: state.logicalOperator,
      conditions: validatedConditions
    });
  }, [validateCondition]);

  const resetToInitial = useCallback(() => {
    setFilterState({ ...initialState });
  }, [initialState]);

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const filterPayload = useMemo(() => 
    buildFilterPayload(filterState.conditions, filterState.logicalOperator),
    [filterState.conditions, filterState.logicalOperator]
  );

  const validationErrors = useMemo((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    filterState.conditions.forEach(condition => {
      if (!condition.isValid && condition.validationErrors) {
        condition.validationErrors.forEach(error => {
          errors.push({
            conditionId: condition.id,
            field: condition.lhsField,
            message: error
          });
        });
      }
    });

    return errors;
  }, [filterState.conditions]);

  const isValid = useMemo(() => 
    filterState.conditions.every(condition => condition.isValid),
    [filterState.conditions]
  );

  const getConditionCount = useCallback(() => filterState.conditions.length, [filterState.conditions]);
  const hasConditions = useMemo(() => filterState.conditions.length > 0, [filterState.conditions]);
  const canAddCondition = useMemo(() => true, []); // Can always add more conditions

  // ============================================================
  // VALIDATION ERROR CALLBACK
  // ============================================================

  useEffect(() => {
    if (options.onValidationError && validationErrors.length > 0) {
      options.onValidationError(validationErrors);
    }
  }, [validationErrors, options]);

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  return {
    // Current state
    conditions: filterState.conditions,
    logicalOperator: filterState.logicalOperator,
    filterPayload,
    isValid,
    validationErrors,
    
    // Condition management
    addCondition,
    updateCondition,
    removeCondition,
    clearConditions,
    getCondition,
    
    // Logical operator management
    setLogicalOperator,
    
    // Bulk operations
    setConditions,
    replaceCondition,
    
    // Validation
    validateCondition,
    validateAllConditions,
    
    // State management
    exportState,
    importState,
    resetToInitial,
    
    // Utilities
    getConditionCount,
    hasConditions,
    canAddCondition
  };
}