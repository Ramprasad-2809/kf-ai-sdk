// ============================================================
// USE KANBAN HOOK - Main Implementation
// ============================================================
// Simplified hook following useTable pattern - provides clean abstraction

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useQueries, keepPreviousData } from "@tanstack/react-query";
import { api } from "../../../api";
import type { ListOptionsType, ListResponseType } from "../../../types/common";
import { toError } from "../../../utils/error-handling";
import { useFilter } from "../useFilter";

import type {
  UseKanbanOptionsType,
  UseKanbanReturnType,
  KanbanCardType,
} from "./types";
import { useDragDropManager } from "./dragDropManager";

// ============================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================

export function useKanban<T extends Record<string, any> = Record<string, any>>(
  options: UseKanbanOptionsType<T>
): UseKanbanReturnType<T> {
  const {
    columns: columnConfigs,
    source,
    enableDragDrop = true,
    initialState,
    onCardMove,
    onCardCreate,
    onCardUpdate,
    onCardDelete,
    onError,
  } = options;

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [search, setSearch] = useState({
    query: initialState?.search || "",
    debouncedQuery: initialState?.search || "",
    field: null as string | null,
  });

  // Debounce timeout ref for search
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const SEARCH_DEBOUNCE_MS = 300;

  const [sorting] = useState({
    field: initialState?.sorting?.field || null,
    direction: initialState?.sorting?.direction || null,
  });

  // Per-column pagination state (PageSize expansion strategy)
  const [columnPagination, setColumnPagination] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    columnConfigs.forEach(col => {
      initial[col.id] = 10; // Default page size
    });
    return initial;
  });

  // Stable callback refs to prevent dependency loops
  const onErrorRef = useRef(onError);
  const onCardMoveRef = useRef(onCardMove);
  const onCardCreateRef = useRef(onCardCreate);
  const onCardUpdateRef = useRef(onCardUpdate);
  const onCardDeleteRef = useRef(onCardDelete);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
    onCardMoveRef.current = onCardMove;
    onCardCreateRef.current = onCardCreate;
    onCardUpdateRef.current = onCardUpdate;
    onCardDeleteRef.current = onCardDelete;
  }, [onError, onCardMove, onCardCreate, onCardUpdate, onCardDelete]);

  // Query client for cache management
  const queryClient = useQueryClient();

  // ============================================================
  // FILTER INTEGRATION
  // ============================================================

  const filter = useFilter({
    conditions: initialState?.filter?.conditions,
    operator: initialState?.filter?.operator || "And",
  });

  // Helper to generate API options for a specific column
  // This is used for both initial fetching and mutation updates
  const getColumnApiOptions = useCallback((columnId: string): ListOptionsType => {
      // 1. Construct Compound Filter Payload
      const columnFilterObject = {
        LHSField: "columnId",
        Operator: "EQ",
        RHSValue: columnId,
        RHSType: "Constant"
      };

      const basePayload = filter.payload;
      let combinedPayload: any;

      if (!basePayload) {
        combinedPayload = {
          Operator: "And",
          Condition: [columnFilterObject]
        };
      } else {
        // If base is And, append. If base is Or, wrap in new And.
        if (basePayload.Operator === "And") {
           combinedPayload = {
             ...basePayload,
             Condition: [...(basePayload.Condition || []), columnFilterObject]
           };
        } else {
          combinedPayload = {
            Operator: "And",
            Condition: [basePayload, columnFilterObject]
          };
        }
      }

      // Add search as a filter condition if both field and query are set
      if (search.debouncedQuery && search.field) {
        const searchCondition = {
          LHSField: search.field,
          Operator: "Contains",
          RHSValue: search.debouncedQuery,
          RHSType: "Constant"
        };
        combinedPayload = {
          ...combinedPayload,
          Condition: [...(combinedPayload.Condition || []), searchCondition]
        };
      }

      // 2. Construct API Options
      const opts: ListOptionsType = {
        Page: 1, // Always page 1 due to expanding PageSize strategy
        PageSize: columnPagination[columnId] || 10,
        Filter: combinedPayload,
      };

      // Add Sorting - using correct API format: [{ "fieldName": "ASC" }]
      if (sorting.field && sorting.direction) {
        opts.Sort = [
          { [String(sorting.field)]: sorting.direction === "asc" ? "ASC" : "DESC" },
          { position: "ASC" },
        ];
      } else {
        opts.Sort = [
          { columnId: "ASC" },
          { position: "ASC" },
        ];
      }

      return opts;
  }, [filter.payload, columnPagination, sorting, search.debouncedQuery, search.field]);

  // ============================================================
  // COLUMN QUERY GENERATION
  // ============================================================

  const columnQueries = useQueries({
    queries: columnConfigs.map((column) => {
      const opts = getColumnApiOptions(column.id);
      return {
        queryKey: ["kanban-cards", source, column.id, opts],
        queryFn: async (): Promise<ListResponseType<KanbanCardType<T>>> => {
          try {
            return await api<KanbanCardType<T>>(source).list(opts);
          } catch (err) {
            throw err;
          }
        },
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
      };
    }),
  });

  // Aggregate loading and error states
  const isLoadingCards = columnQueries.some(q => q.isLoading);
  const isFetchingCards = columnQueries.some(q => q.isFetching);
  const cardsError = columnQueries.find(q => q.error)?.error || null;
  const refetchCards = async () => {
    await Promise.all(columnQueries.map(q => q.refetch()));
  };

  const cardApiOptions = useMemo((): ListOptionsType => {
      // This is for the GLOBAL count (ignoring column split)
      const opts: ListOptionsType = {};

      // Build filter with search condition merged in
      let combinedFilter = filter.payload;

      // Add search as a filter condition if both field and query are set
      if (search.debouncedQuery && search.field) {
        const searchCondition = {
          LHSField: search.field,
          Operator: "Contains" as const,
          RHSValue: search.debouncedQuery,
          RHSType: "Constant" as const,
        };

        if (combinedFilter) {
          // Merge with existing filter
          if (combinedFilter.Operator === "And") {
            combinedFilter = {
              ...combinedFilter,
              Condition: [...(combinedFilter.Condition || []), searchCondition],
            };
          } else {
            // Wrap existing filter in And with search condition
            combinedFilter = {
              Operator: "And" as const,
              Condition: [combinedFilter, searchCondition],
            };
          }
        } else {
          // Create new filter with just the search condition
          combinedFilter = {
            Operator: "And" as const,
            Condition: [searchCondition],
          };
        }
      }

      if (combinedFilter) opts.Filter = combinedFilter;
      return opts;
  }, [search.debouncedQuery, search.field, filter.payload]);

  const {
    data: countData,
    isLoading: isLoadingCount,
    error: countError,
  } = useQuery({
    queryKey: ["kanban-count", source, cardApiOptions],
    queryFn: async () => {
      try {
        return await api<KanbanCardType<T>>(source).count(cardApiOptions);
      } catch (err) {
        if (onErrorRef.current) {
          onErrorRef.current(toError(err));
        }
        throw err;
      }
    },
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
  });

  // ============================================================
  // CARD MUTATIONS
  // ============================================================

  const createCardMutation = useMutation({
    mutationFn: async (card: Partial<KanbanCardType<T>> & { columnId: string }) => {
      const position = card.position ?? 999999;
      const response = await api<KanbanCardType<T>>(source).create({ ...card, position });
      return response._id;
    },
    onMutate: async (newCardVariables) => {
      const columnId = newCardVariables.columnId;
      const opts = getColumnApiOptions(columnId);
      const queryKey = ["kanban-cards", source, columnId, opts];

      await queryClient.cancelQueries({ queryKey });

      const previousCards = queryClient.getQueryData<ListResponseType<KanbanCardType<T>>>(queryKey);

      if (previousCards) {
         const currentCards = previousCards.Data;
         const position = newCardVariables.position ?? currentCards.length;

         const tempId = `temp-${Date.now()}`;
         const newCard = {
           ...newCardVariables,
           _id: tempId,
           position,
           _created_at: new Date(),
           _modified_at: new Date(),
         } as KanbanCardType<T>;

         queryClient.setQueryData<ListResponseType<KanbanCardType<T>>>(queryKey, {
           ...previousCards,
           Data: [...previousCards.Data, newCard],
         });
      }

      return { previousCards, queryKey };
    },
    onSuccess: async (cardId, _variables, context) => {
       if (context?.queryKey) {
           await queryClient.invalidateQueries({ queryKey: context.queryKey });
       }
       onCardCreateRef.current?.({
         _id: cardId,
         ..._variables,
       } as KanbanCardType<T>);
    },
    onError: (error, _variables, context) => {
      if (context?.previousCards && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousCards);
      }
      onErrorRef.current?.(toError(error));
    },
    onSettled: (_data, _error, variables) => {
       const columnId = variables.columnId;
       const opts = getColumnApiOptions(columnId);
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", source, columnId, opts] });
    }
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<KanbanCardType<T>> }) => {
      await api<KanbanCardType<T>>(source).update(id, updates);
      return { id, updates };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["kanban-cards", source] });
      return {};
    },
    onSuccess: async (result) => {
      onCardUpdateRef.current?.({ _id: result.id, ...result.updates } as any);
    },
    onError: (error, _variables, _context) => {
      onErrorRef.current?.(toError(error));
    },
    onSettled: () => {
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", source] });
    }
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      await api(source).delete(id);
      return id;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["kanban-cards", source] });
      return {};
    },
    onSuccess: async (id) => {
      onCardDeleteRef.current?.(id);
    },
    onError: (error, _id, _context) => {
      onErrorRef.current?.(toError(error));
    },
    onSettled: () => {
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", source] });
    }
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, fromColumnId, toColumnId, position }: { cardId: string; fromColumnId: string; toColumnId: string; position?: number }) => {
      const updates: any = { columnId: toColumnId, ...(position !== undefined && { position }) };
      await api<KanbanCardType<T>>(source).update(cardId, updates);
      return { cardId, fromColumnId, toColumnId, position };
    },
    onMutate: async ({ cardId, fromColumnId, toColumnId, position }) => {
       const fromOpts = getColumnApiOptions(fromColumnId);
       const toOpts = getColumnApiOptions(toColumnId);
       const fromQueryKey = ["kanban-cards", source, fromColumnId, fromOpts];
       const toQueryKey = ["kanban-cards", source, toColumnId, toOpts];

       await queryClient.cancelQueries({ queryKey: fromQueryKey });
       await queryClient.cancelQueries({ queryKey: toQueryKey });

       const previousFromData = queryClient.getQueryData<ListResponseType<KanbanCardType<T>>>(fromQueryKey);
       const previousToData = queryClient.getQueryData<ListResponseType<KanbanCardType<T>>>(toQueryKey);

       if (previousFromData && previousToData) {
         const cardToMove = previousFromData.Data.find(c => c._id === cardId);

         if (cardToMove) {
           const newFromData = {
             ...previousFromData,
             Data: previousFromData.Data.filter(c => c._id !== cardId)
           };

           const movedCard = {
             ...cardToMove,
             columnId: toColumnId,
             position: position ?? previousToData.Data.length,
             _modified_at: new Date()
           };

           const newToData = {
             ...previousToData,
             Data: [...previousToData.Data, movedCard].sort((a, b) => a.position - b.position)
           };

           queryClient.setQueryData(fromQueryKey, newFromData);
           queryClient.setQueryData(toQueryKey, newToData);
         }
       }

       return {
         previousFromData,
         previousToData,
         fromQueryKey,
         toQueryKey,
         fromColumnId,
         toColumnId
       };
    },
    onSuccess: async (result) => {
       onCardMoveRef.current?.(
         { _id: result.cardId } as any,
         result.fromColumnId,
         result.toColumnId
       );
    },
    onError: (error, _variables, context) => {
      if (context?.previousFromData && context?.fromQueryKey) {
        queryClient.setQueryData(context.fromQueryKey, context.previousFromData);
      }
      if (context?.previousToData && context?.toQueryKey) {
        queryClient.setQueryData(context.toQueryKey, context.previousToData);
      }
      onErrorRef.current?.(toError(error));
    },
    onSettled: (_data, _error, variables) => {
       const fromOpts = getColumnApiOptions(variables.fromColumnId);
       const toOpts = getColumnApiOptions(variables.toColumnId);
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", source, variables.fromColumnId, fromOpts] });
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", source, variables.toColumnId, toOpts] });
    }
  });

  const reorderCardsMutation = useMutation({
    mutationFn: async ({ cardIds, columnId }: { cardIds: string[]; columnId: string }) => {
       const updates = cardIds.map((id, index) => ({ id, position: index, columnId }));
       await Promise.all(
        updates.map((update) =>
          api<KanbanCardType<T>>(source).update(update.id, { position: update.position, columnId: update.columnId } as Partial<KanbanCardType<T>>)
        )
      );
    },
    onMutate: async ({ columnId }) => {
       const opts = getColumnApiOptions(columnId);
       const queryKey = ["kanban-cards", source, columnId, opts];
       await queryClient.cancelQueries({ queryKey });
       return {};
    },
    onSuccess: () => {},
    onError: (error, _variables, _context) => {
      onErrorRef.current?.(toError(error));
    },
    onSettled: (_data, _error, variables) => {
       const opts = getColumnApiOptions(variables.columnId);
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", source, variables.columnId, opts] });
    }
  });

  // ============================================================
  // DRAG & DROP INTEGRATION
  // ============================================================

  const handleCardMove = useCallback(
    async (card: KanbanCardType<T>, fromColumnId: string, toColumnId: string) => {
      try {
        await moveCardMutation.mutateAsync({
          cardId: card._id,
          fromColumnId,
          toColumnId,
          position: undefined,
        });
      } catch (error) {
        // Error already handled in mutation onError
      }
    },
    [moveCardMutation]
  );

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const processedColumns = useMemo(() => {
    return columnConfigs
      .sort((a, b) => a.position - b.position)
      .map((config, index) => {
        const query = columnQueries[index];
        const cards = query.data?.Data || [];

        return {
          _id: config.id,
          title: config.title,
          position: config.position,
          color: config.color,
          limit: config.limit,
          cards: cards.sort((a, b) => a.position - b.position),
           _created_at: new Date(),
           _modified_at: new Date(),
        };
      });
  }, [columnConfigs, columnQueries]);

  const dragDropManager = useDragDropManager<T>({
    onCardMove: handleCardMove,
    onError: onErrorRef.current,
    columns: processedColumns,
    announceMove: (card, fromColumn, toColumn) => {
      console.log(
        `Kanban: Moved "${card.title}" from ${fromColumn} to ${toColumn}`
      );
    },
  });

  // ============================================================
  // PROP GETTERS
  // ============================================================

  const getCardProps = useCallback(
    (card: KanbanCardType<T>) => ({
      draggable: true,
      role: "option",
      "aria-selected": enableDragDrop && dragDropManager.draggedCard?._id === card._id,
      "aria-grabbed": enableDragDrop && dragDropManager.draggedCard?._id === card._id,
      onDragStart: (e: any) => {
        if (!enableDragDrop) return;
        e.dataTransfer.setData("text/plain", JSON.stringify(card));
        const nativeEvent = e.nativeEvent || e;
        dragDropManager.handleDragStart(nativeEvent, card);
      },
      onDragEnd: dragDropManager.handleDragEnd,
      onKeyDown: (e: any) => {
        if (!enableDragDrop) return;
        const nativeEvent = e.nativeEvent || e;
        dragDropManager.handleKeyDown(nativeEvent, card);
      }
    }),
    [enableDragDrop, dragDropManager]
  );

  const getColumnProps = useCallback(
    (columnId: string) => ({
      "data-column-id": columnId,
      role: "listbox",
      onDragOver: (e: any) => {
        if (!enableDragDrop) return;
        const nativeEvent = e.nativeEvent || e;
        dragDropManager.handleDragOver(nativeEvent, columnId);
      },
      onDrop: (e: any) => {
        if (!enableDragDrop) return;
        const nativeEvent = e.nativeEvent || e;
        dragDropManager.handleDrop(nativeEvent, columnId);
      }
    }),
    [enableDragDrop, dragDropManager]
  );

  // ============================================================
  // SEARCH OPERATIONS
  // ============================================================

  const setSearchFieldAndQuery = useCallback((field: string, query: string) => {
    // Validate search query length to prevent DoS
    if (query.length > 255) {
      console.warn("Search query exceeds maximum length of 255 characters");
      return;
    }

    // Update immediate value for UI
    setSearch((prev) => ({ ...prev, query, field }));

    // Clear existing debounce timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Debounce the actual API query update
    searchDebounceRef.current = setTimeout(() => {
      setSearch((prev) => ({ ...prev, debouncedQuery: query }));
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    // Clear debounce timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setSearch({ query: "", debouncedQuery: "", field: null });
  }, []);

  const totalCards = countData?.Count || 0;

  const isLoading = isLoadingCards || isLoadingCount;
  const isFetching = isFetchingCards;
  const isUpdating =
    createCardMutation.isPending ||
    updateCardMutation.isPending ||
    deleteCardMutation.isPending ||
    moveCardMutation.isPending ||
    reorderCardsMutation.isPending;

  const error = cardsError || countError;

  // ============================================================
  // REFETCH OPERATIONS
  // ============================================================

  const refetch = useCallback(async (): Promise<void> => {
    await refetchCards();
  }, [refetchCards]);

  const refresh = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === "kanban-cards" ||
        query.queryKey[0] === "kanban-count",
    });
  }, [queryClient]);

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  useEffect(() => {
    if (error && onErrorRef.current) {
      onErrorRef.current(toError(error));
    }
  }, [error]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  return {
    // Data
    columns: processedColumns,
    totalCards,

    // Loading States
    isLoading,
    isFetching,
    isUpdating,

    // Error Handling
    error: error ? toError(error) : null,

    // Card Operations (Flat Access)
    createCard: createCardMutation.mutateAsync,
    updateCard: useCallback(
      async (id: string, updates: Partial<KanbanCardType<T>>) => {
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
      async (cardId: string, toColumnId: string, position?: number, fromColumnId?: string) => {
        if (!fromColumnId) {
          for (const column of processedColumns) {
            const card = column.cards.find(c => c._id === cardId);
            if (card) {
              fromColumnId = column._id;
              break;
            }
          }
          if (!fromColumnId) {
            throw new Error(`Card ${cardId} not found in any column`);
          }
        }
        await moveCardMutation.mutateAsync({ cardId, fromColumnId, toColumnId, position });
      },
      [moveCardMutation, processedColumns]
    ),
    reorderCards: useCallback(
      async (cardIds: string[], columnId: string) => {
        await reorderCardsMutation.mutateAsync({ cardIds, columnId });
      },
      [reorderCardsMutation]
    ),

    // Search (Flat Access)
    searchQuery: search.query,
    searchField: search.field,
    setSearch: setSearchFieldAndQuery,
    clearSearch,

    // Filter (Simplified chainable API)
    filter,

    // Drag Drop (Flat Access)
    isDragging: enableDragDrop ? dragDropManager.isDragging : false,
    draggedCard: enableDragDrop ? dragDropManager.draggedCard : null,
    dragOverColumn: enableDragDrop ? dragDropManager.dragOverColumn : null,
    handleDragStart: enableDragDrop
      ? dragDropManager.handleDragStart
      : () => {},
    handleDragOver: enableDragDrop ? dragDropManager.handleDragOver : () => {},
    handleDrop: enableDragDrop ? dragDropManager.handleDrop : () => {},
    handleDragEnd: enableDragDrop ? dragDropManager.handleDragEnd : () => {},
    handleKeyDown: enableDragDrop ? dragDropManager.handleKeyDown : () => {},

    // Prop Getters
    getCardProps: enableDragDrop ? getCardProps : (_card: any) => ({} as any),
    getColumnProps: enableDragDrop ? getColumnProps : (_columnId: string) => ({} as any),

    // Load More (Per Column)
    loadMore: useCallback((columnId: string) => {
      setColumnPagination((prev) => ({
        ...prev,
        [columnId]: (prev[columnId] || 10) + 10,
      }));
    }, []),

    // Utilities
    refetch,
    refresh,
  };
}
