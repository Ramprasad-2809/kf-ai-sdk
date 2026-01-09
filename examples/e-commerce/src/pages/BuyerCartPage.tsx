import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cart, CartForRole } from "../../../../app/sources/ecommerce/cart";
import { Roles } from "../../../../app/types/roles";
import { CurrencyField } from "../../../../sdk/types/base-fields";

type BuyerCart = CartForRole<typeof Roles.Buyer>;

export function BuyerCartPage() {
  const queryClient = useQueryClient();
  const cart = new Cart(Roles.Buyer);

  // Fetch Cart Items
  const {
    data: items = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["cart-items"],
    queryFn: async () => {
      const res = await cart.list();
      // Assuming list returns { Data: [...] } or array, SDK usually returns Response object
      // Checking app/sources/ecommerce/cart.ts, list returns Promise<ListResponse<CartForRole<TRole>>> which has Data property
      return (res.Data || []) as BuyerCart[];
    },
  });

  const error = queryError ? "Failed to load cart." : null;

  // Derive totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce(
    (sum, item) =>
      sum + (item.subtotal as { value: number; currency: string }).value,
    0
  );
  const total = { value: totalValue, currency: "USD" };

  // Update Quantity Mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      return cart.update(itemId, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: (error) => {
      toast.error("Failed to update quantity", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });

  // Remove Item Mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return cart.delete(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Item removed from cart");
    },
    onError: (error) => {
      toast.error("Failed to remove item", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });

  // Clear Cart Mutation (Loop Delete)
  const clearCartMutation = useMutation({
    mutationFn: async (currentItems: BuyerCart[]) => {
      const promises = currentItems.map((item) => cart.delete(item._id));
      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Cart cleared successfully");
    },
    onError: (error) => {
      toast.error("Failed to clear cart", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    },
  });

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity });
  };

  const removeFromCart = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  const clearCart = () => {
    // Pass current items to mutation to delete them
    if (items.length > 0) {
      clearCartMutation.mutate(items);
    }
  };

  const formatPrice = (
    price: CurrencyField | { value: number; currency: string }
  ) => {
    const currencyObj = price as { value: number; currency: string };
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyObj.currency,
    }).format(currencyObj.value);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded w-40" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-6 bg-gray-200 rounded w-full" />
              <div className="h-12 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <ShoppingBag className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Your Cart is Empty
        </h2>
        <p className="text-gray-500 mb-6">
          Looks like you haven't added any items to your cart yet.
        </p>
        <Link to="/products">
          <Button>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500">{itemCount} items</p>
        </div>
        <Button variant="outline" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Cart
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/100x100?text=No+Image";
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.productName}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {formatPrice(item.productPrice)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => removeFromCart(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Continue Shopping Link */}
          <Link
            to="/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Subtotal ({itemCount} items)
                </span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>

              {/* Divider */}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Checkout Button (Placeholder) */}
              <Button className="w-full" size="lg" disabled>
                Checkout (Coming Soon)
              </Button>

              <p className="text-xs text-center text-gray-500">
                Checkout functionality is not implemented in this demo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
