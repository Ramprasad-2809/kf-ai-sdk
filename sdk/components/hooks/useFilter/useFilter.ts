import { useState, useCallback, useMemo, useEffect } from "react";
import type { Filter, LogicalOperator } from "../../../types/common";
import type {
  FilterConditionWithId,
  TypedFilterConditionInput,
  ValidationResult,
  ValidationError,
  FilterState,
  UseFilterOptions,
  UseFilterReturn,
} from "./types";

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
 * Helper to check if operator is a logical operator
 */
const isLogicalOperator = (operator: string): operator is LogicalOperator => {
  return operator === 'And' || operator === 'Or' || operator === 'Not';
};

/**
 * Validate a filter condition (supports both simple conditions and nested logical groups)
 */
const validateFilterCondition = (
  condition: Partial<FilterConditionWithId>
): ValidationResult => {
  const errors: string[] = [];

  // Check required fields
  if (!condition.operator) {
    errors.push('Operator is required');
  }

  // Check if this is a logical operator (nested group)
  if (condition.operator && isLogicalOperator(condition.operator)) {
    // Validate logical group
    if (!condition.children || !Array.isArray(condition.children)) {
      errors.push('Logical operators require a children array');
    } else if (condition.children.length === 0) {
      errors.push('Logical operators require at least one child condition');
    } else if (condition.operator === 'Not' && condition.children.length > 1) {
      errors.push('Not operator can only have one child condition');
    }

    // Recursively validate children
    if (condition.children && Array.isArray(condition.children)) {
      condition.children.forEach((child, index) => {
        const childValidation = validateFilterCondition(child);
        if (!childValidation.isValid) {
          errors.push(...childValidation.errors.map(err => `Child ${index + 1}: ${err}`));
        }
      });
    }

    // Logical operators should not have lhsField or rhsValue
    if (condition.lhsField) {
      errors.push('Logical operators should not have lhsField');
    }
    if (condition.rhsValue !== undefined) {
      errors.push('Logical operators should not have rhsValue');
    }
  } else {
    // Validate simple condition
    if (!condition.lhsField) {
      errors.push('Field is required for condition operators');
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

    // Simple conditions should not have children
    if (condition.children && condition.children.length > 0) {
      errors.push('Condition operators should not have children');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Convert a single FilterConditionWithId to API format (FilterCondition or FilterLogical)
 */
const convertConditionToAPI = (condition: FilterConditionWithId): any => {
  // Check if this is a logical operator (nested group)
  if (isLogicalOperator(condition.operator)) {
    // Build nested logical filter
    return {
      Operator: condition.operator,
      Condition: (condition.children || [])
        .filter(child => child.isValid)
        .map(child => convertConditionToAPI(child))
    };
  } else {
    // Build simple condition
    return {
      Operator: condition.operator,
      LHSField: condition.lhsField,
      RHSValue: condition.rhsValue,
      RHSType: condition.rhsType || "Constant"
    };
  }
};

/**
 * Convert filter state to SDK Filter format
 * Supports both flat and nested filter structures
 */
const buildFilterPayload = (
  conditions: FilterConditionWithId[],
  logicalOperator: LogicalOperator
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
    Condition: validConditions.map(c => convertConditionToAPI(c))
  };
};

// ============================================================
// MAIN HOOK
// ============================================================

export function useFilter<T = any>(
  options: UseFilterOptions = {}
): UseFilterReturn<T> {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [filterState, setFilterState] = useState<FilterState>({
    logicalOperator: options.initialLogicalOperator || "And",
    conditions: options.initialConditions || []
  });

  // Store initial state for reset functionality
  const [initialState] = useState<FilterState>({
    logicalOperator: options.initialLogicalOperator || "And",
    conditions: options.initialConditions || []
  });

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateCondition = useCallback((condition: Partial<FilterConditionWithId>): ValidationResult => {
    return validateFilterCondition(condition);
  }, []);

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

  const addCondition = useCallback((condition: TypedFilterConditionInput<T>): string => {
    const id = generateId();
    // Convert typed input to internal format (using unknown for type narrowing)
    const internalCondition = condition as unknown as Omit<FilterConditionWithId, 'id' | 'isValid'>;
    const validation = validateCondition(internalCondition);

    const newCondition: FilterConditionWithId = {
      ...internalCondition,
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

  const updateCondition = useCallback((id: string, updates: Partial<TypedFilterConditionInput<T>>): boolean => {
    let found = false;
    // Convert typed input to internal format (using unknown for type narrowing)
    const internalUpdates = updates as unknown as Partial<FilterConditionWithId>;

    setFilterState(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition => {
        if (condition.id === id) {
          found = true;
          const updatedCondition = { ...condition, ...internalUpdates };
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

  const setLogicalOperator = useCallback((operator: LogicalOperator) => {
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

  const replaceCondition = useCallback((id: string, newCondition: TypedFilterConditionInput<T>): boolean => {
    let found = false;
    // Convert typed input to internal format (using unknown for type narrowing)
    const internalCondition = newCondition as unknown as Omit<FilterConditionWithId, 'id' | 'isValid'>;

    setFilterState(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition => {
        if (condition.id === id) {
          found = true;
          const validation = validateCondition(internalCondition);
          return {
            ...internalCondition,
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
            field: condition.lhsField || '', // Empty string for logical operators
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
