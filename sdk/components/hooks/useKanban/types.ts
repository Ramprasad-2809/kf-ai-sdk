// ============================================================
// KANBAN SDK - TYPE DEFINITIONS
// ============================================================
// Core TypeScript interfaces for the kanban board functionality
// Following patterns from useTable and useForm

import type {
  FilterConditionWithId,
  ValidationError,
  FieldDefinition,
} from "../useFilter";

// ============================================================
// CORE DATA STRUCTURES
// ============================================================

/**
 * Static column configuration (no CRUD operations)
 * Columns are defined once in the hook configuration
 */
export interface ColumnConfig {
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

/**
 * Base kanban card interface
 * @template T - Custom fields for the card
 */
export type KanbanCard<T = Record<string, any>> = {
  /** Unique identifier */
  _id: string;
  /** Card title */
  title: string;
  /** Column this card belongs to */
  columnId: string;
  /** Position within the column (0-indexed) */
  position: number;
  /** When the card was created */
  _created_at?: Date;
  /** When the card was last modified */
  _modified_at?: Date;
} & T;

/**
 * Kanban card with custom fields
 */
export type KanbanCardWithData<T> = KanbanCard<Record<string, never>> & T;

/**
 * Base kanban card without custom fields
 */
export interface BaseKanbanCard {
  /** Unique identifier */
  _id: string;
  /** Card title */
  title: string;
  /** Column this card belongs to */
  columnId: string;
  /** Position within the column (0-indexed) */
  position: number;
  /** When the card was created */
  _created_at?: Date;
  /** When the card was last modified */
  _modified_at?: Date;
}

/**
 * Kanban column interface
 * @template T - Custom fields for cards in this column
 */
export interface KanbanColumn<T = Record<string, any>> {
  /** Unique identifier */
  _id: string;
  /** Column title */
  title: string;
  /** Position among columns (0-indexed) */
  position: number;
  /** Cards in this column */
  cards: KanbanCard<T>[];
  /** Optional color for the column header */
  color?: string;
  /** Optional limit on number of cards (WIP limit) */
  limit?: number;
  /** Optional board identifier if supporting multiple boards */
  boardId?: string;
  /** When the column was created */
  _created_at?: Date;
  /** When the column was last modified */
  _modified_at?: Date;
}

/**
 * Column definition for display and behavior
 * Similar to ColumnDefinition in useTable
 */
export interface ColumnDefinition<T> {
  /** Field name from the card type */
  fieldId: keyof T;
  /** Display label (optional, defaults to fieldId) */
  label?: string;
  /** Enable sorting for this field */
  enableSorting?: boolean;
  /** Enable filtering for this field */
  enableFiltering?: boolean;
  /** Custom transform function (overrides auto-formatting) */
  transform?: (value: any, card: T) => React.ReactNode;
}

// ============================================================
// DRAG & DROP TYPES
// ============================================================

/**
 * Drag and drop state management
 */
export interface DragDropState<T> {
  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** The card currently being dragged */
  draggedCard: KanbanCard<T> | null;
  /** The column currently being hovered over */
  dragOverColumn: string | null;
  /** The position within the column being hovered over */
  dragOverPosition: number | null;
  /** Source column of the drag operation */
  dragSourceColumn: string | null;
}

/**
 * Drag event handlers
 */
export interface DragDropHandlers<T> {
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
  /** Handle touch start for mobile */
  handleTouchStart: (event: TouchEvent, card: KanbanCard<T>) => void;
  /** Handle touch move for mobile */
  handleTouchMove: (event: TouchEvent) => void;
  /** Handle touch end for mobile */
  handleTouchEnd: (event: TouchEvent) => void;
}

/**
 * Combined drag and drop interface
 */
export interface DragDropManager<T>
  extends DragDropState<T>,
    DragDropHandlers<T> {
  /** Announce moves for accessibility */
  announceMove: (
    card: KanbanCard<T>,
    fromColumn: string,
    toColumn: string
  ) => void;
  /** Reset drag state */
  reset: () => void;
}

// ============================================================
// HOOK CONFIGURATION
// ============================================================

/**
 * Configuration options for the useKanban hook
 */
export interface UseKanbanOptions<T> {
  /** Card data source identifier */
  cardSource?: string;
  /** Card data source identifier (alias for cardSource) */
  source?: string;

  /** Static column definitions (required) */
  columns: ColumnConfig[];

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
    /** Initial filter conditions */
    filters?: FilterConditionWithId[];
    /** Initial filter operator */
    filterOperator?: "AND" | "OR";
    /** Initial search query */
    search?: string;
    /** Initial column order */
    columnOrder?: string[];
    /** Initial sort configuration */
    sorting?: {
      field: keyof T;
      direction: "asc" | "desc";
    };
  };

  /** Event callbacks */
  onCardMove?: (
    card: KanbanCard<T>,
    fromColumnId: string,
    toColumnId: string
  ) => void;
  onCardCreate?: (card: KanbanCard<T>) => void;
  onCardUpdate?: (card: KanbanCard<T>) => void;
  onCardDelete?: (cardId: string) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onFilterError?: (errors: ValidationError[]) => void;
}

// ============================================================
// HOOK RETURN INTERFACE
// ============================================================

/**
 * Card operations interface
 */
export interface CardOperations<T> {
  /** Create a new card */
  create: (
    card: Partial<KanbanCard<T>> & { columnId: string }
  ) => Promise<string>;
  /** Update an existing card */
  update: (id: string, updates: Partial<KanbanCard<T>>) => Promise<void>;
  /** Delete a card */
  delete: (id: string) => Promise<void>;
  /** Move a card to a different column */
  move: (
    cardId: string,
    toColumnId: string,
    position?: number
  ) => Promise<void>;
  /** Reorder cards within a column */
  reorder: (cardIds: string[], columnId: string) => Promise<void>;
}

/**
 * Search functionality interface
 */
export interface SearchOperations {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (value: string) => void;
  /** Clear search query */
  clear: () => void;
}

/**
 * Filter functionality interface (reusing from useFilter)
 */
export interface FilterOperations {
  /** Current filter conditions */
  conditions: FilterConditionWithId[];
  /** Logical operator for combining conditions */
  logicalOperator: "AND" | "OR";
  /** Whether all conditions are valid */
  isValid: boolean;
  /** Current validation errors */
  validationErrors: ValidationError[];
  /** Whether there are any conditions */
  hasConditions: boolean;

  /** Add a new filter condition */
  addCondition: (
    condition: Omit<FilterConditionWithId, "id" | "isValid">
  ) => string;
  /** Update an existing condition */
  updateCondition: (
    id: string,
    updates: Partial<FilterConditionWithId>
  ) => boolean;
  /** Remove a condition */
  removeCondition: (id: string) => boolean;
  /** Clear all conditions */
  clearConditions: () => void;
  /** Get a specific condition */
  getCondition: (id: string) => FilterConditionWithId | undefined;

  /** Set logical operator */
  setLogicalOperator: (operator: "AND" | "OR") => void;

  /** Bulk operations */
  setConditions: (conditions: FilterConditionWithId[]) => void;
  replaceCondition: (
    id: string,
    newCondition: Omit<FilterConditionWithId, "id" | "isValid">
  ) => boolean;

  /** Validation */
  validateCondition: (condition: Partial<FilterConditionWithId>) => any;
  validateAllConditions: () => any;

  /** State management */
  exportState: () => any;
  importState: (state: any) => void;
  resetToInitial: () => void;

  /** Utilities */
  getConditionCount: () => number;
}

/**
 * Main return interface for useKanban hook
 * Follows useTable pattern with flat access
 */
export interface UseKanbanReturn<T> {
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
  /** Any mutation in progress */
  isUpdating: boolean;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  /** Current error state */
  error: Error | null;

  // ============================================================
  // CARD OPERATIONS (Flat Access)
  // ============================================================

  /** Create a new card */
  createCard: (
    card: Partial<KanbanCard<T>> & { columnId: string }
  ) => Promise<string>;
  /** Update an existing card */
  updateCard: (id: string, updates: Partial<KanbanCard<T>>) => Promise<void>;
  /** Delete a card */
  deleteCard: (id: string) => Promise<void>;
  /** Move a card to a different column */
  moveCard: (
    cardId: string,
    toColumnId: string,
    position?: number
  ) => Promise<void>;
  /** Reorder cards within a column */
  reorderCards: (cardIds: string[], columnId: string) => Promise<void>;

  // ============================================================
  // SEARCH (Flat Access)
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

  /** Filter functionality */
  filter: FilterOperations;

  // ============================================================
  // DRAG DROP (Flat Access)
  // ============================================================

  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** The card currently being dragged */
  draggedCard: KanbanCard<T> | null;
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

  /**
   * Get props for a draggable card
   */
  getCardProps: (card: KanbanCard<T>) => {
    draggable: boolean;
    role: string;
    "aria-selected": boolean;
    "aria-grabbed": boolean;
    onDragStart: (e: any) => void;
    onDragEnd: () => void;
    onKeyDown: (e: any) => void;
  };

  /**
   * Get props for a droppable column
   */
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

  /** Load more cards for a specific column (Pagination) */
  loadMore: (columnId: string) => void;
}

// ============================================================
// API INTEGRATION TYPES
// ============================================================

/**
 * API response for card operations
 */
export interface CardApiResponse<T> {
  Data: KanbanCard<T>[];
}

/**
 * API response for column operations
 */
export interface ColumnApiResponse<T> {
  Data: KanbanColumn<T>[];
}

/**
 * Request payload for moving a card
 */
export interface MoveCardRequest {
  cardId: string;
  toColumnId: string;
  position?: number;
}

/**
 * Request payload for reordering items
 */
export interface ReorderRequest {
  itemIds: string[];
  containerId?: string; // for cards, this would be columnId
}

/**
 * Bulk card update request
 */
export interface BulkCardUpdateRequest<T> {
  updates: Array<{
    cardId: string;
    data: Partial<KanbanCard<T>>;
  }>;
}

/**
 * Bulk column update request
 */
export interface BulkColumnUpdateRequest<T> {
  updates: Array<{
    columnId: string;
    data: Partial<KanbanColumn<T>>;
  }>;
}

// ============================================================
// VALIDATION TYPES
// ============================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Card validation context
 */
export interface CardValidationContext<T> {
  card: Partial<KanbanCard<T>>;
  column?: KanbanColumn<T>;
  allColumns: KanbanColumn<T>[];
  fieldDefinitions?: Record<keyof T, FieldDefinition>;
}

/**
 * Column validation context
 */
export interface ColumnValidationContext<T> {
  column: Partial<KanbanColumn<T>>;
  allColumns: KanbanColumn<T>[];
}

// ============================================================
// EVENT TYPES
// ============================================================

/**
 * Kanban event types for callbacks
 */
export type KanbanEventType =
  | "card-created"
  | "card-updated"
  | "card-deleted"
  | "card-moved"
  | "cards-reordered";

/**
 * Kanban event data
 */
export interface KanbanEvent<T> {
  type: KanbanEventType;
  timestamp: Date;
  data: any;
  card?: KanbanCard<T>;
  column?: KanbanColumn<T>;
  fromColumnId?: string;
  toColumnId?: string;
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * Utility type for extracting card type from column
 */
export type ExtractCardType<C> = C extends KanbanColumn<infer T> ? T : never;

/**
 * Utility type for making certain fields optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for card creation (auto-generated fields optional)
 */
export type CreateCardInput<T> = PartialBy<
  KanbanCard<T>,
  "_id" | "position" | "_created_at" | "_modified_at"
>;

/**
 * Utility type for column creation (auto-generated fields optional)
 */
export type CreateColumnInput<T> = PartialBy<
  KanbanColumn<T>,
  "_id" | "position" | "cards" | "_created_at" | "_modified_at"
>;
