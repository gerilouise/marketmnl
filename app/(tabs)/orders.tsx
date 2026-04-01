// app/(tabs)/orders.tsx
import { auth, db } from "@/lib/firebase";
import { createNotification, getOrderNotification } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  sellerName: string;
  sellerId?: string;
  imageUrl?: string;
  hasReviewed?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  address: {
    fullName: string;
    phone: string;
    street: string;
    barangay: string;
    city: string;
    province: string;
    zipCode: string;
    label: string;
  };
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  userEmail: string;
}

type OrderStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

const STATUS_TABS: { id: OrderStatus; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "list-outline" },
  { id: "pending", label: "Pending", icon: "time-outline" },
  { id: "confirmed", label: "Confirmed", icon: "checkmark-circle-outline" },
  { id: "shipped", label: "Shipped", icon: "car-outline" },
  {
    id: "delivered",
    label: "Delivered",
    icon: "checkmark-done-circle-outline",
  },
  { id: "cancelled", label: "Cancelled", icon: "close-circle-outline" },
];

// Separate Review Modal Component to prevent re-renders
const ReviewModalComponent = React.memo(
  ({
    visible,
    product,
    order,
    onClose,
    onSubmit,
  }: {
    visible: boolean;
    product: OrderItem | null;
    order: Order | null;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
  }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Reset state when modal opens
    React.useEffect(() => {
      if (visible) {
        setRating(0);
        setComment("");
      }
    }, [visible]);

    if (!visible || !product) return null;

    const renderStars = () => {
      return (
        <View style={styles.reviewStarsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color={star <= rating ? "#FFD700" : "#E0DAD1"}
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    };

    const handleSubmit = async () => {
      if (rating === 0) {
        Alert.alert("Error", "Please select a rating");
        return;
      }

      if (!comment.trim()) {
        Alert.alert("Error", "Please write a review comment");
        return;
      }

      if (comment.trim().length < 10) {
        Alert.alert("Error", "Please write at least 10 characters");
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(rating, comment.trim());
        onClose();
      } catch (error) {
        console.error("Error submitting review:", error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product Info */}
              <View style={styles.reviewProductInfo}>
                <View style={styles.reviewProductImagePlaceholder}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.reviewProductImage}
                    />
                  ) : (
                    <Ionicons name="image-outline" size={32} color="#CCC" />
                  )}
                </View>
                <View style={styles.reviewProductDetails}>
                  <Text style={styles.reviewProductName}>
                    {product.productName}
                  </Text>
                  <Text style={styles.reviewProductQuantity}>
                    Quantity: {product.quantity}
                  </Text>
                  <Text style={styles.reviewProductSeller}>
                    Seller: {product.sellerName}
                  </Text>
                </View>
              </View>

              {/* Rating Section */}
              <View style={styles.reviewRatingSection}>
                <Text style={styles.reviewRatingLabel}>Your Rating</Text>
                {renderStars()}
                <Text style={styles.reviewRatingHint}>
                  {rating === 0 && "Tap to rate"}
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent!"}
                </Text>
              </View>

              {/* Comment Section */}
              <View style={styles.reviewCommentSection}>
                <Text style={styles.reviewCommentLabel}>Your Review</Text>
                <TextInput
                  style={styles.reviewCommentInput}
                  multiline
                  numberOfLines={5}
                  placeholder="Share your experience with this product..."
                  placeholderTextColor="#8F796F"
                  value={comment}
                  onChangeText={setComment}
                  textAlignVertical="top"
                />
                <Text style={styles.reviewCommentHint}>
                  Minimum 10 characters
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.reviewSubmitButton,
                  (rating === 0 ||
                    !comment.trim() ||
                    comment.trim().length < 10 ||
                    submitting) &&
                    styles.reviewSubmitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={
                  rating === 0 ||
                  !comment.trim() ||
                  comment.trim().length < 10 ||
                  submitting
                }
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.reviewSubmitButtonText}>
                    Submit Review
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

ReviewModalComponent.displayName = "ReviewModalComponent";

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(
    null,
  );
  const [selectedOrderForReview, setSelectedOrderForReview] =
    useState<Order | null>(null);

  // Function to check if a product has been reviewed
  const checkIfReviewed = async (
    userId: string,
    productId: string,
    orderId: string,
  ) => {
    try {
      const reviewsRef = collection(db, "reviews");
      // Check for reviews with matching userId, productId, AND orderId
      const q = query(
        reviewsRef,
        where("userId", "==", userId),
        where("productId", "==", productId),
        where("orderId", "==", orderId),
      );
      const querySnapshot = await getDocs(q);
      const hasReview = !querySnapshot.empty;
      console.log(
        `Checking review for product ${productId} in order ${orderId}: ${hasReview}`,
      );
      return hasReview;
    } catch (error) {
      console.error("Error checking review status:", error);
      return false;
    }
  };

  // Function to load orders with review status
  const loadOrders = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setOrders([]);
        setFilteredOrders([]);
        setLoading(false);
        return;
      }

      console.log("🔄 Loading orders for user:", user.uid);

      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user.uid));
      const ordersSnapshot = await getDocs(q);

      const ordersList: Order[] = [];

      // For each order, check which items have been reviewed
      for (const docSnapshot of ordersSnapshot.docs) {
        const data = docSnapshot.data();
        const order = { id: docSnapshot.id, ...data } as Order;

        console.log(`Processing order ${order.id} with status ${order.status}`);

        // Check review status for each item in the order
        const itemsWithReviewStatus = await Promise.all(
          order.items.map(async (item) => {
            const hasReviewed = await checkIfReviewed(
              user.uid,
              item.productId,
              order.id,
            );
            return { ...item, hasReviewed };
          }),
        );

        ordersList.push({
          ...order,
          items: itemsWithReviewStatus,
        });
      }

      ordersList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      console.log("✅ Total orders found:", ordersList.length);
      // Log review status for debugging
      ordersList.forEach((order) => {
        order.items.forEach((item) => {
          console.log(
            `Product ${item.productName} in order ${order.orderNumber}: hasReviewed = ${item.hasReviewed}`,
          );
        });
      });

      setOrders(ordersList);
      filterOrders(activeTab, ordersList);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = (status: OrderStatus, ordersList: Order[]) => {
    if (status === "all") {
      setFilteredOrders(ordersList);
    } else {
      const filtered = ordersList.filter((o) => o.status === status);
      setFilteredOrders(filtered);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, []),
  );

  const handleTabChange = (tabId: OrderStatus) => {
    setActiveTab(tabId);
    filterOrders(tabId, orders);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "confirmed":
        return "#4CAF50";
      case "shipped":
        return "#2196F3";
      case "delivered":
        return "#9C27B0";
      case "cancelled":
        return "#F44336";
      default:
        return "#8F796F";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting for seller to confirm your order";
      case "confirmed":
        return "Order confirmed! Preparing your items for shipment";
      case "shipped":
        return "Your order is on the way!";
      case "delivered":
        return "Order delivered. Thank you for shopping!";
      case "cancelled":
        return "Order cancelled";
      default:
        return "";
    }
  };

  // Handle cancel confirmation
  const showCancelConfirmationDialog = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelConfirmation(true);
  };

  // Execute the cancellation
  // Execute the cancellation
  const executeCancel = async () => {
    if (!orderToCancel) return;

    setShowCancelConfirmation(false);
    setCancellingOrderId(orderToCancel.id);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      const orderRef = doc(db, "orders", orderToCancel.id);
      await updateDoc(orderRef, {
        status: "cancelled",
        updatedAt: Timestamp.now(),
      });

      // Create notification for cancellation
      const notification = getOrderNotification(
        orderToCancel.orderNumber,
        "cancelled",
      );
      if (notification) {
        await createNotification({
          userId: user.uid,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          orderId: orderToCancel.id,
          orderNumber: orderToCancel.orderNumber,
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      console.log("✅ Order cancelled successfully!");

      // Refresh orders
      await loadOrders();

      Alert.alert(
        "Success",
        `Order ${orderToCancel.orderNumber} has been cancelled`,
      );
    } catch (error: any) {
      console.error("❌ Cancel failed:", error);
      Alert.alert("Error", error.message);
    } finally {
      setCancellingOrderId(null);
      setOrderToCancel(null);
    }
  };

  // Handle review button click
  const openReviewModal = (order: Order, product: OrderItem) => {
    // Prevent opening review modal if already reviewed
    if (product.hasReviewed) {
      Alert.alert(
        "Already Reviewed",
        "You have already reviewed this product.",
      );
      return;
    }
    setSelectedOrderForReview(order);
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  // Submit review
  const submitReview = async (rating: number, comment: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      // Double-check if review already exists
      const alreadyReviewed = await checkIfReviewed(
        user.uid,
        selectedProduct?.productId || "",
        selectedOrderForReview?.id || "",
      );

      if (alreadyReviewed) {
        Alert.alert("Error", "You have already reviewed this product.");
        throw new Error("Already reviewed");
      }

      // Create review object
      const reviewData = {
        userId: user.uid,
        userEmail: user.email,
        orderId: selectedOrderForReview?.id,
        orderNumber: selectedOrderForReview?.orderNumber,
        productId: selectedProduct?.productId,
        productName: selectedProduct?.productName,
        sellerId: selectedProduct?.sellerId,
        sellerName: selectedProduct?.sellerName,
        rating: rating,
        comment: comment,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log("Submitting review:", reviewData);

      // Save review to Firestore
      const reviewsRef = collection(db, "reviews");
      await addDoc(reviewsRef, reviewData);

      Alert.alert("Success", "Thank you for your review!");

      // Clear selected product and order
      setSelectedProduct(null);
      setSelectedOrderForReview(null);

      // Refresh orders to update review status
      await loadOrders();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (error.message !== "Already reviewed") {
        Alert.alert("Error", "Failed to submit review. Please try again.");
      }
      throw error;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isCancelling = cancellingOrderId === item.id;
    const mainProduct = item.items?.[0];
    const otherItemsCount = item.items ? item.items.length - 1 : 0;
    const allProductsReviewed = item.items?.every(
      (i) => i.hasReviewed === true,
    );

    if (!mainProduct) {
      return (
        <View style={styles.orderCard}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.errorText}>No items found</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => openOrderDetails(item)}
        activeOpacity={0.7}
        disabled={isCancelling}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.productName}>
          {mainProduct.productName} x{mainProduct.quantity}
          {otherItemsCount > 0 && ` +${otherItemsCount} more`}
        </Text>

        <View style={styles.orderFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>₱{item.total.toFixed(2)}</Text>
          </View>
          <View style={styles.buttonRow}>
            {item.status === "pending" && !isCancelling && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={(e) => {
                  e.stopPropagation();
                  showCancelConfirmationDialog(item);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            {item.status === "shipped" && (
              <TouchableOpacity
                style={styles.trackButton}
                onPress={(e) => {
                  e.stopPropagation();
                  Alert.alert(
                    "Track Order",
                    `Tracking info for ${item.orderNumber}`,
                  );
                }}
              >
                <Text style={styles.trackButtonText}>Track</Text>
              </TouchableOpacity>
            )}
            {item.status === "delivered" && (
              <TouchableOpacity
                style={[
                  styles.reviewButton,
                  allProductsReviewed && styles.reviewedButton,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (allProductsReviewed) {
                    Alert.alert(
                      "Already Reviewed",
                      "All items in this order have been reviewed.",
                    );
                    return;
                  }
                  // Show product selection for review
                  if (item.items.length === 1) {
                    // If only one product, review directly
                    openReviewModal(item, item.items[0]);
                  } else {
                    // If multiple products, show product selection
                    const unreviewedProducts = item.items.filter(
                      (p) => !p.hasReviewed,
                    );
                    if (unreviewedProducts.length === 0) {
                      Alert.alert(
                        "Already Reviewed",
                        "All items have been reviewed.",
                      );
                      return;
                    }
                    Alert.alert(
                      "Select Product to Review",
                      "Which product would you like to review?",
                      unreviewedProducts.map((product) => ({
                        text: `${product.productName} x${product.quantity}`,
                        onPress: () => openReviewModal(item, product),
                      })),
                    );
                  }
                }}
              >
                <Ionicons
                  name={
                    allProductsReviewed ? "checkmark-circle" : "star-outline"
                  }
                  size={14}
                  color={allProductsReviewed ? "#4CAF50" : "#32221B"}
                />
                <Text
                  style={[
                    styles.reviewButtonText,
                    allProductsReviewed && styles.reviewedButtonText,
                  ]}
                >
                  {allProductsReviewed ? "Reviewed" : "Review"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statusMessageContainer}>
          <Ionicons
            name={
              item.status === "delivered"
                ? "checkmark-done-circle"
                : item.status === "shipped"
                  ? "car"
                  : item.status === "cancelled"
                    ? "close-circle"
                    : "time-outline"
            }
            size={14}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[
              styles.statusMessageText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {getStatusMessage(item.status)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Cancel Confirmation Modal Component
  const CancelConfirmationModal = () => {
    if (!showCancelConfirmation || !orderToCancel) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCancelConfirmation}
        onRequestClose={() => setShowCancelConfirmation(false)}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationIconContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            </View>

            <Text style={styles.confirmationTitle}>Cancel Order?</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to cancel order {orderToCancel.orderNumber}?
              This action cannot be undone.
            </Text>

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.confirmationNoButton}
                onPress={() => {
                  setShowCancelConfirmation(false);
                  setOrderToCancel(null);
                }}
              >
                <Text style={styles.confirmationNoButtonText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmationYesButton}
                onPress={executeCancel}
              >
                <Text style={styles.confirmationYesButtonText}>
                  Yes, Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Order Details Modal Component
  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    const canCancel = selectedOrder.status === "pending";

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showOrderModal}
        onRequestClose={closeOrderModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity
                onPress={closeOrderModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order Number */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order #</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.orderNumber}
                </Text>
              </View>

              {/* Order Date */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedOrder.createdAt)}
                </Text>
              </View>

              {/* Payment Method */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.paymentMethod}
                </Text>
              </View>

              {/* Order Status */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        getStatusColor(selectedOrder.status) + "20",
                      alignSelf: "flex-start",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(selectedOrder.status) },
                    ]}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </Text>
                </View>
              </View>

              {/* Status Message */}
              <View style={styles.modalStatusMessage}>
                <Ionicons
                  name={
                    selectedOrder.status === "delivered"
                      ? "checkmark-done-circle"
                      : selectedOrder.status === "shipped"
                        ? "car"
                        : selectedOrder.status === "cancelled"
                          ? "close-circle"
                          : "time-outline"
                  }
                  size={16}
                  color={getStatusColor(selectedOrder.status)}
                />
                <Text
                  style={[
                    styles.modalStatusMessageText,
                    { color: getStatusColor(selectedOrder.status) },
                  ]}
                >
                  {getStatusMessage(selectedOrder.status)}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Order Summary Title */}
              <Text style={styles.orderSummaryTitle}>Order Summary</Text>

              {/* Items List with Individual Review Buttons */}
              {selectedOrder.items?.map((item, index) => (
                <View key={index} style={styles.orderSummaryItemWithReview}>
                  <View style={styles.orderSummaryLeft}>
                    <Text style={styles.orderSummaryName} numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text style={styles.orderSummaryQuantity}>
                      Qty: {item.quantity}
                    </Text>
                    <Text style={styles.orderSummarySeller}>
                      Seller: {item.sellerName}
                    </Text>
                  </View>
                  <View style={styles.orderSummaryRight}>
                    <Text style={styles.orderSummaryPrice}>
                      ₱{(item.productPrice * item.quantity).toFixed(2)}
                    </Text>
                    {selectedOrder.status === "delivered" && (
                      <TouchableOpacity
                        style={[
                          styles.reviewButtonSmall,
                          item.hasReviewed === true &&
                            styles.reviewedButtonSmall,
                        ]}
                        onPress={() => {
                          if (item.hasReviewed === true) {
                            Alert.alert(
                              "Already Reviewed",
                              "You have already reviewed this product.",
                            );
                            return;
                          }
                          closeOrderModal();
                          openReviewModal(selectedOrder, item);
                        }}
                      >
                        <Ionicons
                          name={
                            item.hasReviewed === true
                              ? "checkmark-circle"
                              : "star-outline"
                          }
                          size={14}
                          color={item.hasReviewed === true ? "#4CAF50" : "#FFF"}
                        />
                        <Text
                          style={[
                            styles.reviewButtonSmallText,
                            item.hasReviewed === true &&
                              styles.reviewedButtonSmallText,
                          ]}
                        >
                          {item.hasReviewed === true ? "Reviewed" : "Review"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Subtotal */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtotal</Text>
                <Text style={styles.detailValue}>
                  ₱{selectedOrder.subtotal.toFixed(2)}
                </Text>
              </View>

              {/* Shipping Fee */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shipping Fee</Text>
                <Text style={styles.detailValue}>
                  ₱{selectedOrder.shippingFee.toFixed(2)}
                </Text>
              </View>

              {/* Total */}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabelModal}>Total</Text>
                <Text style={styles.totalAmountModal}>
                  ₱{selectedOrder.total.toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Address Section */}
              {selectedOrder.address && (
                <View style={styles.addressSection}>
                  <Text style={styles.addressTitle}>Shipping Address</Text>
                  <Text style={styles.addressName}>
                    {selectedOrder.address.fullName}
                  </Text>
                  <Text style={styles.addressPhone}>
                    {selectedOrder.address.phone}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedOrder.address.street},{" "}
                    {selectedOrder.address.barangay},{" "}
                    {selectedOrder.address.city},{" "}
                    {selectedOrder.address.province}{" "}
                    {selectedOrder.address.zipCode}
                  </Text>
                  <Text style={styles.addressLabel}>
                    Label: {selectedOrder.address.label}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              {canCancel && (
                <TouchableOpacity
                  style={styles.cancelButtonModal}
                  onPress={() => {
                    closeOrderModal();
                    showCancelConfirmationDialog(selectedOrder);
                  }}
                >
                  <Text style={styles.cancelButtonTextModal}>Cancel Order</Text>
                </TouchableOpacity>
              )}
            </View>
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
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
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
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="receipt-outline" size={60} color="#E0DAD1" />
          <Text style={styles.notLoggedInText}>
            Please log in to view your orders
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
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.orderCount}>{filteredOrders.length} orders</Text>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {STATUS_TABS.map((tab) => {
            const count = orders.filter((o) => o.status === tab.id).length;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabChip,
                  activeTab === tab.id && styles.tabChipActive,
                ]}
                onPress={() => handleTabChange(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.id ? "#FFF" : "#8F796F"}
                />
                <Text
                  style={[
                    styles.tabChipText,
                    activeTab === tab.id && styles.tabChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === tab.id && styles.tabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === tab.id && styles.tabBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
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
            <Ionicons name="receipt-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              {activeTab === "all"
                ? "Your orders will appear here"
                : `No ${activeTab} orders found`}
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/(tabs)/browse")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal />

      {/* Order Details Modal */}
      {showOrderModal && <OrderDetailsModal />}

      {/* Review Modal - Using the separate component */}
      <ReviewModalComponent
        visible={showReviewModal}
        product={selectedProduct}
        order={selectedOrderForReview}
        onClose={() => setShowReviewModal(false)}
        onSubmit={submitReview}
      />
    </SafeAreaView>
  );
}

// Keep all your existing styles (they remain the same as before)
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
  orderCount: {
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
  tabsWrapper: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  tabsScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  tabChipText: {
    fontSize: 13,
    color: "#8F796F",
    fontWeight: "500",
  },
  tabChipTextActive: {
    color: "#FFF",
  },
  tabBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabBadgeText: {
    fontSize: 11,
    color: "#8F796F",
    fontWeight: "600",
  },
  tabBadgeTextActive: {
    color: "#FFF",
  },
  ordersList: {
    padding: 16,
    paddingBottom: 80,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
  },
  orderDate: {
    fontSize: 11,
    color: "#8F796F",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  productName: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: "#8F796F",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C35822",
  },
  cancelButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F44336",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "600",
  },
  trackButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reviewButtonText: {
    color: "#32221B",
    fontSize: 12,
    fontWeight: "600",
  },
  statusMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statusMessageText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
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
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 8,
  },
  // Confirmation Modal Styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationModal: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmationIconContainer: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
  },
  confirmationMessage: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
  confirmationNoButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  confirmationNoButtonText: {
    color: "#8F796F",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmationYesButton: {
    flex: 1,
    backgroundColor: "#F44336",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  confirmationYesButtonText: {
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
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  closeButton: {
    padding: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#8F796F",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  orderSummaryItemWithReview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderSummaryLeft: {
    flex: 1,
    marginRight: 12,
  },
  orderSummaryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  orderSummaryQuantity: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
  },
  orderSummarySeller: {
    fontSize: 11,
    color: "#C35822",
    marginTop: 2,
  },
  orderSummaryRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  orderSummaryPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
  reviewButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  reviewButtonSmallText: {
    fontSize: 11,
    color: "#32221B",
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabelModal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  totalAmountModal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C35822",
  },
  addressSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 8,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 11,
    color: "#C35822",
    fontWeight: "500",
  },
  modalActions: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cancelButtonModal: {
    backgroundColor: "#F44336",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  cancelButtonTextModal: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalStatusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  modalStatusMessageText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  testButton: {
    backgroundColor: "#ff1201",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  testButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // Review Modal Styles
  reviewModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  reviewProductInfo: {
    flexDirection: "row",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  reviewProductImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  reviewProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  reviewProductDetails: {
    flex: 1,
    justifyContent: "center",
  },
  reviewProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  reviewProductQuantity: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 2,
  },
  reviewProductSeller: {
    fontSize: 11,
    color: "#C35822",
  },
  reviewRatingSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  reviewRatingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  reviewStarsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  reviewRatingHint: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 8,
  },
  reviewCommentSection: {
    marginBottom: 20,
  },
  reviewCommentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  reviewCommentInput: {
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#32221B",
    backgroundColor: "#FFF",
    minHeight: 100,
  },
  reviewCommentHint: {
    fontSize: 11,
    color: "#8F796F",
    marginTop: 6,
  },
  reviewSubmitButton: {
    backgroundColor: "#C35822",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  reviewSubmitButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  reviewSubmitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Add these styles to your existing styles object
  reviewedButton: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  reviewedButtonText: {
    color: "#4CAF50",
  },
  reviewedButtonSmall: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  reviewedButtonSmallText: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "600",
  },
});
