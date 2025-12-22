import type { Filter, FilterCondition, FilterLogical, LogicalOperator } from "../../../types/common";
import type { FilterConditionWithId, FilterState } from "../useFilter";

// ============================================================
// PAYLOAD BUILDING UTILITIES
// ============================================================

/**
 * Helper to check if operator is a logical operator
 */
const isLogicalOperator = (operator: string): operator is LogicalOperator => {
  return operator === 'And' || operator === 'Or' || operator === 'Not';
};

/**
 * Convert a single FilterConditionWithId to API format (FilterCondition or FilterLogical)
 */
const buildCondition = (condition: FilterConditionWithId): FilterCondition | FilterLogical => {
  // Check if this is a logical operator (nested group)
  if (isLogicalOperator(condition.operator)) {
    // Build nested logical filter
    return {
      Operator: condition.operator,
      Condition: (condition.children || [])
        .filter(child => child.isValid)
        .map(child => buildCondition(child))
    };
  } else {
    // Build simple condition
    return {
      Operator: condition.operator,
      LHSField: condition.lhsField!,
      RHSValue: condition.rhsValue,
      RHSType: condition.rhsType || "Constant"
    };
  }
};

/**
 * Build SDK Filter payload from filter state
 * Returns undefined if no valid conditions exist
 * Supports both flat and nested filter structures
 */
export const buildFilterPayload = (
  conditions: FilterConditionWithId[],
  logicalOperator: LogicalOperator
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
 * Validate that a filter payload is well-formed (supports nested filters)
 */
export const validateFilterPayload = (filter: Filter | undefined): boolean => {
  if (!filter) {
    return true; // undefined filter is valid (no filtering)
  }

  // Check operator
  if (!filter.Operator || !['And', 'Or', 'Not'].includes(filter.Operator)) {
    return false;
  }

  // Check conditions array
  if (!Array.isArray(filter.Condition) || filter.Condition.length === 0) {
    return false;
  }

  // Not operator can only have one child
  if (filter.Operator === 'Not' && filter.Condition.length !== 1) {
    return false;
  }

  // Validate each condition recursively
  return filter.Condition.every(condition => {
    if (!condition.Operator) {
      return false;
    }

    // Check if this is a logical operator (nested)
    if (isLogicalOperator(condition.Operator)) {
      // Recursively validate nested filter
      return validateFilterPayload(condition as FilterLogical);
    } else {
      // Validate simple condition
      const simpleCondition = condition as FilterCondition;
      return (
        simpleCondition.LHSField !== undefined &&
        simpleCondition.RHSValue !== undefined &&
        (simpleCondition.RHSType === undefined || ['Constant', 'BOField', 'AppVariable'].includes(simpleCondition.RHSType))
      );
    }
  });
};

/**
 * Deep clone a filter condition (supports nested filters)
 */
const cloneCondition = (condition: FilterCondition | FilterLogical): FilterCondition | FilterLogical => {
  if (isLogicalOperator(condition.Operator)) {
    // Clone logical filter recursively
    return {
      Operator: condition.Operator,
      Condition: (condition as FilterLogical).Condition.map(cloneCondition)
    };
  } else {
    // Clone simple condition
    const simpleCondition = condition as FilterCondition;
    return {
      Operator: simpleCondition.Operator,
      LHSField: simpleCondition.LHSField,
      RHSValue: simpleCondition.RHSValue,
      RHSType: simpleCondition.RHSType
    };
  }
};

/**
 * Deep clone a filter payload (supports nested filters)
 */
export const cloneFilterPayload = (filter: Filter | undefined): Filter | undefined => {
  if (!filter) {
    return undefined;
  }

  return {
    Operator: filter.Operator,
    Condition: filter.Condition.map(cloneCondition)
  };
};

/**
 * Merge multiple filter payloads with a logical operator
 */
export const mergeFilterPayloads = (
  filters: (Filter | undefined)[],
  operator: LogicalOperator
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
 * Convert filter condition to a human-readable string (supports nested filters)
 */
const conditionToString = (condition: FilterCondition | FilterLogical): string => {
  if (isLogicalOperator(condition.Operator)) {
    // Handle logical filter
    const logicalFilter = condition as FilterLogical;
    const childStrings = logicalFilter.Condition.map(conditionToString);

    if (childStrings.length === 1) {
      return condition.Operator === 'Not'
        ? `NOT (${childStrings[0]})`
        : childStrings[0];
    }

    return `(${childStrings.join(` ${condition.Operator} `)})`;
  } else {
    // Handle simple condition
    const simpleCondition = condition as FilterCondition;
    const rhsDisplay = Array.isArray(simpleCondition.RHSValue)
      ? `[${simpleCondition.RHSValue.join(', ')}]`
      : String(simpleCondition.RHSValue);

    return `${simpleCondition.LHSField} ${simpleCondition.Operator} ${rhsDisplay}`;
  }
};

/**
 * Convert filter payload to a human-readable string for debugging (supports nested filters)
 */
export const filterPayloadToString = (filter: Filter | undefined): string => {
  if (!filter) {
    return "No filters";
  }

  const conditionStrings = filter.Condition.map(conditionToString);

  if (conditionStrings.length === 1) {
    return conditionStrings[0];
  }

  return `(${conditionStrings.join(` ${filter.Operator} `)})`;
};

/**
 * Check if two conditions are equivalent (supports nested filters)
 */
const areConditionsEqual = (
  condition1: FilterCondition | FilterLogical,
  condition2: FilterCondition | FilterLogical
): boolean => {
  // Different operators
  if (condition1.Operator !== condition2.Operator) {
    return false;
  }

  // Check if logical operators
  if (isLogicalOperator(condition1.Operator)) {
    const logical1 = condition1 as FilterLogical;
    const logical2 = condition2 as FilterLogical;

    // Different number of children
    if (logical1.Condition.length !== logical2.Condition.length) {
      return false;
    }

    // Recursively compare all children
    return logical1.Condition.every((child1, index) =>
      areConditionsEqual(child1, logical2.Condition[index])
    );
  } else {
    // Compare simple conditions
    const simple1 = condition1 as FilterCondition;
    const simple2 = condition2 as FilterCondition;

    return (
      simple1.LHSField === simple2.LHSField &&
      JSON.stringify(simple1.RHSValue) === JSON.stringify(simple2.RHSValue) &&
      simple1.RHSType === simple2.RHSType
    );
  }
};

/**
 * Check if two filter payloads are equivalent (supports nested filters)
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

  // Compare each condition recursively
  return filter1.Condition.every((condition1, index) =>
    areConditionsEqual(condition1, filter2.Condition[index])
  );
};