// app/(seller)/products.tsx
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
import { router } from "expo-router";

// Mock products data
const PRODUCTS_DATA = [
  {
    id: "1",
    name: "Authentic Bottled Spicy Tuyo",
    description: "Bottled Spicy Tuyo",
    rating: 4.8,
    reviews: 234,
    price: 250.00,
    category: "All",
    image: null,
  },
  {
    id: "2",
    name: "Authentic Bottled Pastil",
    description: "Bottled Pastil",
    rating: 4.6,
    reviews: 156,
    price: 250.00,
    category: "Specials",
    image: null,
  },
  {
    id: "3",
    name: "Authentic Bottled Spicy Flakes",
    description: "Bottled Spicy Pastil Flakes",
    rating: 4.7,
    reviews: 170,
    price: 250.00,
    category: "Seafood",
    image: null,
  },
];

const CATEGORIES = ["All", "Specials", "Seafood"];

export default function SellerProductsScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState(PRODUCTS_DATA);

  const filteredProducts = products.filter(product => 
    selectedCategory === "All" ? true : product.category === selectedCategory
  );

  const handleAddProduct = () => {
    router.push("/seller/products-add");
  };

  const handleEditProduct = (productId: string) => {
    Alert.alert("Edit Product", `Edit product ${productId}`);
    // router.push(`/seller/products-edit/${productId}`);
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setProducts(prev => prev.filter(p => p.id !== productId));
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: typeof PRODUCTS_DATA[0] }) => (
    <View style={styles.productCard}>
      {/* Product Image Placeholder */}
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="image-outline" size={40} color="#CCC" />
      </View>

      {/* Product Details */}
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews})</Text>
        </View>

        {/* Price */}
        <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
      </View>

      {/* Action Buttons - Bottom Right */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditProduct(item.id)}
        >
          <Ionicons name="create-outline" size={18} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesScrollContent}
      >
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No products found</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesScrollContent: {
    alignItems: "center",
  },
  categoriesContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    alignItems: "center",
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  categoryChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#32221B",
    marginLeft: 2,
  },
  reviewsText: {
    fontSize: 12,
    color: "#8F796F",
    marginLeft: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  actionButtons: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8F796F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#8F796F",
    marginTop: 12,
  },
});