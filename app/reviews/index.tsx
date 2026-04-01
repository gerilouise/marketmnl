import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ReviewItem {
  id: string;
  userId: string;
  userEmail: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function MyReviewsScreen() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  const loadReviews = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const reviewsList: ReviewItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviewsList.push({ id: doc.id, ...data } as ReviewItem);
      });

      reviewsList.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );
      setReviews(reviewsList);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  // ========== DIRECT DELETE TEST FUNCTION ==========
  const directDeleteTest = async () => {
    if (!selectedReview) return;

    const reviewId = selectedReview.id;
    const productName = selectedReview.productName;

    setDeletingId(reviewId);
    setShowConfirmModal(false);

    try {
      console.log("=== DIRECT DELETE TEST (REVIEW) ===");
      await deleteDoc(doc(db, "reviews", reviewId));
      await loadReviews();
      Alert.alert("Success", `Review for "${productName}" removed`);
    } catch (error: any) {
      console.error("❌ Direct delete failed:", error);
      Alert.alert("Error", "Failed to delete review");
    } finally {
      setDeletingId(null);
      setSelectedReview(null);
    }
  };
  // =================================================

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={14}
          color="#FFD700"
        />
      ))}
    </View>
  );

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    return timestamp
      .toDate()
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
  };

  const renderReviewItem = ({ item }: { item: ReviewItem }) => {
    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeaderRow}>
          <TouchableOpacity
            style={styles.productInfo}
            onPress={() => router.push(`/product/${item.productId}`)}
          >
            <View style={styles.productImagePlaceholder}>
              {item.productImage ? (
                <Image
                  source={{ uri: item.productImage }}
                  style={styles.productImage}
                />
              ) : (
                <Ionicons name="image-outline" size={20} color="#CCC" />
              )}
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={styles.productSeller}>from {item.sellerName}</Text>
            </View>
          </TouchableOpacity>

          {/* THE TEST BUTTON - Mirroring Addresses.tsx */}
          <TouchableOpacity
            style={styles.testDeleteButton}
            onPress={() => {
              setSelectedReview(item);
              setShowConfirmModal(true);
            }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="trash" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.reviewBody}>
          <View style={styles.metaRow}>
            {renderStars(item.rating)}
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={styles.reviewComment}>{item.comment}</Text>
          <Text style={styles.orderNumberText}>Order #{item.orderNumber}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={styles.reviewCountBadge}>
          <Text style={styles.reviewCountText}>{reviews.length}</Text>
        </View>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C35822"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        }
      />

      {/* ARE YOU SURE? MODAL */}
      <Modal transparent visible={showConfirmModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={50} color="#db0606" />
            <Text style={styles.modalTitle}>ARE YOU SURE?</Text>
            <Text style={styles.modalSubText}>
              Do you want to delete your review for "
              {selectedReview?.productName}"?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.btnNo]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.btnNoText}>NO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.btnYes]}
                onPress={directDeleteTest}
              >
                <Text style={styles.btnYesText}>YES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F4" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#32221B" },
  reviewCountBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  reviewCountText: { fontSize: 14, color: "#C35822", fontWeight: "bold" },
  listContainer: { padding: 16 },
  reviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  productInfo: { flexDirection: "row", flex: 1, alignItems: "center" },
  productImagePlaceholder: {
    width: 45,
    height: 45,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  productImage: { width: 45, height: 45 },
  productDetails: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600", color: "#32221B" },
  productSeller: { fontSize: 11, color: "#C35822" },

  // THE TEST BUTTON (Matches Addresses.tsx)
  testDeleteButton: {
    backgroundColor: "#db0606",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  reviewBody: { borderTopWidth: 1, borderTopColor: "#F5F5F5", paddingTop: 10 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  starsContainer: { flexDirection: "row", gap: 2 },
  reviewDate: { fontSize: 11, color: "#8F796F" },
  reviewComment: { fontSize: 14, color: "#444", lineHeight: 20 },
  orderNumberText: { fontSize: 10, color: "#BBB", marginTop: 8 },

  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 16, color: "#8F796F", marginTop: 12 },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: "80%",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginTop: 10,
  },
  modalSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 15,
  },
  modalActions: { flexDirection: "row", gap: 15, width: "100%" },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnNo: { backgroundColor: "#F0F0F0" },
  btnYes: { backgroundColor: "#db0606" },
  btnNoText: { color: "#32221B", fontWeight: "bold" },
  btnYesText: { color: "#FFF", fontWeight: "bold" },
});
