// app/(tabs)/orders.tsx
import { cancelOrder } from "@/app/services/orders";
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
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
  productPrice: number;
  quantity: number;
  sellerName: string;
  sellerId?: string;
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
  {
    id: "delivered",
    label: "Delivered",
    icon: "checkmark-done-circle-outline",
  },
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
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );

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

      // Fetch from orders collection (active orders)
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user.uid));
      const ordersSnapshot = await getDocs(q);

      // Fetch from cancelled_orders collection
      const cancelledOrdersRef = collection(db, "cancelled_orders");
      const cancelledQ = query(
        cancelledOrdersRef,
        where("userId", "==", user.uid),
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

      // Sort manually in JavaScript (newest first)
      ordersList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      console.log("✅ Total orders found:", ordersList.length);
      console.log("  - Active:", ordersSnapshot.size);
      console.log("  - Cancelled:", cancelledSnapshot.size);

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

  // FIXED: Cancel order using the cancelOrder service
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
            setCancellingOrderId(order.id);
            try {
              console.log("🔴 Cancelling order:", order.id, order.orderNumber);

              // Use the cancelOrder service to move to cancelled_orders collection
              const result = await cancelOrder(order.id, order);

              if (result.success) {
                console.log("✅ Order cancelled successfully!");

                // Reload orders to refresh the list
                await loadOrders();

                // Close modal if open
                if (showOrderModal) {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }

                Alert.alert(
                  "Success",
                  `Order ${order.orderNumber} has been cancelled`,
                );
              } else {
                throw new Error("Cancel order failed");
              }
            } catch (error: any) {
              console.error("❌ Error cancelling order:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to cancel order. Please try again.",
              );
            } finally {
              setCancellingOrderId(null);
            }
          },
        },
      ],
    );
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

    if (!mainProduct) {
      return (
        <View style={styles.orderCard}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.errorText}>No items found</Text>
        </View>
      );
    }

    // Don't show cancel button for already cancelled orders
    const isCancelled = item.status === "cancelled";

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
          {item.status === "pending" && !isCancelling && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={(e) => {
                e.stopPropagation();
                handleCancelOrder(item);
              }}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              )}
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
              <Text style={styles.trackButtonText}>Track Package</Text>
            </TouchableOpacity>
          )}
          {item.status === "delivered" && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={(e) => {
                e.stopPropagation();
                Alert.alert("Write Review", `Write a review for your items`);
              }}
            >
              <Text style={styles.reviewButtonText}>Write Review</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Message */}
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
                    ₱{(item.productPrice * item.quantity).toFixed(2)}
                  </Text>
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
                    handleCancelOrder(selectedOrder);
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
});
