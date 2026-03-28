// app/(seller)/products.tsx - Final version with manual sorting
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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
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
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Fetch ONLY the logged-in user's products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        setProducts([]);
        setFilteredProducts([]);
        setLoading(false);
        return;
      }

      console.log("Fetching products for seller ID:", user.uid);

      // Query without orderBy to avoid index requirement
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("sellerId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const productsList: any[] = [];

      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() });
      });

      // Sort manually in JavaScript
      productsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      console.log(`✅ Found ${productsList.length} products for seller ${user.uid}`);
      setProducts(productsList);

      // Apply filter
      if (selectedCategory === "All") {
        setFilteredProducts(productsList);
      } else {
        const filtered = productsList.filter(
          (product) => product.category === selectedCategory,
        );
        setFilteredProducts(filtered);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "All") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) => product.category === category,
      );
      setFilteredProducts(filtered);
    }
  };

  // Delete product function
  const deleteProduct = async (productId: string, productName: string) => {
    if (deletingProductId) return;

    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingProductId(productId);
            try {
              const productRef = doc(db, "products", productId);
              await deleteDoc(productRef);
              
              const updatedProducts = products.filter(p => p.id !== productId);
              setProducts(updatedProducts);
              
              if (selectedCategory === "All") {
                setFilteredProducts(updatedProducts);
              } else {
                const filtered = updatedProducts.filter(
                  (product) => product.category === selectedCategory,
                );
                setFilteredProducts(filtered);
              }

              Alert.alert("Success", `"${productName}" has been deleted permanently.`);
            } catch (error: any) {
              console.error("Delete error:", error);
              Alert.alert("Delete Failed", error.message || "Failed to delete product");
              await fetchProducts();
            } finally {
              setDeletingProductId(null);
            }
          },
        },
      ],
    );
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

  const handleEditProduct = (productId: string) => {
    router.push({
      pathname: "/(seller)/product-manage",
      params: { productId },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const renderProductItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.productCard}>
        <View style={styles.productImagePlaceholder}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
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
            <Text style={styles.categoryTagText}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditProduct(item.id)}
            disabled={deletingProductId !== null}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              deletingProductId === item.id && styles.disabledButton
            ]}
            onPress={() => deleteProduct(item.id, item.name)}
            disabled={deletingProductId !== null}
          >
            {deletingProductId === item.id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
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
});