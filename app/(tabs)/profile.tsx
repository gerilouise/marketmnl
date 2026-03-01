import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock user data - will be replaced with real data from database later
  const userData = {
    name: "Ryza Mae Flores",
    email: "ryzaflores@gmail.com",
    orders: 12,
    reviews: 12,
    wishlist: 18,
    savedAddresses: 3,
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
            // TODO: Add actual logout logic with Supabase
            console.log("Logged out");
            // Navigate to login screen
            router.replace("/auth/login");
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Navigate to edit profile screen");
    // router.push("/edit-profile");
  };

  const navigateTo = (screen: string) => {
    // TODO: Replace with actual navigation when screens are created
    Alert.alert("Navigate", `Going to ${screen}`);
    // router.push(`/${screen}`);
  };

  const MenuItem = ({ icon, title, subtitle, onPress, rightIcon }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#8F796F" />
        </View>
        <View style={styles.menuItemTextContainer}>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} /> {/* Empty view for balance */}
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color="#8F796F" />
            </View>
            <TouchableOpacity style={styles.editImageButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileEmail}>{userData.email}</Text>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color="#C35822" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("orders")}>
              <Text style={styles.statNumber}>{userData.orders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("reviews")}>
              <Text style={styles.statNumber}>{userData.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("wishlist")}>
              <Text style={styles.statNumber}>{userData.wishlist}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigateTo("orders")}>
            <Ionicons name="bag-handle-outline" size={22} color="#C35822" />
            <Text style={styles.quickActionText}>My Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/chat')}>
            <Ionicons name="chatbubble-outline" size={22} color="#C35822" />
            <Text style={styles.quickActionText}>AI Chatbot</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <MenuItem
            icon="location-outline"
            title="Shipping Address"
            subtitle={`${userData.savedAddresses} saved addresses`}
            onPress={() => navigateTo("addresses")}
          />
          
          <MenuItem
            icon="star-outline"
            title="My Reviews"
            subtitle={`${userData.reviews} product reviews`}
            onPress={() => navigateTo("reviews")}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={24} color="#8F796F" />
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
          
          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => navigateTo("settings")}
          />
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#C35822" />
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
  profileCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0DAD1",
    justifyContent: "center",
    alignItems: "center",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#C35822",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#C35822",
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
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
    height: "100%",
    backgroundColor: "#F0F0F0",
  },
  quickActions: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginTop: 8,
  },
  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32, // Fixed width for icons
    alignItems: "center",
    marginRight: 12, // Space between icon and text
  },
  menuItemTextContainer: {
    flex: 1,
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C35822",
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});