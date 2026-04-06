// app/(tabs)/orders.tsx
import { auth, db, storage } from "@/lib/firebase";
import { createNotification, getOrderNotification } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
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
  refundStatus?: "pending" | "approved" | "rejected" | "refunded" | null;
  refundRequestId?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  deliveryOption?: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
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
  confirmedAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
}

interface RefundRequest {
  id: string;
  userId: string;
  userEmail: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  sellerId?: string;
  sellerName: string;
  reason: string;
  otherReason?: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  images?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type OrderStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

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
  { id: "refunded", label: "Refund", icon: "cash-outline" },
];

// Refund Modal Component
const RefundModalComponent = React.memo(
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
    onSubmit: (
      reason: string,
      otherReason?: string,
      images?: string[],
    ) => Promise<void>;
  }) => {
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [otherReason, setOtherReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const refundReasons = [
      {
        id: "missing_items",
        label: "Missing Items",
        description:
          "Some items from your order were not included in the package",
      },
      {
        id: "damaged_item",
        label: "Damaged Item",
        description: "The item arrived damaged, broken, or defective",
      },
      {
        id: "duplicate_order",
        label: "Duplicate Order",
        description: "You accidentally placed the same order multiple times",
      },
      {
        id: "wrong_item",
        label: "Wrong Item Received",
        description: "You received a different item than what you ordered",
      },
      {
        id: "others",
        label: "Others",
        description: "Other reasons not listed above",
      },
    ];

    useEffect(() => {
      if (visible) {
        setSelectedReason("");
        setOtherReason("");
        setSelectedImages([]);
      }
    }, [visible]);

    if (!visible || !product) return null;

    const pickImages = async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please grant permission to access your photos",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        setUploadingImages(true);
        try {
          const uploadedUrls: string[] = [];
          for (const asset of result.assets) {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const filename = `refund_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const storageRef = ref(storage, `refund_images/${filename}`);
            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);
            uploadedUrls.push(downloadUrl);
          }
          setSelectedImages([...selectedImages, ...uploadedUrls]);
        } catch (error) {
          console.error("Error uploading images:", error);
          Alert.alert("Error", "Failed to upload images");
        } finally {
          setUploadingImages(false);
        }
      }
    };

    const removeImage = (index: number) => {
      setSelectedImages(selectedImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
      if (!selectedReason) {
        Alert.alert("Error", "Please select a reason for refund");
        return;
      }

      if (selectedReason === "others" && !otherReason.trim()) {
        Alert.alert("Error", "Please specify your reason");
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(selectedReason, otherReason, selectedImages);
        onClose();
      } catch (error) {
        console.error("Error submitting refund request:", error);
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
          <View style={styles.refundModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Refund</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.refundProductInfo}>
                <View style={styles.refundProductImagePlaceholder}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.refundProductImage}
                    />
                  ) : (
                    <Ionicons name="image-outline" size={32} color="#CCC" />
                  )}
                </View>
                <View style={styles.refundProductDetails}>
                  <Text style={styles.refundProductName}>
                    {product.productName}
                  </Text>
                  <Text style={styles.refundProductQuantity}>
                    Quantity: {product.quantity}
                  </Text>
                  <Text style={styles.refundProductSeller}>
                    Seller: {product.sellerName}
                  </Text>
                </View>
              </View>

              <View style={styles.refundReasonSection}>
                <Text style={styles.refundReasonLabel}>Reason for Refund</Text>
                {refundReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.refundReasonOption,
                      selectedReason === reason.id &&
                        styles.refundReasonOptionActive,
                    ]}
                    onPress={() => setSelectedReason(reason.id)}
                  >
                    <View
                      style={[
                        styles.refundRadioButton,
                        selectedReason === reason.id &&
                          styles.refundRadioButtonSelected,
                      ]}
                    >
                      {selectedReason === reason.id && (
                        <View style={styles.refundRadioButtonInner} />
                      )}
                    </View>
                    <View style={styles.refundReasonTextContainer}>
                      <Text
                        style={[
                          styles.refundReasonText,
                          selectedReason === reason.id &&
                            styles.refundReasonTextActive,
                        ]}
                      >
                        {reason.label}
                      </Text>
                      <Text style={styles.refundReasonDescription}>
                        {reason.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {selectedReason === "others" && (
                  <TextInput
                    style={styles.refundOtherInput}
                    placeholder="Please specify your reason..."
                    placeholderTextColor="#8F796F"
                    value={otherReason}
                    onChangeText={setOtherReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}
              </View>

              <View style={styles.refundImagesSection}>
                <Text style={styles.refundImagesLabel}>
                  Upload Photos (Optional)
                </Text>
                <Text style={styles.refundImagesHint}>
                  Upload photos of the item to help us process your refund
                  faster
                </Text>

                <View style={styles.refundImagesContainer}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.refundImageWrapper}>
                      <Image source={{ uri }} style={styles.refundImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#F44336"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={pickImages}
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? (
                      <ActivityIndicator size="small" color="#C35822" />
                    ) : (
                      <>
                        <Ionicons
                          name="camera-outline"
                          size={24}
                          color="#C35822"
                        />
                        <Text style={styles.addImageText}>Add Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.refundSubmitButton,
                  (!selectedReason || submitting) &&
                    styles.refundSubmitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.refundSubmitButtonText}>
                    Submit Refund Request
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

RefundModalComponent.displayName = "RefundModalComponent";

// Review Modal Component
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

    useEffect(() => {
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
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(
    null,
  );
  const [selectedOrderForReview, setSelectedOrderForReview] =
    useState<Order | null>(null);
  const [selectedOrderForRefund, setSelectedOrderForRefund] =
    useState<Order | null>(null);
  const [selectedProductForRefund, setSelectedProductForRefund] =
    useState<OrderItem | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const checkIfReviewed = async (
    userId: string,
    productId: string,
    orderId: string,
  ) => {
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("userId", "==", userId),
        where("productId", "==", productId),
        where("orderId", "==", orderId),
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking review status:", error);
      return false;
    }
  };

  // Single fetch function for orders and refunds
  const fetchOrdersAndRefunds = async () => {
    const user = auth.currentUser;
    if (!user) {
      setOrders([]);
      setFilteredOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch orders
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(ordersRef, where("userId", "==", user.uid));
      const ordersSnapshot = await getDocs(ordersQuery);

      const ordersList: Order[] = [];

      for (const docSnapshot of ordersSnapshot.docs) {
        const data = docSnapshot.data();
        const order = { id: docSnapshot.id, ...data } as Order;

        // Check review status for each item
        const itemsWithStatus = await Promise.all(
          order.items.map(async (item) => {
            const hasReviewed = await checkIfReviewed(
              user.uid,
              item.productId,
              order.id,
            );

            return {
              ...item,
              hasReviewed,
            };
          }),
        );

        ordersList.push({
          ...order,
          items: itemsWithStatus,
        });
      }

      // Fetch refund requests
      const refundsRef = collection(db, "refund_requests");
      const refundsQuery = query(refundsRef, where("userId", "==", user.uid));
      const refundsSnapshot = await getDocs(refundsQuery);

      const refundsList: RefundRequest[] = [];
      refundsSnapshot.forEach((doc) => {
        refundsList.push({ id: doc.id, ...doc.data() } as RefundRequest);
      });

      // Apply refund status to orders
      const ordersWithRefundStatus = ordersList.map((order) => {
        const updatedItems = order.items.map((item) => {
          const refundRequest = refundsList.find(
            (r) =>
              r.orderNumber === order.orderNumber &&
              r.productId === item.productId,
          );
          if (refundRequest) {
            return {
              ...item,
              refundStatus: refundRequest.status,
              refundRequestId: refundRequest.id,
            };
          }
          return {
            ...item,
            refundStatus: null,
            refundRequestId: undefined,
          };
        });
        return { ...order, items: updatedItems };
      });

      // Sort orders by date (newest first)
      ordersWithRefundStatus.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      setOrders(ordersWithRefundStatus);
      setRefundRequests(refundsList);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter orders based on active tab
  const filterOrders = (
    status: OrderStatus,
    ordersList: Order[],
    refundsList: RefundRequest[],
  ) => {
    if (status === "all") {
      setFilteredOrders(ordersList);
    } else if (status === "refunded") {
      // Show ALL orders that have ANY refund request (pending, approved, rejected, refunded)
      const refundedOrderNumbers = new Set(
        refundsList.map((r) => r.orderNumber),
      );
      const filtered = ordersList.filter((o) =>
        refundedOrderNumbers.has(o.orderNumber),
      );
      setFilteredOrders(filtered);
    } else {
      const filtered = ordersList.filter((o) => o.status === status);
      setFilteredOrders(filtered);
    }
  };

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchOrdersAndRefunds();
  }, [auth.currentUser]);

  // Update filtered orders when orders, refundRequests, or activeTab changes
  useEffect(() => {
    filterOrders(activeTab, orders, refundRequests);
  }, [orders, refundRequests, activeTab]);

  const handleTabChange = (tabId: OrderStatus) => {
    setActiveTab(tabId);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrdersAndRefunds();
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
      case "refunded":
        return "#8F796F";
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
      case "refunded":
        return "Refunded";
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
      case "refunded":
        return "Refund has been processed";
      default:
        return "";
    }
  };

  const getRefundStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "approved":
        return "#4CAF50";
      case "refunded":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      default:
        return "#8F796F";
    }
  };

  const getRefundStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case "pending":
        return "Refund Pending";
      case "approved":
        return "Refund Approved";
      case "refunded":
        return "Refunded";
      case "rejected":
        return "Refund Rejected";
      default:
        return "";
    }
  };

  const getRefundButtonText = (item: OrderItem) => {
    if (!item.refundStatus) return "Request Refund";
    switch (item.refundStatus) {
      case "pending":
        return "Refund Pending";
      case "approved":
        return "Refund Approved";
      case "refunded":
        return "Refunded";
      case "rejected":
        return "Request Again";
      default:
        return "Request Refund";
    }
  };

  const getRefundButtonStyle = (item: OrderItem) => {
    if (!item.refundStatus) return styles.refundButtonVertical;
    switch (item.refundStatus) {
      case "pending":
        return [styles.refundButtonVertical, styles.refundPendingButton];
      case "approved":
      case "refunded":
        return [styles.refundButtonVertical, styles.refundApprovedButton];
      case "rejected":
        return [styles.refundButtonVertical, styles.refundRejectedButton];
      default:
        return styles.refundButtonVertical;
    }
  };

  const getModalRefundButtonStyle = (item: OrderItem) => {
    if (!item.refundStatus) return styles.modalRefundButton;
    switch (item.refundStatus) {
      case "pending":
        return [styles.modalRefundButton, styles.modalRefundPendingButton];
      case "approved":
      case "refunded":
        return [styles.modalRefundButton, styles.modalRefundApprovedButton];
      case "rejected":
        return [styles.modalRefundButton, styles.modalRefundRejectedButton];
      default:
        return styles.modalRefundButton;
    }
  };

  const showCancelConfirmationDialog = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelConfirmation(true);
  };

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
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

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

      Alert.alert(
        "Success",
        `Order ${orderToCancel.orderNumber} has been cancelled`,
      );

      await fetchOrdersAndRefunds();
    } catch (error: any) {
      console.error("❌ Cancel failed:", error);
      Alert.alert("Error", error.message);
    } finally {
      setCancellingOrderId(null);
      setOrderToCancel(null);
    }
  };

  const openReviewModal = (order: Order, product: OrderItem) => {
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

  const openRefundModal = (order: Order, product: OrderItem) => {
    // Don't allow new refund if already pending or approved/refunded
    if (product.refundStatus === "pending") {
      Alert.alert(
        "Refund Requested",
        "Your refund request is already pending review.",
      );
      return;
    }
    if (
      product.refundStatus === "approved" ||
      product.refundStatus === "refunded"
    ) {
      Alert.alert(
        "Refund Processed",
        "Your refund has already been approved and processed.",
      );
      return;
    }
    // Allow if rejected or no refund yet
    setSelectedOrderForRefund(order);
    setSelectedProductForRefund(product);
    setShowRefundModal(true);
  };

  const submitReview = async (rating: number, comment: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      const alreadyReviewed = await checkIfReviewed(
        user.uid,
        selectedProduct?.productId || "",
        selectedOrderForReview?.id || "",
      );

      if (alreadyReviewed) {
        Alert.alert("Error", "You have already reviewed this product.");
        throw new Error("Already reviewed");
      }

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

      const reviewsRef = collection(db, "reviews");
      await addDoc(reviewsRef, reviewData);

      Alert.alert("Success", "Thank you for your review!");
      setSelectedProduct(null);
      setSelectedOrderForReview(null);

      await fetchOrdersAndRefunds();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (error.message !== "Already reviewed") {
        Alert.alert("Error", "Failed to submit review. Please try again.");
      }
      throw error;
    }
  };

  const submitRefundRequest = async (
    reason: string,
    otherReason?: string,
    images?: string[],
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      // Check if already has a pending refund
      const existingRefund = refundRequests.find(
        (r) =>
          r.orderId === selectedOrderForRefund?.id &&
          r.productId === selectedProductForRefund?.productId,
      );

      if (existingRefund && existingRefund.status === "pending") {
        Alert.alert(
          "Error",
          "You already have a pending refund request for this item.",
        );
        throw new Error("Already requested");
      }

      const refundData = {
        userId: user.uid,
        userEmail: user.email,
        orderId: selectedOrderForRefund?.id,
        orderNumber: selectedOrderForRefund?.orderNumber,
        productId: selectedProductForRefund?.productId,
        productName: selectedProductForRefund?.productName,
        sellerId: selectedProductForRefund?.sellerId,
        sellerName: selectedProductForRefund?.sellerName,
        reason: reason,
        otherReason: reason === "others" ? otherReason : null,
        images: images || [],
        status: "pending",
        createdAt: existingRefund ? existingRefund.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const refundsRef = collection(db, "refund_requests");

      if (existingRefund && existingRefund.status === "rejected") {
        const refundDocRef = doc(db, "refund_requests", existingRefund.id);
        await updateDoc(refundDocRef, {
          ...refundData,
          status: "pending",
          updatedAt: Timestamp.now(),
        });
        console.log("✅ Updated existing rejected refund request");
      } else {
        await addDoc(refundsRef, refundData);
        console.log("✅ Created new refund request");
      }

      Alert.alert(
        "Success",
        "Refund request submitted successfully! The seller will review your request.",
      );
      setSelectedProductForRefund(null);
      setSelectedOrderForRefund(null);

      await fetchOrdersAndRefunds();
    } catch (error: any) {
      console.error("Error submitting refund request:", error);
      if (error.message !== "Already requested") {
        Alert.alert(
          "Error",
          "Failed to submit refund request. Please try again.",
        );
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

  const openTrackingModal = (order: Order) => {
    setTrackingOrder(order);
    setShowTrackingModal(true);
  };

  const closeTrackingModal = () => {
    setShowTrackingModal(false);
    setTrackingOrder(null);
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isCancelling = cancellingOrderId === item.id;
    const mainProduct = item.items?.[0];
    const otherItemsCount = item.items ? item.items.length - 1 : 0;
    const allProductsReviewed = item.items?.every(
      (i) => i.hasReviewed === true,
    );
    const hasRefundRequests = item.items.some((i) => i.refundStatus !== null);
    const pendingRefundCount = item.items.filter(
      (i) => i.refundStatus === "pending",
    ).length;

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
                  openTrackingModal(item);
                }}
              >
                <Text style={styles.trackButtonText}>Track</Text>
              </TouchableOpacity>
            )}
            {item.status === "delivered" && (
              <View style={styles.deliveredButtonsColumn}>
                <TouchableOpacity
                  style={[
                    styles.reviewButtonVertical,
                    allProductsReviewed && styles.reviewedButtonVertical,
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
                    if (item.items.length === 1) {
                      openReviewModal(item, item.items[0]);
                    } else {
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
                    size={16}
                    color={allProductsReviewed ? "#4CAF50" : "#32221B"}
                  />
                  <Text
                    style={[
                      styles.reviewButtonTextVertical,
                      allProductsReviewed && styles.reviewedButtonTextVertical,
                    ]}
                  >
                    {allProductsReviewed ? "Reviewed" : "Review Product"}
                  </Text>
                </TouchableOpacity>

                {/* Single Refund Button that opens Order Details */}
                <TouchableOpacity
                  style={styles.refundButtonMain}
                  onPress={(e) => {
                    e.stopPropagation();
                    openOrderDetails(item);
                  }}
                >
                  <Ionicons
                    name={hasRefundRequests ? "cash-outline" : "cash-outline"}
                    size={16}
                    color="#FFF"
                  />
                  <Text style={styles.refundButtonMainText}>
                    {hasRefundRequests
                      ? pendingRefundCount > 0
                        ? `Refund (${pendingRefundCount} pending)`
                        : "View Refund"
                      : "Request Refund"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Show refund status message if any item has refund */}
        {hasRefundRequests && (
          <View style={styles.statusMessageContainer}>
            <Ionicons
              name={
                item.items.some((i) => i.refundStatus === "pending")
                  ? "time-outline"
                  : item.items.some(
                        (i) =>
                          i.refundStatus === "approved" ||
                          i.refundStatus === "refunded",
                      )
                    ? "checkmark-done-circle"
                    : "close-circle"
              }
              size={14}
              color={
                item.items.some((i) => i.refundStatus === "pending")
                  ? "#FF9800"
                  : item.items.some(
                        (i) =>
                          i.refundStatus === "approved" ||
                          i.refundStatus === "refunded",
                      )
                    ? "#4CAF50"
                    : "#F44336"
              }
            />
            <Text
              style={[
                styles.statusMessageText,
                {
                  color: item.items.some((i) => i.refundStatus === "pending")
                    ? "#FF9800"
                    : item.items.some(
                          (i) =>
                            i.refundStatus === "approved" ||
                            i.refundStatus === "refunded",
                        )
                      ? "#4CAF50"
                      : "#F44336",
                },
              ]}
            >
              {item.items.some((i) => i.refundStatus === "pending") &&
                "Refund request pending review"}
              {item.items.some((i) => i.refundStatus === "approved") &&
                "Refund approved! Amount will be credited"}
              {item.items.some((i) => i.refundStatus === "refunded") &&
                "Refund has been processed"}
              {item.items.some((i) => i.refundStatus === "rejected") &&
                "Refund request rejected. You can request again"}
            </Text>
          </View>
        )}

        {/* Show regular order status message if no refund */}
        {!hasRefundRequests && (
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
        )}
      </TouchableOpacity>
    );
  };

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
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order #</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.orderNumber}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedOrder.createdAt)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.paymentMethod}
                </Text>
              </View>

              {selectedOrder.deliveryOption && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivery Option</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.deliveryOption.name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivery Fee</Text>
                    <Text style={styles.detailValue}>
                      ₱{selectedOrder.deliveryOption.price}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Estimated Delivery</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.deliveryOption.description}
                    </Text>
                  </View>
                </>
              )}

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

              <View style={styles.divider} />

              <Text style={styles.orderSummaryTitle}>Order Summary</Text>

              {selectedOrder.items?.map((item, index) => (
                <View key={index} style={styles.orderSummaryItemWithRefund}>
                  <View style={styles.orderSummaryLeft}>
                    <View style={styles.orderSummaryProductInfo}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.orderSummaryImage}
                        />
                      ) : (
                        <View style={styles.orderSummaryImagePlaceholder}>
                          <Ionicons
                            name="image-outline"
                            size={24}
                            color="#CCC"
                          />
                        </View>
                      )}
                      <View style={styles.orderSummaryProductDetails}>
                        <Text style={styles.orderSummaryName} numberOfLines={2}>
                          {item.productName}
                        </Text>
                        <Text style={styles.orderSummaryQuantity}>
                          Qty: {item.quantity}
                        </Text>
                        <Text style={styles.orderSummarySeller}>
                          Seller: {item.sellerName}
                        </Text>
                        <Text style={styles.orderSummaryPrice}>
                          ₱{(item.productPrice * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {item.refundStatus && (
                      <Text
                        style={[
                          styles.refundStatusBadgeText,
                          { color: getRefundStatusColor(item.refundStatus) },
                        ]}
                      >
                        {getRefundStatusLabel(item.refundStatus)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.orderSummaryRight}>
                    {selectedOrder.status === "delivered" && (
                      <View style={styles.modalButtonsColumn}>
                        <TouchableOpacity
                          style={[
                            styles.modalReviewButton,
                            item.hasReviewed === true &&
                              styles.modalReviewedButton,
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
                            size={16}
                            color={
                              item.hasReviewed === true ? "#4CAF50" : "#FFF"
                            }
                          />
                          <Text
                            style={[
                              styles.modalReviewButtonText,
                              item.hasReviewed === true &&
                                styles.modalReviewedButtonText,
                            ]}
                          >
                            {item.hasReviewed === true
                              ? "Reviewed"
                              : "Write Review"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={getModalRefundButtonStyle(item)}
                          onPress={() => {
                            closeOrderModal();
                            openRefundModal(selectedOrder, item);
                          }}
                        >
                          <Ionicons
                            name={
                              item.refundStatus === "approved" ||
                              item.refundStatus === "refunded"
                                ? "checkmark-circle"
                                : item.refundStatus === "pending"
                                  ? "time-outline"
                                  : "cash-outline"
                            }
                            size={16}
                            color="#FFF"
                          />
                          <Text style={styles.modalRefundButtonText}>
                            {getRefundButtonText(item)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtotal</Text>
                <Text style={styles.detailValue}>
                  ₱{selectedOrder.subtotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shipping Fee</Text>
                <Text style={styles.detailValue}>
                  ₱{selectedOrder.shippingFee.toFixed(2)}
                </Text>
              </View>
              {selectedOrder.deliveryOption && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Option</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.deliveryOption.name}
                  </Text>
                </View>
              )}
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabelModal}>Total</Text>
                <Text style={styles.totalAmountModal}>
                  ₱{selectedOrder.total.toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

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

  const TrackingModal = () => {
    if (!showTrackingModal || !trackingOrder) return null;

    const getTrackingSteps = () => {
      const status = trackingOrder.status;

      const orderPlacedDate = trackingOrder.createdAt?.toDate() || new Date();
      const confirmedDate = trackingOrder.confirmedAt?.toDate() || null;
      const shippedDate = trackingOrder.shippedAt?.toDate() || null;
      const deliveredDate = trackingOrder.deliveredAt?.toDate() || null;

      const steps = [
        {
          id: 1,
          title: "Order Placed",
          description: "Your order has been received",
          completed: true,
          date: orderPlacedDate,
          icon: "cart-outline",
        },
        {
          id: 2,
          title: "Order Confirmed",
          description: "Seller has confirmed your order",
          completed:
            status === "confirmed" ||
            status === "shipped" ||
            status === "delivered",
          date: confirmedDate,
          icon: "checkmark-circle-outline",
        },
        {
          id: 3,
          title: "Shipped",
          description: "Your order is on the way",
          completed: status === "shipped" || status === "delivered",
          date: shippedDate,
          icon: "car-outline",
        },
        {
          id: 4,
          title: "Delivered",
          description: "Your order has been delivered",
          completed: status === "delivered",
          date: deliveredDate,
          icon: "checkmark-done-circle-outline",
        },
      ];

      return steps;
    };

    const trackingSteps = getTrackingSteps();
    const currentStepIndex = trackingSteps.findIndex((step) => !step.completed);
    const activeStep =
      currentStepIndex === -1 ? trackingSteps.length : currentStepIndex;
    const completedCount = trackingSteps.filter(
      (step) => step.completed,
    ).length;
    const progressPercentage = (completedCount / trackingSteps.length) * 100;

    const formatTrackingDate = (date: Date | null) => {
      if (!date) return "Pending";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTrackingModal}
        onRequestClose={closeTrackingModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.trackingModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Order</Text>
              <TouchableOpacity
                onPress={closeTrackingModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.trackingOrderInfo}>
                <Text style={styles.trackingOrderNumber}>
                  Order #{trackingOrder.orderNumber}
                </Text>
                <View style={styles.trackingStatusBadge}>
                  <Text style={styles.trackingStatusText}>
                    {getStatusLabel(trackingOrder.status)}
                  </Text>
                </View>
              </View>

              {trackingOrder.updatedAt && (
                <Text style={styles.lastUpdatedText}>
                  Last updated:{" "}
                  {formatTrackingDate(trackingOrder.updatedAt.toDate())}
                </Text>
              )}

              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.trackingStepsContainer}>
                {trackingSteps.map((step, index) => (
                  <View key={step.id} style={styles.trackingStep}>
                    <View style={styles.trackingStepLeft}>
                      <View
                        style={[
                          styles.trackingStepIcon,
                          step.completed && styles.trackingStepIconCompleted,
                          !step.completed &&
                            index === activeStep &&
                            styles.trackingStepIconActive,
                        ]}
                      >
                        <Ionicons
                          name={step.icon as any}
                          size={20}
                          color={
                            step.completed
                              ? "#FFF"
                              : index === activeStep
                                ? "#C35822"
                                : "#8F796F"
                          }
                        />
                      </View>
                      {index < trackingSteps.length - 1 && (
                        <View
                          style={[
                            styles.trackingStepLine,
                            step.completed && styles.trackingStepLineCompleted,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.trackingStepRight}>
                      <Text
                        style={[
                          styles.trackingStepTitle,
                          step.completed && styles.trackingStepTitleCompleted,
                        ]}
                      >
                        {step.title}
                      </Text>
                      <Text style={styles.trackingStepDescription}>
                        {step.description}
                      </Text>
                      {step.date && (
                        <Text style={styles.trackingStepDate}>
                          {formatTrackingDate(step.date)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {trackingOrder.status !== "delivered" &&
                trackingOrder.status !== "cancelled" && (
                  <View style={styles.estimatedDelivery}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#C35822"
                    />
                    <View style={styles.estimatedDeliveryTextContainer}>
                      <Text style={styles.estimatedDeliveryTitle}>
                        Estimated Delivery
                      </Text>
                      <Text style={styles.estimatedDeliveryDate}>
                        {(() => {
                          const orderDate =
                            trackingOrder.createdAt?.toDate() || new Date();
                          const estDate = new Date(orderDate);
                          estDate.setDate(orderDate.getDate() + 5);
                          return estDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          });
                        })()}
                      </Text>
                    </View>
                  </View>
                )}

              {trackingOrder.address && (
                <View style={styles.deliveryAddress}>
                  <Ionicons name="location-outline" size={20} color="#C35822" />
                  <View style={styles.deliveryAddressTextContainer}>
                    <Text style={styles.deliveryAddressTitle}>
                      Delivery Address
                    </Text>
                    <Text style={styles.deliveryAddressText}>
                      {trackingOrder.address.fullName}
                    </Text>
                    <Text style={styles.deliveryAddressText}>
                      {trackingOrder.address.phone}
                    </Text>
                    <Text style={styles.deliveryAddressText}>
                      {trackingOrder.address.street},{" "}
                      {trackingOrder.address.barangay}
                    </Text>
                    <Text style={styles.deliveryAddressText}>
                      {trackingOrder.address.city},{" "}
                      {trackingOrder.address.province}{" "}
                      {trackingOrder.address.zipCode}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.trackingModalFooter}>
              <TouchableOpacity
                style={styles.closeTrackingButton}
                onPress={closeTrackingModal}
              >
                <Text style={styles.closeTrackingButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.orderCount}>{filteredOrders.length} orders</Text>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {STATUS_TABS.map((tab) => {
            let count = 0;
            if (tab.id === "refunded") {
              const refundedOrderNumbers = new Set(
                refundRequests.map((r) => r.orderNumber),
              );
              count = orders.filter((o) =>
                refundedOrderNumbers.has(o.orderNumber),
              ).length;
            } else if (tab.id === "all") {
              count = orders.length;
            } else {
              count = orders.filter((o) => o.status === tab.id).length;
            }
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
                : activeTab === "refunded"
                  ? "No refund requests found"
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

      <CancelConfirmationModal />
      {showOrderModal && <OrderDetailsModal />}
      <ReviewModalComponent
        visible={showReviewModal}
        product={selectedProduct}
        order={selectedOrderForReview}
        onClose={() => setShowReviewModal(false)}
        onSubmit={submitReview}
      />
      <RefundModalComponent
        visible={showRefundModal}
        product={selectedProductForRefund}
        order={selectedOrderForRefund}
        onClose={() => setShowRefundModal(false)}
        onSubmit={submitRefundRequest}
      />
      <TrackingModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F4" },
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
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#32221B" },
  orderCount: {
    fontSize: 12,
    color: "#8F796F",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  tabsWrapper: { marginVertical: 12, paddingHorizontal: 16 },
  tabsScrollContent: { flexDirection: "row", gap: 8, paddingRight: 16 },
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
  tabChipActive: { backgroundColor: "#C35822", borderColor: "#C35822" },
  tabChipText: { fontSize: 13, color: "#8F796F", fontWeight: "500" },
  tabChipTextActive: { color: "#FFF" },
  tabBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  tabBadgeText: { fontSize: 11, color: "#8F796F", fontWeight: "600" },
  tabBadgeTextActive: { color: "#FFF" },
  ordersList: { padding: 16, paddingBottom: 80 },
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
  orderNumber: { fontSize: 14, fontWeight: "600", color: "#32221B" },
  orderDate: { fontSize: 11, color: "#8F796F", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "500" },
  productName: { fontSize: 14, color: "#8F796F", marginBottom: 12 },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalContainer: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  totalLabel: { fontSize: 13, color: "#8F796F" },
  totalAmount: { fontSize: 16, fontWeight: "bold", color: "#C35822" },
  cancelButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F44336",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cancelButtonText: { color: "#F44336", fontSize: 12, fontWeight: "600" },
  trackButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackButtonText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statusMessageText: { fontSize: 12, fontWeight: "500", flex: 1 },
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
  shopButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  errorText: { fontSize: 12, color: "#FF3B30", marginTop: 8 },
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
  confirmationIconContainer: { marginBottom: 16 },
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
  confirmationYesButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
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
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#32221B" },
  closeButton: { padding: 4 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: { fontSize: 14, color: "#8F796F" },
  detailValue: { fontSize: 14, fontWeight: "500", color: "#32221B" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  orderSummaryLeft: { flex: 1, marginRight: 12 },
  orderSummaryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  orderSummaryQuantity: { fontSize: 12, color: "#8F796F", marginTop: 2 },
  orderSummarySeller: { fontSize: 11, color: "#C35822", marginTop: 2 },
  orderSummaryRight: { alignItems: "flex-end", gap: 8 },
  orderSummaryPrice: { fontSize: 14, fontWeight: "600", color: "#C35822" },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabelModal: { fontSize: 16, fontWeight: "600", color: "#32221B" },
  totalAmountModal: { fontSize: 18, fontWeight: "bold", color: "#C35822" },
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
  addressPhone: { fontSize: 12, color: "#8F796F", marginBottom: 4 },
  addressText: { fontSize: 12, color: "#666", lineHeight: 16, marginBottom: 4 },
  addressLabel: { fontSize: 11, color: "#C35822", fontWeight: "500" },
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
  cancelButtonTextModal: { color: "#FFF", fontSize: 14, fontWeight: "600" },
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
  reviewProductImage: { width: 60, height: 60, borderRadius: 8 },
  reviewProductDetails: { flex: 1, justifyContent: "center" },
  reviewProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  reviewProductQuantity: { fontSize: 12, color: "#8F796F", marginBottom: 2 },
  reviewProductSeller: { fontSize: 11, color: "#C35822" },
  reviewRatingSection: { marginBottom: 20, alignItems: "center" },
  reviewRatingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  reviewStarsContainer: { flexDirection: "row", gap: 12, marginBottom: 8 },
  reviewRatingHint: { fontSize: 12, color: "#8F796F", marginTop: 8 },
  reviewCommentSection: { marginBottom: 20 },
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
  reviewCommentHint: { fontSize: 11, color: "#8F796F", marginTop: 6 },
  reviewSubmitButton: {
    backgroundColor: "#C35822",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  reviewSubmitButtonDisabled: { backgroundColor: "#E0DAD1" },
  reviewSubmitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  deliveredButtonsColumn: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  reviewButtonVertical: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 130,
    justifyContent: "center",
  },
  reviewButtonTextVertical: {
    color: "#32221B",
    fontSize: 13,
    fontWeight: "600",
  },
  reviewedButtonVertical: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  reviewedButtonTextVertical: {
    color: "#4CAF50",
  },
  refundButtonVertical: {
    backgroundColor: "#8F796F",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 130,
    justifyContent: "center",
  },
  refundButtonTextVertical: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  refundPendingButton: {
    backgroundColor: "#FF9800",
  },
  refundApprovedButton: {
    backgroundColor: "#4CAF50",
  },
  refundRejectedButton: {
    backgroundColor: "#F44336",
  },
  refundStatusBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
  refundModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  refundProductInfo: {
    flexDirection: "row",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  refundProductImagePlaceholder: {
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
  refundProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  refundProductDetails: {
    flex: 1,
    justifyContent: "center",
  },
  refundProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  refundProductQuantity: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 2,
  },
  refundProductSeller: {
    fontSize: 11,
    color: "#C35822",
  },
  refundReasonSection: {
    marginBottom: 20,
  },
  refundReasonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  refundReasonOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  refundReasonOptionActive: {
    backgroundColor: "#FFF8F0",
  },
  refundRadioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  refundRadioButtonSelected: {
    borderColor: "#C35822",
  },
  refundRadioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C35822",
  },
  refundReasonTextContainer: {
    flex: 1,
  },
  refundReasonText: {
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
    marginBottom: 2,
  },
  refundReasonTextActive: {
    fontWeight: "600",
  },
  refundReasonDescription: {
    fontSize: 12,
    color: "#8F796F",
    lineHeight: 16,
  },
  refundOtherInput: {
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#32221B",
    backgroundColor: "#FFF",
    marginTop: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  refundImagesSection: {
    marginBottom: 20,
  },
  refundImagesLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  refundImagesHint: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 12,
  },
  refundImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  refundImageWrapper: {
    position: "relative",
    width: 80,
    height: 80,
  },
  refundImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C35822",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
    gap: 4,
  },
  addImageText: {
    fontSize: 10,
    color: "#C35822",
    fontWeight: "500",
  },
  refundSubmitButton: {
    backgroundColor: "#C35822",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  refundSubmitButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  refundSubmitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  orderSummaryItemWithRefund: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderSummaryProductInfo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  orderSummaryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  orderSummaryImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  orderSummaryProductDetails: {
    flex: 1,
    marginLeft: 12,
  },
  modalButtonsColumn: {
    flexDirection: "column",
    gap: 8,
    minWidth: 120,
  },
  modalReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  modalReviewButtonText: {
    fontSize: 12,
    color: "#32221B",
    fontWeight: "600",
  },
  modalReviewedButton: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  modalReviewedButtonText: {
    color: "#4CAF50",
  },
  modalRefundButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8F796F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  modalRefundButtonText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  modalRefundPendingButton: {
    backgroundColor: "#FF9800",
  },
  modalRefundApprovedButton: {
    backgroundColor: "#4CAF50",
  },
  modalRefundRejectedButton: {
    backgroundColor: "#F44336",
  },
  refundButtonMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C35822",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 130,
  },
  refundButtonMainText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  trackingModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  trackingOrderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  trackingOrderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  trackingStatusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  trackingStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  lastUpdatedText: {
    fontSize: 11,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "#E0DAD1",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#C35822",
    borderRadius: 2,
  },
  trackingStepsContainer: {
    marginBottom: 24,
  },
  trackingStep: {
    flexDirection: "row",
    marginBottom: 24,
  },
  trackingStepLeft: {
    width: 40,
    alignItems: "center",
    position: "relative",
  },
  trackingStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  trackingStepIconCompleted: {
    backgroundColor: "#4CAF50",
  },
  trackingStepIconActive: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#C35822",
  },
  trackingStepLine: {
    position: "absolute",
    top: 32,
    width: 2,
    height: 40,
    backgroundColor: "#E0DAD1",
  },
  trackingStepLineCompleted: {
    backgroundColor: "#4CAF50",
  },
  trackingStepRight: {
    flex: 1,
    marginLeft: 8,
  },
  trackingStepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  trackingStepTitleCompleted: {
    color: "#4CAF50",
  },
  trackingStepDescription: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 2,
  },
  trackingStepDate: {
    fontSize: 11,
    color: "#8F796F",
  },
  estimatedDelivery: {
    flexDirection: "row",
    backgroundColor: "#FEF5ED",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  estimatedDeliveryTextContainer: {
    flex: 1,
  },
  estimatedDeliveryTitle: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 4,
  },
  estimatedDeliveryDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
  deliveryAddress: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  deliveryAddressTextContainer: {
    flex: 1,
  },
  deliveryAddressTitle: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 4,
  },
  deliveryAddressText: {
    fontSize: 13,
    color: "#32221B",
    marginBottom: 2,
  },
  trackingModalFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  closeTrackingButton: {
    backgroundColor: "#C35822",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  closeTrackingButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
