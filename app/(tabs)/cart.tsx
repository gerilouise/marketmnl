// app/(tabs)/cart.tsx
import { useCart } from "@/app/contexts/CartContext";
import { useFirebaseCart } from "@/hooks/useFirebaseCart";
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { deleteDoc, doc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function CartScreen() {
  const { cartItems, loading, loadCart, updateQuantity, clearCart } =
    useFirebaseCart();
  const { setSelectedItems } = useCart(); // <-- GET setSelectedItems from context


  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);


  // Update selectAll state when cartItems changes
  useEffect(() => {
    const validIds = selectedItemIds.filter((id) =>
      cartItems.some((item) => item.id === id),
    );
    if (validIds.length !== selectedItemIds.length) {
      setSelectedItemIds(validIds);
    }


    if (validIds.length === cartItems.length && cartItems.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [cartItems]);


  // Load cart from Firebase
  const loadCartData = async () => {
    await loadCart();
    setRefreshing(false);
  };


  useFocusEffect(
    useCallback(() => {
      loadCartData();
    }, []),
  );


  const toggleSelectItem = (itemId: string) => {
    setSelectedItemIds((prev: string[]) => {
      let newSelected: string[];
      if (prev.includes(itemId)) {
        newSelected = prev.filter((id: string) => id !== itemId);
      } else {
        newSelected = [...prev, itemId];
      }
      return newSelected;
    });
  };


  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItemIds([]);
    } else {
      const allIds = cartItems.map((item) => item.id);
      setSelectedItemIds(allIds);
    }
  };


  const handleUpdateQuantity = async (itemId: string, increment: boolean) => {
    try {
      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;


      const newQuantity = increment
        ? item.quantity + 1
        : Math.max(1, item.quantity - 1);


      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "Failed to update quantity");
    }
  };


  // ITO ANG DIRECT DELETE FUNCTION NA GUMAGANA
  const directDelete = async (itemId: string, productName: string) => {
    console.log("=== DELETING ITEM ===");
    console.log("Item ID:", itemId);
    console.log("Product Name:", productName);


    try {
      const itemRef = doc(db, "carts", itemId);
      await deleteDoc(itemRef);
      console.log("✅ DELETE SUCCESSFUL!");
      await loadCart(); // Refresh the cart
      Alert.alert("Success", `"${productName}" removed from cart`);
      return true;
    } catch (error: any) {
      console.error("❌ Delete failed:", error);
      Alert.alert("Error", error.message);
      return false;
    }
  };


  const handleRemoveItem = (itemId: string, productName: string) => {
    Alert.alert("Remove Item", `Remove "${productName}" from your cart?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setDeletingItemId(itemId);
          await directDelete(itemId, productName);
          setDeletingItemId(null);
        },
      },
    ]);
  };


  const calculateSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
  };


  const calculateEstimatedTotal = () => {
    const subtotal = calculateSelectedTotal();
    const shipping = subtotal > 0 ? 50 : 0;
    return subtotal + shipping;
  };


  // FIXED: Checkout function - make sure selected items are saved to context
  const handleCheckout = () => {
    if (selectedItemIds.length === 0) {
      Alert.alert("No Items Selected", "Please select items to checkout");
      return;
    }


    // Get selected items from cartItems
    const selectedCartItems = cartItems.filter((item) =>
      selectedItemIds.includes(item.id),
    );


    console.log("🛒 Selected items for checkout:", selectedCartItems);
    console.log("🛒 Selected item IDs:", selectedItemIds);


    // IMPORTANT: Save selected items to context before navigating
    setSelectedItems(selectedCartItems);


    // Navigate to checkout
    router.push("/checkout");
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadCartData();
  };


  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };


  const renderCartItem = ({ item }: { item: any }) => {
    const isSelected = selectedItemIds.includes(item.id);
    const isDeleting = deletingItemId === item.id;


    return (
      <TouchableOpacity
        style={styles.cartItem}
        onPress={() => navigateToProduct(item.productId)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <TouchableOpacity
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          onPress={(e) => {
            e.stopPropagation();
            toggleSelectItem(item.id);
          }}
          disabled={isDeleting}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </TouchableOpacity>


        <View style={styles.imagePlaceholder}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
          ) : (
            <Ionicons name="image-outline" size={30} color="#CCC" />
          )}
        </View>


        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Text style={styles.itemSeller}>{item.sellerName}</Text>
          <Text style={styles.itemPrice}>₱{item.productPrice}</Text>
        </View>


        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.testDeleteButton}
            onPress={(e) => {
              e.stopPropagation();
              setDeletingItemId(item.id);
              directDelete(item.id, item.productName);
              setDeletingItemId(null);
            }}
            disabled={isDeleting}
          >
            <Ionicons name="trash" size={18} color="#e0e0e0" />
          </TouchableOpacity>


          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={(e) => {
                e.stopPropagation();
                handleUpdateQuantity(item.id, false);
              }}
              disabled={isDeleting}
            >
              <Ionicons name="remove" size={16} color="#32221B" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={(e) => {
                e.stopPropagation();
                handleUpdateQuantity(item.id, true);
              }}
              disabled={isDeleting}
            >
              <Ionicons name="add" size={16} color="#32221B" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  const subtotal = calculateSelectedTotal();
  const estimatedTotal = calculateEstimatedTotal();
  const itemCount = selectedItemIds.length;


  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }


  if (!auth.currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="cart-outline" size={60} color="#E0DAD1" />
          <Text style={styles.notLoggedInText}>
            Please log in to view your cart
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.itemCount}>
            {cartItems.length} items in your cart
          </Text>
        </View>


        <View style={styles.headerButtons}>
          {cartItems.length > 0 && (
            <TouchableOpacity
              style={[
                styles.selectAllContainer,
                selectAll && styles.selectAllContainerActive,
              ]}
              onPress={toggleSelectAll}
            >
              <View
                style={[
                  styles.checkboxSmall,
                  selectAll && styles.checkboxSmallSelected,
                ]}
              >
                {selectAll && (
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                )}
              </View>
              <Text
                style={[
                  styles.selectAllText,
                  selectAll && styles.selectAllTextActive,
                ]}
              >
                Select All
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>


      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/(tabs)/browse")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />


      {cartItems.length > 0 && (
        <View style={styles.bottomContainer}>
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


          <TouchableOpacity
            style={[
              styles.checkoutButton,
              selectedItemIds.length === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={selectedItemIds.length === 0}
          >
            <Text style={styles.checkoutButtonText}>
              Checkout {itemCount > 0 ? `(${itemCount} items)` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}


// Styles remain the same (keep your existing styles)
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  notLoggedInText: {
    fontSize: 16,
    color: "#8F796F",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectAllContainerActive: {
    backgroundColor: "#C35822",
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
    fontSize: 12,
    color: "#8F796F",
  },
  selectAllTextActive: {
    color: "#FFF",
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
    overflow: "hidden",
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
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
    height: 100,
  },
  testDeleteButton: {
    backgroundColor: "#db0606",
    padding: 8,
    borderRadius: 20,
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