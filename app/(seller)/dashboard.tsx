// app/(seller)/dashboard.tsx
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

// Mock data for seller dashboard
const SELLER_STATS = {
  name: "Jan Carlo",
  orders: 11,
  revenue: 9029,
  products: 3,
  rating: 4.9,
};

const RECENT_ORDERS = [
  {
    id: "ORD-001",
    customer: "Geri Hernia",
    product: "Authentic Bottled Pastil",
    quantity: 2,
    status: "Pending",
    total: 250.00,
    date: "2024-02-28",
  },
  {
    id: "ORD-002",
    customer: "Gian Murao",
    product: "Authentic Bottled Pastil",
    quantity: 2,
    status: "Confirmed",
    total: 250.00,
    date: "2024-02-27",
  },
  {
    id: "ORD-003",
    customer: "Maria Santos",
    product: "Spicy Tuyo",
    quantity: 3,
    status: "Shipped",
    total: 750.00,
    date: "2024-02-26",
  },
];

export default function SellerDashboardScreen() {
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const handleAddProduct = () => {
    router.push("/(seller)/products?action=add");
  };

  const handleViewOrders = () => {
    router.push("/(seller)/orders");
  };

  const handleViewOrderDetails = (orderId: string) => {
    router.push(`/(seller)/orders/${orderId}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Pending": return "#FFA500";
      case "Confirmed": return "#4CAF50";
      case "Shipped": return "#2196F3";
      case "Delivered": return "#9C27B0";
      default: return "#666";
    }
  };

  const renderOrderItem = ({ item }: { item: typeof RECENT_ORDERS[0] }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleViewOrderDetails(item.id)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customer}</Text>
      <Text style={styles.productName}>{item.product} x{item.quantity}</Text>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>₱{item.total.toFixed(2)}</Text>
        <Ionicons name="chevron-forward" size={20} color="#8F796F" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with greeting and separator */}
      <View>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Magandang Araw,</Text>
            <Text style={styles.userName}>{SELLER_STATS.name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#32221B" />
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="bag-handle-outline" size={24} color="#C35822" />
            </View>
            <Text style={styles.statNumber}>{SELLER_STATS.orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash-outline" size={24} color="#C35822" />
            </View>
            <Text style={styles.statNumber}>₱{SELLER_STATS.revenue}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cube-outline" size={24} color="#C35822" />
            </View>
            <Text style={styles.statNumber}>{SELLER_STATS.products}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Text style={styles.statNumber}>{SELLER_STATS.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addProductButton} onPress={handleAddProduct}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addProductText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewOrdersButton} onPress={handleViewOrders}>
            <Ionicons name="eye-outline" size={20} color="#C35822" />
            <Text style={styles.viewOrdersText}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={handleViewOrders}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={RECENT_ORDERS}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.ordersList}
          />
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* AI Chatbot Floating Button */}
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => router.push('/chat')}
        activeOpacity={0.8}
      >
        <View style={styles.chatButtonInner}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#FFF" />
        </View>
      </TouchableOpacity>
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
  greeting: {
    fontSize: 14,
    color: "#8F796F",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#32221B",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0DAD1",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#8F796F",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 12,
  },
  addProductButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addProductText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  viewOrdersButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  viewOrdersText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "600",
  },
  recentOrdersSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  seeAllText: {
    fontSize: 14,
    color: "#C35822",
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
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
  orderId: {
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
    fontSize: 15,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  bottomPadding: {
    height: 80, // Extra padding for chat button
  },
  // AI Chatbot Floating Button
  chatButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 999,
  },
  chatButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  }
});