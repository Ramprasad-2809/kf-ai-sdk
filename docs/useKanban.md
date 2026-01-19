# useKanban Hook Documentation

The `useKanban` hook provides kanban board functionality with drag-drop, filtering, and card operations.

## Table of Contents

- [Type Reference](#type-reference)
- [Usage Example](#usage-example)
- [API Quick Reference](#api-quick-reference)

## Type Reference

### Import Types

```typescript
import { useKanban } from "@ram_28/kf-ai-sdk";
import type {
  UseKanbanOptions,
  UseKanbanReturn,
  KanbanCard,
  KanbanColumn,
  ColumnConfig,
  FilterConditionWithId,
  ValidationError,
} from "@ram_28/kf-ai-sdk";
```

### KanbanCard<T>

Card with required kanban fields plus your custom data.

```typescript
type KanbanCard<T = Record<string, any>> = {
  _id: string;           // Unique identifier
  title: string;         // Card title
  columnId: string;      // Column this card belongs to
  position: number;      // Position within column (0-indexed)
  _created_at?: Date;
  _modified_at?: Date;
} & T;                   // Your custom fields
```

### KanbanColumn<T>

Column with cards, derived from ColumnConfig plus runtime data.

```typescript
interface KanbanColumn<T = Record<string, any>> {
  _id: string;              // Unique column identifier
  title: string;            // Display title
  position: number;         // Display order (0-indexed)
  cards: KanbanCard<T>[];   // Cards in this column
  color?: string;           // Visual indicator
  limit?: number;           // WIP limit
}
```

### ColumnConfig

Static column configuration.

```typescript
interface ColumnConfig {
  id: string;        // Must match card's columnId values
  title: string;     // Display title
  position: number;  // Display order (0-indexed)
  color?: string;    // Visual indicator
  limit?: number;    // WIP limit
}
```

### UseKanbanOptions<T>

```typescript
interface UseKanbanOptions<T> {
  source: string;                    // Business Object ID
  columns: ColumnConfig[];           // Column definitions
  enableDragDrop?: boolean;          // Default: true
  enableFiltering?: boolean;         // Default: false
  enableSearch?: boolean;            // Default: false
  initialState?: {
    filters?: FilterConditionWithId[];
    filterOperator?: "And" | "Or";
    search?: string;
  };
  onCardMove?: (card: KanbanCard<T>, fromColumnId: string, toColumnId: string) => void;
  onCardCreate?: (card: KanbanCard<T>) => void;
  onCardUpdate?: (card: KanbanCard<T>) => void;
  onCardDelete?: (cardId: string) => void;
  onError?: (error: Error) => void;
  onFilterError?: (errors: ValidationError[]) => void;
}
```

### UseKanbanReturn<T>

```typescript
interface UseKanbanReturn<T> {
  // Data
  columns: KanbanColumn<T>[];
  totalCards: number;

  // Loading
  isLoading: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  error: Error | null;

  // Card Operations
  createCard: (card: Partial<KanbanCard<T>> & { columnId: string }) => Promise<string>;
  updateCard: (id: string, updates: Partial<KanbanCard<T>>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, position?: number) => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  clearSearch: () => void;

  // Filter
  filter: {
    conditions: FilterConditionWithId[];
    logicalOperator: "And" | "Or";
    hasConditions: boolean;
    addCondition: (condition: Omit<FilterConditionWithId, "id" | "isValid">) => string;
    removeCondition: (id: string) => boolean;
    clearConditions: () => void;
    setLogicalOperator: (operator: "And" | "Or") => void;
    getConditionCount: () => number;
    validationErrors: ValidationError[];
  };

  // Drag Drop
  isDragging: boolean;
  draggedCard: KanbanCard<T> | null;
  dragOverColumn: string | null;
  getCardProps: (card: KanbanCard<T>) => CardDragProps;
  getColumnProps: (columnId: string) => ColumnDropProps;

  // Utilities
  refetch: () => Promise<void>;
  loadMore: (columnId: string) => void;
}
```

## Usage Example

From `ecommerce-app/src/pages/InventoryRestockingPage.tsx`. This example demonstrates all imported types:

```tsx
import { useState } from "react";
import { useKanban } from "@ram_28/kf-ai-sdk";
import type {
  UseKanbanOptions,
  UseKanbanReturn,
  KanbanCard,
  KanbanColumn,
  ColumnConfig,
  FilterConditionWithId,
  ValidationError,
} from "@ram_28/kf-ai-sdk";

// Define your card type (extends KanbanCard base fields)
interface RestockingCardData {
  productTitle: string;
  productSKU: string;
  currentStock: number;
  quantityOrdered: number;
  warehouse: "Warehouse_A" | "Warehouse_B" | "Warehouse_C";
  priority: "Low" | "Medium" | "High" | "Critical";
}

// KanbanCard<T> - card with required fields + your custom data
type RestockingCard = KanbanCard<RestockingCardData>;

export function InventoryRestockingPage() {
  const [savedFilters, setSavedFilters] = useState<FilterConditionWithId[]>([]);

  // ColumnConfig[] - static column definitions
  const columns: ColumnConfig[] = [
    { id: "LowStockAlert", title: "Low Stock Alert", position: 0, color: "red" },
    { id: "OrderPlaced", title: "Order Placed", position: 1, color: "yellow" },
    { id: "InTransit", title: "In Transit", position: 2, color: "blue" },
    { id: "Received", title: "Received & Restocked", position: 3, color: "green", limit: 20 },
  ];

  // UseKanbanOptions<T> - configuration for the hook
  const kanbanOptions: UseKanbanOptions<RestockingCardData> = {
    source: "BDO_ProductRestocking",
    columns,
    enableDragDrop: true,
    enableFiltering: true,
    enableSearch: true,
    // KanbanCard<T> - callback receives full card with custom fields
    onCardMove: (card: KanbanCard<RestockingCardData>, fromColumnId: string, toColumnId: string) => {
      console.log(`Moved "${card.productTitle}" from ${fromColumnId} to ${toColumnId}`);
      if (toColumnId === "Received") {
        // Trigger stock update workflow
      }
    },
    onCardCreate: (card: KanbanCard<RestockingCardData>) => {
      console.log("Created card:", card.productTitle);
    },
    onError: (error: Error) => {
      console.error("Kanban error:", error.message);
    },
    // ValidationError[] - filter validation errors
    onFilterError: (errors: ValidationError[]) => {
      errors.forEach((err: ValidationError) => {
        console.error(`Filter error [${err.conditionId}]: ${err.message}`);
      });
    },
  };

  // UseKanbanReturn<T> - the hook return type
  const kanban: UseKanbanReturn<RestockingCardData> = useKanban<RestockingCardData>(kanbanOptions);

  // KanbanColumn<T>[] - columns with their cards
  const displayBoard = () => {
    return kanban.columns.map((column: KanbanColumn<RestockingCardData>) => (
      <div
        key={column._id}
        // getColumnProps - provides drop zone handlers
        {...kanban.getColumnProps(column._id)}
        className={kanban.dragOverColumn === column._id ? "drag-over" : ""}
      >
        <div className="column-header">
          <span className={`dot bg-${column.color}`} />
          <h3>{column.title}</h3>
          <span>
            {column.cards.length}
            {column.limit && ` / ${column.limit}`}
          </span>
        </div>

        {/* KanbanCard<T>[] - cards with custom fields */}
        {column.cards.map((card: KanbanCard<RestockingCardData>) => (
          <div
            key={card._id}
            // getCardProps - provides drag handlers and ARIA attributes
            {...kanban.getCardProps(card)}
            className={kanban.draggedCard?._id === card._id ? "dragging" : ""}
          >
            <h4>{card.productTitle}</h4>
            <p>SKU: {card.productSKU}</p>
            <p>Stock: {card.currentStock}</p>
            <p>Ordered: {card.quantityOrdered}</p>
            <span className={`badge ${card.priority.toLowerCase()}`}>
              {card.priority}
            </span>
          </div>
        ))}

        {/* Load more for pagination */}
        {column.cards.length >= 10 && (
          <button onClick={() => kanban.loadMore(column._id)}>
            Load More
          </button>
        )}
      </div>
    ));
  };

  // FilterConditionWithId - filter with ID for state management
  const displayActiveFilters = () => {
    const conditions: FilterConditionWithId[] = kanban.filter.conditions;
    return conditions.map((condition: FilterConditionWithId) => (
      <span key={condition.id}>
        {condition.lhsField} {condition.operator} {condition.rhsValue}
        <button onClick={() => kanban.filter.removeCondition(condition.id)}>×</button>
      </span>
    ));
  };

  // Filter by priority
  const filterByPriority = (priority: string) => {
    kanban.filter.clearConditions();
    if (priority !== "all") {
      kanban.filter.addCondition({
        operator: "EQ",
        lhsField: "priority",
        rhsValue: priority,
      });
    }
  };

  // Save/restore filters using FilterConditionWithId[]
  const saveFilters = () => setSavedFilters([...kanban.filter.conditions]);
  const restoreFilters = () => kanban.filter.setConditions(savedFilters);

  // ValidationError[] - display filter validation errors
  const displayFilterErrors = () => {
    const errors: ValidationError[] = kanban.filter.validationErrors;
    return errors.map((err: ValidationError) => (
      <div key={err.conditionId} className="error">
        {err.field}: {err.message}
      </div>
    ));
  };

  // Card operations using KanbanCard<T>
  const createNewCard = async () => {
    const cardId = await kanban.createCard({
      columnId: "LowStockAlert",
      title: "New Restock Task",
      productTitle: "Sample Product",
      productSKU: "SKU-001",
      currentStock: 5,
      quantityOrdered: 50,
      warehouse: "Warehouse_A",
      priority: "High",
    });
    console.log("Created card:", cardId);
  };

  if (kanban.isLoading) {
    return <div>Loading board...</div>;
  }

  if (kanban.error) {
    return (
      <div>
        <p>Error: {kanban.error.message}</p>
        <button onClick={() => kanban.refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <input
        placeholder="Search products..."
        value={kanban.searchQuery}
        onChange={(e) => kanban.setSearchQuery(e.target.value)}
      />

      {/* Filter Controls */}
      <div>
        <button onClick={() => filterByPriority("Critical")}>Critical</button>
        <button onClick={() => filterByPriority("High")}>High</button>
        <button onClick={() => filterByPriority("all")}>All</button>
        {kanban.filter.hasConditions && (
          <button onClick={kanban.filter.clearConditions}>
            Clear ({kanban.filter.getConditionCount()})
          </button>
        )}
      </div>

      {/* Active Filters */}
      <div>{displayActiveFilters()}</div>

      {/* Filter Errors */}
      {displayFilterErrors()}

      {/* Board Stats */}
      <p>Total cards: {kanban.totalCards}</p>
      <p>Dragging: {kanban.isDragging ? "Yes" : "No"}</p>

      {/* Kanban Board */}
      <div className="board">{displayBoard()}</div>

      {/* Actions */}
      <div>
        <button onClick={createNewCard}>Create Card</button>
        <button onClick={saveFilters}>Save Filters</button>
        <button onClick={restoreFilters}>Restore Filters</button>
      </div>
    </div>
  );
}
```

**Type explanations:**

| Type | Purpose | Where Used |
|------|---------|------------|
| `KanbanCard<T>` | Card with `_id`, `title`, `columnId`, `position` + custom fields | `column.cards[]`, callbacks |
| `KanbanColumn<T>` | Column with cards array | `kanban.columns[]` |
| `ColumnConfig` | Static column definition (id must match card's columnId) | `options.columns` |
| `UseKanbanOptions<T>` | Hook configuration | `useKanban(options)` |
| `UseKanbanReturn<T>` | Hook return with all methods | Return value of `useKanban()` |
| `FilterConditionWithId` | Filter condition with ID and validation | `kanban.filter.conditions` |
| `ValidationError` | Filter validation error | `kanban.filter.validationErrors`, `onFilterError` |

## API Quick Reference

### Data

```typescript
kanban.columns                  // KanbanColumn<T>[]
kanban.totalCards               // Total cards across all columns
kanban.isLoading                // Initial load
kanban.isFetching               // Any fetch
kanban.isUpdating               // Mutation in progress
kanban.error                    // Error | null
```

### Card Operations

```typescript
kanban.createCard({ columnId, title, ...customFields })  // Returns Promise<string>
kanban.updateCard(id, { ...updates })                    // Partial update
kanban.deleteCard(id)
kanban.moveCard(cardId, toColumnId, position?)
```

### Search

```typescript
kanban.searchQuery              // Current query
kanban.setSearchQuery("text")   // Set query
kanban.clearSearch()            // Clear query
```

### Filter

```typescript
kanban.filter.conditions                      // FilterConditionWithId[]
kanban.filter.hasConditions                   // boolean
kanban.filter.addCondition({ operator, lhsField, rhsValue })
kanban.filter.removeCondition(id)
kanban.filter.clearConditions()
kanban.filter.setLogicalOperator("And" | "Or")
kanban.filter.getConditionCount()
kanban.filter.validationErrors                // ValidationError[]
```

### Drag & Drop

```typescript
kanban.isDragging               // Drag in progress
kanban.draggedCard              // Currently dragged card
kanban.dragOverColumn           // Column being hovered
kanban.getCardProps(card)       // Drag handlers + ARIA for card
kanban.getColumnProps(columnId) // Drop handlers for column
```

### Utilities

```typescript
kanban.refetch()                // Re-fetch all data
kanban.loadMore(columnId)       // Load more cards for column
```
