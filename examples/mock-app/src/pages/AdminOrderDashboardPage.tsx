import { useMemo } from "react";
import { useTable } from "kf-ai-sdk";
import { OrderForRole, Roles } from "../../../../app";

export function AdminOrderDashboardPage() {
  const table = useTable<OrderForRole<typeof Roles.Admin>>({
    source: "order",
    columns: [
      { fieldId: "_id", enableSorting: true },
      { fieldId: "customerName", enableSorting: true },
      { fieldId: "status", enableSorting: true },
      { fieldId: "total", enableSorting: true },
      { fieldId: "profit", enableSorting: true },
      { fieldId: "itemCount", enableSorting: true },
      { fieldId: "_created_at", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 15,
      },
      sorting: {
        field: "_created_at" as keyof OrderForRole<typeof Roles.Admin>,
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

  // Calculate dashboard stats
  const stats = useMemo(() => {
    const orders = table.rows;
    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum + (typeof order.total === "object" ? order.total.value : 0),
      0
    );
    const totalProfit = orders.reduce(
      (sum, order) =>
        sum +
        (order.profit && typeof order.profit === "object"
          ? order.profit.value
          : 0),
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const completedOrders = orders.filter(
      (order) => order.status === "delivered"
    ).length;

    return { totalRevenue, totalProfit, pendingOrders, completedOrders };
  }, [table.rows]);

  if (table.error) {
    return (
      <div className="error-boundary">
        <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Dashboard</h1>
          <p className="text-gray-600">
            Complete order management and analytics
          </p>
          <div className="role-badge role-badge-admin">Admin Dashboard</div>
        </div>

        <button
          onClick={() => table.refetch()}
          disabled={table.isFetching}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {table.isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">
            ${stats.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
          <p className="text-2xl font-bold text-blue-600">
            ${stats.totalProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Pending Orders</h3>
          <p className="text-2xl font-bold text-orange-600">
            {stats.pendingOrders}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">
            Completed Orders
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.completedOrders}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search orders..."
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
                Order ID
                {table.sort.field === "_id" && (
                  <span className="ml-1">
                    {table.sort.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="table-header">Customer</th>
              <th className="table-header">Status</th>
              <th className="table-header">Total</th>
              <th className="table-header">Profit</th>
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
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </td>
                  <td className="table-cell">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                </tr>
              ))
            ) : table.rows.length > 0 ? (
              table.rows.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-900">
                    {order._id}
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {order.customerEmail}
                      </div>
                    </div>
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
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell font-medium text-gray-900">
                    $
                    {typeof order.total === "object"
                      ? order.total.value.toFixed(2)
                      : "0.00"}
                  </td>
                  <td className="table-cell font-medium text-green-600">
                    $
                    {order.profit && typeof order.profit === "object"
                      ? order.profit.value.toFixed(2)
                      : "0.00"}
                  </td>
                  <td className="table-cell text-gray-500">
                    {order.itemCount}
                  </td>
                  <td className="table-cell text-gray-500">
                    {new Date(order._created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="table-cell text-center text-gray-500"
                >
                  No orders found.
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
    </div>
  );
}
