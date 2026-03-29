// contexts/CartContext.tsx
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface CartItem {
  id: string;
  userId: string;
  sellerId: string;
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
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  loadCart: () => Promise<void>;
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeSelectedItems: () => Promise<void>;
  clearCart: () => Promise<void>;
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

      // Remove any duplicates based on productId and sellerId
      const uniqueItems = items.reduce((acc: CartItem[], current) => {
        const exists = acc.find(
          (item) =>
            item.productId === current.productId &&
            item.sellerId === current.sellerId,
        );
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      setCartItems(uniqueItems);
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
        (item) =>
          item.productId === product.id && item.sellerId === product.sellerId,
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
          sellerId: product.sellerId,
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
        setCartItems((prev) => [...prev, { id: docRef.id, ...newItem }]);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  // Update the removeFromCart function in your CartContext.tsx
  const removeFromCart = async (itemId: string) => {
    console.log("🔴 removeFromCart called with ID:", itemId);
    try {
      // First check if the item exists
      const itemToDelete = cartItems.find((item) => item.id === itemId);
      if (!itemToDelete) {
        console.log("⚠️ Item not found in local cart:", itemId);
      } else {
        console.log("📦 Deleting item:", itemToDelete.productName);
      }

      // Delete from Firestore
      const itemRef = doc(db, "carts", itemId);
      await deleteDoc(itemRef);
      console.log("✅ Successfully deleted from Firestore");

      // Update local state
      setCartItems((prev) => {
        const newItems = prev.filter((item) => item.id !== itemId);
        console.log("📊 Cart items after removal:", newItems.length);
        return newItems;
      });

      setSelectedItems((prev) => {
        const newSelected = prev.filter((item) => item.id !== itemId);
        return newSelected;
      });
    } catch (error) {
      console.error("❌ Error removing from cart:", error);
      throw error;
    }
  };

  const removeSelectedItems = async () => {
    try {
      const batch = writeBatch(db);
      selectedItems.forEach((item) => {
        const itemRef = doc(db, "carts", item.id);
        batch.delete(itemRef);
      });
      await batch.commit();

      // Update local state
      const remainingItems = cartItems.filter(
        (item) => !selectedItems.some((selected) => selected.id === item.id),
      );
      setCartItems(remainingItems);
      setSelectedItems([]);
    } catch (error) {
      console.error("Error removing selected items:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const batch = writeBatch(db);
      cartItems.forEach((item) => {
        const itemRef = doc(db, "carts", item.id);
        batch.delete(itemRef);
      });
      await batch.commit();
      setCartItems([]);
      setSelectedItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
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
        updatedAt: Timestamp.now(),
      });

      setCartItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
      );

      setSelectedItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
      );
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
        setCartItems,
        loadCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        removeSelectedItems,
        clearCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
