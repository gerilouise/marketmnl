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
  const { addresses, loading, setDefaultAddress, fetchAddresses } =
    useFirebaseProfile();
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(
    null,
  );

  // Debug: Log all addresses in state
  useEffect(() => {
    console.log("=== ADDRESSES IN STATE ===");
    addresses.forEach((addr) => {
      console.log(`ID: ${addr.id}`);
      console.log(`Name: ${addr.fullName}`);
      console.log(`---`);
    });
  }, [addresses]);

  // ========== DIRECT DELETE TEST FUNCTION (gaya sa cart) ==========
  const directDeleteTest = async (addressId: string, addressName: string) => {
    console.log("=== DIRECT DELETE TEST ===");
    console.log("Address ID to delete:", addressId);
    console.log("Address Name:", addressName);

    try {
      const addressRef = doc(db, "addresses", addressId);
      await deleteDoc(addressRef);
      console.log("✅ DIRECT DELETE SUCCESSFUL!");

      await fetchAddresses(); // Refresh the addresses list
      Alert.alert("Success", `"${addressName}" removed from addresses`);
      return true;
    } catch (error: any) {
      console.error("❌ Direct delete failed:", error);
      Alert.alert("Error", error.message);
      return false;
    }
  };
  // ==================================================================

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
  };

  const renderAddress = ({ item }: { item: AddressData }) => {
    const isDeleting = deletingAddressId === item.id;

    return (
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
              disabled={isDeleting}
            >
              <Ionicons name="create-outline" size={20} color="#8F796F" />
            </TouchableOpacity>

            {/* TEST BUTTON - gaya ng sa cart.tsx */}
            <TouchableOpacity
              style={styles.testDeleteButton}
              onPress={async () => {
                setDeletingAddressId(item.id);
                await directDeleteTest(item.id, item.fullName);
                setDeletingAddressId(null);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="trash" size={18} color="#FFF" />
              )}
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
            disabled={isDeleting}
          >
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Addresses</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/add-address")}>
          <Ionicons name="add-circle" size={28} color="#C35822" />
        </TouchableOpacity>
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
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
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
  testDeleteButton: {
    backgroundColor: "#db0606",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
