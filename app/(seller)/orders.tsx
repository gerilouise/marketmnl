// app/(seller)/orders.tsx - No debug panel
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
  shippingAddress: {
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

  // Modal state for status update
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<{
    id: string;
    number: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);

  // Modal state for order details
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Load orders from Firebase when screen opens
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

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status =
          data.status?.charAt(0).toUpperCase() + data.status?.slice(1);
        ordersList.push({
          id: doc.id,
          ...data,
          status: status || "Pending",
        } as Order);
      });

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

      // Get the order to get customer ID before updating
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

      // CREATE NOTIFICATION FOR THE CUSTOMER
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
          console.log(
            `📧 Notification sent to customer for status: ${newStatus}`,
          );
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

        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.productName}>
          {mainProduct.productName} x{mainProduct.quantity}
          {otherItemsCount > 0 && ` +${otherItemsCount} more`}
        </Text>

        <View style={styles.datePriceRow}>
          <View style={styles.paymentMethodContainer}>
            <Ionicons name="card-outline" size={12} color="#8F796F" />
            <Text style={styles.paymentMethodText}>{item.paymentMethod}</Text>
          </View>
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
                <View style={styles.statusMessage}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={20}
                    color="#9C27B0"
                  />
                  <Text style={styles.statusMessageText}>Delivered</Text>
                </View>
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
                      {selectedOrder.customerName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer Email</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.customerEmail}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.paymentMethod}
                    </Text>
                  </View>

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
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>
                      ₱{selectedOrder.total.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>Shipping Address</Text>
                  <Text style={styles.addressName}>
                    {selectedOrder.shippingAddress?.fullName || "N/A"}
                  </Text>
                  <Text style={styles.addressPhone}>
                    {selectedOrder.shippingAddress?.phone || "N/A"}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedOrder.shippingAddress?.street &&
                    selectedOrder.shippingAddress?.street !== ""
                      ? `${selectedOrder.shippingAddress.street}, ${selectedOrder.shippingAddress.barangay || ""}, ${selectedOrder.shippingAddress.city || ""}, ${selectedOrder.shippingAddress.province || ""} ${selectedOrder.shippingAddress.zipCode || ""}`
                      : "No address provided"}
                  </Text>
                  <Text style={styles.addressLabel}>
                    Label: {selectedOrder.shippingAddress?.label || "N/A"}
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
  orderCount: {
    fontSize: 14,
    color: "#8F796F",
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
  categoriesWrapper: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesScrollContent: {
    paddingRight: 20,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 8,
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
  ordersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  orderDateSmall: {
    fontSize: 10,
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
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 12,
  },
  datePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    color: "#8F796F",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  actionButtonsContainer: {
    marginTop: 4,
    minHeight: 36,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
  },
  shippedButton: {
    backgroundColor: "#2196F3",
  },
  deliveredButton: {
    backgroundColor: "#9C27B0",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusMessageText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  clearFilterButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  clearFilterText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "500",
  },
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
  modalIcon: {
    marginBottom: 16,
  },
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
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
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
  cancelModalButtonText: {
    color: "#8F796F",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmModalButton: {
    backgroundColor: "#4CAF50",
  },
  confirmModalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
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
  detailsModalTitle: {
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C35822",
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
    fontSize: 12,
    color: "#C35822",
    fontWeight: "500",
  },
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
  closeDetailsButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
