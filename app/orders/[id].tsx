// app/orders/[id].tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// Mock order data (would come from database)
const ORDER_DATA = {
  "ORD-001": {
    id: "ORD-001",
    date: "March 1, 2026",
    status: "Shipped",
    items: [
      { name: "Spicy Tuyo", quantity: 2, price: 250, image: null },
      { name: "Spicy Bangus", quantity: 1, price: 250, image: null },
    ],
    subtotal: 750,
    shipping: 50,
    total: 800,
    paymentMethod: "Cash on Delivery",
    shippingAddress: {
      name: "Ryza Flores",
      phone: "+63 906 561 6297",
      address: "11 Chico St., Brgy. Quirino 2-A, Quezon City, Metro Manila 1102",
    },
    trackingNumber: "PHL-98765-1234",
    estimatedDelivery: "March 5, 2026",
    timeline: [
      { status: "Order Placed", date: "March 1, 2026 - 10:30 AM", completed: true },
      { status: "Order Confirmed", date: "March 1, 2026 - 2:15 PM", completed: true },
      { status: "Shipped", date: "March 2, 2026 - 9:00 AM", completed: true },
      { status: "Out for Delivery", date: "Estimated March 5, 2026", completed: false },
      { status: "Delivered", date: "Pending", completed: false },
    ],
  },
  "ORD-002": {
    id: "ORD-002",
    date: "February 25, 2026",
    status: "Delivered",
    items: [
      { name: "Spicy Tinapa", quantity: 3, price: 250, image: null },
    ],
    subtotal: 750,
    shipping: 50,
    total: 800,
    paymentMethod: "GCash",
    shippingAddress: {
      name: "Ryza Flores",
      phone: "+63 906 561 6297",
      address: "11 Chico St., Brgy. Quirino 2-A, Quezon City, Metro Manila 1102",
    },
    deliveredDate: "February 28, 2026",
    timeline: [
      { status: "Order Placed", date: "February 25, 2026 - 3:20 PM", completed: true },
      { status: "Order Confirmed", date: "February 25, 2026 - 5:00 PM", completed: true },
      { status: "Shipped", date: "February 26, 2026 - 10:30 AM", completed: true },
      { status: "Out for Delivery", date: "February 28, 2026 - 8:00 AM", completed: true },
      { status: "Delivered", date: "February 28, 2026 - 2:30 PM", completed: true },
    ],
  },
};

const STATUS_COLORS = {
  "Order Placed": "#8F796F",
  "Order Confirmed": "#4CAF50",
  "Shipped": "#2196F3",
  "Out for Delivery": "#FFA500",
  "Delivered": "#9C27B0",
};

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const order = ORDER_DATA[id as keyof typeof ORDER_DATA];

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#C35822" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#8F796F";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusCard}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>Placed on {order.date}</Text>
          
          <View style={styles.currentStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status}
            </Text>
          </View>

          {order.trackingNumber && (
            <View style={styles.trackingContainer}>
              <Text style={styles.trackingLabel}>Tracking Number:</Text>
              <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
            </View>
          )}

          {order.estimatedDelivery && (
            <Text style={styles.estimatedDelivery}>
              Estimated Delivery: {order.estimatedDelivery}
            </Text>
          )}

          {order.deliveredDate && (
            <Text style={styles.deliveredDate}>
              Delivered on: {order.deliveredDate}
            </Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Order Timeline</Text>
          {order.timeline.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  event.completed && styles.timelineDotCompleted
                ]}>
                  {event.completed && (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  )}
                </View>
                {index < order.timeline.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineStatus,
                  event.completed && styles.timelineStatusCompleted
                ]}>
                  {event.status}
                </Text>
                <Text style={styles.timelineDate}>{event.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemImagePlaceholder}>
                <Ionicons name="image-outline" size={24} color="#CCC" />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₱{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{order.subtotal}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryValue}>₱{order.shipping}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{order.total}</Text>
          </View>
          
          <View style={styles.paymentMethod}>
            <Ionicons name="card-outline" size={16} color="#8F796F" />
            <Text style={styles.paymentMethodText}>{order.paymentMethod}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.addressCard}>
          <Text style={styles.cardTitle}>Shipping Address</Text>
          <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
          <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
          <Text style={styles.addressText}>{order.shippingAddress.address}</Text>
        </View>

        {/* Need Help Button */}
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => Alert.alert("Contact Support", "support@marketmnl.com")}
        >
          <Ionicons name="help-circle-outline" size={20} color="#C35822" />
          <Text style={styles.helpButtonText}>Need Help?</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#32221B",
    marginTop: 16,
    marginBottom: 20,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statusCard: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 12,
  },
  currentStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  trackingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  trackingLabel: {
    fontSize: 14,
    color: "#8F796F",
    marginRight: 4,
  },
  trackingNumber: {
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
  },
  estimatedDelivery: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  deliveredDate: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  timelineCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: "center",
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "#E0DAD1",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  timelineDotCompleted: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E0DAD1",
    position: "absolute",
    top: 20,
    bottom: -16,
    left: 9,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 15,
    color: "#8F796F",
    marginBottom: 2,
  },
  timelineStatusCompleted: {
    color: "#32221B",
    fontWeight: "500",
  },
  timelineDate: {
    fontSize: 12,
    color: "#8F796F",
  },
  itemsCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#8F796F",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
  },
  summaryCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#8F796F",
  },
  summaryValue: {
    fontSize: 14,
    color: "#32221B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C35822",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 14,
    color: "#32221B",
  },
  addressCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C35822",
    gap: 6,
  },
  helpButtonText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  bottomPadding: {
    height: 20,
  },
});