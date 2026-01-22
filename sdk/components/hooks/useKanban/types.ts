// ============================================================
// KANBAN SDK - TYPE DEFINITIONS
// ============================================================
// Core TypeScript interfaces for the kanban board functionality
// Following patterns from useTable and useForm

import type { UseFilterReturnType, UseFilterOptionsType } from "../useFilter";
import type { ColumnDefinitionType } from "../../../types/common";

// Re-export ColumnDefinitionType for backwards compatibility
export type { ColumnDefinitionType };

// ============================================================
// CORE DATA STRUCTURES
// ============================================================

/**
 * Static column configuration (no CRUD operations)
 * Columns are defined once in the hook configuration
 */
export interface ColumnConfigType {
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
export type KanbanCardType<T = Record<string, any>> = {
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
export type KanbanCardWithDataType<T> = KanbanCardType<Record<string, never>> & T;

/**
 * Base kanban card without custom fields
 */
export interface BaseKanbanCardType {
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
export interface KanbanColumnType<T = Record<string, any>> {
  /** Unique identifier */
  _id: string;
  /** Column title */
  title: string;
  /** Position among columns (0-indexed) */
  position: number;
  /** Cards in this column */
  cards: KanbanCardType<T>[];
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

// ============================================================
// DRAG & DROP TYPES
// ============================================================

/**
 * Drag and drop state management
 */
export interface DragDropStateType<T> {
  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** The card currently being dragged */
  draggedCard: KanbanCardType<T> | null;
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
export interface DragDropHandlersType<T> {
  /** Handle drag start event */
  handleDragStart: (event: DragEvent, card: KanbanCardType<T>) => void;
  /** Handle drag over event */
  handleDragOver: (event: DragEvent, columnId?: string) => void;
  /** Handle drop event */
  handleDrop: (event: DragEvent, columnId: string) => void;
  /** Handle drag end event */
  handleDragEnd: () => void;
  /** Handle keyboard navigation */
  handleKeyDown: (event: KeyboardEvent, card: KanbanCardType<T>) => void;
  /** Handle touch start for mobile */
  handleTouchStart: (event: TouchEvent, card: KanbanCardType<T>) => void;
  /** Handle touch move for mobile */
  handleTouchMove: (event: TouchEvent) => void;
  /** Handle touch end for mobile */
  handleTouchEnd: (event: TouchEvent) => void;
}

/**
 * Combined drag and drop interface
 */
export interface DragDropManagerType<T>
  extends DragDropStateType<T>,
    DragDropHandlersType<T> {
  /** Announce moves for accessibility */
  announceMove: (
    card: KanbanCardType<T>,
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
export interface UseKanbanOptionsType<T> {
  /** Card data source identifier */
  source: string;

  /** Static column definitions (required) */
  columns: ColumnConfigType[];

  /** Enable drag and drop functionality */
  enableDragDrop?: boolean;

  /** Enable filtering functionality */
  enableFiltering?: boolean;

  /** Enable search functionality */
  enableSearch?: boolean;

  /** Initial state */
  initialState?: {
    /** Initial filter configuration: { conditions, operator } */
    filter?: UseFilterOptionsType;
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
    card: KanbanCardType<T>,
    fromColumnId: string,
    toColumnId: string
  ) => void;
  onCardCreate?: (card: KanbanCardType<T>) => void;
  onCardUpdate?: (card: KanbanCardType<T>) => void;
  onCardDelete?: (cardId: string) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

// ============================================================
// HOOK RETURN INTERFACE
// ============================================================

/**
 * Card operations interface
 */
export interface CardOperationsType<T> {
  /** Create a new card */
  create: (
    card: Partial<KanbanCardType<T>> & { columnId: string }
  ) => Promise<string>;
  /** Update an existing card */
  update: (id: string, updates: Partial<KanbanCardType<T>>) => Promise<void>;
  /** Delete a card */
  delete: (id: string) => Promise<void>;
  /** Move a card to a different column */
  move: (
    cardId: string,
    toColumnId: string,
    position?: number,
    fromColumnId?: string
  ) => Promise<void>;
  /** Reorder cards within a column */
  reorder: (cardIds: string[], columnId: string) => Promise<void>;
}

/**
 * Search functionality interface
 */
export interface SearchOperationsType {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (value: string) => void;
  /** Clear search query */
  clear: () => void;
}

/**
 * Main return interface for useKanban hook
 * Follows useTable pattern with flat access
 */
export interface UseKanbanReturnType<T> {
  // ============================================================
  // DATA
  // ============================================================

  /** All columns with their cards */
  columns: KanbanColumnType<T>[];
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
    card: Partial<KanbanCardType<T>> & { columnId: string }
  ) => Promise<string>;
  /** Update an existing card */
  updateCard: (id: string, updates: Partial<KanbanCardType<T>>) => Promise<void>;
  /** Delete a card */
  deleteCard: (id: string) => Promise<void>;
  /** Move a card to a different column */
  moveCard: (
    cardId: string,
    toColumnId: string,
    position?: number,
    fromColumnId?: string
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
  // FILTER (Simplified chainable API)
  // ============================================================

  /** Filter functionality */
  filter: UseFilterReturnType;

  // ============================================================
  // DRAG DROP (Flat Access)
  // ============================================================

  /** Whether a drag operation is in progress */
  isDragging: boolean;
  /** The card currently being dragged */
  draggedCard: KanbanCardType<T> | null;
  /** The column currently being hovered over during drag */
  dragOverColumn: string | null;
  /** Handle drag start event */
  handleDragStart: (event: DragEvent, card: KanbanCardType<T>) => void;
  /** Handle drag over event */
  handleDragOver: (event: DragEvent, columnId?: string) => void;
  /** Handle drop event */
  handleDrop: (event: DragEvent, columnId: string) => void;
  /** Handle drag end event */
  handleDragEnd: () => void;
  /** Handle keyboard navigation */
  handleKeyDown: (event: KeyboardEvent, card: KanbanCardType<T>) => void;

  // ============================================================
  // PROP GETTERS
  // ============================================================

  /**
   * Get props for a draggable card
   */
  getCardProps: (card: KanbanCardType<T>) => {
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
export interface CardApiResponseType<T> {
  Data: KanbanCardType<T>[];
}

/**
 * API response for column operations
 */
export interface ColumnApiResponseType<T> {
  Data: KanbanColumnType<T>[];
}

/**
 * Request payload for moving a card
 */
export interface MoveCardRequestType {
  cardId: string;
  toColumnId: string;
  position?: number;
}

/**
 * Request payload for reordering items
 */
export interface ReorderRequestType {
  itemIds: string[];
  containerId?: string;
}

/**
 * Bulk card update request
 */
export interface BulkCardUpdateRequestType<T> {
  updates: Array<{
    cardId: string;
    data: Partial<KanbanCardType<T>>;
  }>;
}

/**
 * Bulk column update request
 */
export interface BulkColumnUpdateRequestType<T> {
  updates: Array<{
    columnId: string;
    data: Partial<KanbanColumnType<T>>;
  }>;
}

// ============================================================
// VALIDATION TYPES
// ============================================================

/**
 * Validation result interface
 */
export interface ValidationResultType {
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
export interface CardValidationContextType<T> {
  card: Partial<KanbanCardType<T>>;
  column?: KanbanColumnType<T>;
  allColumns: KanbanColumnType<T>[];
}

/**
 * Column validation context
 */
export interface ColumnValidationContextType<T> {
  column: Partial<KanbanColumnType<T>>;
  allColumns: KanbanColumnType<T>[];
}

// ============================================================
// EVENT TYPES
// ============================================================

/**
 * Kanban event types for callbacks
 */
export type KanbanEventTypeType =
  | "card-created"
  | "card-updated"
  | "card-deleted"
  | "card-moved"
  | "cards-reordered";

/**
 * Kanban event data
 */
export interface KanbanEventType<T> {
  type: KanbanEventTypeType;
  timestamp: Date;
  data: any;
  card?: KanbanCardType<T>;
  column?: KanbanColumnType<T>;
  fromColumnId?: string;
  toColumnId?: string;
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * Utility type for extracting card type from column
 */
export type ExtractCardTypeType<C> = C extends KanbanColumnType<infer T> ? T : never;

/**
 * Utility type for making certain fields optional
 */
export type PartialByType<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for card creation (auto-generated fields optional)
 */
export type CreateCardInputType<T> = PartialByType<
  KanbanCardType<T>,
  "_id" | "position" | "_created_at" | "_modified_at"
>;

/**
 * Utility type for column creation (auto-generated fields optional)
 */
export type CreateColumnInputType<T> = PartialByType<
  KanbanColumnType<T>,
  "_id" | "position" | "cards" | "_created_at" | "_modified_at"
>;
