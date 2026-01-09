import { ShoppingBag, Store, Package, Shield, Warehouse, User } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { AppRole } from "../types/auth";

interface LoginPageProps {
  onLogin: (role: AppRole) => void;
  currentRole: AppRole | null;
  userName: string;
  isSettingRole: boolean;
}

const ROLES: Array<{
  id: AppRole;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClasses: {
    bg: string;
    icon: string;
    button: string;
    buttonHover: string;
  };
  features: string[];
}> = [
  {
    id: "Admin",
    label: "Admin",
    description: "Full system access and control",
    icon: Shield,
    colorClasses: {
      bg: "bg-purple-100",
      icon: "text-purple-600",
      button: "bg-purple-600",
      buttonHover: "hover:bg-purple-700",
    },
    features: [
      "Access all features",
      "Manage users and roles",
      "View all analytics",
      "System configuration",
    ],
  },
  {
    id: "Buyer",
    label: "Buyer",
    description: "Browse products and shop",
    icon: ShoppingBag,
    colorClasses: {
      bg: "bg-blue-100",
      icon: "text-blue-600",
      button: "bg-blue-600",
      buttonHover: "hover:bg-blue-700",
    },
    features: [
      "Browse all available products",
      "View product details",
      "Add items to your cart",
      "Manage cart quantities",
    ],
  },
  {
    id: "Seller",
    label: "Seller",
    description: "Manage your product listings",
    icon: Store,
    colorClasses: {
      bg: "bg-green-100",
      icon: "text-green-600",
      button: "bg-green-600",
      buttonHover: "hover:bg-green-700",
    },
    features: [
      "View your product catalog",
      "Add new products",
      "Edit product details",
      "Manage inventory quantities",
    ],
  },
  {
    id: "InventoryManager",
    label: "Inventory Manager",
    description: "Track restocking workflow",
    icon: Package,
    colorClasses: {
      bg: "bg-orange-100",
      icon: "text-orange-600",
      button: "bg-orange-600",
      buttonHover: "hover:bg-orange-700",
    },
    features: [
      "Monitor low-stock products",
      "Create restocking tasks",
      "Track order fulfillment",
      "Update inventory levels",
    ],
  },
  {
    id: "WarehouseStaff",
    label: "Warehouse Staff",
    description: "Manage warehouse operations",
    icon: Warehouse,
    colorClasses: {
      bg: "bg-amber-100",
      icon: "text-amber-600",
      button: "bg-amber-600",
      buttonHover: "hover:bg-amber-700",
    },
    features: [
      "Process incoming stock",
      "Update stock locations",
      "Fulfill restocking orders",
      "Report inventory issues",
    ],
  },
];

export function LoginPage({
  onLogin,
  currentRole,
  userName,
  isSettingRole,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col p-4">
      {/* Current Role Banner - Top Right */}
      {currentRole && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-4 py-2 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            <span className="font-medium">{userName}</span>
            {" · "}
            <span className="text-blue-600 font-semibold">{currentRole}</span>
          </span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              E-Commerce Demo
            </h1>
            <p className="text-gray-600 text-lg">
              Built with KF AI SDK - Choose your role to get started
            </p>
          </div>

          {/* Role Selection Cards - 5 columns on large screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isCurrentRole = currentRole === role.id;

              return (
                <Card
                  key={role.id}
                  className={`hover:shadow-lg transition-all cursor-pointer relative ${
                    isCurrentRole ? "ring-2 ring-blue-500 ring-offset-2" : ""
                  } ${isSettingRole ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => !isSettingRole && onLogin(role.id)}
                >
                  {isCurrentRole && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      Current
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div
                      className={`mx-auto w-12 h-12 ${role.colorClasses.bg} rounded-full flex items-center justify-center mb-3`}
                    >
                      <Icon className={`h-6 w-6 ${role.colorClasses.icon}`} />
                    </div>
                    <CardTitle className="text-lg">{role.label}</CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <ul className="text-xs text-gray-600 space-y-1 mb-4">
                      {role.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${role.colorClasses.button} ${role.colorClasses.buttonHover}`}
                      size="sm"
                      disabled={isSettingRole}
                      onClick={() => onLogin(role.id)}
                    >
                      {isSettingRole ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Icon className="h-4 w-4 mr-2" />
                      )}
                      {isCurrentRole ? "Continue" : `Login as ${role.label}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>
              This demo showcases role-based access control with the KF AI SDK.
            </p>
            <p className="mt-1">
              You can switch roles anytime using the navigation bar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
