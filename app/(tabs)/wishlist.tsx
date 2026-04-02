// app/(tabs)/wishlist.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  setDoc,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string | null;
  sellerName: string;
  sellerId: string;
  addedAt: any;
}

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);

  // Load wishlist from Firebase
  const loadWishlist = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      const wishlistRef = collection(db, "wishlists");
      const q = query(wishlistRef, where("userId", "==", user.uid));

      const querySnapshot = await getDocs(q);
      const items: WishlistItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          productId: data.productId,
          userId: data.userId,
          productName: data.productName,
          productPrice: data.productPrice,
          productImage: data.productImage,
          sellerName: data.sellerName,
          sellerId: data.sellerId,
          addedAt: data.addedAt,
        } as WishlistItem);
      });

      items.sort((a, b) => {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });

      setWishlistItems(items);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      Alert.alert("Error", "Failed to load wishlist");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, []),
  );

  // Check product stock
  const checkProductStock = async (productId: string): Promise<number> => {
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data();
        return productData.stockQuantity || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error checking stock:", error);
      return 0;
    }
  };

  // Add to cart function
  const handleAddToCart = async (item: WishlistItem) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to cart", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    setAddingToCartId(item.productId);

    try {
      const stockQuantity = await checkProductStock(item.productId);

      if (stockQuantity <= 0) {
        Alert.alert(
          "Out of Stock",
          `${item.productName} is currently out of stock.`,
        );
        setAddingToCartId(null);
        return;
      }

      const cartItemId = `${user.uid}_${item.productId}`;
      const cartRef = collection(db, "carts");
      const cartDocRef = doc(cartRef, cartItemId);
      const cartDocSnap = await getDoc(cartDocRef);

      if (cartDocSnap.exists()) {
        const currentQuantity = cartDocSnap.data().quantity;
        const newQuantity = currentQuantity + 1;

        if (newQuantity > stockQuantity) {
          Alert.alert(
            "Stock Limit",
            `Only ${stockQuantity} items available in stock.`,
          );
          setAddingToCartId(null);
          return;
        }

        await updateDoc(cartDocRef, {
          quantity: newQuantity,
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", `Updated quantity for ${item.productName}`);
      } else {
        await setDoc(cartDocRef, {
          id: cartItemId,
          userId: user.uid,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          sellerName: item.sellerName,
          sellerId: item.sellerId,
          quantity: 1,
          imageUrl: item.productImage || null,
          addedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", `${item.productName} added to cart`);
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", error.message || "Failed to add item to cart");
    } finally {
      setAddingToCartId(null);
    }
  };

  // Remove from wishlist
  const handleRemoveFromWishlist = async (productId: string, productName: string) => {
    Alert.alert(
      "Remove from Wishlist",
      `Remove "${productName}" from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingItemId(productId);
            try {
              const user = auth.currentUser;
              if (user) {
                const itemId = `${user.uid}_${productId}`;
                const itemRef = doc(db, "wishlists", itemId);
                await deleteDoc(itemRef);
                await loadWishlist();
                Alert.alert("Success", `"${productName}" removed from wishlist`);
              }
            } catch (error) {
              console.error("Error removing from wishlist:", error);
              Alert.alert("Error", "Failed to remove item");
            } finally {
              setDeletingItemId(null);
            }
          },
        },
      ],
    );
  };

  // Add all to cart - Direct, no confirmation
  const handleAddAllToCart = async () => {
    if (wishlistItems.length === 0) {
      Alert.alert("Info", "Your wishlist is empty");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to cart");
      return;
    }

    setAddingAll(true);

    let addedCount = 0;
    let outOfStockCount = 0;
    let failedCount = 0;

    for (let i = 0; i < wishlistItems.length; i++) {
      const item = wishlistItems[i];
      
      try {
        // Get product stock
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
          failedCount++;
          continue;
        }
        
        const stockQuantity = productSnap.data().stockQuantity || 0;

        if (stockQuantity <= 0) {
          outOfStockCount++;
          continue;
        }

        // Check if already in cart
        const cartItemId = `${user.uid}_${item.productId}`;
        const cartDocRef = doc(db, "carts", cartItemId);
        const cartDocSnap = await getDoc(cartDocRef);

        if (cartDocSnap.exists()) {
          const currentQuantity = cartDocSnap.data().quantity || 1;
          const newQuantity = currentQuantity + 1;
          
          if (newQuantity <= stockQuantity) {
            await updateDoc(cartDocRef, {
              quantity: newQuantity,
              updatedAt: Timestamp.now(),
            });
            addedCount++;
          } else {
            outOfStockCount++;
          }
        } else {
          await setDoc(cartDocRef, {
            id: cartItemId,
            userId: user.uid,
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            sellerName: item.sellerName,
            sellerId: item.sellerId,
            quantity: 1,
            imageUrl: item.productImage || null,
            addedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          addedCount++;
        }
      } catch (error) {
        console.error("Error adding item:", error);
        failedCount++;
      }
    }

    let message = `Added ${addedCount} item(s) to cart.`;
    if (outOfStockCount > 0) message += ` ${outOfStockCount} out of stock.`;
    if (failedCount > 0) message += ` ${failedCount} failed.`;
    Alert.alert("Done", message);
    
    setAddingAll(false);
  };

  // Navigate to product
  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadWishlist();
  };

  const renderItem = ({ item }: { item: WishlistItem }) => {
    const isDeleting = deletingItemId === item.productId;
    const isAddingToCart = addingToCartId === item.productId;

    return (
      <TouchableOpacity
        style={styles.wishlistItem}
        onPress={() => navigateToProduct(item.productId)}
        activeOpacity={0.7}
        disabled={isDeleting || isAddingToCart}
      >
        <View style={styles.imagePlaceholder}>
          {item.productImage ? (
            <Image
              source={{ uri: item.productImage }}
              style={styles.productImage}
            />
          ) : (
            <Ionicons name="image-outline" size={30} color="#CCC" />
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.productName}
          </Text>
          <Text style={styles.itemSeller} numberOfLines={1}>
            {item.sellerName}
          </Text>
          <Text style={styles.itemPrice}>₱{item.productPrice}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
            disabled={isAddingToCart || isDeleting}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="cart-outline" size={18} color="#FFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveFromWishlist(item.productId, item.productName);
            }}
            disabled={isDeleting || isAddingToCart}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const user = auth.currentUser;
  if (!user && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="heart-outline" size={60} color="#E0DAD1" />
          <Text style={styles.notLoggedInText}>
            Please log in to view your wishlist
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.itemCount}>
            {wishlistItems.length} saved items
          </Text>
        </View>
      </View>

      <FlatList
        data={wishlistItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.wishlistList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
        ListFooterComponent={
          wishlistItems.length > 0 ? (
            <View style={styles.footerContainer}>
              <TouchableOpacity
                style={[styles.addAllButton, addingAll && styles.addAllButtonDisabled]}
                onPress={handleAddAllToCart}
                disabled={addingAll}
              >
                {addingAll ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.addAllButtonText}>Adding to Cart...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={18} color="#FFF" />
                    <Text style={styles.addAllButtonText}>
                      Add All to Cart ({wishlistItems.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWishlist}>
            <Ionicons name="heart-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyWishlistText}>Your wishlist is empty</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/(tabs)/browse")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: "#8F796F",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  notLoggedInText: {
    fontSize: 16,
    color: "#8F796F",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  wishlistList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  wishlistItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    marginRight: 12,
    overflow: "hidden",
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  itemSeller: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartButton: {
    backgroundColor: "#C35822",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  addAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addAllButtonDisabled: {
    opacity: 0.6,
  },
  addAllButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyWishlist: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyWishlistText: {
    fontSize: 16,
    color: "#8F796F",
    marginTop: 12,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});