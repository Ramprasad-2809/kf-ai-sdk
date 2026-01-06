import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Searchbar, Button, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useTable } from 'kf-ai-sdk';
import { Cart } from '../../../../../app';
import { Roles } from '../../../../../app/types/roles';
import { ProductCard } from '../../../components/ProductCard';
import { categories } from '../../../constants/categories';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Product } from '../../../types';

export default function ProductListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cart = new Cart(Roles.Buyer);

  // Calculate number of columns based on screen width
  const numColumns = width > 1200 ? 4 : width > 900 ? 3 : width > 600 ? 2 : 2;

  // Initialize table with SDK
  const table = useTable<Product>({
    source: 'BDO_AmazonProductMaster',
    columns: [
      { fieldId: 'Title', label: 'Name', enableSorting: true },
      { fieldId: 'Price', label: 'Price', enableSorting: true },
      { fieldId: 'Category', label: 'Category', enableSorting: true },
      { fieldId: 'Stock', label: 'Stock', enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 12 },
      sorting: { field: 'Title', direction: 'asc' },
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (product: Product) => {
      const payload = {
        productId: product._id,
        productName: product.Title,
        productPrice: { value: product.Price, currency: 'USD' },
        productImage: product.ImageUrl || '',
        quantity: 1,
      };
      return cart.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: 'Item has been added to your cart',
        position: 'bottom',
        visibilityTime: 2000,
      });
    },
    onError: (error) => {
      console.error('Failed to add to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to cart',
        position: 'bottom',
      });
    },
  });

  const handleAddToCart = async (product: Product) => {
    setAddingToCartId(product._id);
    try {
      await addToCartMutation.mutateAsync(product);
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/(buyer)/products/${product._id}`);
  };

  const handleCategoryChange = (value: string) => {
    const newValue = selectedCategory === value ? 'all' : value;
    setSelectedCategory(newValue);

    table.filter.clearConditions();
    if (newValue !== 'all') {
      table.filter.addCondition({
        lhsField: 'Category',
        operator: 'EQ',
        rhsValue: newValue,
        rhsType: 'Constant',
      });
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    table.search.setQuery(query);
  }, [table.search]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    table.search.clear();
    table.filter.clearConditions();
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={{ flex: 1 / numColumns, maxWidth: `${100 / numColumns}%` }}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
        onAddToCart={() => handleAddToCart(item)}
        isAddingToCart={addingToCartId === item._id}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search products..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor={colors.gray500}
      />

      {/* Category Filters */}
      <FlatList
        horizontal
        data={[{ value: 'all', label: 'All' }, ...categories]}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <Chip
            selected={selectedCategory === item.value}
            onPress={() => handleCategoryChange(item.value)}
            style={[
              styles.categoryChip,
              selectedCategory === item.value && styles.categoryChipSelected,
            ]}
            textStyle={[
              styles.categoryChipText,
              selectedCategory === item.value && styles.categoryChipTextSelected,
            ]}
            showSelectedCheck={false}
          >
            {item.label}
          </Chip>
        )}
      />

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {table.totalItems} {table.totalItems === 1 ? 'product' : 'products'} found
        </Text>
        {(selectedCategory !== 'all' || searchQuery) && (
          <Pressable onPress={handleClearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear filters</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or category filters
      </Text>
      <Button
        mode="outlined"
        onPress={handleClearFilters}
        style={styles.emptyButton}
      >
        Clear All Filters
      </Button>
    </View>
  );

  const renderFooter = () => {
    if (table.isLoading && table.rows.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (table.pagination.totalPages > 1) {
      return (
        <View style={styles.pagination}>
          <Button
            mode="outlined"
            onPress={table.pagination.goToPrevious}
            disabled={!table.pagination.canGoPrevious}
            style={styles.paginationButton}
            compact
          >
            Previous
          </Button>
          <Text style={styles.paginationText}>
            Page {table.pagination.currentPage} of {table.pagination.totalPages}
          </Text>
          <Button
            mode="outlined"
            onPress={table.pagination.goToNext}
            disabled={!table.pagination.canGoNext}
            style={styles.paginationButton}
            compact
          >
            Next
          </Button>
        </View>
      );
    }

    return null;
  };

  // Error state
  if (table.error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>{table.error.message}</Text>
        <Button mode="contained" onPress={() => table.refetch()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  // Loading state (initial load)
  if (table.isLoading && table.rows.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.skeleton, { width: `${100 / numColumns - 2}%` }]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={table.rows}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={numColumns}
        key={numColumns} // Force re-render when columns change
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        refreshControl={
          <RefreshControl
            refreshing={table.isLoading}
            onRefresh={() => table.refetch()}
            colors={[colors.primary]}
          />
        }
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
  header: {
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  searchBar: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    elevation: 0,
  },
  searchInput: {
    ...typography.body,
  },
  categoryList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    color: colors.gray700,
    ...typography.bodySmall,
  },
  categoryChipTextSelected: {
    color: colors.background,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  resultsText: {
    ...typography.bodySmall,
    color: colors.gray500,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    paddingHorizontal: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.gray900,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    borderColor: colors.gray300,
  },
  footerLoader: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  paginationButton: {
    minWidth: 100,
  },
  paginationText: {
    ...typography.bodySmall,
    color: colors.gray500,
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  skeleton: {
    aspectRatio: 0.7,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.lg,
    margin: spacing.xs,
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
});
