// app/(tabs)/notifications.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "order_placed"
    | "order_confirmed"
    | "order_shipped"
    | "order_delivered"
    | "order_cancelled";
  orderId?: string;
  orderNumber?: string;
  read: boolean;
  createdAt: Timestamp;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);

      const notificationsList: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notificationsList.push({ id: doc.id, ...doc.data() } as Notification);
      });

      setNotifications(notificationsList);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, "notifications", notification.id);
        await updateDoc(notificationRef, {
          read: true,
        });
      }

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true })),
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.orderId) {
      // Navigate to the orders tab and maybe pass the order ID to highlight it
      router.push("/(tabs)/orders");
    } else {
      router.push("/(tabs)/orders");
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_placed":
        return "cart-outline";
      case "order_confirmed":
        return "checkmark-circle-outline";
      case "order_shipped":
        return "car-outline";
      case "order_delivered":
        return "checkmark-done-circle-outline";
      case "order_cancelled":
        return "close-circle-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order_placed":
        return "#FFA500";
      case "order_confirmed":
        return "#4CAF50";
      case "order_shipped":
        return "#2196F3";
      case "order_delivered":
        return "#9C27B0";
      case "order_cancelled":
        return "#F44336";
      default:
        return "#C35822";
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIconContainer}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
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
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
            <Ionicons name="notifications-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When you receive notifications, they'll appear here
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  markAllText: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  unreadNotification: {
    backgroundColor: "#FFF9F0",
    borderLeftWidth: 3,
    borderLeftColor: "#C35822",
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: "#8F796F",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C35822",
    position: "absolute",
    top: 16,
    right: 16,
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
    paddingHorizontal: 40,
  },
});
