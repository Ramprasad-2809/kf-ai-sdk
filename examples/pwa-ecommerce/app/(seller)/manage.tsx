import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Button,
  Searchbar,
  IconButton,
  ActivityIndicator,
  Portal,
  Modal,
  TextInput,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTable, api } from 'kf-ai-sdk';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { categories, warehouses } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatting';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';

type FormMode = 'create' | 'update';

export default function SellerManageScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form field states
  const [formData, setFormData] = useState({
    Title: '',
    Description: '',
    Category: 'Electronics',
    Brand: '',
    Price: '',
    MRP: '',
    Stock: '',
    Warehouse: 'WH_US_EAST',
    ReorderLevel: '10',
  });

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
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: 'Title', direction: 'asc' },
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    table.search.setQuery(query);
  };

  const handleCreate = () => {
    setFormMode('create');
    setSelectedProduct(null);
    setFormData({
      Title: '',
      Description: '',
      Category: 'Electronics',
      Brand: '',
      Price: '',
      MRP: '',
      Stock: '',
      Warehouse: 'WH_US_EAST',
      ReorderLevel: '10',
    });
    setGeneralError(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setFormMode('update');
    setSelectedProduct(product);
    setFormData({
      Title: product.Title || '',
      Description: product.Description || '',
      Category: product.Category || 'Electronics',
      Brand: product.Brand || '',
      Price: String(product.Price || ''),
      MRP: String(product.MRP || ''),
      Stock: String(product.Stock || ''),
      Warehouse: product.Warehouse || 'WH_US_EAST',
      ReorderLevel: String((product as any).ReorderLevel || '10'),
    });
    setGeneralError(null);
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    const confirmDelete = async () => {
      try {
        await api('BDO_AmazonProductMaster').delete(product._id);
        table.refetch();
        Toast.show({
          type: 'success',
          text1: 'Deleted',
          text2: 'Product has been deleted',
          position: 'bottom',
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to delete product',
          position: 'bottom',
        });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${product.Title}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Product',
        `Are you sure you want to delete "${product.Title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.Title.trim()) {
      setGeneralError('Product title is required');
      return;
    }
    if (!formData.Price || parseFloat(formData.Price) <= 0) {
      setGeneralError('Valid price is required');
      return;
    }
    if (!formData.Stock || parseInt(formData.Stock) < 0) {
      setGeneralError('Valid stock quantity is required');
      return;
    }

    const payload = {
      Title: formData.Title,
      Description: formData.Description,
      Category: formData.Category,
      Brand: formData.Brand,
      Price: parseFloat(formData.Price),
      MRP: parseFloat(formData.MRP) || parseFloat(formData.Price),
      Stock: parseInt(formData.Stock),
      Warehouse: formData.Warehouse,
      ReorderLevel: parseInt(formData.ReorderLevel) || 10,
      IsActive: true,
    };

    setIsSubmitting(true);
    try {
      if (formMode === 'create') {
        await api('BDO_AmazonProductMaster').create(payload);
        Toast.show({
          type: 'success',
          text1: 'Created',
          text2: 'Product has been added',
          position: 'bottom',
        });
      } else if (selectedProduct) {
        await api('BDO_AmazonProductMaster').update(selectedProduct._id, payload);
        Toast.show({
          type: 'success',
          text1: 'Updated',
          text2: 'Product has been updated',
          position: 'bottom',
        });
      }
      setShowForm(false);
      setGeneralError(null);
      table.refetch();
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const getStockBadgeStyle = (stock: number) => {
    if (stock > 10) return { bg: colors.success + '20', text: colors.success };
    if (stock > 0) return { bg: colors.warning + '20', text: colors.warning };
    return { bg: colors.error + '20', text: colors.error };
  };

  const renderProductRow = ({ item }: { item: Product }) => {
    const stockStyle = getStockBadgeStyle(item.Stock);

    return (
      <View style={styles.productRow}>
        {/* Product Image & Info */}
        <View style={styles.productInfo}>
          <View style={styles.productImageContainer}>
            <Image
              source={{ uri: item.ImageUrl || 'https://via.placeholder.com/40x40?text=?' }}
              style={styles.productImage}
              contentFit="cover"
              cachePolicy="disk"
            />
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {item.Title}
            </Text>
            <Text style={styles.productDescription} numberOfLines={1}>
              {item.Description || 'No description'}
            </Text>
          </View>
        </View>

        {/* Category */}
        <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
          {item.Category}
        </Chip>

        {/* Price */}
        <Text style={styles.priceText}>{formatCurrency(item.Price)}</Text>

        {/* Stock */}
        <View style={[styles.stockBadge, { backgroundColor: stockStyle.bg }]}>
          <Text style={[styles.stockText, { color: stockStyle.text }]}>
            {item.Stock}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => handleEdit(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor={colors.error}
            onPress={() => handleDelete(item)}
          />
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant" size={64} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No products yet</Text>
      <Text style={styles.emptySubtitle}>Add your first product to get started</Text>
      <Button mode="contained" onPress={handleCreate} icon="plus" style={styles.emptyButton}>
        Add Your First Product
      </Button>
    </View>
  );

  // Error state
  if (table.error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Error loading products</Text>
        <Text style={styles.errorSubtitle}>{table.error.message}</Text>
        <Button mode="contained" onPress={() => table.refetch()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Products</Text>
          <Text style={styles.headerSubtitle}>Manage your product listings</Text>
        </View>
        <View style={styles.headerActions}>
          <Button mode="contained" onPress={handleCreate} icon="plus" style={styles.addButton}>
            Add
          </Button>
          <IconButton
            icon="logout"
            size={24}
            onPress={handleLogout}
          />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search your products..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {/* Loading */}
      {table.isLoading && table.rows.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={table.rows}
          keyExtractor={(item) => item._id}
          renderItem={renderProductRow}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={table.isLoading}
              onRefresh={() => table.refetch()}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={() =>
            table.pagination.totalPages > 1 ? (
              <View style={styles.pagination}>
                <Text style={styles.paginationInfo}>
                  Page {table.pagination.currentPage} of {table.pagination.totalPages}
                </Text>
                <View style={styles.paginationButtons}>
                  <Button
                    mode="outlined"
                    onPress={table.pagination.goToPrevious}
                    disabled={!table.pagination.canGoPrevious}
                    compact
                  >
                    Previous
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={table.pagination.goToNext}
                    disabled={!table.pagination.canGoNext}
                    compact
                  >
                    Next
                  </Button>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Product Form Modal */}
      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {formMode === 'create' ? 'Add New Product' : 'Edit Product'}
            </Text>

            {generalError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            {/* Basic Information */}
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
              label="Product Title *"
              value={formData.Title}
              onChangeText={(text) => setFormData({ ...formData, Title: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Description"
              value={formData.Description}
              onChangeText={(text) => setFormData({ ...formData, Description: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Brand"
              value={formData.Brand}
              onChangeText={(text) => setFormData({ ...formData, Brand: text })}
              mode="outlined"
              style={styles.input}
            />

            {/* Category Selection */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipGroup}>
              {categories.map((cat) => (
                <Chip
                  key={cat.value}
                  selected={formData.Category === cat.value}
                  onPress={() => setFormData({ ...formData, Category: cat.value })}
                  style={[
                    styles.selectChip,
                    formData.Category === cat.value && styles.selectChipSelected,
                  ]}
                  textStyle={formData.Category === cat.value ? styles.selectChipTextSelected : undefined}
                  showSelectedCheck={false}
                >
                  {cat.label}
                </Chip>
              ))}
            </View>

            {/* Pricing */}
            <Text style={styles.sectionTitle}>Pricing</Text>

            <View style={styles.row}>
              <TextInput
                label="Price (USD) *"
                value={formData.Price}
                onChangeText={(text) => setFormData({ ...formData, Price: text })}
                mode="outlined"
                keyboardType="decimal-pad"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="MRP (USD)"
                value={formData.MRP}
                onChangeText={(text) => setFormData({ ...formData, MRP: text })}
                mode="outlined"
                keyboardType="decimal-pad"
                style={[styles.input, styles.halfInput]}
              />
            </View>

            {/* Inventory */}
            <Text style={styles.sectionTitle}>Inventory</Text>

            <View style={styles.row}>
              <TextInput
                label="Stock *"
                value={formData.Stock}
                onChangeText={(text) => setFormData({ ...formData, Stock: text })}
                mode="outlined"
                keyboardType="number-pad"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Reorder Level"
                value={formData.ReorderLevel}
                onChangeText={(text) => setFormData({ ...formData, ReorderLevel: text })}
                mode="outlined"
                keyboardType="number-pad"
                style={[styles.input, styles.halfInput]}
              />
            </View>

            {/* Warehouse Selection */}
            <Text style={styles.fieldLabel}>Warehouse</Text>
            <View style={styles.chipGroup}>
              {warehouses.map((wh) => (
                <Chip
                  key={wh.value}
                  selected={formData.Warehouse === wh.value}
                  onPress={() => setFormData({ ...formData, Warehouse: wh.value })}
                  style={[
                    styles.selectChip,
                    formData.Warehouse === wh.value && styles.selectChipSelected,
                  ]}
                  textStyle={formData.Warehouse === wh.value ? styles.selectChipTextSelected : undefined}
                  showSelectedCheck={false}
                >
                  {wh.label}
                </Chip>
              ))}
            </View>

            {/* Form Actions */}
            <View style={styles.formActions}>
              <Button
                mode="outlined"
                onPress={() => setShowForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.submitButton}
              >
                {formMode === 'create' ? 'Add Product' : 'Save Changes'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  searchBar: {
    backgroundColor: colors.gray100,
    elevation: 0,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: spacing.sm,
  },
  productInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImageContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.gray900,
  },
  productDescription: {
    ...typography.caption,
    color: colors.gray500,
  },
  categoryChip: {
    backgroundColor: colors.gray100,
  },
  categoryChipText: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
  priceText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.gray900,
    minWidth: 60,
  },
  stockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
  },
  stockText: {
    ...typography.caption,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
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
    backgroundColor: colors.primary,
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
  loadingText: {
    ...typography.body,
    color: colors.gray500,
    marginTop: spacing.md,
  },
  pagination: {
    padding: spacing.md,
    alignItems: 'center',
  },
  paginationInfo: {
    ...typography.bodySmall,
    color: colors.gray500,
    marginBottom: spacing.sm,
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalContent: {
    backgroundColor: colors.background,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.gray900,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.gray900,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectChip: {
    backgroundColor: colors.gray100,
  },
  selectChipSelected: {
    backgroundColor: colors.primary,
  },
  selectChipTextSelected: {
    color: colors.background,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  cancelButton: {
    borderColor: colors.gray300,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
});
