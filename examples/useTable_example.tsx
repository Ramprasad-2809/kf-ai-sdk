import React from 'react';
import { useTable } from '../sdk/components';
import { ProductForRole, Roles } from '../app';

/**
 * Example demonstrating useTable hook usage
 * This shows the clean, flat API structure without nested state access
 */
function ProductsTableExample() {
  const table = useTable<ProductForRole<typeof Roles.Admin>>({
    source: 'products',
    columns: [
      { fieldId: 'name', enableSorting: true, label: 'Product Name' },
      { fieldId: 'category', enableSorting: true, label: 'Category' },
      { fieldId: 'price', enableSorting: true, label: 'Price' },
      { fieldId: 'inStock', enableSorting: true, label: 'In Stock' },
      { fieldId: '_created_at', enableSorting: true, label: 'Created' },
      { 
        fieldId: 'description', 
        label: 'Description',
        transform: (value: string) => (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        )
      },
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
        field: 'name' as keyof ProductForRole<typeof Roles.Admin>,
        direction: 'asc',
      },
    },
    onSuccess: (data) => {
      console.log(`Loaded ${data.length} products`);
    },
    onError: (error) => {
      console.error('Failed to load products:', error);
    },
  });

  // Loading state
  if (table.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Loading products...</div>
      </div>
    );
  }

  // Error state
  if (table.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
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
            {table.totalItems} products total
          </p>
        </div>
        
        <button 
          onClick={() => table.refetch()}
          disabled={table.isFetching}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {table.isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search products..."
          value={table.filter.global}
          onChange={(e) => table.filter.setGlobal(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {table.filter.global && (
          <button 
            onClick={table.filter.clear}
            className="px-2 py-1 text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle('name')}
              >
                Name
                {table.sort.field === 'name' && (
                  <span className="ml-1">
                    {table.sort.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle('category')}
              >
                Category
                {table.sort.field === 'category' && (
                  <span className="ml-1">
                    {table.sort.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle('price')}
              >
                Price
                {table.sort.field === 'price' && (
                  <span className="ml-1">
                    {table.sort.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                In Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.rows.length > 0 ? (
              table.rows.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof product.price === 'object' 
                      ? `${product.price.currency} ${product.price.value}` 
                      : product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.inStock 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product._created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={product.description}>
                      {product.description}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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
          
          <select
            value={table.pagination.pageSize}
            onChange={(e) => table.pagination.setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Sort State Display */}
      <div className="text-xs text-gray-500">
        {table.sort.field && (
          <div>
            Sorted by: {String(table.sort.field)} ({table.sort.direction})
            <button 
              onClick={table.sort.clear}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              Clear sort
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsTableExample;