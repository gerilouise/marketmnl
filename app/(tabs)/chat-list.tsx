// app/(tabs)/chat-list.tsx
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export default function ChatListScreen() {
  const { getCurrentUser } = useFirebaseAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get all conversations for this user
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", user.uid),
        orderBy("lastMessageTime", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const conversationList: Conversation[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        // Get the other participant's ID
        const otherParticipantId = data.participants.find(
          (p: string) => p !== user.uid
        );
        
        if (otherParticipantId) {
          // Get user details from either sellers or buyers collection
          let otherUserName = "User";
          let otherUserAvatar = null;
          
          // Try to get from sellers collection first
          const sellerRef = doc(db, "sellers", otherParticipantId);
          const sellerSnap = await getDoc(sellerRef);
          
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            otherUserName = sellerData.storeName || sellerData.sellerName || "Seller";
            otherUserAvatar = sellerData.avatar || null;
          } else {
            // Try to get from buyers collection
            const buyerRef = doc(db, "buyers", otherParticipantId);
            const buyerSnap = await getDoc(buyerRef);
            if (buyerSnap.exists()) {
              const buyerData = buyerSnap.data();
              otherUserName = buyerData.fullName || buyerData.displayName || "Customer";
              otherUserAvatar = buyerData.avatar || null;
            } else {
              // Try to get from users collection
              const userRef = doc(db, "users", otherParticipantId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                otherUserName = userData.displayName || userData.email || "User";
                otherUserAvatar = userData.avatar || null;
              }
            }
          }
          
          conversationList.push({
            id: docSnapshot.id,
            otherUserId: otherParticipantId,
            otherUserName: otherUserName,
            otherUserAvatar: otherUserAvatar,
            lastMessage: data.lastMessage || "No messages yet",
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            unreadCount: data.unreadCount?.[user.uid] || 0,
          });
        }
      }
      
      setConversations(conversationList);
    } catch (error) {
      console.error("Error loading conversations:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      const user = getCurrentUser();
      if (!user) return;
      
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${user.uid}`]: 0
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const navigateToChatDetail = async (conversation: Conversation) => {
    // Mark as read before navigating
    await markConversationAsRead(conversation.id);
    
    // Navigate to chat detail
    router.push({
      pathname: "/chat-detail",
      params: {
        id: conversation.id,
        sellerName: conversation.otherUserName,
        userId: conversation.otherUserId,
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigateToChatDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.otherUserAvatar ? (
          <Image source={{ uri: item.otherUserAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-outline" size={24} color="#8F796F" />
          </View>
        )}
        {item.unreadCount > 0 && <View style={styles.unreadDot} />}
      </View>
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={[
            styles.conversationName,
            item.unreadCount > 0 && styles.unreadName
          ]} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          <Text style={styles.conversationTime}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <Text style={[
          styles.lastMessage,
          item.unreadCount > 0 && styles.unreadMessage
        ]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C35822" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#E0DAD1" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            When you message a seller, your conversations will appear here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#C35822"]}
              tintColor="#C35822"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8F796F",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#C35822",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    flex: 1,
  },
  unreadName: {
    fontWeight: "700",
    color: "#C35822",
  },
  conversationTime: {
    fontSize: 11,
    color: "#8F796F",
  },
  lastMessage: {
    fontSize: 13,
    color: "#8F796F",
  },
  unreadMessage: {
    fontWeight: "500",
    color: "#32221B",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});