// app/(tabs)/profile.tsx
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

export default function BuyerProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock buyer data
  const userData = {
    name: "Ryza Mae Flores",
    email: "ryzaflores@gmail.com",
    orders: 12,
    reviews: 12,
    wishlist: 18,
    savedAddresses: 3,
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Navigate to edit profile screen");
    // router.push("/edit-profile");
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
            router.replace("/auth/login");
          },
          style: "destructive",
        },
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, rightIcon }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color="#8F796F" />
        </View>
        <View>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
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
              <Ionicons name="person" size={40} color="#8F796F" />
            </View>
            <TouchableOpacity style={styles.cameraButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* User Name and Email */}
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>

          {/* Stats Row - ORDERS, REVIEWS, WISHLIST */}
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => router.push('/orders')}
            >
              <Text style={styles.statNumber}>{userData.orders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => Alert.alert("Reviews", "Navigate to reviews")}
            >
              <Text style={styles.statNumber}>{userData.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => router.push('/(tabs)/wishlist')}
            >
              <Text style={styles.statNumber}>{userData.wishlist}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {/* My Orders - with subtitle */}
          <MenuItem
            icon="receipt-outline"
            title="My Orders"
            subtitle={`${userData.orders} orders placed`}
            onPress={() => router.push('/orders')}
          />

          {/* Shipping Address */}
          <MenuItem
            icon="location-outline"
            title="Shipping Address"
            subtitle={`${userData.savedAddresses} saved addresses`}
            onPress={() => Alert.alert("Addresses", "Navigate to addresses")}
          />

          {/* My Reviews */}
          <MenuItem
            icon="star-outline"
            title="My Reviews"
            subtitle={`${userData.reviews} product reviews`}
            onPress={() => Alert.alert("Reviews", "Navigate to reviews")}
          />
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

          {/* Settings */}
          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => Alert.alert("Settings", "Navigate to settings")}
          />
        </View>

        {/* AI Chatbot Button - Matching your home screen */}
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => Alert.alert("AI Chat", "Open AI assistant")}
        >
          <View style={styles.chatButtonInner}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#C35822" />
            <Text style={styles.chatButtonText}>AI Assistant</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8F796F" />
        </TouchableOpacity>

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
    position: "relative",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0DAD1",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#C35822",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    textAlign: "center",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#8F796F",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#F0F0F0",
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
    flex: 1,
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
  menuItemSubtitle: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  chatButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatButtonText: {
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