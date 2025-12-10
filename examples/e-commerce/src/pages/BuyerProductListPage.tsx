import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { useTable } from "kf-ai-sdk";
import { useCart } from "../providers/CartProvider";
import { ProductCard } from "../components/ProductCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface BuyerProduct {
  _id: string;
  name: string;
  price: { value: number; currency: string };
  description: string;
  category: string;
  availableQuantity: number;
  imageUrl: string;
  sellerName?: string;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports" },
];

export function BuyerProductListPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const table = useTable<BuyerProduct>({
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
      pagination: { pageNo: 1, pageSize: 12 },
      sorting: { field: "name", direction: "asc" },
    },
  });

  const handleAddToCart = async (product: BuyerProduct) => {
    setAddingToCart(product._id);
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error("Failed to add to cart from list:", error);
      // Optional: Add toast notification here
    } finally {
      setAddingToCart(null);
    }
  };

  const handleProductClick = (product: BuyerProduct) => {
    navigate(`/products/${product._id}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === "all") {
      table.filter.clearConditions();
    } else {
      table.filter.clearConditions();
      table.filter.addCondition({
        lhsField: "category",
        operator: "EQ",
        rhsValue: value,
        rhsType: "Constant",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">
            {table.totalItems} products available
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={table.search.query}
            onChange={(e) => table.search.setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
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
      </div>

      {/* Loading State and Error State */}
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
        <div className="text-center py-12">
          <p className="text-gray-500">No products found</p>
          <Button
            variant="link"
            onClick={() => {
              table.search.clear();
              table.filter.clearConditions();
              setSelectedCategory("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {table.rows.map((product) => (
              <div key={product._id} className="relative">
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onClick={handleProductClick}
                  showAddToCart={true}
                />
                {addingToCart === product._id && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t">
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
              <span className="flex items-center px-3 text-sm">
                Page {table.pagination.currentPage} of {table.pagination.totalPages}
              </span>
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
    </div>
  );
}
