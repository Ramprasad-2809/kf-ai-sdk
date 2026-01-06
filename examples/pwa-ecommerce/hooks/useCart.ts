import { useQuery } from '@tanstack/react-query';
import { Cart } from '@app/sources/ecommerce/cart';
import { Roles } from '@app/types/roles';
import { useAuth } from './useAuth';

/**
 * Hook to get cart count
 * Refetches every 30 seconds to keep count up-to-date
 */
export function useCart() {
  const { role } = useAuth();

  const { data: cartCount = 0, refetch } = useQuery({
    queryKey: ['cart-count'],
    queryFn: async () => {
      if (role === 'Buyer') {
        const cart = new Cart(Roles.Buyer);
        return await cart.count();
      }
      return 0;
    },
    enabled: role === 'Buyer',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return { cartCount, refetch };
}
