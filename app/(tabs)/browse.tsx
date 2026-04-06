// app/(tabs)/browse.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
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

interface Shop {
  id: string;
  storeName: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
  followerCount: number;
  rating: number;
  reviewsCount?: number;
}

export default function BrowseScreen() {
  const params = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"products" | "shops">("products");
  const [isGuest, setIsGuest] = useState(true);

  // Login Prompt Modal States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "wishlist" | "cart";
    product?: any;
    productId?: string;
  } | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const user = auth.currentUser;
    setIsGuest(!user);
  }, []);

  // Load wishlist for current user (only if logged in)
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
    } catch (error) {
      console.error("Error loading wishlist:", error);
    }
  };

  // Refresh wishlist when screen comes into focus (only if logged in)
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      setIsGuest(!user);
      if (user) {
        loadWishlist();
      }
    }, []),
  );

  // Get seller name from seller ID
  const getSellerName = async (sellerId: string) => {
    try {
      const sellerRef = doc(db, "sellers", sellerId);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        return sellerData.storeName || sellerData.name || "MarketMNL";
      }
      return "MarketMNL";
    } catch (error) {
      console.error("Error getting seller name:", error);
      return "MarketMNL";
    }
  };

  // Fetch all products with seller names
  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsRef = collection(db, "products");
      const querySnapshot = await getDocs(productsRef);
      const productsList: any[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const sellerName = await getSellerName(data.sellerId);

        // IMPORTANT: Use ONLY the categories array
        let categoriesArray = [];
        if (
          data.categories &&
          Array.isArray(data.categories) &&
          data.categories.length > 0
        ) {
          categoriesArray = data.categories;
        } else if (data.category) {
          categoriesArray = [data.category];
        }

        // Get reviews for rating
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(
          reviewsRef,
          where("productId", "==", doc.id),
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);

        let totalRating = 0;
        let reviewCount = 0;
        reviewsSnapshot.forEach((reviewDoc) => {
          const reviewData = reviewDoc.data();
          if (reviewData.rating) {
            totalRating += reviewData.rating;
            reviewCount++;
          }
        });

        const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

        productsList.push({
          id: doc.id,
          ...data,
          sellerName: sellerName,
          categories: categoriesArray,
          rating: averageRating,
          reviewsCount: reviewCount,
        });
      }

      setAllProducts(productsList);
      filterProducts(selectedCategory, searchQuery, sortOrder, productsList);
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch shop statistics
  const fetchShopStats = async (shopId: string) => {
    try {
      const productsRef = collection(db, "products");
      const productsQuery = query(productsRef, where("sellerId", "==", shopId));
      const productsSnapshot = await getDocs(productsQuery);
      const productCount = productsSnapshot.size;

      const followsRef = collection(db, "follows");
      const followsQuery = query(followsRef, where("shopId", "==", shopId));
      const followsSnapshot = await getDocs(followsQuery);
      const followerCount = followsSnapshot.size;

      const reviewsRef = collection(db, "reviews");
      const reviewsQuery = query(reviewsRef, where("sellerId", "==", shopId));
      const reviewsSnapshot = await getDocs(reviewsQuery);

      let totalRating = 0;
      let reviewCount = 0;
      reviewsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.rating) {
          totalRating += data.rating;
          reviewCount++;
        }
      });

      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 4.5;

      return {
        productCount,
        followerCount,
        rating: averageRating,
        reviewsCount: reviewCount,
      };
    } catch (error) {
      console.error("Error fetching shop stats:", error);
      return {
        productCount: 0,
        followerCount: 0,
        rating: 4.5,
        reviewsCount: 0,
      };
    }
  };

  // Fetch all shops
  const loadShops = async () => {
    setLoading(true);
    try {
      const shopsList: Shop[] = [];
      const sellersRef = collection(db, "sellers");
      const sellersSnapshot = await getDocs(sellersRef);

      for (const doc of sellersSnapshot.docs) {
        const data = doc.data();
        if (data.storeName) {
          const stats = await fetchShopStats(doc.id);
          shopsList.push({
            id: doc.id,
            storeName: data.storeName || "Unknown Store",
            description: data.description || data.storeDescription,
            imageUrl: data.imageUrl || data.avatar,
            productCount: stats.productCount,
            followerCount: stats.followerCount,
            rating: stats.rating,
            reviewsCount: stats.reviewsCount,
          });
        }
      }

      shopsList.sort((a, b) => b.followerCount - a.followerCount);
      setAllShops(shopsList);
      filterShops(searchQuery, shopsList);
    } catch (error) {
      console.error("Error loading shops:", error);
      Alert.alert("Error", "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filterProducts = (
    category: string,
    search: string,
    sort: string,
    productsList: any[] = allProducts,
  ) => {
    let filtered = [...productsList];

    if (category !== "All") {
      filtered = filtered.filter((product) => {
        if (product.categories && Array.isArray(product.categories)) {
          return product.categories.includes(category);
        }
        return false;
      });
    }

    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          (product.description &&
            product.description.toLowerCase().includes(searchLower)) ||
          (product.sellerName &&
            product.sellerName.toLowerCase().includes(searchLower)),
      );
    }

    filtered.sort((a, b) => {
      if (sort === "asc") return a.price - b.price;
      else return b.price - a.price;
    });

    setFilteredProducts(filtered);
  };

  const filterShops = (search: string, shopsList: Shop[] = allShops) => {
    let filtered = [...shopsList];
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.storeName.toLowerCase().includes(searchLower) ||
          (shop.description &&
            shop.description.toLowerCase().includes(searchLower)),
      );
    }
    setFilteredShops(filtered);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterProducts(category, searchQuery, sortOrder);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (viewMode === "products") {
      filterProducts(selectedCategory, text, sortOrder);
    } else {
      filterShops(text);
    }
  };

  const handleSortChange = (order: string) => {
    setSortOrder(order);
    filterProducts(selectedCategory, searchQuery, order);
    setShowSortOptions(false);
  };

  // Show login modal instead of simple alert
  const showLoginPrompt = (
    type: "wishlist" | "cart",
    product?: any,
    productId?: string,
  ) => {
    setPendingAction({ type, product, productId });
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setPendingAction(null);
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  const handleSignUp = () => {
    setShowLoginModal(false);
    router.push("/auth/signup-customer");
  };

  const toggleWishlist = async (productId: string, product: any) => {
    const user = auth.currentUser;
    if (!user) {
      showLoginPrompt("wishlist", product, productId);
      return;
    }

    try {
      const wishlistRef = collection(db, "wishlists");
      const itemId = `${user.uid}_${productId}`;
      const docRef = doc(wishlistRef, itemId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await deleteDoc(docRef);
        setWishlist((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        Alert.alert("Removed", `${product.name} removed from wishlist`);
      } else {
        await setDoc(docRef, {
          id: itemId,
          userId: user.uid,
          productId: productId,
          productName: product.name,
          productPrice: product.price,
          sellerName: product.sellerName || "MarketMNL",
          sellerId: product.sellerId,
          productImage: product.imageUrl || null,
          addedAt: new Date(),
        });
        setWishlist((prev) => new Set(prev).add(productId));
        Alert.alert("Added", `${product.name} added to wishlist`);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      Alert.alert("Error", "Failed to update wishlist");
    }
  };

  const handleShopPress = (shopId: string) => {
    const user = auth.currentUser;
    if (!user) {
      showLoginPrompt("cart");
      return;
    }
    navigateToShop(shopId);
  };

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category as string);
    }
    loadProducts();
    loadShops();
    const user = auth.currentUser;
    if (user) {
      loadWishlist();
    }
  }, [params.category]);

  useEffect(() => {
    if (viewMode === "products") {
      filterProducts(selectedCategory, searchQuery, sortOrder);
    } else {
      filterShops(searchQuery);
    }
  }, [viewMode]);

  const navigateToProduct = (productId: string) =>
    router.push(`/product/${productId}`);
  const navigateToShop = (shopId: string) => router.push(`/store/${shopId}`);

  const renderProductItem = ({ item }: any) => {
    const rating = item.rating || 0;
    const reviewsCount = item.reviewsCount || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToProduct(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
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
          {reviewsCount > 0 ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewCountText}>({reviewsCount})</Text>
            </View>
          ) : (
            <View style={styles.rating}>
              <Ionicons name="star-outline" size={12} color="#8F796F" />
              <Text style={styles.ratingTextNoReview}>No reviews</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderShopItem = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => handleShopPress(item.id)}
      activeOpacity={0.9}
    >
      <View style={styles.shopImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.shopImage} />
        ) : (
          <View style={styles.shopImagePlaceholder}>
            <Ionicons name="storefront-outline" size={40} color="#CCC" />
          </View>
        )}
      </View>
      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>
          {item.storeName}
        </Text>
        {item.description && (
          <Text style={styles.shopDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.shopStats}>
          <View style={styles.shopStat}>
            <Ionicons name="cube-outline" size={12} color="#8F796F" />
            <Text style={styles.shopStatText}>
              {item.productCount || 0} products
            </Text>
          </View>
          <View style={styles.shopStat}>
            <Ionicons name="heart-outline" size={12} color="#8F796F" />
            <Text style={styles.shopStatText}>
              {item.followerCount || 0} followers
            </Text>
          </View>
          <View style={styles.shopStat}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.shopStatText}>
              {item.rating ? item.rating.toFixed(1) : "4.5"}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8F796F" />
    </TouchableOpacity>
  );

  // Login Required Modal Component
  const LoginRequiredModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLoginModal}
      onRequestClose={closeLoginModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.loginModalContent}>
          <View style={styles.loginModalIcon}>
            <Ionicons name="log-in-outline" size={60} color="#C35822" />
          </View>
          <Text style={styles.loginModalTitle}>Login Required</Text>
          <Text style={styles.loginModalMessage}>
            {pendingAction?.type === "wishlist"
              ? "Please log in to add items to your wishlist"
              : pendingAction?.type === "cart"
                ? "Please log in to add items to your cart"
                : "Please log in to continue"}
          </Text>
          <Text style={styles.loginModalSubMessage}>
            Create an account to enjoy personalized shopping, save your
            favorites, and track your orders!
          </Text>

          <View style={styles.loginModalButtons}>
            <TouchableOpacity
              style={[styles.loginModalButton, styles.loginButtonModal]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonModalText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginModalButton, styles.signupButtonModal]}
              onPress={handleSignUp}
            >
              <Text style={styles.signupButtonModalText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginModalClose}
            onPress={closeLoginModal}
          >
            <Text style={styles.loginModalCloseText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const isLoading =
    loading &&
    (viewMode === "products"
      ? filteredProducts.length === 0 && allProducts.length === 0
      : filteredShops.length === 0 && allShops.length === 0);

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8F796F" />
          <TextInput
            placeholder={
              viewMode === "products" ? "Search products..." : "Search shops..."
            }
            placeholderTextColor="#8F796F"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "products" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("products")}
          >
            <Ionicons
              name="cube-outline"
              size={20}
              color={viewMode === "products" ? "#FFF" : "#8F796F"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "shops" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("shops")}
          >
            <Ionicons
              name="storefront-outline"
              size={20}
              color={viewMode === "shops" ? "#FFF" : "#8F796F"}
            />
          </TouchableOpacity>
        </View>

        {viewMode === "products" && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="options-outline" size={20} color="#32221B" />
          </TouchableOpacity>
        )}
      </View>

      {viewMode === "products" && showSortOptions && (
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

      {viewMode === "products" && (
        <View style={styles.categoriesContainer}>
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
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.productCount}>
        {viewMode === "products"
          ? `${filteredProducts.length} products found`
          : `${filteredShops.length} shops found`}
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
          <Text style={styles.loadingText}>
            Loading {viewMode === "products" ? "products" : "shops"}...
          </Text>
        </View>
      ) : viewMode === "products" ? (
        <FlatList
          key="products-list"
          data={filteredProducts}
          renderItem={renderProductItem}
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
      ) : (
        <FlatList
          key="shops-list"
          data={filteredShops}
          renderItem={renderShopItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.shopList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={60} color="#E0DAD1" />
              <Text style={styles.emptyText}>No shops found</Text>
            </View>
          }
        />
      )}

      {/* Login Required Modal */}
      <LoginRequiredModal />
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#8F796F" },
  searchSection: { flexDirection: "row", gap: 12, marginBottom: 12 },
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
  searchInput: { flex: 1, fontSize: 14, color: "#32221B" },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    overflow: "hidden",
  },
  toggleButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonActive: { backgroundColor: "#C35822" },
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
  sortOptionActive: { backgroundColor: "#F5F0EB" },
  sortOptionText: { fontSize: 13, color: "#32221B" },
  sortOptionTextActive: { color: "#C35822", fontWeight: "500" },
  categoriesContainer: { marginBottom: 12, minHeight: 48 },
  categoriesScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipActive: { backgroundColor: "#C35822", borderColor: "#C35822" },
  categoryText: {
    fontSize: 13,
    color: "#8F796F",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryTextActive: { color: "#FFF" },
  productCount: { fontSize: 12, color: "#8F796F", marginBottom: 12 },
  productList: { paddingBottom: 100 },
  row: { justifyContent: "space-between" },
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
  imageContainer: { position: "relative", marginBottom: 8 },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F0EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: { width: "100%", height: 120, borderRadius: 10 },
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
  sellerName: { fontSize: 11, color: "#8F796F", marginBottom: 6 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  price: { fontSize: 14, fontWeight: "600", color: "#C35822" },
  rating: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 11, color: "#666" },
  reviewCountText: { fontSize: 10, color: "#8F796F", marginLeft: 2 },
  ratingTextNoReview: { fontSize: 11, color: "#8F796F" },
  shopList: { paddingBottom: 100 },
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shopImageContainer: { marginRight: 12 },
  shopImage: { width: 70, height: 70, borderRadius: 12 },
  shopImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  shopInfo: { flex: 1 },
  shopName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  shopDescription: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 6,
    lineHeight: 16,
  },
  shopStats: { flexDirection: "row", gap: 12 },
  shopStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  shopStatText: { fontSize: 11, color: "#8F796F" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { fontSize: 14, color: "#8F796F", marginTop: 12 },
  // Login Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loginModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
  },
  loginModalMessage: {
    fontSize: 16,
    color: "#32221B",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  loginModalSubMessage: {
    fontSize: 13,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  loginModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  loginModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  loginButtonModal: {
    backgroundColor: "#C35822",
  },
  loginButtonModalText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signupButtonModal: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#C35822",
  },
  signupButtonModalText: {
    color: "#C35822",
    fontSize: 16,
    fontWeight: "600",
  },
  loginModalClose: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginModalCloseText: {
    color: "#8F796F",
    fontSize: 14,
  },
});
