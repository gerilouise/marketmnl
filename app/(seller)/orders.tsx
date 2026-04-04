// app/(seller)/orders.tsx
import { auth, db } from "@/lib/firebase";
import { createNotification, getOrderNotification } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  productPrice: number;
  imageUrl?: string;
  refundStatus?: "pending" | "approved" | "rejected" | "refunded" | null;
  refundRequestId?: string;
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

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  shippingFee: number;
  total: number;
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
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sellerId: string;
  userId: string;
  userEmail: string;
}

const STATUS_CATEGORIES = [
  "All",
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Refund",
];

export default function OrdersScreen() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<{
    id: string;
    number: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Refund modal states
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(
    null,
  );
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundImagesModalVisible, setRefundImagesModalVisible] =
    useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const loadOrdersAndRefunds = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Please log in");
        router.push("/auth/login");
        return;
      }

      // Load orders
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(ordersRef, where("sellerId", "==", user.uid));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersList: Order[] = [];

      for (const docSnapshot of ordersSnapshot.docs) {
        const data = docSnapshot.data();
        ordersList.push({
          id: docSnapshot.id,
          ...data,
          status: data.status || "pending",
        } as Order);
      }

      // Load all refund requests for this seller
      const refundsRef = collection(db, "refund_requests");
      const refundsQuery = query(refundsRef, where("sellerId", "==", user.uid));
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

      ordersWithRefundStatus.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      setOrders(ordersWithRefundStatus);
      setRefundRequests(refundsList);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateRefundStatus = async (
    refundId: string,
    status: "approved" | "rejected" | "refunded",
    order: Order,
    product: OrderItem,
  ) => {
    setProcessingRefund(true);
    try {
      const refundRef = doc(db, "refund_requests", refundId);
      await updateDoc(refundRef, {
        status: status,
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setRefundRequests((prev) =>
        prev.map((req) =>
          req.id === refundId ? { ...req, status: status } : req,
        ),
      );

      // Update orders state
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          if (o.id === order.id) {
            return {
              ...o,
              items: o.items.map((item) => {
                if (item.productId === product.productId) {
                  return { ...item, refundStatus: status };
                }
                return item;
              }),
            };
          }
          return o;
        }),
      );

      // Update selected order if open
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((item) => {
              if (item.productId === product.productId) {
                return { ...item, refundStatus: status };
              }
              return item;
            }),
          };
        });
      }

      // Notify customer about refund decision
      const notificationTitle =
        status === "approved"
          ? "Refund Approved ✓"
          : status === "refunded"
            ? "Refund Completed"
            : "Refund Request Update";
      const notificationMessage =
        status === "approved"
          ? `Your refund for ${product.productName} (Order #${order.orderNumber}) has been approved. The amount will be credited within 3-5 business days.`
          : status === "refunded"
            ? `Your refund for ${product.productName} (Order #${order.orderNumber}) has been processed.`
            : `Your refund request for ${product.productName} (Order #${order.orderNumber}) has been reviewed. Please contact support for more information.`;

      await createNotification({
        userId: order.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: "order_refund_updated",
        orderId: order.id,
        orderNumber: order.orderNumber,
        read: false,
        createdAt: Timestamp.now(),
      });

      Alert.alert("Success", `Refund request ${status} successfully`);
    } catch (error) {
      console.error("Error updating refund status:", error);
      Alert.alert("Error", "Failed to update refund status");
    } finally {
      setProcessingRefund(false);
    }
  };

  const openRefundRequests = async (order: Order) => {
    setSelectedOrder(order);
    setRefundModalVisible(true);
  };

  const closeRefundModal = () => {
    setRefundModalVisible(false);
    setSelectedRefund(null);
  };

  const viewRefundImages = (images: string[]) => {
    setSelectedImages(images);
    setRefundImagesModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadOrdersAndRefunds();
    }, []),
  );

  const showStatusConfirmation = (
    orderId: string,
    orderNumber: string,
    currentStatus: string,
    newStatus: string,
  ) => {
    setOrderToUpdate({
      id: orderId,
      number: orderNumber,
      currentStatus,
      newStatus,
    });
    setStatusModalVisible(true);
  };

  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsModalVisible(true);
  };

  const updateOrderStatus = async () => {
    if (!orderToUpdate) return;

    const {
      id: orderId,
      number: orderNumber,
      currentStatus,
      newStatus,
    } = orderToUpdate;
    setStatusModalVisible(false);
    setUpdatingOrderId(orderId);

    try {
      const orderRef = doc(db, "orders", orderId);
      const dbStatus = newStatus.toLowerCase();

      const orderDoc = await getDoc(orderRef);
      const orderData = orderDoc.data();
      const customerId = orderData?.userId;

      await updateDoc(orderRef, {
        status: dbStatus,
        updatedAt: Timestamp.now(),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: dbStatus as Order["status"] }
            : order,
        ),
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: dbStatus as Order["status"] } : null,
        );
      }

      if (customerId) {
        const notification = getOrderNotification(
          orderNumber,
          newStatus.toLowerCase(),
          orderId,
        );
        if (notification) {
          await createNotification({
            userId: customerId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            orderId: orderId,
            orderNumber: orderNumber,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      }

      Alert.alert("Success", `Order #${orderNumber} marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
      setOrderToUpdate(null);
    }
  };

  const cancelUpdate = () => {
    setStatusModalVisible(false);
    setOrderToUpdate(null);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedOrder(null);
  };

  const handleConfirmOrder = (orderId: string, orderNumber: string) => {
    showStatusConfirmation(orderId, orderNumber, "pending", "confirmed");
  };

  const handleMarkAsShipped = (orderId: string, orderNumber: string) => {
    showStatusConfirmation(orderId, orderNumber, "confirmed", "shipped");
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    showStatusConfirmation(orderId, orderNumber, "pending", "cancelled");
  };

  const handleMarkAsDelivered = (orderId: string, orderNumber: string) => {
    showStatusConfirmation(orderId, orderNumber, "shipped", "delivered");
  };

  const getFilteredOrders = () => {
    if (selectedStatus === "All") {
      return orders;
    }
    if (selectedStatus === "Refund") {
      // Show orders that have any refund request (pending, approved, rejected)
      return orders.filter((order) =>
        order.items.some((item) => item.refundStatus !== null),
      );
    }
    return orders.filter(
      (order) => order.status === selectedStatus.toLowerCase(),
    );
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
        return "#FF3B30";
      default:
        return "#8F796F";
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

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isUpdating = updatingOrderId === item.id;
    const mainProduct = item.items[0];
    const otherItemsCount = item.items.length - 1;
    const hasRefundRequests = item.items.some((i) => i.refundStatus !== null);
    const pendingRefundCount = item.items.filter(
      (i) => i.refundStatus === "pending",
    ).length;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => showOrderDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.orderDateSmall}>
              {formatDate(item.createdAt)}
            </Text>
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
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>
          {item.customerName || "Customer"}
        </Text>
        <Text style={styles.productName}>
          {mainProduct.productName} x{mainProduct.quantity}
          {otherItemsCount > 0 && ` +${otherItemsCount} more`}
        </Text>

        <View style={styles.datePriceRow}>
          <View style={styles.paymentMethodContainer}>
            <Ionicons name="card-outline" size={12} color="#8F796F" />
            <Text style={styles.paymentMethodText}>{item.paymentMethod}</Text>
          </View>
          {item.deliveryOption && (
            <View style={styles.deliveryBadge}>
              <Ionicons name="cube-outline" size={10} color="#C35822" />
              <Text style={styles.deliveryBadgeText}>
                {item.deliveryOption.name}
              </Text>
            </View>
          )}
          <Text style={styles.orderTotal}>₱{item.total.toFixed(2)}</Text>
        </View>

        {/* Show refund badge if any */}
        {hasRefundRequests && (
          <View style={styles.refundBadgeContainer}>
            <Ionicons name="cash-outline" size={14} color="#C35822" />
            <Text style={styles.refundBadgeText}>
              {pendingRefundCount > 0
                ? `${pendingRefundCount} pending refund request${pendingRefundCount > 1 ? "s" : ""}`
                : "Has refund requests"}
            </Text>
          </View>
        )}

        <View style={styles.actionButtonsContainer}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#C35822" />
          ) : (
            <>
              {item.status === "pending" && (
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleConfirmOrder(item.id, item.orderNumber);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancelOrder(item.id, item.orderNumber);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === "confirmed" && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.shippedButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMarkAsShipped(item.id, item.orderNumber);
                  }}
                >
                  <Text style={styles.actionButtonText}>Mark as Shipped</Text>
                </TouchableOpacity>
              )}
              {item.status === "shipped" && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deliveredButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMarkAsDelivered(item.id, item.orderNumber);
                  }}
                >
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </TouchableOpacity>
              )}
              {(item.status === "delivered" || hasRefundRequests) && (
                <TouchableOpacity
                  style={styles.refundRequestsButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    openRefundRequests(item);
                  }}
                >
                  <Ionicons name="cash-outline" size={16} color="#C35822" />
                  <Text style={styles.refundRequestsButtonText}>
                    View Refund Requests
                  </Text>
                </TouchableOpacity>
              )}
              {item.status === "cancelled" && (
                <View style={styles.statusMessage}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Text style={styles.statusMessageText}>Cancelled</Text>
                </View>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredOrders = getFilteredOrders();

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders</Text>
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
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="receipt-outline" size={60} color="#E0DAD1" />
          <Text style={styles.notLoggedInText}>
            Please log in to view orders
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
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.orderCount}>{filteredOrders.length} orders</Text>
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          <View style={styles.categoriesContainer}>
            {STATUS_CATEGORIES.map((status) => {
              let count = 0;
              if (status === "All") {
                count = orders.length;
              } else if (status === "Refund") {
                count = orders.filter((order) =>
                  order.items.some((item) => item.refundStatus !== null),
                ).length;
              } else {
                count = orders.filter(
                  (order) => order.status === status.toLowerCase(),
                ).length;
              }
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.categoryChip,
                    selectedStatus === status && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedStatus === status &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.categoryBadge,
                        selectedStatus === status && styles.categoryBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          selectedStatus === status &&
                            styles.categoryBadgeTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrdersAndRefunds();
            }}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No orders found</Text>
            {selectedStatus !== "All" && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setSelectedStatus("All")}
              >
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Status Update Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={cancelUpdate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle-outline" size={50} color="#C35822" />
            </View>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            <Text style={styles.modalMessage}>
              Order #{orderToUpdate?.number}
            </Text>
            <Text style={styles.modalStatusChange}>
              Change status from{" "}
              <Text style={{ fontWeight: "bold" }}>
                {orderToUpdate?.currentStatus.charAt(0).toUpperCase() +
                  orderToUpdate?.currentStatus.slice(1)}
              </Text>{" "}
              to{" "}
              <Text style={{ fontWeight: "bold", color: "#4CAF50" }}>
                {orderToUpdate?.newStatus.charAt(0).toUpperCase() +
                  orderToUpdate?.newStatus.slice(1)}
              </Text>
              ?
            </Text>
            <Text style={styles.modalWarning}>
              This will notify the customer.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={cancelUpdate}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={updateOrderStatus}
              >
                <Text style={styles.confirmModalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>Order Details</Text>
              <TouchableOpacity
                onPress={closeDetailsModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedOrder && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order Number</Text>
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
                    <Text style={styles.detailLabel}>Customer Name</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.customerName || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer Email</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.customerEmail ||
                        selectedOrder.userEmail ||
                        "N/A"}
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
                        <Text style={styles.detailLabel}>
                          Estimated Delivery
                        </Text>
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
                        {selectedOrder.status.charAt(0).toUpperCase() +
                          selectedOrder.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.productName}</Text>
                        <Text style={styles.itemQuantity}>
                          Quantity: {item.quantity}
                        </Text>
                        {item.refundStatus && (
                          <Text
                            style={[
                              styles.itemRefundStatus,
                              {
                                color: getRefundStatusColor(item.refundStatus),
                              },
                            ]}
                          >
                            {getRefundStatusLabel(item.refundStatus)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.itemPrice}>
                        ₱{(item.productPrice * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>Price Details</Text>
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
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>
                      ₱{selectedOrder.total.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>Shipping Address</Text>
                  <Text style={styles.addressName}>
                    {selectedOrder.address?.fullName || "N/A"}
                  </Text>
                  <Text style={styles.addressPhone}>
                    {selectedOrder.address?.phone || "N/A"}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedOrder.address?.street &&
                    selectedOrder.address?.street !== ""
                      ? `${selectedOrder.address.street}, ${selectedOrder.address.barangay || ""}, ${selectedOrder.address.city || ""}, ${selectedOrder.address.province || ""} ${selectedOrder.address.zipCode || ""}`
                      : "No address provided"}
                  </Text>
                  <Text style={styles.addressLabel}>
                    Label: {selectedOrder.address?.label || "N/A"}
                  </Text>
                </>
              )}
            </ScrollView>

            <View style={styles.detailsModalFooter}>
              <TouchableOpacity
                style={styles.closeDetailsButton}
                onPress={closeDetailsModal}
              >
                <Text style={styles.closeDetailsButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Refund Requests Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={refundModalVisible}
        onRequestClose={closeRefundModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.refundModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Refund Requests</Text>
              <TouchableOpacity
                onPress={closeRefundModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.refundOrderInfo}>
                Order #{selectedOrder?.orderNumber}
              </Text>

              {selectedOrder &&
              selectedOrder.items.filter((i) => i.refundStatus !== null)
                .length === 0 ? (
                <View style={styles.noRefundsContainer}>
                  <Ionicons name="cash-outline" size={50} color="#E0DAD1" />
                  <Text style={styles.noRefundsText}>
                    No refund requests for this order
                  </Text>
                </View>
              ) : (
                selectedOrder?.items
                  .filter((item) => item.refundStatus !== null)
                  .map((item, idx) => {
                    const refundRequest = refundRequests.find(
                      (r) =>
                        r.orderNumber === selectedOrder.orderNumber &&
                        r.productId === item.productId,
                    );
                    return (
                      <View key={idx} style={styles.refundRequestCard}>
                        <View style={styles.refundProductHeader}>
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.refundProductImage}
                            />
                          ) : (
                            <View style={styles.refundProductImagePlaceholder}>
                              <Ionicons
                                name="image-outline"
                                size={24}
                                color="#CCC"
                              />
                            </View>
                          )}
                          <View style={styles.refundProductInfo}>
                            <Text style={styles.refundProductName}>
                              {item.productName}
                            </Text>
                            <Text style={styles.refundProductQuantity}>
                              Quantity: {item.quantity}
                            </Text>
                          </View>
                        </View>

                        {refundRequest && (
                          <>
                            <View style={styles.refundReasonBox}>
                              <Text style={styles.refundReasonLabel}>
                                Reason:
                              </Text>
                              <Text style={styles.refundReasonText}>
                                {refundRequest.reason === "others"
                                  ? refundRequest.otherReason
                                  : refundRequest.reason === "missing_items"
                                    ? "Missing Items"
                                    : refundRequest.reason === "damaged_item"
                                      ? "Damaged Item"
                                      : refundRequest.reason ===
                                          "duplicate_order"
                                        ? "Duplicate Order"
                                        : refundRequest.reason === "wrong_item"
                                          ? "Wrong Item Received"
                                          : refundRequest.reason}
                              </Text>
                            </View>

                            {refundRequest.images &&
                              refundRequest.images.length > 0 && (
                                <TouchableOpacity
                                  style={styles.viewImagesButton}
                                  onPress={() =>
                                    viewRefundImages(refundRequest.images!)
                                  }
                                >
                                  <Ionicons
                                    name="images-outline"
                                    size={16}
                                    color="#C35822"
                                  />
                                  <Text style={styles.viewImagesText}>
                                    View {refundRequest.images.length} photo
                                    {refundRequest.images.length > 1 ? "s" : ""}
                                  </Text>
                                </TouchableOpacity>
                              )}

                            <Text style={styles.refundDate}>
                              Requested:{" "}
                              {formatShortDate(refundRequest.createdAt)}
                            </Text>

                            <View style={styles.refundStatusContainer}>
                              <Text
                                style={[
                                  styles.refundStatusText,
                                  item.refundStatus === "pending" &&
                                    styles.refundStatusPending,
                                  item.refundStatus === "approved" &&
                                    styles.refundStatusApproved,
                                  item.refundStatus === "refunded" &&
                                    styles.refundStatusApproved,
                                  item.refundStatus === "rejected" &&
                                    styles.refundStatusRejected,
                                ]}
                              >
                                {item.refundStatus === "pending"
                                  ? "Pending Review"
                                  : item.refundStatus === "approved"
                                    ? "Approved"
                                    : item.refundStatus === "refunded"
                                      ? "Refunded"
                                      : "Rejected"}
                              </Text>

                              {item.refundStatus === "pending" && (
                                <View style={styles.refundActionButtons}>
                                  <TouchableOpacity
                                    style={[
                                      styles.refundActionButton,
                                      styles.approveButton,
                                    ]}
                                    onPress={() =>
                                      updateRefundStatus(
                                        refundRequest.id,
                                        "approved",
                                        selectedOrder,
                                        item,
                                      )
                                    }
                                    disabled={processingRefund}
                                  >
                                    <Text style={styles.approveButtonText}>
                                      Approve
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.refundActionButton,
                                      styles.rejectButton,
                                    ]}
                                    onPress={() =>
                                      updateRefundStatus(
                                        refundRequest.id,
                                        "rejected",
                                        selectedOrder,
                                        item,
                                      )
                                    }
                                    disabled={processingRefund}
                                  >
                                    <Text style={styles.rejectButtonText}>
                                      Reject
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              )}

                              {item.refundStatus === "approved" && (
                                <TouchableOpacity
                                  style={[
                                    styles.refundActionButton,
                                    styles.markRefundedButton,
                                  ]}
                                  onPress={() =>
                                    updateRefundStatus(
                                      refundRequest.id,
                                      "refunded",
                                      selectedOrder,
                                      item,
                                    )
                                  }
                                  disabled={processingRefund}
                                >
                                  <Text style={styles.markRefundedButtonText}>
                                    Mark as Refunded
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })
              )}
            </ScrollView>

            <View style={styles.detailsModalFooter}>
              <TouchableOpacity
                style={styles.closeDetailsButton}
                onPress={closeRefundModal}
              >
                <Text style={styles.closeDetailsButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Refund Images Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={refundImagesModalVisible}
        onRequestClose={() => setRefundImagesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Refund Photos</Text>
              <TouchableOpacity
                onPress={() => setRefundImagesModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {selectedImages.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.fullImage}
                />
              ))}
            </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#32221B" },
  orderCount: { fontSize: 14, color: "#8F796F" },
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
  categoriesWrapper: { marginBottom: 16, paddingHorizontal: 20 },
  categoriesScrollContent: { paddingRight: 20 },
  categoriesContainer: { flexDirection: "row", gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    gap: 6,
  },
  categoryChipActive: { backgroundColor: "#C35822", borderColor: "#C35822" },
  categoryChipText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
  },
  categoryChipTextActive: { color: "#FFF" },
  categoryBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  categoryBadgeActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  categoryBadgeText: { fontSize: 11, color: "#8F796F", fontWeight: "600" },
  categoryBadgeTextActive: { color: "#FFF" },
  ordersList: { paddingHorizontal: 20, paddingBottom: 20 },
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
  orderDateSmall: { fontSize: 10, color: "#8F796F", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "500" },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  productName: { fontSize: 14, color: "#8F796F", marginBottom: 12 },
  datePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentMethodText: { fontSize: 12, color: "#8F796F" },
  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF5ED",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  deliveryBadgeText: { fontSize: 10, color: "#C35822", fontWeight: "500" },
  orderTotal: { fontSize: 16, fontWeight: "600", color: "#C35822" },
  refundBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FEF5ED",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  refundBadgeText: { fontSize: 12, color: "#C35822", fontWeight: "500" },
  actionButtonsContainer: { marginTop: 4, minHeight: 36 },
  actionButtonsRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  actionButtonText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  confirmButton: { backgroundColor: "#4CAF50" },
  cancelButton: { backgroundColor: "#FF3B30" },
  shippedButton: { backgroundColor: "#2196F3" },
  deliveredButton: { backgroundColor: "#9C27B0" },
  refundRequestsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF5ED",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  refundRequestsButtonText: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusMessageText: { fontSize: 14, color: "#666", fontWeight: "500" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, color: "#8F796F", marginTop: 12 },
  clearFilterButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  clearFilterText: { color: "#C35822", fontSize: 14, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: { marginBottom: 16 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  modalStatusChange: {
    fontSize: 14,
    color: "#32221B",
    textAlign: "center",
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 12,
    color: "#C35822",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  cancelModalButtonText: { color: "#8F796F", fontSize: 16, fontWeight: "600" },
  confirmModalButton: { backgroundColor: "#4CAF50" },
  confirmModalButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  detailsModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  detailsModalTitle: { fontSize: 18, fontWeight: "600", color: "#32221B" },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "500", color: "#32221B" },
  itemQuantity: { fontSize: 12, color: "#8F796F", marginTop: 2 },
  itemRefundStatus: { fontSize: 11, fontWeight: "500", marginTop: 4 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: "#C35822" },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#32221B" },
  totalAmount: { fontSize: 18, fontWeight: "bold", color: "#C35822" },
  addressName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  addressPhone: { fontSize: 12, color: "#8F796F", marginBottom: 4 },
  addressText: { fontSize: 12, color: "#666", lineHeight: 16, marginBottom: 4 },
  addressLabel: { fontSize: 12, color: "#C35822", fontWeight: "500" },
  detailsModalFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  closeDetailsButton: {
    backgroundColor: "#C35822",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  closeDetailsButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  // Refund Modal Styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  refundModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  refundOrderInfo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
    marginBottom: 16,
    textAlign: "center",
  },
  refundRequestCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  refundProductHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  refundProductImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  refundProductImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  refundProductInfo: {
    flex: 1,
    marginLeft: 12,
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
  },
  refundReasonBox: { marginBottom: 8 },
  refundReasonLabel: { fontSize: 12, color: "#8F796F", marginBottom: 4 },
  refundReasonText: { fontSize: 14, color: "#32221B", lineHeight: 18 },
  viewImagesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingVertical: 4,
  },
  viewImagesText: { fontSize: 12, color: "#C35822", fontWeight: "500" },
  refundDate: { fontSize: 11, color: "#8F796F", marginBottom: 12 },
  refundStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  refundStatusText: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refundStatusPending: { backgroundColor: "#FFF3E0", color: "#FFA500" },
  refundStatusApproved: { backgroundColor: "#E8F5E9", color: "#4CAF50" },
  refundStatusRejected: { backgroundColor: "#FFEBEE", color: "#F44336" },
  refundActionButtons: { flexDirection: "row", gap: 8 },
  refundActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  approveButton: { backgroundColor: "#4CAF50" },
  approveButtonText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  rejectButton: { backgroundColor: "#F44336" },
  rejectButtonText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  markRefundedButton: { backgroundColor: "#2196F3" },
  markRefundedButtonText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  noRefundsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noRefundsText: { fontSize: 14, color: "#8F796F", marginTop: 12 },
  imagesModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    height: "60%",
  },
  fullImage: {
    width: 300,
    height: 400,
    resizeMode: "contain",
  },
});
