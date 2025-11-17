import { useState } from "react";
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

type Order = OrderForRole<typeof Roles.User>;

export function UserOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const table = useTable<Order>({
    source: "order",
    columns: [
      { fieldId: "_id", label: "Order ID", enableSorting: true },
      { fieldId: "customerName", label: "Customer", enableSorting: true },
      { fieldId: "customerEmail", label: "Email", enableSorting: true },
      { fieldId: "status", label: "Status", enableSorting: true },
      { fieldId: "total", label: "Total", enableSorting: true },
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
        pageSize: 10,
      },
      sorting: {
        field: "_created_at" as keyof OrderForRole<typeof Roles.User>,
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

  if (table.error) {
    return (
      <div className="error-boundary">
        <h3 className="text-red-800 font-medium">Error loading orders</h3>
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

  const totalSpent = table.rows.reduce(
    (sum, order) =>
      sum + (typeof order.total === "object" ? order.total.value : 0),
    0
  );
  const recentOrders = table.rows.filter((order) => {
    const orderDate = new Date(order._created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return orderDate >= thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Order History</h1>
          <p className="text-gray-600">
            {table.totalItems} total orders • Customer view
          </p>
          <div className="role-badge role-badge-user">Your Orders Only</div>
        </div>

        <button
          onClick={() => table.refetch()}
          disabled={table.isFetching}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {table.isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-600">
              {table.totalItems}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">
              ${totalSpent.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">{recentOrders}</p>
            <p className="text-xs text-gray-500">Last 30 days</p>
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
          placeholder="Search your orders..."
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
                Order #
                {table.sort.field === "_id" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
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
              <TableHead>Actions</TableHead>
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
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
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
                  <TableCell className="font-medium text-blue-600">
                    #{order._id.replace("order_", "")}
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
                  <TableCell className="text-gray-500">
                    {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(order._created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(order);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  <div className="py-8">
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">
                      You haven't placed any orders yet.
                    </p>
                  </div>
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

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-blue-800 text-sm">
          <strong>Personal View:</strong> This page shows only your orders.
          Administrative data like profit margins and internal notes are not
          visible.
        </p>
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
                    Order #{selectedOrder._id.replace("order_", "")}
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
                    <div>
                      <label
                        htmlFor="customerName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Customer Name
                      </label>
                      <input
                        id="customerName"
                        type="text"
                        {...detailsForm.register("customerName")}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                      {detailsForm.errors.customerName && (
                        <p className="mt-1 text-sm text-red-600">
                          {String(detailsForm.errors.customerName?.message)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="customerEmail"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Customer Email
                      </label>
                      <input
                        id="customerEmail"
                        type="email"
                        {...detailsForm.register("customerEmail")}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                      {detailsForm.errors.customerEmail && (
                        <p className="mt-1 text-sm text-red-600">
                          {String(detailsForm.errors.customerEmail?.message)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Status
                      </label>
                      <input
                        id="status"
                        type="text"
                        {...detailsForm.register("status")}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="total"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Total
                      </label>
                      <input
                        id="total"
                        type="number"
                        step="0.01"
                        {...detailsForm.register("total.value")}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                    </div>

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
                        {...detailsForm.register("itemCount")}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                      {detailsForm.errors.itemCount && (
                        <p className="mt-1 text-sm text-red-600">
                          {String(detailsForm.errors.itemCount?.message)}
                        </p>
                      )}
                    </div>

                    {/* Customer Full Info - Computed Field */}
                    <div className="col-span-2">
                      <label
                        htmlFor="customerFullInfo"
                        className="block text-sm font-medium text-purple-700 mb-2"
                      >
                        Customer Full Info (Computed)
                      </label>
                      <input
                        id="customerFullInfo"
                        type="text"
                        {...detailsForm.register("customerFullInfo")}
                        readOnly
                        className="w-full px-3 py-2 bg-purple-50 border border-purple-300 rounded-md text-purple-900 cursor-not-allowed"
                        title="This field is automatically calculated from customerName and customerEmail"
                      />
                      <p className="mt-1 text-xs text-purple-600">
                        ✨ Auto-calculated: CONCAT(customerName, ' &lt;',
                        customerEmail, '&gt;')
                      </p>
                    </div>

                    {/* Total With Shipping - Computed Field */}
                    <div>
                      <label
                        htmlFor="totalWithShipping"
                        className="block text-sm font-medium text-purple-700 mb-2"
                      >
                        Total With Shipping (Computed)
                      </label>
                      <input
                        id="totalWithShipping"
                        type="number"
                        step="0.01"
                        {...detailsForm.register("totalWithShipping")}
                        readOnly
                        className="w-full px-3 py-2 bg-purple-50 border border-purple-300 rounded-md text-purple-900 cursor-not-allowed font-medium"
                        title="This field is automatically calculated from total + shippingCost"
                      />
                      <p className="mt-1 text-xs text-purple-600">
                        ✨ Auto-calculated: total + shippingCost
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="createdAt"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Created
                      </label>
                      <input
                        id="createdAt"
                        type="datetime-local"
                        {...detailsForm.register("_created_at")}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="modifiedAt"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last Modified
                      </label>
                      <input
                        id="modifiedAt"
                        type="datetime-local"
                        {...detailsForm.register("_modified_at")}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Form Actions - Limited for users */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseDetails}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={detailsForm.isSubmitting}
                      className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {detailsForm.isSubmitting
                        ? "Updating..."
                        : "Update Shipping Address"}
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
