// app/(tabs)/add-address.tsx
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddAddressScreen() {
  const { addAddress, loading, fetchAddresses } = useFirebaseProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [label, setLabel] = useState("Home");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const addressLabels = ["Home", "Office", "Other"];

  const validateForm = () => {
    if (
      !fullName ||
      !phone ||
      !street ||
      !barangay ||
      !city ||
      !province ||
      !zipCode
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return false;
    }

    if (zipCode.length < 4) {
      Alert.alert("Error", "Please enter a valid ZIP code");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    const addressData = {
      fullName,
      phone,
      street,
      barangay,
      city,
      province,
      zipCode,
      label,
      isDefault,
    };

    const success = await addAddress(addressData);

    if (success) {
      // Refresh addresses before navigating back
      await fetchAddresses();
      // Use replace to go back and force refresh
      router.replace("/(tabs)/addresses");
    }

    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/addresses")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Address</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Juan Dela Cruz"
              placeholderTextColor="#8F796F"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+63 912 345 6789"
              placeholderTextColor="#8F796F"
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street / Block / Apartment *</Text>
            <TextInput
              style={styles.input}
              value={street}
              onChangeText={setStreet}
              placeholder="11 Chico St."
              placeholderTextColor="#8F796F"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barangay / District *</Text>
            <TextInput
              style={styles.input}
              value={barangay}
              onChangeText={setBarangay}
              placeholder="Brgy. Quirino 2-A"
              placeholderTextColor="#8F796F"
              editable={!saving}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Quezon City"
                placeholderTextColor="#8F796F"
                editable={!saving}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Province *</Text>
              <TextInput
                style={styles.input}
                value={province}
                onChangeText={setProvince}
                placeholder="Metro Manila"
                placeholderTextColor="#8F796F"
                editable={!saving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code *</Text>
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="1102"
              placeholderTextColor="#8F796F"
              keyboardType="numeric"
              maxLength={4}
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Label</Text>

          <View style={styles.labelContainer}>
            {addressLabels.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.labelChip,
                  label === item && styles.labelChipActive,
                ]}
                onPress={() => setLabel(item)}
              >
                <Text
                  style={[
                    styles.labelChipText,
                    label === item && styles.labelChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.defaultCheckbox}
            onPress={() => setIsDefault(!isDefault)}
          >
            <View
              style={[styles.checkbox, isDefault && styles.checkboxChecked]}
            >
              {isDefault && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Set as default address</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 12,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#32221B",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F5F0EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  labelContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  labelChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#F5F0EB",
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  labelChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  labelChipText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
  },
  labelChipTextActive: {
    color: "#FFF",
  },
  defaultCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C35822",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#C35822",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#32221B",
  },
});