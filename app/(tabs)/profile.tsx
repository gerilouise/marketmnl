// app/(tabs)/profile.tsx - With custom logout modal
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FollowedShop {
  id: string;
  storeName: string;
  storeImage?: string;
  description?: string;
}

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [followedShops, setFollowedShops] = useState<FollowedShop[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [debugMessage, setDebugMessage] = useState("Ready");
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [reviewCount, setReviewCount] = useState(0); // ADD THIS STATE
  const { profile, addresses, loading, fetchProfile, fetchAddresses } =
    useFirebaseProfile();

  useEffect(() => {
    loadData();
    loadReviewCount(); // ADD THIS
  }, []);

  // ADD THIS FUNCTION inside your ProfileScreen component
  const loadReviewCount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      setReviewCount(querySnapshot.size);
    } catch (error) {
      console.error("Error loading review count:", error);
    }
  };

  // Set up real-time listener for wishlist count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setWishlistCount(0);
        return;
      }

      const wishlistRef = collection(db, "wishlists");
      const q = query(wishlistRef, where("userId", "==", user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setWishlistCount(snapshot.size);
        setDebugMessage(`Wishlist updated: ${snapshot.size} items`);
      });

      return () => unsubscribe();
    }, []),
  );

  // Set up real-time listener for followed shops
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setFollowedShops([]);
        setLoadingFollowed(false);
        return;
      }

      setDebugMessage(`Setting up follows listener...`);
      setLoadingFollowed(true);

      const followsRef = collection(db, "follows");
      const q = query(followsRef, where("userId", "==", user.uid));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        setDebugMessage(`Found ${snapshot.size} followed shops`);
        const shops: FollowedShop[] = [];

        for (const docSnapshot of snapshot.docs) {
          const followData = docSnapshot.data();
          const shopId = followData.shopId;

          const sellerRef = doc(db, "sellers", shopId);
          const sellerSnap = await getDoc(sellerRef);

          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            shops.push({
              id: shopId,
              storeName: sellerData.storeName || "Market Seller",
              storeImage: sellerData.imageUrl,
              description: sellerData.description,
            });
          }
        }

        setFollowedShops(shops);
        setLoadingFollowed(false);
      });

      return () => unsubscribe();
    }, []),
  );

  const loadData = async () => {
    setDebugMessage("Loading profile data...");
    await fetchProfile();
    await fetchAddresses();
    setDebugMessage("Profile data loaded");
  };

  const showLogoutModal = () => {
    setDebugMessage("Logout button pressed");
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    setDebugMessage("Logging out...");
    setLogoutModalVisible(false);

    try {
      // Sign out from Firebase
      await auth.signOut();
      setDebugMessage("✅ Signed out successfully!");

      // Clear local state
      setFollowedShops([]);
      setWishlistCount(0);
      setReviewCount(0); // ADD THIS

      // Navigate to login
      setTimeout(() => {
        router.replace("/auth/login");
      }, 100);
    } catch (error: any) {
      setDebugMessage(`❌ Logout error: ${error.message}`);
      Alert.alert("Error", "Failed to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const cancelLogout = () => {
    setLogoutModalVisible(false);
    setDebugMessage("Logout cancelled");
  };

  const handleEditProfile = () => {
    router.push("/(tabs)/edit-profile");
  };

  const navigateToStore = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  const navigateTo = (screen: string) => {
    switch (screen) {
      case "addresses":
        router.push("/(tabs)/addresses");
        break;
      case "orders":
        router.push("/(tabs)/orders");
        break;
      case "reviews":
        router.push("/reviews"); // CHANGE THIS - navigate to reviews screen
        break;
      case "wishlist":
        router.push("/(tabs)/wishlist");
        break;
      case "following":
        router.push("/(tabs)/following");
        break;
      case "settings":
        Alert.alert("Coming Soon", "Settings screen will be available soon!");
        break;
      default:
        Alert.alert("Navigate", `Going to ${screen}`);
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress, badge }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color="#8F796F" />
        </View>
        <View style={styles.menuItemTextContainer}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#C0B7AE" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35822" />
      </View>
    );
  }

  const defaultAddress = addresses?.find((addr) => addr.isDefault);
  const user = auth.currentUser;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigateTo("settings")}>
            <Ionicons name="settings-outline" size={24} color="#32221B" />
          </TouchableOpacity>
        </View>

        {/* Debug Panel
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>🔍 Debug:</Text>
          <Text style={styles.debugText}>{debugMessage}</Text>
          <Text style={styles.debugTextSmall}>
            User: {user ? user.uid.substring(0, 8) + "..." : "Not logged in"}
          </Text>
        </View> */}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {profile?.photoURL ? (
              <Image
                source={{ uri: profile.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={48} color="#C0B7AE" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editImageButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{profile?.fullName || "User"}</Text>
          <Text style={styles.profileEmail}>
            {profile?.email || user?.email || "No email"}
          </Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="pencil-outline" size={14} color="#C35822" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Stats Row - UPDATED to use reviewCount state */}
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
              <Text style={styles.statNumber}>{reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigateTo("wishlist")}
            >
              <Text style={styles.statNumber}>{wishlistCount}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <TouchableOpacity onPress={() => navigateTo("addresses")}>
              <Text style={styles.sectionLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {defaultAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressIconRow}>
                <Ionicons name="location-outline" size={18} color="#C35822" />
                <Text style={styles.addressLabelTag}>
                  {defaultAddress.label}
                </Text>
              </View>
              <Text style={styles.addressName}>{defaultAddress.fullName}</Text>
              <Text style={styles.addressText}>
                {defaultAddress.street}, {defaultAddress.barangay},{" "}
                {defaultAddress.city}
              </Text>
              <Text style={styles.addressText}>
                {defaultAddress.province} {defaultAddress.zipCode}
              </Text>
              <Text style={styles.addressPhone}>{defaultAddress.phone}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push("/(tabs)/add-address")}
            >
              <Ionicons name="add-circle-outline" size={22} color="#C35822" />
              <Text style={styles.addAddressText}>Add a shipping address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigateTo("orders")}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="bag-handle-outline" size={22} color="#C35822" />
            </View>
            <Text style={styles.quickActionLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push("/chatbot")}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#C35822"
              />
            </View>
            <Text style={styles.quickActionLabel}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigateTo("following")}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="heart-outline" size={22} color="#C35822" />
            </View>
            <Text style={styles.quickActionLabel}>Following</Text>
            {followedShops.length > 0 && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>
                  {followedShops.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem
            icon="location-outline"
            title="Addresses"
            subtitle={`${addresses?.length || 0} saved`}
            onPress={() => navigateTo("addresses")}
          />
          <MenuItem
            icon="star-outline"
            title="Reviews"
            subtitle={`${reviewCount} reviews`} // CHANGED to use reviewCount
            onPress={() => navigateTo("reviews")}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#8F796F"
                />
              </View>
              <Text style={styles.menuItemTitle}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E8E2DC", true: "#C35822" }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Logout Button - Red Outline */}
        <TouchableOpacity style={styles.logoutButton} onPress={showLogoutModal}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Custom Logout Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={50} color="#FF3B30" />
            </View>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out?
            </Text>
            <Text style={styles.modalWarning}>
              You will need to log in again.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={cancelLogout}
                disabled={loggingOut}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutModalButton]}
                onPress={confirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.logoutModalButtonText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... keep all your existing styles exactly as they are ...
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
  },
  debugPanel: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#C35822",
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: "#32221B",
    fontFamily: "monospace",
    marginBottom: 2,
  },
  debugTextSmall: {
    fontSize: 10,
    color: "#8F796F",
    fontFamily: "monospace",
  },
  profileCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#C35822",
  },
  profileImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F5F0EB",
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
    fontSize: 20,
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
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C35822",
    marginBottom: 20,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#C35822",
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8F796F",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#F0F0F0",
  },
  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  sectionLink: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
  },
  addressCard: {
    backgroundColor: "#FEF5ED",
    borderRadius: 12,
    padding: 12,
  },
  addressIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addressLabelTag: {
    fontSize: 11,
    fontWeight: "500",
    color: "#C35822",
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  addressPhone: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 4,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  addAddressText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  quickActionsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#32221B",
  },
  quickActionBadge: {
    position: "absolute",
    top: 6,
    right: 12,
    backgroundColor: "#C35822",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  quickActionBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFF",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0EB",
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
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#C35822",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF3B30",
  },
  bottomPadding: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 12,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  cancelModalButtonText: {
    color: "#8F796F",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutModalButton: {
    backgroundColor: "#FF3B30",
  },
  logoutModalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
