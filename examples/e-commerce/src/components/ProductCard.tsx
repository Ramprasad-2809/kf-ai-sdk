import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface Product {
  _id: string;
  name: string;
  price: { value: number; currency: string };
  description: string;
  category: string;
  availableQuantity: number;
  imageUrl: string;
  sellerName?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onClick?: (product: Product) => void;
  showAddToCart?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onClick,
  showAddToCart = true,
}: ProductCardProps) {
  const isInStock = product.availableQuantity > 0;

  const formatPrice = (price: { value: number; currency: string }) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency,
    }).format(price.value);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart && isInStock) {
      onAddToCart(product);
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-shadow hover:shadow-lg ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={() => onClick?.(product)}
    >
      {/* Product Image */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />
        {!isInStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Category Badge */}
        <Badge variant="secondary" className="mb-2 capitalize">
          {product.category}
        </Badge>

        {/* Product Name */}
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-2 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-gray-500">
            {isInStock ? `${product.availableQuantity} in stock` : "Out of stock"}
          </span>
        </div>

        {/* Seller Name */}
        {product.sellerName && (
          <p className="text-xs text-gray-400 mt-2">
            Sold by: {product.sellerName}
          </p>
        )}
      </CardContent>

      {showAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={!isInStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isInStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
