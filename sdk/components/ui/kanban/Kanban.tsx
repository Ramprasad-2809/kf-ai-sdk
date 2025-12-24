import * as React from "react";
import { cn } from "../../../utils";

// Simple styled wrapper components following the Table pattern
// No complex logic - just styling and basic structure

const Kanban = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full flex-grow items-start gap-x-4 overflow-x-auto py-2",
      className
    )}
    {...props}
  />
));
Kanban.displayName = "Kanban";

const KanbanColumn = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full min-w-[300px] flex-col rounded-lg border bg-gray-50 p-3",
      className
    )}
    {...props}
  />
));
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

const KanbanCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-move",
      className
    )}
    {...props}
  />
));
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
  Kanban,
  KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnTitle,
  KanbanColumnContent,
  KanbanCard,
  KanbanCardTitle,
  KanbanCardDescription,
  KanbanColumnFooter,
};
