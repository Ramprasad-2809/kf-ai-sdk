import type { Filter } from "../../../types/common";
import type { FilterConditionWithId, FilterState } from "../useFilter";

// ============================================================
// PAYLOAD BUILDING UTILITIES
// ============================================================

/**
 * Convert a single filter condition to SDK FilterCondition format
 */
const buildCondition = (condition: FilterConditionWithId) => ({
  Operator: condition.operator,
  LHSField: condition.lhsField,
  RHSValue: condition.rhsValue,
  RHSType: condition.rhsType || "Constant"
});

/**
 * Build SDK Filter payload from filter state
 * Returns undefined if no valid conditions exist
 */
export const buildFilterPayload = (
  conditions: FilterConditionWithId[],
  logicalOperator: "AND" | "OR"
): Filter | undefined => {
  // Return undefined if no conditions
  if (conditions.length === 0) {
    return undefined;
  }

  // Filter out invalid conditions
  const validConditions = conditions.filter(condition => condition.isValid);
  
  // Return undefined if no valid conditions
  if (validConditions.length === 0) {
    return undefined;
  }

  // Build the filter payload
  return {
    Operator: logicalOperator,
    Condition: validConditions.map(buildCondition)
  };
};

/**
 * Build filter payload from complete filter state
 */
export const buildFilterPayloadFromState = (state: FilterState): Filter | undefined => {
  return buildFilterPayload(state.conditions, state.logicalOperator);
};

/**
 * Validate that a filter payload is well-formed
 */
export const validateFilterPayload = (filter: Filter | undefined): boolean => {
  if (!filter) {
    return true; // undefined filter is valid (no filtering)
  }

  // Check operator
  if (!filter.Operator || !['AND', 'OR'].includes(filter.Operator)) {
    return false;
  }

  // Check conditions array
  if (!Array.isArray(filter.Condition) || filter.Condition.length === 0) {
    return false;
  }

  // Validate each condition
  return filter.Condition.every(condition => 
    condition.Operator &&
    condition.LHSField &&
    condition.RHSValue !== undefined &&
    (condition.RHSType === undefined || ['Constant', 'BOField', 'AppVariable'].includes(condition.RHSType))
  );
};

/**
 * Deep clone a filter payload
 */
export const cloneFilterPayload = (filter: Filter | undefined): Filter | undefined => {
  if (!filter) {
    return undefined;
  }

  return {
    Operator: filter.Operator,
    Condition: filter.Condition.map(condition => ({
      Operator: condition.Operator,
      LHSField: condition.LHSField,
      RHSValue: condition.RHSValue,
      RHSType: condition.RHSType
    }))
  };
};

/**
 * Merge multiple filter payloads with a logical operator
 */
export const mergeFilterPayloads = (
  filters: (Filter | undefined)[],
  operator: "AND" | "OR"
): Filter | undefined => {
  const validFilters = filters.filter((filter): filter is Filter => 
    filter !== undefined && validateFilterPayload(filter)
  );

  if (validFilters.length === 0) {
    return undefined;
  }

  if (validFilters.length === 1) {
    return cloneFilterPayload(validFilters[0]);
  }

  // Flatten all conditions
  const allConditions = validFilters.flatMap(filter => filter.Condition);

  return {
    Operator: operator,
    Condition: allConditions
  };
};

/**
 * Convert filter payload to a human-readable string for debugging
 */
export const filterPayloadToString = (filter: Filter | undefined): string => {
  if (!filter) {
    return "No filters";
  }

  const conditionStrings = filter.Condition.map(condition => {
    const rhsDisplay = Array.isArray(condition.RHSValue) 
      ? `[${condition.RHSValue.join(', ')}]`
      : String(condition.RHSValue);
    
    return `${condition.LHSField} ${condition.Operator} ${rhsDisplay}`;
  });

  if (conditionStrings.length === 1) {
    return conditionStrings[0];
  }

  return `(${conditionStrings.join(` ${filter.Operator} `)})`;
};

/**
 * Check if two filter payloads are equivalent
 */
export const areFilterPayloadsEqual = (
  filter1: Filter | undefined,
  filter2: Filter | undefined
): boolean => {
  // Both undefined
  if (!filter1 && !filter2) {
    return true;
  }

  // One undefined, one defined
  if (!filter1 || !filter2) {
    return false;
  }

  // Different operators
  if (filter1.Operator !== filter2.Operator) {
    return false;
  }

  // Different number of conditions
  if (filter1.Condition.length !== filter2.Condition.length) {
    return false;
  }

  // Sort conditions by field name for comparison (to handle order differences)
  const sortConditions = (conditions: any[]) => 
    [...conditions].sort((a, b) => a.LHSField.localeCompare(b.LHSField));

  const conditions1 = sortConditions(filter1.Condition);
  const conditions2 = sortConditions(filter2.Condition);

  // Compare each condition
  return conditions1.every((condition1, index) => {
    const condition2 = conditions2[index];
    return (
      condition1.Operator === condition2.Operator &&
      condition1.LHSField === condition2.LHSField &&
      JSON.stringify(condition1.RHSValue) === JSON.stringify(condition2.RHSValue) &&
      condition1.RHSType === condition2.RHSType
    );
  });
};