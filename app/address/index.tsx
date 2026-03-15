import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Mock address data
const ADDRESSES_DATA = [
  {
    id: "1",
    name: "Ryza Flores",
    phone: "+63 906 561 6297",
    address: "11 Chico St., Brgy. Quirino 2-A",
    city: "Quezon City",
    province: "Metro Manila",
    zipCode: "1102",
    isDefault: true,
  },
  {
    id: "2",
    name: "Ryza Flores",
    phone: "+63 917 123 4567",
    address: "22 Mabini St.",
    city: "Mandaluyong City",
    province: "Metro Manila",
    zipCode: "1550",
    isDefault: false,
  },
  {
    id: "3",
    name: "Ryza Flores",
    phone: "+63 998 765 4321",
    address: "Unit 5, Sunrise Condo, Katipunan Ave.",
    city: "Quezon City",
    province: "Metro Manila",
    zipCode: "1108",
    isDefault: false,
  },
];

export default function AddressListScreen() {
  const [addresses, setAddresses] = useState(ADDRESSES_DATA);

  const setDefaultAddress = (id: string) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
    Alert.alert("Success", "Default address updated");
  };

  const deleteAddress = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAddresses(prev => prev.filter(addr => addr.id !== id));
          },
        },
      ]
    );
  };

  const renderAddressItem = ({ item }: { item: typeof ADDRESSES_DATA[0] }) => (
    <View style={styles.addressCard}>
      {/* Default Badge */}
      {item.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultText}>DEFAULT</Text>
        </View>
      )}

      {/* Address Content */}
      <View style={styles.addressContent}>
        <Text style={styles.addressName}>{item.name}</Text>
        <Text style={styles.addressPhone}>{item.phone}</Text>
        <Text style={styles.addressText}>
          {item.address}, {item.city}, {item.province} {item.zipCode}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.setDefaultButton}
            onPress={() => setDefaultAddress(item.id)}
          >
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        

        <View style={styles.iconButtons}>
            <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push({
                pathname: "/address/edit/[id]",
                params: { id: item.id }
            })}
                >
            <Ionicons name="create-outline" size={20} color="#8F796F" />
            </TouchableOpacity>
  
            <TouchableOpacity
                style={styles.iconButton}
                onPress={() => deleteAddress(item.id)}
            >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Address</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/address/add")}
        >
          <Ionicons name="add" size={24} color="#C35822" />
        </TouchableOpacity>
      </View>

      {/* Address Count */}
      <Text style={styles.addressCount}>
        {addresses.length} saved {addresses.length === 1 ? "address" : "addresses"}
      </Text>

      {/* Address List */}
      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No saved addresses</Text>
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push("/address/add")}
            >
              <Text style={styles.addAddressText}>Add New Address</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  addressCount: {
    fontSize: 14,
    color: "#8F796F",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    position: "relative",
  },
  defaultBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#C35822",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  addressContent: {
    marginBottom: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
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
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  setDefaultButton: {
    backgroundColor: "#FBF8F4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  setDefaultText: {
    fontSize: 12,
    color: "#8F796F",
    fontWeight: "500",
  },
  iconButtons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 4,
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
  addAddressButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addAddressText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});