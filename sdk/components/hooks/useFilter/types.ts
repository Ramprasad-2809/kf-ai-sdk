import type {
  Condition,
  ConditionGroup,
  ConditionGroupOperator,
  Filter,
  FilterRHSType,
  // Legacy types for backwards compatibility
  FilterCondition,
  FilterOperator,
} from "../../../types/common";

// Re-export from common types for convenience
export type {
  Condition,
  ConditionGroup,
  ConditionGroupOperator,
  Filter,
  FilterRHSType,
  // Legacy re-exports
  FilterCondition,
  FilterOperator,
};

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard to check if an item is a ConditionGroup (has nested Condition array)
 */
export const isConditionGroup = (
  item: Condition | ConditionGroup
): item is ConditionGroup => {
  return "Condition" in item;
};

/**
 * Type guard to check if an item is a leaf Condition (has LHSField)
 */
export const isCondition = (
  item: Condition | ConditionGroup
): item is Condition => {
  return "LHSField" in item;
};

// ============================================================
// LEGACY TYPE GUARDS (for backwards compatibility)
// ============================================================

/**
 * @deprecated Use `isConditionGroup` instead
 */
export const isFilterLogical = isConditionGroup;

/**
 * @deprecated Use `isCondition` instead
 */
export const isFilterCondition = isCondition;

// ============================================================
// HOOK-SPECIFIC TYPE DEFINITIONS
// ============================================================

/**
 * Hook options (minimal configuration)
 */
export interface UseFilterOptions {
  /** Initial filter conditions */
  initialConditions?: Array<Condition | ConditionGroup>;
  /** Initial operator for combining conditions (defaults to "And") */
  initialOperator?: ConditionGroupOperator;
}

/**
 * Hook return interface with nested filter support
 */
export interface UseFilterReturn {
  // ============================================================
  // STATE (read-only)
  // ============================================================

  /** Current operator for combining root-level conditions ("And" | "Or" | "Not") */
  operator: ConditionGroupOperator;

  /** Current filter items (with id populated) */
  items: Array<Condition | ConditionGroup>;

  /** Ready-to-use API payload (id stripped, undefined if no conditions) */
  payload: Filter | undefined;

  /** Whether any conditions exist */
  hasConditions: boolean;

  // ============================================================
  // ADD OPERATIONS (return id of created item)
  // ============================================================

  /**
   * Add a leaf condition at root level
   * @returns The id of the created condition
   */
  add: (condition: Omit<Condition, "id">) => string;

  /**
   * Add a condition group at root level
   * @returns The id of the created group
   */
  addGroup: (operator: ConditionGroupOperator) => string;

  /**
   * Add a leaf condition to a specific parent group
   * @param parentId - The id of the parent ConditionGroup
   * @returns The id of the created condition
   */
  addTo: (parentId: string, condition: Omit<Condition, "id">) => string;

  /**
   * Add a condition group to a specific parent group
   * @param parentId - The id of the parent ConditionGroup
   * @returns The id of the created group
   */
  addGroupTo: (parentId: string, operator: ConditionGroupOperator) => string;

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================

  /**
   * Update a leaf condition by id
   * @param id - The id of the condition to update
   * @param updates - Partial updates to apply
   */
  update: (id: string, updates: Partial<Omit<Condition, "id">>) => void;

  /**
   * Update a condition group's operator by id
   * @param id - The id of the group to update
   * @param operator - The new operator
   */
  updateOperator: (id: string, operator: ConditionGroupOperator) => void;

  // ============================================================
  // REMOVE & ACCESS
  // ============================================================

  /**
   * Remove a condition or group by id
   * @param id - The id of the item to remove
   */
  remove: (id: string) => void;

  /**
   * Get a condition or group by id
   * @param id - The id to look up
   * @returns The item or undefined if not found
   */
  get: (id: string) => Condition | ConditionGroup | undefined;

  // ============================================================
  // UTILITY
  // ============================================================

  /** Clear all conditions */
  clear: () => void;

  /** Set the root operator for combining conditions */
  setOperator: (op: ConditionGroupOperator) => void;

  // ============================================================
  // LEGACY API (for backwards compatibility)
  // ============================================================

  /**
   * @deprecated Use `items` instead
   */
  conditions: Array<Condition | ConditionGroup>;
}
