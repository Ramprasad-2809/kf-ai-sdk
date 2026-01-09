import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Button, ActivityIndicator } from 'react-native-paper';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import { formatCurrencyParts, getDeliveryDate } from '../utils/formatting';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  isAddingToCart?: boolean;
}

export function ProductCard({ product, onPress, onAddToCart, isAddingToCart }: ProductCardProps) {
  const isInStock = product.Stock > 0;
  const priceParts = formatCurrencyParts(product.Price);
  const deliveryDate = getDeliveryDate();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.ImageUrl || 'https://via.placeholder.com/400x400?text=No+Image' }}
          style={[styles.image, !isInStock && styles.imageOutOfStock]}
          contentFit="contain"
          transition={200}
          cachePolicy="disk"
        />
        {!isInStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.content}>
        {/* Category */}
        <Text style={styles.category}>{product.Category}</Text>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.Title}
        </Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.currencySymbol}>{priceParts.currency}</Text>
          <Text style={styles.priceWhole}>{priceParts.whole}</Text>
          <Text style={styles.priceFraction}>{priceParts.fraction}</Text>
        </View>

        {/* Delivery */}
        <Text style={styles.delivery}>
          Delivery by <Text style={styles.deliveryDate}>{deliveryDate}</Text>
        </Text>

        {/* Stock indicator */}
        {isInStock && product.Stock < 10 && (
          <Text style={styles.lowStock}>Only {product.Stock} left in stock</Text>
        )}
      </View>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={(e) => {
            e.stopPropagation?.();
            if (isInStock) onAddToCart();
          }}
          disabled={!isInStock || isAddingToCart}
          loading={isAddingToCart}
          style={[
            styles.addButton,
            isInStock ? styles.addButtonActive : styles.addButtonDisabled,
          ]}
          labelStyle={[
            styles.addButtonLabel,
            isInStock && styles.addButtonLabelActive,
          ]}
          contentStyle={styles.addButtonContent}
        >
          {isInStock ? 'Add to Cart' : 'Unavailable'}
        </Button>
      </View>

      {/* Loading overlay */}
      {isAddingToCart && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    margin: spacing.xs,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
      default: {},
    }),
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOutOfStock: {
    opacity: 0.5,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  outOfStockText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: spacing.md,
    flex: 1,
  },
  category: {
    ...typography.caption,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.gray900,
    marginBottom: spacing.sm,
    minHeight: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  currencySymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray900,
    marginTop: 2,
  },
  priceWhole: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray900,
  },
  priceFraction: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray900,
    marginTop: 2,
  },
  delivery: {
    ...typography.caption,
    color: colors.gray500,
  },
  deliveryDate: {
    fontWeight: '700',
    color: colors.gray700,
  },
  lowStock: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  addButton: {
    borderRadius: borderRadius.md,
  },
  addButtonActive: {
    backgroundColor: colors.yellow400,
  },
  addButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  addButtonContent: {
    height: 40,
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButtonLabelActive: {
    color: colors.slate900,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
