// ============================================================
// ADMIN PRODUCTS PAGE - Full CRUD Product Management
// ============================================================
// Merged from: ProductManagementPage + AdminProductListPage
// Admin role with access to all fields including cost, supplier, margin

import { useState, useCallback } from "react";
import { useTable } from "../../../../sdk/components/hooks/useTable";
import { useForm } from "../../../../sdk/components/hooks/useForm";
import { ProductForRole, Roles } from "../../../../app";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

// Use Admin role for full access to all product fields
type Product = ProductForRole<typeof Roles.Admin>;

export function AdminProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "update">("create");

  // Table for listing products - Admin role for full access
  const table = useTable<Product>({
    source: "product",
    columns: [
      { fieldId: "_id", label: "ID", enableSorting: true },
      { fieldId: "name", label: "Name", enableSorting: true },
      { fieldId: "price", label: "Price", enableSorting: true },
      { fieldId: "cost", label: "Cost (Admin)", enableSorting: true },
      { fieldId: "margin", label: "Margin % (Admin)", enableSorting: true },
      { fieldId: "supplier", label: "Supplier (Admin)", enableSorting: true },
      { fieldId: "category", label: "Category", enableSorting: true },
      { fieldId: "inStock", label: "In Stock", enableSorting: true },
      {
        fieldId: "lastRestocked",
        label: "Last Restocked (Admin)",
        enableSorting: true,
      },
      { fieldId: "_created_at", label: "Created", enableSorting: true },
      { fieldId: "_modified_at", label: "Modified", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: "name" as keyof Product, direction: "asc" },
    },
    onSuccess: (data) => {
      console.log("Products loaded:", data.length);
    },
    onError: (error) => {
      console.error("Failed to load products:", error);
    },
  });

  // Stable callbacks to prevent infinite loops
  const handleFormSuccess = useCallback(
    (data: any) => {
      console.log(`Product ${formMode}d successfully:`, data);
      setShowForm(false);
      setSelectedProduct(null);
      table.refetch(); // Refresh the table
    },
    [formMode, table.refetch]
  );

  const handleFormError = useCallback(
    (error: Error) => {
      console.error(`Failed to ${formMode} product:`, error);
    },
    [formMode]
  );

  // Form for creating/editing products
  const form = useForm<Product>({
    source: "product",
    operation: formMode,
    recordId: selectedProduct?._id,
    enabled: showForm, // Only fetch schema and initialize when form is shown
    defaultValues: {
      name: "",
      description: "",
      price: {
        value: 0,
        currency: "USD",
      },
      category: undefined, // Let the form handle the default
      inStock: true,
    },
    onSuccess: handleFormSuccess,
    onError: handleFormError,
  });

  // Handlers
  const handleCreateNew = () => {
    setFormMode("create");
    setSelectedProduct(null);
    setShowForm(true);
    form.reset();
  };

  const handleEditProduct = (product: Product) => {
    setFormMode("update");
    setSelectedProduct(product);
    setShowForm(true);
    // Form will automatically load the record data
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProduct(null);
    form.reset();
  };

  const formatPrice = (
    price: { value: number; currency: string } | string | number
  ) => {
    // Handle object format
    if (typeof price === "object" && price !== null && "value" in price) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency,
      }).format(price.value);
    }

    // Handle string format (e.g., "100.50 USD" or "USD 100.50")
    if (typeof price === "string") {
      return price; // Return as-is, assuming it's already formatted
    }

    // Handle plain number format
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      electronics: "bg-blue-100 text-blue-800",
      clothing: "bg-purple-100 text-purple-800",
      books: "bg-green-100 text-green-800",
      home: "bg-orange-100 text-orange-800",
      sports: "bg-red-100 text-red-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  if (table.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (table.error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">
              Error Loading Products
            </CardTitle>
            <CardDescription className="text-red-600">
              {table.error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
          <p className="text-gray-600">
            Full product catalog management with CRUD operations • Admin Access
          </p>
        </div>
        <Button onClick={handleCreateNew} disabled={showForm}>
          Create New Product
        </Button>
      </div>

      {/* Table Section */}
      {!showForm && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Products ({table.totalItems})</CardTitle>
                <CardDescription>
                  Click on a row to edit a product
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search products..."
                  value={table.search.query}
                  onChange={(e) => table.search.setQuery(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" onClick={() => table.search.clear()}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => table.sort.toggle("name")}
                  >
                    Product Name
                    {table.sort.field === "name" && (
                      <span className="ml-1">
                        {table.sort.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => table.sort.toggle("category")}
                  >
                    Category
                    {table.sort.field === "category" && (
                      <span className="ml-1">
                        {table.sort.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => table.sort.toggle("price")}
                  >
                    Price
                    {table.sort.field === "price" && (
                      <span className="ml-1">
                        {table.sort.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((product) => (
                  <TableRow
                    key={product._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEditProduct(product)}
                  >
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(product.category)}>
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.inStock ? "default" : "secondary"}
                      >
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {table.rows.length} of {table.totalItems} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.pagination.goToPrevious()}
                  disabled={!table.pagination.canGoPrevious}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {table.pagination.currentPage} of{" "}
                  {table.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.pagination.goToNext()}
                  disabled={!table.pagination.canGoNext}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Section */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {formMode === "create"
                ? "Create New Product"
                : `Edit Product: ${selectedProduct?.name}`}
            </CardTitle>
            <CardDescription>
              {formMode === "create"
                ? "Fill in the product details below"
                : "Update the product information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Loading States */}
            {form.isLoadingInitialData && (
              <div className="flex items-center justify-center p-8">
                <div className="text-gray-600">Loading form schema...</div>
              </div>
            )}

            {/* Schema Error */}
            {form.loadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-red-800 font-medium">Error Loading Form</h4>
                <p className="text-red-600 text-sm">{form.loadError.message}</p>
              </div>
            )}

            {/* Form */}
            {!form.isLoadingInitialData && !form.loadError && (
              <form onSubmit={form.handleSubmit()} className="space-y-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Product Name *
                  </label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Enter product name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...form.register("description")}
                    placeholder="Enter product description (min 10 characters)"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                {/* Price and Category Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Price * ($0.01 - $10,000)
                    </label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10000"
                      {...form.register("price.value")}
                      placeholder="0.00"
                    />
                    {form.formState.errors.price && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category *
                    </label>
                    <select
                      id="category"
                      {...form.register("category")}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {form.getField("category")?.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.category && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* In Stock */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...form.register("inStock")}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Product is in stock
                    </span>
                  </label>
                </div>

                {/* Submit Error */}
                {form.submitError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600">
                      {form.submitError.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={form.isSubmitting}>
                    {form.isSubmitting
                      ? "Saving..."
                      : formMode === "create"
                        ? "Create Product"
                        : "Update Product"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form State Debug (Development) */}
      {showForm && process.env.NODE_ENV === "development" && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p>
              <strong>Form Mode:</strong> {formMode}
            </p>
            <p>
              <strong>Required Fields:</strong> {form.requiredFields.join(", ")}
            </p>
            <p>
              <strong>Computed Fields:</strong> {form.computedFields.join(", ")}
            </p>
            <p>
              <strong>Form Valid:</strong>{" "}
              {form.formState.isValid ? "Yes" : "No"}
            </p>
            <p>
              <strong>Form Dirty:</strong>{" "}
              {form.formState.isDirty ? "Yes" : "No"}
            </p>
            {selectedProduct && (
              <p>
                <strong>Editing:</strong> {selectedProduct._id}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
