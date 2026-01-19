// Main hook export
export { useFilter } from "./useFilter";

// Type exports (new names)
export type {
  Condition,
  ConditionGroup,
  ConditionGroupOperator,
  Filter,
  FilterRHSType,
  UseFilterOptions,
  UseFilterReturn,
  // Legacy type exports
  FilterCondition,
  FilterOperator,
} from "./types";

// Type guard exports
export {
  isCondition,
  isConditionGroup,
  // Legacy type guard exports
  isFilterCondition,
  isFilterLogical,
} from "./types";
