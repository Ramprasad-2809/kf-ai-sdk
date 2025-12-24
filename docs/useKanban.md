# useKanban Hook - Usage Guide

The `useKanban` hook is a powerful kanban board management solution that handles card data fetching, drag-and-drop operations, filtering, searching, and per-column pagination with minimal configuration. It integrates seamlessly with TanStack Query for efficient data management and provides built-in accessibility features.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Features](#features)
  - [Drag and Drop](#drag-and-drop)
  - [Searching](#searching)
  - [Advanced Filtering](#advanced-filtering)
  - [Per-Column Pagination](#per-column-pagination)
  - [Card Operations](#card-operations)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Usage

```tsx
import { useKanban } from 'kf-ai-sdk';

interface RestockingCard {
  _id: string;
  title: string;
  columnId: string;
  position: number;
  productTitle: string;
  currentStock: number;
  quantityOrdered: number;
  priority: "Low" | "Medium" | "High" | "Critical";
}

function InventoryBoard() {
  const kanban = useKanban<RestockingCard>({
    source: "BDO_ProductRestocking",
    columns: [
      { id: "LowStockAlert", title: "Low Stock Alert", position: 0, color: "red" },
      { id: "OrderPlaced", title: "Order Placed", position: 1, color: "yellow" },
      { id: "InTransit", title: "In Transit", position: 2, color: "blue" },
      { id: "Received", title: "Received", position: 3, color: "green" },
    ],
    enableDragDrop: true,
  });

  if (kanban.isLoading) {
    return <div>Loading board...</div>;
  }

  if (kanban.error) {
    return <div>Error: {kanban.error.message}</div>;
  }

  return (
    <div className="kanban-board">
      {kanban.columns.map((column) => (
        <div key={column._id} {...kanban.getColumnProps(column._id)}>
          <h3>{column.title}</h3>
          <div className="cards">
            {column.cards.map((card) => (
              <div key={card._id} {...kanban.getCardProps(card)}>
                <h4>{card.title}</h4>
                <p>Stock: {card.currentStock}</p>
                <p>Ordered: {card.quantityOrdered}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Core Concepts

### Column Configuration

Columns are defined statically in the hook configuration and represent workflow stages:
- **id**: Unique identifier matching the `columnId` field in your cards
- **title**: Display name for the column
- **position**: Order in which columns appear (0-indexed)
- **color**: Optional visual indicator
- **limit**: Optional WIP (Work In Progress) limit

### Card Structure

Cards must include core kanban fields:
- **_id**: Unique identifier
- **title**: Card title/name
- **columnId**: Which column the card belongs to
- **position**: Order within the column (0-indexed)
- **Custom fields**: Any additional data specific to your use case

### State Management

All kanban state (card positions, filters, search) is managed internally and synchronized with the backend via optimistic updates and API calls.

### Drag and Drop

Built-in drag-and-drop functionality with:
- Mouse and keyboard support
- Accessibility features (ARIA labels)
- Optimistic UI updates
- Automatic rollback on errors

## API Reference

### useKanban(options)

#### Parameters

```typescript
interface UseKanbanOptions<T> {
  /** Data source identifier (Business Object name) */
  source: string;

  /** Static column definitions (required) */
  columns: ColumnConfig[];

  /** Enable drag and drop functionality (default: true) */
  enableDragDrop?: boolean;

  /** Enable filtering functionality (default: false) */
  enableFiltering?: boolean;

  /** Enable search functionality (default: false) */
  enableSearch?: boolean;

  /** Field definitions for card validation and filtering */
  cardFieldDefinitions?: Record<keyof T, FieldDefinition>;

  /** Initial state */
  initialState?: {
    /** Initial filter conditions */
    filters?: FilterConditionWithId[];
    /** Initial filter operator */
    filterOperator?: "And" | "Or";
    /** Initial search query */
    search?: string;
    /** Initial sort configuration */
    sorting?: {
      field: keyof T;
      direction: "asc" | "desc";
    };
  };

  /** Event callbacks */
  onCardMove?: (card: KanbanCard<T>, fromColumnId: string, toColumnId: string) => void;
  onCardCreate?: (card: KanbanCard<T>) => void;
  onCardUpdate?: (card: KanbanCard<T>) => void;
  onCardDelete?: (cardId: string) => void;
  onError?: (error: Error) => void;
  onFilterError?: (errors: ValidationError[]) => void;
}

interface ColumnConfig {
  /** Unique column identifier */
  id: string;
  /** Display title */
  title: string;
  /** Display order (0-indexed) */
  position: number;
  /** Optional color for the column header */
  color?: string;
  /** Optional WIP limit */
  limit?: number;
}
```

#### Return Value

```typescript
interface UseKanbanReturn<T> {
  // ============================================================
  // DATA
  // ============================================================

  /** All columns with their cards */
  columns: KanbanColumn<T>[];
  /** Total number of cards across all columns */
  totalCards: number;

  // ============================================================
  // LOADING STATES
  // ============================================================

  /** Initial data loading */
  isLoading: boolean;
  /** Background refetching */
  isFetching: boolean;
  /** Any mutation in progress (create/update/delete/move) */
  isUpdating: boolean;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  /** Current error state */
  error: Error | null;

  // ============================================================
  // CARD OPERATIONS
  // ============================================================

  /** Create a new card */
  createCard: (card: Partial<KanbanCard<T>> & { columnId: string }) => Promise<string>;
  /** Update an existing card */
  updateCard: (id: string, updates: Partial<KanbanCard<T>>) => Promise<void>;
  /** Delete a card */
  deleteCard: (id: string) => Promise<void>;
  /** Move a card to a different column */
  moveCard: (cardId: string, toColumnId: string, position?: number, fromColumnId?: string) => Promise<void>;
  /** Reorder cards within a column */
  reorderCards: (cardIds: string[], columnId: string) => Promise<void>;

  // ============================================================
  // SEARCH
  // ============================================================

  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (value: string) => void;
  /** Clear search query */
  clearSearch: () => void;

  // ============================================================
  // FILTER (Nested - following useTable pattern)
  // ============================================================

  /** Filter functionality (reuses useFilter hook) */
  filter: {
    conditions: FilterConditionWithId[];
    logicalOperator: "And" | "Or";
    isValid: boolean;
    validationErrors: ValidationError[];
    hasConditions: boolean;
    addCondition: (condition: Omit<FilterConditionWithId, "id" | "isValid">) => string;
    updateCondition: (id: string, updates: Partial<FilterConditionWithId>) => boolean;
    removeCondition: (id: string) => boolean;
    clearConditions: () => void;
    setLogicalOperator: (operator: "And" | "Or") => void;
    getConditionCount: () => number;
  };

  // ============================================================
  // DRAG DROP
  // ============================================================

  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** The card currently being dragged */
  draggedCard: KanbanCard<T> | null;
  /** The column currently being hovered over during drag */
  dragOverColumn: string | null;
  /** Handle drag start event */
  handleDragStart: (event: DragEvent, card: KanbanCard<T>) => void;
  /** Handle drag over event */
  handleDragOver: (event: DragEvent, columnId?: string) => void;
  /** Handle drop event */
  handleDrop: (event: DragEvent, columnId: string) => void;
  /** Handle drag end event */
  handleDragEnd: () => void;
  /** Handle keyboard navigation */
  handleKeyDown: (event: KeyboardEvent, card: KanbanCard<T>) => void;

  // ============================================================
  // PROP GETTERS
  // ============================================================

  /** Get props for a draggable card */
  getCardProps: (card: KanbanCard<T>) => {
    draggable: boolean;
    role: string;
    "aria-selected": boolean;
    "aria-grabbed": boolean;
    onDragStart: (e: any) => void;
    onDragEnd: () => void;
    onKeyDown: (e: any) => void;
  };

  /** Get props for a droppable column */
  getColumnProps: (columnId: string) => {
    "data-column-id": string;
    role: string;
    onDragOver: (e: any) => void;
    onDrop: (e: any) => void;
  };

  // ============================================================
  // UTILITIES
  // ============================================================

  /** Refetch all data */
  refetch: () => Promise<void>;
  /** Refresh data (invalidate cache) */
  refresh: () => Promise<void>;
  /** Load more cards for a specific column */
  loadMore: (columnId: string) => void;
}
```

## Features

### Drag and Drop

Move cards between columns with built-in drag-and-drop support.

```tsx
function TaskBoard() {
  const kanban = useKanban<Task>({
    source: "BDO_Tasks",
    columns: [
      { id: "todo", title: "To Do", position: 0 },
      { id: "inProgress", title: "In Progress", position: 1 },
      { id: "done", title: "Done", position: 2 },
    ],
    enableDragDrop: true,
    onCardMove: (card, fromColumn, toColumn) => {
      console.log(`Moved "${card.title}" from ${fromColumn} to ${toColumn}`);
      toast.success(`Card moved to ${toColumn}`);
    },
    onError: (error) => {
      toast.error(`Failed to move card: ${error.message}`);
    },
  });

  return (
    <div className="board">
      {kanban.columns.map((column) => (
        <div
          key={column._id}
          className="column"
          {...kanban.getColumnProps(column._id)}
        >
          <h3>{column.title}</h3>
          <div className="card-list">
            {column.cards.map((card) => (
              <div
                key={card._id}
                className={`card ${kanban.draggedCard?._id === card._id ? 'dragging' : ''}`}
                {...kanban.getCardProps(card)}
              >
                {card.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Drag & Drop Features:**
- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Keyboard Support**: Arrow keys + Space/Enter to move cards
- **Accessibility**: ARIA labels for screen readers
- **Visual Feedback**: `isDragging`, `draggedCard`, and `dragOverColumn` states
- **Error Handling**: Automatic rollback with `onError` callback

**Prop Getters:**
- `getCardProps(card)`: Provides all necessary drag handlers for cards
- `getColumnProps(columnId)`: Provides drop zone handlers for columns

### Searching

Full-text search across your kanban cards.

```tsx
import { Search } from "lucide-react";

function InventoryBoard() {
  const kanban = useKanban<RestockingCard>({
    source: "BDO_ProductRestocking",
    columns: COLUMNS,
    enableDragDrop: true,
    enableSearch: true,
  });

  return (
    <div>
      {/* Search Input */}
      <div className="search-bar">
        <Search className="icon" />
        <input
          placeholder="Search by product title or SKU..."
          value={kanban.searchQuery}
          onChange={(e) => kanban.setSearchQuery(e.target.value)}
        />
        {kanban.searchQuery && (
          <button onClick={kanban.clearSearch}>Clear</button>
        )}
      </div>

      {/* Results Info */}
      <p>Found {kanban.totalCards} cards</p>

      {/* Board */}
      <div className="board">
        {kanban.columns.map((column) => (
          <div key={column._id}>
            <h3>{column.title} ({column.cards.length})</h3>
            {column.cards.map((card) => (
              <div key={card._id}>{card.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Search Features:**
- Searches across all card fields (backend-controlled)
- Case-insensitive search
- Debounced API calls (via react-query)
- Per-column card counts update automatically

### Advanced Filtering

Build complex filter conditions to narrow down cards.

```tsx
function FilterableBoard() {
  const kanban = useKanban<RestockingCard>({
    source: "BDO_ProductRestocking",
    columns: COLUMNS,
    enableFiltering: true,
    cardFieldDefinitions: {
      priority: { type: "SelectField", required: false },
      warehouse: { type: "SelectField", required: false },
      currentStock: { type: "NumberField", required: true },
    },
  });

  const filterByPriority = (priority: string) => {
    kanban.filter.clearConditions();
    if (priority !== "all") {
      kanban.filter.addCondition({
        lhsField: "priority",
        operator: "EQ",
        rhsValue: priority,
        rhsType: "Constant",
      });
    }
  };

  const filterCriticalLowStock = () => {
    kanban.filter.clearConditions();

    // Priority = Critical
    kanban.filter.addCondition({
      lhsField: "priority",
      operator: "EQ",
      rhsValue: "Critical",
      rhsType: "Constant",
    });

    // Stock <= 5
    kanban.filter.addCondition({
      lhsField: "currentStock",
      operator: "LTE",
      rhsValue: 5,
      rhsType: "Constant",
    });

    // Combine with AND logic
    kanban.filter.setLogicalOperator("And");
  };

  return (
    <div>
      {/* Filter Buttons */}
      <div className="filters">
        <button onClick={() => filterByPriority("all")}>All</button>
        <button onClick={() => filterByPriority("Critical")}>Critical</button>
        <button onClick={() => filterByPriority("High")}>High</button>
        <button onClick={filterCriticalLowStock}>
          Critical & Low Stock
        </button>

        {kanban.filter.hasConditions && (
          <button onClick={kanban.filter.clearConditions}>
            Clear Filters ({kanban.filter.getConditionCount()})
          </button>
        )}
      </div>

      {/* Board */}
      {/* ... */}
    </div>
  );
}
```

**Filter Integration:**
- Uses the same `useFilter` hook as `useTable`
- Filters apply to ALL columns
- Supports complex logical operators (AND/OR)
- Real-time validation with error feedback

**Filter Operators:**
- `EQ`, `NEQ`: Equal, Not equal
- `GT`, `GTE`, `LT`, `LTE`: Greater/Less than (or equal)
- `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`: String matching
- `IN`, `NOT_IN`: Value in list

### Per-Column Pagination

Load more cards for individual columns using a "page size expansion" strategy.

```tsx
function BoardWithPagination() {
  const kanban = useKanban<Card>({
    source: "BDO_Cards",
    columns: COLUMNS,
  });

  return (
    <div className="board">
      {kanban.columns.map((column) => (
        <div key={column._id} className="column">
          <div className="column-header">
            <h3>{column.title}</h3>
            <span className="count">{column.cards.length}</span>
          </div>

          <div className="card-list">
            {column.cards.map((card) => (
              <div key={card._id} className="card">
                {card.title}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {column.cards.length >= 10 && (
            <button
              className="load-more"
              onClick={() => kanban.loadMore(column._id)}
              disabled={kanban.isFetching}
            >
              {kanban.isFetching ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Pagination Strategy:**
- **Page Size Expansion**: Each column starts with 10 cards, expands by 10 on "Load More"
- **Always Page 1**: Backend always returns from the start with increasing `PageSize`
- **Per-Column State**: Each column tracks its own page size independently
- **Efficient**: Only fetches what's needed for visible columns

### Card Operations

Create, update, delete, and move cards programmatically.

```tsx
function BoardWithCardOperations() {
  const kanban = useKanban<Task>({
    source: "BDO_Tasks",
    columns: COLUMNS,
    onCardCreate: (card) => {
      toast.success(`Card "${card.title}" created!`);
    },
    onCardUpdate: (card) => {
      toast.success(`Card "${card.title}" updated!`);
    },
    onCardDelete: (cardId) => {
      toast.success("Card deleted!");
    },
  });

  const handleCreateCard = async () => {
    try {
      const cardId = await kanban.createCard({
        title: "New Task",
        columnId: "todo",
        description: "Task description",
        priority: "Medium",
      });
      console.log("Created card with ID:", cardId);
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  };

  const handleUpdateCard = async (cardId: string) => {
    try {
      await kanban.updateCard(cardId, {
        title: "Updated Task Title",
        priority: "High",
      });
    } catch (error) {
      console.error("Failed to update card:", error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await kanban.deleteCard(cardId);
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  const handleMoveCard = async (cardId: string) => {
    try {
      await kanban.moveCard(cardId, "done", 0); // Move to "done" at position 0
    } catch (error) {
      console.error("Failed to move card:", error);
    }
  };

  return (
    <div>
      <button onClick={handleCreateCard}>Create Card</button>
      {/* Board rendering */}
    </div>
  );
}
```

**Card Operations:**
- `createCard`: Returns the new card's ID
- `updateCard`: Partial updates (only changed fields)
- `deleteCard`: Soft or hard delete (backend-dependent)
- `moveCard`: Automatically finds source column if not provided
- `reorderCards`: Bulk position updates within a column

**Optimistic Updates:**
- All operations update the UI immediately
- Automatic rollback on error
- Background sync with server

## Complete Example

Here's a full-featured inventory restocking board from the e-commerce example:

```tsx
import { useState } from "react";
import { useKanban } from "kf-ai-sdk";
import { Package, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnTitle,
  KanbanColumnContent,
  KanbanCard,
  KanbanCardTitle,
  KanbanCardDescription,
  KanbanColumnFooter,
} from "../components/ui/kanban";

interface RestockingCard {
  _id: string;
  title: string;
  columnId: string;
  position: number;
  productTitle: string;
  productSKU: string;
  productASIN: string;
  currentStock: number;
  reorderLevel: number;
  quantityOrdered: number;
  warehouse: "Warehouse_A" | "Warehouse_B" | "Warehouse_C";
  priority: "Low" | "Medium" | "High" | "Critical";
  expectedDeliveryDate?: Date;
}

const RESTOCKING_COLUMNS = [
  { id: "LowStockAlert", title: "Low Stock Alert", position: 0, color: "red" },
  { id: "OrderPlaced", title: "Order Placed", position: 1, color: "yellow" },
  { id: "InTransit", title: "In Transit", position: 2, color: "blue" },
  { id: "Received", title: "Received & Restocked", position: 3, color: "green" },
];

export function InventoryRestockingPage() {
  const [showStockUpdateModal, setShowStockUpdateModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<RestockingCard | null>(null);

  const kanban = useKanban<RestockingCard>({
    source: "BDO_ProductRestocking",
    columns: RESTOCKING_COLUMNS,
    enableDragDrop: true,
    enableFiltering: true,
    enableSearch: true,
    onCardMove: (card, _fromColumnId, toColumnId) => {
      if (toColumnId === "Received") {
        setSelectedCard(card);
        setShowStockUpdateModal(true);
      }
    },
    onError: (error) => {
      toast.error(`Failed to move card: ${error.message}`);
    },
  });

  const formatDate = (date: Date | string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "warning";
      case "Medium": return "secondary";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Restocking
          </h1>
          <p className="text-gray-500">Manage product restocking workflow</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search by product title or SKU..."
            className="pl-10"
            value={kanban.searchQuery || ""}
            onChange={(e) => kanban.setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban Board */}
      {kanban.error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-800 mb-2">
            Error loading restocking tasks
          </h3>
          <p className="text-red-600 mb-6">{kanban.error.message}</p>
          <button onClick={() => kanban.refetch()}>Try Again</button>
        </div>
      ) : kanban.isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard instance={kanban} className="h-full">
            {kanban.columns.map((column) => (
              <KanbanColumn key={column._id} columnId={column._id}>
                <KanbanColumnHeader>
                  <KanbanColumnTitle>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full bg-${column.color}-500`} />
                      {column.title}
                    </div>
                  </KanbanColumnTitle>
                  <span className="badge">{column.cards.length}</span>
                </KanbanColumnHeader>

                <KanbanColumnContent>
                  {column.cards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No items
                    </div>
                  ) : (
                    column.cards.map((card) => (
                      <KanbanCard key={card._id} card={card}>
                        <div className="space-y-2">
                          <KanbanCardTitle>{card.productTitle}</KanbanCardTitle>

                          <KanbanCardDescription>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">SKU:</span>
                                <span className="font-mono">{card.productSKU}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Current Stock:</span>
                                <span className="font-semibold text-red-600">
                                  {card.currentStock}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Ordered:</span>
                                <span className="font-semibold text-green-600">
                                  {card.quantityOrdered}
                                </span>
                              </div>
                            </div>
                          </KanbanCardDescription>

                          <div className="flex flex-wrap gap-1 pt-2">
                            <span className={`badge ${getPriorityVariant(card.priority)}`}>
                              {card.priority}
                            </span>
                            <span className="badge outline">
                              {card.warehouse.replace("_", " ")}
                            </span>
                          </div>

                          {card.expectedDeliveryDate && (
                            <div className="text-xs text-gray-500 pt-1">
                              Expected: {formatDate(card.expectedDeliveryDate)}
                            </div>
                          )}
                        </div>
                      </KanbanCard>
                    ))
                  )}
                </KanbanColumnContent>

                {column.cards.length >= 10 && (
                  <KanbanColumnFooter>
                    <button
                      className="load-more-btn"
                      onClick={() => kanban.loadMore(column._id)}
                    >
                      Load More
                    </button>
                  </KanbanColumnFooter>
                )}
              </KanbanColumn>
            ))}
          </KanbanBoard>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Always Define Types

Use TypeScript for better type safety and autocomplete:

```tsx
interface Task {
  _id: string;
  title: string;
  columnId: string;
  position: number;
  description: string;
  assignee: string;
  priority: "Low" | "Medium" | "High";
}

const kanban = useKanban<Task>({
  source: "BDO_Tasks",
  columns: [...],
});

// TypeScript validates custom fields
kanban.createCard({
  title: "New Task",
  columnId: "todo",
  priority: "High", // ✅ Type-checked
  description: "...",
});
```

### 2. Use Column Configs Wisely

Define columns once and reference them:

```tsx
const BOARD_COLUMNS = [
  { id: "backlog", title: "Backlog", position: 0, color: "gray", limit: 20 },
  { id: "todo", title: "To Do", position: 1, color: "blue", limit: 10 },
  { id: "inProgress", title: "In Progress", position: 2, color: "yellow", limit: 5 },
  { id: "review", title: "Review", position: 3, color: "purple", limit: 3 },
  { id: "done", title: "Done", position: 4, color: "green" },
];

const kanban = useKanban({
  source: "BDO_Tasks",
  columns: BOARD_COLUMNS,
});
```

### 3. Handle Loading and Error States

Always show appropriate UI for loading and error states:

```tsx
if (kanban.isLoading) {
  return <BoardSkeleton />;
}

if (kanban.error) {
  return (
    <ErrorState
      message={kanban.error.message}
      onRetry={() => kanban.refetch()}
    />
  );
}
```

### 4. Use Prop Getters for Drag & Drop

Always use the prop getters for consistent behavior:

```tsx
// ✅ Recommended
<div {...kanban.getColumnProps(column._id)}>
  {column.cards.map((card) => (
    <div key={card._id} {...kanban.getCardProps(card)}>
      {card.title}
    </div>
  ))}
</div>

// ❌ Don't manually add drag handlers
<div
  onDragOver={(e) => kanban.handleDragOver(e, column._id)}
  onDrop={(e) => kanban.handleDrop(e, column._id)}
>
  {/* ... */}
</div>
```

### 5. Provide Visual Feedback During Drag

Use the drag state for better UX:

```tsx
<div
  className={`card ${
    kanban.draggedCard?._id === card._id ? 'opacity-50' : ''
  }`}
  {...kanban.getCardProps(card)}
>
  {card.title}
</div>

<div
  className={`column ${
    kanban.dragOverColumn === column._id ? 'bg-blue-50 border-blue-300' : ''
  }`}
  {...kanban.getColumnProps(column._id)}
>
  {/* ... */}
</div>
```

### 6. Use Callbacks for Side Effects

Leverage callbacks for business logic:

```tsx
const kanban = useKanban({
  source: "BDO_Tasks",
  columns: COLUMNS,
  onCardMove: async (card, fromCol, toCol) => {
    // Log analytics
    analytics.track("card_moved", { from: fromCol, to: toCol });

    // Send notifications
    if (toCol === "done") {
      await notifyStakeholders(card);
    }

    // Update external systems
    if (toCol === "review") {
      await createReviewRequest(card);
    }
  },
  onError: (error) => {
    // Log errors to monitoring service
    Sentry.captureException(error);
    toast.error(error.message);
  },
});
```

### 7. Optimize Rendering with Memoization

Memoize card components for better performance:

```tsx
const CardItem = memo(({ card }: { card: Task }) => (
  <div className="card">
    <h4>{card.title}</h4>
    <p>{card.description}</p>
    <span className="badge">{card.priority}</span>
  </div>
));

// In render
{column.cards.map((card) => (
  <div key={card._id} {...kanban.getCardProps(card)}>
    <CardItem card={card} />
  </div>
))}
```

### 8. Handle Empty States

Provide helpful empty states:

```tsx
{column.cards.length === 0 ? (
  <div className="empty-state">
    <EmptyIcon className="h-12 w-12 text-gray-400" />
    <p className="text-gray-500">No cards in this column</p>
    {column.id === "todo" && (
      <button onClick={() => handleCreateCard(column.id)}>
        Create First Card
      </button>
    )}
  </div>
) : (
  column.cards.map((card) => (
    <CardComponent key={card._id} card={card} />
  ))
)}
```

## Common Patterns

### Pattern 1: Board with WIP Limits

```tsx
function BoardWithWIPLimits() {
  const kanban = useKanban<Task>({
    source: "BDO_Tasks",
    columns: [
      { id: "todo", title: "To Do", position: 0 },
      { id: "inProgress", title: "In Progress", position: 1, limit: 5 },
      { id: "review", title: "Review", position: 2, limit: 3 },
      { id: "done", title: "Done", position: 3 },
    ],
  });

  return (
    <div className="board">
      {kanban.columns.map((column) => {
        const isOverLimit = column.limit && column.cards.length > column.limit;

        return (
          <div key={column._id} className="column">
            <div className="column-header">
              <h3>{column.title}</h3>
              <span className={`count ${isOverLimit ? 'text-red-600' : ''}`}>
                {column.cards.length}
                {column.limit && ` / ${column.limit}`}
              </span>
            </div>

            {isOverLimit && (
              <div className="alert alert-warning">
                WIP limit exceeded!
              </div>
            )}

            <div className="card-list">
              {column.cards.map((card) => (
                <div key={card._id} {...kanban.getCardProps(card)}>
                  {card.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Pattern 2: Swimlanes (Grouped Rows)

```tsx
function BoardWithSwimlanes() {
  const kanban = useKanban<Task>({
    source: "BDO_Tasks",
    columns: COLUMNS,
  });

  // Group cards by priority (High, Medium, Low)
  const groupedByPriority = useMemo(() => {
    const groups: Record<string, typeof kanban.columns> = {
      High: [],
      Medium: [],
      Low: [],
    };

    kanban.columns.forEach((column) => {
      const highPriorityCards = column.cards.filter(c => c.priority === "High");
      const mediumPriorityCards = column.cards.filter(c => c.priority === "Medium");
      const lowPriorityCards = column.cards.filter(c => c.priority === "Low");

      groups.High.push({ ...column, cards: highPriorityCards });
      groups.Medium.push({ ...column, cards: mediumPriorityCards });
      groups.Low.push({ ...column, cards: lowPriorityCards });
    });

    return groups;
  }, [kanban.columns]);

  return (
    <div className="board-with-swimlanes">
      {Object.entries(groupedByPriority).map(([priority, columns]) => (
        <div key={priority} className="swimlane">
          <h2 className="swimlane-title">{priority} Priority</h2>
          <div className="board">
            {columns.map((column) => (
              <div key={column._id} {...kanban.getColumnProps(column._id)}>
                <h3>{column.title}</h3>
                {column.cards.map((card) => (
                  <div key={card._id} {...kanban.getCardProps(card)}>
                    {card.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Card Quick Actions

```tsx
function BoardWithQuickActions() {
  const kanban = useKanban<Task>({
    source: "BDO_Tasks",
    columns: COLUMNS,
  });

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleQuickEdit = (card: Task) => {
    // Open edit modal
  };

  const handleQuickDelete = async (cardId: string) => {
    if (confirm("Delete this card?")) {
      await kanban.deleteCard(cardId);
    }
  };

  return (
    <div className="board">
      {kanban.columns.map((column) => (
        <div key={column._id} {...kanban.getColumnProps(column._id)}>
          <h3>{column.title}</h3>
          {column.cards.map((card) => (
            <div
              key={card._id}
              className="card"
              {...kanban.getCardProps(card)}
              onMouseEnter={() => setHoveredCard(card._id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="card-content">
                {card.title}
              </div>

              {hoveredCard === card._id && (
                <div className="card-actions">
                  <button onClick={() => handleQuickEdit(card)}>
                    Edit
                  </button>
                  <button onClick={() => handleQuickDelete(card._id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Pattern 4: Filtered Board with Chips

```tsx
function FilteredBoard() {
  const kanban = useKanban<Task>({
    source: "BDO_Tasks",
    columns: COLUMNS,
    enableFiltering: true,
  });

  const activeFilters = useMemo(() => {
    return kanban.filter.conditions.map((condition) => ({
      id: condition.id,
      label: `${condition.lhsField} ${condition.operator} ${condition.rhsValue}`,
    }));
  }, [kanban.filter.conditions]);

  return (
    <div>
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="filter-chips">
          {activeFilters.map((filter) => (
            <div key={filter.id} className="chip">
              {filter.label}
              <button onClick={() => kanban.filter.removeCondition(filter.id)}>
                ×
              </button>
            </div>
          ))}
          <button onClick={kanban.filter.clearConditions}>
            Clear All
          </button>
        </div>
      )}

      {/* Board */}
      <div className="board">
        {/* ... */}
      </div>
    </div>
  );
}
```

## Troubleshooting

### Issue: Cards Not Loading

**Symptoms:** Board shows empty columns or loading state indefinitely

**Solutions:**
1. Check if the backend API endpoint is accessible
2. Verify the `source` parameter matches your Business Object
3. Ensure cards have the required fields: `_id`, `title`, `columnId`, `position`
4. Check browser console for network errors
5. Use `onError` callback to log errors:

```tsx
const kanban = useKanban({
  source: "BDO_Cards",
  columns: [...],
  onError: (error) => {
    console.error("Kanban error:", error);
  }
});
```

### Issue: Drag and Drop Not Working

**Symptoms:** Cards cannot be dragged or dropped

**Solutions:**
1. Ensure `enableDragDrop: true` is set
2. Verify you're using the prop getters:
   ```tsx
   {...kanban.getCardProps(card)}
   {...kanban.getColumnProps(column._id)}
   ```
3. Check that cards have unique `_id` values
4. Verify CSS doesn't have `pointer-events: none` on cards
5. Test keyboard navigation (Space/Enter + Arrow keys)

### Issue: Cards Appear in Wrong Column

**Symptoms:** Cards show up in columns they don't belong to

**Solutions:**
1. Verify `columnId` field in card data matches column `id` exactly
2. Check for case sensitivity: "Todo" ≠ "todo"
3. Ensure backend is returning correct `columnId` values
4. Validate column configuration IDs match backend data

### Issue: Optimistic Updates Not Rolling Back

**Symptoms:** UI shows moved card even though API failed

**Solutions:**
1. Check that errors are being thrown correctly from the API
2. Verify `onError` callback is not swallowing errors
3. Check browser console for mutation errors
4. Ensure React Query is properly configured

### Issue: Search Not Working

**Symptoms:** Typing in search doesn't filter cards

**Solutions:**
1. Ensure `enableSearch: true` is set
2. Verify backend supports the `Search` parameter in list API
3. Check that you're using `kanban.searchQuery` and `kanban.setSearchQuery()`
4. Backend search is case-insensitive and searches all fields

### Issue: Filters Not Applied

**Symptoms:** Adding filters doesn't change displayed cards

**Solutions:**
1. Ensure `enableFiltering: true` is set
2. Verify backend supports the `Filter` parameter
3. Check filter condition structure is correct
4. Use `onFilterError` callback to catch validation errors:

```tsx
const kanban = useKanban({
  source: "BDO_Cards",
  columns: [...],
  enableFiltering: true,
  onFilterError: (errors) => {
    console.error("Filter validation errors:", errors);
  }
});
```

### Issue: Performance Issues with Many Cards

**Symptoms:** Board is slow to render or update

**Solutions:**
1. Use per-column pagination with `loadMore()`
2. Start with smaller page sizes (default is 10)
3. Memoize card components with `React.memo()`
4. Implement virtual scrolling for very long columns
5. Optimize card rendering (avoid expensive computations)

```tsx
const CardItem = memo(({ card }: { card: Task }) => (
  <div className="card">
    <h4>{card.title}</h4>
    <p>{card.description}</p>
  </div>
));

// Use in render
{column.cards.map((card) => (
  <div key={card._id} {...kanban.getCardProps(card)}>
    <CardItem card={card} />
  </div>
))}
```

### Issue: Cards Don't Update After External Changes

**Symptoms:** Board doesn't reflect changes made elsewhere

**Solutions:**
1. Call `kanban.refetch()` to re-fetch all data
2. Call `kanban.refresh()` to invalidate cache and trigger refetch
3. Use React Query's built-in polling:
   ```tsx
   // In your QueryClient configuration
   refetchInterval: 30000, // Refetch every 30 seconds
   ```
4. Implement WebSocket updates for real-time sync

### Issue: TypeScript Errors with Custom Fields

**Symptoms:** TypeScript complains about card fields

**Solutions:**
1. Define proper interface extending `KanbanCard`:
   ```tsx
   interface Task extends KanbanCard {
     description: string;
     assignee: string;
     priority: "Low" | "Medium" | "High";
   }

   const kanban = useKanban<Task>({
     source: "BDO_Tasks",
     columns: [...],
   });
   ```
2. Use type parameter consistently across operations
3. Ensure custom fields are optional or provide defaults

---

For more examples, see the [e-commerce example](../examples/e-commerce/) in the repository, specifically the `InventoryRestockingPage` component.
