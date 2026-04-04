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
}

interface RefundRequest {
  id: string;
  productId: string;
  productName: string;
  reason: string;
  otherReason?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
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
];

export default function OrdersScreen() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
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
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(
    null,
  );
  const [processingRefund, setProcessingRefund] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Please log in");
        router.push("/auth/login");
        return;
      }

      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("sellerId", "==", user.uid));

      const querySnapshot = await getDocs(q);
      const ordersList: Order[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const status =
          data.status?.charAt(0).toUpperCase() + data.status?.slice(1);
        ordersList.push({
          id: docSnapshot.id,
          ...data,
          status: status || "Pending",
        } as Order);
      }

      ordersList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      setOrders(ordersList);
    } catch (error) {
      console.error("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRefundRequests = async (orderId: string) => {
    try {
      const refundsRef = collection(db, "refund_requests");
      const q = query(refundsRef, where("orderId", "==", orderId));
      const querySnapshot = await getDocs(q);

      const requests: RefundRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          productId: data.productId,
          productName: data.productName,
          reason: data.reason,
          otherReason: data.otherReason,
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      setRefundRequests(requests);
    } catch (error) {
      console.error("Error loading refund requests:", error);
    }
  };

  const updateRefundStatus = async (
    refundId: string,
    status: "approved" | "rejected",
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

      // Notify customer about refund decision
      if (selectedOrder) {
        const notificationTitle =
          status === "approved" ? "Refund Approved ✓" : "Refund Request Update";
        const notificationMessage =
          status === "approved"
            ? `Your refund for order #${selectedOrder.orderNumber} has been approved. The amount will be credited to your account within 3-5 business days.`
            : `Your refund request for order #${selectedOrder.orderNumber} has been reviewed. Please contact support for more information.`;

        await createNotification({
          userId: selectedOrder.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: "order_refund_updated",
          orderId: selectedOrder.id,
          orderNumber: selectedOrder.orderNumber,
          read: false,
          createdAt: Timestamp.now(),
        });
      }

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
    await loadRefundRequests(order.id);
    setRefundModalVisible(true);
  };

  const closeRefundModal = () => {
    setRefundModalVisible(false);
    setRefundRequests([]);
    setSelectedRefund(null);
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
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
            ? { ...order, status: newStatus as Order["status"] }
            : order,
        ),
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus as Order["status"] } : null,
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
    showStatusConfirmation(orderId, orderNumber, "Pending", "Confirmed");
  };

  const handleMarkAsShipped = (orderId: string, orderNumber: string) => {
    showStatusConfirmation(orderId, orderNumber, "Confirmed", "Shipped");
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    showStatusConfirmation(orderId, orderNumber, "Pending", "Cancelled");
  };

  const handleMarkAsDelivered = (orderId: string, orderNumber: string) => {
    showStatusConfirmation(orderId, orderNumber, "Shipped", "Delivered");
  };

  const getFilteredOrders = () => {
    if (selectedStatus === "All") {
      return orders;
    }
    return orders.filter((order) => order.status === selectedStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#FFA500";
      case "Confirmed":
        return "#4CAF50";
      case "Shipped":
        return "#2196F3";
      case "Delivered":
        return "#9C27B0";
      case "Cancelled":
        return "#FF3B30";
      default:
        return "#8F796F";
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
              {item.status}
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

        <View style={styles.actionButtonsContainer}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#C35822" />
          ) : (
            <>
              {item.status === "Pending" && (
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
              {item.status === "Confirmed" && (
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
              {item.status === "Shipped" && (
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
              {item.status === "Delivered" && (
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
              {item.status === "Cancelled" && (
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
            {STATUS_CATEGORIES.map((status) => (
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
                    selectedStatus === status && styles.categoryChipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
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
              loadOrders();
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
                {orderToUpdate?.currentStatus}
              </Text>{" "}
              to{" "}
              <Text style={{ fontWeight: "bold", color: "#4CAF50" }}>
                {orderToUpdate?.newStatus}
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
                        {selectedOrder.status}
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

              {refundRequests.length === 0 ? (
                <View style={styles.noRefundsContainer}>
                  <Ionicons name="cash-outline" size={50} color="#E0DAD1" />
                  <Text style={styles.noRefundsText}>
                    No refund requests for this order
                  </Text>
                </View>
              ) : (
                refundRequests.map((request) => (
                  <View key={request.id} style={styles.refundRequestCard}>
                    <Text style={styles.refundProductName}>
                      {request.productName}
                    </Text>
                    <View style={styles.refundReasonBox}>
                      <Text style={styles.refundReasonLabel}>Reason:</Text>
                      <Text style={styles.refundReasonText}>
                        {request.reason === "others"
                          ? request.otherReason
                          : request.reason === "missing_items"
                            ? "Missing Items"
                            : request.reason === "damaged_item"
                              ? "Damaged Item"
                              : request.reason === "duplicate_order"
                                ? "Duplicate Order"
                                : request.reason === "wrong_item"
                                  ? "Wrong Item Received"
                                  : request.reason}
                      </Text>
                    </View>
                    <Text style={styles.refundDate}>
                      Requested: {formatShortDate(request.createdAt)}
                    </Text>

                    <View style={styles.refundStatusContainer}>
                      <Text
                        style={[
                          styles.refundStatusText,
                          request.status === "pending" &&
                            styles.refundStatusPending,
                          request.status === "approved" &&
                            styles.refundStatusApproved,
                          request.status === "rejected" &&
                            styles.refundStatusRejected,
                        ]}
                      >
                        {request.status === "pending"
                          ? "Pending Review"
                          : request.status === "approved"
                            ? "Approved"
                            : "Rejected"}
                      </Text>

                      {request.status === "pending" && (
                        <View style={styles.refundActionButtons}>
                          <TouchableOpacity
                            style={[
                              styles.refundActionButton,
                              styles.approveButton,
                            ]}
                            onPress={() =>
                              updateRefundStatus(request.id, "approved")
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
                              updateRefundStatus(request.id, "rejected")
                            }
                            disabled={processingRefund}
                          >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipActive: { backgroundColor: "#C35822", borderColor: "#C35822" },
  categoryChipText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryChipTextActive: { color: "#FFF" },
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
  refundProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 8,
  },
  refundReasonBox: { marginBottom: 8 },
  refundReasonLabel: { fontSize: 12, color: "#8F796F", marginBottom: 4 },
  refundReasonText: { fontSize: 14, color: "#32221B", lineHeight: 18 },
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
  noRefundsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noRefundsText: { fontSize: 14, color: "#8F796F", marginTop: 12 },
});
