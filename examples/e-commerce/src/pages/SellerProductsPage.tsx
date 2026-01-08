import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTable, useForm } from "kf-ai-sdk";
import { Product, ProductForRole } from "../../../../app";
import { Roles } from "../../../../app/types/roles";
import { useQuery } from "@tanstack/react-query";
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

type SellerProduct = ProductForRole<"Seller">;

export function SellerProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(
    null
  );
  const [formMode, setFormMode] = useState<"create" | "update">("create");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const product = new Product(Roles.Seller);

  const table = useTable<SellerProduct>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", label: "Name", enableSorting: true },
      { fieldId: "Price", label: "Price", enableSorting: true },
      { fieldId: "Category", label: "Category", enableSorting: true },
      { fieldId: "Stock", label: "Stock", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: "Title", direction: "asc" },
    },
  });

  // Store the first valid instanceId to avoid re-fetching categories when table changes
  const instanceIdRef = useRef<string | null>(null);
  if (!instanceIdRef.current && table.rows[0]?._id) {
    instanceIdRef.current = table.rows[0]._id;
  }

  // Fetch categories only when dropdown is opened, cache permanently
  const { data: categories = [], isFetching: isCategoriesLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      if (!instanceIdRef.current) return [];
      return product.fetchField(instanceIdRef.current, "Category");
    },
    enabled: categoryDropdownOpen && !!instanceIdRef.current,
    staleTime: Infinity, // Never refetch - categories are static
    gcTime: Infinity, // Keep in cache forever
  });

  const form = useForm<SellerProduct>({
    source: "BDO_AmazonProductMaster",
    operation: formMode,
    recordId: selectedProduct?._id,
    enabled: showForm,
    mode: "onBlur", // Validate on submit
    draftOnEveryChange: false, // Only trigger draft for computed field dependencies
    onSuccess: () => {
      setShowForm(false);
      setSelectedProduct(null);
      setGeneralError(null);
      table.refetch();
    },
    onError: (error) => setGeneralError(error.message),
    onSchemaError: (error) =>
      setGeneralError(`Configuration Error: ${error.message}`),
    onSubmitError: (error) =>
      setGeneralError(`Submission Failed: ${error.message}`),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
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

  const handleDelete = async (item: SellerProduct) => {
    if (window.confirm(`Are you sure you want to delete "${item.Title}"?`)) {
      try {
        await product.delete(item._id);
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
          <p className="text-gray-500">Manage your product listings</p>
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
          <h3 className="text-xl font-medium text-red-800 mb-2">
            Error loading products
          </h3>
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
                            src={
                              product.ImageSrc ||
                              "https://via.placeholder.com/40x40?text=?"
                            }
                            alt={product.Title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/40x40?text=?";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.Title}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {product.Description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {product.Category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(product.Price)}
                      {product.LowStock && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          product.Stock > 10
                            ? "success"
                            : product.Stock > 0
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {product.Stock} in stock
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
              Showing{" "}
              {(table.pagination.currentPage - 1) * table.pagination.pageSize +
                1}{" "}
              to{" "}
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
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Add New Product" : "Edit Product"}
            </DialogTitle>
          </DialogHeader>

          {form.isLoadingInitialData ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">
                Loading form configuration...
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="overflow-y-auto flex-1 px-1">
                <div className="space-y-4 pb-4">
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
                        {Object.values(form.formState.errors.root).map(
                          (err, idx) => (
                            <li key={idx}>{(err as any).message}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                      Basic Information
                    </h3>

                    {/* Title - Full Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Title *
                      </label>
                      <Input
                        {...form.register("Title")}
                        placeholder="Enter product title"
                        defaultValue={selectedProduct?.Title || ""}
                        className={
                          form.formState.errors.Title
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }
                      />
                      {form.formState.errors.Title && (
                        <p className="text-red-600 text-sm mt-1">
                          {form.formState.errors.Title.message}
                        </p>
                      )}
                    </div>

                    {/* Description - Full Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        {...form.register("Description")}
                        className={`flex w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 ${
                          form.formState.errors.Description
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-gray-300 focus-visible:ring-blue-500"
                        }`}
                        rows={3}
                        placeholder="Enter product description"
                        defaultValue={selectedProduct?.Description || ""}
                      />
                      {form.formState.errors.Description && (
                        <p className="text-red-600 text-sm mt-1">
                          {form.formState.errors.Description.message}
                        </p>
                      )}
                    </div>

                    {/* Image Source URL - Full Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <Input
                        {...form.register("ImageSrc")}
                        placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                        defaultValue={selectedProduct?.ImageSrc || ""}
                        className={
                          form.formState.errors.ImageSrc
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }
                      />
                      {form.formState.errors.ImageSrc && (
                        <p className="text-red-600 text-sm mt-1">
                          {form.formState.errors.ImageSrc.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Provide a direct link to the product image
                      </p>
                    </div>

                    {/* Brand and Category - Two Columns */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brand
                        </label>
                        <Input
                          {...form.register("Brand")}
                          placeholder="Enter brand name"
                          defaultValue={selectedProduct?.Brand || ""}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <Select
                          value={
                            form.watch("Category") ||
                            selectedProduct?.Category ||
                            ""
                          }
                          onValueChange={(value) =>
                            form.setValue("Category", value)
                          }
                          open={categoryDropdownOpen}
                          onOpenChange={setCategoryDropdownOpen}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category">
                              {form.watch("Category") ||
                                selectedProduct?.Category ||
                                "Select category"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {isCategoriesLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-gray-500">
                                  Loading...
                                </span>
                              </div>
                            ) : categories.length > 0 ? (
                              categories.map(
                                (cat: { Value: string; Label: string }) => (
                                  <SelectItem key={cat.Value} value={cat.Value}>
                                    {cat.Label}
                                  </SelectItem>
                                )
                              )
                            ) : (
                              <div className="py-4 text-center text-sm text-gray-500">
                                No categories available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                      Pricing
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Selling Price (USD) *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register("Price")}
                          placeholder="0.00"
                          defaultValue={selectedProduct?.Price || ""}
                          className={
                            form.formState.errors.Price
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }
                        />
                        {form.formState.errors.Price && (
                          <p className="text-red-600 text-sm mt-1">
                            {form.formState.errors.Price.message}
                          </p>
                        )}
                      </div>

                      {/* MRP */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Retail Price (USD) *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register("MRP")}
                          placeholder="0.00"
                          defaultValue={selectedProduct?.MRP || ""}
                          className={
                            form.formState.errors.MRP
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }
                        />
                        {form.formState.errors.MRP && (
                          <p className="text-red-600 text-sm mt-1">
                            {form.formState.errors.MRP.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inventory Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                      Inventory Management
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Stock */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Quantity *
                        </label>
                        <Input
                          type="number"
                          min="0"
                          {...form.register("Stock")}
                          placeholder="0"
                          defaultValue={selectedProduct?.Stock || ""}
                          className={
                            form.formState.errors.Stock
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }
                        />
                        {form.formState.errors.Stock && (
                          <p className="text-red-600 text-sm mt-1">
                            {form.formState.errors.Stock.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Warehouse - Full Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warehouse
                      </label>
                      <Select
                        defaultValue={selectedProduct?.Warehouse || ""}
                        onValueChange={(value) =>
                          form.setValue(
                            "Warehouse",
                            value as
                              | "Warehouse_A"
                              | "Warehouse_B"
                              | "Warehouse_C"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Warehouse_A">
                            Warehouse A - North
                          </SelectItem>
                          <SelectItem value="Warehouse_B">
                            Warehouse B - South
                          </SelectItem>
                          <SelectItem value="Warehouse_C">
                            Warehouse C - East
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Computed Fields Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                      Computed Fields (Auto-calculated)
                    </h3>

                    {/* Discount Percentage */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount %
                        </label>
                        <Input
                          value={(form.watch("Discount") || 0).toFixed(2)}
                          readOnly
                          disabled
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-calculated from (MRP - Price) ÷ MRP × 100
                        </p>
                      </div>

                      {/* Low Stock Indicator */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock Status
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              form.watch("LowStock")
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {form.watch("LowStock")
                              ? "⚠️ Low Stock"
                              : "✅ Good Stock"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-calculated: Stock ≤ Reorder Level
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
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
