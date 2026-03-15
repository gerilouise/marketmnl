import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// Mock address data (would come from database)
const ADDRESSES_DATA = {
  "1": {
    id: "1",
    name: "Ryza Flores",
    phone: "+63 906 561 6297",
    address: "11 Chico St., Brgy. Quirino 2-A",
    city: "Quezon City",
    province: "Metro Manila",
    zipCode: "1102",
    isDefault: true,
  },
  "2": {
    id: "2",
    name: "Ryza Flores",
    phone: "+63 917 123 4567",
    address: "22 Mabini St.",
    city: "Mandaluyong City",
    province: "Metro Manila",
    zipCode: "1550",
    isDefault: false,
  },
};

export default function EditAddressScreen() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    // Load address data based on ID
    const addressData = ADDRESSES_DATA[id as keyof typeof ADDRESSES_DATA];
    if (addressData) {
      setName(addressData.name);
      setPhone(addressData.phone);
      setAddress(addressData.address);
      setCity(addressData.city);
      setProvince(addressData.province);
      setZipCode(addressData.zipCode);
      setIsDefault(addressData.isDefault);
    }
  }, [id]);

  const handleSave = () => {
    if (!name || !phone || !address || !city || !province || !zipCode) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // TODO: Update in database
    Alert.alert("Success", "Address updated successfully", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Delete from database
            Alert.alert("Success", "Address deleted", [
              { text: "OK", onPress: () => router.back() }
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Ryza Flores"
            placeholderTextColor="#8F796F"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., +63 906 561 6297"
            placeholderTextColor="#8F796F"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Street Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 11 Chico St., Brgy. Quirino 2-A"
            placeholderTextColor="#8F796F"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Quezon City"
            placeholderTextColor="#8F796F"
            value={city}
            onChangeText={setCity}
          />
        </View>

        {/* Province and Zip Code Row */}
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
            <Text style={styles.label}>Province</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Metro Manila"
              placeholderTextColor="#8F796F"
              value={province}
              onChangeText={setProvince}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1102"
              placeholderTextColor="#8F796F"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Default Address Toggle */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsDefault(!isDefault)}
        >
          <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
            {isDefault && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>Set as default address</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Address</Text>
        </TouchableOpacity>
      </ScrollView>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#C35822",
    borderRadius: 20,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FBF8F4",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  rowInputs: {
    flexDirection: "row",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C35822",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#C35822",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#32221B",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
    marginTop: 10,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
});