import { createContext, useContext } from "react";
import { UseKanbanReturn } from "./types";

export const KanbanContext = createContext<UseKanbanReturn<any> | null>(null);

export function useKanbanContext<T extends Record<string, any> = any>() {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error(
      "Kanban components must be used within a KanbanBoard component"
    );
  }
  return context as UseKanbanReturn<T>;
}
