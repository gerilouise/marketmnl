// app/(seller)/orders.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  Timestamp 
} from 'firebase/firestore';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    zipCode: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sellerId: string;
}

const STATUS_CATEGORIES = ["All", "Pending", "Confirmed", "Shipped", "Delivered"];

export default function OrdersScreen() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Load orders from Firebase when screen opens
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in');
        router.push('/auth/login');
        return;
      }

      // Query orders where sellerId matches current user
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ordersList: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      setOrders(ordersList);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update order status in Firebase
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );

      Alert.alert('Success', `Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleConfirmOrder = (orderId: string) => {
    Alert.alert(
      "Confirm Order",
      "Are you sure you want to confirm this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateOrderStatus(orderId, 'Confirmed'),
        },
      ]
    );
  };

  const handleMarkAsShipped = (orderId: string) => {
    Alert.alert(
      "Mark as Shipped",
      "Are you sure you want to mark this order as shipped?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Shipped",
          onPress: () => updateOrderStatus(orderId, 'Shipped'),
        },
      ]
    );
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => updateOrderStatus(orderId, 'Cancelled'),
        },
      ]
    );
  };

  const handleMarkAsDelivered = (orderId: string) => {
    Alert.alert(
      "Mark as Delivered",
      "Mark this order as delivered?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => updateOrderStatus(orderId, 'Delivered'),
        },
      ]
    );
  };

  const getFilteredOrders = () => {
    if (selectedStatus === "All") {
      return orders;
    }
    return orders.filter(order => order.status === selectedStatus);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Pending": return "#FFA500";
      case "Confirmed": return "#4CAF50";
      case "Shipped": return "#2196F3";
      case "Delivered": return "#9C27B0";
      case "Cancelled": return "#FF3B30";
      default: return "#8F796F";
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isUpdating = updatingOrderId === item.id;
    const mainProduct = item.items[0]; // Show first product as main
    const otherItemsCount = item.items.length - 1;

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Customer and Product */}
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.productName}>
          {mainProduct.productName} x{mainProduct.quantity}
          {otherItemsCount > 0 && ` +${otherItemsCount} more`}
        </Text>

        {/* Date and Price Row */}
        <View style={styles.datePriceRow}>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.orderTotal}>₱{item.total.toFixed(2)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#C35822" />
          ) : (
            <>
              {item.status === "Pending" && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => handleConfirmOrder(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancelOrder(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {item.status === "Confirmed" && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.shippedButton]}
                  onPress={() => handleMarkAsShipped(item.id)}
                >
                  <Text style={styles.actionButtonText}>Mark as Shipped</Text>
                </TouchableOpacity>
              )}

              {item.status === "Shipped" && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deliveredButton]}
                  onPress={() => handleMarkAsDelivered(item.id)}
                >
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </TouchableOpacity>
              )}

              {item.status === "Delivered" && (
                <View style={styles.statusMessage}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#9C27B0" />
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
      </View>
    );
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      {/* Status Categories */}
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
                  selectedStatus === status && styles.categoryChipActive
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedStatus === status && styles.categoryChipTextActive
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Orders List */}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
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
  orderDate: {
    fontSize: 12,
    color: "#8F796F",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
    marginTop: 4,
    minHeight: 36,
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
    backgroundColor: "#4CAF50", // Green for Confirm
  },
  cancelButton: {
    backgroundColor: "#FF3B30", // Red for Cancel
  },
  shippedButton: {
    backgroundColor: "#2196F3", // Blue for Shipped
  },
  deliveredButton: {
    backgroundColor: "#9C27B0", // Purple for Delivered
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
});