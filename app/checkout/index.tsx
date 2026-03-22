// app/checkout/index.tsx
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock cart items - replace with actual cart data from your cart screen
const MOCK_ORDER_ITEMS = [
  {
    id: "1",
    name: "Spicy Tuyo",
    quantity: 1,
    price: 250,
  },
  {
    id: "2",
    name: "Spicy Tapa",
    quantity: 1,
    price: 250,
  },
  {
    id: "3",
    name: "Spicy Bangus",
    quantity: 1,
    price: 250,
  },
];

const PAYMENT_METHODS = ["Cash on Delivery", "GCash", "Credit Card"];

export default function CheckoutScreen() {
  const { addresses, loading, fetchAddresses } = useFirebaseProfile();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState("Cash on Delivery");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    await fetchAddresses();
  };

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((addr) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      } else {
        setSelectedAddress(addresses[0]);
      }
    }
  }, [addresses]);

  const calculateSubtotal = () => {
    return MOCK_ORDER_ITEMS.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  const shippingFee = 50;
  const subtotal = calculateSubtotal();
  const total = subtotal + shippingFee;

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      Alert.alert("No Address", "Please add a shipping address first");
      router.push("/(tabs)/addresses");
      return;
    }

    setIsProcessing(true);

    // Simulate order processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        "Order Placed Successfully!",
        `Your order total is ₱${total}. Thank you for shopping with us!`,
        [
          {
            text: "View Orders",
            onPress: () => {
              router.push("/(tabs)/profile");
            },
          },
          {
            text: "Continue Shopping",
            onPress: () => router.push("/(tabs)"),
          },
        ],
      );
    }, 1500);
  };

  const navigateToAddresses = () => {
    router.push("/(tabs)/addresses");
  };

  const formatAddress = (address: any) => {
    if (!address) return "";
    return `${address.street}, ${address.barangay}, ${address.city}, ${address.province} ${address.zipCode}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
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
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {MOCK_ORDER_ITEMS.map((item, index) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemLeft}>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemQuantity}>
                  Qty: {item.quantity}
                </Text>
              </View>
              <Text style={styles.orderItemPrice}>₱{item.price}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          {addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={navigateToAddresses}
            >
              <Ionicons name="add-circle-outline" size={24} color="#C35822" />
              <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>
          ) : selectedAddress ? (
            <TouchableOpacity
              style={styles.addressCard}
              onPress={navigateToAddresses}
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
                <TouchableOpacity onPress={navigateToAddresses}>
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : null}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₱{subtotal}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping Fee</Text>
            <Text style={styles.priceValue}>₱{shippingFee}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{total}</Text>
          </View>
        </View>

        {/* Bottom padding for button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!selectedAddress || isProcessing) &&
              styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <Ionicons name="refresh-outline" size={20} color="#FFF" />
              <Text style={styles.placeOrderText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.placeOrderText}>Place Order • ₱{total}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FFF",
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
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
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderItemLeft: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: "#8F796F",
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
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
  addAddressText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "500",
  },
  addressCard: {
    backgroundColor: "#FBF8F4",
    borderRadius: 12,
    padding: 12,
  },
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
  defaultBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
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
  changeButtonText: {
    color: "#C35822",
    fontSize: 13,
    fontWeight: "500",
  },
  paymentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  radioButtonSelected: {
    borderColor: "#C35822",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C35822",
  },
  paymentOptionText: {
    fontSize: 14,
    color: "#32221B",
  },
  paymentNote: {
    fontSize: 12,
    color: "#8F796F",
    fontStyle: "italic",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0DAD1",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C35822",
  },
  bottomPadding: {
    height: 80,
  },
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
  placeOrderButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  placeOrderText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
