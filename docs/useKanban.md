# useKanban

Kanban board state management with drag-and-drop, card CRUD operations, and filtering.

## Imports

```typescript
import { useKanban } from "@ram_28/kf-ai-sdk/kanban";
import type {
  UseKanbanOptionsType,
  UseKanbanReturnType,
  KanbanCardType,
  KanbanColumnType,
  ColumnConfigType,
} from "@ram_28/kf-ai-sdk/kanban/types";
```

## Type Definitions

```typescript
// Column configuration
interface ColumnConfigType {
  id: string;
  title: string;
  position: number;
  color?: string;
  limit?: number;
}

// Card type with custom fields
type KanbanCardType<T> = {
  _id: string;
  title: string;
  columnId: string;
  position: number;
} & T;

// Column with cards
interface KanbanColumnType<T> {
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
    filter?: UseFilterOptionsType;  // { conditions?, operator? }
    search?: string;
    columnOrder?: string[];
    sorting?: { field: keyof T; direction: "asc" | "desc" };
  };
  onCardMove?: (card, fromColumnId, toColumnId) => void;
  onCardCreate?: (card) => void;
  onCardUpdate?: (card) => void;
  onCardDelete?: (cardId) => void;
  onError?: (error) => void;
}

// Hook return type
interface UseKanbanReturnType<T> {
  columns: KanbanColumnType<T>[];
  totalCards: number;
  isLoading: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  error: Error | null;

  // Card operations
  createCard: (card) => Promise<string>;
  updateCard: (id, updates) => Promise<void>;
  deleteCard: (id) => Promise<void>;
  moveCard: (cardId, toColumnId, position?) => Promise<void>;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (value) => void;
  filter: UseFilterReturnType;

  // Drag & Drop
  isDragging: boolean;
  draggedCard: KanbanCardType<T> | null;
  getCardProps: (card) => object;
  getColumnProps: (columnId) => object;

  refetch: () => Promise<void>;
}
```

## Basic Example

A minimal kanban board displaying columns and cards.

```tsx
import { useKanban } from "@ram_28/kf-ai-sdk/kanban";
import type { ColumnConfigType, KanbanCardType } from "@ram_28/kf-ai-sdk/kanban/types";

interface TaskData {
  priority: "Low" | "Medium" | "High";
  assignee: string;
}

type Task = KanbanCardType<TaskData>;

function TaskBoard() {
  const columns: ColumnConfigType[] = [
    { id: "todo", title: "To Do", position: 0 },
    { id: "in-progress", title: "In Progress", position: 1 },
    { id: "done", title: "Done", position: 2 },
  ];

  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
  });

  if (kanban.isLoading) return <div>Loading board...</div>;
  if (kanban.error) return <div>Error: {kanban.error.message}</div>;

  return (
    <div className="kanban-board">
      {kanban.columns.map((column) => (
        <div key={column._id} className="column">
          <h3>{column.title} ({column.cards.length})</h3>
          <div className="cards">
            {column.cards.map((card) => (
              <div key={card._id} className="card">
                <h4>{card.title}</h4>
                <span className="priority">{card.priority}</span>
                <span className="assignee">{card.assignee}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Card Operations

### Create Card

Add a new card to a column.

```tsx
function BoardWithCreate() {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
  });

  const handleCreateCard = async (columnId: string) => {
    const cardId = await kanban.createCard({
      columnId,
      title: "New Task",
      priority: "Medium",
      assignee: "Unassigned",
    });
    console.log("Created card:", cardId);
  };

  return (
    <div className="kanban-board">
      {kanban.columns.map((column) => (
        <div key={column._id} className="column">
          <div className="column-header">
            <h3>{column.title}</h3>
            <button onClick={() => handleCreateCard(column._id)}>
              + Add Card
            </button>
          </div>
          {/* cards */}
        </div>
      ))}
    </div>
  );
}
```

### Update Card

Modify an existing card's properties.

```tsx
function CardWithEdit({ card }: { card: Task }) {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
  });

  const handleUpdateTitle = async (newTitle: string) => {
    await kanban.updateCard(card._id, { title: newTitle });
  };

  const handleChangePriority = async (priority: TaskData["priority"]) => {
    await kanban.updateCard(card._id, { priority });
  };

  return (
    <div className="card">
      <input
        defaultValue={card.title}
        onBlur={(e) => handleUpdateTitle(e.target.value)}
      />
      <select
        value={card.priority}
        onChange={(e) => handleChangePriority(e.target.value as TaskData["priority"])}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>
  );
}
```

### Delete Card

Remove a card from the board.

```tsx
function CardWithDelete({ card }: { card: Task }) {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
  });

  const handleDelete = async () => {
    if (confirm(`Delete "${card.title}"?`)) {
      await kanban.deleteCard(card._id);
    }
  };

  return (
    <div className="card">
      <h4>{card.title}</h4>
      <button onClick={handleDelete} className="delete-btn">
        Delete
      </button>
    </div>
  );
}
```

### Move Card Between Columns

Programmatically move a card to a different column.

```tsx
function CardWithMoveActions({ card }: { card: Task }) {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
  });

  const moveTo = async (columnId: string) => {
    await kanban.moveCard(card._id, columnId);
  };

  return (
    <div className="card">
      <h4>{card.title}</h4>
      <div className="move-actions">
        <button onClick={() => moveTo("todo")}>To Do</button>
        <button onClick={() => moveTo("in-progress")}>In Progress</button>
        <button onClick={() => moveTo("done")}>Done</button>
      </div>
    </div>
  );
}
```

---

## Drag and Drop

### Using Prop Getters

Apply drag-and-drop handlers using built-in prop getters.

```tsx
function DraggableBoard() {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
    enableDragDrop: true,
    onCardMove: (card, from, to) => {
      console.log(`Moved "${card.title}" from ${from} to ${to}`);
    },
  });

  return (
    <div className="kanban-board">
      {kanban.columns.map((column) => (
        <div
          key={column._id}
          className={`column ${kanban.dragOverColumn === column._id ? "drag-over" : ""}`}
          {...kanban.getColumnProps(column._id)}
        >
          <h3>{column.title}</h3>
          <div className="cards">
            {column.cards.map((card) => (
              <div
                key={card._id}
                className={`card ${kanban.draggedCard?._id === card._id ? "dragging" : ""}`}
                {...kanban.getCardProps(card)}
              >
                <h4>{card.title}</h4>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Drag State Indicators

Show visual feedback during drag operations.

```tsx
function BoardWithDragIndicators() {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
    enableDragDrop: true,
  });

  return (
    <div className="kanban-board">
      {/* Drag indicator */}
      {kanban.isDragging && (
        <div className="drag-indicator">
          Moving: {kanban.draggedCard?.title}
        </div>
      )}

      {kanban.columns.map((column) => (
        <div
          key={column._id}
          className="column"
          style={{
            backgroundColor: kanban.dragOverColumn === column._id ? "#e3f2fd" : "white",
          }}
          {...kanban.getColumnProps(column._id)}
        >
          <h3>{column.title}</h3>
          <div className="cards">
            {column.cards.map((card) => (
              <div
                key={card._id}
                className="card"
                style={{
                  opacity: kanban.draggedCard?._id === card._id ? 0.5 : 1,
                }}
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

---

## Filtering Cards

### Filter by Priority

Show only cards matching a priority level.

```tsx
function BoardWithPriorityFilter() {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
    enableFiltering: true,
  });

  const filterByPriority = (priority: string) => {
    kanban.filter.clearAllConditions();
    if (priority !== "all") {
      kanban.filter.addCondition({
        Operator: "EQ",
        LHSField: "priority",
        RHSValue: priority,
      });
    }
  };

  return (
    <div>
      <div className="filter-bar">
        <button onClick={() => filterByPriority("all")}>All</button>
        <button onClick={() => filterByPriority("High")}>High Priority</button>
        <button onClick={() => filterByPriority("Medium")}>Medium</button>
        <button onClick={() => filterByPriority("Low")}>Low</button>
      </div>

      {/* board rendering */}
    </div>
  );
}
```

### Filter by Assignee (My Tasks)

Show only cards assigned to the current user.

```tsx
import { useAuth } from "@ram_28/kf-ai-sdk/auth";

function BoardWithMyTasks() {
  const { user } = useAuth();
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
    enableFiltering: true,
  });

  const showMyTasks = () => {
    kanban.filter.clearAllConditions();
    kanban.filter.addCondition({
      Operator: "EQ",
      LHSField: "assignee",
      RHSValue: user._id, // Pass user ID as a string
    });
  };

  const showAllTasks = () => {
    kanban.filter.clearAllConditions();
  };

  return (
    <div>
      <div className="filter-bar">
        <button onClick={showMyTasks}>My Tasks</button>
        <button onClick={showAllTasks}>All Tasks</button>
        {kanban.filter.hasConditions && (
          <span>Filtered: {kanban.totalCards} cards</span>
        )}
      </div>

      {/* board rendering */}
    </div>
  );
}
```

### Combined Filters

Apply multiple filter conditions.

```tsx
function BoardWithCombinedFilters() {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
    enableFiltering: true,
    initialState: {
      filter: {
        operator: "And",
      },
    },
  });

  const applyUrgentFilter = () => {
    kanban.filter.clearAllConditions();

    // High priority OR overdue
    const groupId = kanban.filter.addConditionGroup("Or");
    kanban.filter.addCondition({
      Operator: "EQ",
      LHSField: "priority",
      RHSValue: "High",
    }, groupId);
    kanban.filter.addCondition({
      Operator: "LT",
      LHSField: "dueDate",
      RHSValue: new Date().toISOString(),
    }, groupId);
  };

  return (
    <div>
      <div className="filter-bar">
        <button onClick={applyUrgentFilter}>Urgent Tasks</button>
        <button onClick={() => kanban.filter.clearAllConditions()}>Clear</button>
      </div>

      {/* board rendering */}
    </div>
  );
}
```

---

## Search

### Basic Search

Filter cards by text search.

```tsx
function BoardWithSearch() {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
    enableSearch: true,
  });

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search tasks..."
          value={kanban.searchQuery}
          onChange={(e) => kanban.setSearchQuery(e.target.value)}
        />
        {kanban.searchQuery && (
          <button onClick={kanban.clearSearch}>Clear</button>
        )}
      </div>

      {/* board rendering */}
    </div>
  );
}
```

---

## Column Configuration

### Columns with Limits

Set maximum card limits per column.

```tsx
function BoardWithLimits() {
  const columns: ColumnConfigType[] = [
    { id: "todo", title: "To Do", position: 0 },
    { id: "in-progress", title: "In Progress", position: 1, limit: 5 },
    { id: "review", title: "Review", position: 2, limit: 3 },
    { id: "done", title: "Done", position: 3 },
  ];

  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
  });

  return (
    <div className="kanban-board">
      {kanban.columns.map((column) => {
        const isOverLimit = column.limit && column.cards.length >= column.limit;

        return (
          <div
            key={column._id}
            className={`column ${isOverLimit ? "over-limit" : ""}`}
          >
            <h3>
              {column.title}
              <span className="count">
                {column.cards.length}
                {column.limit && ` / ${column.limit}`}
              </span>
            </h3>
            {/* cards */}
          </div>
        );
      })}
    </div>
  );
}
```

### Colored Columns

Apply colors to columns for visual distinction.

```tsx
function ColoredBoard() {
  const columns: ColumnConfigType[] = [
    { id: "backlog", title: "Backlog", position: 0, color: "#f5f5f5" },
    { id: "todo", title: "To Do", position: 1, color: "#fff3e0" },
    { id: "in-progress", title: "In Progress", position: 2, color: "#e3f2fd" },
    { id: "done", title: "Done", position: 3, color: "#e8f5e9" },
  ];

  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
  });

  return (
    <div className="kanban-board">
      {kanban.columns.map((column) => (
        <div
          key={column._id}
          className="column"
          style={{ backgroundColor: column.color }}
        >
          <h3>{column.title}</h3>
          {/* cards */}
        </div>
      ))}
    </div>
  );
}
```

---

## Event Callbacks

### Track Card Operations

Handle card lifecycle events.

```tsx
function BoardWithCallbacks() {
  const kanban = useKanban<TaskData>({
    source: "BDO_Tasks",
    columns,
    onCardMove: (card, fromColumn, toColumn) => {
      console.log(`Card "${card.title}" moved from ${fromColumn} to ${toColumn}`);

      // Track analytics
      analytics.track("card_moved", {
        cardId: card._id,
        from: fromColumn,
        to: toColumn,
      });
    },
    onCardCreate: (card) => {
      console.log(`Card created: ${card.title}`);
    },
    onCardUpdate: (card) => {
      console.log(`Card updated: ${card._id}`);
    },
    onCardDelete: (cardId) => {
      console.log(`Card deleted: ${cardId}`);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  return (
    <div className="kanban-board">
      {/* board rendering */}
    </div>
  );
}
```
