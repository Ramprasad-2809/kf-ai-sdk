// ============================================================
// USE KANBAN HOOK - Main Implementation
// ============================================================
// Simplified hook following useTable pattern - provides clean abstraction

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useQueries, keepPreviousData } from "@tanstack/react-query";
import { api } from "../../../api";
import type { ListOptions, ListResponse } from "../../../types/common";
import { useFilter } from "../useFilter";

import type {
  UseKanbanOptions,
  UseKanbanReturn,
  KanbanCard,
} from "./types";
import { useDragDropManager } from "./dragDropManager";

// ============================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================

export function useKanban<T extends Record<string, any> = Record<string, any>>(
  options: UseKanbanOptions<T>
): UseKanbanReturn<T> {
  const {
    columns: columnConfigs,
    cardSource,
    source,
    enableDragDrop = true,
    cardFieldDefinitions,
    initialState,
    onCardMove,
    onCardCreate,
    onCardUpdate,
    onCardDelete,
    onError,
    onFilterError,
  } = options;

  // Use source or cardSource (backwards compatibility)
  const dataSource = source || cardSource;
  
  if (!dataSource) {
    throw new Error('useKanban requires either "source" or "cardSource" parameter');
  }

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [search, setSearch] = useState({
    query: initialState?.search || "",
  });

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

  const filterHook = useFilter<T>({
    initialConditions: initialState?.filters,
    initialLogicalOperator: initialState?.filterOperator || "And",
    fieldDefinitions: cardFieldDefinitions,
    validateOnChange: true,
    onValidationError: onFilterError,
  });

  // Helper to generate API options for a specific column
  // This is used for both initial fetching and mutation updates
  const getColumnApiOptions = useCallback((columnId: string): ListOptions => {
      // 1. Construct Compound Filter Payload
      const columnFilterObject = {
        LHSField: "columnId",
        Operator: "EQ",
        RHSValue: columnId,
        RHSType: "Constant"
      };

      const basePayload = filterHook.filterPayload;
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

      // 2. Construct API Options
      const opts: ListOptions = {
        Page: 1, // Always page 1 due to expanding PageSize strategy
        PageSize: columnPagination[columnId] || 10,
        Filter: combinedPayload,
      };

      // Add Sorting
      if (sorting.field && sorting.direction) {
        opts.Sort = [
          {
            Field: String(sorting.field),
            Order: sorting.direction === "asc" ? "ASC" : "DESC",
          },
          { Field: "position", Order: "ASC" },
        ];
      } else {
        opts.Sort = [
          { Field: "columnId", Order: "ASC" },
          { Field: "position", Order: "ASC" },
        ];
      }

      // Add Search
      if (search.query) {
        opts.Search = search.query;
      }
      
      return opts;
  }, [filterHook.filterPayload, columnPagination, sorting, search.query]);

  // ============================================================
  // COLUMN QUERY GENERATION
  // ============================================================

  const columnQueries = useQueries({
    queries: columnConfigs.map((column) => {
      const opts = getColumnApiOptions(column.id);
      return {
        queryKey: ["kanban-cards", dataSource, column.id, opts],
        queryFn: async (): Promise<ListResponse<KanbanCard<T>>> => {
          try {
            return await api<KanbanCard<T>>(dataSource).list(opts);
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

  // Get total card count (Global count, or sum of columns? Usually global might differ if filters applied)
  // For simplicity, we can fetch global count but restricted by filters?
  // Actually, standard Kanban usually doesn't show "Total Cards" unless it's per column.
  // We will keep the global count query for now but it might be slightly inaccurate if we want "Total Visible".
  // Let's rely on summing up column counts for "Total Visible" and keep this for "Total Database"?
  // Or just query with base filters?
  // Let's keep existing logic but apply ONLY base filters + search.
  
  const cardApiOptions = useMemo((): ListOptions => {
      // This is for the GLOBAL count (ignoring column split)
      const opts: ListOptions = {};
      if (search.query) opts.Search = search.query;
      if (filterHook.filterPayload) opts.Filter = filterHook.filterPayload;
      return opts;
  }, [search.query, filterHook.filterPayload]);

  const {
    data: countData,
    isLoading: isLoadingCount,
    error: countError,
  } = useQuery({
    queryKey: ["kanban-count", dataSource, cardApiOptions],
    queryFn: async () => {
      try {
        return await api<KanbanCard<T>>(dataSource).count(cardApiOptions);
      } catch (err) {
        if (onErrorRef.current) {
          onErrorRef.current(err as Error);
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
    mutationFn: async (card: Partial<KanbanCard<T>> & { columnId: string }) => {
      // We need to fetch the current count or max position to append correclty if not provided
      // Simplification: just send position=999999 or let backend handle it?
      // Since we want optimistic UI, we should calculate it.
      // But calculating it from partial data (paginated) is risky.
      // Let's rely on backend or default to top/bottom logic.
      const position = card.position ?? 999999;
      const response = await api<KanbanCard<T>>(dataSource).create({ ...card, position });
      return response._id;
    },
    onMutate: async (newCardVariables) => {
      const columnId = newCardVariables.columnId;
      const opts = getColumnApiOptions(columnId);
      const queryKey = ["kanban-cards", dataSource, columnId, opts];

      await queryClient.cancelQueries({ queryKey });

      const previousCards = queryClient.getQueryData<ListResponse<KanbanCard<T>>>(queryKey);

      if (previousCards) {
         // Determine position
         const currentCards = previousCards.Data;
         const position = newCardVariables.position ?? currentCards.length;

         const tempId = `temp-${Date.now()}`;
         const newCard = {
           ...newCardVariables,
           _id: tempId,
           position,
           _created_at: new Date(),
           _modified_at: new Date(),
         } as KanbanCard<T>;

         queryClient.setQueryData<ListResponse<KanbanCard<T>>>(queryKey, {
           ...previousCards,
           Data: [...previousCards.Data, newCard],
         });
      }

      return { previousCards, queryKey };
    },
    onSuccess: async (cardId, _variables, context) => {
       // Refetch the specific column
       if (context?.queryKey) {
           await queryClient.invalidateQueries({ queryKey: context.queryKey });
       }
       onCardCreateRef.current?.({
         _id: cardId,
         ..._variables,
       } as KanbanCard<T>);
    },
    onError: (error, _variables, context) => {
      if (context?.previousCards && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousCards);
      }
      onErrorRef.current?.(error as Error);
    },
    onSettled: (_data, _error, variables) => {
       const columnId = variables.columnId;
       const opts = getColumnApiOptions(columnId);
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", dataSource, columnId, opts] });
    }
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<KanbanCard<T>> }) => {
      await api<KanbanCard<T>>(dataSource).update(id, updates);
      return { id, updates };
    },
    onMutate: async () => {
      // We don't know the columnId easily without passing it.
      // We can try to finding it in all column queries
      // For now, simpler to just invalidate everything on success/error
      // OR pass columnId in updates if available.
      // If we want optimistic updates, we need to iterate all queries.
      
      // Strategy: Invalidate all columns. Optimistic update is hard without knowing columnId.
      // If the user passes columnId in updates, we can optimize.
      
      await queryClient.cancelQueries({ queryKey: ["kanban-cards", dataSource] });
      return {};
    },
    onSuccess: async (result) => {
      // Find the card to trigger callback
      // Since we don't have a single list, this is harder.
      // We can skip finding it for now or iterate queries.
      onCardUpdateRef.current?.({ _id: result.id, ...result.updates } as any);
    },
    onError: (error, _variables, _context) => {
      onErrorRef.current?.(error as Error);
    },
    onSettled: () => {
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", dataSource] });
    }
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      await api(dataSource).delete(id);
      return id;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["kanban-cards", dataSource] });
      // Optimistic delete: Iterate all column queries and remove?
      // For now, simple invalidation
      return {};
    },
    onSuccess: async (id) => {
      onCardDeleteRef.current?.(id);
    },
    onError: (error, _id, _context) => {
      onErrorRef.current?.(error as Error);
    },
    onSettled: () => {
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", dataSource] });
    }
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, toColumnId, position }: { cardId: string; toColumnId: string; position?: number }) => {
      const updates: any = { columnId: toColumnId, ...(position !== undefined && { position }) };
      await api<KanbanCard<T>>(dataSource).update(cardId, updates);
      return { cardId, toColumnId, position };
    },
    onMutate: async () => {
       // Moving is complex to optimistic update across multiple paginated queries.
       // We'll rely on fast refetch for now.
       // Optimistic update would require:
       // 1. Find source column query -> remove card
       // 2. Find target column query -> add card
       // 3. Handle reordering in target
       await queryClient.cancelQueries({ queryKey: ["kanban-cards", dataSource] });
       return {};
    },
    onSuccess: async (result) => {
       // Manually trigger callback if needed, but easier to wait for refetch
       onCardMoveRef.current?.(
         { _id: result.cardId } as any, 
         "unknown", // we don't know fromColumnId without looking it up
         result.toColumnId
       );
    },
    onError: (error, _variables, _context) => {
      onErrorRef.current?.(error as Error);
    },
    onSettled: () => {
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", dataSource] });
    }
  });

  const reorderCardsMutation = useMutation({
    mutationFn: async ({ cardIds, columnId }: { cardIds: string[]; columnId: string }) => {
       const updates = cardIds.map((id, index) => ({ id, position: index, columnId }));
       await Promise.all(
        updates.map((update) =>
          api<KanbanCard<T>>(dataSource).update(update.id, { position: update.position, columnId: update.columnId } as Partial<KanbanCard<T>>)
        )
      );
    },
    onMutate: async ({ columnId }) => {
       // Optimistic reorder restricted to single column
       const opts = getColumnApiOptions(columnId);
       const queryKey = ["kanban-cards", dataSource, columnId, opts];
       await queryClient.cancelQueries({ queryKey });
       // Can implement optimistic reorder here if we want to parse cardIds
       // But simpler to just invalidate.
       return {};
    },
    onSuccess: () => {}, 
    onError: (error, _variables, _context) => {
      onErrorRef.current?.(error as Error);
    },
    onSettled: (_data, _error, variables) => {
       const opts = getColumnApiOptions(variables.columnId);
       queryClient.invalidateQueries({ queryKey: ["kanban-cards", dataSource, variables.columnId, opts] });
    }
  });

  // ============================================================
  // DRAG & DROP INTEGRATION
  // ============================================================

  const handleCardMove = useCallback(
    async (card: KanbanCard<T>, _fromColumnId: string, toColumnId: string) => {
      try {
        await moveCardMutation.mutateAsync({
          cardId: card._id,
          toColumnId,
          position: undefined, // Let the backend calculate optimal position
        });
      } catch (error) {
        // Error already handled in mutation onError
      }
    },
    [moveCardMutation]
  );

  // ============================================================
  // COMPUTED VALUES (Moved up for dependencies)
  // ============================================================

  const processedColumns = useMemo(() => {
    // Map column configs to KanbanColumn structure using query results
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
          // We can expose loading/error state per column here if needed in the future
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
    (card: KanbanCard<T>) => ({
      draggable: true,
      role: "option",
      "aria-selected": enableDragDrop && dragDropManager.draggedCard?._id === card._id,
      "aria-grabbed": enableDragDrop && dragDropManager.draggedCard?._id === card._id,
      onDragStart: (e: any) => {
        if (!enableDragDrop) return;
        // Abstracting the dataTransfer logic
        e.dataTransfer.setData("text/plain", JSON.stringify(card));
        // Use native event if available (ShadCN/Radix sometimes wraps events) or fallback to e
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

  const setSearchQuery = useCallback((value: string) => {
    setSearch({ query: value });
  }, []);

  const clearSearch = useCallback(() => {
    setSearch({ query: "" });
  }, []);



  // ============================================================
  // PROP GETTERS
  // ============================================================



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
      onErrorRef.current(error as Error);
    }
  }, [error]);

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
    error: error as Error | null,

    // Card Operations (Flat Access)
    createCard: createCardMutation.mutateAsync,
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
    reorderCards: useCallback(
      async (cardIds: string[], columnId: string) => {
        await reorderCardsMutation.mutateAsync({ cardIds, columnId });
      },
      [reorderCardsMutation]
    ),

    // Search (Flat Access)
    searchQuery: search.query,
    setSearchQuery,
    clearSearch,

    // Filter (Nested - following useTable pattern)
    filter: filterHook,

    // Drag Drop (Flat Access)
    isDragging: enableDragDrop ? dragDropManager.isDragging : false,
    draggedCard: enableDragDrop ? dragDropManager.draggedCard : null,
    handleDragStart: enableDragDrop
      ? dragDropManager.handleDragStart
      : () => {},
    handleDragOver: enableDragDrop ? dragDropManager.handleDragOver : () => {},
    handleDrop: enableDragDrop ? dragDropManager.handleDrop : () => {},
    handleDragEnd: enableDragDrop ? dragDropManager.handleDragEnd : () => {},
    handleKeyDown: enableDragDrop ? dragDropManager.handleKeyDown : () => {},
    
    // Prop Getters
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
