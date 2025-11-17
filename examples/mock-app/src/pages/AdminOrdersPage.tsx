import { useMemo, useState } from "react";
import { useTable, useForm } from "kf-ai-sdk";
import { OrderForRole, Roles } from "../../../../app";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Order = OrderForRole<typeof Roles.Admin>;

export function AdminOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const table = useTable<Order>({
    source: "order",
    columns: [
      { fieldId: "_id", label: "ID", enableSorting: true },
      { fieldId: "customerName", label: "Customer", enableSorting: true },
      { fieldId: "customerEmail", label: "Email", enableSorting: true },
      { fieldId: "status", label: "Status", enableSorting: true },
      { fieldId: "total", label: "Total", enableSorting: true },
      { fieldId: "profit", label: "Profit (Admin)", enableSorting: true },
      {
        fieldId: "shippingCost",
        label: "Shipping (Admin)",
        enableSorting: true,
      },
      { fieldId: "itemCount", label: "Items", enableSorting: true },
      { fieldId: "_created_at", label: "Created", enableSorting: true },
      { fieldId: "_modified_at", label: "Modified", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: {
        pageNo: 1,
        pageSize: 15,
      },
      sorting: {
        field: "_created_at" as keyof OrderForRole<typeof Roles.Admin>,
        direction: "desc",
      },
    },
    onSuccess: (data) => {
      console.log(`Loaded ${data.length} orders`);
    },
    onError: (error) => {
      console.error("Failed to load orders:", error);
    },
  });

  // Form for viewing order details
  const detailsForm = useForm<Order>({
    source: "order",
    operation: "update",
    recordId: selectedOrder?._id,
    enabled: showDetails && !!selectedOrder,
  });

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
  };

  const formatCurrency = (
    value: { value: number; currency: string } | number | string
  ) => {
    if (typeof value === "object" && value !== null && "value" in value) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: value.currency,
      }).format(value.value);
    }
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    return value;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      pending: "secondary",
      processing: "outline",
      shipped: "default",
      delivered: "default",
      cancelled: "secondary",
    };
    return variants[status] || "outline";
  };

  // Calculate dashboard stats
  const stats = useMemo(() => {
    const orders = table.rows;
    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum + (typeof order.total === "object" ? order.total.value : 0),
      0
    );
    const totalProfit = orders.reduce(
      (sum, order) =>
        sum +
        (order.profit && typeof order.profit === "object"
          ? order.profit.value
          : 0),
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const completedOrders = orders.filter(
      (order) => order.status === "delivered"
    ).length;

    return { totalRevenue, totalProfit, pendingOrders, completedOrders };
  }, [table.rows]);

  if (table.error) {
    return (
      <div className="error-boundary">
        <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
        <p className="text-red-600 text-sm">{table.error.message}</p>
        <button
          onClick={() => table.refetch()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Dashboard</h1>
          <p className="text-gray-600">
            Complete order management and analytics
          </p>
          <div className="role-badge role-badge-admin">Admin Dashboard</div>
        </div>

        <button
          onClick={() => table.refetch()}
          disabled={table.isFetching}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {table.isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              ${stats.totalProfit.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {stats.pendingOrders}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {stats.completedOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Search is handled by onChange, but form prevents page reload on Enter
        }}
        className="flex items-center space-x-4"
      >
        <input
          type="text"
          placeholder="Search orders..."
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {table.search.query && (
          <button
            type="button"
            onClick={table.search.clear}
            className="px-2 py-1 text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </form>

      {/* Orders Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("_id")}
              >
                Order ID
                {table.sort.field === "_id" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Items</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("_created_at")}
              >
                Date
                {table.sort.field === "_created_at" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.isLoading ? (
              // Loading state - show skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`loading-${idx}`} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : table.rows.length > 0 ? (
              table.rows.map((order) => (
                <TableRow
                  key={order._id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(order)}
                >
                  <TableCell className="font-medium text-gray-900">
                    {order._id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {order.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(order.status)}>
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {order.profit ? formatCurrency(order.profit) : "-"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(order._created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {table.rows.length} of {table.totalItems} orders
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Pagination actions are handled by onClick
          }}
          className="flex items-center space-x-2"
        >
          <button
            type="button"
            onClick={() => table.pagination.goToPrevious()}
            disabled={!table.pagination.canGoPrevious}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {table.pagination.currentPage} of {table.pagination.totalPages}
          </span>

          <button
            type="button"
            onClick={() => table.pagination.goToNext()}
            disabled={!table.pagination.canGoNext}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </form>
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>
                    Order ID: {selectedOrder._id}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseDetails}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailsForm.isLoading ? (
                <div className="text-center py-8">Loading details...</div>
              ) : (
                <form
                  onSubmit={detailsForm.handleSubmit()}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div>
                      <label
                        htmlFor="customerName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Customer Name *
                      </label>
                      <input
                        id="customerName"
                        type="text"
                        {...detailsForm.register("customerName", {
                          required: "Customer name is required",
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {detailsForm.errors.customerName && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.customerName.message}
                        </p>
                      )}
                    </div>

                    {/* Customer Email */}
                    <div>
                      <label
                        htmlFor="customerEmail"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Customer Email *
                      </label>
                      <input
                        id="customerEmail"
                        type="email"
                        {...detailsForm.register("customerEmail", {
                          required: "Email is required",
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Invalid email",
                          },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {detailsForm.errors.customerEmail && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.customerEmail.message}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Status *
                      </label>
                      <select
                        id="status"
                        {...detailsForm.register("status", {
                          required: "Status is required",
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {detailsForm.errors.status && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.status.message}
                        </p>
                      )}
                    </div>

                    {/* Item Count */}
                    <div>
                      <label
                        htmlFor="itemCount"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Item Count
                      </label>
                      <input
                        id="itemCount"
                        type="number"
                        min="1"
                        {...detailsForm.register("itemCount")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {detailsForm.errors.itemCount && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.itemCount.message}
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div>
                      <label
                        htmlFor="total"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Total Amount *
                      </label>
                      <input
                        id="total"
                        type="number"
                        step="0.01"
                        min="0"
                        {...detailsForm.register("total", {
                          required: "Total is required",
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {detailsForm.errors.total && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.total.message}
                        </p>
                      )}
                    </div>

                    {/* Profit (Admin only) */}
                    <div>
                      <label
                        htmlFor="profit"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Profit (Admin)
                      </label>
                      <input
                        id="profit"
                        type="number"
                        step="0.01"
                        {...detailsForm.register("profit")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {detailsForm.errors.profit && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.profit.message}
                        </p>
                      )}
                    </div>

                    {/* Shipping Cost (Admin only) */}
                    <div>
                      <label
                        htmlFor="shippingCost"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Shipping Cost (Admin)
                      </label>
                      <input
                        id="shippingCost"
                        type="number"
                        step="0.01"
                        {...detailsForm.register("shippingCost")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {detailsForm.errors.shippingCost && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.shippingCost.message}
                        </p>
                      )}
                    </div>

                    {/* Internal Notes - Wide field (Admin only) */}
                    <div className="col-span-2">
                      <label
                        htmlFor="internalNotes"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Internal Notes (Admin Only)
                      </label>
                      <textarea
                        id="internalNotes"
                        rows={3}
                        {...detailsForm.register("internalNotes")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter internal notes"
                      />
                      {detailsForm.errors.internalNotes && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.internalNotes.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseDetails}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={detailsForm.isSubmitting}
                      className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {detailsForm.isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>

                  {/* Show form errors */}
                  {detailsForm.submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {detailsForm.submitError.message}
                      </p>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
