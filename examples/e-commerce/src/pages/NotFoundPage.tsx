import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Page Not Found
      </h2>
      <p className="text-gray-500 mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/products">
        <Button>
          <Home className="h-4 w-4 mr-2" />
          Go to Products
        </Button>
      </Link>
    </div>
  );
}
