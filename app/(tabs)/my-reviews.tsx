// app/(tabs)/my-reviews.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

interface Review {
  id: string;
  userId: string;
  userEmail: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category?: string;
  stockQuantity?: number;
}

export default function MyReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Load reviews from Firestore
  const loadReviews = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setReviews([]);
        setLoading(false);
        return;
      }

      console.log("Loading reviews for user:", user.uid);

      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const reviewsList: Review[] = [];

      querySnapshot.forEach((doc) => {
        reviewsList.push({ id: doc.id, ...doc.data() } as Review);
      });

      console.log(`Found ${reviewsList.length} reviews`);
      setReviews(reviewsList);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up real-time listener for reviews
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviewsList: Review[] = [];
        snapshot.forEach((doc) => {
          reviewsList.push({ id: doc.id, ...doc.data() } as Review);
        });
        setReviews(reviewsList);
        setLoading(false);
      });

      return () => unsubscribe();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchProductDetails = async (productId: string) => {
    setLoadingProduct(true);
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        return { id: productSnap.id, ...productSnap.data() } as Product;
      }
      return null;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleReviewPress = async (review: Review) => {
    setSelectedReview(review);
    const product = await fetchProductDetails(review.productId);
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? "#FFD700" : "#E0DAD1"}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <TouchableOpacity style={styles.reviewCard} onPress={() => handleReviewPress(item)}>
      <View style={styles.reviewHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.orderInfo}>Order #{item.orderNumber}</Text>
        </View>
        <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.ratingContainer}>
        {renderStars(item.rating, 14)}
        <Text style={styles.ratingText}>
          {item.rating === 5 ? "Excellent!" :
           item.rating === 4 ? "Very Good" :
           item.rating === 3 ? "Good" :
           item.rating === 2 ? "Fair" : "Poor"}
        </Text>
      </View>

      <Text style={styles.reviewComment} numberOfLines={2}>
        {item.comment}
      </Text>

      <View style={styles.sellerInfo}>
        <Ionicons name="storefront-outline" size={14} color="#8F796F" />
        <Text style={styles.sellerName}>Seller: {item.sellerName}</Text>
      </View>

      <View style={styles.tapHint}>
        <Text style={styles.tapHintText}>Tap to view full review</Text>
        <Ionicons name="chevron-forward" size={14} color="#C0B7AE" />
      </View>
    </TouchableOpacity>
  );

  const ReviewDetailModal = () => {
    if (!selectedReview) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReviewModal}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="arrow-back" size={24} color="#32221B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Review Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Image */}
              <View style={styles.modalImageContainer}>
                {selectedProduct?.imageUrl ? (
                  <Image
                    source={{ uri: selectedProduct.imageUrl }}
                    style={styles.modalProductImage}
                  />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Ionicons name="image-outline" size={60} color="#CCC" />
                  </View>
                )}
              </View>

              {/* Product Info */}
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductName}>
                  {selectedProduct?.name || selectedReview.productName}
                </Text>
                {selectedProduct && (
                  <Text style={styles.modalProductPrice}>
                    ₱{selectedProduct.price?.toLocaleString()}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.viewProductButton}
                  onPress={() => {
                    setShowReviewModal(false);
                    router.push(`/product/${selectedReview.productId}`);
                  }}
                >
                  <Text style={styles.viewProductButtonText}>View Product</Text>
                  <Ionicons name="arrow-forward" size={16} color="#C35822" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Review Section */}
              <View style={styles.modalReviewSection}>
                <Text style={styles.modalSectionTitle}>Your Review</Text>
                
                <View style={styles.modalRatingContainer}>
                  {renderStars(selectedReview.rating, 24)}
                  <Text style={styles.modalRatingLabel}>
                    {selectedReview.rating === 5 ? "Excellent!" :
                     selectedReview.rating === 4 ? "Very Good" :
                     selectedReview.rating === 3 ? "Good" :
                     selectedReview.rating === 2 ? "Fair" : "Poor"}
                  </Text>
                </View>

                <Text style={styles.modalReviewComment}>
                  {selectedReview.comment}
                </Text>

                <View style={styles.modalReviewMeta}>
                  <Text style={styles.modalReviewDate}>
                    Reviewed on {formatDate(selectedReview.createdAt)} at {formatTime(selectedReview.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Order Info */}
              <View style={styles.modalOrderSection}>
                <Text style={styles.modalSectionTitle}>Order Information</Text>
                <View style={styles.modalOrderRow}>
                  <Text style={styles.modalOrderLabel}>Order Number:</Text>
                  <Text style={styles.modalOrderValue}>{selectedReview.orderNumber}</Text>
                </View>
                <View style={styles.modalOrderRow}>
                  <Text style={styles.modalOrderLabel}>Seller:</Text>
                  <Text style={styles.modalOrderValue}>{selectedReview.sellerName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewOrderButton}
                  onPress={() => {
                    setShowReviewModal(false);
                    router.push("/(tabs)/orders");
                  }}
                >
                  <Text style={styles.viewOrderButtonText}>View Order Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#C35822" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/profile")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  if (!auth.currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/profile")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="star-outline" size={60} color="#E0DAD1" />
          <Text style={styles.notLoggedInText}>
            Please log in to view your reviews
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/profile")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reviewsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>
              Write reviews for products you've purchased
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/(tabs)/orders")}
            >
              <Text style={styles.shopButtonText}>View My Orders</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Review Detail Modal */}
      <ReviewDetailModal />
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
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  reviewCount: {
    fontSize: 12,
    color: "#8F796F",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
  reviewsList: {
    padding: 16,
    paddingBottom: 80,
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
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  orderInfo: {
    fontSize: 12,
    color: "#8F796F",
  },
  reviewDate: {
    fontSize: 11,
    color: "#8F796F",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#8F796F",
  },
  reviewComment: {
    fontSize: 14,
    color: "#32221B",
    lineHeight: 20,
    marginBottom: 12,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  sellerName: {
    fontSize: 12,
    color: "#C35822",
    fontWeight: "500",
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 4,
  },
  tapHintText: {
    fontSize: 11,
    color: "#C0B7AE",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "95%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  modalImageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  modalProductImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalProductInfo: {
    padding: 16,
    alignItems: "center",
  },
  modalProductName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32221B",
    textAlign: "center",
    marginBottom: 8,
  },
  modalProductPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C35822",
    marginBottom: 12,
  },
  viewProductButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F0EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewProductButtonText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  divider: {
    height: 8,
    backgroundColor: "#F5F5F5",
  },
  modalReviewSection: {
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  modalRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalRatingLabel: {
    fontSize: 14,
    color: "#8F796F",
  },
  modalReviewComment: {
    fontSize: 15,
    color: "#32221B",
    lineHeight: 22,
    marginBottom: 16,
  },
  modalReviewMeta: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modalReviewDate: {
    fontSize: 12,
    color: "#8F796F",
  },
  modalOrderSection: {
    padding: 16,
  },
  modalOrderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalOrderLabel: {
    fontSize: 14,
    color: "#8F796F",
  },
  modalOrderValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
  },
  viewOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viewOrderButtonText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
});