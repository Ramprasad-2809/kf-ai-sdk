import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTable, useForm, api } from "kf-ai-sdk";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface SellerProduct {
  _id: string;
  name: string;
  price: { value: number; currency: string };
  description: string;
  category: string;
  availableQuantity: number;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
}

const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports" },
];

export function SellerProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [formMode, setFormMode] = useState<"create" | "update">("create");
  const [generalError, setGeneralError] = useState<string | null>(null);

  const table = useTable<SellerProduct>({
    source: "product",
    columns: [
      { fieldId: "name", label: "Name", enableSorting: true },
      { fieldId: "price", label: "Price", enableSorting: true },
      { fieldId: "category", label: "Category", enableSorting: true },
      { fieldId: "availableQuantity", label: "Stock", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: "name", direction: "asc" },
    },
  });

  const form = useForm<SellerProduct>({
    source: "product",
    operation: formMode,
    recordId: selectedProduct?._id,
    enabled: showForm,
    defaultValues: {
      name: "",
      description: "",
      category: "electronics",
      availableQuantity: 0,
      imageUrl: "",
    },
    onSuccess: () => {
      setShowForm(false);
      setSelectedProduct(null);
      setGeneralError(null);
      table.refetch();
    },
    onError: (error) => setGeneralError(error.message),
    onSchemaError: (error) => setGeneralError(`Configuration Error: ${error.message}`),
    onSubmitError: (error) => setGeneralError(`Submission Failed: ${error.message}`),
  });

  const formatPrice = (price: { value: number; currency: string }) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency,
    }).format(price.value);
  };

  const handleCreate = () => {
    setFormMode("create");
    setSelectedProduct(null);
    setGeneralError(null);
    setShowForm(true);
  };

  const handleEdit = (product: SellerProduct) => {
    setFormMode("update");
    setSelectedProduct(product);
    setGeneralError(null);
    setShowForm(true);
  };

  const handleDelete = async (product: SellerProduct) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await api("product").delete(product._id);
        table.refetch();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.handleSubmit()();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500">
            Manage your product listings
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search your products..."
          className="pl-10"
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
        />
      </div>

      {/* Products Table */}
      {table.error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-800 mb-2">Error loading products</h3>
          <p className="text-red-600 mb-6">{table.error.message}</p>
          <Button onClick={() => table.refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      ) : table.isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : table.rows.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">You don't have any products yet.</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {table.rows.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/40x40?text=?";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={product.availableQuantity > 10 ? "success" : product.availableQuantity > 0 ? "warning" : "destructive"}
                      >
                        {product.availableQuantity} in stock
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(table.pagination.currentPage - 1) * table.pagination.pageSize + 1} to{" "}
              {Math.min(
                table.pagination.currentPage * table.pagination.pageSize,
                table.totalItems
              )}{" "}
              of {table.totalItems} products
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={table.pagination.goToPrevious}
                disabled={!table.pagination.canGoPrevious}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={table.pagination.goToNext}
                disabled={!table.pagination.canGoNext}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Product Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Add New Product" : "Edit Product"}
            </DialogTitle>
          </DialogHeader>

          {form.isLoadingInitialData ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Loading form configuration...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                  {generalError}
                </div>
              )}
              
              {/* Root Errors (e.g. Cross-Field Validation) */}
              {form.formState.errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                  <p className="font-medium">Validation Error</p>
                  <ul className="list-disc list-inside mt-1">
                    {Object.values(form.formState.errors.root).map((err, idx) => (
                      <li key={idx}>{(err as any).message}</li>
                    ))}
                  </ul>
                </div>
              )}
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <Input
                {...form.register("name")}
                placeholder="Enter product name"
                defaultValue={selectedProduct?.name || ""}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...form.register("description")}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                rows={3}
                placeholder="Enter product description"
                defaultValue={selectedProduct?.description || ""}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                defaultValue={selectedProduct?.category || "electronics"}
                onValueChange={(value) => form.setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register("price")}
                placeholder="0.00"
                defaultValue={selectedProduct?.price?.value || ""}
              />
            </div>

            {/* Available Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Quantity
              </label>
              <Input
                type="number"
                min="0"
                {...form.register("availableQuantity")}
                placeholder="0"
                defaultValue={selectedProduct?.availableQuantity || ""}
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <Input
                {...form.register("imageUrl")}
                placeholder="https://..."
                defaultValue={selectedProduct?.imageUrl || ""}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : formMode === "create" ? (
                  "Add Product"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
