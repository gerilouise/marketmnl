// app/(tabs)/chat-detail.tsx
import { Message, useFirebaseChat } from "@/hooks/useFirebaseChat";
import { auth } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  const conversationId = params.id as string;
  const sellerName = params.sellerName as string;

  const { sendMessage, loadMessages, sending, getOtherParticipantName } =
    useFirebaseChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadData = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const data = await loadMessages(conversationId);
    setMessages(data);
    setLoading(false);
  }, [conversationId, loadMessages]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const success = await sendMessage(conversationId, inputText);
    if (success) {
      setInputText("");
      // Reload messages after sending
      const newMessages = await loadMessages(conversationId);
      setMessages(newMessages);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === auth.currentUser?.uid;
    return (
      <View
        style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}
      >
        <View
          style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.textMe : styles.textOther,
            ]}
          >
            {item.text}
          </Text>
          <Text style={styles.time}>
            {item.timestamp?.toDate().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{sellerName || "Seller"}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={60} color="#E0DAD1" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySub}>Send a message to start</Text>
            </View>
          }
        />
      )}

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
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendDisabled,
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
  container: { flex: 1, backgroundColor: "#FBF8F4" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
    marginLeft: 12,
  },
  messageList: { padding: 16, paddingBottom: 20 },
  messageRow: { marginBottom: 12 },
  rowRight: { alignItems: "flex-end" },
  rowLeft: { alignItems: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 20 },
  bubbleMe: { backgroundColor: "#C35822" },
  bubbleOther: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  textMe: { color: "#FFF" },
  textOther: { color: "#32221B" },
  time: { fontSize: 10, color: "#8F796F", marginTop: 4, alignSelf: "flex-end" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
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
  sendDisabled: { backgroundColor: "#E0DAD1" },
});
