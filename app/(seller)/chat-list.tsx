// app/(seller)/chat-list.tsx
import { Conversation, useFirebaseChat } from "@/hooks/useFirebaseChat";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SellerChatListScreen() {
  const { loadConversations, loading } = useFirebaseChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadData = useCallback(async () => {
    const data = await loadConversations();
    setConversations(data);
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      loadData();

      // Auto-refresh every 5 seconds
      const interval = setInterval(() => {
        loadData();
      }, 5000);

      return () => clearInterval(interval);
    }, [loadData]),
  );

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => {
              router.push({
                pathname: "/(seller)/chat-detail",
                params: {
                  id: item.id,
                  buyerName: item.buyerName,
                  sellerName: item.sellerName,
                },
              });
            }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.buyerName || "CU").substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.name}>{item.buyerName || "Customer"}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage || "No messages yet"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySub}>Customers will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F4" },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#32221B" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  chatItem: {
    flexDirection: "row",
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  chatInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#32221B", marginBottom: 4 },
  lastMessage: { fontSize: 14, color: "#8F796F" },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#32221B",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 8,
    textAlign: "center",
  },
});
