// Main hook export
export { useFilter } from "./useFilter";

// Type exports
export type {
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  FilterRHSType,
  UseFilterOptionsType,
  UseFilterReturnType,
} from "./types";

// Type guard exports
export {
  isCondition,
  isConditionGroup,
} from "./types";
