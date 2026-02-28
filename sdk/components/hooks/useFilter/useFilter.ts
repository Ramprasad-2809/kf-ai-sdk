import { useState, useCallback, useMemo, useRef } from "react";
import type {
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
} from "../../../types/common";
import type { UseFilterOptionsType, UseFilterReturnType } from "./types";
import { isConditionGroup } from "./types";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate a unique ID for conditions and groups
 * Uses timestamp + random component + counter to prevent collisions
 */
const createGenerateId = (counterRef: { current: number }) => (): string => {
  const random = Math.random().toString(36).substring(2, 9);
  return `filter_${Date.now()}_${random}_${++counterRef.current}`;
};

/**
 * Ensure an item has an id
 */
const ensureId = <T extends ConditionType | ConditionGroupType>(item: T, generateId: () => string): T => {
  if (!item.id) {
    return { ...item, id: generateId() };
  }
  return item;
};

/**
 * Deep clone and ensure all items have ids
 */
const cloneWithIds = (
  items: Array<ConditionType | ConditionGroupType>,
  generateId: () => string
): Array<ConditionType | ConditionGroupType> => {
  return items.map((item) => {
    const withId = ensureId(item, generateId);
    if (isConditionGroup(withId)) {
      return {
        ...withId,
        Condition: cloneWithIds(withId.Condition, generateId),
      };
    }
    return withId;
  });
};

/**
 * Strip id fields from items for API payload
 */
const stripIds = (
  items: Array<ConditionType | ConditionGroupType>
): Array<ConditionType | ConditionGroupType> => {
  return items.map((item) => {
    if (isConditionGroup(item)) {
      const { id, ...rest } = item;
      return {
        ...rest,
        Condition: stripIds(item.Condition),
      } as ConditionGroupType;
    }
    const { id, ...rest } = item;
    return rest as ConditionType;
  });
};

/**
 * Find an item by id in a tree structure
 */
const findById = (
  items: Array<ConditionType | ConditionGroupType>,
  id: string
): ConditionType | ConditionGroupType | undefined => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (isConditionGroup(item)) {
      const found = findById(item.Condition, id);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * Update an item in the tree by id
 */
const updateInTree = (
  items: Array<ConditionType | ConditionGroupType>,
  id: string,
  updater: (item: ConditionType | ConditionGroupType) => ConditionType | ConditionGroupType
): Array<ConditionType | ConditionGroupType> => {
  return items.map((item) => {
    if (item.id === id) {
      return updater(item);
    }
    if (isConditionGroup(item)) {
      return {
        ...item,
        Condition: updateInTree(item.Condition, id, updater),
      };
    }
    return item;
  });
};

/**
 * Remove an item from the tree by id
 */
const removeFromTree = (
  items: Array<ConditionType | ConditionGroupType>,
  id: string
): Array<ConditionType | ConditionGroupType> => {
  return items
    .filter((item) => item.id !== id)
    .map((item) => {
      if (isConditionGroup(item)) {
        return {
          ...item,
          Condition: removeFromTree(item.Condition, id),
        };
      }
      return item;
    });
};

/**
 * Add an item to a specific parent in the tree
 */
const addToParent = (
  items: Array<ConditionType | ConditionGroupType>,
  parentId: string,
  newItem: ConditionType | ConditionGroupType
): Array<ConditionType | ConditionGroupType> => {
  return items.map((item) => {
    if (item.id === parentId && isConditionGroup(item)) {
      return {
        ...item,
        Condition: [...item.Condition, newItem],
      };
    }
    if (isConditionGroup(item)) {
      return {
        ...item,
        Condition: addToParent(item.Condition, parentId, newItem),
      };
    }
    return item;
  });
};

// ============================================================
// USE FILTER HOOK - Nested Filter Support
// ============================================================

export function useFilter<T = any>(options: UseFilterOptionsType<T> = {}): UseFilterReturnType<T> {
  // Instance-scoped ID counter (avoids module-level mutable state for SSR safety)
  const idCounterRef = useRef(0);
  const generateId = useMemo(() => createGenerateId(idCounterRef), []);

  // Initialize items with ids
  const [items, setItems] = useState<Array<ConditionType<T> | ConditionGroupType<T>>>(() =>
    cloneWithIds(options.conditions || [], generateId) as Array<ConditionType<T> | ConditionGroupType<T>>
  );

  const [operator, setOperatorState] = useState<ConditionGroupOperatorType>(
    options.rootOperator || "And"
  );

  // Build payload for API (strip ids)
  const payload = useMemo((): FilterType<T> | undefined => {
    if (items.length === 0) return undefined;
    return {
      Operator: operator,
      Condition: stripIds(items) as Array<ConditionType<T> | ConditionGroupType<T>>,
    };
  }, [items, operator]);

  const hasConditions = items.length > 0;

  // ============================================================
  // ADD OPERATIONS
  // ============================================================

  const addCondition = useCallback(
    (condition: Omit<ConditionType<T>, "id">, parentId?: string): string => {
      const id = generateId();
      const newCondition = { ...condition, id } as ConditionType<T>;
      if (parentId) {
        setItems((prev) => addToParent(prev, parentId, newCondition) as Array<ConditionType<T> | ConditionGroupType<T>>);
      } else {
        setItems((prev) => [...prev, newCondition]);
      }
      return id;
    },
    []
  );

  const addConditionGroup = useCallback(
    (groupOperator: ConditionGroupOperatorType, parentId?: string): string => {
      const id = generateId();
      const newGroup: ConditionGroupType<T> = {
        id,
        Operator: groupOperator,
        Condition: [],
      };
      if (parentId) {
        setItems((prev) => addToParent(prev, parentId, newGroup) as Array<ConditionType<T> | ConditionGroupType<T>>);
      } else {
        setItems((prev) => [...prev, newGroup]);
      }
      return id;
    },
    []
  );

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================

  const updateCondition = useCallback(
    (id: string, updates: Partial<Omit<ConditionType<T>, "id">>): void => {
      setItems((prev) =>
        updateInTree(prev, id, (item) => {
          if (!isConditionGroup(item)) {
            return { ...item, ...updates };
          }
          return item;
        }) as Array<ConditionType<T> | ConditionGroupType<T>>
      );
    },
    []
  );

  const updateGroupOperator = useCallback(
    (id: string, newOperator: ConditionGroupOperatorType): void => {
      setItems((prev) =>
        updateInTree(prev, id, (item) => {
          if (isConditionGroup(item)) {
            return { ...item, Operator: newOperator };
          }
          return item;
        }) as Array<ConditionType<T> | ConditionGroupType<T>>
      );
    },
    []
  );

  // ============================================================
  // REMOVE & ACCESS
  // ============================================================

  const removeCondition = useCallback((id: string): void => {
    setItems((prev) => removeFromTree(prev, id) as Array<ConditionType<T> | ConditionGroupType<T>>);
  }, []);

  const getCondition = useCallback(
    (id: string): ConditionType<T> | ConditionGroupType<T> | undefined => {
      return findById(items, id) as ConditionType<T> | ConditionGroupType<T> | undefined;
    },
    [items]
  );

  // ============================================================
  // UTILITY
  // ============================================================

  const clearAllConditions = useCallback((): void => {
    setItems([]);
  }, []);

  const setRootOperator = useCallback((op: ConditionGroupOperatorType): void => {
    setOperatorState(op);
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    // State
    operator,
    items,
    payload,
    hasConditions,

    // Add operations
    addCondition,
    addConditionGroup,

    // Update operations
    updateCondition,
    updateGroupOperator,

    // Remove & access
    removeCondition,
    getCondition,

    // Utility
    clearAllConditions,
    setRootOperator,
  };
}
