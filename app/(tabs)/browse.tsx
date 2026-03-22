// app/(tabs)/browse.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES = [
  "All",
  "Specials",
  "Spicy",
  "Seafood",
  "Meat",
  "Bottled",
  "Dried",
];

export default function BrowseScreen() {
  const params = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Load wishlist for current user
  const loadWishlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      setWishlist(new Set());
      return;
    }

    try {
      const wishlistRef = collection(db, "wishlists");
      const q = query(wishlistRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const wishlistSet = new Set<string>();
      querySnapshot.forEach((doc) => {
        wishlistSet.add(doc.data().productId);
      });
      setWishlist(wishlistSet);
      console.log("Wishlist loaded:", wishlistSet.size, "items");
    } catch (error) {
      console.error("Error loading wishlist:", error);
    }
  };

  // Fetch all products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsRef = collection(db, "products");
      const querySnapshot = await getDocs(productsRef);
      const productsList: any[] = [];
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() });
      });
      setAllProducts(productsList);
      filterProducts(selectedCategory, searchQuery, sortOrder, productsList);
      console.log("Products loaded:", productsList.length);
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on category, search, and sort
  const filterProducts = (
    category: string,
    search: string,
    sort: string,
    productsList: any[] = allProducts,
  ) => {
    let filtered = [...productsList];

    // Apply category filter
    if (category !== "All") {
      filtered = filtered.filter((product) => product.category === category);
    }

    // Apply search filter
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          (product.description &&
            product.description.toLowerCase().includes(searchLower)),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sort === "asc") {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });

    setFilteredProducts(filtered);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterProducts(category, searchQuery, sortOrder);
  };

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterProducts(selectedCategory, text, sortOrder);
  };

  // Handle sort change
  const handleSortChange = (order: string) => {
    setSortOrder(order);
    filterProducts(selectedCategory, searchQuery, order);
    setShowSortOptions(false);
  };

  // Toggle wishlist
  const toggleWishlist = async (productId: string, product: any) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to wishlist", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    try {
      const wishlistRef = collection(db, "wishlists");
      const itemId = `${user.uid}_${productId}`;
      const docRef = doc(wishlistRef, itemId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Remove from wishlist
        await deleteDoc(docRef);
        setWishlist((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        Alert.alert("Removed", `${product.name} removed from wishlist`);
      } else {
        // Add to wishlist
        await setDoc(docRef, {
          id: itemId,
          userId: user.uid,
          productId: productId,
          productName: product.name,
          productPrice: product.price,
          sellerName: product.sellerName || "MarketMNL",
          productImage: product.imageUrl || null,
          addedAt: new Date(),
        });
        setWishlist((prev) => new Set(prev).add(productId));

        // ✅ MOVED THIS INSIDE THE FUNCTION
        console.log("✅ Item added to wishlist:", {
          productId: productId,
          productName: product.name,
          userId: user.uid,
          itemId: itemId,
        });

        Alert.alert("Added", `${product.name} added to wishlist`);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      Alert.alert("Error", "Failed to update wishlist");
    }
  };

  // Handle category from home screen
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category as string);
    }
    loadProducts();
    loadWishlist();
  }, [params.category]);

  // Navigate to product details
  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigateToProduct(item.id)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#CCC" />
          </View>
        )}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(item.id, item);
          }}
        >
          <Ionicons
            name={wishlist.has(item.id) ? "heart" : "heart-outline"}
            size={18}
            color={wishlist.has(item.id) ? "#C35822" : "#8F796F"}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.productName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.sellerName} numberOfLines={1}>
        {item.sellerName || "MarketMNL"}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>₱{item.price}</Text>
        <View style={styles.rating}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && filteredProducts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35822" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8F796F" />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#8F796F"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Ionicons name="options-outline" size={20} color="#32221B" />
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      {showSortOptions && (
        <View style={styles.sortDropdown}>
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortOrder === "asc" && styles.sortOptionActive,
            ]}
            onPress={() => handleSortChange("asc")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortOrder === "asc" && styles.sortOptionTextActive,
              ]}
            >
              Price: Low to High
            </Text>
            {sortOrder === "asc" && (
              <Ionicons name="checkmark" size={16} color="#C35822" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortOrder === "desc" && styles.sortOptionActive,
            ]}
            onPress={() => handleSortChange("desc")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortOrder === "desc" && styles.sortOptionTextActive,
              ]}
            >
              Price: High to Low
            </Text>
            {sortOrder === "desc" && (
              <Ionicons name="checkmark" size={16} color="#C35822" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesWrapper}
      >
        <View style={styles.categoriesList}>
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
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Product Count */}
      <Text style={styles.productCount}>
        {filteredProducts.length} products found
      </Text>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF7F2",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBF7F2",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8F796F",
  },
  searchSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#32221B",
  },
  sortButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  sortDropdown: {
    position: "absolute",
    top: 70,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 170,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: "#F5F0EB",
  },
  sortOptionText: {
    fontSize: 13,
    color: "#32221B",
  },
  sortOptionTextActive: {
    color: "#C35822",
    fontWeight: "500",
  },
  categoriesWrapper: {
    marginBottom: 12,
  },
  categoriesList: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    minWidth: 70,
    alignItems: "center",
  },
  categoryChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  categoryText: {
    fontSize: 13,
    color: "#8F796F",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryTextActive: {
    color: "#FFF",
  },
  productCount: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 12,
  },
  productList: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F0EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 11,
    color: "#8F796F",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: "#8F796F",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 12,
  },
});
