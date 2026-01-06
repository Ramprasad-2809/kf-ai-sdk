import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Cart } from '../../../../app/sources/ecommerce/cart';
import { Roles } from '../../../../app/types/roles';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatting';
import { CartItem } from '../../types';

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cart = new Cart(Roles.Buyer);

  // Fetch cart items
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cart-items'],
    queryFn: async () => {
      const res = await cart.list();
      return (res.Data || []) as CartItem[];
    },
  });

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => {
    const price = typeof item.productPrice === 'object'
      ? item.productPrice.value
      : item.productPrice;
    return sum + (price * item.quantity);
  }, 0);

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return cart.update(itemId, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update quantity',
        position: 'bottom',
      });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return cart.delete(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      Toast.show({
        type: 'success',
        text1: 'Removed',
        text2: 'Item removed from cart',
        position: 'bottom',
        visibilityTime: 2000,
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item',
        position: 'bottom',
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async (currentItems: CartItem[]) => {
      const promises = currentItems.map((item) => cart.delete(item._id));
      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      Toast.show({
        type: 'success',
        text1: 'Cart Cleared',
        text2: 'All items have been removed',
        position: 'bottom',
        visibilityTime: 2000,
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to clear cart',
        position: 'bottom',
      });
    },
  });

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItemMutation.mutate(itemId);
    } else {
      updateQuantityMutation.mutate({ itemId, quantity });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  const handleClearCart = () => {
    if (items.length > 0) {
      clearCartMutation.mutate(items);
    }
  };

  const handleContinueShopping = () => {
    router.push('/(buyer)/products');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const price = typeof item.productPrice === 'object'
      ? item.productPrice.value
      : item.productPrice;
    const subtotal = price * item.quantity;

    return (
      <View style={styles.cartItem}>
        {/* Product Image */}
        <View style={styles.itemImageContainer}>
          <Image
            source={{ uri: item.productImage || 'https://via.placeholder.com/100x100?text=No+Image' }}
            style={styles.itemImage}
            contentFit="cover"
            cachePolicy="disk"
          />
        </View>

        {/* Product Info */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.itemPrice}>
            {formatCurrency(price)} each
          </Text>

          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <IconButton
              icon="minus"
              mode="outlined"
              size={16}
              onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}
              style={styles.quantityButton}
            />
            <Text style={styles.quantityValue}>{item.quantity}</Text>
            <IconButton
              icon="plus"
              mode="outlined"
              size={16}
              onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}
              style={styles.quantityButton}
            />
            <IconButton
              icon="delete-outline"
              iconColor={colors.error}
              size={20}
              onPress={() => handleRemoveItem(item._id)}
              style={styles.deleteButton}
            />
          </View>
        </View>

        {/* Subtotal */}
        <View style={styles.itemSubtotal}>
          <Text style={styles.subtotalText}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorSubtitle}>Failed to load your cart</Text>
        <Button mode="contained" onPress={() => refetch()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconContainer}>
          <MaterialCommunityIcons name="cart-outline" size={48} color={colors.gray300} />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Looks like you haven't added any items to your cart yet.
        </Text>
        <Button
          mode="contained"
          onPress={handleContinueShopping}
          icon="shopping"
          style={styles.shopButton}
        >
          Start Shopping
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Shopping Cart</Text>
              <Text style={styles.headerSubtitle}>{itemCount} items</Text>
            </View>
            <Button
              mode="outlined"
              onPress={handleClearCart}
              loading={clearCartMutation.isPending}
              icon="delete-outline"
              textColor={colors.error}
              style={styles.clearButton}
            >
              Clear
            </Button>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            {/* Continue Shopping */}
            <Pressable onPress={handleContinueShopping} style={styles.continueLink}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
              <Text style={styles.continueLinkText}>Continue Shopping</Text>
            </Pressable>

            {/* Order Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.freeShipping}>Free</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
              </View>

              <Button
                mode="contained"
                disabled
                style={styles.checkoutButton}
                contentStyle={styles.checkoutButtonContent}
                labelStyle={styles.checkoutButtonLabel}
              >
                Checkout (Coming Soon)
              </Button>

              <Text style={styles.checkoutNote}>
                Checkout functionality is not implemented in this demo.
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingText: {
    ...typography.body,
    color: colors.gray500,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  shopButton: {
    backgroundColor: colors.primary,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.gray900,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.gray500,
  },
  clearButton: {
    borderColor: colors.error,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    ...typography.bodySmall,
    color: colors.gray500,
    marginBottom: spacing.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  quantityValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray900,
    minWidth: 32,
    textAlign: 'center',
  },
  deleteButton: {
    marginLeft: 'auto',
  },
  itemSubtotal: {
    justifyContent: 'flex-start',
    marginLeft: spacing.sm,
  },
  subtotalText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.gray900,
  },
  footer: {
    padding: spacing.md,
  },
  continueLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  continueLinkText: {
    ...typography.body,
    color: colors.primary,
  },
  summary: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.gray900,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.gray500,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '500',
    color: colors.gray900,
  },
  freeShipping: {
    ...typography.body,
    fontWeight: '500',
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.gray900,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.gray300,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  checkoutButtonContent: {
    height: 52,
  },
  checkoutButtonLabel: {
    fontSize: 16,
  },
  checkoutNote: {
    ...typography.caption,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
