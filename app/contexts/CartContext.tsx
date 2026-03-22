// contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface CartItem {
  id: string;
  userId: string;
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

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <CartContext.Provider
      value={{ cartItems, selectedItems, setSelectedItems, loadCart, loading }}
    >
      {children}
    </CartContext.Provider>
  );
};
