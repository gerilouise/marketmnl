// app/(tabs)/index.tsx
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { db } from "@/lib/firebase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Categories with professional icons
const categories = [
  { id: "1", name: "Specials", icon: "star", iconSet: "ionicons" },
  { id: "2", name: "Spicy", icon: "flame", iconSet: "ionicons" },
  { id: "3", name: "Seafood", icon: "fish", iconSet: "ionicons" },
  { id: "4", name: "Meat", icon: "restaurant", iconSet: "ionicons" },
];

export default function HomeScreen() {
  const [showChat, setShowChat] = useState(false);
  const [wishlist, setWishlist] = useState<{ [key: string]: boolean }>({});
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { getCurrentUser } = useFirebaseAuth();
  const {
    profile,
    loading: profileLoading,
    fetchProfile,
  } = useFirebaseProfile();

  // Fetch unread notifications count
  const loadUnreadNotifications = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", user.uid),
        where("read", "==", false),
      );
      const querySnapshot = await getDocs(q);
      setUnreadCount(querySnapshot.size);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  // Get seller store name from seller ID
  const getSellerStoreName = async (sellerId: string) => {
    try {
      const sellerRef = doc(db, "sellers", sellerId);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        return sellerData.storeName || sellerData.sellerName || "MarketMNL";
      }
      return "MarketMNL";
    } catch (error) {
      console.error("Error getting seller name:", error);
      return "MarketMNL";
    }
  };

  // Fetch profile when screen loads
  useEffect(() => {
    const loadProfile = async () => {
      const user = getCurrentUser();
      if (user) {
        await fetchProfile();
      }
    };
    loadProfile();
  }, []);

  // Fetch products from Firebase
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");

      // Get all products ordered by createdAt
      const allProductsQuery = query(
        productsRef,
        orderBy("createdAt", "desc"),
        limit(20),
      );
      const allProductsSnapshot = await getDocs(allProductsQuery);
      const productsList: any[] = [];

      for (const doc of allProductsSnapshot.docs) {
        const data = doc.data();
        // Get seller store name for each product
        const sellerStoreName = await getSellerStoreName(data.sellerId);

        productsList.push({
          id: doc.id,
          ...data,
          rating: data.rating || 4.5,
          sellerName: sellerStoreName,
          sellerStoreName: sellerStoreName,
        });
      }

      console.log(`Fetched ${productsList.length} products`);

      // Separate products into featured and new arrivals
      setFeaturedProducts(productsList.slice(0, 4));
      setNewArrivals(productsList.slice(4, 7));

      console.log(`Featured: ${productsList.slice(0, 4).length} products`);
      console.log(`New Arrivals: ${productsList.slice(4, 7).length} products`);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    await loadUnreadNotifications();
  };

  useEffect(() => {
    fetchProducts();
    loadUnreadNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadNotifications();
      fetchProducts();
    }, []),
  );

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const navigateToCategory = (categoryName: string) => {
    router.push({
      pathname: "/browse",
      params: { category: categoryName },
    });
  };

  const navigateToSeeAll = (section: string) => {
    router.push({
      pathname: "/browse",
      params: { section: section },
    });
  };

  const navigateToChat = () => {
    const user = getCurrentUser();
    if (!user) {
      Alert.alert("Login Required", "Please log in to view your messages", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    router.push("/(tabs)/chat-list");
  };

  // Get user's name from profile
  const getUserName = () => {
    const user = getCurrentUser();
    if (!user) return "Guest";
    if (profile?.fullName) return profile.fullName.split(" ")[0];
    if (user.displayName) return user.displayName.split(" ")[0];
    return "Customer";
  };

  const isLoggedIn = () => getCurrentUser() !== null;

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => navigateToCategory(item.name)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={item.icon} size={28} color="#C35822" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToProduct(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.productImagePlaceholder}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={40} color="#CCC" />
          </View>
        )}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(item.id);
          }}
        >
          <Ionicons
            name={wishlist[item.id] ? "heart" : "heart-outline"}
            size={18}
            color={wishlist[item.id] ? "#C35822" : "#8F796F"}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.productName} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.productRating}>
        <Ionicons name="star" size={12} color="#FFD700" />
        <Text style={styles.ratingText}>
          {item.rating?.toFixed(1) || "4.5"}
        </Text>
      </View>
      <Text style={styles.productPrice}>₱{item.price?.toLocaleString()}</Text>
    </TouchableOpacity>
  );

  const renderNewArrivalItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.newArrivalCard}
      onPress={() => navigateToProduct(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.newArrivalImagePlaceholder}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.newArrivalImage}
          />
        ) : (
          <View style={styles.noImageContainerSmall}>
            <Ionicons name="image-outline" size={30} color="#CCC" />
          </View>
        )}
      </View>
      <View style={styles.newArrivalInfo}>
        <Text style={styles.newArrivalName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.newArrivalSeller} numberOfLines={1}>
          {item.sellerStoreName || item.sellerName || "MarketMNL"}
        </Text>
        <View style={styles.newArrivalRating}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.rating?.toFixed(1) || "4.5"}
          </Text>
        </View>
        <Text style={styles.newArrivalPrice}>
          ₱{item.price?.toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={(e) => {
          e.stopPropagation();
          console.log("Add to cart:", item.id);
        }}
      >
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
          <Text style={styles.loadingText}>Loading delicious products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
      >
        <View>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Magandang Araw,</Text>
              <Text style={styles.userName}>{getUserName()}</Text>
              {!isLoggedIn() && (
                <TouchableOpacity onPress={() => router.push("/auth/login")}>
                  <Text style={styles.loginPrompt}>Tap to log in</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/notifications")}
              >
                <View>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color="#32221B"
                  />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={navigateToChat}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={24}
                  color="#32221B"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.separator} />
        </View>

        {/* Promo Banner */}
        <TouchableOpacity
          style={styles.promoContainer}
          onPress={() => navigateToSeeAll("promo")}
        >
          <Image
            source={require("@/assets/images/banner.png")}
            style={styles.promoImage}
            resizeMode="cover"
          />
          <View style={styles.promoOverlay}>
            <Text style={styles.promoTitle}>Featured Promo</Text>
            <Text style={styles.promoDescription}>
              Get 20% off on all delicacies this week!
            </Text>
            <View style={styles.shopNowButton}>
              <Text style={styles.shopNowText}>Shop Now</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity
            style={styles.seeAllContainer}
            onPress={() => navigateToSeeAll("categories")}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#C35822" />
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Featured Products Section - Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity
            style={styles.seeAllContainer}
            onPress={() => navigateToSeeAll("featured")}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#C35822" />
          </TouchableOpacity>
        </View>

        <View style={styles.featuredContainer}>
          {featuredProducts.length > 0 ? (
            <FlatList
              data={featuredProducts}
              renderItem={renderFeaturedItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              snapToInterval={172}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={50} color="#E0DAD1" />
              <Text style={styles.emptyText}>No featured products yet</Text>
            </View>
          )}
        </View>

        {/* New Arrivals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <TouchableOpacity
            style={styles.seeAllContainer}
            onPress={() => navigateToSeeAll("new")}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#C35822" />
          </TouchableOpacity>
        </View>

        <View style={styles.newArrivalsList}>
          {newArrivals.length > 0 ? (
            newArrivals.map((item) => (
              <View key={item.id} style={styles.newArrivalItem}>
                {renderNewArrivalItem({ item })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={50} color="#E0DAD1" />
              <Text style={styles.emptyText}>No new arrivals yet</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* AI Chatbot Floating Button */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => router.push("/chatbot")}
        activeOpacity={0.8}
      >
        <View style={styles.chatButtonInner}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={30}
            color="white"
          />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  greeting: {
    fontSize: 14,
    color: "#8F796F",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#32221B",
  },
  loginPrompt: {
    fontSize: 12,
    color: "#C35822",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0DAD1",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  promoContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 16,
    overflow: "hidden",
    height: 180,
    position: "relative",
    backgroundColor: "#FFF",
  },
  promoImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  promoOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  promoTitle: {
    color: "#CA8342",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  promoDescription: {
    color: "#CA8342",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    width: "70%",
  },
  shopNowButton: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  shopNowText: {
    color: "#CA8342",
    fontWeight: "bold",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  seeAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    color: "#C35822",
    marginRight: 4,
  },
  categoriesContainer: {
    alignItems: "center",
    marginBottom: 25,
    justifyContent: "center",
    width: "100%",
  },
  categoriesList: {
    paddingHorizontal: 15,
    alignItems: "center",
  },
  categoryItem: {
    alignItems: "center",
    marginHorizontal: 15,
    justifyContent: "center",
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 12,
    color: "#32221B",
    fontWeight: "500",
  },
  featuredContainer: {
    width: "100%",
    marginBottom: 35,
  },
  featuredList: {
    paddingHorizontal: 20,
    paddingBottom: 5,
    gap: 12,
  },
  productCard: {
    width: 160,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F0EB",
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageContainerSmall: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFF",
    borderRadius: 15,
    width: 28,
    height: 28,
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
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 4,
  },
  productRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: "#666",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  newArrivalsList: {
    paddingHorizontal: 20,
  },
  newArrivalItem: {
    marginBottom: 12,
  },
  newArrivalCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newArrivalImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: "#F5F0EB",
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  newArrivalImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  newArrivalInfo: {
    flex: 1,
  },
  newArrivalName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  newArrivalSeller: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 4,
  },
  newArrivalRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 2,
  },
  newArrivalPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C35822",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomPadding: {
    height: 80,
  },
  chatButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 999,
  },
  chatButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});