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

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {table.search.query && (
          <button
            onClick={table.search.clear}
            className="px-2 py-1 text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

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

        <div className="flex items-center space-x-2">
          <button
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
            onClick={() => table.pagination.goToNext()}
            disabled={!table.pagination.canGoNext}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
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
                <div className="grid grid-cols-2 gap-4">
                  {Object.values(detailsForm.getFields()).map((field) => {
                    const fieldValue = detailsForm.watch(
                      field.name as keyof Order
                    );
                    return (
                      <div
                        key={field.name}
                        className={
                          field.name === "shippingAddress" ||
                          field.name === "internalNotes" ||
                          field.name === "items"
                            ? "col-span-2"
                            : ""
                        }
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                          {field.name === "total" ||
                          field.name === "profit" ||
                          field.name === "shippingCost" ? (
                            formatCurrency(fieldValue as any)
                          ) : field.name === "status" ? (
                            <Badge variant={getStatusBadge(String(fieldValue))}>
                              {String(fieldValue)}
                            </Badge>
                          ) : field.name === "_created_at" ||
                            field.name === "_updated_at" ? (
                            new Date(fieldValue as string).toLocaleString()
                          ) : field.name === "items" &&
                            Array.isArray(fieldValue) ? (
                            <div className="space-y-2">
                              {fieldValue.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center p-2 bg-white rounded border"
                                >
                                  <span>
                                    {item.productName || item.name || "Product"}
                                  </span>
                                  <span className="text-gray-600">
                                    Qty: {item.quantity} ×{" "}
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            String(fieldValue || "-")
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCloseDetails}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
