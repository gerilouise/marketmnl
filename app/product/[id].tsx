// app/product/[id].tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// Mock product data - will be replaced with database later
const PRODUCTS_DATA = {
  "1": {
    id: "1",
    brand: "GOLDEN LANES",
    name: "SPICY TUYO",
    description: "Beverage that brings you Golden Nights. Aromatic, spicy and fruity. Served with a pinch of salt.",
    netWeight: "250g",
    seller: "Janjan's Kitchen",
    sellerId: "1", // Added seller ID to link to store
    rating: 4.9,
    reviews: 120,
    origin: "Cotabato City, Mindanao",
    culturalBackground: "Pastil is a traditional Maguindanaoan dish, where seasoned rice is wrapped in banana leaves. This bottled version preserves the authentic flavors of the Bangsamoro region.",
    storage: "Keep refrigerated after opening. Best consumed within 5 days.",
    shelfLife: "6 months unopened",
    price: 250,
    category: "Bottled",
  },
  "2": {
    id: "2",
    brand: "GOLDEN LANES",
    name: "SPICY TINAPA",
    description: "Smoked fish delicacy with a spicy kick. Perfect for breakfast or as a pulutan.",
    netWeight: "200g",
    seller: "Gian's Preserved Food",
    sellerId: "2", // Added seller ID
    rating: 4.9,
    reviews: 89,
    origin: "Davao City, Mindanao",
    culturalBackground: "Tinapa is a Filipino smoked fish tradition. This spicy version adds a modern twist to a classic preservation method.",
    storage: "Keep refrigerated after opening. Best consumed within 7 days.",
    shelfLife: "4 months unopened",
    price: 250,
    category: "Dried",
  },
  "3": {
    id: "3",
    brand: "GOLDEN LANES",
    name: "SPICY BANGUS",
    description: "Milkfish marinated in special spices, smoked to perfection.",
    netWeight: "300g",
    seller: "Jangan's Kitchen",
    sellerId: "1", // Same seller as product 1
    rating: 4.9,
    reviews: 156,
    origin: "General Santos City, Mindanao",
    culturalBackground: "Bangus (milkfish) is the national fish of the Philippines. This preparation honors the traditional smoking methods of Mindanao.",
    storage: "Keep refrigerated after opening. Best consumed within 5 days.",
    shelfLife: "6 months unopened",
    price: 250,
    category: "Dried",
  },
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Get product data based on ID
  const product = PRODUCTS_DATA[id as keyof typeof PRODUCTS_DATA];

  // If product not found, show error
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#C35822" />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = () => {
    Alert.alert("Added to Cart", `${quantity} x ${product.name} added to your cart`);
    // TODO: Add actual cart logic with database
  };

  const navigateToStore = () => {
    router.push(`/store/${product.sellerId}`);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button and wishlist */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setIsWishlisted(!isWishlisted)}
            >
              <Ionicons 
                name={isWishlisted ? "heart" : "heart-outline"} 
                size={24} 
                color={isWishlisted ? "#C35822" : "#32221B"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color="#32221B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={50} color="#CCC" />
            </View>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          {/* Brand and Category */}
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{product.brand}</Text>
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
          <Text style={styles.netWeight}>Net weight: {product.netWeight}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Seller and Rating - Now clickable */}
          <TouchableOpacity 
            style={styles.sellerCard}
            onPress={navigateToStore}
            activeOpacity={0.7}
          >
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Authentic Bottled Pastil</Text>
              <View style={styles.sellerNameContainer}>
                <Text style={styles.sellerName}>{product.seller}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C35822" />
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={styles.reviewsText}>({product.reviews})</Text>
            </View>
          </TouchableOpacity>

          {/* Product Details Section */}
          <View style={styles.detailsCard}>
            {/* Product Origin */}
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location-outline" size={18} color="#C35822" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Product Origin</Text>
                <Text style={styles.detailValue}>{product.origin}</Text>
              </View>
            </View>

            {/* Cultural Background */}
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="leaf-outline" size={18} color="#C35822" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Cultural Background</Text>
                <Text style={styles.detailValue}>{product.culturalBackground}</Text>
              </View>
            </View>

            {/* Storage */}
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="snow-outline" size={18} color="#C35822" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Storage</Text>
                <Text style={styles.detailValue}>{product.storage}</Text>
              </View>
            </View>

            {/* Shelf Life */}
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time-outline" size={18} color="#C35822" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Shelf Life</Text>
                <Text style={styles.detailValue}>{product.shelfLife}</Text>
              </View>
            </View>
          </View>

          {/* Bottom padding for Add to Cart button */}
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