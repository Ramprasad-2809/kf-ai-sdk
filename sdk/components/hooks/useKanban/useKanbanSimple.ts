// ============================================================
// USE KANBAN HOOK - Simplified Implementation
// ============================================================
// Clean hook following useTable pattern for API integration

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api";
import type { ListOptions, ListResponse } from "../../../types/common";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface KanbanCard<T = Record<string, any>> {
  _id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  data?: T; // Custom fields
  _created_at?: Date;
  _modified_at?: Date;
}

export interface KanbanColumn<T = Record<string, any>> {
  _id: string;
  title: string;
  position: number;
  color?: string;
  cards: KanbanCard<T>[];
}

export interface ColumnDefinition {
  id: string;
  title: string;
  position: number;
  color?: string;
}

export interface UseKanbanOptions<T = Record<string, any>> {
  /** Data source identifier for API calls */
  source: string;
  /** Column configurations */
  columns: ColumnDefinition[];
  /** Enable drag and drop functionality */
  enableDragDrop?: boolean;
  /** Initial search query */
  initialSearch?: string;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Custom card data type validator (optional) */
  validateCardData?: (data: T) => boolean;
}

export interface UseKanbanReturn<T> {
  // Data
  columns: KanbanColumn<T>[];
  totalCards: number;

  // Loading States
  isLoading: boolean;
  isFetching: boolean;
  isUpdating: boolean;

  // Error Handling
  error: Error | null;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Card Operations
  createCard: (card: Partial<KanbanCard<T>> & { columnId: string }) => Promise<void>;
  updateCard: (id: string, updates: Partial<KanbanCard<T>>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, position?: number) => Promise<void>;

  // Drag Drop State (if enabled)
  isDragging: boolean;
  draggedCard: KanbanCard<T> | null;
  handleDragStart: (card: KanbanCard<T>) => void;
  handleDragEnd: () => void;
  handleKeyboardMove: (cardId: string, direction: "left" | "right") => Promise<void>;

  // Utilities
  refresh: () => Promise<void>;
}

// ============================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================

export function useKanban<T extends Record<string, any> = Record<string, any>>(
  options: UseKanbanOptions<T>
): UseKanbanReturn<T> {
  const {
    source,
    columns: columnConfigs,
    enableDragDrop = false,
    initialSearch = "",
    onError,
  } = options;

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedCard: null as KanbanCard<T> | null,
  });

  // Query client for cache management
  const queryClient = useQueryClient();
  const onErrorRef = useRef(onError);

  // ============================================================
  // API OPTIONS
  // ============================================================

  const apiOptions = useMemo((): ListOptions => {
    const opts: ListOptions = {};

    // Default sorting by column and position - using correct API format
    opts.Sort = [
      { columnId: "ASC" },
      { position: "ASC" },
    ];

    // Add search query
    if (searchQuery) {
      opts.Search = searchQuery;
    }

    return opts;
  }, [searchQuery]);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Fetch cards
  const {
    data: cardsResponse,
    isLoading: isLoadingCards,
    isFetching: isFetchingCards,
    error: cardsError,
    refetch: refetchCards,
  } = useQuery({
    queryKey: ["kanban-cards", source, apiOptions],
    queryFn: async (): Promise<ListResponse<KanbanCard<T>>> => {
      try {
        return await api<KanbanCard<T>>(source).list(apiOptions);
      } catch (err) {
        onErrorRef.current?.(err as Error);
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });

  // Get total card count
  const {
    data: countData,
    isLoading: isLoadingCount,
    error: countError,
  } = useQuery({
    queryKey: ["kanban-count", source, apiOptions],
    queryFn: async () => {
      try {
        return await api<KanbanCard<T>>(source).count(apiOptions);
      } catch (err) {
        onErrorRef.current?.(err as Error);
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });

  // ============================================================
  // CARD MUTATIONS
  // ============================================================

  const createCardMutation = useMutation({
    mutationFn: async (card: Partial<KanbanCard<T>> & { columnId: string }) => {
      // Calculate position
      const currentCards = cardsResponse?.Data?.filter((c) => c.columnId === card.columnId) || [];
      const position = card.position ?? currentCards.length;

      return await api<KanbanCard<T>>(source).create({
        ...card,
        position,
      });
    },
    onSuccess: () => refetchCards(),
    onError: (error) => onErrorRef.current?.(error as Error),
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<KanbanCard<T>> }) => {
      return await api<KanbanCard<T>>(source).update(id, updates);
    },
    onSuccess: () => refetchCards(),
    onError: (error) => onErrorRef.current?.(error as Error),
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api(source).delete(id);
    },
    onSuccess: () => refetchCards(),
    onError: (error) => onErrorRef.current?.(error as Error),
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, toColumnId, position }: {
      cardId: string;
      toColumnId: string;
      position?: number;
    }) => {
      const updates: any = { columnId: toColumnId };
      if (position !== undefined) {
        updates.position = position;
      }
      return await api<KanbanCard<T>>(source).update(cardId, updates);
    },
    onSuccess: () => refetchCards(),
    onError: (error) => onErrorRef.current?.(error as Error),
  });

  // ============================================================
  // OPERATIONS
  // ============================================================

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleDragStart = useCallback((card: KanbanCard<T>) => {
    if (!enableDragDrop) return;
    setDragState({
      isDragging: true,
      draggedCard: card,
    });
  }, [enableDragDrop]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedCard: null,
    });
  }, []);

  const handleKeyboardMove = useCallback(async (
    cardId: string,
    direction: "left" | "right"
  ) => {
    if (!enableDragDrop) return;

    const card = cardsResponse?.Data?.find(c => c._id === cardId);
    if (!card) return;

    const currentColumnIndex = columnConfigs.findIndex(col => col.id === card.columnId);
    if (currentColumnIndex === -1) return;

    let targetColumnIndex = currentColumnIndex;
    
    if (direction === "left") {
      targetColumnIndex = Math.max(0, currentColumnIndex - 1);
    } else if (direction === "right") {
      targetColumnIndex = Math.min(columnConfigs.length - 1, currentColumnIndex + 1);
    }

    if (targetColumnIndex !== currentColumnIndex) {
      const targetColumn = columnConfigs[targetColumnIndex];
      await moveCardMutation.mutateAsync({
        cardId,
        toColumnId: targetColumn.id,
      });
    }
  }, [enableDragDrop, cardsResponse?.Data, columnConfigs, moveCardMutation]);

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const processedColumns = useMemo(() => {
    const cards = cardsResponse?.Data || [];

    // Group cards by columnId
    const cardsByColumn = cards.reduce(
      (acc, card) => {
        if (!acc[card.columnId]) {
          acc[card.columnId] = [];
        }
        acc[card.columnId].push(card);
        return acc;
      },
      {} as Record<string, KanbanCard<T>[]>
    );

    // Map column configs to columns with cards
    return columnConfigs
      .sort((a, b) => a.position - b.position)
      .map((config) => ({
        _id: config.id,
        title: config.title,
        position: config.position,
        color: config.color,
        cards: (cardsByColumn[config.id] || []).sort(
          (a, b) => a.position - b.position
        ),
      }));
  }, [columnConfigs, cardsResponse]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === "kanban-cards" ||
        query.queryKey[0] === "kanban-count",
    });
  }, [queryClient]);

  // ============================================================
  // RETURN VALUES
  // ============================================================

  return {
    // Data
    columns: processedColumns,
    totalCards: countData?.Count || 0,

    // Loading States
    isLoading: isLoadingCards || isLoadingCount,
    isFetching: isFetchingCards,
    isUpdating:
      createCardMutation.isPending ||
      updateCardMutation.isPending ||
      deleteCardMutation.isPending ||
      moveCardMutation.isPending,

    // Error Handling
    error: (cardsError || countError) as Error | null,

    // Search
    searchQuery,
    setSearchQuery,
    clearSearch,

    // Card Operations
    createCard: useCallback(
      async (card: Partial<KanbanCard<T>> & { columnId: string }) => {
        await createCardMutation.mutateAsync(card);
      },
      [createCardMutation]
    ),
    updateCard: useCallback(
      async (id: string, updates: Partial<KanbanCard<T>>) => {
        await updateCardMutation.mutateAsync({ id, updates });
      },
      [updateCardMutation]
    ),
    deleteCard: useCallback(
      async (id: string) => {
        await deleteCardMutation.mutateAsync(id);
      },
      [deleteCardMutation]
    ),
    moveCard: useCallback(
      async (cardId: string, toColumnId: string, position?: number) => {
        await moveCardMutation.mutateAsync({ cardId, toColumnId, position });
      },
      [moveCardMutation]
    ),

    // Drag Drop
    isDragging: dragState.isDragging,
    draggedCard: dragState.draggedCard,
    handleDragStart,
    handleDragEnd,
    handleKeyboardMove,

    // Utilities
    refresh,
  };
}