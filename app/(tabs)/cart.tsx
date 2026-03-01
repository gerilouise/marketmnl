// app/(tabs)/cart.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Mock cart data
const INITIAL_CART_ITEMS = [
  {
    id: "1",
    name: "Spicy Tuyo",
    seller: "Janjan's Kitchen",
    price: 250,
    quantity: 1,
    image: null,
  },
  {
    id: "2",
    name: "Spicy Tapa",
    seller: "Janjan's Kitchen",
    price: 250,
    quantity: 1,
    image: null,
  },
  {
    id: "3",
    name: "SpICY Bangus",
    seller: "Janjan's Kitchen",
    price: 250,
    quantity: 1,
    image: null,
  },
  {
    id: "4",
    name: "Original Tapa",
    seller: "Janjan's Kitchen",
    price: 250,
    quantity: 1,
    image: null,
  },
  {
    id: "5",
    name: "Original Tahong",
    seller: "Janjan's Kitchen",
    price: 250,
    quantity: 1,
    image: null,
  },
];

export default function CartScreen() {
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        const newSelected = prev.filter(id => id !== itemId);
        setSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, itemId];
        if (newSelected.length === cartItems.length) {
          setSelectAll(true);
        }
        return newSelected;
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
      setSelectAll(true);
    }
  };

  const updateQuantity = (itemId: string, increment: boolean) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = increment ? item.quantity + 1 : Math.max(1, item.quantity - 1);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setCartItems(prev => prev.filter(item => item.id !== itemId));
            setSelectedItems(prev => prev.filter(id => id !== itemId));
            if (selectedItems.length === cartItems.length) {
              setSelectAll(false);
            }
          },
        },
      ]
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateEstimatedTotal = () => {
    const subtotal = calculateSelectedTotal();
    const shipping = subtotal > 0 ? 50 : 0; // ₱50 shipping fee
    return subtotal + shipping;
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select items to checkout");
      return;
    }
    Alert.alert(
      "Proceed to Checkout",
      `Total amount: ₱${calculateEstimatedTotal()}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Checkout", onPress: () => console.log("Checkout pressed") },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: typeof INITIAL_CART_ITEMS[0] }) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <View style={styles.cartItem}>
        {/* Select Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          onPress={() => toggleSelectItem(item.id)}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </TouchableOpacity>

        {/* Product Image Placeholder */}
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={30} color="#CCC" />
        </View>

        {/* Product Details */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSeller}>{item.seller}</Text>
          <Text style={styles.itemPrice}>₱{item.price}</Text>
        </View>

        {/* Right Side Container with Trash above Quantity */}
        <View style={styles.rightContainer}>
          {/* Red Trash Icon - Top */}
          <TouchableOpacity
            style={styles.trashButton}
            onPress={() => removeItem(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>

          {/* Quantity Controls - Bottom */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, false)}
            >
              <Ionicons name="remove" size={16} color="#32221B" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, true)}
            >
              <Ionicons name="add" size={16} color="#32221B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const subtotal = calculateSelectedTotal();
  const estimatedTotal = calculateEstimatedTotal();
  const itemCount = selectedItems.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with item count and select all */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.itemCount}>{cartItems.length} items in your cart</Text>
        </View>
        
        {/* Select All with Checkbox */}
        <TouchableOpacity style={styles.selectAllContainer} onPress={toggleSelectAll}>
          <View style={[styles.checkboxSmall, selectAll && styles.checkboxSmallSelected]}>
            {selectAll && <Ionicons name="checkmark" size={12} color="#FFF" />}
          </View>
          <Text style={[styles.selectAllText, selectAll && styles.selectAllTextActive]}>
            Select All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/browse')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Bottom Summary and Checkout */}
      {cartItems.length > 0 && (
        <View style={styles.bottomContainer}>
          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₱{subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Total</Text>
              <Text style={styles.estimatedTotalValue}>₱{estimatedTotal}</Text>
            </View>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              selectedItems.length === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={selectedItems.length === 0}
          >
            <Text style={styles.checkoutButtonText}>
              Checkout {itemCount > 0 ? `(${itemCount} items)` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: "#8F796F",
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  checkboxSmallSelected: {
    backgroundColor: "#C35822",
  },
  selectAllText: {
    fontSize: 14,
    color: "#8F796F",
  },
  selectAllTextActive: {
    color: "#C35822",
    fontWeight: "500",
  },
  cartList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: "#C35822",
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  itemSeller: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "space-between",
    height: 80, // Fixed height for vertical stacking
  },
  trashButton: {
    padding: 4,
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    paddingHorizontal: 10,
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 16,
    color: "#8F796F",
    marginTop: 12,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomContainer: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0DAD1",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#8F796F",
  },
  summaryValue: {
    fontSize: 16,
    color: "#32221B",
    fontWeight: "500",
  },
  estimatedTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C35822",
  },
  checkoutButton: {
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#E0DAD1",
    shadowOpacity: 0,
  },
  checkoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});