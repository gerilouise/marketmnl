// app/(seller)/products.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  "All",
  "Specials",
  "Spicy",
  "Seafood",
  "Meat",
  "Bottled",
  "Dried",
];

export default function SellerProductsScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // View Product Modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Fetch ONLY the logged-in user's products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setProducts([]);
        setFilteredProducts([]);
        setLoading(false);
        return;
      }

      const productsRef = collection(db, "products");
      const q = query(productsRef, where("sellerId", "==", user.uid));

      const querySnapshot = await getDocs(q);
      const productsList: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure categories is an array
        let categoriesArray = [];
        if (data.categories && Array.isArray(data.categories)) {
          categoriesArray = data.categories;
        } else if (data.category) {
          categoriesArray = [data.category];
        }

        productsList.push({
          id: doc.id,
          ...data,
          categories: categoriesArray,
        });
      });

      // Sort manually in JavaScript
      productsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      setProducts(productsList);

      // Apply filter - FIXED to check categories array
      if (selectedCategory === "All") {
        setFilteredProducts(productsList);
      } else {
        const filtered = productsList.filter(
          (product) =>
            product.categories && product.categories.includes(selectedCategory),
        );
        setFilteredProducts(filtered);
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Handle category change - FIXED
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "All") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.categories && product.categories.includes(category),
      );
      setFilteredProducts(filtered);
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setDeleteModalVisible(true);
  };

  // Perform the actual delete
  const confirmDelete = async () => {
    if (!productToDelete) return;

    const { id: productId, name: productName } = productToDelete;
    setDeleteModalVisible(false);
    setDeletingProductId(productId);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to delete products");
        setDeletingProductId(null);
        setProductToDelete(null);
        return;
      }

      const productRef = doc(db, "products", productId);
      await deleteDoc(productRef);

      // Remove from local state
      const updatedProducts = products.filter((p) => p.id !== productId);
      setProducts(updatedProducts);

      // Update filtered products based on current category
      if (selectedCategory === "All") {
        setFilteredProducts(updatedProducts);
      } else {
        const filtered = updatedProducts.filter(
          (product) =>
            product.categories && product.categories.includes(selectedCategory),
        );
        setFilteredProducts(filtered);
      }

      Alert.alert("Success", `"${productName}" has been deleted.`);
    } catch (error: any) {
      console.error("Delete error:", error);
      Alert.alert("Delete Failed", error.message || "Failed to delete product");
    } finally {
      setDeletingProductId(null);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  // View product details
  const viewProductDetails = (product: any) => {
    setSelectedProduct(product);
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setSelectedProduct(null);
  };

  // Edit product
  const handleEditProduct = (productId: string) => {
    router.push({
      pathname: "/(seller)/product-manage",
      params: { productId },
    });
  };

  // Fetch products when screen loads
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, []),
  );

  const handleAddProduct = () => {
    router.push("/(seller)/product-manage");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const isDeleting = deletingProductId === item.id;
    // Get display category (first one)
    const displayCategory =
      item.categories && item.categories.length > 0
        ? item.categories[0]
        : item.category || "Uncategorized";

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => viewProductDetails(item)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <View style={styles.productImagePlaceholder}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
          ) : (
            <Ionicons name="image-outline" size={40} color="#CCC" />
          )}
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description || "No description"}
          </Text>

          <View style={styles.priceStockRow}>
            <Text style={styles.productPrice}>
              ₱{item.price?.toFixed(2) || "0.00"}
            </Text>
            <Text style={styles.productStock}>
              Stock: {item.stockQuantity || 0}
            </Text>
          </View>

          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{displayCategory}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.editButton, isDeleting && styles.disabledButton]}
            onPress={() => {
              handleEditProduct(item.id);
            }}
            disabled={isDeleting}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.disabledButton]}
            onPress={() => {
              showDeleteConfirmation(item.id, item.name);
            }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Product Details Modal Component
  const ProductDetailsModal = () => {
    if (!selectedProduct) return null;

    // Get all categories as an array
    const categoriesList =
      selectedProduct.categories ||
      (selectedProduct.category ? [selectedProduct.category] : []);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={viewModalVisible}
        onRequestClose={closeViewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Product Details</Text>
              <TouchableOpacity
                onPress={closeViewModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Image */}
              <View style={styles.modalImageContainer}>
                {selectedProduct.imageUrl ? (
                  <Image
                    source={{ uri: selectedProduct.imageUrl }}
                    style={styles.modalImage}
                  />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Ionicons name="image-outline" size={60} color="#CCC" />
                  </View>
                )}
              </View>

              {/* Product Name */}
              <Text style={styles.modalProductName}>
                {selectedProduct.name}
              </Text>

              {/* Price and Stock */}
              <View style={styles.modalPriceStockRow}>
                <Text style={styles.modalPrice}>
                  ₱{selectedProduct.price?.toFixed(2)}
                </Text>
                <Text style={styles.modalStock}>
                  Stock: {selectedProduct.stockQuantity || 0}
                </Text>
              </View>

              {/* Categories - Show all categories */}
              {categoriesList.length > 0 && (
                <View style={styles.modalCategories}>
                  {categoriesList.map((cat: string, index: number) => (
                    <View key={index} style={styles.modalCategoryChip}>
                      <Text style={styles.modalCategoryText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Description */}
              {selectedProduct.description && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalDescription}>
                    {selectedProduct.description}
                  </Text>
                </View>
              )}

              {/* Product Details */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Product Details</Text>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Net Weight:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedProduct.netWeight || "N/A"}
                  </Text>
                </View>

                {selectedProduct.calories && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Calories:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedProduct.calories} kcal
                    </Text>
                  </View>
                )}

                {selectedProduct.origin && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Origin:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedProduct.origin}
                    </Text>
                  </View>
                )}

                {selectedProduct.culturalBackground && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>
                      Cultural Background:
                    </Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedProduct.culturalBackground}
                    </Text>
                  </View>
                )}

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Storage:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedProduct.storage || "N/A"}
                  </Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Shelf Life:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedProduct.shelfLife || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Recipes */}
              {selectedProduct.recipes &&
                selectedProduct.recipes.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Recipes</Text>
                    {selectedProduct.recipes.map(
                      (recipe: any, index: number) => (
                        <View key={index} style={styles.modalRecipeItem}>
                          <Text style={styles.modalRecipeName}>
                            {recipe.name}
                          </Text>
                          <Text style={styles.modalRecipeDesc}>
                            {recipe.description}
                          </Text>
                          <Text style={styles.modalRecipeMeta}>
                            {recipe.prepTime} • {recipe.difficulty}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.editProductButton}
                onPress={() => {
                  closeViewModal();
                  handleEditProduct(selectedProduct.id);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={styles.editProductButtonText}>Edit Product</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={closeViewModal}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Products</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
          <Text style={styles.loadingText}>Loading your products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryChange(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category &&
                    styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.productCount}>
        {filteredProducts.length}{" "}
        {filteredProducts.length === 1 ? "product" : "products"} found
      </Text>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySubText}>
              Start selling by adding your first product!
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddProduct}
            >
              <Text style={styles.addFirstButtonText}>
                Add Your First Product
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Custom Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle-outline" size={50} color="#FF3B30" />
            </View>
            <Text style={styles.modalTitle}>Delete Product</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{productToDelete?.name}"?
            </Text>
            <Text style={styles.modalWarning}>
              This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteModalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Details Modal */}
      <ProductDetailsModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8F796F",
  },
  categoriesWrapper: {
    marginBottom: 16,
    marginTop: 8,
  },
  categoriesScrollContent: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 85,
  },
  categoryChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  productCount: {
    fontSize: 14,
    color: "#8F796F",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
    marginRight: 16,
    overflow: "hidden",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  productDetails: {
    flex: 1,
    marginRight: 90,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 8,
  },
  priceStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  productStock: {
    fontSize: 14,
    color: "#8F796F",
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 11,
    color: "#666",
  },
  actionButtons: {
    position: "absolute",
    right: 16,
    top: 16,
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8F796F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  closeButton: {
    padding: 4,
  },
  modalImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  modalImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  modalProductName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#32221B",
    textAlign: "center",
    marginBottom: 8,
  },
  modalPriceStockRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C35822",
  },
  modalStock: {
    fontSize: 14,
    color: "#8F796F",
  },
  modalCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  modalCategoryChip: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  modalCategoryText: {
    fontSize: 12,
    color: "#666",
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalDetailLabel: {
    fontSize: 13,
    color: "#8F796F",
  },
  modalDetailValue: {
    fontSize: 13,
    color: "#32221B",
    fontWeight: "500",
  },
  modalRecipeItem: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalRecipeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  modalRecipeDesc: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  modalRecipeMeta: {
    fontSize: 11,
    color: "#8F796F",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  editProductButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#C35822",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  editProductButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  closeModalButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  closeModalButtonText: {
    color: "#8F796F",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteModalButton: {
    backgroundColor: "#FF3B30",
  },
  deleteModalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  cancelModalButtonText: {
    color: "#8F796F",
    fontSize: 16,
    fontWeight: "600",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 12,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
});
