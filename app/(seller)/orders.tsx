// app/(seller)/orders.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Mock orders data
const ORDERS_DATA = [
  {
    id: "ORD-001",
    orderNumber: "ORD-001",
    customer: "Geri Hernia",
    product: "Authentic Bottled Pastil",
    quantity: 2,
    status: "Pending",
    date: "February 10, 2026",
    total: 250.00,
  },
  {
    id: "ORD-002",
    orderNumber: "ORD-002",
    customer: "Gian Murao",
    product: "Authentic Bottled Pastil",
    quantity: 2,
    status: "Confirmed",
    date: "February 09, 2026",
    total: 250.00,
  },
  {
    id: "ORD-003",
    orderNumber: "ORD-003",
    customer: "Ryza Flores",
    product: "Authentic Bottled Pastil",
    quantity: 2,
    status: "Shipped",
    date: "February 09, 2026",
    total: 250.00,
  },
  {
    id: "ORD-004",
    orderNumber: "ORD-004",
    customer: "Ryza Flores",
    product: "Authentic Bottled Pastil",
    quantity: 2,
    status: "Delivered",
    date: "February 09, 2026",
    total: 250.00,
  },
];

const STATUS_CATEGORIES = ["All", "Pending", "Confirmed", "Shipped", "Delivered"];

export default function OrdersScreen() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [orders, setOrders] = useState(ORDERS_DATA);

  const filteredOrders = orders.filter(order => 
    selectedStatus === "All" ? true : order.status === selectedStatus
  );

  const handleConfirmOrder = (orderId: string) => {
    Alert.alert(
      "Confirm Order",
      "Are you sure you want to confirm this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            setOrders(prev => 
              prev.map(order => 
                order.id === orderId 
                  ? { ...order, status: "Confirmed" } 
                  : order
              )
            );
          },
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
          onPress: () => {
            setOrders(prev => 
              prev.map(order => 
                order.id === orderId 
                  ? { ...order, status: "Shipped" } 
                  : order
              )
            );
          },
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
          onPress: () => {
            setOrders(prev => 
              prev.map(order => 
                order.id === orderId 
                  ? { ...order, status: "Cancelled" } 
                  : order
              )
            );
          },
        },
      ]
    );
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

  const renderOrderItem = ({ item }: { item: typeof ORDERS_DATA[0] }) => (
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
      <Text style={styles.customerName}>{item.customer}</Text>
      <Text style={styles.productName}>{item.product} x{item.quantity}</Text>

      {/* Date and Price Row */}
      <View style={styles.datePriceRow}>
        <Text style={styles.orderDate}>{item.date}</Text>
        <Text style={styles.orderTotal}>₱{item.total.toFixed(2)}</Text>
      </View>

      {/* Action Buttons below date and price */}
      <View style={styles.actionButtonsContainer}>
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
          <View style={styles.statusMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
            <Text style={styles.statusMessageText}>Shipped</Text>
          </View>
        )}

        {item.status === "Delivered" && (
          <View style={styles.statusMessage}>
            <Ionicons name="checkmark-done-circle" size={20} color="#9C27B0" />
            <Text style={styles.statusMessageText}>Delivered</Text>
          </View>
        )}
      </View>
    </View>
  );

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
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
   fullWidthButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#C35822", // Orange
  },
  cancelButton: {
    backgroundColor: "#C35822", // Orange
  },
  shippedButton: {
    backgroundColor: "#C35822", // Orange
    paddingHorizontal: 105,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusMessageText: {
    fontSize: 13,
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