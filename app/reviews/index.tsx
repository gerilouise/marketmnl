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

// Mock reviews data
const REVIEWS_DATA = [
  {
    id: "1",
    productName: "Spicy Tuyo",
    productImage: null,
    rating: 5,
    date: "March 3, 2026",
    comment: "Authentic taste! Just like how my lola makes it. Will definitely order again.",
    seller: "Janjan's Kitchen",
  },
  {
    id: "2",
    productName: "Spicy Bangus",
    productImage: null,
    rating: 4,
    date: "February 28, 2026",
    comment: "Good quality and fresh. The spiciness level is perfect.",
    seller: "Jangan's Kitchen",
  },
  {
    id: "3",
    productName: "Original Tapa",
    productImage: null,
    rating: 5,
    date: "February 15, 2026",
    comment: "Best tapa I've tried! Sweet and savory. Will buy again.",
    seller: "Gian's Preserved Food",
  },
];

export default function MyReviewsScreen() {
  const [reviews, setReviews] = useState(REVIEWS_DATA);

  const deleteReview = (id: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setReviews(prev => prev.filter(review => review.id !== id));
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: typeof REVIEWS_DATA[0] }) => (
    <View style={styles.reviewCard}>
      {/* Product Info */}
      <TouchableOpacity 
        style={styles.productInfo}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={24} color="#CCC" />
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.productSeller}>{item.seller}</Text>
        </View>
      </TouchableOpacity>

      {/* Review Content */}
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          {renderStars(item.rating)}
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert("Edit", "Edit review")}
        >
          <Ionicons name="create-outline" size={18} color="#8F796F" />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteReview(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Review Count */}
      <Text style={styles.reviewCount}>
        You have {reviews.length} product {reviews.length === 1 ? "review" : "reviews"}
      </Text>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No reviews yet</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)/browse')}
            >
              <Text style={styles.shopButtonText}>Shop Now</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  reviewCount: {
    fontSize: 14,
    color: "#8F796F",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    flexDirection: "row",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  productDetails: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  productSeller: {
    fontSize: 12,
    color: "#8F796F",
  },
  reviewContent: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#8F796F",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editText: {
    fontSize: 14,
    color: "#8F796F",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteText: {
    fontSize: 14,
    color: "#FF3B30",
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