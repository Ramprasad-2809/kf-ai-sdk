# Kanban SDK Documentation

## Overview

The Kanban SDK provides a complete kanban board solution that integrates seamlessly with your backend API. It follows the same patterns as the existing `useTable` and `useForm` hooks, providing a familiar developer experience with full TypeScript support.

## Features

- 🔧 **Backend-First**: All operations sync with your API using existing patterns
- 🎯 **Type Safety**: Generic types for cards and columns with full TypeScript support
- 🚀 **Optimistic Updates**: Immediate UI feedback with background synchronization
- 🔄 **Error Recovery**: Automatic rollback of failed operations
- 🔍 **Filtering & Search**: Leverage existing filter system for cards and columns
- ♿ **Accessibility**: Full keyboard navigation and screen reader support
- 🎨 **Customizable**: Support for custom card/column fields via schema system
- 📱 **Touch Support**: Works on mobile devices with touch interactions

## Quick Start

### Basic Usage

```typescript
import { useKanban } from '@your-org/kf-ai-sdk';

interface TaskCard {
  _id: string;
  title: string;
  description: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

function ProjectBoard() {
  const kanban = useKanban<TaskCard>({
    source: "task-board",
    cardSource: "task",
    columnSource: "column",
    columns: [
      { fieldId: "title", label: "Task Title" },
      { fieldId: "assignee", label: "Assigned To" },
      { fieldId: "priority", label: "Priority" },
      { fieldId: "dueDate", label: "Due Date" }
    ],
    enableDragDrop: true,
    enableFiltering: true,
    onCardMove: (card, fromColumn, toColumn) => {
      console.log(`Moved ${card.title} from ${fromColumn} to ${toColumn}`);
    },
    onError: (error) => {
      console.error("Kanban error:", error);
    }
  });

  if (kanban.isLoading) {
    return <div>Loading board...</div>;
  }

  return (
    <div className="kanban-container">
      {kanban.columns.map(column => (
        <div key={column._id} className="kanban-column">
          <h3>{column.title} ({column.cards.length})</h3>
          
          {/* Column cards */}
          {column.cards.map(card => (
            <div 
              key={card._id} 
              className="kanban-card"
              draggable
              onDragStart={(e) => kanban.dragDrop.handleDragStart(e, card)}
            >
              <h4>{card.title}</h4>
              <p>{card.description}</p>
              <span className={`priority-${card.priority}`}>
                {card.priority}
              </span>
            </div>
          ))}
          
          {/* Add new card */}
          <button onClick={() => kanban.cards.create({
            title: "New Task",
            description: "",
            priority: "medium",
            columnId: column._id
          })}>
            + Add Card
          </button>
        </div>
      ))}
      
      {/* Add new column */}
      <button onClick={() => kanban.columns.create({
        title: "New Column",
        position: kanban.columns.length
      })}>
        + Add Column
      </button>
    </div>
  );
}
```

## API Reference

### useKanban Hook

#### Options

```typescript
interface UseKanbanOptions<T> {
  /** Main data source identifier */
  source: string;
  
  /** Card entity source (defaults to source + "_card") */
  cardSource?: string;
  
  /** Column entity source (defaults to source + "_column") */
  columnSource?: string;
  
  /** Column definitions for display and behavior */
  columns: ColumnDefinition<T>[];
  
  /** Enable drag and drop functionality */
  enableDragDrop?: boolean;
  
  /** Enable filtering functionality */
  enableFiltering?: boolean;
  
  /** Enable search functionality */
  enableSearch?: boolean;
  
  /** Field definitions for card validation */
  cardFieldDefinitions?: Record<keyof T, FieldDefinition>;
  
  /** Initial state */
  initialState?: {
    filters?: FilterConditionWithId[];
    search?: string;
    columnOrder?: string[];
  };
  
  /** Callbacks */
  onCardMove?: (card: T, fromColumnId: string, toColumnId: string) => void;
  onCardCreate?: (card: T) => void;
  onCardUpdate?: (card: T) => void;
  onCardDelete?: (cardId: string) => void;
  onColumnCreate?: (column: KanbanColumn<T>) => void;
  onColumnUpdate?: (column: KanbanColumn<T>) => void;
  onColumnDelete?: (columnId: string) => void;
  onError?: (error: Error) => void;
}
```

#### Return Value

```typescript
interface UseKanbanReturn<T> {
  // Data
  columns: KanbanColumn<T>[];
  totalCards: number;
  
  // Loading States
  isLoading: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  
  // Error Handling
  error: Error | null;
  
  // Column Operations
  columns: {
    create: (column: Partial<KanbanColumn<T>>) => Promise<string>;
    update: (id: string, updates: Partial<KanbanColumn<T>>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    reorder: (columnIds: string[]) => Promise<void>;
  };
  
  // Card Operations
  cards: {
    create: (card: Partial<T> & { columnId: string }) => Promise<string>;
    update: (id: string, updates: Partial<T>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    move: (cardId: string, toColumnId: string, position?: number) => Promise<void>;
    reorder: (cardIds: string[], columnId: string) => Promise<void>;
  };
  
  // Search
  search: {
    query: string;
    setQuery: (value: string) => void;
    clear: () => void;
  };
  
  // Filtering (Advanced)
  filter: {
    conditions: FilterConditionWithId[];
    logicalOperator: "AND" | "OR";
    isValid: boolean;
    validationErrors: ValidationError[];
    hasConditions: boolean;
    addCondition: (condition: Omit<FilterConditionWithId, "id" | "isValid">) => string;
    updateCondition: (id: string, updates: Partial<FilterConditionWithId>) => boolean;
    removeCondition: (id: string) => boolean;
    clearConditions: () => void;
    setLogicalOperator: (operator: "AND" | "OR") => void;
  };
  
  // Drag & Drop
  dragDrop: {
    isDragging: boolean;
    draggedCard: T | null;
    handleDragStart: (event: DragEvent, card: T) => void;
    handleDragOver: (event: DragEvent) => void;
    handleDrop: (event: DragEvent, columnId: string) => void;
    handleDragEnd: () => void;
  };
  
  // Operations
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

### Data Structures

#### Card Interface

```typescript
interface KanbanCard<T = any> extends T {
  _id: string;
  columnId: string;
  position: number;
  title: string;
  _created_at?: Date;
  _modified_at?: Date;
}
```

#### Column Interface

```typescript
interface KanbanColumn<T = any> {
  _id: string;
  title: string;
  position: number;
  cards: KanbanCard<T>[];
  color?: string;
  limit?: number;
  _created_at?: Date;
  _modified_at?: Date;
}
```

## Advanced Usage

### Custom Card Fields with Validation

```typescript
interface BugCard {
  _id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  estimatedHours: number;
  tags: string[];
}

const bugBoard = useKanban<BugCard>({
  source: "bug-tracker",
  columns: [
    { fieldId: "title", label: "Title", enableSorting: true },
    { fieldId: "severity", label: "Severity", enableFiltering: true },
    { fieldId: "assignee", label: "Assigned To", enableFiltering: true },
    { fieldId: "estimatedHours", label: "Hours" }
  ],
  cardFieldDefinitions: {
    title: { type: "string", required: true, minLength: 3 },
    description: { type: "string", required: true, minLength: 10 },
    severity: { 
      type: "select", 
      required: true,
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" }
      ]
    },
    assignee: { type: "string", required: true },
    estimatedHours: { type: "number", min: 0.5, max: 40 }
  },
  onCardMove: (card, fromColumnId, toColumnId) => {
    // Custom logic when moving cards
    if (toColumnId === "done" && card.severity === "critical") {
      console.log("Critical bug resolved!");
    }
  }
});
```

### Filtering and Search

```typescript
function FilteredKanbanBoard() {
  const kanban = useKanban<TaskCard>({
    source: "project-tasks",
    enableFiltering: true,
    enableSearch: true,
    initialState: {
      filters: [
        {
          field: "assignee",
          operator: "EQ",
          value: "john.doe",
          isValid: true
        }
      ],
      search: "urgent"
    }
  });
  
  return (
    <div>
      {/* Search */}
      <input 
        value={kanban.search.query}
        onChange={(e) => kanban.search.setQuery(e.target.value)}
        placeholder="Search cards..."
      />
      
      {/* Add filter */}
      <button onClick={() => kanban.filter.addCondition({
        field: "priority",
        operator: "EQ",
        value: "high"
      })}>
        Filter by High Priority
      </button>
      
      {/* Board display */}
      <div className="kanban-board">
        {kanban.columns.map(column => (
          <div key={column._id}>
            <h3>{column.title}</h3>
            {column.cards.map(card => (
              <div key={card._id}>{card.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Real-time Updates with Optimistic UI

```typescript
function InteractiveKanban() {
  const kanban = useKanban<TaskCard>({
    source: "team-board",
    enableDragDrop: true,
    onCardMove: async (card, fromColumnId, toColumnId) => {
      try {
        // Optimistic update happens automatically
        console.log(`Moving ${card.title}`);
      } catch (error) {
        // Error handling and rollback automatic
        console.error("Failed to move card:", error);
      }
    }
  });
  
  const handleQuickAdd = async (columnId: string) => {
    try {
      const cardId = await kanban.cards.create({
        title: "Quick Task",
        description: "",
        columnId,
        priority: "medium"
      });
      console.log("Card created:", cardId);
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  };
  
  return (
    <div className="kanban-board">
      {kanban.columns.map(column => (
        <div 
          key={column._id}
          className="kanban-column"
          onDragOver={kanban.dragDrop.handleDragOver}
          onDrop={(e) => kanban.dragDrop.handleDrop(e, column._id)}
        >
          <h3>{column.title}</h3>
          
          {column.cards.map(card => (
            <div 
              key={card._id}
              className="kanban-card"
              draggable={kanban.dragDrop.isDragging}
              onDragStart={(e) => kanban.dragDrop.handleDragStart(e, card)}
            >
              {card.title}
              <button onClick={() => kanban.cards.delete(card._id)}>
                Delete
              </button>
            </div>
          ))}
          
          <button onClick={() => handleQuickAdd(column._id)}>
            + Quick Add
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Backend Integration

### Expected API Endpoints

Your backend should provide these endpoints for full kanban functionality:

```
// Column operations
POST /column/list     - Get columns with optional filtering
POST /column/create   - Create new column
POST /column/{id}/update - Update column
DELETE /column/{id}/delete - Delete column

// Card operations  
POST /card/list       - Get cards with filtering (by columnId)
POST /card/create     - Create new card
POST /card/{id}/update - Update card (including columnId for moves)
DELETE /card/{id}/delete - Delete card

// Bulk operations (optional)
POST /column/reorder  - Reorder multiple columns
POST /card/reorder    - Reorder multiple cards within column
```

### Data Models

Your backend entities should follow this structure:

```typescript
// Column entity
{
  _id: string;
  title: string;
  position: number;
  color?: string;
  limit?: number;
  boardId?: string; // Optional: if you have multiple boards
  _created_at: Date;
  _modified_at: Date;
}

// Card entity
{
  _id: string;
  title: string;
  description?: string;
  columnId: string; // Foreign key to column
  position: number;
  // ... your custom fields
  _created_at: Date;
  _modified_at: Date;
}
```

## Error Handling

The kanban hook provides comprehensive error handling:

```typescript
const kanban = useKanban<TaskCard>({
  source: "project-board",
  onError: (error) => {
    if (error.message.includes("network")) {
      // Handle network errors
      showToast("Network error - changes may not be saved");
    } else if (error.message.includes("validation")) {
      // Handle validation errors
      showToast("Invalid data provided");
    }
  }
});

// Check for errors in component
if (kanban.error) {
  return <ErrorDisplay error={kanban.error} />;
}
```

## Accessibility

The kanban SDK follows accessibility best practices:

- **Keyboard Navigation**: Full keyboard support for drag/drop
- **Screen Readers**: Proper ARIA labels and announcements
- **Focus Management**: Logical tab order and focus indicators
- **High Contrast**: Works with high contrast themes

```typescript
// Keyboard event handling built-in
const kanban = useKanban<TaskCard>({
  source: "accessible-board",
  enableDragDrop: true,
  // Accessibility features enabled by default
});
```

## Performance Considerations

- **Optimistic Updates**: UI responds immediately to user actions
- **Debounced API Calls**: Prevents excessive network requests
- **Virtual Scrolling**: Handles large numbers of cards efficiently
- **Memoization**: Prevents unnecessary re-renders

## Migration from Other Solutions

If migrating from an existing kanban implementation:

1. **Data Structure**: Map your existing data to the expected format
2. **API Endpoints**: Implement the required endpoints in your backend
3. **Custom Fields**: Define field definitions for validation
4. **Event Handlers**: Replace existing drag/drop logic with hook methods

## Examples

See the `/examples` directory for complete implementation examples:

- `examples/kanban-basic/` - Simple task board
- `examples/kanban-advanced/` - Complex project management board
- `examples/kanban-realtime/` - Real-time collaborative board