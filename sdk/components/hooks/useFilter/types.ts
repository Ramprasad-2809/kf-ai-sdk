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
 * Hook options (minimal configuration)
 */
export interface UseFilterOptionsType {
  /** Initial filter conditions */
  initialConditions?: Array<ConditionType | ConditionGroupType>;
  /** Initial operator for combining conditions (defaults to "And") */
  initialOperator?: ConditionGroupOperatorType;
}

/**
 * Hook return interface with nested filter support
 */
export interface UseFilterReturnType {
  // ============================================================
  // STATE (read-only)
  // ============================================================

  /** Current operator for combining root-level conditions ("And" | "Or" | "Not") */
  operator: ConditionGroupOperatorType;

  /** Current filter items (with id populated) */
  items: Array<ConditionType | ConditionGroupType>;

  /** Ready-to-use API payload (id stripped, undefined if no conditions) */
  payload: FilterType | undefined;

  /** Whether any conditions exist */
  hasConditions: boolean;

  // ============================================================
  // ADD OPERATIONS (return id of created item)
  // ============================================================

  /**
   * Add a leaf condition at root level
   * @returns The id of the created condition
   */
  add: (condition: Omit<ConditionType, "id">) => string;

  /**
   * Add a condition group at root level
   * @returns The id of the created group
   */
  addGroup: (operator: ConditionGroupOperatorType) => string;

  /**
   * Add a leaf condition to a specific parent group
   * @param parentId - The id of the parent ConditionGroup
   * @returns The id of the created condition
   */
  addTo: (parentId: string, condition: Omit<ConditionType, "id">) => string;

  /**
   * Add a condition group to a specific parent group
   * @param parentId - The id of the parent ConditionGroup
   * @returns The id of the created group
   */
  addGroupTo: (parentId: string, operator: ConditionGroupOperatorType) => string;

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================

  /**
   * Update a leaf condition by id
   * @param id - The id of the condition to update
   * @param updates - Partial updates to apply
   */
  update: (id: string, updates: Partial<Omit<ConditionType, "id">>) => void;

  /**
   * Update a condition group's operator by id
   * @param id - The id of the group to update
   * @param operator - The new operator
   */
  updateOperator: (id: string, operator: ConditionGroupOperatorType) => void;

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
  get: (id: string) => ConditionType | ConditionGroupType | undefined;

  // ============================================================
  // UTILITY
  // ============================================================

  /** Clear all conditions */
  clear: () => void;

  /** Set the root operator for combining conditions */
  setOperator: (op: ConditionGroupOperatorType) => void;
}
