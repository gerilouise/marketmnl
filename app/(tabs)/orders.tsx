// app/(tabs)/orders.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    Timestamp,
    where,
    orderBy,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
  productPrice: number;
  quantity: number;
  sellerName: string;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  address: any;
  status: string; // pending, confirmed, shipped, delivered, cancelled
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  userEmail: string;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  originalOrderId?: string;
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
  { id: "delivered", label: "Delivered", icon: "checkmark-done-circle-outline" },
  { id: "cancelled", label: "Cancelled", icon: "close-circle-outline" },
];

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const loadOrders = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        setOrders([]);
        setFilteredOrders([]);
        setLoading(false);
        return;
      }

      console.log("Loading orders for user:", user.uid);

      // Fetch from orders collection (active orders)
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const ordersSnapshot = await getDocs(q);

      // Fetch from cancelled_orders collection
      const cancelledOrdersRef = collection(db, "cancelled_orders");
      const cancelledQ = query(
        cancelledOrdersRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const cancelledSnapshot = await getDocs(cancelledQ);

      const ordersList: Order[] = [];

      // Add active orders
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        ordersList.push({ id: doc.id, ...data } as Order);
      });

      // Add cancelled orders
      cancelledSnapshot.forEach((doc) => {
        const data = doc.data();
        ordersList.push({ id: doc.id, ...data } as Order);
      });

      console.log("Total orders found:", ordersList.length);

      setOrders(ordersList);
      filterOrders(activeTab, ordersList);
    } catch (error) {
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
      setFilteredOrders(ordersList.filter((o) => o.status === status));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
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

  const getActionButton = (order: Order) => {
    // Show cancel button for pending orders only
    if (order.status === "pending") {
      return (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelOrder(order)}
        >
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      );
    }

    // Show track button for shipped orders
    if (order.status === "shipped") {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => handleTrackOrder(order)}
        >
          <Text style={styles.secondaryButtonText}>Track Package</Text>
        </TouchableOpacity>
      );
    }

    // Show review button for delivered orders
    if (order.status === "delivered") {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.reviewButton]}
          onPress={() => handleWriteReview(order)}
        >
          <Text style={styles.reviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const handleTrackOrder = (order: Order) => {
    Alert.alert("Track Order", `Tracking information for ${order.orderNumber}`);
  };

  const handleWriteReview = (order: Order) => {
    Alert.alert("Write Review", `Write a review for your items`);
  };

  const handleCancelOrder = async (order: Order) => {
    Alert.alert(
      "Cancel Order",
      `Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const user = auth.currentUser;
              if (!user) throw new Error("User not logged in");

              // 1. Get the original order data
              const orderRef = doc(db, "orders", order.id);

              // 2. Create cancelled order record
              const cancelledOrder = {
                ...order,
                originalOrderId: order.id,
                status: "cancelled",
                cancelledAt: Timestamp.now(),
                cancellationReason: "User requested cancellation",
                cancelledBy: user.uid,
                cancelledByEmail: user.email,
                updatedAt: Timestamp.now(),
              };

              // 3. Save to cancelled_orders collection
              const cancelledOrdersRef = collection(db, "cancelled_orders");
              await addDoc(cancelledOrdersRef, cancelledOrder);
              console.log("✅ Order moved to cancelled_orders");

              // 4. Delete from original orders collection
              await deleteDoc(orderRef);
              console.log("✅ Order deleted from orders collection");

              // 5. Refresh the orders list
              await loadOrders();

              // 6. Close modal if open
              if (showOrderModal) {
                closeOrderModal();
              }

              Alert.alert(
                "Success",
                `Order ${order.orderNumber} has been cancelled`
              );
            } catch (error) {
              console.error("Error cancelling order:", error);
              Alert.alert("Error", "Failed to cancel order. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
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

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => openOrderDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>

      <View style={styles.orderItems}>
        {item.items &&
          item.items.slice(0, 2).map((orderItem, index) => (
            <View key={index} style={styles.orderItemRow}>
              <View style={styles.itemImagePlaceholder}>
                <Ionicons name="image-outline" size={20} color="#CCC" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {orderItem.productName}
                </Text>
                <Text style={styles.itemQuantity}>
                  Qty: {orderItem.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                ₱{orderItem.productPrice * orderItem.quantity}
              </Text>
            </View>
          ))}
        {item.items && item.items.length > 2 && (
          <Text style={styles.moreItems}>
            +{item.items.length - 2} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₱{item.total.toFixed(2)}</Text>
        </View>
        <View style={styles.actionButtonsContainer}>
          {getActionButton(item)}
        </View>
      </View>

      {/* Status Message */}
      <View style={styles.statusMessageContainer}>
        <Ionicons 
          name={item.status === "delivered" ? "checkmark-done-circle" : 
                item.status === "shipped" ? "car" :
                item.status === "cancelled" ? "close-circle" : "time-outline"} 
          size={14} 
          color={getStatusColor(item.status)} 
        />
        <Text style={[styles.statusMessageText, { color: getStatusColor(item.status) }]}>
          {getStatusMessage(item.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Order Details Modal Component
  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    const canCancel = selectedOrder.status === "pending";

    return (
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
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
                name={selectedOrder.status === "delivered" ? "checkmark-done-circle" : 
                      selectedOrder.status === "shipped" ? "car" :
                      selectedOrder.status === "cancelled" ? "close-circle" : "time-outline"} 
                size={16} 
                color={getStatusColor(selectedOrder.status)} 
              />
              <Text style={[styles.modalStatusMessageText, { color: getStatusColor(selectedOrder.status) }]}>
                {getStatusMessage(selectedOrder.status)}
              </Text>
            </View>

            {/* Cancellation Info */}
            {selectedOrder.status === "cancelled" &&
              selectedOrder.cancelledAt && (
                <View style={styles.cancellationInfo}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#F44336"
                  />
                  <Text style={styles.cancellationText}>
                    Cancelled on {formatDate(selectedOrder.cancelledAt)}
                  </Text>
                </View>
              )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Order Summary Title */}
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>

            {/* Items List */}
            {selectedOrder.items?.map((item, index) => (
              <View key={index} style={styles.orderSummaryItem}>
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
                <Text style={styles.orderSummaryPrice}>
                  ₱{item.productPrice * item.quantity}
                </Text>
              </View>
            ))}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Subtotal */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subtotal</Text>
              <Text style={styles.detailValue}>₱{selectedOrder.subtotal.toFixed(2)}</Text>
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
                <Text style={styles.addressText} numberOfLines={3}>
                  {selectedOrder.address.street}, {selectedOrder.address.barangay}, {selectedOrder.address.city}
                  , {selectedOrder.address.province} {selectedOrder.address.zipCode}
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
                  handleCancelOrder(selectedOrder);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
            {selectedOrder.status === "shipped" && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  closeOrderModal();
                  handleTrackOrder(selectedOrder);
                }}
              >
                <Text style={styles.confirmButtonText}>Track Package</Text>
              </TouchableOpacity>
            )}
            {selectedOrder.status === "delivered" && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  closeOrderModal();
                  handleWriteReview(selectedOrder);
                }}
              >
                <Text style={styles.confirmButtonText}>Write Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
        <View style={{ width: 40 }} />
      </View>

      {/* Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}
      >
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => handleTabChange(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? "#C35822" : "#8F796F"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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

      {/* Order Details Modal */}
      {showOrderModal && <OrderDetailsModal />}
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
  tabsScroll: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  tabsContainer: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#C35822",
  },
  tabText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#C35822",
    fontWeight: "600",
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
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
  },
  orderDate: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 12,
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
  orderItems: {
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: "#F5F0EB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 11,
    color: "#8F796F",
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C35822",
  },
  moreItems: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 4,
    fontStyle: "italic",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginBottom: 12,
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
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  secondaryButton: {
    backgroundColor: "#F5F0EB",
    borderWidth: 1,
    borderColor: "#C35822",
  },
  secondaryButtonText: {
    color: "#C35822",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewButton: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  reviewButtonText: {
    color: "#C35822",
    fontSize: 12,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F44336",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "600",
  },
  statusMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  modalScrollContent: {
    paddingBottom: 20,
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
  orderSummaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  orderSummaryPrice: {
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
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  confirmButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButtonModal: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F44336",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancellationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    gap: 8,
  },
  cancellationText: {
    fontSize: 12,
    color: "#F44336",
    flex: 1,
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
});