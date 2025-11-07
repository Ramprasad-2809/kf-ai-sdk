import { useTable } from "kf-ai-sdk";
import { OrderForRole, Roles } from "../../../../app";

export function UserOrderHistoryPage() {
  const table = useTable<OrderForRole<typeof Roles.User>>({
    source: "order",
    columns: [
      { fieldId: "_id", enableSorting: true },
      { fieldId: "status", enableSorting: true },
      { fieldId: "total", enableSorting: true },
      { fieldId: "itemCount", enableSorting: true },
      { fieldId: "_created_at", enableSorting: true },
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
        field: "_created_at" as keyof OrderForRole<typeof Roles.User>,
        direction: "desc",
      },
    },
    onSuccess: (data) => {
      console.log(`Loaded ${data.length} orders`);
    },
    onError: (error) => {
      console.error("Failed to load orders:", error);
    },
  });

  if (table.error) {
    return (
      <div className="error-boundary">
        <h3 className="text-red-800 font-medium">Error loading orders</h3>
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

  const totalSpent = table.rows.reduce(
    (sum, order) =>
      sum + (typeof order.total === "object" ? order.total.value : 0),
    0
  );
  const recentOrders = table.rows.filter((order) => {
    const orderDate = new Date(order._created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return orderDate >= thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Order History</h1>
          <p className="text-gray-600">
            {table.totalItems} total orders • Customer view
          </p>
          <div className="role-badge role-badge-user">Your Orders Only</div>
        </div>

        <button
          onClick={() => table.refetch()}
          disabled={table.isFetching}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {table.isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-xl font-bold text-blue-600">{table.totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
          <p className="text-xl font-bold text-green-600">
            ${totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Recent Orders</h3>
          <p className="text-xl font-bold text-orange-600">{recentOrders}</p>
          <p className="text-xs text-gray-500">Last 30 days</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search your orders..."
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

      {/* Orders Table */}
      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("_id")}
              >
                Order #
                {table.sort.field === "_id" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="table-header">Status</th>
              <th className="table-header">Total</th>
              <th className="table-header">Items</th>
              <th
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => table.sort.toggle("_created_at")}
              >
                Date
                {table.sort.field === "_created_at" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.isLoading ? (
              // Loading state - show skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`loading-${idx}`} className="animate-pulse">
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </td>
                </tr>
              ))
            ) : table.rows.length > 0 ? (
              table.rows.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-blue-600">
                    #{order._id.replace("order_", "")}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                            ? "bg-orange-100 text-orange-800"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : order.status === "shipped"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell font-medium text-gray-900">
                    $
                    {(typeof order.total === "object"
                      ? order.total.value
                      : 0
                    ).toFixed(2)}
                  </td>
                  <td className="table-cell text-gray-500">
                    {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </td>
                  <td className="table-cell text-gray-500">
                    {new Date(order._created_at).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="table-cell text-center text-gray-500"
                >
                  <div className="py-8">
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">
                      You haven't placed any orders yet.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {table.rows.length} of {table.totalItems} orders
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

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-blue-800 text-sm">
          <strong>Personal View:</strong> This page shows only your orders.
          Administrative data like profit margins and internal notes are not
          visible.
        </p>
      </div>
    </div>
  );
}
