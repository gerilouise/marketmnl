// app/(seller)/dashboard.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import React, { useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  customerName?: string;
  product: string;
  productName?: string;
  quantity: number;
  status: string;
  total: number;
  date: string;
  createdAt?: any;
}

export default function SellerDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    products: 0,
    rating: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Fetch seller data from Firebase
  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        setLoading(false);
        return;
      }

      console.log("📊 Fetching dashboard data for seller:", user.uid);

      // 1. Get seller name from users collection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSellerName(userData.fullName?.split(' ')[0] || user.displayName || "Seller");
      } else {
        setSellerName(user.displayName || "Seller");
      }

      // 2. Get seller's products count
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, where('sellerId', '==', user.uid));
      const productsSnapshot = await getDocs(productsQuery);
      const productsCount = productsSnapshot.size;
      
      // Log products found
      console.log(`📦 Found ${productsCount} products`);
      productsSnapshot.forEach((doc) => {
        const product = doc.data();
        console.log(`  - ${product.name} (ID: ${doc.id})`);
      });
      
      // 3. Get all product IDs for this seller
      const productIds: string[] = [];
      productsSnapshot.forEach((doc) => {
        productIds.push(doc.id);
      });
      
      // 4. Calculate average rating from product reviews
      let totalRatingSum = 0;
      let totalReviewsCount = 0;
      
      // Fetch reviews for each product
      for (const productId of productIds) {
        const reviewsRef = collection(db, 'product_reviews');
        const reviewsQuery = query(reviewsRef, where('productId', '==', productId));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        reviewsSnapshot.forEach((reviewDoc) => {
          const reviewData = reviewDoc.data();
          totalRatingSum += reviewData.rating || 0;
          totalReviewsCount++;
        });
      }
      
      const averageRating = totalReviewsCount > 0 ? totalRatingSum / totalReviewsCount : 0;
      console.log(`⭐ Rating: ${averageRating.toFixed(1)} from ${totalReviewsCount} reviews`);
      
      // 5. Get seller's orders
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(
        ordersRef,
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const ordersSnapshot = await getDocs(ordersQuery);

      let totalRevenue = 0;
      const ordersList: Order[] = [];

      console.log(`📋 Found ${ordersSnapshot.size} orders`);
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        const orderTotal = orderData.total || 0;
        totalRevenue += orderTotal;
        
        console.log(`  - Order ${orderData.orderNumber}: ₱${orderTotal} (${orderData.status})`);

        ordersList.push({
          id: doc.id,
          orderNumber: orderData.orderNumber || doc.id.slice(-8).toUpperCase(),
          customer: orderData.customerName || orderData.customer || "Customer",
          product: orderData.productName || orderData.product || "Product",
          quantity: orderData.quantity || 1,
          status: orderData.status || "Pending",
          total: orderTotal,
          date: orderData.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
          createdAt: orderData.createdAt,
        });
      });

      setStats({
        orders: ordersSnapshot.size,
        revenue: totalRevenue,
        products: productsCount,
        rating: averageRating,
      });

      setRecentOrders(ordersList);
      console.log(`✅ Dashboard summary: ${productsCount} products, ${ordersSnapshot.size} orders, ₱${totalRevenue} revenue, ${averageRating.toFixed(1)}⭐ rating`);

    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when screen mounts
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const handleAddProduct = () => {
    router.push("/(seller)/product-manage");
  };

  const handleViewOrders = () => {
    router.push("/(seller)/orders");
  };

  const handleViewOrderDetails = (orderId: string) => {
    router.push({
      pathname: "/(seller)/orders",
      params: { orderId: orderId }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
        return "#666";
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleViewOrderDetails(item.id)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{item.orderNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customer}</Text>
      <Text style={styles.productName}>
        {item.product} x{item.quantity}
      </Text>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>₱{item.total.toFixed(2)}</Text>
        <Text style={styles.orderDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  // Format rating to 1 decimal place
  const formattedRating = stats.rating > 0 ? stats.rating.toFixed(1) : "0.0";

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Magandang Araw,</Text>
            <Text style={styles.userName}>Loading...</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#32221B" />
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with greeting and separator */}
      <View>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Magandang Araw,</Text>
            <Text style={styles.userName}>{sellerName || "Seller"}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#32221B" />
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="bag-handle-outline" size={24} color="#C35822" />
            </View>
            <Text style={styles.statNumber}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash-outline" size={24} color="#C35822" />
            </View>
            <Text style={styles.statNumber}>₱{stats.revenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cube-outline" size={24} color="#C35822" />
            </View>
            <Text style={styles.statNumber}>{stats.products}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="star" size={24} color="#FFD700" />
            </View>
            <Text style={styles.statNumber}>{formattedRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
            {stats.rating === 0 && (
              <Text style={styles.noRatingText}>No reviews yet</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={handleAddProduct}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addProductText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewOrdersButton}
            onPress={handleViewOrders}
          >
            <Ionicons name="eye-outline" size={20} color="#C35822" />
            <Text style={styles.viewOrdersText}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {recentOrders.length > 0 && (
              <TouchableOpacity onPress={handleViewOrders}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentOrders.length > 0 ? (
            <FlatList
              data={recentOrders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.ordersList}
            />
          ) : (
            <View style={styles.emptyOrdersContainer}>
              <Ionicons name="receipt-outline" size={50} color="#E0DAD1" />
              <Text style={styles.emptyOrdersText}>No orders yet</Text>
              <Text style={styles.emptyOrdersSubtext}>
                When customers place orders, they'll appear here
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* AI Chatbot Floating Button */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => router.push("/chatbot")}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  noRatingText: {
    fontSize: 10,
    color: "#C35822",
    marginTop: 4,
    fontStyle: "italic",
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
  orderDate: {
    fontSize: 11,
    color: "#8F796F",
  },
  emptyOrdersContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginTop: 8,
  },
  emptyOrdersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginTop: 12,
  },
  emptyOrdersSubtext: {
    fontSize: 13,
    color: "#8F796F",
    marginTop: 4,
    textAlign: "center",
  },
  bottomPadding: {
    height: 80,
  },
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
  },
});