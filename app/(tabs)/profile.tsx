// app/(tabs)/profile.tsx
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { profile, addresses, loading, fetchProfile } = useFirebaseProfile();
  const { logout } = useFirebaseAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
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
          onPress: async () => {
            await logout();
          },
          style: "destructive",
        },
      ],
      { cancelable: true },
    );
  };

  const handleEditProfile = () => {
    router.push("/(tabs)/edit-profile");
  };

  const navigateTo = (screen: string) => {
    switch (screen) {
      case "addresses":
        router.push("/(tabs)/addresses");
        break;
      case "orders":
        Alert.alert("Coming Soon", "Orders screen will be available soon!");
        break;
      case "reviews":
        Alert.alert("Coming Soon", "Reviews screen will be available soon!");
        break;
      case "wishlist":
        router.push("/(tabs)/wishlist");
        break;
      case "settings":
        Alert.alert("Coming Soon", "Settings screen will be available soon!");
        break;
      default:
        Alert.alert("Navigate", `Going to ${screen}`);
    }
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
      {rightIcon || (
        <Ionicons name="chevron-forward" size={20} color="#8F796F" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35822" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const defaultAddress = addresses?.find((addr) => addr.isDefault);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color="#8F796F" />
            </View>
            <TouchableOpacity
              style={styles.editImageButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{profile?.fullName || "User"}</Text>
          <Text style={styles.profileEmail}>
            {profile?.email || "No email"}
          </Text>

          {profile?.age && (
            <Text style={styles.profileAge}>Age: {profile.age}</Text>
          )}
          {profile?.birthdate && (
            <Text style={styles.profileBirthdate}>
              Born: {new Date(profile.birthdate).toLocaleDateString()}
            </Text>
          )}

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="pencil" size={16} color="#C35822" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigateTo("orders")}
            >
              <Text style={styles.statNumber}>{profile?.ordersCount || 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigateTo("reviews")}
            >
              <Text style={styles.statNumber}>
                {profile?.reviewsCount || 0}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigateTo("wishlist")}
            >
              <Text style={styles.statNumber}>
                {profile?.wishlistCount || 0}
              </Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {defaultAddress && (
          <TouchableOpacity
            style={styles.defaultAddressCard}
            onPress={() => navigateTo("addresses")}
          >
            <View style={styles.defaultAddressHeader}>
              <Ionicons name="location" size={20} color="#C35822" />
              <Text style={styles.defaultAddressTitle}>Default Address</Text>
            </View>
            <Text style={styles.defaultAddressName}>
              {defaultAddress.fullName}
            </Text>
            <Text style={styles.defaultAddressPhone}>
              {defaultAddress.phone}
            </Text>
            <Text style={styles.defaultAddressText}>
              {defaultAddress.street}, {defaultAddress.barangay},{" "}
              {defaultAddress.city}, {defaultAddress.province}{" "}
              {defaultAddress.zipCode}
            </Text>
            <View style={styles.defaultAddressFooter}>
              <Text style={styles.defaultAddressLabel}>
                {defaultAddress.label}
              </Text>
              <TouchableOpacity onPress={() => navigateTo("addresses")}>
                <Text style={styles.manageAddressText}>Manage Addresses</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigateTo("orders")}
          >
            <Ionicons name="bag-handle-outline" size={22} color="#C35822" />
            <Text style={styles.quickActionText}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push("/chat")}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#C35822" />
            <Text style={styles.quickActionText}>AI Chatbot</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <MenuItem
            icon="location-outline"
            title="Shipping Address"
            subtitle={`${profile?.addressesCount || 0} saved addresses`}
            onPress={() => navigateTo("addresses")}
          />

          <MenuItem
            icon="star-outline"
            title="My Reviews"
            subtitle={`${profile?.reviewsCount || 0} product reviews`}
            onPress={() => navigateTo("reviews")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#8F796F"
                />
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

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#C35822" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8F796F",
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
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 2,
  },
  profileBirthdate: {
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
  defaultAddressCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C35822",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  defaultAddressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  defaultAddressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
    marginLeft: 8,
  },
  defaultAddressName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  defaultAddressPhone: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 4,
  },
  defaultAddressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  defaultAddressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  defaultAddressLabel: {
    fontSize: 12,
    color: "#8F796F",
    fontWeight: "500",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  manageAddressText: {
    color: "#C35822",
    fontSize: 12,
    fontWeight: "500",
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
    width: 32,
    alignItems: "center",
    marginRight: 12,
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
