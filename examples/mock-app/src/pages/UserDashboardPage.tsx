import { useState } from "react";
import { useTable } from "../../../../sdk/components/hooks/useTable";
import { useForm } from "../../../../sdk/components/hooks/useForm";
import { ProductForRole, OrderForRole, Roles } from "../../../../app";
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

type Product = ProductForRole<typeof Roles.User>;
type Order = OrderForRole<typeof Roles.User>;

export function UserDashboardPage() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Fetch recent products
  const featuredProducts = useTable<Product>({
    source: "product",
    columns: [
      { fieldId: "_id", label: "ID", enableSorting: false },
      { fieldId: "name", label: "Product", enableSorting: false },
      { fieldId: "price", label: "Price", enableSorting: false },
      { fieldId: "category", label: "Category", enableSorting: false },
      { fieldId: "description", label: "Description", enableSorting: false },
      { fieldId: "inStock", label: "Available", enableSorting: false },
    ],
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 4 },
    },
  });

  // Fetch user's recent orders
  const recentOrders = useTable<Order>({
    source: "order",
    columns: [
      { fieldId: "_id", label: "Order ID", enableSorting: false },
      { fieldId: "customerName", label: "Customer", enableSorting: false },
      { fieldId: "customerEmail", label: "Email", enableSorting: false },
      { fieldId: "total", label: "Total", enableSorting: false },
      { fieldId: "itemCount", label: "Items", enableSorting: false },
      { fieldId: "status", label: "Status", enableSorting: false },
      { fieldId: "_created_at", label: "Date", enableSorting: false },
    ],
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 3 },
      sorting: { field: "_created_at" as keyof Order, direction: "desc" },
    },
  });

  // Forms for viewing details
  const productDetailsForm = useForm<Product>({
    source: "product",
    operation: "update",
    recordId: selectedProduct?._id,
    enabled: showProductDetails && !!selectedProduct,
  });

  const orderDetailsForm = useForm<Order>({
    source: "order",
    operation: "update",
    recordId: selectedOrder?._id,
    enabled: showOrderDetails && !!selectedOrder,
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseProductDetails = () => {
    setShowProductDetails(false);
    setSelectedProduct(null);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
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

  const formatCurrency = (
    price: { value: number; currency: string } | string | number
  ) => {
    if (typeof price === "object" && price !== null && "value" in price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency,
      }).format(price.value);
    }

    if (typeof price === "string") {
      return price;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      electronics: "bg-blue-100 text-blue-800",
      clothing: "bg-purple-100 text-purple-800",
      books: "bg-green-100 text-green-800",
      home: "bg-orange-100 text-orange-800",
      sports: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome Back! 👋</h1>
        <p className="text-lg text-blue-100">
          Discover great products and track your orders
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/products")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🛍️</span>
              Browse Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Explore our wide range of products across multiple categories
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/orders")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              My Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              View and track all your orders in one place
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Featured Products</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Check out these popular items
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/products")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {featuredProducts.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">Loading products...</div>
            </div>
          ) : featuredProducts.error ? (
            <div className="text-red-600 text-center py-8">
              Error loading products: {featuredProducts.error.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.rows.map((product) => (
                <Card
                  key={product._id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(product.price)}
                      </span>
                      <Badge className={getCategoryColor(product.category)}>
                        {product.category}
                      </Badge>
                    </div>
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Your latest orders</p>
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
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell className="font-medium">
                        {order._id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
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
                      colSpan={4}
                      className="text-center text-gray-500"
                    >
                      No orders yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription>{selectedProduct.name}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseProductDetails}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {productDetailsForm.isLoading ? (
                <div className="text-center py-8">Loading details...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Object.values(productDetailsForm.getFields()).map(
                    (field) => {
                      const fieldValue = productDetailsForm.watch(
                        field.name as keyof Product
                      );
                      return (
                        <div
                          key={field.name}
                          className={
                            field.name === "description" ? "col-span-2" : ""
                          }
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                            {field.name === "price" ? (
                              formatCurrency(fieldValue as any)
                            ) : field.name === "inStock" ? (
                              fieldValue ? (
                                "In Stock"
                              ) : (
                                "Out of Stock"
                              )
                            ) : field.name === "_created_at" ||
                              field.name === "_updated_at" ? (
                              new Date(fieldValue as string).toLocaleString()
                            ) : field.name === "category" ? (
                              <Badge variant="outline">
                                {String(fieldValue)}
                              </Badge>
                            ) : (
                              String(fieldValue || "-")
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCloseProductDetails}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
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
                  onClick={handleCloseOrderDetails}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderDetailsForm.isLoading ? (
                <div className="text-center py-8">Loading details...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Object.values(orderDetailsForm.getFields()).map((field) => {
                    const fieldValue = orderDetailsForm.watch(
                      field.name as keyof Order
                    );
                    return (
                      <div
                        key={field.name}
                        className={
                          field.name === "shippingAddress" ||
                          field.name === "items"
                            ? "col-span-2"
                            : ""
                        }
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                          {field.name === "total" ? (
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
                  onClick={handleCloseOrderDetails}
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
