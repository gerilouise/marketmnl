// app/(tabs)/addresses.tsx
import { AddressData, useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { deleteDoc, doc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddressesScreen() {
  const {
    addresses,
    loading,
    setDefaultAddress,
    deleteAddress,
    fetchAddresses,
  } = useFirebaseProfile();
  const [showForm, setShowForm] = useState(false);

  // Debug: Log all addresses in state
  useEffect(() => {
    console.log("=== ADDRESSES IN STATE ===");
    addresses.forEach((addr) => {
      console.log(`ID: ${addr.id}`);
      console.log(`Name: ${addr.fullName}`);
      console.log(`---`);
    });
  }, [addresses]);

  // Test direct delete function
  const testDirectDelete = async () => {
    if (addresses.length === 0) {
      Alert.alert("No addresses", "No addresses to test");
      return;
    }

    const firstAddress = addresses[0];
    console.log("🔧 TESTING DIRECT DELETE for:", firstAddress.id);
    console.log("Address name:", firstAddress.fullName);

    try {
      const addressRef = doc(db, "addresses", firstAddress.id);
      await deleteDoc(addressRef);
      console.log("✅ TEST DELETE SUCCESSFUL!");

      // Refresh the addresses
      await fetchAddresses();

      Alert.alert("Success", `Address "${firstAddress.fullName}" deleted!`);
    } catch (error: any) {
      console.error("❌ TEST DELETE FAILED:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      Alert.alert("Test Failed", `${error.code}: ${error.message}`);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
  };

  const handleDelete = (id: string) => {
    console.log("🗑️ Delete button pressed for address ID:", id);
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            console.log("✅ Confirmed delete for:", id);
            const result = await deleteAddress(id);
            console.log("Delete result:", result ? "SUCCESS" : "FAILED");
          },
          style: "destructive",
        },
      ],
    );
  };

  const renderAddress = ({ item }: { item: AddressData }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.labelContainer}>
          <Text style={styles.addressLabel}>{item.label || "Address"}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/edit-address?id=${item.id}`)}
          >
            <Ionicons name="create-outline" size={20} color="#8F796F" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.addressName}>{item.fullName}</Text>
      <Text style={styles.addressPhone}>{item.phone}</Text>
      <Text style={styles.addressText}>
        {item.street}, {item.barangay}, {item.city}, {item.province}{" "}
        {item.zipCode}
      </Text>

      {!item.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(item.id)}
        >
          <Text style={styles.setDefaultText}>Set as Default</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35822" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Addresses</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={testDirectDelete}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>TEST</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/add-address")}>
            <Ionicons name="add-circle" size={28} color="#C35822" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={addresses}
        renderItem={renderAddress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No addresses yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(tabs)/add-address")}
            >
              <Text style={styles.addButtonText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    paddingVertical: 15,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  testButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 5,
  },
  testButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  list: {
    padding: 20,
  },
  addressCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  defaultBadge: {
    backgroundColor: "#C35822",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  addressName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  setDefaultButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  setDefaultText: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#8F796F",
    marginTop: 12,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
