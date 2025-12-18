import { Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AmazonProductForRole, Roles } from "../../../../app";

type BuyerProduct = AmazonProductForRole<typeof Roles.Buyer> & {
  _id: string;
  // Legacy compatibility fields
  name: string;
  price: { value: number; currency: string };
  description: string;
  category: string;
  availableQuantity: number;
  imageUrl: string;
  sellerName?: string;
};

interface ProductCardProps {
  product: BuyerProduct;
  onAddToCart?: (product: BuyerProduct) => void;
  onClick?: (product: BuyerProduct) => void;
  showAddToCart?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onClick,
  showAddToCart = true,
}: ProductCardProps) {
  const isInStock = product.availableQuantity > 0;

  // Split price for display
  const priceParts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.price.currency,
  })
    .formatToParts(product.price.value)
    .reduce(
      (acc, part) => {
        acc[part.type] = part.value;
        return acc;
      },
      {} as Record<string, string>
    );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart && isInStock) {
      onAddToCart(product);
    }
  };

  return (
    <Card
      className={`h-full flex flex-col overflow-hidden border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 group ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={() => onClick?.(product)}
    >
      {/* Product Image */}
      <div className="aspect-square bg-white relative overflow-hidden p-4 flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`max-h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105 ${
            !isInStock ? "opacity-50 grayscale" : ""
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/400x400?text=No+Image";
          }}
        />
        {!isInStock && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="destructive"
              className="uppercase text-[10px] tracking-wider px-2 py-1"
            >
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Category & Verified */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            {product.category}
          </span>
          {/* Mock Rating */}
          <div className="flex text-yellow-400">
            <Star className="h-3 w-3 fill-current" />
            <Star className="h-3 w-3 fill-current" />
            <Star className="h-3 w-3 fill-current" />
            <Star className="h-3 w-3 fill-current" />
            <Star className="h-3 w-3 text-slate-200 fill-current" />
            <span className="text-xs text-slate-400 ml-1">(42)</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-medium text-base text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-auto pt-2 flex items-baseline gap-1">
          <span className="text-xs font-bold self-start mt-1">
            {priceParts.currency}
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {priceParts.integer}
          </span>
          <span className="text-xs font-bold self-start mt-1">
            {priceParts.fraction}
          </span>

          {/* Mock Prime badge or similar trust signal */}
          <span className="ml-2 text-xs text-blue-600 font-bold italic tracking-tighter">
            Prime
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-1">
          Delivery by{" "}
          <span className="font-bold text-slate-700">Tue, Dec 12</span>
        </p>
      </CardContent>

      {showAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button
            className={`w-full font-medium ${
              isInStock
                ? "bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-yellow-500"
                : ""
            }`}
            size="sm"
            onClick={handleAddToCart}
            disabled={!isInStock}
          >
            {isInStock ? (
              <span className="flex items-center gap-2">Add to Cart</span>
            ) : (
              "Currently Unavailable"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
