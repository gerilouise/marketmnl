// app/contexts/ChatContext.tsx
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
}

interface Conversation {
  id: string;
  participants: string[];
  sellerId: string;
  buyerId: string;
  sellerName: string;
  buyerName: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  createdAt: Timestamp;
}

interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  loading: boolean;
  sending: boolean;
  currentConversationId: string | null;
  sendMessage: (conversationId: string, text: string) => Promise<boolean>;
  createConversation: (
    sellerId: string,
    sellerName: string,
  ) => Promise<string | null>;
  selectConversation: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const user = auth.currentUser;

  // Load conversations for current user
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setConversations([]);
      return;
    }

    console.log("Loading conversations for user:", user.uid);

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversationList: Conversation[] = [];
        snapshot.forEach((doc) => {
          conversationList.push({ id: doc.id, ...doc.data() } as Conversation);
        });
        console.log("Loaded conversations:", conversationList.length);
        setConversations(conversationList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading conversations:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      return;
    }

    console.log("Loading messages for conversation:", currentConversationId);

    const messagesRef = collection(
      db,
      "conversations",
      currentConversationId,
      "messages",
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messageList: Message[] = [];
        snapshot.forEach((doc) => {
          messageList.push({ id: doc.id, ...doc.data() } as Message);
        });
        console.log("Loaded messages:", messageList.length);
        setMessages(messageList);
      },
      (error) => {
        console.error("Error loading messages:", error);
      },
    );

    return () => unsubscribe();
  }, [currentConversationId]);

  const sendMessage = async (
    conversationId: string,
    text: string,
  ): Promise<boolean> => {
    if (!user || !text.trim()) {
      console.log("Cannot send: no user or empty text");
      return false;
    }

    setSending(true);
    console.log("Sending message to conversation:", conversationId);

    try {
      // Add message to subcollection
      const messagesRef = collection(
        db,
        "conversations",
        conversationId,
        "messages",
      );
      await addDoc(messagesRef, {
        text: text.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email?.split("@")[0] || "User",
        timestamp: Timestamp.now(),
      });

      // Update conversation metadata
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        lastMessage: text.trim(),
        lastMessageTime: Timestamp.now(),
      });

      console.log("Message sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    } finally {
      setSending(false);
    }
  };

  const createConversation = async (
    sellerId: string,
    sellerName: string,
  ): Promise<string | null> => {
    if (!user) {
      console.log("Cannot create conversation: no user logged in");
      return null;
    }

    console.log("Creating conversation with seller:", sellerId, sellerName);
    console.log("Current user:", user.uid, user.displayName);

    if (user.uid === sellerId) {
      console.log("Cannot create conversation with self");
      return null;
    }

    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", user.uid),
      );

      const querySnapshot = await getDocs(q);
      let existingConversation: Conversation | null = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Conversation;
        if (data.participants.includes(sellerId)) {
          existingConversation = { id: doc.id, ...data };
        }
      });

      if (existingConversation) {
        console.log("Conversation already exists:", existingConversation.id);
        return existingConversation.id;
      }

      // Create new conversation
      const buyerName =
        user.displayName || user.email?.split("@")[0] || "Customer";
      const newConversation = {
        participants: [user.uid, sellerId],
        sellerId: sellerId,
        buyerId: user.uid,
        sellerName: sellerName,
        buyerName: buyerName,
        lastMessage: "",
        lastMessageTime: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      console.log("Creating new conversation:", newConversation);

      const docRef = await addDoc(
        collection(db, "conversations"),
        newConversation,
      );
      console.log("Conversation created with ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const selectConversation = (conversationId: string) => {
    console.log("Selecting conversation:", conversationId);
    setCurrentConversationId(conversationId);
  };

  const value = {
    conversations,
    messages,
    loading,
    sending,
    currentConversationId,
    sendMessage,
    createConversation,
    selectConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
