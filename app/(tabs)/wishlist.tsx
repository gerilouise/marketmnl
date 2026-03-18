import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  orderBy 
} from 'firebase/firestore';

// Define the type for wishlist items
interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string | null;
  sellerName: string;
  addedAt: Timestamp;
}

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load wishlist from Firebase when screen opens
  useEffect(() => {
    loadWishlist();
  }, []);

  // Function to load wishlist from Firebase
  const loadWishlist = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        // User not logged in - redirect to login
        setLoading(false);
        return;
      }

      // Query Firebase for this user's wishlist items
      const wishlistRef = collection(db, 'wishlists');
      const q = query(
        wishlistRef, 
        where('userId', '==', user.uid),
        orderBy('addedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: WishlistItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data() as WishlistItem);
      });
      
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      Alert.alert('Error', 'Failed to load wishlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to remove item from Firebase
  const handleRemoveFromWishlist = async (productId: string, productName: string) => {
    Alert.alert(
      "Remove from Wishlist",
      `Are you sure you want to remove "${productName}" from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'Please log in');
                return;
              }

              // Delete from Firebase
              const itemId = `${user.uid}_${productId}`;
              await deleteDoc(doc(db, 'wishlists', itemId));
              
              // Update local state
              setWishlistItems(prev => prev.filter(item => item.productId !== productId));
              Alert.alert('Success', 'Item removed from wishlist');
            } catch (error) {
              console.error('Error removing from wishlist:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  // Function to add item to cart
  const handleAddToCart = (item: WishlistItem) => {
    Alert.alert(
      "Add to Cart",
      `Add ${item.productName} to your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'Please log in');
                return;
              }

              // Check if item already in cart
              const cartRef = collection(db, 'carts');
              const cartItemId = `${user.uid}_${item.productId}`;
              const cartQuery = query(cartRef, where('id', '==', cartItemId));
              const cartSnapshot = await getDocs(cartQuery);
              
              if (!cartSnapshot.empty) {
                Alert.alert('Info', 'Item already in cart');
                return;
              }

              // Add to cart collection in Firebase
              // You'll need to implement this based on your cart structure
              Alert.alert("Success", `${item.productName} added to cart`);
              
              // Optional: Remove from wishlist after adding to cart
              // await handleRemoveFromWishlist(item.productId, item.productName);
            } catch (error) {
              console.error('Error adding to cart:', error);
              Alert.alert('Error', 'Failed to add to cart');
            }
          },
        },
      ]
    );
  };

  // Function to add all items to cart
  const handleAddAllToCart = () => {
    if (wishlistItems.length === 0) return;
    
    Alert.alert(
      "Add All to Cart",
      `Add all ${wishlistItems.length} items to your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add All",
          onPress: async () => {
            try {
              // TODO: Implement batch add to cart
              Alert.alert("Success", `All ${wishlistItems.length} items added to cart`);
            } catch (error) {
              console.error('Error adding all to cart:', error);
              Alert.alert('Error', 'Failed to add items to cart');
            }
          },
        },
      ]
    );
  };

  // Navigate to product details
  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadWishlist();
  };

  // Render each wishlist item
  const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
    return (
      <TouchableOpacity 
        style={styles.wishlistItem}
        onPress={() => navigateToProduct(item.productId)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.imagePlaceholder}>
          {item.productImage ? (
            <Image source={{ uri: item.productImage }} style={styles.productImage} />
          ) : (
            <Ionicons name="image-outline" size={30} color="#CCC" />
          )}
        </View>

        {/* Product Details */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Text style={styles.itemSeller}>{item.sellerName}</Text>
          <Text style={styles.itemPrice}>₱{item.productPrice}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
          >
            <Ionicons name="cart-outline" size={18} color="#FFF" />
          </TouchableOpacity>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveFromWishlist(item.productId, item.productName);
            }}
          >
            <Ionicons name="heart" size={18} color="#C35822" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Check if user is logged in
  if (!auth.currentUser && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="heart-outline" size={60} color="#E0DAD1" />
          <Text style={styles.notLoggedInText}>Please log in to view your wishlist</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading spinner while fetching data
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.itemCount}>{wishlistItems.length} saved items</Text>
        </View>
      </View>

      {/* Wishlist Items List */}
      <FlatList
        data={wishlistItems}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.wishlistList}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          wishlistItems.length > 0 ? (
            <View style={styles.footerContainer}>
              <TouchableOpacity 
                style={styles.addAllButton}
                onPress={handleAddAllToCart}
              >
                <Ionicons name="cart-outline" size={18} color="#FFF" />
                <Text style={styles.addAllButtonText}>
                  Add All to Cart ({wishlistItems.length})
                </Text>
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
              onPress={() => router.push('/(tabs)/browse')}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  notLoggedInText: {
    fontSize: 16,
    color: "#8F796F",
    textAlign: 'center',
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
    position: "relative",
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
    position: "absolute",
    bottom: 12,
    right: 12,
    gap: 8,
  },
  cartButton: {
    backgroundColor: "#C35822",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C35822",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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