import * as React from "react";
import { cn } from "@/lib/utils";
import { KanbanContext, useKanbanContext, UseKanbanReturn, KanbanCard as KanbanCardType } from "../../../../../sdk/components/hooks/useKanban";

// ============================================================
// COMPOUND COMPONENTS
// ============================================================

/**
 * Main Kanban Board Wrapper
 * Provides the KanbanContext to all children
 */
interface KanbanBoardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  instance: UseKanbanReturn<any>;
}

const KanbanBoard = React.forwardRef<HTMLDivElement, KanbanBoardProps>(
  ({ className, instance, children, ...props }, ref) => (
    <KanbanContext.Provider value={instance}>
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-grow items-start gap-x-4 overflow-x-auto py-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </KanbanContext.Provider>
  )
);
KanbanBoard.displayName = "KanbanBoard";

/**
 * Kanban Column Wrapper
 * Automatically handles Drag & Drop logic for the column
 */
interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  columnId: string;
}

const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
  ({ className, columnId, ...props }, ref) => {
    const kanban = useKanbanContext();
    const columnProps = kanban.getColumnProps(columnId);
    const isDropTarget = kanban.isDragging && kanban.dragOverColumn === columnId;

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full min-w-[300px] flex-col rounded-lg border bg-gray-50 p-3",
          kanban.isDragging ? "transition-all duration-200" : "",
          isDropTarget ? "bg-blue-100 border-blue-400 border-2 shadow-lg ring-2 ring-blue-300 ring-opacity-50" : "",
          className
        )}
        {...columnProps}
        {...props}
      />
    );
  }
);
KanbanColumn.displayName = "KanbanColumn";

const KanbanColumnHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-3 flex items-center justify-between", className)}
    {...props}
  />
));
KanbanColumnHeader.displayName = "KanbanColumnHeader";

const KanbanColumnTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-semibold text-gray-700", className)}
    {...props}
  />
));
KanbanColumnTitle.displayName = "KanbanColumnTitle";

const KanbanColumnContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 space-y-2 overflow-y-auto", className)}
    {...props}
  />
));
KanbanColumnContent.displayName = "KanbanColumnContent";

/**
 * Kanban Card Wrapper
 * Automatically handles Drag & Drop logic for the card
 */
interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  card: KanbanCardType<any>;
}

const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ className, card, style, ...props }, ref) => {
    const kanban = useKanbanContext();
    const cardProps = kanban.getCardProps(card);
    const isDragging = kanban.draggedCard?._id === card._id;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-move",
          isDragging ? "opacity-30 scale-95" : "",
          className
        )}
        style={{
          ...style, // Maintain user overrides
          // We could merge styles if getCardProps returned styles too
        }}
        {...cardProps}
        {...props}
      />
    );
  }
);
KanbanCard.displayName = "KanbanCard";

const KanbanCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-medium text-gray-900 mb-1", className)}
    {...props}
  />
));
KanbanCardTitle.displayName = "KanbanCardTitle";

const KanbanCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
));
KanbanCardDescription.displayName = "KanbanCardDescription";

const KanbanColumnFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-3 pt-3 border-t border-gray-200", className)}
    {...props}
  />
));
KanbanColumnFooter.displayName = "KanbanColumnFooter";

export {
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnTitle,
  KanbanColumnContent,
  KanbanCard,
  KanbanCardTitle,
  KanbanCardDescription,
  KanbanColumnFooter,
};
