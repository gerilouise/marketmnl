// app/chat.tsx
import { auth } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isMenu?: boolean;
  options?: string[];
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const from = (params.from as string) || "home"; // Get where we came from

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isChatActive, setIsChatActive] = useState(true);
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    email?: string;
    step?: string;
  }>({});
  const flatListRef = useRef<FlatList>(null);

  const currentUser = auth.currentUser;

  // Handle back button based on where we came from
  const handleBack = () => {
    if (from === "profile") {
      router.push("/(tabs)/profile");
    } else if (from === "settings") {
      router.push("/(tabs)/settings");
    } else {
      router.back(); // Default behavior for home or unknown
    }
  };

  // Initialize chat with greeting
  const initializeChat = () => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      text: "👋 Hello! Welcome to MarketMNL Support. I'm your virtual assistant.\n\nPlease share your name so I can assist you better:",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);

    // If user is already logged in, set email automatically
    if (currentUser?.email) {
      setUserInfo({
        step: "asking_name",
        email: currentUser.email,
      });
    } else {
      setUserInfo({ step: "asking_name" });
    }
    setIsChatActive(true);
  };

  // Reset and restart chat
  const resetAndStartNewChat = () => {
    setMessages([]);
    setIsChatActive(true);
    initializeChat();
  };

  useEffect(() => {
    initializeChat();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, isUser: boolean, options?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      isMenu: !!options,
      options,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const showMainMenu = () => {
    const menuMessage: Message = {
      id: Date.now().toString(),
      text: "What would you like to know about?",
      isUser: false,
      timestamp: new Date(),
      isMenu: true,
      options: [
        "🛍️ Orders & Delivery",
        "🚚 Shipping Information",
        "📍 Delivery Areas",
        "👤 Account & Profile",
        "🛒 Products & Orders",
        "❓ Frequently Asked Questions",
        "🔚 End Chat",
      ],
    };
    setMessages((prev) => [...prev, menuMessage]);
  };

  const handleOptionSelect = (option: string) => {
    // Handle End Chat option
    if (option === "🔚 End Chat") {
      addMessage(option, true);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(
          "Thank you for chatting with us! 🙏\n\n" +
            "Your conversation has been saved. Starting a new chat for you...",
          false,
        );
        setTimeout(() => {
          resetAndStartNewChat();
        }, 2000);
      }, 500);
      return;
    }

    addMessage(option, true);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (option === "🛍️ Orders & Delivery") {
        addMessage(
          "📦 **Orders & Delivery**\n\n" +
            "• Orders are processed within 24 hours\n" +
            "• You'll receive a confirmation email after ordering\n" +
            "• Track your order in the 'My Orders' section\n" +
            "• Delivery takes 3-7 business days\n" +
            "• Free shipping for orders ₱1,000 and above\n\n" +
            "Would you like to know anything else?",
          false,
        );
        setTimeout(() => showMainMenu(), 1500);
      } else if (option === "🚚 Shipping Information") {
        addMessage(
          "🚚 **Shipping Information**\n\n" +
            "• **Standard Delivery:** 3-7 business days (₱50)\n" +
            "• **Express Delivery:** 1-3 business days (₱150)\n" +
            "• **Same Day Delivery:** Available in Metro Manila (₱200)\n" +
            "• Orders are shipped Monday-Friday\n" +
            "• Tracking number provided via email\n\n" +
            "Need more help?",
          false,
        );
        setTimeout(() => showMainMenu(), 1500);
      } else if (option === "📍 Delivery Areas") {
        addMessage(
          "📍 **Delivery Areas**\n\n" +
            "We deliver to:\n" +
            "✓ **Metro Manila** - All cities\n" +
            "✓ **Luzon** - All provinces\n" +
            "✓ **Visayas** - Major cities (Cebu, Iloilo, Bacolod)\n" +
            "✓ **Mindanao** - Major cities (Davao, Cagayan de Oro, Zamboanga)\n\n" +
            "⚠️ Remote areas may take additional 2-3 days\n\n" +
            "Is your area covered?",
          false,
        );
        setTimeout(() => showMainMenu(), 1500);
      } else if (option === "👤 Account & Profile") {
        addMessage(
          "👤 **Account & Profile**\n\n" +
            "• **Edit Profile:** Go to Profile tab → Edit Profile\n" +
            "• **Change Password:** Settings → Change Password\n" +
            "• **Add Address:** Profile → Shipping Address → Add Address\n" +
            "• **View Wishlist:** Wishlist tab\n" +
            "• **Order History:** Profile → My Orders\n\n" +
            "Need specific help?",
          false,
        );
        setTimeout(() => showMainMenu(), 1500);
      } else if (option === "🛒 Products & Orders") {
        addMessage(
          "🛒 **Products & Orders**\n\n" +
            "• **Browse Products:** Browse tab\n" +
            "• **Add to Cart:** Click product → Add to Cart\n" +
            "• **Checkout:** Cart tab → Checkout\n" +
            "• **Payment Methods:** GCash, Maya, Credit Card, COD\n" +
            "• **Returns:** 7-day return policy for damaged items\n\n" +
            "Questions about specific products?",
          false,
        );
        setTimeout(() => showMainMenu(), 1500);
      } else if (option === "❓ Frequently Asked Questions") {
        addMessage(
          "❓ **Frequently Asked Questions**\n\n" +
            "**Q: How do I track my order?**\n" +
            "A: Go to Profile → My Orders → Tap the order\n\n" +
            "**Q: Can I cancel my order?**\n" +
            "A: Yes, within 1 hour of placing the order\n\n" +
            "**Q: How do I apply promo codes?**\n" +
            "A: Enter code at checkout\n\n" +
            "**Q: What if I receive damaged items?**\n" +
            "A: Contact us within 24 hours with photo proof\n\n" +
            "**Q: How do I contact seller?**\n" +
            "A: Go to product page → Contact Seller\n\n" +
            "Need more help?",
          false,
        );
        setTimeout(() => showMainMenu(), 1500);
      }
    }, 500);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !isChatActive) return;

    const userMessage = inputText.trim();
    addMessage(userMessage, true);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // Handle name collection
      if (userInfo.step === "asking_name") {
        // Save the name
        setUserInfo({
          ...userInfo,
          name: userMessage,
          step: "name_collected",
        });

        // If user is already logged in, skip asking for email
        if (currentUser?.email) {
          addMessage(
            `Nice to meet you, ${userMessage}! 👋\n\n` +
              `Your email (${currentUser.email}) is already registered.\n\n` +
              "How can I help you today?",
            false,
          );
          setTimeout(() => showMainMenu(), 500);
        } else {
          // User is not logged in, ask for email
          setUserInfo({
            ...userInfo,
            name: userMessage,
            step: "asking_email",
          });
          addMessage(
            `Nice to meet you, ${userMessage}! 👋\n\n` +
              "Please share your email address so we can assist you better:",
            false,
          );
        }
      } else if (userInfo.step === "asking_email") {
        // Save the email
        setUserInfo({
          ...userInfo,
          email: userMessage,
          step: "done",
        });
        addMessage(
          `Thank you, ${userInfo.name}! Your email (${userMessage}) has been recorded. 📧\n\n` +
            "How can I help you today?",
          false,
        );
        setTimeout(() => showMainMenu(), 500);
      } else if (userInfo.step === "name_collected") {
        // User already provided name and email is from Firebase
        addMessage(
          "I'm here to help! Please select from the options below:",
          false,
        );
        setTimeout(() => showMainMenu(), 500);
      } else {
        // If user types something instead of selecting menu
        addMessage(
          "I'm here to help! Please select from the options below:",
          false,
        );
        setTimeout(() => showMainMenu(), 500);
      }
    }, 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text style={item.isUser ? styles.userText : styles.botText}>
          {item.text}
        </Text>

        {item.isMenu && item.options && (
          <View style={styles.optionsContainer}>
            {item.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleOptionSelect(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <View style={styles.botAvatar}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
        </View>
        <View
          style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}
        >
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, styles.typingDotDelay]} />
            <View style={[styles.typingDot, styles.typingDotDelayLong]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack} // Updated to use handleBack instead of router.back()
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#C35822" />
          <Text style={styles.headerTitle}>MarketMNL Assistant</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statusBar}>
        <Ionicons name="time-outline" size={14} color="#8F796F" />
        <Text style={styles.statusText}>
          Online • Usually replies in seconds
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderTypingIndicator}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#8F796F"
            value={inputText}
            onChangeText={setInputText}
            editable={!isTyping}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? "#C35822" : "#E0DAD1"}
            />
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
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    backgroundColor: "#FFF3E0",
  },
  statusText: {
    fontSize: 11,
    color: "#C35822",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
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
  botBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userText: {
    color: "#FFF",
    fontSize: 15,
  },
  botText: {
    color: "#32221B",
    fontSize: 15,
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 12,
    flexWrap: "wrap",
  },
  optionButton: {
    backgroundColor: "#F5F0EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  optionText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "500",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C35822",
    opacity: 0.6,
  },
  typingDotDelay: {
    opacity: 0.4,
  },
  typingDotDelayLong: {
    opacity: 0.2,
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
    borderColor: "#E0DAD1",
  },
});
