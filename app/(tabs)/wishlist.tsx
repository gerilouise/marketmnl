// app/(tabs)/wishlist.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Mock wishlist data
const INITIAL_WISHLIST_ITEMS = [
  {
    id: "1",
    name: "Spicy Tuyo",
    seller: "Janjan's Kitchen",
    price: 250,
    image: null,
  },
  {
    id: "2",
    name: "Spicy Tapa",
    seller: "Janjan's Kitchen",
    price: 250,
    image: null,
  },
  {
    id: "3",
    name: "Spicy Bangus",
    seller: "Janjan's Kitchen",
    price: 250,
    image: null,
  },
  {
    id: "4",
    name: "Original Tapa",
    seller: "Janjan's Kitchen",
    price: 250,
    image: null,
  },
  {
    id: "5",
    name: "Original Tahong",
    seller: "Janjan's Kitchen",
    price: 250,
    image: null,
  },
];

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState(INITIAL_WISHLIST_ITEMS);

  const removeFromWishlist = (itemId: string) => {
    Alert.alert(
      "Remove from Wishlist",
      "Are you sure you want to remove this item from your wishlist?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setWishlistItems(prev => prev.filter(item => item.id !== itemId));
          },
        },
      ]
    );
  };

  const addToCart = (itemId: string) => {
    const item = wishlistItems.find(i => i.id === itemId);
    Alert.alert("Added to Cart", `${item?.name} added to your cart`);
    // TODO: Add actual cart logic with database
  };

  const addAllToCart = () => {
    if (wishlistItems.length === 0) return;
    
    Alert.alert(
      "Add All to Cart",
      `Add all ${wishlistItems.length} items to your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add All",
          onPress: () => {
            // TODO: Add actual cart logic with database
            Alert.alert("Success", `All ${wishlistItems.length} items added to cart`);
          },
        },
      ]
    );
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderWishlistItem = ({ item }: { item: typeof INITIAL_WISHLIST_ITEMS[0] }) => {
    return (
      <TouchableOpacity 
        style={styles.wishlistItem}
        onPress={() => navigateToProduct(item.id)}
        activeOpacity={0.7}
      >
        {/* Product Image Placeholder */}
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={30} color="#CCC" />
        </View>

        {/* Product Details */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSeller}>{item.seller}</Text>
          <Text style={styles.itemPrice}>₱{item.price}</Text>
        </View>

        {/* Action Buttons Container - Positioned Lower */}
        <View style={styles.actionButtons}>
          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigation
              addToCart(item.id);
            }}
          >
            <Ionicons name="cart-outline" size={18} color="#FFF" />
          </TouchableOpacity>

          {/* Heart Icon to Remove from Wishlist */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigation
              removeFromWishlist(item.id);
            }}
          >
            <Ionicons name="heart" size={18} color="#C35822" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.itemCount}>{wishlistItems.length} saved items</Text>
        </View>
      </View>

      {/* Wishlist Items List with Footer Button */}
      <FlatList
        data={wishlistItems}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.wishlistList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          wishlistItems.length > 0 ? (
            <View style={styles.footerContainer}>
              <TouchableOpacity 
                style={styles.addAllButton}
                onPress={addAllToCart}
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
              onPress={() => router.push('/browse')}
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