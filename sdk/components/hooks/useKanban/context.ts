import { createContext, useContext } from "react";
import { UseKanbanReturnType } from "./types";

export const KanbanContext = createContext<UseKanbanReturnType<any> | null>(null);

export function useKanbanContext<T extends Record<string, any> = any>() {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error(
      "Kanban components must be used within a KanbanBoard component"
    );
  }
  return context as UseKanbanReturnType<T>;
}
