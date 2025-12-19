import { Link, useLocation } from "react-router-dom";
import { useRole } from "../providers/RoleProvider";
import { Roles } from "../../../../app";

export function Navigation() {
  const { currentRole, setRole } = useRole();
  const location = useLocation();

  // Role-aware navigation configuration
  const navigationConfig = {
    [Roles.Admin]: [
      { path: "/", label: "📊 Dashboard", icon: "📊" },
      { path: "/products", label: "📦 Manage Products", icon: "📦" },
      { path: "/orders", label: "🛒 Manage Orders", icon: "🛒" },
      { path: "/kanban", label: "📋 Kanban Demo", icon: "📋" },
    ],
    [Roles.User]: [
      { path: "/", label: "🏠 Home", icon: "🏠" },
      { path: "/products", label: "🛍️ Products", icon: "📦" },
      { path: "/orders", label: "📋 My Orders", icon: "📋" },
      { path: "/kanban", label: "📋 Kanban Demo", icon: "📋" },
    ],
  };

  const navigationItems =
    navigationConfig[currentRole as keyof typeof navigationConfig];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-gray-900">
              KF AI SDK
            </Link>
            <span className="text-sm text-gray-500">Mock App</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute(item.path)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">Role:</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRole("admin")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentRole === "admin"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRole("user")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentRole === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                User
              </button>
            </div>

            {/* Current Role Badge */}
            <div
              className={`role-badge ${
                currentRole === "admin" ? "role-badge-admin" : "role-badge-user"
              }`}
            >
              {currentRole === "admin" ? "👑 Admin" : "👤 User"}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-col space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute(item.path)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Role-based Feature Info */}
        <div className="pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Current View:</strong>{" "}
                  {currentRole === "admin" ? "Administrator" : "Regular User"}
                </span>
                <span className="text-gray-500">
                  Switch roles to see different access levels
                </span>
              </div>

              {currentRole === "admin" && (
                <div className="text-purple-700 text-xs">
                  ✨ Admin privileges: Full data access, cost/profit visibility,
                  management features
                </div>
              )}

              {currentRole === "user" && (
                <div className="text-blue-700 text-xs">
                  🔒 User privileges: Limited to public data, personal orders
                  only
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
