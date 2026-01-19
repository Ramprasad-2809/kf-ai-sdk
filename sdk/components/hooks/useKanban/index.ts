// ============================================================
// KANBAN SDK - Main Export
// ============================================================

export { useKanban } from './useKanban';
export { KanbanContext, useKanbanContext } from './context';

export type {
  // Core interfaces
  UseKanbanOptions,
  UseKanbanReturn,
  KanbanCard,
  KanbanColumn,
  ColumnConfig,
  ColumnDefinition,

  // Operations
  CardOperations,
  SearchOperations,

  // Drag & Drop
  DragDropState,
  DragDropHandlers,
  DragDropManager,

  // API Types
  CardApiResponse,
  ColumnApiResponse,
  MoveCardRequest,
  ReorderRequest,
  BulkCardUpdateRequest,
  BulkColumnUpdateRequest,

  // Validation
  ValidationResult,
  CardValidationContext,
  ColumnValidationContext,

  // Events
  KanbanEventType,
  KanbanEvent,

  // Utility Types
  ExtractCardType,
  PartialBy,
  CreateCardInput,
  CreateColumnInput,
} from './types';

// Export utility functions for advanced use cases
export {
  mergeCardsIntoColumns,
  calculateCardPosition,
  calculateColumnPosition,
  normalizePositions,
  handleKanbanApiError,
  validateApiResponse
} from './apiClient';

export {
  useDragDropManager
} from './dragDropManager';