import { ShoppingBag, Store } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

interface LoginPageProps {
  onLogin: (role: "Buyer" | "Seller") => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {

  const handleLogin = (role: "Buyer" | "Seller") => {
    onLogin(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            E-Commerce Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Built with KF AI SDK - Choose your role to get started
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Buyer Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleLogin("Buyer")}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Login as Buyer</CardTitle>
              <CardDescription>
                Browse products and shop
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>Browse all available products</li>
                <li>View product details</li>
                <li>Add items to your cart</li>
                <li>Manage cart quantities</li>
              </ul>
              <Button className="w-full" size="lg">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Continue as Buyer
              </Button>
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleLogin("Seller")}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Login as Seller</CardTitle>
              <CardDescription>
                Manage your product listings
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>View your product catalog</li>
                <li>Add new products</li>
                <li>Edit product details</li>
                <li>Manage inventory quantities</li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                <Store className="h-5 w-5 mr-2" />
                Continue as Seller
              </Button>
            </CardContent>
          </Card>
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
  );
}
