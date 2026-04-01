// app/checkout/select-address.tsx
import { AddressData, useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectAddressScreen() {
  const { addresses, loading, setDefaultAddress, fetchAddresses } =
    useFirebaseProfile();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSelectAddress = (address: AddressData) => {
    // Navigate back to checkout with selected address
    router.push({
      pathname: "/checkout",
      params: { selectedAddress: JSON.stringify(address) },
    });
  };

  const handleAddNewAddress = () => {
    router.push("/(tabs)/add-address");
  };

  const renderAddress = ({ item }: { item: AddressData }) => {
    const isSelected = selectedAddressId === item.id;

    return (
      <TouchableOpacity
        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
        onPress={() => handleSelectAddress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.addressHeader}>
          <View style={styles.labelContainer}>
            <Text style={styles.addressLabel}>{item.label || "Address"}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#C35822" />
            </View>
          )}
        </View>

        <Text style={styles.addressName}>{item.fullName}</Text>
        <Text style={styles.addressPhone}>{item.phone}</Text>
        <Text style={styles.addressText}>
          {item.street}, {item.barangay}, {item.city}, {item.province}{" "}
          {item.zipCode}
        </Text>
      </TouchableOpacity>
    );
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
          <Text style={styles.headerTitle}>Select Address</Text>
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
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Address</Text>
        <TouchableOpacity onPress={handleAddNewAddress}>
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
              onPress={handleAddNewAddress}
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
  addressCardSelected: {
    borderWidth: 2,
    borderColor: "#C35822",
    backgroundColor: "#FFF8F0",
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
  selectedBadge: {
    padding: 4,
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
