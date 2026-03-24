// app/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  limit
} from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  read: boolean;
  conversationId: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastMessageSenderId: string;
  unreadCount: { [userId: string]: number };
  sellerId: string;
  buyerId: string;
  sellerName: string;
  buyerName: string;
  sellerImage?: string;
  buyerImage?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  createConversation: (sellerId: string, sellerName: string) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  selectConversation: (conversation: Conversation | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  let unsubscribeMessages: (() => void) | null = null;

  // Load conversations for current user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        convos.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load messages for current conversation
  useEffect(() => {
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }

    if (!currentConversation) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'conversations', currentConversation.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.unshift({ id: doc.id, ...doc.data(), conversationId: currentConversation.id } as Message);
      });
      setMessages(msgs);
    });

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }
    };
  }, [currentConversation]);

  const sendMessage = async (conversationId: string, text: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not logged in');
    if (!text.trim()) return;

    setSending(true);
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const messagesRef = collection(conversationRef, 'messages');
      
      // Add message
      await addDoc(messagesRef, {
        text: text.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        timestamp: Timestamp.now(),
        read: false,
      });

      // Update conversation last message
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        const otherParticipant = conversation.participants.find(p => p !== user.uid);
        const unreadCount = { ...conversation.unreadCount };
        if (otherParticipant) {
          unreadCount[otherParticipant] = (unreadCount[otherParticipant] || 0) + 1;
        }
        
        await updateDoc(conversationRef, {
          lastMessage: text.trim(),
          lastMessageTime: Timestamp.now(),
          lastMessageSenderId: user.uid,
          unreadCount: unreadCount,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversation = conversations.find(c => c.id === conversationId);
      
      if (conversation && conversation.unreadCount[user.uid] > 0) {
        const newUnreadCount = { ...conversation.unreadCount };
        delete newUnreadCount[user.uid];
        
        await updateDoc(conversationRef, {
          unreadCount: newUnreadCount,
        });
        
        // Update local state
        setConversations(prev => 
          prev.map(c => 
            c.id === conversationId 
              ? { ...c, unreadCount: newUnreadCount }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const createConversation = async (sellerId: string, sellerName: string): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(
        c => c.participants.includes(sellerId) && c.participants.includes(user.uid)
      );
      
      if (existingConversation) {
        return existingConversation.id;
      }

      // Get buyer info
      const buyerDoc = await getDoc(doc(db, 'users', user.uid));
      const buyerData = buyerDoc.data();
      const buyerName = buyerData?.fullName || user.displayName || user.email?.split('@')[0] || 'Customer';

      // Create new conversation
      const conversationsRef = collection(db, 'conversations');
      const newConversation = {
        participants: [user.uid, sellerId],
        sellerId: sellerId,
        buyerId: user.uid,
        sellerName: sellerName,
        buyerName: buyerName,
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        lastMessageSenderId: '',
        unreadCount: { [sellerId]: 0, [user.uid]: 0 },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(conversationsRef, newConversation);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const selectConversation = (conversation: Conversation | null) => {
    if (currentConversation?.id === conversation?.id) return;
    setCurrentConversation(conversation);
    if (conversation) {
      markAsRead(conversation.id);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        loading,
        sending,
        sendMessage,
        createConversation,
        markAsRead,
        selectConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};