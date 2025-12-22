// ============================================================
// KANBAN DRAG & DROP MANAGER
// ============================================================
// Complete drag & drop functionality with mouse, touch, and keyboard support
// Includes accessibility features and auto-scrolling

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  KanbanCard,
  KanbanColumn,
  DragDropState,
  DragDropManager
} from "./types";

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================

const AUTO_SCROLL_THRESHOLD = 50;
const AUTO_SCROLL_SPEED = 5;
const TOUCH_MOVE_THRESHOLD = 5;

// ============================================================
// DRAG & DROP HOOK
// ============================================================

export function useDragDropManager<T>({
  onCardMove,
  onError,
  columns,
  announceMove
}: {
  onCardMove?: (card: KanbanCard<T>, fromColumnId: string, toColumnId: string) => void;
  onError?: (error: Error) => void;
  columns: KanbanColumn<T>[];
  announceMove?: (card: KanbanCard<T>, fromColumn: string, toColumn: string) => void;
}): DragDropManager<T> {
  
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  const [dragState, setDragState] = useState<DragDropState<T>>({
    isDragging: false,
    draggedCard: null,
    dragOverColumn: null,
    dragOverPosition: null,
    dragSourceColumn: null
  });
  
  // Refs for managing drag operations
  const dragImageRef = useRef<HTMLElement | null>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; card: KanbanCard<T> } | null>(null);
  
  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  
  const resetState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      dragOverColumn: null,
      dragOverPosition: null,
      dragSourceColumn: null
    });
    
    // Clear any auto-scroll timeout
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }
  }, []);
  
  const findColumnById = useCallback((columnId: string): KanbanColumn<T> | null => {
    return columns.find(col => col._id === columnId) || null;
  }, [columns]);
  
  const findCardById = useCallback((cardId: string): { card: KanbanCard<T>; column: KanbanColumn<T> } | null => {
    for (const column of columns) {
      const card = column.cards.find(c => c._id === cardId);
      if (card) {
        return { card, column };
      }
    }
    return null;
  }, [columns]);
  
  // ============================================================
  // MOUSE DRAG HANDLERS
  // ============================================================
  
  const handleDragStart = useCallback((event: DragEvent, card: KanbanCard<T>) => {
    try {
      const cardElement = event.target as HTMLElement;
      const sourceColumn = findColumnById(card.columnId);
      
      if (!sourceColumn) {
        throw new Error("Source column not found");
      }
      
      // Set up drag data
      event.dataTransfer?.setData("text/plain", card._id);
      event.dataTransfer?.setData("application/json", JSON.stringify(card));
      
      // Create drag image from the actual card element
      const dragImage = cardElement.cloneNode(true) as HTMLElement;
      dragImage.style.cssText = `
        position: fixed;
        top: -1000px;
        left: -1000px;
        opacity: 0.9;
        transform: rotate(-2deg) scale(0.95);
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        pointer-events: none;
        z-index: 9999;
        max-width: 300px;
        background: white;
        border-radius: 8px;
      `;
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;
      
      if (event.dataTransfer) {
        event.dataTransfer.setDragImage(dragImage, event.offsetX || 50, event.offsetY || 20);
      }
      
      // Update state
      setDragState({
        isDragging: true,
        draggedCard: card,
        dragOverColumn: null,
        dragOverPosition: null,
        dragSourceColumn: sourceColumn._id
      });
      
      // Accessibility announcement
      announceMove?.(card, sourceColumn.title, "being moved");
      
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Drag start failed"));
      resetState();
    }
  }, [findColumnById, onError, resetState, announceMove]);
  
  const handleDragOver = useCallback((event: DragEvent, columnId?: string) => {
    event.preventDefault();
    
    if (!dragState.isDragging || !dragState.draggedCard) return;
    
    const column = columnId ? findColumnById(columnId) : null;
    
    setDragState(prev => ({
      ...prev,
      dragOverColumn: column?._id || null,
      dragOverPosition: null // Will be calculated based on mouse position
    }));
    
    // Auto-scroll logic
    handleAutoScroll(event);
    
  }, [dragState.isDragging, dragState.draggedCard, findColumnById]);
  
  const handleDrop = useCallback((event: DragEvent, columnId: string) => {
    event.preventDefault();
    
    if (!dragState.isDragging || !dragState.draggedCard) return;
    
    try {
      const card = dragState.draggedCard;
      const sourceColumnId = dragState.dragSourceColumn!;
      const targetColumn = findColumnById(columnId);
      const sourceColumn = findColumnById(sourceColumnId);
      
      if (!targetColumn || !sourceColumn) {
        throw new Error("Target or source column not found");
      }
      
      // Don't do anything if dropping in the same position
      if (sourceColumnId === columnId) {
        resetState();
        return;
      }
      
      // Check if column has a limit
      if (targetColumn.limit && targetColumn.cards.length >= targetColumn.limit) {
        throw new Error(`Column "${targetColumn.title}" has reached its limit of ${targetColumn.limit} cards`);
      }
      
      // Call the move handler
      onCardMove?.(card, sourceColumnId, columnId);
      
      // Accessibility announcement
      announceMove?.(card, sourceColumn.title, targetColumn.title);
      
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Drop failed"));
    } finally {
      resetState();
    }
  }, [dragState, findColumnById, onCardMove, onError, resetState, announceMove]);
  
  const handleDragEnd = useCallback(() => {
    // Clean up drag image
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
    
    resetState();
  }, [resetState]);
  
  // ============================================================
  // AUTO-SCROLL FUNCTIONALITY
  // ============================================================
  
  const handleAutoScroll = useCallback((event: DragEvent) => {
    const container = (event.target as HTMLElement).closest('.kanban-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const containerWidth = rect.width;
    
    let scrollDirection = 0;
    
    // Check if near left edge
    if (mouseX < AUTO_SCROLL_THRESHOLD) {
      scrollDirection = -AUTO_SCROLL_SPEED;
    }
    // Check if near right edge
    else if (mouseX > containerWidth - AUTO_SCROLL_THRESHOLD) {
      scrollDirection = AUTO_SCROLL_SPEED;
    }
    
    if (scrollDirection !== 0) {
      // Clear existing timeout
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
      
      // Start auto-scroll
      const scroll = () => {
        container.scrollLeft += scrollDirection;
        autoScrollTimeoutRef.current = setTimeout(scroll, 16); // ~60fps
      };
      
      autoScrollTimeoutRef.current = setTimeout(scroll, 100);
    } else {
      // Stop auto-scroll
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    }
  }, []);
  
  // ============================================================
  // KEYBOARD NAVIGATION
  // ============================================================
  
  const handleKeyDown = useCallback((event: KeyboardEvent, card: KanbanCard<T>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space', 'Escape'].includes(event.key)) {
      return;
    }
    
    event.preventDefault();
    
    const cardData = findCardById(card._id);
    if (!cardData) return;
    
    const { column: currentColumn } = cardData;
    const currentColumnIndex = columns.findIndex(col => col._id === currentColumn._id);
    
    try {
      switch (event.key) {
        case 'ArrowLeft':
          // Move to previous column
          if (currentColumnIndex > 0) {
            const targetColumn = columns[currentColumnIndex - 1];
            onCardMove?.(card, currentColumn._id, targetColumn._id);
            announceMove?.(card, currentColumn.title, targetColumn.title);
          }
          break;
          
        case 'ArrowRight':
          // Move to next column
          if (currentColumnIndex < columns.length - 1) {
            const targetColumn = columns[currentColumnIndex + 1];
            onCardMove?.(card, currentColumn._id, targetColumn._id);
            announceMove?.(card, currentColumn.title, targetColumn.title);
          }
          break;
          
        case 'ArrowUp':
          // Move up within column (future enhancement)
          announceMove?.(card, "current position", "position above");
          break;
          
        case 'ArrowDown':
          // Move down within column (future enhancement)
          announceMove?.(card, "current position", "position below");
          break;
          
        case 'Enter':
        case 'Space':
          // Start drag mode (future enhancement for keyboard-only drag)
          announceMove?.(card, currentColumn.title, "drag mode");
          break;
          
        case 'Escape':
          // Cancel drag mode
          announceMove?.(card, "drag mode", "cancelled");
          break;
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Keyboard navigation failed"));
    }
  }, [findCardById, columns, onCardMove, onError, announceMove]);
  
  // ============================================================
  // TOUCH HANDLERS
  // ============================================================
  
  const handleTouchStart = useCallback((event: TouchEvent, card: KanbanCard<T>) => {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      card
    };
  }, []);
  
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Check if moved enough to start drag
    if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
      const card = touchStartRef.current.card;
      const sourceColumn = findColumnById(card.columnId);
      
      if (!sourceColumn) return;
      
      setDragState({
        isDragging: true,
        draggedCard: card,
        dragOverColumn: null,
        dragOverPosition: null,
        dragSourceColumn: sourceColumn._id
      });
      
      announceMove?.(card, sourceColumn.title, "being moved");
    }
  }, [findColumnById, announceMove]);
  
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!dragState.isDragging || !dragState.draggedCard || !touchStartRef.current) {
      touchStartRef.current = null;
      return;
    }
    
    try {
      // Find the element under the touch point
      const touch = event.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const columnElement = elementBelow?.closest('[data-column-id]') as HTMLElement;
      
      if (columnElement) {
        const columnId = columnElement.dataset.columnId!;
        const card = dragState.draggedCard;
        const sourceColumnId = dragState.dragSourceColumn!;
        const targetColumn = findColumnById(columnId);
        const sourceColumn = findColumnById(sourceColumnId);
        
        if (targetColumn && sourceColumn && sourceColumnId !== columnId) {
          // Check column limit
          if (targetColumn.limit && targetColumn.cards.length >= targetColumn.limit) {
            throw new Error(`Column "${targetColumn.title}" has reached its limit of ${targetColumn.limit} cards`);
          }
          
          onCardMove?.(card, sourceColumnId, columnId);
          announceMove?.(card, sourceColumn.title, targetColumn.title);
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Touch drop failed"));
    } finally {
      touchStartRef.current = null;
      resetState();
    }
  }, [dragState, findColumnById, onCardMove, onError, resetState, announceMove]);
  
  // ============================================================
  // ACCESSIBILITY ANNOUNCEMENTS
  // ============================================================
  
  const defaultAnnounceMove = useCallback((card: KanbanCard<T>, fromColumn: string, toColumn: string) => {
    const message = `Moved "${card.title}" from ${fromColumn} to ${toColumn}`;
    
    // Create live region announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
    
    // Also log for debugging
    console.log(`Kanban: ${message}`);
  }, []);
  
  // ============================================================
  // CLEANUP ON UNMOUNT
  // ============================================================
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
      
      if (dragImageRef.current && document.body.contains(dragImageRef.current)) {
        document.body.removeChild(dragImageRef.current);
      }
    };
  }, []);
  
  // ============================================================
  // RETURN INTERFACE
  // ============================================================
  
  return {
    // State
    isDragging: dragState.isDragging,
    draggedCard: dragState.draggedCard,
    dragOverColumn: dragState.dragOverColumn,
    dragOverPosition: dragState.dragOverPosition,
    dragSourceColumn: dragState.dragSourceColumn,
    
    // Handlers
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleKeyDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // Utilities
    announceMove: announceMove || defaultAnnounceMove,
    reset: resetState
  };
}

// ============================================================
// UTILITY FUNCTIONS FOR DRAG & DROP
// ============================================================

/**
 * Calculate drop position based on mouse coordinates
 */
export function calculateDropPosition<T>(
  event: DragEvent,
  column: KanbanColumn<T>,
  cardHeight = 80
): number {
  const columnElement = (event.target as HTMLElement).closest('.kanban-column');
  if (!columnElement) return column.cards.length;
  
  const columnRect = columnElement.getBoundingClientRect();
  const relativeY = event.clientY - columnRect.top;
  
  // Calculate which position in the column this corresponds to
  const headerHeight = 60; // Approximate column header height
  const cardY = relativeY - headerHeight;
  
  if (cardY <= 0) return 0;
  
  const position = Math.floor(cardY / cardHeight);
  return Math.min(position, column.cards.length);
}

/**
 * Add visual feedback classes to elements during drag
 */
export function addDragFeedback(element: HTMLElement, type: 'source' | 'target') {
  element.classList.add(`kanban-drag-${type}`);
}

/**
 * Remove visual feedback classes
 */
export function removeDragFeedback(element: HTMLElement) {
  element.classList.remove('kanban-drag-source', 'kanban-drag-target');
}

/**
 * Check if a column can accept a drop
 */
export function canAcceptDrop<T>(
  column: KanbanColumn<T>,
  draggedCard: KanbanCard<T>
): { canDrop: boolean; reason?: string } {
  // Check if column has a limit
  if (column.limit && column.cards.length >= column.limit && draggedCard.columnId !== column._id) {
    return {
      canDrop: false,
      reason: `Column "${column.title}" has reached its limit of ${column.limit} cards`
    };
  }
  
  // Add more validation rules here as needed
  // e.g., check card type compatibility, user permissions, etc.
  
  return { canDrop: true };
}