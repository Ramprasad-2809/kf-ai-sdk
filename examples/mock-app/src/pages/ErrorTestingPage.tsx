import { useState } from "react";
import { useTable } from "kf-ai-sdk";
import { ProductForRole, Roles } from "../../../../app";

type ErrorScenario = "none" | "network" | "auth" | "notfound";

export function ErrorTestingPage() {
  const [errorScenario, setErrorScenario] = useState<ErrorScenario>("none");

  // Create a custom source with error parameters
  const source =
    errorScenario === "none" ? "product" : `product?error=${errorScenario}`;

  const table = useTable<ProductForRole<typeof Roles.Admin>>({
    source,
    columns: [
      { fieldId: "name", enableSorting: true },
      { fieldId: "category", enableSorting: true },
      { fieldId: "price", enableSorting: true },
      { fieldId: "inStock", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    onSuccess: (data) => {
      console.log(`Success: Loaded ${data.length} products`);
    },
    onError: (error) => {
      console.error("Error loading products:", error);
    },
  });

  const handleErrorScenarioChange = (scenario: ErrorScenario) => {
    setErrorScenario(scenario);
    // Trigger a refetch with the new error scenario
    setTimeout(() => {
      table.refetch();
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Error Testing Dashboard</h1>
        <p className="text-gray-600">
          Test different error scenarios with the useTable hook
        </p>
      </div>

      {/* Error Scenario Controls */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Error Scenarios</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="errorScenario"
              value="none"
              checked={errorScenario === "none"}
              onChange={(e) =>
                handleErrorScenarioChange(e.target.value as ErrorScenario)
              }
              className="text-blue-600"
            />
            <span className="text-green-700 font-medium">
              ✅ Normal Operation
            </span>
            <span className="text-gray-500">- API works normally</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="errorScenario"
              value="network"
              checked={errorScenario === "network"}
              onChange={(e) =>
                handleErrorScenarioChange(e.target.value as ErrorScenario)
              }
              className="text-blue-600"
            />
            <span className="text-red-700 font-medium">
              🔥 Network Error (500)
            </span>
            <span className="text-gray-500">- Simulates server failure</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="errorScenario"
              value="auth"
              checked={errorScenario === "auth"}
              onChange={(e) =>
                handleErrorScenarioChange(e.target.value as ErrorScenario)
              }
              className="text-blue-600"
            />
            <span className="text-orange-700 font-medium">
              🔒 Authorization Error (401)
            </span>
            <span className="text-gray-500">- Simulates auth failure</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="errorScenario"
              value="notfound"
              checked={errorScenario === "notfound"}
              onChange={(e) =>
                handleErrorScenarioChange(e.target.value as ErrorScenario)
              }
              className="text-blue-600"
            />
            <span className="text-purple-700 font-medium">
              ❓ Not Found Error (404)
            </span>
            <span className="text-gray-500">- Simulates missing resource</span>
          </label>
        </div>

        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => table.refetch()}
            disabled={table.isFetching}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {table.isFetching ? "Testing..." : "Test Current Scenario"}
          </button>
        </div>
      </div>

      {/* State Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Current Table State:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>Loading:</strong>
            <span
              className={`ml-1 ${table.isLoading ? "text-blue-600" : "text-gray-500"}`}
            >
              {table.isLoading ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <strong>Fetching:</strong>
            <span
              className={`ml-1 ${table.isFetching ? "text-blue-600" : "text-gray-500"}`}
            >
              {table.isFetching ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <strong>Error:</strong>
            <span
              className={`ml-1 ${table.error ? "text-red-600" : "text-green-600"}`}
            >
              {table.error ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <strong>Data Rows:</strong>
            <span className="ml-1 text-blue-600">{table.rows.length}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {table.isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6">
          <div className="flex items-center">
            <div className="loading-spinner"></div>
            <span className="ml-3 text-blue-800">
              Loading products for error scenario:{" "}
              <strong>{errorScenario}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {table.error && (
        <div className="bg-red-50 border border-red-200 rounded p-6">
          <h3 className="text-red-800 font-semibold">❌ Error Detected</h3>
          <p className="text-red-700 mt-1">{table.error.message}</p>
          <p className="text-red-600 text-sm mt-2">
            This error was triggered by the "<strong>{errorScenario}</strong>"
            scenario.
          </p>
          <button
            onClick={() => table.refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* Success State */}
      {!table.isLoading && !table.error && table.rows.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-6">
          <h3 className="text-green-800 font-semibold">✅ Success</h3>
          <p className="text-green-700">
            Successfully loaded <strong>{table.rows.length}</strong> products.
            The useTable hook is working correctly with the current scenario.
          </p>

          {/* Sample Data Table */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">
              Sample Data (First 3 rows):
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-green-100">
                    <th className="px-3 py-1 text-left text-green-800">Name</th>
                    <th className="px-3 py-1 text-left text-green-800">
                      Category
                    </th>
                    <th className="px-3 py-1 text-left text-green-800">
                      Price
                    </th>
                    <th className="px-3 py-1 text-left text-green-800">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-green-50">
                  {table.rows.slice(0, 3).map((product, index) => (
                    <tr key={index}>
                      <td className="px-3 py-1 text-green-700">
                        {product.name}
                      </td>
                      <td className="px-3 py-1 text-green-700">
                        {product.category}
                      </td>
                      <td className="px-3 py-1 text-green-700">
                        {typeof product.price === "object"
                          ? `${product.price.currency} ${product.price.value}`
                          : product.price}
                      </td>
                      <td className="px-3 py-1 text-green-700">
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!table.isLoading && !table.error && table.rows.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-6">
          <h3 className="text-yellow-800 font-semibold">⚠️ No Data</h3>
          <p className="text-yellow-700">
            No products were returned. This might be normal depending on filters
            or could indicate an issue.
          </p>
        </div>
      )}

      {/* Testing Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="text-blue-800 font-semibold mb-2">🧪 Testing Tips</h3>
        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
          <li>
            Switch between scenarios to test different error handling paths
          </li>
          <li>
            Check the browser's Network tab to see the actual HTTP requests
          </li>
          <li>Notice how React Query caches successful responses</li>
          <li>Observe loading states and error boundaries in action</li>
          <li>Test pagination and filtering with different error states</li>
        </ul>
      </div>
    </div>
  );
}
