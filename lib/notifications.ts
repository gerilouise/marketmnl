// lib/notifications.ts
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, Timestamp } from "firebase/firestore";

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type:
    | "order_placed"
    | "order_confirmed"
    | "order_shipped"
    | "order_delivered"
    | "order_cancelled";
  orderId?: string;
  orderNumber?: string;
  read: boolean;
  createdAt: Timestamp;
}

export const createNotification = async (data: NotificationData) => {
  try {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      ...data,
      read: false,
      createdAt: Timestamp.now(),
    });
    console.log("✅ Notification created for user:", data.userId);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const getOrderNotification = (
  orderNumber: string,
  status: string,
  orderId?: string,
) => {
  switch (status) {
    case "pending":
      return {
        type: "order_placed" as const,
        title: "Order Placed 🛍️",
        message: `Order #${orderNumber} has been placed successfully. We'll notify you once the seller confirms.`,
      };
    case "confirmed":
      return {
        type: "order_confirmed" as const,
        title: "Order Confirmed ✓",
        message: `Great news! Order #${orderNumber} has been confirmed by the seller.`,
      };
    case "shipped":
      return {
        type: "order_shipped" as const,
        title: "Order Shipped 🚚",
        message: `Your order #${orderNumber} is on the way! Track your package to see when it arrives.`,
      };
    case "delivered":
      return {
        type: "order_delivered" as const,
        title: "Order Delivered 🎉",
        message: `Order #${orderNumber} has been delivered. Enjoy your purchase! Don't forget to leave a review.`,
      };
    case "cancelled":
      return {
        type: "order_cancelled" as const,
        title: "Order Cancelled ❌",
        message: `Order #${orderNumber} has been cancelled. If you have any questions, please contact support.`,
      };
    default:
      return null;
  }
};

// Helper to get user name from user ID
export const getUserName = async (userId: string): Promise<string> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.fullName || userData.firstName || "Customer";
    }
    return "Customer";
  } catch (error) {
    console.error("Error getting user name:", error);
    return "Customer";
  }
};
