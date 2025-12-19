import { useState, useCallback, KeyboardEvent } from "react";
import { useKanban } from "../../../../sdk/components/hooks/useKanban";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  KanbanBoard,
  KanbanBoardProvider,
  KanbanBoardExtraMargin,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnTitle,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  KanbanBoardColumnFooter,
  KanbanBoardColumnButton,
  KanbanBoardCard,
  KanbanBoardCardDescription,
  KanbanBoardCardTextarea,
  KanbanBoardCardButton,
  KanbanBoardCardButtonGroup,
  KanbanColorCircle,
  useDndEvents,
} from "../components/ui/kanban";
import { PlusIcon, Trash2Icon } from "lucide-react";

// Task card type with custom fields
type TaskCard = {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  assignee?: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: string;
};

// Type for kanban board circle colors
type KanbanBoardCircleColor =
  | "primary"
  | "gray"
  | "red"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "pink";

// Helper to safely cast color
const toCircleColor = (color: string | undefined): KanbanBoardCircleColor => {
  const validColors: KanbanBoardCircleColor[] = [
    "primary",
    "gray",
    "red",
    "yellow",
    "green",
    "cyan",
    "blue",
    "indigo",
    "violet",
    "purple",
    "pink",
  ];
  return validColors.includes(color as KanbanBoardCircleColor)
    ? (color as KanbanBoardCircleColor)
    : "blue";
};

// Static column definitions - columns are configured once, not managed via CRUD
const BOARD_COLUMNS = [
  { id: "col_todo", title: "To Do", position: 0, color: "blue" as const },
  {
    id: "col_progress",
    title: "In Progress",
    position: 1,
    color: "yellow" as const,
  },
  { id: "col_review", title: "Review", position: 2, color: "purple" as const },
  { id: "col_done", title: "Done", position: 3, color: "green" as const },
];

// Sub-component to handle drag-and-drop events
function KanbanBoardContent({
  columns,
  newCardForms,
  setNewCardForms,
  editingCard,
  setEditingCard,
  handleCreateCard,
  handleUpdateCard,
  handleDeleteCard,
  handleKeyDown,
  handleNewCardKeyDown,
  moveCard,
}: {
  columns: any[];
  newCardForms: Record<string, { title: string; description: string }>;
  setNewCardForms: React.Dispatch<
    React.SetStateAction<Record<string, { title: string; description: string }>>
  >;
  editingCard: { id: string; title: string; description: string } | null;
  setEditingCard: React.Dispatch<
    React.SetStateAction<{
      id: string;
      title: string;
      description: string;
    } | null>
  >;
  handleCreateCard: (columnId: string) => Promise<void>;
  handleUpdateCard: (cardId: string) => Promise<void>;
  handleDeleteCard: (cardId: string) => Promise<void>;
  handleKeyDown: (
    e: KeyboardEvent<HTMLTextAreaElement>,
    cardId: string
  ) => void;
  handleNewCardKeyDown: (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    columnId: string
  ) => void;
  moveCard: (
    cardId: string,
    toColumnId: string,
    position?: number
  ) => Promise<void>;
}) {
  const { onDragEnd } = useDndEvents();

  // Handle card drop - move card to new column
  const handleMoveCardToColumn = useCallback(
    async (cardId: string, toColumnId: string) => {
      try {
        await moveCard(cardId, toColumnId);
      } catch (error) {
        console.error("Failed to move card:", error);
      }
    },
    [moveCard]
  );

  return (
    <KanbanBoard>
      <KanbanBoardExtraMargin />

      {columns.length === 0 && (
        <div className="p-4 text-gray-500">No columns found</div>
      )}

      {columns.map((column) => {
        return (
          <KanbanBoardColumn key={column._id} columnId={column._id}>
            {/* Column Header */}
            <KanbanBoardColumnHeader>
              <div className="flex items-center gap-2">
                <KanbanColorCircle color={toCircleColor(column.color)} />
                <KanbanBoardColumnTitle columnId={column._id}>
                  {column.title} ({column.cards.length})
                </KanbanBoardColumnTitle>
              </div>
            </KanbanBoardColumnHeader>

            {/* Cards List */}
            <KanbanBoardColumnList>
              {column.cards.map((card: any) => (
                <KanbanBoardColumnListItem
                  key={card._id}
                  cardId={card._id}
                  onDropOverListItem={async (dataTransferData) => {
                    const draggedCardData = JSON.parse(dataTransferData);
                    await handleMoveCardToColumn(
                      draggedCardData.id,
                      column._id
                    );
                    onDragEnd(draggedCardData.id, column._id);
                  }}
                >
                  <KanbanBoardCard
                    data={{ id: card._id }}
                    className={
                      editingCard?.id === card._id ? "ring-2 ring-blue-500" : ""
                    }
                  >
                    {editingCard?.id === card._id ? (
                      // Edit mode
                      <div className="space-y-2">
                        <Input
                          value={editingCard!.title}
                          onChange={(e) =>
                            setEditingCard({
                              id: editingCard!.id,
                              title: e.target.value,
                              description: editingCard!.description,
                            })
                          }
                          placeholder="Card title"
                          autoFocus
                        />
                        <KanbanBoardCardTextarea
                          value={editingCard!.description}
                          onChange={(e) =>
                            setEditingCard({
                              id: editingCard!.id,
                              title: editingCard!.title,
                              description: e.target.value,
                            })
                          }
                          onKeyDown={(e) => handleKeyDown(e, card._id)}
                          placeholder="Card description"
                        />
                        <KanbanBoardCardButtonGroup>
                          <KanbanBoardCardButton
                            onClick={() => handleUpdateCard(card._id)}
                          >
                            Save
                          </KanbanBoardCardButton>
                          <KanbanBoardCardButton
                            onClick={() => setEditingCard(null)}
                          >
                            Cancel
                          </KanbanBoardCardButton>
                        </KanbanBoardCardButtonGroup>
                      </div>
                    ) : (
                      // View mode
                      <div className="space-y-2">
                        <div className="font-semibold">{card.title}</div>
                        {card.description && (
                          <KanbanBoardCardDescription>
                            {card.description}
                          </KanbanBoardCardDescription>
                        )}
                        {card.priority && (
                          <div className="text-xs">
                            <span
                              className={`px-2 py-1 rounded ${
                                card.priority === "critical"
                                  ? "bg-red-100 text-red-700"
                                  : card.priority === "high"
                                    ? "bg-orange-100 text-orange-700"
                                    : card.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-green-100 text-green-700"
                              }`}
                            >
                              {card.priority}
                            </span>
                          </div>
                        )}
                        <KanbanBoardCardButtonGroup>
                          <KanbanBoardCardButton
                            onClick={() =>
                              setEditingCard({
                                id: card._id,
                                title: card.title,
                                description: card.description || "",
                              })
                            }
                          >
                            Edit
                          </KanbanBoardCardButton>
                          <KanbanBoardCardButton
                            onClick={() => handleDeleteCard(card._id)}
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </KanbanBoardCardButton>
                        </KanbanBoardCardButtonGroup>
                      </div>
                    )}
                  </KanbanBoardCard>
                </KanbanBoardColumnListItem>
              ))}
            </KanbanBoardColumnList>

            {/* New Card Form */}
            <KanbanBoardColumnFooter>
              {newCardForms[column._id] ? (
                <div className="space-y-2 p-2">
                  <Input
                    value={newCardForms[column._id].title}
                    onChange={(e) =>
                      setNewCardForms((prev) => ({
                        ...prev,
                        [column._id]: {
                          ...prev[column._id],
                          title: e.target.value,
                        },
                      }))
                    }
                    onKeyDown={(e) => handleNewCardKeyDown(e, column._id)}
                    placeholder="Card title"
                    autoFocus
                  />
                  <KanbanBoardCardTextarea
                    value={newCardForms[column._id].description}
                    onChange={(e) =>
                      setNewCardForms((prev) => ({
                        ...prev,
                        [column._id]: {
                          ...prev[column._id],
                          description: e.target.value,
                        },
                      }))
                    }
                    onKeyDown={(e) => handleNewCardKeyDown(e, column._id)}
                    placeholder="Card description (optional)"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCreateCard(column._id)}
                    >
                      Add Card
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setNewCardForms((prev) => {
                          const newForms = { ...prev };
                          delete newForms[column._id];
                          return newForms;
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <KanbanBoardColumnButton
                  onClick={() =>
                    setNewCardForms((prev) => ({
                      ...prev,
                      [column._id]: { title: "", description: "" },
                    }))
                  }
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Card
                </KanbanBoardColumnButton>
              )}
            </KanbanBoardColumnFooter>
          </KanbanBoardColumn>
        );
      })}

      <KanbanBoardExtraMargin />
    </KanbanBoard>
  );
}

export function KanbanExamplePage() {
  // Local state for new card forms (per column)
  const [newCardForms, setNewCardForms] = useState<
    Record<string, { title: string; description: string }>
  >({});
  const [editingCard, setEditingCard] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  // Use the kanban hook with static columns - following useTable pattern
  const kanban = useKanban<TaskCard>({
    cardSource: "task",
    columns: BOARD_COLUMNS,
    enableDragDrop: true,
  });

  // Card operations - flat access like useTable
  const handleCreateCard = useCallback(
    async (columnId: string) => {
      const form = newCardForms[columnId];
      if (form?.title?.trim()) {
        try {
          await kanban.createCard({
            columnId,
            title: form.title.trim(),
            description: form.description?.trim() || "",
            priority: "medium",
          });
          setNewCardForms((prev) => ({
            ...prev,
            [columnId]: { title: "", description: "" },
          }));
        } catch (error) {
          console.error("Failed to create card:", error);
        }
      }
    },
    [newCardForms, kanban]
  );

  const handleUpdateCard = useCallback(
    async (cardId: string) => {
      if (editingCard && editingCard.title.trim()) {
        try {
          await kanban.updateCard(cardId, {
            title: editingCard.title.trim(),
            description: editingCard.description?.trim() || "",
          });
          setEditingCard(null);
        } catch (error) {
          console.error("Failed to update card:", error);
        }
      }
    },
    [editingCard, kanban]
  );

  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      try {
        await kanban.deleteCard(cardId);
      } catch (error) {
        console.error("Failed to delete card:", error);
      }
    },
    [kanban]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, cardId: string) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleUpdateCard(cardId);
      } else if (e.key === "Escape") {
        setEditingCard(null);
      }
    },
    [handleUpdateCard]
  );

  const handleNewCardKeyDown = useCallback(
    (e: KeyboardEvent, columnId: string) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleCreateCard(columnId);
      }
    },
    [handleCreateCard]
  );

  // Loading and error states
  if (kanban.isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Kanban Board...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (kanban.error) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Kanban Board</CardTitle>
            <CardDescription>{kanban.error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Kanban Board Example</CardTitle>
          <CardDescription>
            Simplified kanban board with static columns - following useTable
            pattern. Total cards: {kanban.totalCards}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search - flat access like useTable */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search cards..."
              value={kanban.searchQuery}
              onChange={(e) => kanban.setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {kanban.searchQuery && (
              <Button variant="outline" onClick={kanban.clearSearch}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board - direct rendering like useTable examples */}
      <KanbanBoardProvider>
        <KanbanBoardContent
          columns={kanban.columns}
          newCardForms={newCardForms}
          setNewCardForms={setNewCardForms}
          editingCard={editingCard}
          setEditingCard={setEditingCard}
          handleCreateCard={handleCreateCard}
          handleUpdateCard={handleUpdateCard}
          handleDeleteCard={handleDeleteCard}
          handleKeyDown={handleKeyDown}
          handleNewCardKeyDown={handleNewCardKeyDown}
          moveCard={kanban.moveCard}
        />
      </KanbanBoardProvider>

      {/* Stats Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {kanban.columns.map((column) => (
              <div key={column._id}>
                <div className="text-2xl font-bold">{column.cards.length}</div>
                <div className="text-sm text-gray-500">{column.title}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
