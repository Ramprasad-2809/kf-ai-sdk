// ============================================================
// KANBAN API CLIENT
// ============================================================
// Backend integration for kanban operations using existing API patterns
// Follows the same structure as useForm and useTable API clients

import { api } from "../../../api";
import type { 
  ListOptions, 
  ListResponse, 
  CreateUpdateResponse,
  DeleteResponse,
  CountResponse 
} from "../../../types/common";
import type {
  KanbanCard,
  KanbanColumn,
  BulkCardUpdateRequest,
  BulkColumnUpdateRequest
} from "./types";

// ============================================================
// COLUMN API OPERATIONS
// ============================================================

/**
 * Fetch columns from backend with optional filtering and sorting
 */
export async function fetchColumns<T>(
  source: string, 
  options?: ListOptions
): Promise<KanbanColumn<T>[]> {
  const client = api<KanbanColumn<T>>(source);
  
  // Build API options for columns query
  const apiOptions: ListOptions = {
    ...options,
    // Default sort by position if no sort specified - using correct API format
    Sort: options?.Sort || [{ position: "ASC" }]
  };
  
  const response: ListResponse<KanbanColumn<T>> = await client.list(apiOptions);
  
  // Initialize empty cards array for each column
  // Cards will be fetched separately and merged
  return response.Data.map(column => ({
    ...column,
    cards: []
  }));
}

/**
 * Create a new column
 */
export async function createColumn<T>(
  source: string, 
  column: Partial<KanbanColumn<T>>
): Promise<string> {
  const client = api<KanbanColumn<T>>(source);
  
  // Exclude cards array from creation payload
  const { cards, ...columnData } = column;
  
  const response: CreateUpdateResponse = await client.create(columnData);
  return response._id;
}

/**
 * Update an existing column
 */
export async function updateColumn<T>(
  source: string,
  id: string, 
  updates: Partial<KanbanColumn<T>>
): Promise<void> {
  const client = api<KanbanColumn<T>>(source);
  
  // Exclude cards array from update payload
  const { cards, ...columnUpdates } = updates;
  
  await client.update(id, columnUpdates);
}

/**
 * Delete a column
 */
export async function deleteColumn(
  source: string,
  id: string
): Promise<void> {
  const client = api(source);
  await client.delete(id);
}

/**
 * Reorder multiple columns
 */
export async function reorderColumns<T>(
  source: string,
  columnIds: string[]
): Promise<void> {
  const client = api<KanbanColumn<T>>(source);
  
  // Update position for each column
  const updates = columnIds.map((id, index) => ({
    columnId: id,
    data: { position: index }
  }));
  
  // Perform bulk update
  await Promise.all(
    updates.map(update => 
      client.update(update.columnId, update.data)
    )
  );
}

// ============================================================
// CARD API OPERATIONS  
// ============================================================

/**
 * Fetch cards from backend with optional filtering and sorting
 */
export async function fetchCards<T>(
  source: string,
  options?: ListOptions
): Promise<KanbanCard<T>[]> {
  const client = api<KanbanCard<T>>(source);
  
  // Build API options for cards query
  const apiOptions: ListOptions = {
    ...options,
    // Default sort by column and position if no sort specified - using correct API format
    Sort: options?.Sort || [
      { columnId: "ASC" },
      { position: "ASC" }
    ]
  };
  
  const response: ListResponse<KanbanCard<T>> = await client.list(apiOptions);
  return response.Data;
}

/**
 * Create a new card
 */
export async function createCard<T>(
  source: string,
  card: Partial<KanbanCard<T>> & { columnId: string }
): Promise<string> {
  const client = api<KanbanCard<T>>(source);
  
  const response: CreateUpdateResponse = await client.create(card);
  return response._id;
}

/**
 * Update an existing card
 */
export async function updateCard<T>(
  source: string,
  id: string,
  updates: Partial<KanbanCard<T>>
): Promise<void> {
  const client = api<KanbanCard<T>>(source);
  await client.update(id, updates);
}

/**
 * Delete a card
 */
export async function deleteCard(
  source: string,
  id: string
): Promise<void> {
  const client = api(source);
  await client.delete(id);
}

/**
 * Move a card to a different column or position
 */
export async function moveCard<T>(
  source: string,
  cardId: string,
  toColumnId: string,
  position?: number
): Promise<void> {
  const client = api<KanbanCard<T>>(source);
  
  const updates: any = {
    columnId: toColumnId,
    ...(position !== undefined && { position })
  };
  
  await client.update(cardId, updates);
}

/**
 * Reorder cards within a column
 */
export async function reorderCards<T>(
  source: string,
  cardIds: string[],
  columnId: string
): Promise<void> {
  const client = api<KanbanCard<T>>(source);
  
  // Update position for each card
  const updates = cardIds.map((id, index) => ({
    cardId: id,
    data: { position: index, columnId } as any
  }));
  
  // Perform bulk update
  await Promise.all(
    updates.map(update => 
      client.update(update.cardId, update.data)
    )
  );
}

// ============================================================
// BULK OPERATIONS
// ============================================================

/**
 * Bulk update multiple cards
 */
export async function bulkUpdateCards<T>(
  source: string,
  request: BulkCardUpdateRequest<T>
): Promise<void> {
  const client = api<KanbanCard<T>>(source);
  
  await Promise.all(
    request.updates.map(update => 
      client.update(update.cardId, update.data)
    )
  );
}

/**
 * Bulk update multiple columns  
 */
export async function bulkUpdateColumns<T>(
  source: string,
  request: BulkColumnUpdateRequest<T>
): Promise<void> {
  const client = api<KanbanColumn<T>>(source);
  
  await Promise.all(
    request.updates.map(update =>
      client.update(update.columnId, update.data)
    )
  );
}

/**
 * Move multiple cards to a new column
 */
export async function bulkMoveCards<T>(
  cardSource: string,
  cardIds: string[],
  toColumnId: string,
  startPosition = 0
): Promise<void> {
  const client = api<KanbanCard<T>>(cardSource);
  
  const updates = cardIds.map((cardId, index) => ({
    cardId,
    data: {
      columnId: toColumnId,
      position: startPosition + index
    } as any
  }));
  
  await Promise.all(
    updates.map(update =>
      client.update(update.cardId, update.data)
    )
  );
}

// ============================================================
// QUERY HELPERS
// ============================================================

/**
 * Get count of cards in a specific column
 */
export async function getCardCount(
  source: string,
  columnId: string
): Promise<number> {
  const client = api(source);
  
  const options: ListOptions = {
    Filter: {
      Operator: "And",
      Condition: [
        {
          Operator: "EQ",
          LHSField: "columnId",
          RHSValue: columnId,
          RHSType: "Constant"
        }
      ]
    }
  };
  
  const response: CountResponse = await client.count(options);
  return response.Count;
}

/**
 * Get total count of all cards across columns
 */
export async function getTotalCardCount(
  source: string,
  options?: ListOptions
): Promise<number> {
  const client = api(source);
  const response: CountResponse = await client.count(options);
  return response.Count;
}

/**
 * Search cards across all columns
 */
export async function searchCards<T>(
  source: string,
  searchQuery: string,
  additionalOptions?: ListOptions
): Promise<KanbanCard<T>[]> {
  const client = api<KanbanCard<T>>(source);
  
  const options: ListOptions = {
    ...additionalOptions,
    Search: searchQuery,
    Sort: additionalOptions?.Sort || [
      { columnId: "ASC" },
      { position: "ASC" }
    ]
  };
  
  const response: ListResponse<KanbanCard<T>> = await client.list(options);
  return response.Data;
}

// ============================================================
// DATA PROCESSING HELPERS
// ============================================================

/**
 * Merge cards into their respective columns
 */
export function mergeCardsIntoColumns<T>(
  columns: KanbanColumn<T>[],
  cards: KanbanCard<T>[]
): KanbanColumn<T>[] {
  // Group cards by columnId
  const cardsByColumn = cards.reduce((acc, card) => {
    if (!acc[card.columnId]) {
      acc[card.columnId] = [];
    }
    acc[card.columnId].push(card);
    return acc;
  }, {} as Record<string, KanbanCard<T>[]>);
  
  // Assign cards to their respective columns
  return columns.map(column => ({
    ...column,
    cards: (cardsByColumn[column._id] || [])
      .sort((a, b) => a.position - b.position)
  }));
}

/**
 * Calculate optimal position for inserting a new card
 */
export function calculateCardPosition<T>(
  column: KanbanColumn<T>,
  insertIndex?: number
): number {
  if (column.cards.length === 0) {
    return 0;
  }
  
  if (insertIndex === undefined || insertIndex >= column.cards.length) {
    // Insert at end
    const lastCard = column.cards[column.cards.length - 1];
    return lastCard.position + 1;
  }
  
  if (insertIndex === 0) {
    // Insert at beginning
    const firstCard = column.cards[0];
    return Math.max(0, firstCard.position - 1);
  }
  
  // Insert between cards
  const prevCard = column.cards[insertIndex - 1];
  const nextCard = column.cards[insertIndex];
  return Math.floor((prevCard.position + nextCard.position) / 2);
}

/**
 * Calculate optimal position for inserting a new column
 */
export function calculateColumnPosition<T>(
  columns: KanbanColumn<T>[],
  insertIndex?: number
): number {
  if (columns.length === 0) {
    return 0;
  }
  
  if (insertIndex === undefined || insertIndex >= columns.length) {
    // Insert at end
    const lastColumn = columns[columns.length - 1];
    return lastColumn.position + 1;
  }
  
  if (insertIndex === 0) {
    // Insert at beginning  
    const firstColumn = columns[0];
    return Math.max(0, firstColumn.position - 1);
  }
  
  // Insert between columns
  const prevColumn = columns[insertIndex - 1];
  const nextColumn = columns[insertIndex];
  return Math.floor((prevColumn.position + nextColumn.position) / 2);
}

/**
 * Recalculate positions to ensure proper ordering
 */
export function normalizePositions<T extends { position: number }>(
  items: T[]
): T[] {
  return items
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({
      ...item,
      position: index
    }));
}

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * Handle API errors with context
 */
export function handleKanbanApiError(
  error: unknown,
  operation: string,
  entityType: 'card' | 'column',
  entityId?: string
): Error {
  const baseMessage = `Failed to ${operation} ${entityType}`;
  const context = entityId ? ` (ID: ${entityId})` : '';
  
  if (error instanceof Error) {
    return new Error(`${baseMessage}${context}: ${error.message}`);
  }
  
  return new Error(`${baseMessage}${context}: Unknown error`);
}

/**
 * Validate API response structure
 */
export function validateApiResponse<T>(
  response: any,
  expectedType: 'list' | 'single' | 'create' | 'delete'
): response is ListResponse<T> | T | CreateUpdateResponse | DeleteResponse {
  switch (expectedType) {
    case 'list':
      return response && Array.isArray(response.Data);
    case 'single':
      return response && typeof response === 'object';
    case 'create':
      return response && typeof response._id === 'string';
    case 'delete':
      return response && response.status === 'success';
    default:
      return false;
  }
}