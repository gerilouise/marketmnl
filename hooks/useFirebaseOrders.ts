// hooks/useFirebaseOrders.ts
import { auth, db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { useState } from "react";
import { Alert } from "react-native";

export interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  sellerName: string;
  sellerId?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  address: {
    fullName: string;
    phone: string;
    street: string;
    barangay: string;
    city: string;
    province: string;
    zipCode: string;
    label: string;
  };
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  userEmail: string;
}

export const useFirebaseOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all orders for current user
  const loadOrders = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setOrders([]);
        return;
      }

      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const ordersList: Order[] = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });

      // Sort by newest first
      ordersList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });

      setOrders(ordersList);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // DIRECT CANCEL TEST FUNCTION - gaya ng sa cart.tsx na gumagana!
  const directCancelTest = async (orderId: string, orderNumber: string) => {
    console.log("=== DIRECT CANCEL TEST ===");
    console.log("Order ID to cancel:", orderId);
    console.log("Order Number:", orderNumber);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in");
        return false;
      }

      // Direct update - just change status to cancelled
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "cancelled",
        updatedAt: Timestamp.now(),
      });

      console.log("✅ DIRECT CANCEL SUCCESSFUL!");

      // Refresh orders list
      await loadOrders();

      Alert.alert("Success", `Order ${orderNumber} has been cancelled`);
      return true;
    } catch (error: any) {
      console.error("❌ Direct cancel failed:", error);
      Alert.alert("Error", error.message);
      return false;
    }
  };

  return {
    orders,
    loading,
    loadOrders,
    directCancelTest,
  };
};
