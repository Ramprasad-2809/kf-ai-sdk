import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            404 - Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Oops! The page you're looking for doesn't exist.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate("/")}>Go Home</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
