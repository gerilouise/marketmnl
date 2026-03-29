// hooks/useFirebaseCart.ts
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
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export interface CartItem {
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

export const useFirebaseCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setCartItems([]);
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
        Alert.alert("Please login", "You need to login to add items to cart");
        return false;
      }

      const existingItem = cartItems.find(
        (item) =>
          item.productId === product.id && item.sellerId === product.sellerId,
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        await updateQuantity(existingItem.id, newQuantity);
      } else {
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

      Alert.alert("Success", "Item added to cart!");
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
      return false;
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
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  };

  // ITO ANG AYUSIN - GAYAHIN ANG DIRECT DELETE TEST
  const removeFromCart = async (itemId: string) => {
    console.log("=== removeFromCart called with ID:", itemId);

    try {
      // DIRECT DELETE - gaya ng gumagana sa TEST button
      const itemRef = doc(db, "carts", itemId);
      await deleteDoc(itemRef);
      console.log("✅ Successfully deleted from Firestore!");

      // Update local state
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));

      Alert.alert("Success", "Item removed from cart");
      return true;
    } catch (error: any) {
      console.error("❌ Delete error:", error);
      Alert.alert("Error", error.message || "Failed to delete item");
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const promises = cartItems.map((item) =>
        deleteDoc(doc(db, "carts", item.id)),
      );
      await Promise.all(promises);
      setCartItems([]);
      Alert.alert("Success", "Cart cleared");
    } catch (error) {
      console.error("Error clearing cart:", error);
      Alert.alert("Error", "Failed to clear cart");
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  return {
    cartItems,
    loading,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};
