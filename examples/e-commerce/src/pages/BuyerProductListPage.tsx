import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Star,
} from "lucide-react";
import { useTable } from "kf-ai-sdk";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Cart, Product, ProductForRole } from "../../../../app";
import { Roles } from "../../../../app/types/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

// Price range definitions with min/max values
const PRICE_RANGES = [
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 to $50", min: 25, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $200", min: 100, max: 200 },
  { label: "$200 & Above", min: 200, max: null },
] as const;

export function BuyerProductListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(
    null
  );
  const [selectedSort, setSelectedSort] = useState("featured");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const cart = new Cart(Roles.Buyer);
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
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
      pagination: { pageNo: 1, pageSize: 12 },
      sorting: { field: "Title", direction: "asc" },
    },
  });

  // Store the first valid instanceId to avoid re-fetching categories when filters change
  const instanceIdRef = useRef<string | null>(null);
  if (!instanceIdRef.current && table.rows[0]?._id) {
    instanceIdRef.current = table.rows[0]._id;
  }

  // Fetch categories once on page load and cache permanently
  const { data: categoriesData } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => {
      if (!instanceIdRef.current) {
        throw new Error("No instance ID available");
      }
      return product.fetchField(instanceIdRef.current, "Category");
    },
    enabled: !!instanceIdRef.current,
    staleTime: Infinity, // Never refetch - categories are static
    gcTime: Infinity, // Keep in cache forever
  });

  const categories: Array<{ Value: string; Label: string }> =
    categoriesData || [];

  const addToCartMutation = useMutation({
    mutationFn: async (product: BuyerProduct) => {
      // Assuming a quantity of 1 for now as per typical 'add to cart' behavior on list
      const payload = {
        productId: product._id,
        productName: product.Title,
        productPrice: { value: product.Price, currency: "USD" },
        productImage: product.ImageSrc || "",
        quantity: 1,
      };

      return cart.create(payload);
    },
    onSuccess: () => {
      // Invalidate cart count to update navigation
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: (error) => {
      console.error("Failed to add to cart:", error);
      // Optional: Toast error
    },
  });

  const handleAddToCart = async (product: BuyerProduct) => {
    setAddingToCart(product._id);
    try {
      await addToCartMutation.mutateAsync(product);
    } finally {
      setAddingToCart(null);
    }
  };

  const handleProductClick = (product: BuyerProduct) => {
    navigate(`/products/${product._id}`);
  };

  // Helper function to apply all active filters
  const applyFilters = (category: string, priceRange: string | null) => {
    table.filter.clearConditions();

    // Apply category filter
    if (category !== "all") {
      table.filter.addCondition({
        lhsField: "Category",
        operator: "EQ",
        rhsValue: category,
        rhsType: "Constant",
      });
    }

    // Apply price filter
    if (priceRange) {
      const range = PRICE_RANGES.find((r) => r.label === priceRange);
      if (range) {
        if (range.max === null) {
          // "$200 & Above" - use GTE
          table.filter.addCondition({
            lhsField: "Price",
            operator: "GTE",
            rhsValue: range.min,
            rhsType: "Constant",
          });
        } else if (range.min === 0) {
          // "Under $25" - use LT
          table.filter.addCondition({
            lhsField: "Price",
            operator: "LT",
            rhsValue: range.max,
            rhsType: "Constant",
          });
        } else {
          // Range like "$25 to $50" - use Between
          table.filter.addCondition({
            lhsField: "Price",
            operator: "Between",
            rhsValue: [range.min, range.max],
            rhsType: "Constant",
          });
        }
      }
    }
  };

  const handleCategoryChange = (value: string) => {
    // If clicking same category, toggle off to 'all'
    const newValue = selectedCategory === value ? "all" : value;
    setSelectedCategory(newValue);
    applyFilters(newValue, selectedPriceRange);
  };

  const handlePriceChange = (rangeLabel: string) => {
    // If clicking same range, toggle off
    const newValue = selectedPriceRange === rangeLabel ? null : rangeLabel;
    setSelectedPriceRange(newValue);
    applyFilters(selectedCategory, newValue);
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    switch (value) {
      case "price-asc":
        table.sort.set("Price", "asc");
        break;
      case "price-desc":
        table.sort.set("Price", "desc");
        break;
      case "newest":
        table.sort.set("_created_at", "desc");
        break;
      case "featured":
      default:
        table.sort.set("Title", "asc"); // Default sort by title
        break;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
        {/* Mobile Filter Header (only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between font-bold text-lg mb-4">
          <span>Filters</span>
          <SlidersHorizontal className="h-5 w-5" />
        </div>

        {/* Categories Group */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Departments</h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`text-sm text-left hover:text-blue-600 transition-colors ${selectedCategory === "all" ? "font-bold text-blue-600" : "text-gray-600"}`}
            >
              All Departments
            </button>
            {categories.length > 0 &&
              categories.map((cat) => (
                <button
                  key={cat.Value}
                  onClick={() => handleCategoryChange(cat.Value)}
                  className={`text-sm text-left hover:text-blue-600 transition-colors flex items-center gap-2 ${selectedCategory === cat.Value ? "font-bold text-blue-600" : "text-gray-600"}`}
                >
                  {selectedCategory === cat.Value && (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {cat.Label}
                </button>
              ))}
          </div>
        </div>

        <Separator />

        {/* Price Range Filter */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Price</h3>
          <div className="space-y-2">
            {PRICE_RANGES.map((range) => (
              <div key={range.label} className="flex items-center space-x-2">
                <Checkbox
                  id={range.label}
                  checked={selectedPriceRange === range.label}
                  onCheckedChange={() => handlePriceChange(range.label)}
                />
                <label
                  htmlFor={range.label}
                  className={`text-sm font-medium leading-none cursor-pointer ${
                    selectedPriceRange === range.label
                      ? "text-blue-600 font-bold"
                      : "text-gray-600"
                  }`}
                >
                  {range.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Customer Reviews (Mock UI) */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Customer Review</h3>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? "fill-current" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <span>& Up</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 space-y-4">
          {/* Results Header */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {selectedCategory === "all"
                  ? "All Products"
                  : categories.find((c) => c.Value === selectedCategory)?.Label}
              </h1>
              <p className="text-sm text-gray-500">
                {table.totalItems} results found
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search within results..."
                  className="pl-10 h-9"
                  value={table.search.query}
                  onChange={(e) => table.search.setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
                  Sort by:
                </span>
                <Select value={selectedSort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading & Error States */}
        {table.error ? (
          <div className="p-12 text-center bg-red-50 rounded-lg">
            <h3 className="text-red-800 font-medium">Something went wrong</h3>
            <p className="text-red-600 text-sm mt-1">{table.error.message}</p>
            <Button
              onClick={() => table.refetch()}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : table.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : table.rows.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Filter className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-medium text-lg">
              No products found
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              We couldn't find any products matching your current filters. Try
              adjusting your search or categories.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                table.search.clear();
                table.filter.clearConditions();
                setSelectedCategory("all");
                setSelectedPriceRange(null);
              }}
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          /* Product Grid */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {table.rows.map((product) => {
                const isInStock = product.Stock > 0;
                const formattedPrice = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(product.Price);
                // Extract parts for styled display (e.g., "$1,234.56" → ["$", "1,234", "56"])
                const priceMatch = formattedPrice.match(
                  /^(\$)([\d,]+)\.(\d{2})$/
                );
                const priceParts = priceMatch
                  ? {
                      currency: priceMatch[1],
                      integer: priceMatch[2],
                      fraction: priceMatch[3],
                    }
                  : { currency: "$", integer: "0", fraction: "00" };

                return (
                  <div key={product._id} className="relative group">
                    <Card
                      className={`h-full flex flex-col overflow-hidden border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 group cursor-pointer`}
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-white relative overflow-hidden p-4 flex items-center justify-center">
                        <img
                          src={
                            product.ImageSrc ||
                            "https://via.placeholder.com/400x400?text=No+Image"
                          }
                          alt={product.Title}
                          loading="lazy"
                          className={`max-h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105 ${
                            !isInStock ? "opacity-50 grayscale" : ""
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/400x400?text=No+Image";
                          }}
                        />
                        {!isInStock && (
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant="destructive"
                              className="uppercase text-[10px] tracking-wider px-2 py-1"
                            >
                              Out of Stock
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 flex-1 flex flex-col">
                        {/* Category & Rating */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                            {product.Category}
                          </span>
                          {/* Mock Rating */}
                          <div className="flex text-yellow-400">
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 text-slate-200 fill-current" />
                            <span className="text-xs text-slate-400 ml-1">
                              (42)
                            </span>
                          </div>
                        </div>

                        {/* Product Name */}
                        <h3 className="font-medium text-base text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                          {product.Title}
                        </h3>

                        {/* Price */}
                        <div className="mt-auto pt-2 flex items-baseline gap-1">
                          <span className="text-xs font-bold self-start mt-1">
                            {priceParts.currency}
                          </span>
                          <span className="text-2xl font-bold text-slate-900">
                            {priceParts.integer}
                          </span>
                          <span className="text-xs font-bold self-start mt-1">
                            {priceParts.fraction}
                          </span>

                          {/* Mock Prime badge */}
                          <span className="ml-2 text-xs text-blue-600 font-bold italic tracking-tighter">
                            Prime
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Delivery by{" "}
                          <span className="font-bold text-slate-700">
                            Tue, Dec 12
                          </span>
                        </p>
                      </CardContent>

                      <CardFooter className="p-4 pt-0">
                        <Button
                          className={`w-full font-medium ${
                            isInStock
                              ? "bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-yellow-500"
                              : ""
                          }`}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isInStock) {
                              handleAddToCart(product);
                            }
                          }}
                          disabled={!isInStock}
                        >
                          {isInStock ? (
                            <span className="flex items-center gap-2">
                              Add to Cart
                            </span>
                          ) : (
                            "Currently Unavailable"
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                    {addingToCart === product._id && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
                        <div className="bg-white p-3 rounded-full shadow-lg">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center border-t border-gray-200 pt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={table.pagination.goToPrevious}
                  disabled={!table.pagination.canGoPrevious}
                  className="w-24"
                >
                  Previous
                </Button>
                <div className="hidden sm:flex items-center gap-1 font-medium text-sm text-gray-600 px-4">
                  Page {table.pagination.currentPage} of{" "}
                  {table.pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={table.pagination.goToNext}
                  disabled={!table.pagination.canGoNext}
                  className="w-24"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
