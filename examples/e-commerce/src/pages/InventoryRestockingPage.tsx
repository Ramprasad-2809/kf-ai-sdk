import { useState } from "react";
import { useKanban } from "kf-ai-sdk";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, Search, AlertTriangle } from "lucide-react";
import { InventoryManagerRestocking } from "../../../../app/sources/ecommerce/restocking";
import { AmazonProductMaster } from "../../../../app/sources/ecommerce/product";
import { Roles } from "../../../../app/types/roles";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
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

// ============================================================
// COLUMN CONFIGURATION
// ============================================================

const RESTOCKING_COLUMNS = [
  {
    id: "LowStockAlert",
    title: "Low Stock Alert",
    position: 0,
    color: "red",
  },
  {
    id: "OrderPlaced",
    title: "Order Placed",
    position: 1,
    color: "yellow",
  },
  {
    id: "InTransit",
    title: "In Transit",
    position: 2,
    color: "blue",
  },
  {
    id: "Received",
    title: "Received & Restocked",
    position: 3,
    color: "green",
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "Critical":
      return "destructive";
    case "High":
      return "warning";
    case "Medium":
      return "secondary";
    default:
      return "default";
  }
};

const getColumnColor = (columnId: string) => {
  const column = RESTOCKING_COLUMNS.find((c) => c.id === columnId);
  return column?.color || "gray";
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function InventoryRestockingPage() {
  const [showScanModal, setShowScanModal] = useState(false);
  const [showStockUpdateModal, setShowStockUpdateModal] = useState(false);
  const [selectedCard, setSelectedCard] =
    useState<InventoryManagerRestocking | null>(null);
  const [quantityReceived, setQuantityReceived] = useState(0);

  // Initialize Kanban hook
  const kanban = useKanban<InventoryManagerRestocking>({
    source: "BDO_ProductRestocking",
    columns: RESTOCKING_COLUMNS,
    enableDragDrop: true,
    enableFiltering: true,
    enableSearch: true,
    onCardMove: (card, _fromColumnId, toColumnId) => {
      // When moving to "Received" column, show stock update modal
      if (toColumnId === "Received") {
        setSelectedCard(card);
        setQuantityReceived(card.quantityOrdered);
        setShowStockUpdateModal(true);
      }
    },
    onError: (error) => {
      toast.error(`Failed to move card: ${error.message}`);
    },
  });

  // Mutation for updating product stock
  const updateStockMutation = useMutation({
    mutationFn: async (data: { _id: string; newStock: number }) => {
      const productApi = new AmazonProductMaster(Roles.InventoryManager);
      return await productApi.update(data._id, {
        Stock: data.newStock,
      });
    },
    onSuccess: () => {
      toast.success("Product stock updated successfully!");
      setShowStockUpdateModal(false);
      setSelectedCard(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update stock: ${error.message}`);
    },
  });

  // Handle stock update confirmation
  const handleStockUpdate = async () => {
    if (!selectedCard || !selectedCard._id) {
      toast.error("Invalid product ID");
      return;
    }

    const newStock = selectedCard.currentStock + quantityReceived;

    await updateStockMutation.mutateAsync({
      _id: selectedCard._id,
      newStock,
    });
  };

  // Format date helper
  const formatDate = (date: Date | string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Restocking
          </h1>
          <p className="text-gray-500">Manage product restocking workflow</p>
        </div>
        <Button onClick={() => setShowScanModal(true)}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Scan for Low Stock
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by product title or SKU..."
            className="pl-10"
            value={kanban.searchQuery || ""}
            onChange={(e) => kanban.setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban Board */}
      {kanban.error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-800 mb-2">
            Error loading restocking tasks
          </h3>
          <p className="text-red-600 mb-6">{kanban.error.message}</p>
          <Button onClick={() => kanban.refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      ) : kanban.isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard instance={kanban} className="h-full">
            {kanban.columns.map((column) => (
              <KanbanColumn key={column._id} columnId={column._id}>
                <KanbanColumnHeader>
                  <KanbanColumnTitle>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full bg-${getColumnColor(column._id)}-500`}
                      ></span>
                      {column.title}
                    </div>
                  </KanbanColumnTitle>
                  <Badge variant="secondary">{column.cards.length}</Badge>
                </KanbanColumnHeader>

                <KanbanColumnContent>
                  {column.cards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No items
                    </div>
                  ) : (
                    column.cards.map((card) => (
                      <KanbanCard key={card._id} card={card}>
                        <div className="space-y-2">
                          <KanbanCardTitle>{card.productTitle}</KanbanCardTitle>

                          <KanbanCardDescription>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">SKU:</span>
                                <span className="font-mono">
                                  {card.productSKU}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                  Current Stock:
                                </span>
                                <span className="font-semibold text-red-600">
                                  {card.currentStock}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Ordered:</span>
                                <span className="font-semibold text-green-600">
                                  {card.quantityOrdered}
                                </span>
                              </div>
                            </div>
                          </KanbanCardDescription>

                          <div className="flex flex-wrap gap-1 pt-2">
                            <Badge
                              variant={getPriorityVariant(card.priority)}
                              className="text-xs"
                            >
                              {card.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {card.warehouse.replace("_", " ")}
                            </Badge>
                          </div>

                          {card.expectedDeliveryDate && (
                            <div className="text-xs text-gray-500 pt-1">
                              Expected: {formatDate(card.expectedDeliveryDate)}
                            </div>
                          )}
                        </div>
                      </KanbanCard>
                    ))
                  )}
                </KanbanColumnContent>

                {column.cards.length > 0 && column.cards.length >= 10 && (
                  <KanbanColumnFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => kanban.loadMore(column._id)}
                    >
                      Load More
                    </Button>
                  </KanbanColumnFooter>
                )}
              </KanbanColumn>
            ))}
          </KanbanBoard>
        </div>
      )}

      {/* Stock Update Modal */}
      <Dialog
        open={showStockUpdateModal}
        onOpenChange={setShowStockUpdateModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - Received</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Product:{" "}
                <span className="font-semibold">
                  {selectedCard?.productTitle}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Current Stock:{" "}
                <span className="font-semibold">
                  {selectedCard?.currentStock}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Received
              </label>
              <Input
                type="number"
                min="0"
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(Number(e.target.value))}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                New Stock Level:{" "}
                <span className="font-bold">
                  {(selectedCard?.currentStock || 0) + quantityReceived}
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStockUpdateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStockUpdate}
              disabled={updateStockMutation.isPending}
            >
              {updateStockMutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan for Low Stock Modal */}
      <Dialog open={showScanModal} onOpenChange={setShowScanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan for Low Stock Products</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              This feature will be implemented to scan for products where Stock
              ≤ Reorder Level and create restocking cards automatically.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Feature coming soon! This will query AmazonProductMaster for
                low-stock products.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScanModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
