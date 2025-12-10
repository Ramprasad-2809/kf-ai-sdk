import { useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { LoginPage } from "./pages/LoginPage";
import { BuyerProductListPage } from "./pages/BuyerProductListPage";
import { BuyerProductDetailsPage } from "./pages/BuyerProductDetailsPage";
import { BuyerCartPage } from "./pages/BuyerCartPage";
import { SellerProductsPage } from "./pages/SellerProductsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { initializeMockApi } from "./utils/mockApiClient";
import { useRole } from "./providers/RoleProvider";

function AppContent() {
  const { currentRole } = useRole();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Login / Landing Page */}
          <Route path="/" element={<LoginPage />} />

          {/* Products - Role-based product listing/management */}
          <Route
            path="/products"
            element={
              <RoleBasedRoute
                buyerPage={<BuyerProductListPage />}
                sellerPage={<SellerProductsPage />}
              />
            }
          />

          {/* Product Details - Buyer only */}
          <Route
            path="/products/:id"
            element={
              currentRole === "buyer" ? (
                <BuyerProductDetailsPage />
              ) : (
                <Navigate to="/products" replace />
              )
            }
          />

          {/* Cart - Buyer only */}
          <Route
            path="/cart"
            element={
              currentRole === "buyer" ? (
                <BuyerCartPage />
              ) : (
                <Navigate to="/products" replace />
              )
            }
          />

          {/* 404 - Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  useMemo(() => {
    initializeMockApi();
  }, []);

  return <AppContent />;
}

export default App;
