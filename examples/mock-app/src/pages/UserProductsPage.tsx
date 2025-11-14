import { useState } from "react";
import { useTable, useForm } from "kf-ai-sdk";
import { ProductForRole, Roles } from "../../../../app";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Product = ProductForRole<typeof Roles.User>;

export function UserProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const table = useTable<Product>({
    source: "product",
    columns: [
      { fieldId: "_id", label: "ID", enableSorting: true },
      { fieldId: "name", label: "Name", enableSorting: true },
      { fieldId: "price", label: "Price", enableSorting: true },
      { fieldId: "description", label: "Description", enableSorting: false },
      { fieldId: "category", label: "Category", enableSorting: true },
      { fieldId: "inStock", label: "In Stock", enableSorting: true },
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
        field: "name" as keyof ProductForRole<typeof Roles.User>,
        direction: "asc",
      },
    },
    onSuccess: (data) => {
      console.log(`Loaded ${data.length} products`);
    },
    onError: (error) => {
      console.error("Failed to load products:", error);
    },
  });

  // Form for viewing product details (read-only)
  const detailsForm = useForm<Product>({
    source: "product",
    operation: "update",
    recordId: selectedProduct?._id,
    enabled: showDetails && !!selectedProduct,
  });

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedProduct(null);
  };

  const formatPrice = (
    price: { value: number; currency: string } | string | number
  ) => {
    if (typeof price === "object" && price !== null && "value" in price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency,
      }).format(price.value);
    }
    if (typeof price === "string") return price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Error state
  if (table.error) {
    return (
      <div className="error-boundary">
        <h3 className="text-red-800 font-medium">Error loading products</h3>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-600">
            {table.totalItems} products available • Customer view
          </p>
          <div className="role-badge role-badge-user">
            User View (Limited Fields)
          </div>
        </div>

        <button
          onClick={() => table.refetch()}
          disabled={table.isFetching}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {table.isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search products..."
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

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("name")}
              >
                Name
                {table.sort.field === "name" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("category")}
              >
                Category
                {table.sort.field === "category" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.isLoading ? (
              // Loading state - show skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`loading-${idx}`} className="animate-pulse">
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : table.rows.length > 0 ? (
              table.rows.map((product) => (
                <TableRow
                  key={product._id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(product)}
                >
                  <TableCell className="font-medium text-gray-900">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? "Available" : "Out of Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(product._created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {table.rows.length} of {table.totalItems} results
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

          <select
            value={table.pagination.pageSize}
            onChange={(e) =>
              table.pagination.setPageSize(Number(e.target.value))
            }
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Note about limited access */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-blue-800 text-sm">
          <strong>User View:</strong> You're seeing limited product information.
          Cost, supplier, and margin data are only available to administrators.
        </p>
      </div>

      {/* Product Details Modal */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription>Viewing product information</CardDescription>
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
                          {field.name === "price" &&
                          typeof fieldValue === "object" &&
                          fieldValue !== null &&
                          "value" in fieldValue ? (
                            formatPrice(fieldValue as any)
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
