// app/product/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  imageUrl: string | null;
  sellerId: string;
  sellerName?: string;
  storeName?: string; // Store name from stores collection
  rating?: number;
  reviews?: number;
  createdAt: any;
  netWeight?: string;
  origin?: string;
  culturalBackground?: string;
  storage?: string;
  shelfLife?: string;
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>("");

  // Load product data from Firebase
  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const productRef = doc(db, 'products', id as string);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = { id: productSnap.id, ...productSnap.data() } as Product;
        setProduct(productData);
        
        // Load store info from stores collection (not users)
        if (productData.sellerId) {
          const storeRef = doc(db, 'stores', productData.sellerId);
          const storeSnap = await getDoc(storeRef);
          if (storeSnap.exists()) {
            const storeData = storeSnap.data();
            setStoreName(storeData.storeName || productData.sellerName || "MarketMNL");
          } else {
            setStoreName(productData.sellerName || "MarketMNL");
          }
        }
        
        // Check if product is in wishlist
        await checkWishlistStatus();
      } else {
        Alert.alert("Error", "Product not found");
        router.back();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert("Error", "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const wishlistRef = collection(db, 'wishlists');
      const itemId = `${user.uid}_${id}`;
      const docRef = doc(wishlistRef, itemId);
      const docSnap = await getDoc(docRef);
      setIsWishlisted(docSnap.exists());
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleAddToCart = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to cart", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") }
      ]);
      return;
    }

    try {
      const cartRef = collection(db, 'carts');
      const cartItemId = `${user.uid}_${product?.id}`;
      const docRef = doc(cartRef, cartItemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Update quantity
        const currentQty = docSnap.data().quantity;
        await updateDoc(docRef, {
          quantity: currentQty + quantity,
          updatedAt: Timestamp.now()
        });
      } else {
        // Add new item
        await addDoc(cartRef, {
          id: cartItemId,
          userId: user.uid,
          productId: product?.id,
          productName: product?.name,
          productPrice: product?.price,
          sellerName: storeName, // Use store name here
          quantity: quantity,
          imageUrl: product?.imageUrl,
          addedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      Alert.alert("Success", `${quantity} x ${product?.name} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert("Error", "Failed to add to cart");
    }
  };

  const handleToggleWishlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to wishlist", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") }
      ]);
      return;
    }

    try {
      const wishlistRef = collection(db, 'wishlists');
      const itemId = `${user.uid}_${product?.id}`;
      const docRef = doc(wishlistRef, itemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Remove from wishlist
        await deleteDoc(docRef);
        setIsWishlisted(false);
        Alert.alert("Removed", `${product?.name} removed from wishlist`);
      } else {
        // Add to wishlist
        await addDoc(wishlistRef, {
          id: itemId,
          userId: user.uid,
          productId: product?.id,
          productName: product?.name,
          productPrice: product?.price,
          sellerName: storeName, // Use store name here
          imageUrl: product?.imageUrl,
          addedAt: Timestamp.now()
        });
        setIsWishlisted(true);
        Alert.alert("Added", `${product?.name} added to wishlist`);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      Alert.alert("Error", "Failed to update wishlist");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product?.name} from ${storeName} on MarketMNL! ₱${product?.price}\n\n${product?.description}\n\nGet it here: ${Platform.OS === 'ios' ? 'marketmnl://product/' + product?.id : 'https://marketmnl.com/product/' + product?.id}`,
        title: product?.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const navigateToStore = () => {
    if (product?.sellerId) {
      router.push(`/store/${product.sellerId}`);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#C35822" />
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button, wishlist and share */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleToggleWishlist}
            >
              <Ionicons 
                name={isWishlisted ? "heart" : "heart-outline"} 
                size={24} 
                color={isWishlisted ? "#C35822" : "#32221B"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#32221B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={50} color="#CCC" />
              </View>
            )}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          {/* Brand and Category */}
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{storeName || "MarketMNL"}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>
          
          {/* Product Name and Price Row */}
          <View style={styles.namePriceRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>₱{product.price}</Text>
          </View>
          
          {/* Description */}
          <Text style={styles.description}>{product.description}</Text>
          
          {/* Net Weight */}
          {product.netWeight && (
            <Text style={styles.netWeight}>Net weight: {product.netWeight}</Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Seller and Rating - Clickable */}
          <TouchableOpacity 
            style={styles.sellerCard}
            onPress={navigateToStore}
            activeOpacity={0.7}
          >
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Store</Text>
              <View style={styles.sellerNameContainer}>
                <Text style={styles.sellerName}>{storeName || "MarketMNL"}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C35822" />
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating || 4.5}</Text>
              <Text style={styles.reviewsText}>({product.reviews || 0})</Text>
            </View>
          </TouchableOpacity>

          {/* Product Details Section */}
          <View style={styles.detailsCard}>
            {product.origin && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Product Origin</Text>
                  <Text style={styles.detailValue}>{product.origin}</Text>
                </View>
              </View>
            )}

            {product.culturalBackground && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="leaf-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Cultural Background</Text>
                  <Text style={styles.detailValue}>{product.culturalBackground}</Text>
                </View>
              </View>
            )}

            {product.storage && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="snow-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Storage</Text>
                  <Text style={styles.detailValue}>{product.storage}</Text>
                </View>
              </View>
            )}

            {product.shelfLife && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="time-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Shelf Life</Text>
                  <Text style={styles.detailValue}>{product.shelfLife}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar with Quantity and Add to Cart */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
            <Ionicons name="remove" size={20} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton}>
            <Ionicons name="add" size={20} color="#32221B" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#FFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
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
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  imageWrapper: {
    position: "relative",
  },
  productImage: {
    width: 280,
    height: 280,
    borderRadius: 24,
  },
  imagePlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: "#EFEAE4",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: "#8F796F",
    letterSpacing: 1,
  },
  categoryTag: {
    backgroundColor: "#E0DAD1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#32221B",
    fontWeight: "500",
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#C35822",
    marginLeft: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 4,
  },
  netWeight: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0DAD1",
    marginVertical: 20,
  },
  sellerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  sellerNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerName: {
    fontSize: 14,
    color: "#C35822",
    marginRight: 4,
    textDecorationLine: "underline",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: "#8F796F",
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#32221B",
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FBF8F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0DAD1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0DAD1",
    borderRadius: 20,
    padding: 5,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    paddingHorizontal: 12,
  },
  addToCartButton: {
    flexDirection: "row",
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});