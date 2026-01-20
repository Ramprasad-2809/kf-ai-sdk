// ============================================================
// KANBAN MODULE - Type Exports
// @ram_28/kf-ai-sdk/kanban/types
// ============================================================

export type {
  // Core hook types
  UseKanbanOptionsType,
  UseKanbanReturnType,

  // Data structures
  KanbanCardType,
  KanbanColumnType,
  ColumnConfigType,
  ColumnDefinitionType,
  BaseKanbanCardType,
  KanbanCardWithDataType,

  // Operations
  CardOperationsType,
  SearchOperationsType,

  // Drag & Drop
  DragDropStateType,
  DragDropHandlersType,
  DragDropManagerType,

  // API Types
  CardApiResponseType,
  ColumnApiResponseType,
  MoveCardRequestType,
  ReorderRequestType,
  BulkCardUpdateRequestType,
  BulkColumnUpdateRequestType,

  // Validation
  ValidationResultType,
  CardValidationContextType,
  ColumnValidationContextType,

  // Events
  KanbanEventTypeType,
  KanbanEventType,

  // Utility Types
  ExtractCardTypeType,
  PartialByType,
  CreateCardInputType,
  CreateColumnInputType,
} from './components/hooks/useKanban/types';
