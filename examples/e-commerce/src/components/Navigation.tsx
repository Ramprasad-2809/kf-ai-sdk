import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Package, Store, LucideIcon } from "lucide-react";
import { useRole } from "../providers/RoleProvider";
import { useCart } from "../providers/CartProvider";
import { Badge } from "./ui/badge";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
}

export function Navigation() {
  const { currentRole, setRole, isBuyer } = useRole();
  const { itemCount } = useCart();
  const location = useLocation();

  // Role-aware navigation configuration
  const navigationConfig: Record<string, NavItem[]> = {
    buyer: [
      { path: "/products", label: "Products", icon: Package },
      { path: "/cart", label: "Cart", icon: ShoppingCart, showBadge: true },
    ],
    seller: [
      { path: "/products", label: "My Products", icon: Store },
    ],
  };

  const navigationItems = navigationConfig[currentRole];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center space-x-4">
            <Link to="/products" className="text-xl font-bold text-gray-900">
              E-Commerce Demo
            </Link>
            <span className="text-sm text-gray-500">KF AI SDK</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute(item.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.showBadge && isBuyer && itemCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center">
                      {itemCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">Role:</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRole("buyer")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentRole === "buyer"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Buyer
              </button>
              <button
                onClick={() => setRole("seller")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentRole === "seller"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Seller
              </button>
            </div>

            {/* Current Role Badge */}
            <Badge
              variant={currentRole === "buyer" ? "default" : "success"}
              className="capitalize"
            >
              {currentRole}
            </Badge>
          </div>
        </div>

        {/* Role Info Bar */}
        <div className="pb-3">
          <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
            {currentRole === "buyer" ? (
              <span>
                <strong>Buyer View:</strong> Browse products and manage your cart
              </span>
            ) : (
              <span>
                <strong>Seller View:</strong> Manage your product listings
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
