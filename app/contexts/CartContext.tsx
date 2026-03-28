// contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp 
} from "firebase/firestore";

interface CartItem {
  id: string;
  userId: string; // Customer ID
  sellerId: string; // ← ADD THIS - Seller ID
  productId: string;
  productName: string;
  productPrice: number;
  sellerName: string;
  quantity: number;
  imageUrl?: string | null;
  addedAt: any;
  updatedAt: any;
}

interface CartContextType {
  cartItems: CartItem[];
  selectedItems: CartItem[];
  setSelectedItems: (items: CartItem[]) => void;
  loadCart: () => Promise<void>;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const cartRef = collection(db, "carts");
      const q = query(cartRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const items: CartItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CartItem);
      });

      setCartItems(items);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Please login to add items to cart");
      }

      // Check if item already exists in cart
      const existingItem = cartItems.find(
        item => item.productId === product.id && item.sellerId === product.sellerId
      );

      if (existingItem) {
        // Update quantity if exists
        const newQuantity = existingItem.quantity + 1;
        await updateQuantity(existingItem.id, newQuantity);
      } else {
        // Add new item
        const cartRef = collection(db, "carts");
        const newItem = {
          userId: user.uid,
          sellerId: product.sellerId, // ← CRITICAL: Include sellerId
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          sellerName: product.sellerName || "Seller",
          quantity: 1,
          imageUrl: product.imageUrl || null,
          addedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        const docRef = await addDoc(cartRef, newItem);
        setCartItems([...cartItems, { id: docRef.id, ...newItem }]);
      }
      
      await loadCart(); // Reload to get updated items
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "carts", itemId));
      setCartItems(cartItems.filter(item => item.id !== itemId));
      setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }
      
      const itemRef = doc(db, "carts", itemId);
      await updateDoc(itemRef, {
        quantity,
        updatedAt: Timestamp.now()
      });
      
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
      
      // Also update selected items if this item is selected
      setSelectedItems(selectedItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <CartContext.Provider
      value={{ 
        cartItems, 
        selectedItems, 
        setSelectedItems, 
        loadCart, 
        addToCart,
        removeFromCart,
        updateQuantity,
        loading 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};