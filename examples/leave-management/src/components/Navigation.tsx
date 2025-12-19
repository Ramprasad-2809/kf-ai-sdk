import { Link, useLocation } from "react-router-dom";
import { useRole } from "../providers/RoleProvider";

export function Navigation() {
  const { currentRole, setRole } = useRole();
  const location = useLocation();

  // Role-aware navigation configuration
  const navigationConfig = {
    manager: [
      { path: "/", label: "📊 Dashboard", icon: "📊" },
      { path: "/approvals", label: "✅ Leave Approvals", icon: "✅" },
    ],
    employee: [
      { path: "/", label: "🏠 Dashboard", icon: "🏠" },
      { path: "/my-leaves", label: "📋 My Leaves", icon: "📋" },
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
              Leave Management
            </Link>
            <span className="text-sm text-gray-500">KF AI SDK</span>
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
                onClick={() => setRole("manager")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentRole === "manager"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Manager
              </button>
              <button
                onClick={() => setRole("employee")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentRole === "employee"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Employee
              </button>
            </div>

            {/* Current Role Badge */}
            <div
              className={`role-badge ${
                currentRole === "manager" ? "role-badge-manager" : "role-badge-employee"
              }`}
            >
              {currentRole === "manager" ? "👤 Manager" : "👔 Employee"}
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
                  {currentRole === "manager" ? "Department Manager" : "Employee"}
                </span>
                <span className="text-gray-500">
                  Switch roles to see different access levels
                </span>
              </div>

              {currentRole === "manager" && (
                <div className="text-purple-700 text-xs">
                  ✨ Manager privileges: Team leave approvals, team leave balance view
                </div>
              )}

              {currentRole === "employee" && (
                <div className="text-green-700 text-xs">
                  🔒 Employee privileges: Personal leave requests, own leave balance
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}