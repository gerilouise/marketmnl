// app/(tabs)/index.tsx
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [showChat, setShowChat] = useState(false);
  const [wishlist, setWishlist] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { getCurrentUser } = useFirebaseAuth();
  const {
    profile,
    loading: profileLoading,
    fetchProfile,
  } = useFirebaseProfile();

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

      // Get latest 10 products for featured
      const featuredQuery = query(
        productsRef,
        orderBy("createdAt", "desc"),
        limit(10),
      );
      const featuredSnapshot = await getDocs(featuredQuery);
      const productsList: any[] = [];

      featuredSnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() });
      });

      setFeaturedProducts(productsList.slice(0, 4)); // First 4 for featured
      setNewArrivals(productsList.slice(4, 7)); // Next 3 for new arrivals
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
    // REMOVED: router.push("/(tabs)/chat-list"); - This was the problem!
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Categories data
  const categories = [
    { id: "1", name: "Specials", icon: "🎉" },
    { id: "2", name: "Spicy", icon: "🌶️" },
    { id: "3", name: "Seafood", icon: "🦐" },
    { id: "4", name: "Meat", icon: "🥩" },
  ];

  const toggleWishlist = (productId) => {
    setWishlist((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const navigateToProduct = (productId) => {
    router.push(`/product/${productId}`);
  };

  const navigateToCategory = (categoryName) => {
    router.push({
      pathname: "/browse",
      params: { category: categoryName },
    });
  };

  const navigateToSeeAll = (section) => {
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
    router.push("/(customer)/chat-list");
  };

  // Get user's name from profile
  const getUserName = () => {
    const user = getCurrentUser();
    if (!user) return "Guest";
    if (profile?.fullName) return profile.fullName.split(" ")[0];
    return "Loading...";
  };

  const isLoggedIn = () => getCurrentUser() !== null;

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => navigateToCategory(item.name)}
    >
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryIconText}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToProduct(item.id)}
    >
      <View style={styles.productImagePlaceholder}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <Ionicons name="image-outline" size={30} color="#CCC" />
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
            size={20}
            color={wishlist[item.id] ? "#C35822" : "#8F796F"}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
        {item.name}
      </Text>
      <View style={styles.productRating}>
        <Ionicons name="star" size={14} color="#FFD700" />
        <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
      </View>
      <Text style={styles.productPrice}>₱{item.price}</Text>
    </TouchableOpacity>
  );

  const renderNewArrivalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.newArrivalCard}
      onPress={() => navigateToProduct(item.id)}
    >
      <View style={styles.newArrivalImagePlaceholder}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.newArrivalImage}
          />
        ) : (
          <Ionicons name="image-outline" size={30} color="#CCC" />
        )}
      </View>
      <View style={styles.newArrivalInfo}>
        <Text
          style={styles.newArrivalName}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        <Text
          style={styles.newArrivalSeller}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.sellerName || "MarketMNL"}
        </Text>
        <View style={styles.newArrivalRating}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
        </View>
        <Text style={styles.newArrivalPrice}>₱{item.price}</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#8F796F"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={navigateToChat}>
                <Ionicons name="chatbubble-outline" size={24} color="#8F796F" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.separator} />
        </View>

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

        {/* Featured Products Section */}
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
            />
          ) : (
            <View style={styles.emptyFeatured}>
              <Text style={styles.emptyText}>No products yet</Text>
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
            <View style={styles.emptyNewArrivals}>
              <Text style={styles.emptyText}>No new arrivals</Text>
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
          <Ionicons name="chatbubble-ellipses" size={28} color="#FFF" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F4",
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
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  greeting: {
    fontSize: 16,
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
    marginHorizontal: 25,
    marginBottom: 20,
  },
  promoContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 15,
    overflow: "hidden",
    height: 180,
    position: "relative",
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
    marginRight: 10,
    marginLeft: 20,
    justifyContent: "center",
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    color: "#333",
  },
  featuredContainer: {
    alignItems: "center",
    marginBottom: 35,
  },
  featuredList: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  productCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    paddingBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 110,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    position: "relative",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  wishlistButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FFF",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    width: "100%",
  },
  productRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
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
    marginBottom: 15,
  },
  newArrivalCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newArrivalImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
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
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    width: "100%",
  },
  newArrivalSeller: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    width: "100%",
  },
  newArrivalRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  newArrivalPrice: {
    fontSize: 16,
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
  emptyFeatured: {
    width: "100%",
    padding: 40,
    alignItems: "center",
  },
  emptyNewArrivals: {
    width: "100%",
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8F796F",
  },
});
