import type {
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  FilterRHSTypeType,
} from "../../../types/common";

// Re-export from common types for convenience
export type {
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  FilterRHSTypeType,
};

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard to check if an item is a ConditionGroup (has nested Condition array)
 */
export const isConditionGroup = (
  item: ConditionType | ConditionGroupType
): item is ConditionGroupType => {
  return "Condition" in item;
};

/**
 * Type guard to check if an item is a leaf Condition (has LHSField)
 */
export const isCondition = (
  item: ConditionType | ConditionGroupType
): item is ConditionType => {
  return "LHSField" in item;
};

// ============================================================
// HOOK-SPECIFIC TYPE DEFINITIONS
// ============================================================

/**
 * Builder interface for fluent condition group construction
 */
export interface ConditionGroupBuilder {
  /** The id of the created group */
  readonly id: string;

  /** Add a condition to this group */
  addCondition(condition: Omit<ConditionType, "id">): ConditionGroupBuilder;

  /** Add a nested condition group */
  addConditionGroup(operator: ConditionGroupOperatorType): ConditionGroupBuilder;
}

/**
 * Filter state type (data only, for initialState)
 * @template T - Data type for type-safe field names (defaults to any)
 */
export interface FilterStateType<T = any> {
  /** Filter conditions */
  conditions?: Array<ConditionType<T> | ConditionGroupType<T>>;
  /** Operator for combining conditions */
  operator?: ConditionGroupOperatorType;
}

/**
 * Hook options (minimal configuration)
 * @template T - Data type for type-safe field names (defaults to any)
 */
export interface UseFilterOptionsType<T = any> {
  /** Initial filter conditions */
  initialConditions?: Array<ConditionType<T> | ConditionGroupType<T>>;
  /** Initial operator for combining conditions (defaults to "And") */
  initialOperator?: ConditionGroupOperatorType;
}

/**
 * Hook return interface with nested filter support
 * @template T - Data type for type-safe field names (defaults to any)
 */
export interface UseFilterReturnType<T = any> {
  // ============================================================
  // STATE (read-only)
  // ============================================================

  /** Current operator for combining root-level conditions ("And" | "Or" | "Not") */
  operator: ConditionGroupOperatorType;

  /** Current filter items (with id populated) */
  items: Array<ConditionType<T> | ConditionGroupType<T>>;

  /** Ready-to-use API payload (id stripped, undefined if no conditions) */
  payload: FilterType<T> | undefined;

  /** Whether any conditions exist */
  hasConditions: boolean;

  // ============================================================
  // ADD OPERATIONS (return id of created item)
  // ============================================================

  /**
   * Add a leaf condition at root level or to a specific parent group
   * @param condition - The condition to add (without id)
   * @param parentId - Optional id of the parent ConditionGroup. If omitted, adds at root level
   * @returns The id of the created condition
   */
  addCondition: (condition: Omit<ConditionType<T>, "id">, parentId?: string) => string;

  /**
   * Add a condition group at root level or to a specific parent group
   * @param operator - The operator for the new group ("And" | "Or" | "Not")
   * @param parentId - Optional id of the parent ConditionGroup. If omitted, adds at root level
   * @returns The id of the created group
   */
  addConditionGroup: (operator: ConditionGroupOperatorType, parentId?: string) => string;

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================

  /**
   * Update a leaf condition by id
   * @param id - The id of the condition to update
   * @param updates - Partial updates to apply
   */
  updateCondition: (id: string, updates: Partial<Omit<ConditionType<T>, "id">>) => void;

  /**
   * Update a condition group's operator by id
   * @param id - The id of the group to update
   * @param operator - The new operator
   */
  updateGroupOperator: (id: string, operator: ConditionGroupOperatorType) => void;

  // ============================================================
  // REMOVE & ACCESS
  // ============================================================

  /**
   * Remove a condition or group by id
   * @param id - The id of the item to remove
   */
  removeCondition: (id: string) => void;

  /**
   * Get a condition or group by id
   * @param id - The id to look up
   * @returns The item or undefined if not found
   */
  getCondition: (id: string) => ConditionType<T> | ConditionGroupType<T> | undefined;

  // ============================================================
  // UTILITY
  // ============================================================

  /** Clear all conditions */
  clearAllConditions: () => void;

  /** Set the root operator for combining conditions */
  setRootOperator: (op: ConditionGroupOperatorType) => void;
}
