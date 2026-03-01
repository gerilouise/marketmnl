// app/store/[id].tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// Mock store data - would come from database
const STORES_DATA = {
  "1": {
    id: "1",
    name: "Janjan's Kitchen",
    location: "Quezon City, Metro Manila",
    rating: 4.9,
    reviews: 280,
    products: 8,
    description: "Premium bottled preservatives and dried products.",
    categories: ["Dried Fish", "Meat Jerky", "Bottled"],
    isFollowing: false,
    image: null,
  },
  "2": {
    id: "2",
    name: "Gian's Preserved Food",
    location: "Manila, Metro Manila",
    rating: 4.8,
    reviews: 156,
    products: 12,
    description: "Authentic Filipino preserved foods since 2010.",
    categories: ["Dried Fish", "Bottled", "Spicy"],
    isFollowing: false,
    image: null,
  },
};

// Mock products for this store
const STORE_PRODUCTS = [
  {
    id: "1",
    name: "Spicy Tuyo",
    price: 250,
    rating: 4.9,
    image: null,
  },
  {
    id: "2",
    name: "Spicy Bangus",
    price: 250,
    rating: 4.9,
    image: null,
  },
  {
    id: "3",
    name: "Spicy Tuyo",
    price: 250,
    rating: 4.9,
    image: null,
  },
  {
    id: "4",
    name: "Spicy Tuyo",
    price: 250,
    rating: 4.9,
    image: null,
  },
];

export default function StoreScreen() {
  const { id } = useLocalSearchParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [wishlist, setWishlist] = useState({}); // Track wishlist items

  // Get store data based on ID
  const store = STORES_DATA[id as keyof typeof STORES_DATA];

  // If store not found, show error
  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="storefront-outline" size={60} color="#C35822" />
        <Text style={styles.errorText}>Store not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      isFollowing ? "Unfollowed" : "Following",
      isFollowing 
        ? `You are no longer following ${store.name}`
        : `You are now following ${store.name}`
    );
  };

  const handleChat = () => {
    Alert.alert("Chat", `Start chat with ${store.name}`);
    // Navigate to chat screen
  };

  const handleShare = () => {
    Alert.alert("Share", `Share ${store.name} store`);
    // Implement share functionality
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    
    const action = wishlist[productId] ? "removed from" : "added to";
    Alert.alert("Wishlist", `Item ${action} wishlist`);
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderProductItem = ({ item }: { item: typeof STORE_PRODUCTS[0] }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigateToProduct(item.id)}
    >
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="image-outline" size={30} color="#CCC" />
        {/* Heart icon for wishlist */}
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigation
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
      <Text style={styles.productName}>{item.name}</Text>
      <View style={styles.productRow}>
        <Text style={styles.productPrice}>₱{item.price}</Text>
        <View style={styles.productRating}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button, title, and share */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#32221B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store Banner/Image Placeholder */}
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="image-outline" size={50} color="#CCC" />
        </View>

        {/* Store Info */}
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#8F796F" />
            <Text style={styles.infoText}> {store.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.infoText}> {store.rating} ({store.reviews} reviews)</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color="#8F796F" />
            <Text style={styles.infoText}> {store.products} products</Text>
          </View>

          <Text style={styles.description}>{store.description}</Text>

          {/* Category Chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            <View style={styles.categoriesContainer}>
              {store.categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive
                  ]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
              <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
              <Text style={styles.chatButtonText}>Chat Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]} 
              onPress={handleFollow}
            >
              <Ionicons 
                name={isFollowing ? "checkmark" : "add-outline"} 
                size={18} 
                color={isFollowing ? "#FFF" : "#C35822"} 
              />
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.productsHeader}>
            <Text style={styles.productsTitle}>Products ({store.products})</Text>
          </View>

          <View style={styles.productsGrid}>
            {STORE_PRODUCTS.map((item) => (
              <View key={item.id} style={styles.productWrapper}>
                {renderProductItem({ item })}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Padding */}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#32221B",
    marginTop: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonText: {
    color: "#C35822",
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerPlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#EFEAE4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  storeInfo: {
    padding: 16,
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 20,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 8,
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
  },
  chatButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 12,
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
    paddingVertical: 12,
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
  followButtonText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#FFF",
  },
  productsSection: {
    padding: 16,
  },
  productsHeader: {
    marginBottom: 12,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  bottomPadding: {
    height: 20,
  },
});