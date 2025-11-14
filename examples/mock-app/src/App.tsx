import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";
import { AdminProductsPage } from "./pages/AdminProductsPage";
import { UserProductsPage } from "./pages/UserProductsPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { UserOrdersPage } from "./pages/UserOrdersPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { initializeMockApi } from "./utils/mockApiClient";

function App() {
  useEffect(() => {
    initializeMockApi();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Dashboard - Role-based home page */}
          <Route
            path="/"
            element={
              <RoleBasedRoute
                adminPage={<AdminDashboardPage />}
                userPage={<UserDashboardPage />}
              />
            }
          />

          {/* Products - Role-based product management/browsing */}
          <Route
            path="/products"
            element={
              <RoleBasedRoute
                adminPage={<AdminProductsPage />}
                userPage={<UserProductsPage />}
              />
            }
          />

          {/* Orders - Role-based order management/history */}
          <Route
            path="/orders"
            element={
              <RoleBasedRoute
                adminPage={<AdminOrdersPage />}
                userPage={<UserOrdersPage />}
              />
            }
          />

          {/* 404 - Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
