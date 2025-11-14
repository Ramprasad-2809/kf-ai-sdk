import { useState } from "react";
import { useTable } from "../../../../sdk/components/hooks/useTable";
import { useForm } from "../../../../sdk/components/hooks/useForm";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Order = OrderForRole<typeof Roles.Admin>;

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch recent orders for the dashboard
  const recentOrders = useTable<Order>({
    source: "order",
    columns: [
      { fieldId: "_id", label: "ID", enableSorting: false },
      { fieldId: "customerName", label: "Customer", enableSorting: false },
      { fieldId: "customerEmail", label: "Email", enableSorting: false },
      { fieldId: "total", label: "Total", enableSorting: false },
      { fieldId: "profit", label: "Profit (Admin)", enableSorting: false },
      {
        fieldId: "shippingCost",
        label: "Shipping (Admin)",
        enableSorting: false,
      },
      { fieldId: "status", label: "Status", enableSorting: false },
      { fieldId: "itemCount", label: "Items", enableSorting: false },
      { fieldId: "_created_at", label: "Date", enableSorting: false },
    ],
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 5 },
      sorting: { field: "_created_at" as keyof Order, direction: "desc" },
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

  const formatCurrencyValue = (
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

  // Mock KPIs - in real app, would fetch from API
  const kpis = {
    totalRevenue: 45678.9,
    totalOrders: 234,
    totalProducts: 56,
    lowStockItems: 8,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your store's performance and recent activity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <span className="text-2xl">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders}</div>
            <p className="text-xs text-gray-600 mt-1">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalProducts}</div>
            <p className="text-xs text-gray-600 mt-1">
              {kpis.lowStockItems} low stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Alert
            </CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kpis.lowStockItems}
            </div>
            <p className="text-xs text-gray-600 mt-1">Items need restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/products")}>
              📦 Manage Products
            </Button>
            <Button variant="outline" onClick={() => navigate("/orders")}>
              🛒 View All Orders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Latest 5 orders from all customers
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/orders")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">Loading orders...</div>
            </div>
          ) : recentOrders.error ? (
            <div className="text-red-600 text-center py-8">
              Error loading orders: {recentOrders.error.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.rows.length > 0 ? (
                  recentOrders.rows.map((order) => (
                    <TableRow
                      key={order._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(order)}
                    >
                      <TableCell className="font-medium">
                        {order._id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{formatCurrencyValue(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(order._created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500"
                    >
                      No recent orders
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                            formatCurrencyValue(fieldValue as any)
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
                                    {formatCurrencyValue(item.price)}
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
