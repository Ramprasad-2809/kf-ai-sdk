import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Toaster, toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Menu,
  User,
  LogOut,
  Package,
  AlertCircle,
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { LoginPage } from "./pages/LoginPage";
import { BuyerProductListPage } from "./pages/BuyerProductListPage";
import { BuyerProductDetailsPage } from "./pages/BuyerProductDetailsPage";
import { BuyerCartPage } from "./pages/BuyerCartPage";
import { SellerProductsPage } from "./pages/SellerProductsPage";
import { InventoryRestockingPage } from "./pages/InventoryRestockingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { initializeMockApi } from "./utils/mockApiClient";
import { setDefaultHeaders } from "kf-ai-sdk";
import { fetchIdentity, setUserRole } from "./services/authApi";
import type { IdentityResponse, AppRole } from "./types/auth";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Identity state - fetched from /api/id
  const [identity, setIdentity] = useState<IdentityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSettingRole, setIsSettingRole] = useState(false);

  // Derive current role from identity
  const currentRole = identity?.userDetails.Role ?? null;

  // Initialize API and fetch identity on mount
  useEffect(() => {
    initializeMockApi();

    async function loadIdentity() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchIdentity();
        setIdentity(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    loadIdentity();
  }, []);

  // Update headers whenever identity changes
  useEffect(() => {
    if (identity?.userDetails) {
      setDefaultHeaders({
        "Content-Type": "application/json",
        "x-user-role": identity.userDetails.Role,
        "x-user-id": identity.userDetails._id,
      });
    }
  }, [identity]);

  const handleLogin = async (role: AppRole) => {
    if (!identity?.userDetails._id) {
      return;
    }

    try {
      setIsSettingRole(true);

      // 1. PUT to set the role
      await setUserRole(identity.userDetails._id, role);

      // 2. Refetch identity to get updated role
      const updatedIdentity = await fetchIdentity();
      setIdentity(updatedIdentity);

      // 3. Navigate based on role
      if (role === "InventoryManager" || role === "WarehouseStaff") {
        navigate("/inventory/restocking");
      } else {
        navigate("/products");
      }
    } catch (err) {
      console.error("Failed to set role:", err);
      toast.error("Failed to switch role. Please try again.");
    } finally {
      setIsSettingRole(false);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const cartCount = 0;

  // Show loading spinner while fetching identity
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if identity fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show login page if at root
  if (location.pathname === "/") {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          currentRole={currentRole}
          userName={identity?.userDetails._name ?? ""}
          isSettingRole={isSettingRole}
        />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        {/* Top Bar - Main Navigation */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-slate-800"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link to="/products" className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl leading-none tracking-tight">
                  PrimeStore
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  KF AI SDK DEMO
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar (Hidden on mobile for now) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full h-10 pl-4 pr-10 rounded-l-md text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-0 top-0 h-10 w-12 bg-blue-600 hover:bg-blue-700 rounded-r-md flex items-center justify-center transition-colors">
                <Search className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* User Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-start leading-tight hover:outline-none group">
                  <span className="text-xs text-slate-400 group-hover:text-blue-400 transition-colors">
                    Hello, {currentRole}
                  </span>
                  <span className="font-bold text-sm flex items-center gap-1 group-hover:underline">
                    Account & Lists
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  My Account ({currentRole})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Orders</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            {currentRole === "Buyer" && (
              <Link
                to="/cart"
                className="flex items-center gap-2 hover:text-blue-400 transition-colors relative"
              >
                <div className="relative">
                  <ShoppingCart className="h-8 w-8" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
                    {cartCount}
                  </span>
                </div>
                <span className="font-bold text-sm hidden sm:block mt-3">
                  Cart
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Secondary Bar (Categories - Visual Only) */}
        <div className="bg-slate-800 h-10 hidden md:flex items-center px-4 text-sm text-slate-200 gap-6 overflow-x-auto">
          <button className="flex items-center gap-1 font-bold hover:text-white transition-colors">
            <Menu className="h-4 w-4" />
            All
          </button>
          <button className="hover:text-white transition-colors">
            Today's Deals
          </button>
          <button className="hover:text-white transition-colors">
            Customer Service
          </button>
          <button className="hover:text-white transition-colors">
            Registry
          </button>
          <button className="hover:text-white transition-colors">
            Gift Cards
          </button>
          <button className="hover:text-white transition-colors">Sell</button>
          {(currentRole === "InventoryManager" ||
            currentRole === "WarehouseStaff") && (
            <Link
              to="/inventory/restocking"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Package className="h-4 w-4" />
              Restocking
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />

          <Route
            path="/products"
            element={
              currentRole === "Buyer" || currentRole === "Admin" ? (
                <BuyerProductListPage />
              ) : (
                <SellerProductsPage />
              )
            }
          />

          <Route
            path="/products/:id"
            element={
              currentRole === "Buyer" || currentRole === "Admin" ? (
                <BuyerProductDetailsPage />
              ) : (
                <Navigate to="/products" replace />
              )
            }
          />

          <Route
            path="/cart"
            element={
              currentRole === "Buyer" || currentRole === "Admin" ? (
                <BuyerCartPage />
              ) : (
                <Navigate to="/products" replace />
              )
            }
          />

          <Route
            path="/inventory/restocking"
            element={
              currentRole === "InventoryManager" ||
              currentRole === "WarehouseStaff" ||
              currentRole === "Admin" ? (
                <InventoryRestockingPage />
              ) : (
                <Navigate to="/products" replace />
              )
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}
