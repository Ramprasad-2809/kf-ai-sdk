import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  Button,
  IconButton,
  ActivityIndicator,
  Chip,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { ProductMaster, Cart } from "../../../../../app";
import { Roles } from "../../../../../app/types/roles";
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from "../../../constants/theme";
import { formatCurrency, getDeliveryDate } from "../../../utils/formatting";
import { Product } from "../../../types";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const productApi = new ProductMaster(Roles.Buyer);
  const cart = new Cart(Roles.Buyer);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      const data = await productApi.get(id);
      return data as unknown as Product;
    },
    enabled: !!id,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ product, qty }: { product: Product; qty: number }) => {
      const payload = {
        productId: product._id,
        productName: product.Title,
        productPrice: { value: product.Price, currency: "USD" },
        productImage: product.ImageUrl || "",
        quantity: qty,
      };
      return cart.create(payload);
    },
    onSuccess: (_data, { product, qty }) => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      Toast.show({
        type: "success",
        text1: "Added to Cart",
        text2: `${qty} x ${product.Title} added to your cart`,
        position: "bottom",
        visibilityTime: 2000,
      });
    },
    onError: (error) => {
      console.error("Failed to add to cart:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add item to cart",
        position: "bottom",
      });
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    addToCartMutation.mutate({ product, qty: quantity });
  };

  const incrementQuantity = () => {
    if (product && quantity < product.Stock) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(buyer)/products");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={64}
          color={colors.error}
        />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorSubtitle}>
          {error instanceof Error
            ? error.message
            : "Failed to load product details"}
        </Text>
        <Button
          mode="contained"
          onPress={handleGoBack}
          style={styles.backButton}
        >
          Back to Products
        </Button>
      </View>
    );
  }

  // Not found state
  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="package-variant-remove"
          size={64}
          color={colors.gray300}
        />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The product you're looking for doesn't exist.
        </Text>
        <Button
          mode="contained"
          onPress={handleGoBack}
          style={styles.backButton}
        >
          Back to Products
        </Button>
      </View>
    );
  }

  const isInStock = product.Stock > 0;
  const deliveryDate = getDeliveryDate();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Button */}
      <Pressable onPress={handleGoBack} style={styles.backLink}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.backLinkText}>Back to Products</Text>
      </Pressable>

      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              product.ImageUrl ||
              "https://via.placeholder.com/600x600?text=No+Image",
          }}
          style={styles.image}
          contentFit="contain"
          transition={200}
          cachePolicy="disk"
        />
        {!isInStock && (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        {/* Category */}
        <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
          {product.Category}
        </Chip>

        {/* Title */}
        <Text style={styles.title}>{product.Title}</Text>

        {/* Price */}
        <Text style={styles.price}>{formatCurrency(product.Price)}</Text>

        {/* Stock Status */}
        <View style={styles.stockContainer}>
          {isInStock ? (
            <>
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>In Stock</Text>
              </View>
              <Text style={styles.stockCount}>{product.Stock} available</Text>
            </>
          ) : (
            <View style={[styles.stockBadge, styles.outOfStockBadgeSmall]}>
              <Text style={styles.stockBadgeTextOut}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Delivery */}
        {isInStock && (
          <View style={styles.deliveryContainer}>
            <MaterialCommunityIcons
              name="truck-delivery"
              size={20}
              color={colors.success}
            />
            <Text style={styles.deliveryText}>
              FREE delivery by{" "}
              <Text style={styles.deliveryDate}>{deliveryDate}</Text>
            </Text>
          </View>
        )}

        {/* Description */}
        {product.Description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.Description}</Text>
          </View>
        )}

        {/* Brand */}
        {product.Brand && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Brand:</Text>
            <Text style={styles.detailValue}>{product.Brand}</Text>
          </View>
        )}

        {/* Warehouse */}
        {product.Warehouse && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ships from:</Text>
            <Text style={styles.detailValue}>{product.Warehouse}</Text>
          </View>
        )}
      </View>

      {/* Add to Cart Section */}
      {isInStock && (
        <View style={styles.cartSection}>
          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <IconButton
                icon="minus"
                mode="outlined"
                size={20}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
                style={styles.quantityButton}
              />
              <Text style={styles.quantityValue}>{quantity}</Text>
              <IconButton
                icon="plus"
                mode="outlined"
                size={20}
                onPress={incrementQuantity}
                disabled={quantity >= product.Stock}
                style={styles.quantityButton}
              />
            </View>
          </View>

          {/* Subtotal */}
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalLabel}>Subtotal:</Text>
            <Text style={styles.subtotalValue}>
              {formatCurrency(product.Price * quantity)}
            </Text>
          </View>

          {/* Add to Cart Button */}
          <Button
            mode="contained"
            onPress={handleAddToCart}
            loading={addToCartMutation.isPending}
            disabled={addToCartMutation.isPending}
            style={styles.addToCartButton}
            labelStyle={styles.addToCartButtonLabel}
            contentStyle={styles.addToCartButtonContent}
            icon={addedToCart ? "check" : "cart"}
          >
            {addedToCart ? "Added to Cart!" : "Add to Cart"}
          </Button>
        </View>
      )}

      {/* Out of stock message */}
      {!isInStock && (
        <View style={styles.unavailableSection}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={colors.gray500}
          />
          <Text style={styles.unavailableText}>
            This item is currently unavailable. Check back later or browse
            similar products.
          </Text>
          <Button mode="outlined" onPress={handleGoBack}>
            Browse Products
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
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
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.xs,
  },
  backLinkText: {
    ...typography.body,
    color: colors.primary,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: colors.gray50,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  outOfStockText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
  infoContainer: {
    padding: spacing.md,
  },
  categoryChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.gray100,
    marginBottom: spacing.sm,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.gray700,
    textTransform: "capitalize",
  },
  title: {
    ...typography.h2,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stockBadge: {
    backgroundColor: colors.success + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  stockBadgeText: {
    color: colors.success,
    fontWeight: "600",
    fontSize: 12,
  },
  outOfStockBadgeSmall: {
    backgroundColor: colors.error + "20",
  },
  stockBadgeTextOut: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 12,
  },
  stockCount: {
    ...typography.bodySmall,
    color: colors.gray500,
  },
  deliveryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.success + "10",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  deliveryText: {
    ...typography.body,
    color: colors.gray700,
  },
  deliveryDate: {
    fontWeight: "700",
    color: colors.gray900,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.gray700,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    color: colors.gray500,
    width: 100,
  },
  detailValue: {
    ...typography.body,
    color: colors.gray900,
    fontWeight: "500",
    flex: 1,
  },
  cartSection: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  quantityContainer: {
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  quantityButton: {
    margin: 0,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.gray900,
    minWidth: 40,
    textAlign: "center",
  },
  subtotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginBottom: spacing.lg,
  },
  subtotalLabel: {
    ...typography.body,
    color: colors.gray500,
  },
  subtotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.gray900,
  },
  addToCartButton: {
    backgroundColor: colors.yellow400,
    borderRadius: borderRadius.md,
  },
  addToCartButtonLabel: {
    color: colors.slate900,
    fontWeight: "700",
    fontSize: 16,
  },
  addToCartButtonContent: {
    height: 52,
  },
  unavailableSection: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  unavailableText: {
    ...typography.body,
    color: colors.gray500,
    textAlign: "center",
  },
});
