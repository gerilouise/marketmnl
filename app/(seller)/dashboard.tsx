// app/(seller)/dashboard.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import React, { useState, useCallback, useEffect, useRef } from "react";
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
  customerName?: string;
  items: any[];
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: Timestamp;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Timestamp;
  orderId?: string;
  orderNumber?: string;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Track previous orders to detect new ones
  const previousOrderIds = useRef<Set<string>>(new Set());
  // Track product IDs for rating calculation
  const productIdsRef = useRef<string[]>([]);

  // Function to create order notification
  const createOrderNotification = async (sellerId: string, orderData: any, type: string) => {
    try {
      let title = "";
      let message = "";
      
      switch (type) {
        case "order_placed":
          title = "New Order Received! 🎉";
          message = `Order #${orderData.orderNumber} from ${orderData.customerName} - ₱${orderData.total.toFixed(2)}`;
          break;
        case "order_confirmed":
          title = "Order Confirmed ✅";
          message = `Order #${orderData.orderNumber} has been confirmed`;
          break;
        case "order_shipped":
          title = "Order Shipped 🚚";
          message = `Order #${orderData.orderNumber} is on its way`;
          break;
        case "order_delivered":
          title = "Order Delivered 📦";
          message = `Order #${orderData.orderNumber} has been delivered`;
          break;
        case "order_cancelled":
          title = "Order Cancelled ❌";
          message = `Order #${orderData.orderNumber} has been cancelled`;
          break;
        default:
          title = "Order Update";
          message = `Order #${orderData.orderNumber} has been updated`;
      }
      
      const notificationData = {
        userId: sellerId,
        title: title,
        message: message,
        type: type,
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        read: false,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ ${type} notification created for order ${orderData.orderNumber}`);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Calculate revenue based on payment method and status
  const calculateRevenue = (order: any) => {
    const paymentMethod = order.paymentMethod?.toLowerCase() || '';
    const status = order.status?.toLowerCase() || '';
    const total = order.total || 0;
    
    // Cash on Delivery - only count when delivered
    if (paymentMethod === 'cash on delivery' || paymentMethod === 'cod') {
      return status === 'delivered' ? total : 0;
    }
    
    // GCash, Maya, Credit Card - count immediately (pending or confirmed)
    // Also count for shipped and delivered statuses
    return (status === 'pending' || status === 'confirmed' || status === 'shipped' || status === 'delivered') ? total : 0;
  };

  // Calculate average rating from reviews
  const calculateAverageRating = async (productIds: string[]) => {
    if (productIds.length === 0) return 0;
    
    try {
      let totalRatingSum = 0;
      let totalReviewsCount = 0;
      
      for (const productId of productIds) {
        const reviewsRef = collection(db, 'reviews');
        const reviewsQuery = query(reviewsRef, where('productId', '==', productId));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        reviewsSnapshot.forEach((reviewDoc) => {
          const reviewData = reviewDoc.data();
          totalRatingSum += reviewData.rating || 0;
          totalReviewsCount++;
        });
      }
      
      return totalReviewsCount > 0 ? totalRatingSum / totalReviewsCount : 0;
    } catch (error) {
      console.error("Error calculating rating:", error);
      return 0;
    }
  };

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

      // Get seller name
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSellerName(userData.fullName?.split(' ')[0] || user.displayName || "Seller");
      } else {
        setSellerName(user.displayName || "Seller");
      }

      // Get products count and product IDs
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, where('sellerId', '==', user.uid));
      const productsSnapshot = await getDocs(productsQuery);
      const productsCount = productsSnapshot.size;
      const productIds: string[] = [];
      productsSnapshot.forEach((doc) => {
        productIds.push(doc.id);
      });
      productIdsRef.current = productIds;
      
      // Get orders and calculate revenue
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(
        ordersRef,
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);

      let totalRevenue = 0;
      let totalOrders = 0;
      const ordersList: Order[] = [];

      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        const orderStatus = orderData.status || 'pending';
        const orderTotal = orderData.total || 0;
        const paymentMethod = orderData.paymentMethod || 'Cash on Delivery';
        
        const revenueAmount = calculateRevenue(orderData);
        totalRevenue += revenueAmount;
        totalOrders++;

        ordersList.push({
          id: doc.id,
          orderNumber: orderData.orderNumber || doc.id.slice(-8).toUpperCase(),
          customerName: orderData.customerName || "Customer",
          items: orderData.items || [],
          status: orderStatus,
          total: orderTotal,
          paymentMethod: paymentMethod,
          createdAt: orderData.createdAt,
        });
      });

      // Calculate rating
      const averageRating = await calculateAverageRating(productIds);

      setStats({
        orders: totalOrders,
        revenue: totalRevenue,
        products: productsCount,
        rating: averageRating,
      });

      setRecentOrders(ordersList.slice(0, 5));
      
      // Update previous orders tracking
      const currentOrderIds = new Set(ordersList.map(o => o.id));
      previousOrderIds.current = currentOrderIds;
      
      console.log(`✅ Dashboard summary: ${productsCount} products, ${totalOrders} orders, ₱${totalRevenue} revenue, ${averageRating.toFixed(1)}⭐`);

    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up real-time listener for notifications (to get unread count)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      let unread = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const notification = {
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read || false,
          createdAt: data.createdAt,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
        };
        notificationsList.push(notification);
        if (!notification.read) unread++;
      });
      
      setNotifications(notificationsList);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time listener for orders (updates orders count, revenue, and recent orders)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('sellerId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log(`📦 Real-time orders update: ${snapshot.size} orders`);
      
      let totalRevenue = 0;
      let totalOrders = 0;
      const ordersList: Order[] = [];
      const currentOrderIds = new Set<string>();
      
      snapshot.forEach((doc) => {
        const orderData = doc.data();
        const orderStatus = orderData.status || 'pending';
        const orderTotal = orderData.total || 0;
        const paymentMethod = orderData.paymentMethod || 'Cash on Delivery';
        const orderId = doc.id;
        
        currentOrderIds.add(orderId);
        
        // Calculate revenue based on payment method and status
        const revenueAmount = calculateRevenue(orderData);
        totalRevenue += revenueAmount;
        totalOrders++;
        
        ordersList.push({
          id: orderId,
          orderNumber: orderData.orderNumber || doc.id.slice(-8).toUpperCase(),
          customerName: orderData.customerName || "Customer",
          items: orderData.items || [],
          status: orderStatus,
          total: orderTotal,
          paymentMethod: paymentMethod,
          createdAt: orderData.createdAt,
        });
      });
      
      // Check for new orders
      const newOrders = ordersList.filter(order => !previousOrderIds.current.has(order.id));
      
      if (newOrders.length > 0 && previousOrderIds.current.size > 0) {
        for (const newOrder of newOrders) {
          console.log(`🆕 New order detected: ${newOrder.orderNumber}`);
          await createOrderNotification(user.uid, newOrder, "order_placed");
          
          Alert.alert(
            "New Order! 🎉",
            `Order #${newOrder.orderNumber} from ${newOrder.customerName} - ₱${newOrder.total.toFixed(2)}`,
            [
              { text: "View Order", onPress: () => router.push("/(seller)/orders") },
              { text: "Dismiss", style: "cancel" }
            ]
          );
        }
      }
      
      // Update tracking
      previousOrderIds.current = currentOrderIds;
      
      // Sort by date (newest first)
      ordersList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });
      
      setStats(prev => ({
        ...prev,
        orders: totalOrders,
        revenue: totalRevenue,
      }));
      
      setRecentOrders(ordersList.slice(0, 5));
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time listener for products (updates products count)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('sellerId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`📦 Real-time products update: ${snapshot.size} products`);
      
      // Update product IDs ref for rating calculation
      const newProductIds: string[] = [];
      snapshot.forEach((doc) => {
        newProductIds.push(doc.id);
      });
      productIdsRef.current = newProductIds;
      
      setStats(prev => ({
        ...prev,
        products: snapshot.size,
      }));
      
      // Recalculate rating when products change
      calculateAverageRating(newProductIds).then(averageRating => {
        setStats(prev => ({
          ...prev,
          rating: averageRating,
        }));
        console.log(`⭐ Rating recalculated: ${averageRating.toFixed(1)}`);
      });
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time listener for reviews (updates rating only)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to all reviews for the seller's products
    // Since we can't listen to multiple collections efficiently, we'll listen to each product's reviews
    let reviewUnsubscribes: (() => void)[] = [];
    
    const setupReviewListeners = () => {
      // Clean up existing listeners
      reviewUnsubscribes.forEach(unsubscribe => unsubscribe());
      reviewUnsubscribes = [];
      
      // Set up listeners for each product
      productIdsRef.current.forEach((productId) => {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('productId', '==', productId));
        
        const unsubscribe = onSnapshot(q, () => {
          // Recalculate rating when any review changes
          calculateAverageRating(productIdsRef.current).then(averageRating => {
            setStats(prev => ({
              ...prev,
              rating: averageRating,
            }));
            console.log(`⭐ Rating updated from review change: ${averageRating.toFixed(1)}`);
          });
        });
        
        reviewUnsubscribes.push(unsubscribe);
      });
    };
    
    // Initial setup
    setupReviewListeners();
    
    // Re-setup when product IDs change
    const interval = setInterval(() => {
      if (productIdsRef.current.length > 0) {
        setupReviewListeners();
      }
    }, 5000);
    
    return () => {
      reviewUnsubscribes.forEach(unsubscribe => unsubscribe());
      clearInterval(interval);
    };
  }, []);

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

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text style={styles.productName}>
        {item.items?.[0]?.productName || "Product"} x{item.items?.[0]?.quantity || 1}
        {item.items?.length > 1 && ` +${item.items.length - 1} more`}
      </Text>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.orderTotal}>₱{item.total.toFixed(2)}</Text>
          <Text style={styles.paymentMethodText}>{item.paymentMethod}</Text>
        </View>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const formatRating = stats.rating > 0 ? stats.rating.toFixed(1) : "0.0";

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
      {/* Header with greeting and notification */}
      <View>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Magandang Araw,</Text>
            <Text style={styles.userName}>{sellerName || "Seller"}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push("/(seller)/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="#32221B" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
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
            <Text style={styles.statNumber}>{formatRating}</Text>
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
          <MaterialCommunityIcons name="robot-outline" size={30} color="white" />
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
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
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
  paymentMethodText: {
    fontSize: 10,
    color: "#8F796F",
    marginTop: 2,
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