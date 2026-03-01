// app/checkout/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Mock data - would come from cart and user profile in real app
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

const MOCK_ADDRESS = {
  name: "Ryza Flores",
  phone: "+63 906 561 6297",
  street: "11 Chico St., Brgy. Quirino 2-A",
  city: "Quezon City",
  province: "Metro Manila",
  zipCode: "1102",
};

const PAYMENT_METHODS = ["Cash on Delivery", "GCash", "Credit Card"];

export default function CheckoutScreen() {
  const [selectedPayment, setSelectedPayment] = useState("Cash on Delivery");
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateSubtotal = () => {
    return MOCK_ORDER_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const shippingFee = 100;
  const subtotal = calculateSubtotal();
  const total = subtotal + shippingFee;

  const handlePlaceOrder = () => {
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
              // Navigate to orders screen (you can create this later)
              router.push("/(tabs)/profile");
            },
          },
          {
            text: "Continue Shopping",
            onPress: () => router.push("/(tabs)"),
          },
        ]
      );
    }, 1500);
  };

  const formatAddress = () => {
    return `${MOCK_ADDRESS.street}, ${MOCK_ADDRESS.city}, ${MOCK_ADDRESS.province} ${MOCK_ADDRESS.zipCode}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.orderItemPrice}>₱{item.price}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Ionicons name="location-outline" size={20} color="#C35822" />
              <Text style={styles.addressName}>{MOCK_ADDRESS.name}</Text>
            </View>
            
            <Text style={styles.addressPhone}>{MOCK_ADDRESS.phone}</Text>
            <Text style={styles.addressText}>{formatAddress()}</Text>
            
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
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
                <View style={[styles.radioButton, selectedPayment === method && styles.radioButtonSelected]}>
                  {selectedPayment === method && <View style={styles.radioButtonInner} />}
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
          style={[styles.placeOrderButton, isProcessing && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
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
  addressCard: {
    backgroundColor: "#FBF8F4",
    borderRadius: 12,
    padding: 12,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginLeft: 8,
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
  changeButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
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