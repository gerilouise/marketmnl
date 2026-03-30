// app/services/orders.ts
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";


export interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  imageUrl?: string | null;
}


// Ito ang data na ipapasa mo mula sa checkout
export interface OrderInput {
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentDetails?: any;
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
}


// Generate unique order number
const generateOrderNumber = (): string => {
  const prefix = "MNL";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};


// Create order in Firebase
export const createOrder = async (orderData: OrderInput) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");


    const orderNumber = generateOrderNumber();


    // Get sellerId from the first item (assuming all items are from same seller)
    const sellerId = orderData.items[0]?.sellerId;


    if (!sellerId) {
      console.error("❌ No sellerId found in order items:", orderData.items);
      throw new Error("Order items are missing seller information");
    }


    const newOrder = {
      ...orderData,
      userId: user.uid,
      userEmail: user.email,
      orderNumber,
      sellerId: sellerId,
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };


    console.log("💾 Creating order:", {
      orderNumber,
      userId: user.uid,
      sellerId: sellerId,
      itemsCount: orderData.items.length,
      items: orderData.items.map((i) => ({
        name: i.productName,
        qty: i.quantity,
      })),
    });


    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, newOrder);


    console.log("✅ Order saved with ID:", docRef.id);


    return { success: true, orderId: docRef.id, orderNumber };
  } catch (error) {
    console.error("❌ Error creating order:", error);
    throw error;
  }
};


// Cancel order - moves to cancelled_orders collection
export const cancelOrder = async (orderId: string, orderData: any) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");


    // 1. Get the original order to ensure it exists
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);


    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }


    const originalOrder = orderSnap.data();


    // 2. Create cancelled order record
    const cancelledOrder = {
      ...originalOrder,
      originalOrderId: orderId,
      status: "cancelled",
      cancelledAt: Timestamp.now(),
      cancellationReason: "User requested cancellation",
      cancelledBy: user.uid,
      cancelledByEmail: user.email,
      createdAt: originalOrder.createdAt,
      updatedAt: Timestamp.now(),
    };


    // 3. Save to cancelled_orders collection
    const cancelledOrdersRef = collection(db, "cancelled_orders");
    const cancelledDocRef = await addDoc(cancelledOrdersRef, cancelledOrder);
    console.log("✅ Order moved to cancelled_orders:", cancelledDocRef.id);


    // 4. Delete from original orders collection
    await deleteDoc(orderRef);
    console.log("✅ Order deleted from orders collection");


    return { success: true, cancelledOrderId: cancelledDocRef.id };
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    throw error;
  }
};
