import { useState, useCallback, useMemo } from "react";
import type {
  Condition,
  ConditionGroup,
  ConditionGroupOperator,
  Filter,
} from "../../../types/common";
import type { UseFilterOptions, UseFilterReturn } from "./types";
import { isConditionGroup } from "./types";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

let idCounter = 0;

/**
 * Generate a unique ID for conditions and groups
 */
const generateId = (): string => {
  return `filter_${Date.now()}_${++idCounter}`;
};

/**
 * Ensure an item has an id
 */
const ensureId = <T extends Condition | ConditionGroup>(item: T): T => {
  if (!item.id) {
    return { ...item, id: generateId() };
  }
  return item;
};

/**
 * Deep clone and ensure all items have ids
 */
const cloneWithIds = (
  items: Array<Condition | ConditionGroup>
): Array<Condition | ConditionGroup> => {
  return items.map((item) => {
    const withId = ensureId(item);
    if (isConditionGroup(withId)) {
      return {
        ...withId,
        Condition: cloneWithIds(withId.Condition),
      };
    }
    return withId;
  });
};

/**
 * Strip id fields from items for API payload
 */
const stripIds = (
  items: Array<Condition | ConditionGroup>
): Array<Condition | ConditionGroup> => {
  return items.map((item) => {
    if (isConditionGroup(item)) {
      const { id, ...rest } = item;
      return {
        ...rest,
        Condition: stripIds(item.Condition),
      } as ConditionGroup;
    }
    const { id, ...rest } = item;
    return rest as Condition;
  });
};

/**
 * Find an item by id in a tree structure
 */
const findById = (
  items: Array<Condition | ConditionGroup>,
  id: string
): Condition | ConditionGroup | undefined => {
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
 * Find a parent group by child id
 */
const findParentById = (
  items: Array<Condition | ConditionGroup>,
  childId: string,
  parent: ConditionGroup | null = null
): ConditionGroup | null => {
  for (const item of items) {
    if (item.id === childId) {
      return parent;
    }
    if (isConditionGroup(item)) {
      const found = findParentById(item.Condition, childId, item);
      if (found !== null) return found;
    }
  }
  return null;
};

/**
 * Update an item in the tree by id
 */
const updateInTree = (
  items: Array<Condition | ConditionGroup>,
  id: string,
  updater: (item: Condition | ConditionGroup) => Condition | ConditionGroup
): Array<Condition | ConditionGroup> => {
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
  items: Array<Condition | ConditionGroup>,
  id: string
): Array<Condition | ConditionGroup> => {
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
  items: Array<Condition | ConditionGroup>,
  parentId: string,
  newItem: Condition | ConditionGroup
): Array<Condition | ConditionGroup> => {
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

export function useFilter(options: UseFilterOptions = {}): UseFilterReturn {
  // Initialize items with ids
  const [items, setItems] = useState<Array<Condition | ConditionGroup>>(() =>
    cloneWithIds(options.initialConditions || [])
  );

  const [operator, setOperatorState] = useState<ConditionGroupOperator>(
    options.initialOperator || "And"
  );

  // Build payload for API (strip ids)
  const payload = useMemo((): Filter | undefined => {
    if (items.length === 0) return undefined;
    return {
      Operator: operator,
      Condition: stripIds(items),
    };
  }, [items, operator]);

  const hasConditions = items.length > 0;

  // ============================================================
  // ADD OPERATIONS
  // ============================================================

  const add = useCallback((condition: Omit<Condition, "id">): string => {
    const id = generateId();
    const newCondition: Condition = { ...condition, id };
    setItems((prev) => [...prev, newCondition]);
    return id;
  }, []);

  const addGroup = useCallback((groupOperator: ConditionGroupOperator): string => {
    const id = generateId();
    const newGroup: ConditionGroup = {
      id,
      Operator: groupOperator,
      Condition: [],
    };
    setItems((prev) => [...prev, newGroup]);
    return id;
  }, []);

  const addTo = useCallback(
    (parentId: string, condition: Omit<Condition, "id">): string => {
      const id = generateId();
      const newCondition: Condition = { ...condition, id };
      setItems((prev) => addToParent(prev, parentId, newCondition));
      return id;
    },
    []
  );

  const addGroupTo = useCallback(
    (parentId: string, groupOperator: ConditionGroupOperator): string => {
      const id = generateId();
      const newGroup: ConditionGroup = {
        id,
        Operator: groupOperator,
        Condition: [],
      };
      setItems((prev) => addToParent(prev, parentId, newGroup));
      return id;
    },
    []
  );

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================

  const update = useCallback(
    (id: string, updates: Partial<Omit<Condition, "id">>): void => {
      setItems((prev) =>
        updateInTree(prev, id, (item) => {
          if (!isConditionGroup(item)) {
            return { ...item, ...updates };
          }
          return item;
        })
      );
    },
    []
  );

  const updateOperator = useCallback(
    (id: string, newOperator: ConditionGroupOperator): void => {
      setItems((prev) =>
        updateInTree(prev, id, (item) => {
          if (isConditionGroup(item)) {
            return { ...item, Operator: newOperator };
          }
          return item;
        })
      );
    },
    []
  );

  // ============================================================
  // REMOVE & ACCESS
  // ============================================================

  const remove = useCallback((id: string): void => {
    setItems((prev) => removeFromTree(prev, id));
  }, []);

  const get = useCallback(
    (id: string): Condition | ConditionGroup | undefined => {
      return findById(items, id);
    },
    [items]
  );

  // ============================================================
  // UTILITY
  // ============================================================

  const clear = useCallback((): void => {
    setItems([]);
  }, []);

  const setOperator = useCallback((op: ConditionGroupOperator): void => {
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
    add,
    addGroup,
    addTo,
    addGroupTo,

    // Update operations
    update,
    updateOperator,

    // Remove & access
    remove,
    get,

    // Utility
    clear,
    setOperator,

    // Legacy API
    conditions: items,
  };
}
