// ============================================================
// KANBAN MODULE - Main Entry Point
// @ram_28/kf-ai-sdk/kanban
// ============================================================

// Main hook
export { useKanban } from './components/hooks/useKanban/useKanban';

// Context
export { KanbanContext, useKanbanContext } from './components/hooks/useKanban/context';

// Utilities
export {
  mergeCardsIntoColumns,
  calculateCardPosition,
  calculateColumnPosition,
  normalizePositions,
  handleKanbanApiError,
  validateApiResponse,
} from './components/hooks/useKanban/apiClient';

// Drag drop manager
export { useDragDropManager } from './components/hooks/useKanban/dragDropManager';
