import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cart,
  AmazonProductMaster,
  AmazonProductForRole,
} from "../../../../app";
import { Roles } from "../../../../app/types/roles";

type Product = AmazonProductForRole<typeof Roles.Buyer> & {
  _id: string;
  // Legacy compatibility fields
  name: string;
  price: { value: number; currency: string };
  description: string;
  category: string;
  availableQuantity: number;
  imageUrl: string;
  sellerName: string;
};

export function BuyerProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const product = new AmazonProductMaster(Roles.Buyer);
  const cart = new Cart(Roles.Buyer);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const {
    data: productData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      const data = await product.get(id);
      return data as unknown as Product;
    },
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ product, qty }: { product: Product; qty: number }) => {
      const payload = {
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.imageUrl,
        quantity: qty,
      };
      return cart.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      setCartError(null);
    },
    onError: (error) => {
      console.error("Failed to add to cart:", error);
      setCartError("Failed to add item to cart.");
    },
  });

  const formatPrice = (price: { value: number; currency: string }) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency,
    }).format(price.value);
  };

  const handleAddToCart = () => {
    if (!productData) return;
    addToCartMutation.mutate({ product: productData, qty: quantity });
  };

  const incrementQuantity = () => {
    if (productData && quantity < productData.availableQuantity) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-gray-500 mb-4">
          {error instanceof Error
            ? error.message
            : "Failed to load product details. Please try again later."}
        </p>
        <Button onClick={() => navigate("/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Product Not Found
        </h2>
        <p className="text-gray-500 mb-4">
          The product you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  const isInStock = productData.availableQuantity > 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <Card className="overflow-hidden">
          <div className="aspect-square bg-gray-100 relative">
            <img
              src={productData.imageUrl}
              alt={productData.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/600x600?text=No+Image";
              }}
            />
            {!isInStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Category */}
          <Badge variant="secondary" className="capitalize">
            {productData.category}
          </Badge>

          {/* Name */}
          <h1 className="text-3xl font-bold text-gray-900">
            {productData.name}
          </h1>

          {/* Price */}
          <div className="text-3xl font-bold text-blue-600">
            {formatPrice(productData.price)}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {isInStock ? (
              <>
                <Badge variant="success">In Stock</Badge>
                <span className="text-gray-500">
                  {productData.availableQuantity} available
                </span>
              </>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {productData.description}
            </p>
          </div>

          {/* Seller */}
          <div className="text-sm text-gray-500">
            Sold by:{" "}
            <span className="font-medium">{productData.sellerName}</span>
          </div>

          {/* Quantity Selector and Add to Cart */}
          {isInStock && (
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-semibold w-12 text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= productData.availableQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center py-2 border-t">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-xl font-bold">
                    {formatPrice({
                      value: productData.price.value * quantity,
                      currency: productData.price.currency,
                    })}
                  </span>
                </div>

                {/* Add to Cart Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                >
                  {addToCartMutation.isPending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : addedToCart ? (
                    <>Added to Cart!</>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
                {cartError && (
                  <p className="text-sm text-red-600 text-center mt-2">
                    {cartError}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
