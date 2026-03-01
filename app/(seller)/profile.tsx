// app/(seller)/profile.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SellerProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock seller data
  const sellerData = {
    name: "Jan Carlo",
    email: "jancarlorentoy@gmail.com",
    storeName: "Janjan's Kitchen",
    description: "Family-owned business specializing in authentic delicacies. We use traditional recipes passed down through three generations.",
    location: "Quezon City",
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Navigate to edit profile screen");
    // router.push("/seller/edit-profile");
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          onPress: () => {
            // TODO: Add actual logout logic
            router.replace("/auth/login");
          },
          style: "destructive",
        },
      ]
    );
  };

  const MenuItem = ({ icon, title, onPress, rightIcon }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color="#8F796F" />
        </View>
        <Text style={styles.menuItemTitle}>{title}</Text>
      </View>
      {rightIcon || <Ionicons name="chevron-forward" size={20} color="#8F796F" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Edit button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleEditProfile}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          {/* Profile Image Placeholder */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="storefront-outline" size={40} color="#8F796F" />
            </View>
          </View>

          {/* Seller Name and Email */}
          <Text style={styles.sellerName}>{sellerData.name}</Text>
          <Text style={styles.sellerEmail}>{sellerData.email}</Text>

          {/* Store Details */}
          <View style={styles.detailsContainer}>
            {/* Store Name */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Store Name</Text>
              <Text style={styles.detailValue}>{sellerData.storeName}</Text>
            </View>

            {/* Description */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{sellerData.description}</Text>
            </View>

            {/* Location */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{sellerData.location}</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Notifications Toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={22} color="#8F796F" />
              </View>
              <Text style={styles.menuItemTitle}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E0DAD1", true: "#C35822" }}
              thumbColor="#FFF"
            />
          </View>

          {/* Settings Menu Item */}
          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => Alert.alert("Settings", "Navigate to settings")}
          />
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#C35822" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#32221B",
  },
  editText: {
    fontSize: 16,
    color: "#C35822",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
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
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  sellerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32221B",
    textAlign: "center",
    marginBottom: 4,
  },
  sellerEmail: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 20,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: "#8F796F",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#32221B",
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 15,
    color: "#32221B",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C35822",
    marginBottom: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
  },
  bottomPadding: {
    height: 40,
  },
});