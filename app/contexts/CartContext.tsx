import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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

interface StockCheckResult {
  available: boolean;
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  message?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  selectedItems: CartItem[];
  setSelectedItems: (items: CartItem[]) => void;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  loadCart: () => Promise<void>;
  addToCart: (product: any, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeSelectedItems: () => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
  checkMultipleItemsStock: (items: CartItem[]) => Promise<{ allAvailable: boolean; errors: string[] }>;
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

  const checkProductStock = async (productId: string, requestedQuantity: number): Promise<StockCheckResult> => {
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        return {
          available: false,
          productId,
          productName: "Unknown Product",
          requestedQuantity,
          availableStock: 0,
          message: "Product no longer exists",
        };
      }
      
      const product = productSnap.data();
      const currentStock = product.stockQuantity || 0;
      
      if (currentStock < requestedQuantity) {
        return {
          available: false,
          productId,
          productName: product.name || "Product",
          requestedQuantity,
          availableStock: currentStock,
          message: `Only ${currentStock} ${currentStock === 1 ? 'item' : 'items'} left in stock`,
        };
      }
      
      return {
        available: true,
        productId,
        productName: product.name || "Product",
        requestedQuantity,
        availableStock: currentStock,
      };
    } catch (error) {
      console.error("Error checking stock:", error);
      return {
        available: false,
        productId,
        productName: "Product",
        requestedQuantity,
        availableStock: 0,
        message: "Error checking stock availability",
      };
    }
  };

  const checkMultipleItemsStock = async (items: CartItem[]): Promise<{ allAvailable: boolean; errors: string[] }> => {
    const errors: string[] = [];
    
    for (const item of items) {
      const stockCheck = await checkProductStock(item.productId, item.quantity);
      if (!stockCheck.available) {
        errors.push(stockCheck.message || `${item.productName} has insufficient stock (Only ${stockCheck.availableStock} available)`);
      }
    }
    
    return {
      allAvailable: errors.length === 0,
      errors,
    };
  };

  const addToCart = async (product: any, quantity?: number) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Please login to add items to cart");
      }
      
      const requestedQty = quantity || 1;
      
      // Check stock availability first
      const stockCheck = await checkProductStock(product.id, requestedQty);
      
      if (!stockCheck.available) {
        throw new Error(stockCheck.message || `Insufficient stock for ${stockCheck.productName}`);
      }
      
      // Check if item already exists in cart
      const existingItem = cartItems.find(
        (item) =>
          item.productId === product.id && item.sellerId === product.sellerId,
      );
      
      if (existingItem) {
        // Calculate total quantity if we add more
        const totalRequested = existingItem.quantity + requestedQty;
        
        // Check if total quantity exceeds stock
        if (totalRequested > stockCheck.availableStock) {
          throw new Error(`Cannot add ${requestedQty} more. Only ${stockCheck.availableStock - existingItem.quantity} additional items available.`);
        }
        
        // Update quantity if exists
        await updateQuantity(existingItem.id, totalRequested);
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
          quantity: requestedQty,
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

  const removeFromCart = async (itemId: string) => {
    console.log("🔴 removeFromCart called with ID:", itemId);
    try {
      const itemToDelete = cartItems.find((item) => item.id === itemId);
      if (!itemToDelete) {
        console.log("⚠️ Item not found in local cart:", itemId);
      } else {
        console.log("📦 Deleting item:", itemToDelete.productName);
      }

      const itemRef = doc(db, "carts", itemId);
      await deleteDoc(itemRef);
      console.log("✅ Successfully deleted from Firestore");

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
      
      const cartItem = cartItems.find(item => item.id === itemId);
      if (cartItem) {
        const stockCheck = await checkProductStock(cartItem.productId, quantity);
        
        if (!stockCheck.available) {
          throw new Error(stockCheck.message || `Cannot update quantity. ${stockCheck.productName} has insufficient stock.`);
        }
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
        checkMultipleItemsStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};