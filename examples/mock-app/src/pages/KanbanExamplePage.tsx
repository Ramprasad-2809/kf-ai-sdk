import { useState } from "react";
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
  KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnTitle,
  KanbanColumnContent,
  KanbanCard,
  KanbanCardTitle,
  KanbanCardDescription,
  KanbanColumnFooter,
} from "../components/ui/kanban";
import { Badge } from "../components/ui/badge";
import { PlusIcon, Trash2Icon, Edit2Icon } from "lucide-react";

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

// Static column definitions
const BOARD_COLUMNS = [
  { id: "col_todo", title: "To Do", position: 0, color: "blue" },
  { id: "col_progress", title: "In Progress", position: 1, color: "yellow" },
  { id: "col_review", title: "Review", position: 2, color: "purple" },
  { id: "col_done", title: "Done", position: 3, color: "green" },
];

export function KanbanExamplePage() {
  const [editingCard, setEditingCard] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  const [newCardForm, setNewCardForm] = useState<{
    columnId: string;
    title: string;
    description: string;
  } | null>(null);

  // Use the kanban hook - simple like useTable
  const kanban = useKanban<TaskCard>({
    source: "task",
    columns: BOARD_COLUMNS,
    enableDragDrop: true,
  });

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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
          <CardTitle>Kanban Board - Simplified</CardTitle>
          <CardDescription>
            Simple kanban board following the Table pattern. Total cards:{" "}
            {kanban.totalCards}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search cards..."
              value={kanban.searchQuery}
              onChange={(e) => kanban.setSearchQuery(e.target.value)}
              className="max-w-sm"
              aria-label="Search tasks across all columns"
              role="searchbox"
            />
            {kanban.searchQuery && (
              <Button variant="outline" onClick={kanban.clearSearch}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Screen Reader Instructions */}
      <div className="sr-only" id="kanban-instructions">
        Use arrow keys to move cards between columns. Press Enter to edit a card. Press Escape to cancel. Drag and drop is also supported.
      </div>

      {/* NEW: Use Compound Component Pattern with wrapper */}
      <h1 className="text-xl font-bold mb-4">Kanban Board Example</h1>

      <KanbanBoard instance={kanban}>
        {kanban.columns.map((column) => (
          <KanbanColumn key={column._id} columnId={column._id}>
            {/* Column Header */}
            <KanbanColumnHeader>
              <KanbanColumnTitle>
                {column.title} ({column.cards.length})
              </KanbanColumnTitle>
            </KanbanColumnHeader>

            {/* Cards - Just like TableRow/TableCell */}
            <KanbanColumnContent className="min-h-[200px]">
              {column.cards.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm" role="status" aria-label={`Empty column: ${column.title}`}>
                  Drop cards here or use Add Card button
                </div>
              )}
              {column.cards.map((card) => (
                <KanbanCard
                  key={card._id}
                  card={card}
                  // Override specific props if needed
                  draggable={!editingCard}
                  tabIndex={editingCard?.id === card._id ? -1 : 0}
                  style={{
                    cursor: editingCard ? "default" : "grab"
                  }}
                  aria-label={`Task: ${card.title}${card.description ? `. ${card.description}` : ''}${card.priority ? `. Priority: ${card.priority}` : ''}`}
                  aria-describedby={`card-instructions-${card._id}`}
                >
                  {editingCard?.id === card._id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <Input
                        value={editingCard.title}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            title: e.target.value,
                          })
                        }
                        placeholder="Card title"
                        autoFocus
                        aria-label="Edit card title"
                      />
                      <Input
                        value={editingCard.description}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            description: e.target.value,
                          })
                        }
                        placeholder="Card description"
                        aria-label="Edit card description"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            await kanban.updateCard(card._id, {
                              title: editingCard.title,
                              description: editingCard.description,
                            });
                            setEditingCard(null);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCard(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <KanbanCardTitle>{card.title}</KanbanCardTitle>
                      {card.description && (
                        <KanbanCardDescription>
                          {card.description}
                        </KanbanCardDescription>
                      )}
                      {card.priority && (
                        <div className="mt-2">
                          <Badge
                            className={getPriorityColor(card.priority)}
                            variant="secondary"
                          >
                            {card.priority}
                          </Badge>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditingCard({
                              id: card._id,
                              title: card.title,
                              description: card.description || "",
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingCard({
                                id: card._id,
                                title: card.title,
                                description: card.description || "",
                              });
                            }
                          }}
                          aria-label={`Edit task: ${card.title}`}
                          tabIndex={0}
                        >
                          <Edit2Icon className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => kanban.deleteCard(card._id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              kanban.deleteCard(card._id);
                            }
                          }}
                          aria-label={`Delete task: ${card.title}`}
                          tabIndex={0}
                        >
                          <Trash2Icon className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                  {/* Hidden instructions for screen readers */}
                  <div id={`card-instructions-${card._id}`} className="sr-only">
                    Use arrow keys to move between columns, Enter to edit, or drag to move this task.
                  </div>
                </KanbanCard>
              ))}
            </KanbanColumnContent>

            {/* Add Card Footer */}
            <KanbanColumnFooter>
              {newCardForm?.columnId === column._id ? (
                <div className="space-y-2">
                  <Input
                    value={newCardForm.title}
                    onChange={(e) =>
                      setNewCardForm({ ...newCardForm, title: e.target.value })
                    }
                    placeholder="Card title"
                    autoFocus
                    aria-label={`New card title in ${column.title}`}
                  />
                  <Input
                    value={newCardForm.description}
                    onChange={(e) =>
                      setNewCardForm({
                        ...newCardForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description (optional)"
                    aria-label={`New card description in ${column.title}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await kanban.createCard({
                          columnId: column._id,
                          title: newCardForm.title,
                          description: newCardForm.description,
                        });
                        setNewCardForm(null);
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewCardForm(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setNewCardForm({
                      columnId: column._id,
                      title: "",
                      description: "",
                    })
                  }
                  aria-label={`Add new card to ${column.title} column`}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              )}
            </KanbanColumnFooter>
          </KanbanColumn>
        ))}
      </KanbanBoard>

      {/* Stats */}
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
