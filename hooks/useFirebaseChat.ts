// hooks/useFirebaseChat.ts
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useState } from "react";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
}

export interface Conversation {
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

export function useFirebaseChat() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const user = auth.currentUser;

  // Load all conversations for current user
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid),
        orderBy("lastMessageTime", "desc"),
      );

      const snapshot = await getDocs(q);
      const conversations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];

      return conversations;
    } catch (error) {
      console.error("Error loading conversations:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      if (!conversationId) return [];

      try {
        const messagesRef = collection(
          db,
          "conversations",
          conversationId,
          "messages",
        );
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        console.log(
          `Loaded ${messages.length} messages for conversation ${conversationId}`,
        );
        return messages;
      } catch (error) {
        console.error("Error loading messages:", error);
        return [];
      }
    },
    [],
  );

  // Send a message
  const sendMessage = useCallback(
    async (conversationId: string, text: string): Promise<boolean> => {
      if (!user || !text.trim()) return false;

      setSending(true);
      try {
        // Add message to subcollection
        await addDoc(
          collection(db, "conversations", conversationId, "messages"),
          {
            text: text.trim(),
            senderId: user.uid,
            senderName: user.displayName || user.email?.split("@")[0] || "User",
            timestamp: Timestamp.now(),
          },
        );

        // Update conversation last message
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessage: text.trim(),
          lastMessageTime: Timestamp.now(),
        });

        console.log("Message sent successfully");
        return true;
      } catch (error) {
        console.error("Send message error:", error);
        return false;
      } finally {
        setSending(false);
      }
    },
    [user],
  );

  // Create or get existing conversation
  const getOrCreateConversation = useCallback(
    async (sellerId: string, sellerName: string): Promise<string | null> => {
      if (!user) return null;
      if (user.uid === sellerId) return null;

      try {
        // Check for existing conversation
        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
        );

        const snapshot = await getDocs(q);
        let existingId: string | null = null;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.participants?.includes(sellerId)) {
            existingId = doc.id;
          }
        });

        if (existingId) return existingId;

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

        const docRef = await addDoc(
          collection(db, "conversations"),
          newConversation,
        );
        console.log("New conversation created with ID:", docRef.id);
        return docRef.id;
      } catch (error) {
        console.error("Error creating conversation:", error);
        return null;
      }
    },
    [user],
  );

  return {
    loadConversations,
    loadMessages,
    sendMessage,
    getOrCreateConversation,
    loading,
    sending,
  };
}
