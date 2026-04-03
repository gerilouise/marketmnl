// app/(customer)/chat-detail.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useChat } from '@/app/contexts/ChatContext';
import { auth } from '@/lib/firebase';

export default function ChatDetailScreen() {
  const { conversationId, sellerId, sellerName } = useLocalSearchParams();
  const { conversations, messages, sendMessage, sending, selectConversation, markAsRead, refreshConversations, loading } = useChat();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [localLoading, setLocalLoading] = useState(true);

  // Find and select the conversation when component mounts
  useEffect(() => {
    const findAndSelectConversation = async () => {
      console.log('Looking for conversation with ID:', conversationId);
      console.log('All conversations:', conversations.map(c => ({ id: c.id, participants: c.participants })));
      
      if (conversationId) {
        let conversation = conversations.find(c => c.id === conversationId);
        
        // If not found by ID, try to find by participants
        if (!conversation && sellerId && auth.currentUser) {
          conversation = conversations.find(
            c => c.participants.includes(sellerId as string) && 
                 c.participants.includes(auth.currentUser?.uid || '')
          );
          console.log('Found conversation by participants:', conversation?.id);
        }
        
        if (conversation) {
          selectConversation(conversation);
          await markAsRead(conversation.id);
        } else {
          console.log('Conversation not found, refreshing...');
          refreshConversations();
          // Wait a bit and try again
          setTimeout(() => {
            const conv = conversations.find(c => c.id === conversationId);
            if (conv) {
              selectConversation(conv);
              markAsRead(conv.id);
            }
          }, 1000);
        }
      }
      setLocalLoading(false);
    };
    
    findAndSelectConversation();
  }, [conversationId, conversations, sellerId]);

  const handleSend = async () => {
    if (!inputText.trim()) {
      return;
    }
    
    if (!conversationId) {
      Alert.alert('Error', 'No conversation selected');
      return;
    }
    
    console.log('Sending message to conversation:', conversationId);
    console.log('Message:', inputText.trim());
    
    const success = await sendMessage(conversationId as string, inputText.trim());
    
    if (success) {
      setInputText('');
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } else {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.senderId === auth.currentUser?.uid;
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.sellerMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.sellerBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.sellerMessageText]}>
            {item.text}
          </Text>
          <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  const otherName = sellerName || 'Seller';

  if (localLoading || (loading && conversations.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={50} color="#E0DAD1" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8F796F"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#C35822" />
            ) : (
              <Ionicons name="send" size={20} color={inputText.trim() ? "#C35822" : "#E0DAD1"} />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FBF8F4",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: "row",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  sellerMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#C35822",
    borderBottomRightRadius: 4,
  },
  sellerBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFF",
  },
  sellerMessageText: {
    color: "#32221B",
  },
  messageTime: {
    fontSize: 10,
    color: "#8F796F",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0DAD1",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F0EB",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#32221B",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  sendButtonDisabled: {
    backgroundColor: "#F5F0EB",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#32221B",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 4,
  },
});