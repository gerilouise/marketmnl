// app/checkout/index.tsx
import { useCart } from "@/app/contexts/CartContext";
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { auth, db } from "@/lib/firebase";
import { createNotification, getOrderNotification } from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PayMongoWebView from "../components/PayMongoWebView";
import { createCheckoutSession } from "../services/paymongo";

const PAYMENT_METHODS = ["Cash on Delivery", "GCash", "Maya", "Credit Card"];

// Delivery options
const DELIVERY_OPTIONS = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "3-7 business days",
    price: 50,
    icon: "cube-outline",
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "1-3 business days",
    price: 150,
    icon: "rocket-outline",
  },
  {
    id: "same-day",
    name: "Same Day Delivery",
    description: "Available in Metro Manila",
    price: 200,
    icon: "time-outline",
  },
];

// Helper function to generate order number
const generateOrderNumber = (): string => {
  const prefix = "MNL";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};

// Helper function to split shipping fee based on item count
const splitShippingFee = (
  itemsBySeller: Map<
    string,
    { sellerId: string; sellerName: string; items: any[] }
  >,
  totalShippingFee: number,
): Map<string, number> => {
  // Calculate total number of items across all sellers
  let totalItems = 0;
  for (const [, sellerData] of itemsBySeller) {
    totalItems += sellerData.items.length;
  }

  // Calculate shipping fee per seller based on their item count percentage
  const shippingFeePerSeller = new Map();
  for (const [sellerId, sellerData] of itemsBySeller) {
    const itemCount = sellerData.items.length;
    const percentage = itemCount / totalItems;
    const sellerShippingFee =
      Math.round(percentage * totalShippingFee * 100) / 100; // Round to 2 decimals
    shippingFeePerSeller.set(sellerId, sellerShippingFee);
  }

  // Adjust for rounding differences (add remaining cents to the first seller)
  let totalAllocated = 0;
  for (const fee of shippingFeePerSeller.values()) {
    totalAllocated += fee;
  }
  const difference = totalShippingFee - totalAllocated;
  if (Math.abs(difference) > 0) {
    const firstSellerId = itemsBySeller.keys().next().value;
    shippingFeePerSeller.set(
      firstSellerId,
      shippingFeePerSeller.get(firstSellerId) + difference,
    );
  }

  return shippingFeePerSeller;
};

export default function CheckoutScreen() {
  const { selectedItems, setSelectedItems, loadCart, removeSelectedItems } =
    useCart();
  const { addresses, loading, fetchAddresses } = useFirebaseProfile();
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState("Cash on Delivery");
  const [selectedDelivery, setSelectedDelivery] = useState(DELIVERY_OPTIONS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderCount, setOrderCount] = useState(1);
  const [isAddressSelectedFromModal, setIsAddressSelectedFromModal] =
    useState(false);

  const params = useLocalSearchParams();

  // GCash/Maya Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Credit Card Modal
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // PayMongo states
  const [showPayMongoWebView, setShowPayMongoWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [isPayMongoProcessing, setIsPayMongoProcessing] = useState(false);

  useEffect(() => {
    loadAddresses();

    if (params.selectedAddress) {
      try {
        const selectedAddr = JSON.parse(params.selectedAddress as string);
        setSelectedAddress(selectedAddr);
        setIsAddressSelectedFromModal(true);
        console.log("📍 Address selected from checkout:", selectedAddr);
      } catch (error) {
        console.error("Error parsing selected address:", error);
      }
    }

    console.log("🛒 Selected items from context:", selectedItems);

    if (selectedItems && selectedItems.length > 0) {
      setCheckoutItems(selectedItems);
    } else {
      Alert.alert(
        "No Items Selected",
        "Please select items to checkout from your cart.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    }
  }, [params.selectedAddress]);

  const loadAddresses = async () => {
    await fetchAddresses();
  };

  useEffect(() => {
    if (
      addresses.length > 0 &&
      !isAddressSelectedFromModal &&
      !selectedAddress
    ) {
      const defaultAddr = addresses.find((addr) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      } else {
        setSelectedAddress(addresses[0]);
      }
    }
  }, [addresses, isAddressSelectedFromModal, selectedAddress]);

  const calculateSubtotal = () => {
    return checkoutItems.reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0,
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = selectedDelivery.price;
  const total = subtotal + shippingFee;

  const handlePaymentSelection = () => {
    if (!selectedAddress) {
      Alert.alert("No Address", "Please add a shipping address first");
      router.push("/checkout/select-address");
      return;
    }

    if (checkoutItems.length === 0) {
      Alert.alert("No Items", "No items selected for checkout");
      router.push("/(tabs)/cart");
      return;
    }

    if (selectedPayment === "Cash on Delivery") {
      processOrder();
    } else {
      handlePayMongoPayment();
    }
  };

  // Handle PayMongo payment
  const handlePayMongoPayment = async () => {
    if (!selectedAddress) {
      Alert.alert("No Address", "Please add a shipping address first");
      router.push("/checkout/select-address");
      return;
    }

    if (checkoutItems.length === 0) {
      Alert.alert("No Items", "No items selected for checkout");
      router.push("/(tabs)/cart");
      return;
    }

    setIsPayMongoProcessing(true);

    try {
      let paymentMethodTypes: string[] = [];
      switch (selectedPayment) {
        case "GCash":
          paymentMethodTypes = ["gcash"];
          break;
        case "Maya":
          paymentMethodTypes = ["maya"];
          break;
        case "Credit Card":
          paymentMethodTypes = ["card"];
          break;
        default:
          paymentMethodTypes = ["gcash", "maya", "card"];
      }

      const checkoutItemsList = checkoutItems.map((item) => ({
        name: item.productName,
        price: item.productPrice,
        quantity: item.quantity,
        id: item.productId,
      }));

      const user = auth.currentUser;

      const session = await createCheckoutSession({
        amount: total,
        description: `Order from MarketMNL`,
        paymentMethodTypes: paymentMethodTypes,
        successUrl: "marketmnl://payment-success",
        failedUrl: "marketmnl://payment-failed",
        metadata: {
          userId: user?.uid || "",
          itemsCount: checkoutItems.length,
          customerName: selectedAddress.fullName,
          customerEmail: user?.email || "",
        },
        items: checkoutItemsList,
      });

      const checkoutUrl = session.attributes.checkout_url;
      console.log("🔗 CHECKOUT URL:", checkoutUrl);

      // For web testing - open in new tab and detect return
      if (Platform.OS === "web") {
        // Open PayMongo checkout in a new tab
        window.open(checkoutUrl, "_blank");

        // For testing purposes, show a button to simulate payment completion
        Alert.alert(
          "PayMongo Checkout",
          "After completing payment in the new tab, click 'Payment Completed' to place your order.",
          [
            {
              text: "Payment Completed",
              onPress: () => {
                processOrder({
                  paymentMethod: selectedPayment,
                  paymongo: true,
                });
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
      } else {
        // For mobile - use WebView
        setCheckoutUrl(checkoutUrl);
        setShowPayMongoWebView(true);
      }
    } catch (error: any) {
      console.error("PayMongo error:", error);
      Alert.alert(
        "Payment Error",
        error.message || "Failed to initialize payment",
      );
    } finally {
      setIsPayMongoProcessing(false);
    }
  };

  const processOrder = async (paymentDetails?: any) => {
    setIsProcessing(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to place an order");
        setIsProcessing(false);
        return;
      }

      // Group items by seller
      const itemsBySeller = new Map();

      for (const item of checkoutItems) {
        if (!item.sellerId) {
          console.error("❌ Item missing sellerId:", item);
          Alert.alert(
            "Error",
            `Item "${item.productName}" is missing seller information. Please remove it from cart and try again.`,
          );
          setIsProcessing(false);
          return;
        }

        if (!itemsBySeller.has(item.sellerId)) {
          itemsBySeller.set(item.sellerId, {
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            items: [],
          });
        }
        itemsBySeller.get(item.sellerId).items.push(item);
      }

      // First, check if all items have sufficient stock
      for (const item of checkoutItems) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const currentStock = productSnap.data().stockQuantity || 0;
          if (currentStock < item.quantity) {
            Alert.alert(
              "Insufficient Stock",
              `${item.productName} only has ${currentStock} items in stock. Please reduce quantity.`,
            );
            setIsProcessing(false);
            return;
          }
        } else {
          Alert.alert("Error", `Product ${item.productName} not found`);
          setIsProcessing(false);
          return;
        }
      }

      console.log(`📦 Processing orders for ${itemsBySeller.size} seller(s)`);

      // Split the shipping fee among sellers based on item count
      const shippingFeePerSeller = splitShippingFee(itemsBySeller, shippingFee);
      console.log(
        "💰 Shipping fee split:",
        Object.fromEntries(shippingFeePerSeller),
      );

      const createdOrders = [];
      let orderSuffix = "A";

      // Create a separate order for each seller
      for (const [sellerId, sellerData] of itemsBySeller.entries()) {
        const sellerItems = sellerData.items;
        const sellerSubtotal = sellerItems.reduce(
          (sum, item) => sum + item.productPrice * item.quantity,
          0,
        );
        const sellerShippingFee = shippingFeePerSeller.get(sellerId) || 0;
        const sellerTotal = sellerSubtotal + sellerShippingFee;

        // Generate order number with suffix for multiple sellers
        let orderNumberForSeller;
        if (itemsBySeller.size === 1) {
          // Single seller - no suffix needed
          orderNumberForSeller = generateOrderNumber();
        } else {
          // Multiple sellers - add suffix (A, B, C, etc.)
          orderNumberForSeller = `${generateOrderNumber()}-${orderSuffix}`;
          orderSuffix = String.fromCharCode(orderSuffix.charCodeAt(0) + 1);
        }

        const orderData = {
          items: sellerItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            imageUrl: item.imageUrl,
          })),
          subtotal: sellerSubtotal,
          shippingFee: sellerShippingFee,
          total: sellerTotal,
          paymentMethod: selectedPayment,
          paymentDetails: paymentDetails || null,
          deliveryOption: {
            id: selectedDelivery.id,
            name: selectedDelivery.name,
            description: selectedDelivery.description,
            price: sellerShippingFee,
          },
          address: {
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            street: selectedAddress.street,
            barangay: selectedAddress.barangay,
            city: selectedAddress.city,
            province: selectedAddress.province,
            zipCode: selectedAddress.zipCode,
            label: selectedAddress.label,
          },
          customerName:
            user.displayName || selectedAddress.fullName || "Customer",
          customerEmail: user.email || "",
          userId: user.uid,
          userEmail: user.email || "",
          sellerId: sellerId,
          sellerName: sellerData.sellerName,
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        console.log(`🚀 Creating order for seller: ${sellerData.sellerName}`, {
          orderNumber: orderNumberForSeller,
          itemsCount: sellerItems.length,
          sellerSubtotal,
          sellerShippingFee,
          sellerTotal,
        });

        // Create the order
        const ordersRef = collection(db, "orders");
        const docRef = await addDoc(ordersRef, {
          ...orderData,
          orderNumber: orderNumberForSeller,
        });

        createdOrders.push({
          orderId: docRef.id,
          orderNumber: orderNumberForSeller,
          sellerName: sellerData.sellerName,
          shippingFee: sellerShippingFee,
        });

        // Update product stock for this seller's items
        for (const item of sellerItems) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const currentStock = productSnap.data().stockQuantity || 0;
            const newStock = currentStock - item.quantity;

            await updateDoc(productRef, {
              stockQuantity: newStock,
              updatedAt: Timestamp.now(),
            });
            console.log(
              `📦 Updated stock for ${item.productName}: ${currentStock} → ${newStock}`,
            );
          }
        }

        // Create notification for the customer about this order
        const notification = getOrderNotification(
          orderNumberForSeller,
          "pending",
          docRef.id,
        );
        if (notification) {
          await createNotification({
            userId: user.uid,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            orderId: docRef.id,
            orderNumber: orderNumberForSeller,
            read: false,
            createdAt: Timestamp.now(),
          });
          console.log(
            `📧 Notification created for order: ${orderNumberForSeller}`,
          );
        }

        // Create notification for the seller
        await createNotification({
          userId: sellerId,
          title: "New Order Received! 🎉",
          message: `You have received a new order #${orderNumberForSeller} from ${user.displayName || "Customer"}. Subtotal: ₱${sellerSubtotal.toFixed(2)}, Shipping: ₱${sellerShippingFee.toFixed(2)}, Total: ₱${sellerTotal.toFixed(2)}`,
          type: "new_order",
          orderId: docRef.id,
          orderNumber: orderNumberForSeller,
          read: false,
          createdAt: Timestamp.now(),
        });
        console.log(`📧 Notification sent to seller: ${sellerData.sellerName}`);
      }

      // Remove selected items from cart after successful orders
      console.log("🗑️ Removing selected items from cart...");
      await removeSelectedItems();

      // Clear selected items in context
      setSelectedItems([]);

      // Reload cart to refresh
      await loadCart();

      // Set order numbers for success modal
      if (createdOrders.length === 1) {
        setOrderNumber(createdOrders[0].orderNumber);
      } else {
        const orderNumbers = createdOrders.map((o) => o.orderNumber).join(", ");
        setOrderNumber(orderNumbers);
      }
      setOrderCount(createdOrders.length);

      console.log(`✅ ${createdOrders.length} order(s) placed successfully`);
      setShowOrderSuccess(true);
    } catch (error: any) {
      console.error("❌ Order error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to place order. Please try again.",
      );
    } finally {
      setIsProcessing(false);
      setShowPaymentModal(false);
      setShowCreditCardModal(false);
      setPhoneNumber("");
      setReferenceNumber("");
      setCardNumber("");
      setCardName("");
      setExpiryDate("");
      setCvv("");
    }
  };

  const validateGCashMaya = () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Please enter your mobile number");
      return false;
    }
    if (phoneNumber.length < 11) {
      Alert.alert("Error", "Please enter a valid mobile number");
      return false;
    }
    if (!referenceNumber) {
      Alert.alert("Error", "Please enter reference number");
      return false;
    }
    return true;
  };

  const validateCreditCard = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
      Alert.alert("Error", "Please enter a valid card number");
      return false;
    }
    if (!cardName) {
      Alert.alert("Error", "Please enter cardholder name");
      return false;
    }
    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert("Error", "Please enter valid expiry date (MM/YY)");
      return false;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert("Error", "Please enter valid CVV");
      return false;
    }
    return true;
  };

  const navigateToSelectAddress = () => {
    router.push("/checkout/select-address");
  };

  const formatAddress = (address: any) => {
    if (!address) return "";
    return `${address.street}, ${address.barangay}, ${address.city}, ${address.province} ${address.zipCode}`;
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/cart")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/cart")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Summary ({checkoutItems.length} items)
          </Text>
          {checkoutItems.length === 0 ? (
            <View style={styles.emptyCartContainer}>
              <Ionicons name="cart-outline" size={48} color="#E0DAD1" />
              <Text style={styles.emptyCartText}>No items selected</Text>
              <TouchableOpacity
                style={styles.goToCartButton}
                onPress={() => router.push("/(tabs)/cart")}
              >
                <Text style={styles.goToCartButtonText}>Go to Cart</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (() => {
              const itemsBySellerForDisplay = new Map();
              for (const item of checkoutItems) {
                if (!itemsBySellerForDisplay.has(item.sellerId)) {
                  itemsBySellerForDisplay.set(item.sellerId, {
                    sellerName: item.sellerName,
                    items: [],
                  });
                }
                itemsBySellerForDisplay.get(item.sellerId).items.push(item);
              }
              return Array.from(itemsBySellerForDisplay.entries()).map(
                ([sellerId, sellerGroup]) => (
                  <View key={sellerId} style={styles.sellerGroup}>
                    <Text style={styles.sellerGroupName}>
                      {sellerGroup.sellerName}
                    </Text>
                    {sellerGroup.items.map((item: any, index: number) => (
                      <View key={item.id || index} style={styles.orderItem}>
                        <View style={styles.orderItemLeft}>
                          <Text style={styles.orderItemName}>
                            {item.productName}
                          </Text>
                          <Text style={styles.orderItemQuantity}>
                            Qty: {item.quantity}
                          </Text>
                        </View>
                        <Text style={styles.orderItemPrice}>
                          ₱{item.productPrice * item.quantity}
                        </Text>
                      </View>
                    ))}
                  </View>
                ),
              );
            })()
          )}
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={navigateToSelectAddress}
            >
              <Ionicons name="add-circle-outline" size={24} color="#C35822" />
              <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>
          ) : selectedAddress ? (
            <TouchableOpacity
              style={styles.addressCard}
              onPress={navigateToSelectAddress}
            >
              <View style={styles.addressHeader}>
                <Ionicons name="location-outline" size={20} color="#C35822" />
                <Text style={styles.addressName}>
                  {selectedAddress.fullName}
                </Text>
                {selectedAddress.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
              <Text style={styles.addressText}>
                {formatAddress(selectedAddress)}
              </Text>
              <View style={styles.addressFooter}>
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                <TouchableOpacity onPress={navigateToSelectAddress}>
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Delivery Options Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          {DELIVERY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.deliveryOption,
                selectedDelivery.id === option.id &&
                  styles.deliveryOptionSelected,
              ]}
              onPress={() => setSelectedDelivery(option)}
            >
              <View style={styles.deliveryOptionLeft}>
                <View
                  style={[
                    styles.deliveryIconContainer,
                    selectedDelivery.id === option.id &&
                      styles.deliveryIconContainerSelected,
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={22}
                    color={
                      selectedDelivery.id === option.id ? "#C35822" : "#8F796F"
                    }
                  />
                </View>
                <View style={styles.deliveryInfo}>
                  <Text
                    style={[
                      styles.deliveryName,
                      selectedDelivery.id === option.id &&
                        styles.deliveryNameSelected,
                    ]}
                  >
                    {option.name}
                  </Text>
                  <Text style={styles.deliveryDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              <View style={styles.deliveryRight}>
                <Text style={styles.deliveryPrice}>₱{option.price}</Text>
                <View
                  style={[
                    styles.radioCircle,
                    selectedDelivery.id === option.id &&
                      styles.radioCircleSelected,
                  ]}
                >
                  {selectedDelivery.id === option.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={styles.paymentOption}
              onPress={() => setSelectedPayment(method)}
            >
              <View style={styles.paymentOptionLeft}>
                <View
                  style={[
                    styles.radioButton,
                    selectedPayment === method && styles.radioButtonSelected,
                  ]}
                >
                  {selectedPayment === method && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.paymentOptionText}>{method}</Text>
              </View>
              {method === "Cash on Delivery" && (
                <Text style={styles.paymentNote}>Pay when you receive</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Breakdown Section */}
        {checkoutItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₱{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping Fee</Text>
              <Text style={styles.priceValue}>₱{shippingFee.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Option</Text>
              <Text style={styles.priceValue}>{selectedDelivery.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₱{total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!selectedAddress || isProcessing || checkoutItems.length === 0) &&
              styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePaymentSelection}
          disabled={
            !selectedAddress || isProcessing || checkoutItems.length === 0
          }
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.placeOrderText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.placeOrderText}>
              Place Order • ₱{total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* GCash/Maya Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPayment} Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Enter your payment details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="09171234567"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reference Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter reference number"
                value={referenceNumber}
                onChangeText={setReferenceNumber}
              />
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                if (validateGCashMaya()) {
                  processOrder({ phoneNumber, referenceNumber });
                }
              }}
            >
              <Text style={styles.confirmButtonText}>Confirm Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Credit Card Modal */}
      <Modal visible={showCreditCardModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Credit Card Payment</Text>
              <TouchableOpacity onPress={() => setShowCreditCardModal(false)}>
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Name on card"
                value={cardName}
                onChangeText={setCardName}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Expiry Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>CVV *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                if (validateCreditCard()) {
                  processOrder({ cardNumber, cardName, expiryDate, cvv });
                }
              }}
            >
              <Text style={styles.confirmButtonText}>
                Pay ₱{total.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PayMongo WebView Modal */}
      <PayMongoWebView
        visible={showPayMongoWebView}
        checkoutUrl={checkoutUrl}
        onClose={() => {
          setShowPayMongoWebView(false);
          setCheckoutUrl("");
        }}
        onSuccess={() => {
          processOrder({ paymentMethod: selectedPayment, paymongo: true });
        }}
        onFailure={(error) => {
          Alert.alert("Payment Failed", error);
        }}
      />

      {/* Success Modal */}
      <Modal visible={showOrderSuccess} animationType="fade" transparent>
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.orderNumber}>
              {orderCount > 1 ? "Orders #" : "Order #"}
              {orderNumber}
            </Text>
            <Text style={styles.orderCountText}>
              {orderCount > 1
                ? `${orderCount} orders created`
                : "1 order created"}
            </Text>
            <Text style={styles.deliveryInfoText}>
              Delivery: {selectedDelivery.name} • ₱{selectedDelivery.price}
            </Text>
            <Text style={styles.successMessage}>
              Thank you for shopping with us! Your order(s) have been confirmed.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowOrderSuccess(false);
                router.push("/(tabs)");
              }}
            >
              <Text style={styles.successButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewOrdersButton}
              onPress={() => {
                setShowOrderSuccess(false);
                router.push("/(tabs)/profile");
              }}
            >
              <Text style={styles.viewOrdersText}>View My Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F4" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#32221B" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16 },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  sellerGroup: {
    marginBottom: 16,
  },
  sellerGroupName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  emptyCartContainer: { alignItems: "center", paddingVertical: 20 },
  emptyCartText: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 12,
    marginTop: 8,
  },
  goToCartButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goToCartButtonText: { color: "#FFF", fontSize: 14, fontWeight: "500" },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderItemLeft: { flex: 1 },
  orderItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  orderItemQuantity: { fontSize: 12, color: "#8F796F" },
  sellerNameText: {
    fontSize: 11,
    color: "#C35822",
    marginTop: 2,
  },
  orderItemPrice: { fontSize: 14, fontWeight: "600", color: "#C35822" },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#C35822",
    borderRadius: 12,
    borderStyle: "dashed",
    gap: 8,
  },
  addAddressText: { color: "#C35822", fontSize: 14, fontWeight: "500" },
  addressCard: { backgroundColor: "#FBF8F4", borderRadius: 12, padding: 12 },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: "#C35822",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "600" },
  addressPhone: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 4,
    marginLeft: 28,
  },
  addressText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginLeft: 28,
    marginBottom: 12,
  },
  addressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 28,
  },
  addressLabel: {
    fontSize: 12,
    color: "#8F796F",
    fontWeight: "500",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  changeButtonText: { color: "#C35822", fontSize: 13, fontWeight: "500" },
  deliveryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    backgroundColor: "#FFF",
  },
  deliveryOptionSelected: {
    borderColor: "#C35822",
    backgroundColor: "#FFF9F5",
  },
  deliveryOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deliveryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deliveryIconContainerSelected: {
    backgroundColor: "#FEF5ED",
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  deliveryNameSelected: {
    color: "#C35822",
  },
  deliveryDescription: {
    fontSize: 12,
    color: "#8F796F",
  },
  deliveryRight: {
    alignItems: "flex-end",
  },
  deliveryPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C35822",
    marginBottom: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: "#C35822",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C35822",
  },
  paymentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentOptionLeft: { flexDirection: "row", alignItems: "center" },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioButtonSelected: { borderColor: "#C35822" },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C35822",
  },
  paymentOptionText: { fontSize: 14, color: "#32221B" },
  paymentNote: { fontSize: 12, color: "#8F796F", fontStyle: "italic" },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  priceLabel: { fontSize: 14, color: "#666" },
  priceValue: { fontSize: 14, color: "#32221B", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#E0DAD1", marginVertical: 8 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#32221B" },
  totalValue: { fontSize: 20, fontWeight: "bold", color: "#C35822" },
  bottomPadding: { height: 80 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0DAD1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  placeOrderButton: {
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
  },
  placeOrderButtonDisabled: { backgroundColor: "#E0DAD1" },
  placeOrderText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  processingContainer: { flexDirection: "row", alignItems: "center", gap: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#32221B" },
  modalSubtitle: { fontSize: 14, color: "#8F796F", marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#32221B", marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: "#F5F0EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  rowInputs: { flexDirection: "row", marginBottom: 8 },
  confirmButton: {
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  confirmButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  successIcon: { marginBottom: 16 },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
    textAlign: "center",
  },
  orderNumber: {
    fontSize: 16,
    color: "#C35822",
    fontWeight: "600",
    marginBottom: 4,
  },
  orderCountText: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 8,
  },
  deliveryInfoText: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    width: "100%",
  },
  successButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  viewOrdersButton: { paddingVertical: 12, width: "100%" },
  viewOrdersText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
