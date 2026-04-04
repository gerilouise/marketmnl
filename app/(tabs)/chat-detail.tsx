// app/(tabs)/chat-detail.tsx
import { useChat } from "@/app/contexts/ChatContext";
import { auth } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Timestamp } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatDetailScreen() {
  const params = useLocalSearchParams();
  const {
    conversations,
    messages,
    sendMessage,
    sending,
    selectConversation,
    markAsRead,
    createConversation,
  } = useChat();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConversationData, setCurrentConversationData] =
    useState<any>(null);

  const conversationId = params.conversationId as string;
  const sellerId = params.sellerId as string;
  const sellerName = params.sellerName as string;

  // Find and set the correct conversation
  useEffect(() => {
    const findConversation = async () => {
      setIsLoading(true);

      try {
        let conversation = null;

        // If we have a conversationId, find it in the list
        if (conversationId) {
          conversation = conversations.find((c) => c.id === conversationId);
        }

        // If not found and we have seller info, create or find existing
        if (!conversation && sellerId && sellerName) {
          // Check if conversation already exists with this seller
          conversation = conversations.find(
            (c) =>
              c.participants.includes(sellerId) &&
              c.participants.includes(auth.currentUser?.uid || ""),
          );

          if (!conversation) {
            // Create new conversation
            const newId = await createConversation(sellerId, sellerName);
            if (newId) {
              // Wait a bit for the conversation to be added to the list
              setTimeout(() => {
                const newConv = conversations.find((c) => c.id === newId);
                if (newConv) {
                  setCurrentConversationData(newConv);
                  selectConversation(newConv);
                  markAsRead(newConv.id);
                  setIsLoading(false);
                } else {
                  setIsLoading(false);
                  Alert.alert("Error", "Could not create conversation");
                }
              }, 1000);
              return;
            }
          }
        }

        if (conversation) {
          setCurrentConversationData(conversation);
          selectConversation(conversation);
          await markAsRead(conversation.id);
        } else if (!sellerId && !sellerName && !conversationId) {
          Alert.alert("Error", "No conversation specified");
        }
      } catch (error) {
        console.error("Error finding conversation:", error);
        Alert.alert("Error", "Could not load conversation");
      } finally {
        setIsLoading(false);
      }
    };

    findConversation();
  }, [conversationId, sellerId, sellerName, conversations]);

  // Update when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    if (!currentConversationData) {
      Alert.alert("Error", "No active conversation");
      return;
    }

    const success = await sendMessage(currentConversationData.id, inputText);
    if (success) {
      setInputText("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    if (!item || !item.id) return null;

    const isMyMessage = item.senderId === auth.currentUser?.uid;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDate =
      index === 0 ||
      (prevMessage &&
        prevMessage.timestamp?.toDate().toDateString() !==
          item.timestamp?.toDate().toDateString());

    return (
      <View key={item.id}>
        {showDate && item.timestamp && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>
              {item.senderName ||
                currentConversationData?.sellerName ||
                "Seller"}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          {item.timestamp && (
            <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentConversationData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="chatbubble-outline" size={60} color="#E0DAD1" />
          <Text style={styles.errorText}>Could not load conversation</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const otherPersonName =
    currentConversationData.sellerId === auth.currentUser?.uid
      ? currentConversationData.buyerName
      : currentConversationData.sellerName;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherPersonName}</Text>
          <Text style={styles.headerSubtitle}>
            {currentConversationData.sellerId === auth.currentUser?.uid
              ? "Customer"
              : "Seller"}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Send a message to start the conversation
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#8F796F"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#32221B",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#8F796F",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 4,
    padding: 12,
    borderRadius: 20,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#C35822",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#C35822",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFF",
  },
  otherMessageText: {
    color: "#32221B",
  },
  timeText: {
    fontSize: 10,
    color: "#8F796F",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#32221B",
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 8,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0DAD1",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F0EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: "#32221B",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
});
