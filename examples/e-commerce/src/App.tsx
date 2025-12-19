import { useState, useMemo, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { LoginPage } from "./pages/LoginPage";
import { BuyerProductListPage } from "./pages/BuyerProductListPage";
import { BuyerProductDetailsPage } from "./pages/BuyerProductDetailsPage";
import { BuyerCartPage } from "./pages/BuyerCartPage";
import { SellerProductsPage } from "./pages/SellerProductsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { initializeMockApi } from "./utils/mockApiClient";
import { setDefaultHeaders } from "kf-ai-sdk";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState<"Buyer" | "Seller" | null>(
    () => (localStorage.getItem("currentRole") as "Buyer" | "Seller" | null)
  );

  // Initialize Mock API once
  useMemo(() => {
    initializeMockApi();
  }, []);

  // Update headers whenever role changes
  useEffect(() => {
     if (currentRole) {
         const userId = currentRole === "Buyer" ? "buyer_001" : "seller_001";
         setDefaultHeaders({
             "Content-Type": "application/json",
             "x-user-role": currentRole,
             "x-user-id": userId,
         });
         localStorage.setItem("currentRole", currentRole);
     } else {
         localStorage.removeItem("currentRole");
     }
  }, [currentRole]);

  const handleLogin = (role: "Buyer" | "Seller") => {
    setCurrentRole(role);
    navigate("/products");
  };

  const handleLogout = () => {
    setCurrentRole(null);
    navigate("/");
  };

  // If not logged in, only allow access to login page
  if (!currentRole) {
      // If manually trying to access other routes, redirect to login
      if (location.pathname !== "/") {
          return <Navigate to="/" replace />;
      }
      return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentRole={currentRole} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          
          <Route
            path="/products"
            element={
              currentRole === "Buyer" ? (
                <BuyerProductListPage />
              ) : (
                <SellerProductsPage />
              )
            }
          />

          <Route
            path="/products/:id"
            element={
              currentRole === "Buyer" ? (
                <BuyerProductDetailsPage />
              ) : (
                <Navigate to="/products" replace />
              )
            }
          />

          <Route
            path="/cart"
            element={
               currentRole === "Buyer" ? (
                 <BuyerCartPage />
               ) : (
                 <Navigate to="/products" replace />
               )
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
