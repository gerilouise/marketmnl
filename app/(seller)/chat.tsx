// app/(seller)/chat.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Mock chat conversations data
const CHAT_CONVERSATIONS = [
  {
    id: "1",
    name: "Geri Hernia",
    lastMessage: "Hello, What is the update with my order?",
    time: "4:30 PM",
    unread: true,
    avatar: null,
    online: true,
  },
  {
    id: "2",
    name: "Patricia Joy",
    lastMessage: "Hello, What is the update with my order?",
    time: "4:15 PM",
    unread: true,
    avatar: null,
    online: false,
  },
  {
    id: "3",
    name: "Mark Noe",
    lastMessage: "Hello, What is the update with my order?",
    time: "4:00 PM",
    unread: false,
    avatar: null,
    online: true,
  },
  {
    id: "4",
    name: "Jan Carlo",
    lastMessage: "Okay.. Thank You!",
    time: "4:00 PM",
    unread: false,
    avatar: null,
    online: false,
  },
];

export default function ChatScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState(CHAT_CONVERSATIONS);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = (conversationId: string, name: string) => {
    // Navigate to individual chat screen
    Alert.alert("Open Chat", `Opening chat with ${name}`);
    // router.push(`/seller/chat/${conversationId}`);
  };

  const renderConversationItem = ({ item }: { item: typeof CHAT_CONVERSATIONS[0] }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => handleChatPress(item.id, item.name)}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      {/* Conversation Details */}
      <View style={styles.conversationDetails}>
        <View style={styles.conversationHeader}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text 
            style={[styles.messageText, item.unread && styles.unreadMessageText]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread && <View style={styles.unreadBadge} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#8F796F" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#8F796F"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.conversationsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No conversations found</Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#32221B",
  },
  conversationsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  conversationDetails: {
    flex: 1,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  timeText: {
    fontSize: 12,
    color: "#8F796F",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: "#8F796F",
    marginRight: 8,
  },
  unreadMessageText: {
    color: "#32221B",
    fontWeight: "500",
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C35822",
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