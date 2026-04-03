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
  Timestamp,
  limit,
  setDoc
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
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  sendMessage: (conversationId: string, text: string) => Promise<boolean>;
  createConversation: (sellerId: string, sellerName: string) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  selectConversation: (conversation: Conversation | null) => void;
  refreshConversations: () => void;
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
      console.log('No user logged in, skipping conversations load');
      setLoading(false);
      return;
    }

    console.log('Loading conversations for user:', user.uid);

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Found ${snapshot.size} conversations`);
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        convos.push({ 
          id: doc.id, 
          ...data,
          unreadCount: data.unreadCount || {}
        } as Conversation);
      });
      setConversations(convos);
      setLoading(false);
    }, (error) => {
      console.error('Error loading conversations:', error);
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

    console.log('Loading messages for conversation:', currentConversation.id);

    const messagesRef = collection(db, 'conversations', currentConversation.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
      console.log(`Found ${snapshot.size} messages`);
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.unshift({ id: doc.id, ...doc.data(), conversationId: currentConversation.id } as Message);
      });
      setMessages(msgs);
    }, (error) => {
      console.error('Error loading messages:', error);
    });

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }
    };
  }, [currentConversation]);

  const sendMessage = async (conversationId: string, text: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) {
      console.error('Not logged in');
      return false;
    }
    if (!text.trim()) return false;

    setSending(true);
    try {
      console.log('Sending message to conversation:', conversationId);
      console.log('Message text:', text);
      console.log('Sender:', user.uid);
      
      const conversationRef = doc(db, 'conversations', conversationId);
      
      // Get conversation data first
      const conversationSnap = await getDoc(conversationRef);
      
      if (!conversationSnap.exists()) {
        console.error('Conversation not found:', conversationId);
        return false;
      }
      
      const conversationData = conversationSnap.data() as Conversation;
      console.log('Conversation data:', conversationData);
      
      // Determine other participant
      const otherParticipant = conversationData.participants.find(p => p !== user.uid);
      console.log('Other participant:', otherParticipant);
      
      // Prepare unread count update
      const currentUnread = conversationData.unreadCount || {};
      const newUnreadCount = { ...currentUnread };
      
      // Increment unread for other participant, reset for sender
      if (otherParticipant) {
        newUnreadCount[otherParticipant] = (newUnreadCount[otherParticipant] || 0) + 1;
      }
      newUnreadCount[user.uid] = 0;
      
      // Add message to subcollection
      const messagesRef = collection(conversationRef, 'messages');
      const messageData = {
        text: text.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        timestamp: Timestamp.now(),
        read: false,
      };
      
      await addDoc(messagesRef, messageData);
      console.log('Message added to Firestore');
      
      // Update conversation
      await updateDoc(conversationRef, {
        lastMessage: text.trim(),
        lastMessageTime: Timestamp.now(),
        lastMessageSenderId: user.uid,
        unreadCount: newUnreadCount,
        updatedAt: Timestamp.now(),
      });
      
      console.log('Conversation updated successfully');
      return true;
      
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
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
      
      if (conversation && conversation.unreadCount && conversation.unreadCount[user.uid] > 0) {
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
        console.log('Marked conversation as read:', conversationId);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const createConversation = async (sellerId: string, sellerName: string): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      return null;
    }

    console.log('Creating conversation with seller:', sellerId, sellerName);
    console.log('Current user:', user.uid);

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(
        c => c.participants.includes(sellerId) && c.participants.includes(user.uid)
      );
      
      if (existingConversation) {
        console.log('Conversation already exists:', existingConversation.id);
        return existingConversation.id;
      }

      // Get buyer info
      let buyerName = 'Customer';
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          buyerName = userData.fullName || user.displayName || user.email?.split('@')[0] || 'Customer';
        } else {
          buyerName = user.displayName || user.email?.split('@')[0] || 'Customer';
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        buyerName = user.displayName || 'Customer';
      }

      console.log('Buyer name:', buyerName);
      console.log('Seller name:', sellerName);

      // Create new conversation
      const conversationsRef = collection(db, 'conversations');
      const conversationId = `${user.uid}_${sellerId}_${Date.now()}`;
      
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
      console.log('Conversation created with ID:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const selectConversation = (conversation: Conversation | null) => {
    if (currentConversation?.id === conversation?.id) return;
    console.log('Selecting conversation:', conversation?.id);
    setCurrentConversation(conversation);
    if (conversation) {
      markAsRead(conversation.id);
    }
  };

  const refreshConversations = () => {
    setLoading(true);
    // The onSnapshot will automatically refresh
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
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};