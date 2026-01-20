# useKanban

## Brief Description

- Provides complete kanban board state management including column configuration, card CRUD operations, and drag-and-drop functionality
- Integrates with `useFilter` for filtering cards across the board with support for nested condition groups
- Includes built-in drag-and-drop handlers and prop getters (`getCardProps`, `getColumnProps`) for easy integration with any UI library
- Handles optimistic updates for card operations with automatic rollback on failure

## Type Reference

```typescript
import { useKanban } from "@ram_28/kf-ai-sdk/kanban";
import { isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";
import type {
  UseKanbanOptionsType,
  UseKanbanReturnType,
  KanbanCardType,
  KanbanColumnType,
  ColumnConfigType,
} from "@ram_28/kf-ai-sdk/kanban/types";
import type {
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  UseFilterReturnType,
} from "@ram_28/kf-ai-sdk/filter/types";

// Static column configuration
interface ColumnConfigType {
  id: string;
  title: string;
  position: number;
  color?: string;
  limit?: number;
}

// Kanban card with custom fields
type KanbanCardType<T = Record<string, any>> = {
  _id: string;
  title: string;
  columnId: string;
  position: number;
  _created_at?: Date;
  _modified_at?: Date;
} & T;

// Kanban column with cards
interface KanbanColumnType<T = Record<string, any>> {
  _id: string;
  title: string;
  position: number;
  cards: KanbanCardType<T>[];
  color?: string;
  limit?: number;
}

// Hook options
interface UseKanbanOptionsType<T> {
  source: string;
  columns: ColumnConfigType[];
  enableDragDrop?: boolean;
  enableFiltering?: boolean;
  enableSearch?: boolean;
  initialState?: {
    filters?: Array<ConditionType | ConditionGroupType>;
    filterOperator?: ConditionGroupOperatorType;
    search?: string;
  };
  onCardMove?: (card: KanbanCardType<T>, fromColumnId: string, toColumnId: string) => void;
  onCardCreate?: (card: KanbanCardType<T>) => void;
  onCardUpdate?: (card: KanbanCardType<T>) => void;
  onCardDelete?: (cardId: string) => void;
  onError?: (error: Error) => void;
}

// Hook return type
interface UseKanbanReturnType<T> {
  // Data
  columns: KanbanColumnType<T>[];
  totalCards: number;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  error: Error | null;

  // Card operations
  createCard: (card: Partial<KanbanCardType<T>> & { columnId: string }) => Promise<string>;
  updateCard: (id: string, updates: Partial<KanbanCardType<T>>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, position?: number) => Promise<void>;
  reorderCards: (cardIds: string[], columnId: string) => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  clearSearch: () => void;

  // Filter (uses useFilter internally)
  filter: UseFilterReturnType;

  // Drag drop state
  isDragging: boolean;
  draggedCard: KanbanCardType<T> | null;
  dragOverColumn: string | null;

  // Prop getters
  getCardProps: (card: KanbanCardType<T>) => {
    draggable: boolean;
    role: string;
    "aria-selected": boolean;
    "aria-grabbed": boolean;
    onDragStart: (e: any) => void;
    onDragEnd: () => void;
    onKeyDown: (e: any) => void;
  };
  getColumnProps: (columnId: string) => {
    "data-column-id": string;
    role: string;
    onDragOver: (e: any) => void;
    onDrop: (e: any) => void;
  };

  // Utilities
  refetch: () => Promise<void>;
  loadMore: (columnId: string) => void;
}
```

## Usage Example

```tsx
import { useKanban } from "@ram_28/kf-ai-sdk/kanban";
import { isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";
import type {
  UseKanbanOptionsType,
  UseKanbanReturnType,
  KanbanCardType,
  KanbanColumnType,
  ColumnConfigType,
} from "@ram_28/kf-ai-sdk/kanban/types";
import type {
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  UseFilterReturnType,
} from "@ram_28/kf-ai-sdk/filter/types";
import { ProductRestocking, ProductRestockingType } from "../sources";
import { Roles } from "../sources/roles";

// Get the typed restocking record for the InventoryManager role
type RestockingRecord = ProductRestockingType<typeof Roles.InventoryManager>;

// Define custom card fields that extend the base KanbanCardType
interface RestockingCardData {
  productTitle: string;
  productSKU: string;
  currentStock: number;
  quantityOrdered: number;
  warehouse: "Warehouse_A" | "Warehouse_B" | "Warehouse_C";
  priority: "Low" | "Medium" | "High" | "Critical";
}

// Full card type with base fields + custom data
type RestockingCard = KanbanCardType<RestockingCardData>;

function InventoryRestockingBoard() {
  // Instantiate the ProductRestocking source with role
  const restocking = new ProductRestocking(Roles.InventoryManager);

  // Static column configurations
  const columnConfigs: ColumnConfigType[] = [
    { id: "LowStockAlert", title: "Low Stock Alert", position: 0, color: "red" },
    { id: "OrderPlaced", title: "Order Placed", position: 1, color: "yellow" },
    { id: "InTransit", title: "In Transit", position: 2, color: "blue" },
    { id: "Received", title: "Received & Restocked", position: 3, color: "green", limit: 20 },
  ];

  // Hook configuration with full options
  const options: UseKanbanOptionsType<RestockingCardData> = {
    source: restocking._id, // Use the Business Object ID from the source class
    columns: columnConfigs,
    enableDragDrop: true,
    enableFiltering: true,
    enableSearch: true,
    initialState: {
      filterOperator: "And",
    },
    onCardMove: (card: RestockingCard, fromColumnId: string, toColumnId: string) => {
      console.log(`Moved "${card.productTitle}" from ${fromColumnId} to ${toColumnId}`);
    },
    onCardCreate: (card: RestockingCard) => console.log("Created:", card.productTitle),
    onCardUpdate: (card: RestockingCard) => console.log("Updated:", card._id),
    onCardDelete: (cardId: string) => console.log("Deleted:", cardId),
    onError: (error: Error) => console.error("Kanban error:", error.message),
  };

  const kanban: UseKanbanReturnType<RestockingCardData> = useKanban<RestockingCardData>(options);

  // Access filter state (UseFilterReturnType)
  const filterState: UseFilterReturnType = kanban.filter;

  // Create a new card
  const handleCreateCard = async (columnId: string) => {
    const cardId: string = await kanban.createCard({
      columnId,
      title: "New Restock Task",
      productTitle: "Sample Product",
      productSKU: "SKU-001",
      currentStock: 5,
      quantityOrdered: 50,
      warehouse: "Warehouse_A",
      priority: "High",
    });
    console.log("Created card with id:", cardId);
  };

  // Update card priority
  const handleUpdatePriority = async (card: RestockingCard, priority: RestockingCardData["priority"]) => {
    await kanban.updateCard(card._id, { priority });
  };

  // Delete a card
  const handleDeleteCard = async (cardId: string) => {
    await kanban.deleteCard(cardId);
  };

  // Move card between columns
  const handleMoveCard = async (cardId: string, toColumnId: string) => {
    await kanban.moveCard(cardId, toColumnId);
  };

  // Filter by priority
  const filterByPriority = (priority: string) => {
    kanban.filter.clear();
    if (priority !== "all") {
      kanban.filter.add({
        Operator: "EQ",
        LHSField: "priority",
        RHSValue: priority,
      });
    }
  };

  // Add complex filter (Critical OR High priority)
  const addUrgentFilter = () => {
    const groupId = kanban.filter.addGroup("Or");
    kanban.filter.addTo(groupId, {
      Operator: "EQ",
      LHSField: "priority",
      RHSValue: "Critical",
    });
    kanban.filter.addTo(groupId, {
      Operator: "EQ",
      LHSField: "priority",
      RHSValue: "High",
    });
  };

  // Render active filters using type guards
  const renderActiveFilters = () => (
    <div className="active-filters">
      {kanban.filter.items.map((item) => {
        if (isCondition(item)) {
          return (
            <span key={item.id} className="filter-tag">
              {item.LHSField} {item.Operator} {String(item.RHSValue)}
              <button onClick={() => kanban.filter.remove(item.id!)}>×</button>
            </span>
          );
        }
        if (isConditionGroup(item)) {
          return (
            <span key={item.id} className="filter-group-tag">
              {item.Operator} Group ({item.Condition.length})
              <button onClick={() => kanban.filter.remove(item.id!)}>×</button>
            </span>
          );
        }
        return null;
      })}
    </div>
  );

  // Get filter payload for debugging
  const getFilterPayload = (): FilterType | undefined => {
    return kanban.filter.payload;
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
    <div className="kanban-board">
      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={kanban.searchQuery}
          onChange={(e) => kanban.setSearchQuery(e.target.value)}
        />
        <button onClick={kanban.clearSearch}>Clear</button>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <button onClick={() => filterByPriority("Critical")}>Critical</button>
        <button onClick={() => filterByPriority("High")}>High</button>
        <button onClick={addUrgentFilter}>Urgent (Critical OR High)</button>
        <button onClick={() => filterByPriority("all")}>All</button>
        {kanban.filter.hasConditions && (
          <button onClick={() => kanban.filter.clear()}>Clear Filters</button>
        )}
        <span>Logic: {kanban.filter.operator}</span>
      </div>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Board Stats */}
      <div className="board-stats">
        <span>Total cards: {kanban.totalCards}</span>
        {kanban.isDragging && (
          <span>Dragging: {kanban.draggedCard?.productTitle}</span>
        )}
        {kanban.isUpdating && <span>Updating...</span>}
      </div>

      {/* Kanban Columns */}
      <div className="columns-container">
        {kanban.columns.map((column: KanbanColumnType<RestockingCardData>) => (
          <div
            key={column._id}
            className={`column ${kanban.dragOverColumn === column._id ? "drag-over" : ""}`}
            style={{ backgroundColor: column.color }}
            {...kanban.getColumnProps(column._id)}
          >
            {/* Column Header */}
            <div className="column-header">
              <h3>{column.title}</h3>
              <span>
                {column.cards.length}
                {column.limit && ` / ${column.limit}`}
              </span>
              <button onClick={() => handleCreateCard(column._id)}>+ Add</button>
            </div>

            {/* Cards */}
            <div className="cards-container">
              {column.cards.map((card: RestockingCard) => (
                <div
                  key={card._id}
                  className={`card ${kanban.draggedCard?._id === card._id ? "dragging" : ""}`}
                  {...kanban.getCardProps(card)}
                >
                  <div className="card-header">
                    <span className={`priority-badge ${card.priority.toLowerCase()}`}>
                      {card.priority}
                    </span>
                    <button onClick={() => handleDeleteCard(card._id)}>×</button>
                  </div>
                  <h4>{card.productTitle}</h4>
                  <p>SKU: {card.productSKU}</p>
                  <p>Stock: {card.currentStock} / Ordered: {card.quantityOrdered}</p>
                  <p>Warehouse: {card.warehouse}</p>
                  <div className="card-actions">
                    <button onClick={() => handleUpdatePriority(card, "Critical")}>
                      Set Critical
                    </button>
                    <button onClick={() => handleMoveCard(card._id, "Received")}>
                      Mark Received
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {column.cards.length >= 10 && (
              <button
                className="load-more"
                onClick={() => kanban.loadMore(column._id)}
              >
                Load More
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Board Actions */}
      <div className="board-actions">
        <button onClick={() => kanban.refetch()} disabled={kanban.isFetching}>
          {kanban.isFetching ? "Refreshing..." : "Refresh Board"}
        </button>
      </div>

      {/* Debug: Filter payload */}
      <details>
        <summary>Filter Payload (Debug)</summary>
        <pre>{JSON.stringify(getFilterPayload(), null, 2)}</pre>
      </details>
    </div>
  );
}
```
