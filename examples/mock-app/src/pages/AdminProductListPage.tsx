import { useTable } from "kf-ai-sdk";
import { ProductForRole, Roles } from "../../../../app";

export function AdminProductListPage() {
  const table = useTable<ProductForRole<typeof Roles.Admin>>({
    source: "product",
    columns: [
      { fieldId: "name", enableSorting: true },
      { fieldId: "category", enableSorting: true },
      { fieldId: "price", enableSorting: true },
      { fieldId: "inStock", enableSorting: true },
      { fieldId: "_created_at", enableSorting: true },
      // Admin-only fields
      { fieldId: "cost", enableSorting: true },
      { fieldId: "supplier", enableSorting: true },
      { fieldId: "margin", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      sorting: {
        field: "name" as keyof ProductForRole<typeof Roles.Admin>,
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
          <h1 className="text-2xl font-bold">Admin Products</h1>
          <p className="text-gray-600">
            {table.totalItems} products total • Full admin access
          </p>
          <div className="role-badge role-badge-admin">Admin View</div>
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
      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("name")}
              >
                Name
                {table.sort.field === "name" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("category")}
              >
                Category
                {table.sort.field === "category" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="table-header">Price</th>
              <th className="table-header">Cost</th>
              <th className="table-header">Margin</th>
              <th className="table-header">Supplier</th>
              <th className="table-header">Stock</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.isLoading ? (
              // Loading state - show skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`loading-${idx}`} className="animate-pulse">
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </td>
                </tr>
              ))
            ) : table.rows.length > 0 ? (
              table.rows.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="table-cell text-gray-500">
                    {product.category}
                  </td>
                  <td className="table-cell text-gray-900">
                    {typeof product.price === "object"
                      ? `${product.price.currency} ${product.price.value}`
                      : product.price}
                  </td>
                  <td className="table-cell text-gray-900">
                    {typeof product.cost === "object"
                      ? `${product.cost.currency} ${product.cost.value}`
                      : "N/A"}
                  </td>
                  <td className="table-cell text-gray-900">
                    {product.margin ? `${product.margin.toFixed(2)}%` : "N/A"}
                  </td>
                  <td className="table-cell text-gray-500">
                    {product.supplier || "N/A"}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.inStock
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="table-cell text-center text-gray-500"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
        </div>
      </div>
    </div>
  );
}
