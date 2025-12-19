# Kanban SDK Implementation Plan

## Overview
This document outlines the step-by-step implementation of the Kanban SDK, following the established patterns of `useTable` and `useForm` hooks in the existing codebase.

## File Structure

```
sdk/
├── components/hooks/
│   ├── useKanban/
│   │   ├── index.ts                    # Main export
│   │   ├── types.ts                    # TypeScript interfaces
│   │   ├── useKanban.ts               # Main hook implementation
│   │   ├── apiClient.ts               # Backend API integration
│   │   ├── dragDropManager.ts         # Drag & drop functionality
│   │   ├── stateManager.ts            # State management utilities
│   │   └── validation.ts              # Data validation
│   ├── useKanban.ts                   # Re-export for convenience
│   └── index.ts                       # Updated to include useKanban
└── index.ts                           # Updated main export
```

## Implementation Steps

### Phase 1: Core Types and Interfaces

#### 1.1 Create `sdk/components/hooks/useKanban/types.ts`

**Key Interfaces:**
- `KanbanCard<T>` - Generic card with user-defined fields
- `KanbanColumn<T>` - Column containing typed cards
- `UseKanbanOptions<T>` - Hook configuration options
- `UseKanbanReturn<T>` - Hook return interface
- `DragDropState` - Drag and drop state management
- `ColumnDefinition<T>` - Column display configuration

**Backend Integration Types:**
- `CardApiResponse<T>` - API response format for cards
- `ColumnApiResponse<T>` - API response format for columns  
- `MoveCardRequest` - API request for card movement
- `ReorderRequest` - API request for reordering

### Phase 1: Core Architecture

#### 1.2 Create `sdk/components/hooks/useKanban/apiClient.ts`

**Functions to implement:**
```typescript
// Column operations
fetchColumns(source: string, options?: ListOptions): Promise<KanbanColumn<T>[]>
createColumn(source: string, column: Partial<KanbanColumn<T>>): Promise<string>
updateColumn(source: string, id: string, updates: Partial<KanbanColumn<T>>): Promise<void>
deleteColumn(source: string, id: string): Promise<void>
reorderColumns(source: string, columnIds: string[]): Promise<void>

// Card operations
fetchCards(source: string, options?: ListOptions): Promise<KanbanCard<T>[]>
createCard(source: string, card: Partial<KanbanCard<T>>): Promise<string>
updateCard(source: string, id: string, updates: Partial<KanbanCard<T>>): Promise<void>
deleteCard(source: string, id: string): Promise<void>
moveCard(source: string, cardId: string, toColumnId: string, position?: number): Promise<void>
reorderCards(source: string, cardIds: string[], columnId: string): Promise<void>
```

**Integration Points:**
- Use existing `api<T>(source)` client
- Follow `ListOptions` and `Filter` patterns from useTable
- Handle `DateTimeEncoded` and `DateEncoded` responses
- Implement optimistic updates with rollback capability

#### 1.3 Create `sdk/components/hooks/useKanban/stateManager.ts`

**State Management Functions:**
```typescript
// Column state management
addColumnOptimistic(columns: KanbanColumn<T>[], newColumn: KanbanColumn<T>): KanbanColumn<T>[]
updateColumnOptimistic(columns: KanbanColumn<T>[], id: string, updates: Partial<KanbanColumn<T>>): KanbanColumn<T>[]
removeColumnOptimistic(columns: KanbanColumn<T>[], id: string): KanbanColumn<T>[]
reorderColumnsOptimistic(columns: KanbanColumn<T>[], columnIds: string[]): KanbanColumn<T>[]

// Card state management  
addCardOptimistic(columns: KanbanColumn<T>[], card: KanbanCard<T>): KanbanColumn<T>[]
updateCardOptimistic(columns: KanbanColumn<T>[], cardId: string, updates: Partial<KanbanCard<T>>): KanbanColumn<T>[]
removeCardOptimistic(columns: KanbanColumn<T>[], cardId: string): KanbanColumn<T>[]
moveCardOptimistic(columns: KanbanColumn<T>[], cardId: string, toColumnId: string, position?: number): KanbanColumn<T>[]
reorderCardsOptimistic(columns: KanbanColumn<T>[], cardIds: string[], columnId: string): KanbanColumn<T>[]

// Error recovery
rollbackState<T>(previousState: T, erroredState: T): T
createStateSnapshot<T>(state: T): T
```

### Phase 2: Drag & Drop System

#### 2.1 Create `sdk/components/hooks/useKanban/dragDropManager.ts`

**Drag & Drop Implementation:**
```typescript
interface DragDropManager<T> {
  // State
  isDragging: boolean;
  draggedCard: KanbanCard<T> | null;
  dragOverColumn: string | null;
  dragOverPosition: number | null;
  
  // Event handlers
  handleDragStart: (event: DragEvent, card: KanbanCard<T>) => void;
  handleDragOver: (event: DragEvent, columnId?: string) => void;
  handleDrop: (event: DragEvent, columnId: string) => void;
  handleDragEnd: () => void;
  
  // Keyboard support
  handleKeyDown: (event: KeyboardEvent, card: KanbanCard<T>) => void;
  
  // Touch support
  handleTouchStart: (event: TouchEvent, card: KanbanCard<T>) => void;
  handleTouchMove: (event: TouchEvent) => void;
  handleTouchEnd: (event: TouchEvent) => void;
  
  // Accessibility
  announceMove: (card: KanbanCard<T>, fromColumn: string, toColumn: string) => void;
}
```

**Features:**
- Mouse and touch drag support
- Keyboard navigation (arrow keys + space/enter)
- Auto-scroll when dragging near container edges
- Visual feedback for drop zones
- Accessibility announcements
- Prevention of invalid drops

### Phase 3: Main Hook Implementation

#### 3.1 Create `sdk/components/hooks/useKanban/useKanban.ts`

**Core Hook Structure:**
```typescript
export function useKanban<T extends Record<string, any> = Record<string, any>>(
  options: UseKanbanOptions<T>
): UseKanbanReturn<T>
```

**State Management:**
- Primary state: `columns: KanbanColumn<T>[]`
- Loading states: `isLoading`, `isFetching`, `isUpdating`
- Error handling: `error`, `rollbackError`
- Filter integration: Use existing `useFilter` hook
- Search state: `searchQuery`, `searchResults`

**React Query Integration:**
```typescript
// Columns query
const { data: columns, isLoading: isLoadingColumns, error: columnError, refetch: refetchColumns } = useQuery({
  queryKey: ["kanban-columns", options.columnSource || `${options.source}_column`, apiOptions],
  queryFn: () => fetchColumns(options.columnSource || `${options.source}_column`, apiOptions),
  staleTime: 30 * 1000, // 30 seconds
});

// Cards query  
const { data: cards, isLoading: isLoadingCards, error: cardError, refetch: refetchCards } = useQuery({
  queryKey: ["kanban-cards", options.cardSource || `${options.source}_card`, apiOptions],
  queryFn: () => fetchCards(options.cardSource || `${options.source}_card`, apiOptions),
  staleTime: 30 * 1000, // 30 seconds
});
```

**Mutation Setup:**
```typescript
// Column mutations
const createColumnMutation = useMutation({ mutationFn: createColumn, onSuccess: refetchColumns });
const updateColumnMutation = useMutation({ mutationFn: updateColumn, onSuccess: refetchColumns });
const deleteColumnMutation = useMutation({ mutationFn: deleteColumn, onSuccess: refetchColumns });

// Card mutations
const createCardMutation = useMutation({ mutationFn: createCard, onSuccess: refetchCards });
const updateCardMutation = useMutation({ mutationFn: updateCard, onSuccess: refetchCards });
const deleteCardMutation = useMutation({ mutationFn: deleteCard, onSuccess: refetchCards });
const moveCardMutation = useMutation({ mutationFn: moveCard, onSuccess: refetchCards });
```

**Return Object Structure:**
```typescript
return {
  // Data
  columns: processedColumns,
  totalCards,
  
  // Loading states
  isLoading: isLoadingColumns || isLoadingCards,
  isFetching: isFetchingColumns || isFetchingCards,
  isUpdating: isAnyMutationPending,
  
  // Error handling
  error: columnError || cardError,
  
  // Column operations
  columns: {
    create: createColumnMutation.mutateAsync,
    update: updateColumnMutation.mutateAsync,
    delete: deleteColumnMutation.mutateAsync,
    reorder: reorderColumnsMutation.mutateAsync,
  },
  
  // Card operations
  cards: {
    create: createCardMutation.mutateAsync,
    update: updateCardMutation.mutateAsync,
    delete: deleteCardMutation.mutateAsync,
    move: moveCardMutation.mutateAsync,
    reorder: reorderCardsMutation.mutateAsync,
  },
  
  // Search functionality
  search: {
    query: searchQuery,
    setQuery: setSearchQuery,
    clear: clearSearch,
  },
  
  // Filter functionality (from useFilter hook)
  filter: filterHook,
  
  // Drag & drop
  dragDrop: dragDropManager,
  
  // Operations
  refetch: async () => {
    await Promise.all([refetchColumns(), refetchCards()]);
  },
  refresh: () => queryClient.invalidateQueries(['kanban']),
};
```

### Phase 4: Validation and Error Handling

#### 4.1 Create `sdk/components/hooks/useKanban/validation.ts`

**Validation Functions:**
```typescript
// Card validation
validateCard<T>(card: Partial<KanbanCard<T>>, fieldDefinitions?: Record<keyof T, FieldDefinition>): ValidationResult;
validateCardMove<T>(card: KanbanCard<T>, toColumnId: string, columns: KanbanColumn<T>[]): ValidationResult;

// Column validation
validateColumn<T>(column: Partial<KanbanColumn<T>>): ValidationResult;
validateColumnLimit<T>(column: KanbanColumn<T>, newCardCount: number): ValidationResult;

// Position validation
validatePosition(position: number, maxPosition: number): ValidationResult;
calculateOptimalPosition(cards: KanbanCard<any>[], insertIndex?: number): number;

// Bulk operation validation
validateBulkMove<T>(cardIds: string[], toColumnId: string, columns: KanbanColumn<T>[]): ValidationResult;
validateReorder(itemIds: string[], existingItems: { _id: string }[]): ValidationResult;
```

**Error Recovery:**
- Automatic rollback on API failures
- Conflict resolution for concurrent edits
- Data consistency checks
- User-friendly error messages

### Phase 5: Integration and Export

#### 5.1 Update `sdk/components/hooks/useKanban/index.ts`

```typescript
export { useKanban } from './useKanban';
export type {
  UseKanbanOptions,
  UseKanbanReturn,
  KanbanCard,
  KanbanColumn,
  ColumnDefinition,
  DragDropState,
} from './types';
```

#### 5.2 Update `sdk/components/hooks/useKanban.ts`

```typescript
// Re-export for convenience
export { useKanban } from './useKanban';
export type {
  UseKanbanOptions,
  UseKanbanReturn,
  KanbanCard,
  KanbanColumn,
  ColumnDefinition,
} from './useKanban/types';
```

#### 5.3 Update `sdk/components/hooks/index.ts`

```typescript
// Existing exports...
export { useTable } from './useTable';
export { useForm } from './useForm';

// Add kanban
export { useKanban } from './useKanban';
export type {
  UseKanbanOptions,
  UseKanbanReturn,
  KanbanCard,
  KanbanColumn,
  ColumnDefinition,
} from './useKanban';
```

#### 5.4 Update `sdk/index.ts`

```typescript
// Core SDK exports (existing)
export * from './types';
export * from './api';
export * from './utils';
export * from './components';

// Ensure kanban is included in components export
```

## Testing Strategy

### Unit Tests
- Individual function testing for API client
- State management function testing
- Validation function testing
- Drag & drop event handling

### Integration Tests
- Full hook behavior testing
- API integration testing
- Error handling and rollback testing
- Optimistic update testing

### E2E Tests
- Complete user workflow testing
- Drag and drop interaction testing
- Accessibility testing
- Cross-browser compatibility

## Performance Considerations

### Optimization Strategies
1. **Memoization**: Memoize expensive computations (column/card processing)
2. **Virtual Scrolling**: For large numbers of cards
3. **Debounced Updates**: Prevent excessive API calls during rapid interactions
4. **Optimistic Updates**: Immediate UI feedback with background sync
5. **Selective Re-renders**: Only re-render affected components

### Memory Management
- Cleanup event listeners on unmount
- Cancel in-flight API requests on unmount
- Debounce search and filter operations
- Limit query cache size

## Accessibility Requirements

### Keyboard Support
- Tab navigation through cards and columns
- Arrow key navigation within columns
- Space/Enter to start drag operation
- Escape to cancel drag operation

### Screen Reader Support
- Proper ARIA labels and descriptions
- Live region announcements for moves
- Role definitions for kanban elements
- Focus management during interactions

### Visual Accessibility
- High contrast mode support
- Focus indicators
- Color-blind friendly design
- Reduced motion respect

## API Backend Requirements

### Expected Endpoints
The backend must provide these endpoints following your existing API patterns:

```
Column Operations:
POST /{columnSource}/list
POST /{columnSource}/create  
POST /{columnSource}/{id}/update
DELETE /{columnSource}/{id}/delete

Card Operations:
POST /{cardSource}/list
POST /{cardSource}/create
POST /{cardSource}/{id}/update  
DELETE /{cardSource}/{id}/delete
```

### Data Schema
```sql
-- Columns table
CREATE TABLE columns (
  _id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  position INTEGER NOT NULL,
  color VARCHAR,
  card_limit INTEGER,
  board_id VARCHAR,
  _created_at TIMESTAMP,
  _modified_at TIMESTAMP
);

-- Cards table  
CREATE TABLE cards (
  _id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  column_id VARCHAR REFERENCES columns(_id),
  position INTEGER NOT NULL,
  -- custom fields...
  _created_at TIMESTAMP,
  _modified_at TIMESTAMP
);
```

## Rollout Plan

### Phase 1: Core Implementation (Week 1-2)
- Implement basic types and interfaces
- Create API client with CRUD operations
- Implement basic useKanban hook
- Basic state management

### Phase 2: Advanced Features (Week 2-3)
- Implement drag & drop functionality
- Add filtering and search integration
- Implement optimistic updates
- Error handling and rollback

### Phase 3: Polish and Testing (Week 3-4)
- Comprehensive testing suite
- Performance optimization
- Accessibility implementation
- Documentation completion

### Phase 4: Integration (Week 4)
- Update exports and imports
- Create example implementations
- Integration testing with existing codebase
- Performance benchmarking

## Migration Strategy

### For Existing Projects
1. **Assessment**: Identify current kanban implementations
2. **Data Mapping**: Map existing data structures to new schema
3. **API Updates**: Implement required backend endpoints
4. **Gradual Migration**: Replace existing kanban components one by one
5. **Testing**: Comprehensive testing in staging environment
6. **Deployment**: Gradual rollout with monitoring

### Backwards Compatibility
- Support legacy data formats during transition
- Provide migration utilities for data transformation
- Maintain existing API endpoints during migration period

## Success Metrics

### Performance Metrics
- API response times < 200ms for operations
- UI responsiveness during drag operations
- Memory usage within acceptable limits
- Bundle size impact minimal

### User Experience Metrics
- Drag & drop success rate > 99%
- Accessibility compliance score > 95%
- Error recovery success rate > 90%
- User satisfaction with performance

### Developer Experience Metrics
- Implementation time for new kanban boards
- Code maintainability score
- Documentation completeness
- Community adoption rate