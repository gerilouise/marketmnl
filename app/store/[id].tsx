// app/store/[id].tsx - Complete updated version with improved share
import { useChat } from "@/app/contexts/ChatContext";
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
  Timestamp,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Store {
  id: string;
  storeName: string;
  location?: string;
  rating: number;
  reviewsCount: number;
  productCount: number;
  description?: string;
  categories: string[];
  avatar?: string;
  createdAt: any;
  uid: string;
  storeDescription?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  imageUrl?: string;
  category: string;
  sellerId: string;
}

export default function StoreScreen() {
  const { id } = useLocalSearchParams();
  const { createConversation } = useChat();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [followingLoading, setFollowingLoading] = useState(false);

  // Load store data and products
  useEffect(() => {
    loadStoreData();
    loadProducts();
    loadWishlist();
    checkIfOwner();
    checkFollowStatus();
  }, [id]);

  const loadStoreData = async () => {
    if (!id) return;

    try {
      console.log("Loading store data for ID:", id);

      const sellerRef = doc(db, "sellers", id as string);
      const sellerSnap = await getDoc(sellerRef);

      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data();
        console.log("Store found in sellers collection:", sellerData.storeName);

        setStore({
          id: id as string,
          storeName: sellerData.storeName || "Store",
          location: sellerData.location || "",
          rating: sellerData.rating || 4.5,
          reviewsCount: sellerData.reviewsCount || 0,
          productCount: products.length,
          description:
            sellerData.storeDescription || sellerData.description || "",
          categories: sellerData.categories || [],
          avatar: sellerData.avatar || null,
          createdAt: sellerData.createdAt,
          uid: id as string,
        });

        if (!sellerData.categories || sellerData.categories.length === 0) {
          const productsRef = collection(db, "products");
          const q = query(productsRef, where("sellerId", "==", id));
          const productsSnap = await getDocs(q);
          const categoriesSet = new Set<string>();
          productsSnap.forEach((doc) => {
            const product = doc.data();
            if (product.category) {
              categoriesSet.add(product.category);
            }
          });
          setStore((prev) =>
            prev ? { ...prev, categories: Array.from(categoriesSet) } : null,
          );
        }
      } else {
        console.log("Store not found in sellers collection");
        Alert.alert("Error", "Store not found");
        router.back();
      }
    } catch (error) {
      console.error("Error loading store:", error);
      Alert.alert("Error", "Failed to load store");
    }
  };

  const loadProducts = async () => {
    if (!id) return;

    try {
      console.log("Loading products for seller ID:", id);
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("sellerId", "==", id));
      const querySnapshot = await getDocs(q);
      const productsList: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          name: data.name,
          price: data.price,
          rating: data.rating || 4.5,
          imageUrl: data.imageUrl,
          category: data.category,
          sellerId: data.sellerId,
        });
      });

      console.log(`Found ${productsList.length} products`);
      setProducts(productsList);
      setFilteredProducts(productsList);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    const user = auth.currentUser;
    if (!user) return;

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

  const checkIfOwner = () => {
    const user = auth.currentUser;
    if (user && user.uid === id) {
      setIsOwner(true);
      console.log("User is viewing their own store");
    } else {
      setIsOwner(false);
    }
  };

  const checkFollowStatus = async () => {
    if (isOwner) return;

    const user = auth.currentUser;
    if (!user || !id) return;

    try {
      const followsRef = collection(db, "follows");
      const q = query(
        followsRef,
        where("userId", "==", user.uid),
        where("shopId", "==", id),
      );
      const querySnapshot = await getDocs(q);
      setIsFollowing(!querySnapshot.empty);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (isOwner) {
      Alert.alert("Info", "You cannot follow your own store");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to follow stores", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    if (followingLoading) return;

    setFollowingLoading(true);
    try {
      const followsRef = collection(db, "follows");
      const followId = `${user.uid}_${id}`;
      const docRef = doc(followsRef, followId);

      if (isFollowing) {
        await deleteDoc(docRef);
        setIsFollowing(false);
        Alert.alert(
          "Unfollowed",
          `You are no longer following ${store?.storeName}`,
        );
      } else {
        await setDoc(docRef, {
          id: followId,
          userId: user.uid,
          shopId: id,
          shopName: store?.storeName,
          followedAt: Timestamp.now(),
        });
        setIsFollowing(true);
        Alert.alert("Following", `You are now following ${store?.storeName}`);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", "Failed to update follow status");
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleChat = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Login Required", "Please log in to message the seller", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    if (isOwner) {
      Alert.alert("Info", "You cannot chat with yourself");
      return;
    }

    if (!store) {
      Alert.alert("Error", "Store information not available");
      return;
    }

    setFollowingLoading(true);

    try {
      console.log("Starting chat with seller:", store.uid, store.storeName);

      // Make sure we have valid seller info
      if (!store.uid || !store.storeName) {
        Alert.alert("Error", "Seller information is incomplete");
        return;
      }

      const conversationId = await createConversation(
        store.uid,
        store.storeName,
      );

      if (!conversationId) {
        Alert.alert("Error", "Failed to start conversation. Please try again.");
        return;
      }

      console.log("Conversation created/found:", conversationId);

      // Navigate to chat with proper parameters
      // The chat detail screen should handle both cases:
      // 1. If conversation exists, it will load messages
      // 2. If new, it will show empty state
      router.push({
        pathname: "/(tabs)/chat-detail",
        params: {
          conversationId: conversationId,
          sellerId: store.uid,
          sellerName: store.storeName,
        },
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleShare = async () => {
    if (!store) {
      Alert.alert("Error", "Store information not available");
      return;
    }

    try {
      // Create a beautiful share message with store details
      const storeUrl = Platform.select({
        ios: `marketmnl://store/${store.id}`,
        android: `marketmnl://store/${store.id}`,
        default: `https://marketmnl.com/store/${store.id}`,
      });

      const shareMessage =
        `🏪 *${store.storeName}* 🏪\n\n` +
        `📍 Location: ${store.location || "Online Store"}\n` +
        `⭐ Rating: ${store.rating || 4.5} ★ (${store.reviewsCount || 0} reviews)\n` +
        `📦 Products: ${products.length} items\n\n` +
        `${store.description ? `📝 ${store.description.substring(0, 100)}${store.description.length > 100 ? "..." : ""}\n\n` : ""}` +
        `👉 Check out this store on MarketMNL: ${storeUrl}\n\n` +
        `📱 Download MarketMNL app: https://marketmnl.com/download`;

      const result = await Share.share({
        message: shareMessage,
        title: store.storeName,
        url: storeUrl,
      });

      if (result.action === Share.sharedAction) {
        console.log("Store shared successfully");
      }
    } catch (error: any) {
      console.error("Error sharing store:", error);
      // Don't show alert for user cancellation
      if (error.message !== "User canceled share dialog") {
        Alert.alert(
          "Share Failed",
          "Unable to share at this time. Please try again.",
        );
      }
    }
  };

  const toggleWishlist = async (productId: string, product: Product) => {
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
          sellerName: store?.storeName,
          sellerId: id,
          productImage: product.imageUrl || null,
          addedAt: Timestamp.now(),
        });
        setWishlist((prev) => new Set(prev).add(productId));
        Alert.alert("Added", `${product.name} added to wishlist`);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      Alert.alert("Error", "Failed to update wishlist");
    }
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const filterProducts = (category: string) => {
    setSelectedCategory(category);
    if (category === "All") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((p) => p.category === category);
      setFilteredProducts(filtered);
    }
  };

  // Helper function to format data for 2-column grid
  const formatProductData = () => {
    const formattedData = [...filteredProducts];
    if (formattedData.length % 2 !== 0) {
      formattedData.push({} as Product);
    }
    return formattedData;
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    if (!item.id) {
      return <View style={styles.productCardPlaceholder} />;
    }

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigateToProduct(item.id)}
      >
        <View style={styles.productImagePlaceholder}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
          ) : (
            <Ionicons name="image-outline" size={30} color="#CCC" />
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
        <View style={styles.productRow}>
          <Text style={styles.productPrice}>₱{item.price}</Text>
          <View style={styles.productRating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="storefront-outline" size={60} color="#C35822" />
          <Text style={styles.errorText}>Store not found</Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categories = ["All", ...(store.categories || [])];
  const formattedProducts = formatProductData();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#32221B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.storeCard}>
          <View style={styles.avatarContainer}>
            {store.avatar ? (
              <Image
                source={{ uri: store.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="storefront-outline" size={40} color="#8F796F" />
              </View>
            )}
          </View>

          <View style={styles.storeDetails}>
            <Text style={styles.storeName}>{store.storeName}</Text>

            {store.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color="#8F796F" />
                <Text style={styles.infoText}>{store.location}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.infoText}>
                {store.rating || 4.5} ({store.reviewsCount || 0} reviews)
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={14} color="#8F796F" />
              <Text style={styles.infoText}>{products.length} products</Text>
            </View>

            {store.description && (
              <Text style={styles.description}>{store.description}</Text>
            )}
          </View>
        </View>

        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => filterProducts(category)}
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
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleChat}
            disabled={followingLoading}
          >
            {followingLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
                <Text style={styles.chatButtonText}>Chat Now</Text>
              </>
            )}
          </TouchableOpacity>

          {!isOwner && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollow}
              disabled={followingLoading}
            >
              {followingLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? "#FFF" : "#C35822"}
                />
              ) : (
                <>
                  <Ionicons
                    name={isFollowing ? "checkmark" : "add-outline"}
                    size={18}
                    color={isFollowing ? "#FFF" : "#C35822"}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              style={[styles.followButton, styles.editStoreButton]}
              onPress={() => router.push("/(seller)/edit-profile")}
            >
              <Ionicons name="create-outline" size={18} color="#FFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.productsSection}>
          <View style={styles.productsHeader}>
            <Text style={styles.productsTitle}>
              Products ({filteredProducts.length})
            </Text>
          </View>

          <FlatList
            data={formattedProducts}
            renderItem={renderProductItem}
            keyExtractor={(item, index) => item.id || `placeholder-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.productsGrid}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyProducts}>
                <Ionicons name="cube-outline" size={50} color="#E0DAD1" />
                <Text style={styles.emptyProductsText}>No products found</Text>
              </View>
            }
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#32221B",
    marginTop: 16,
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  goBackButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  storeCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C35822",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  storeDetails: {
    flex: 1,
    justifyContent: "center",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#8F796F",
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  categoriesScroll: {
    marginBottom: 12,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#C35822",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chatButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  chatButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  followButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  followingButton: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  editStoreButton: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  followButtonText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#FFF",
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  productsSection: {
    padding: 16,
  },
  productsHeader: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  productsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  productCardPlaceholder: {
    width: "48%",
    backgroundColor: "transparent",
    marginBottom: 12,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    marginBottom: 8,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  wishlistButton: {
    position: "absolute",
    top: 5,
    right: 5,
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
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
  productRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
  },
  emptyProducts: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 8,
  },
  bottomPadding: {
    height: 20,
  },
});
