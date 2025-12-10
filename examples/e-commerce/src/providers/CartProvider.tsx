import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { api, getApiBaseUrl, getDefaultHeaders } from "kf-ai-sdk";
import { useRole } from "./RoleProvider";

interface CartItem {
  _id: string;
  productId: string;
  productName: string;
  productPrice: { value: number; currency: string };
  productImage: string;
  quantity: number;
  subtotal: { value: number; currency: string };
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  addToCart: (product: {
    _id: string;
    name: string;
    price: { value: number; currency: string };
    imageUrl: string;
  }, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isBuyer, currentRole } = useRole();

  // Calculate derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.subtotal.value, 0);

  // Fetch cart items from API
  const refreshCart = useCallback(async () => {
     if (!isBuyer) {
      setItems([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api("cart").list({});
      if (response.Data) {
        setItems(response.Data as CartItem[]);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setError("Failed to load cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isBuyer]);

  // Refresh cart when role changes to buyer
  useEffect(() => {
    if (isBuyer) {
      refreshCart();
    } else {
      setItems([]);
    }
  }, [currentRole, isBuyer, refreshCart]);

  const addToCart = async (
    product: {
      _id: string;
      name: string;
      price: { value: number; currency: string };
      imageUrl: string;
    },
    quantity = 1
  ) => {
    if (!isBuyer) return;

    try {
      await api("cart").create({
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.imageUrl,
        quantity,
      });
      await refreshCart();
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setError("Failed to add item to cart.");
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!isBuyer) return;

    try {
      await api("cart").delete(itemId);
      await refreshCart();
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      setError("Failed to remove item from cart.");
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!isBuyer) return;

    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
      } else {
        await api("cart").update(itemId, { quantity });
        await refreshCart();
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
      setError("Failed to update item quantity.");
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isBuyer) return;

    try {
      // Call clear endpoint
      await fetch(`${getApiBaseUrl()}/cart/clear`, {
        method: "POST",
        headers: getDefaultHeaders(),
      });
      setItems([]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  };

  const value: CartContextType = {
    items,
    itemCount,
    total,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
