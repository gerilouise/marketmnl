// app/(tabs)/profile.tsx
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
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
  RefreshControl,
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
  const [reviewsCount, setReviewsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const {
    addresses,
    loading: profileLoading,
    fetchAddresses,
  } = useFirebaseProfile();

  // Check if user is logged in (not guest)
  const isLoggedIn = () => {
    const user = auth.currentUser;
    return user !== null && !user.isAnonymous;
  };

  // Show login modal for guest users
  const showLoginPrompt = (action: string) => {
    setPendingAction(action);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setPendingAction("");
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  const handleSignUp = () => {
    setShowLoginModal(false);
    router.push("/auth/signup-customer");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isLoggedIn()) {
      await fetchAddresses();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (isLoggedIn()) {
      fetchAddresses();
    }
  }, []);

  // Set up real-time listener for profile changes
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        setProfileData(null);
        return;
      }

      // Try to get from profiles collection first
      const profileRef = doc(db, "profiles", user.uid);
      const unsubscribeProfile = onSnapshot(profileRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log("🔄 Profile updated from profiles:", data);
          setProfileData({
            id: doc.id,
            fullName: data.fullName || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            photoURL: data.photoURL || null,
            userType: data.userType || "buyer",
          });
        } else {
          // If not in profiles, try to get from users collection
          const userRef = doc(db, "users", user.uid);
          const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("🔄 Profile updated from users:", userData);
              setProfileData({
                id: user.uid,
                fullName: userData.fullName || user.displayName || "",
                firstName:
                  (userData.fullName || user.displayName || "").split(" ")[0] ||
                  "",
                lastName:
                  (userData.fullName || user.displayName || "")
                    .split(" ")
                    .slice(1)
                    .join(" ") || "",
                email: userData.email || user.email || "",
                phone: userData.phone || "",
                photoURL: userData.photoURL || null,
                userType: userData.userType || "buyer",
              });
            } else {
              // Create profile if it doesn't exist
              const newProfile = {
                fullName: user.displayName || "",
                firstName: (user.displayName || "").split(" ")[0] || "",
                lastName:
                  (user.displayName || "").split(" ").slice(1).join(" ") || "",
                email: user.email || "",
                phone: "",
                photoURL: null,
                userType: "buyer",
                createdAt: new Date(),
              };
              setDoc(profileRef, newProfile);
              setProfileData({ id: user.uid, ...newProfile });
            }
          });
          return () => unsubscribeUser();
        }
      });

      return () => unsubscribeProfile();
    }, []),
  );

  // Set up real-time listener for reviews count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        setReviewsCount(0);
        return;
      }

      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("userId", "==", user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setReviewsCount(snapshot.size);
      });

      return () => unsubscribe();
    }, []),
  );

  // Set up real-time listener for wishlist count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        setWishlistCount(0);
        return;
      }

      const wishlistRef = collection(db, "wishlists");
      const q = query(wishlistRef, where("userId", "==", user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setWishlistCount(snapshot.size);
      });

      return () => unsubscribe();
    }, []),
  );

  // Set up real-time listener for followed shops count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        setFollowingCount(0);
        setFollowedShops([]);
        setLoadingFollowed(false);
        return;
      }

      setLoadingFollowed(true);

      const followsRef = collection(db, "follows");
      const q = query(followsRef, where("userId", "==", user.uid));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
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
              storeImage: sellerData.avatar,
              description: sellerData.storeDescription,
            });
          }
        }

        setFollowedShops(shops);
        setFollowingCount(shops.length);
        setLoadingFollowed(false);
      });

      return () => unsubscribe();
    }, []),
  );

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await auth.signOut();
      setProfileData(null);
      setFollowedShops([]);
      setWishlistCount(0);
      setReviewsCount(0);
      setFollowingCount(0);
      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("Error", "Failed to log out. Please try again.");
      setLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    if (!isLoggedIn()) {
      showLoginPrompt("edit your profile");
      return;
    }
    router.push("/(tabs)/edit-profile");
  };

  const navigateToStore = (storeId: string) => {
    if (!isLoggedIn()) {
      showLoginPrompt("view shop details");
      return;
    }
    router.push(`/store/${storeId}`);
  };

  const navigateToAllFollowing = () => {
    if (!isLoggedIn()) {
      showLoginPrompt("view your following list");
      return;
    }
    router.push({
      pathname: "/(tabs)/following",
      params: { followedShops: JSON.stringify(followedShops) },
    });
  };

  const navigateTo = (screen: string) => {
    // Check login for protected screens
    const protectedScreens = [
      "addresses",
      "orders",
      "reviews",
      "wishlist",
      "following",
    ];

    if (protectedScreens.includes(screen) && !isLoggedIn()) {
      let action = "";
      switch (screen) {
        case "addresses":
          action = "manage your addresses";
          break;
        case "orders":
          action = "view your orders";
          break;
        case "reviews":
          action = "see your reviews";
          break;
        case "wishlist":
          action = "view your wishlist";
          break;
        case "following":
          action = "see your followed shops";
          break;
        default:
          action = "access this feature";
      }
      showLoginPrompt(action);
      return;
    }

    switch (screen) {
      case "addresses":
        router.push("/(tabs)/addresses");
        break;
      case "orders":
        router.push("/(tabs)/orders");
        break;
      case "reviews":
        router.push("/(tabs)/my-reviews");
        break;
      case "wishlist":
        router.push("/(tabs)/wishlist");
        break;
      case "following":
        router.push("/(tabs)/following");
        break;
      case "settings":
        router.push("/(tabs)/settings");
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

  // Login Required Modal Component
  const LoginRequiredModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLoginModal}
      onRequestClose={closeLoginModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.loginModalContent}>
          <View style={styles.loginModalIcon}>
            <Ionicons name="log-in-outline" size={60} color="#C35822" />
          </View>
          <Text style={styles.loginModalTitle}>Login Required</Text>
          <Text style={styles.loginModalMessage}>
            Please log in to {pendingAction}
          </Text>
          <Text style={styles.loginModalSubMessage}>
            Create an account to enjoy personalized shopping, save your
            favorites, and track your orders!
          </Text>

          <View style={styles.loginModalButtons}>
            <TouchableOpacity
              style={[styles.loginModalButton, styles.loginButtonModal]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonModalText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginModalButton, styles.signupButtonModal]}
              onPress={handleSignUp}
            >
              <Text style={styles.signupButtonModalText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginModalClose}
            onPress={closeLoginModal}
          >
            <Text style={styles.loginModalCloseText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const loading = profileLoading && !profileData && isLoggedIn();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35822" />
      </View>
    );
  }

  const user = auth.currentUser;
  const loggedIn = isLoggedIn();
  const profile = profileData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C35822"]}
            tintColor="#C35822"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigateTo("settings")}>
            <Ionicons name="settings-outline" size={24} color="#32221B" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {profile?.photoURL && loggedIn ? (
              <Image
                source={{ uri: profile.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={48} color="#C0B7AE" />
              </View>
            )}
            {loggedIn && (
              <TouchableOpacity
                style={styles.editImageButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="camera" size={14} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.profileName}>
            {loggedIn ? profile?.fullName || "User" : "Guest User"}
          </Text>
          <Text style={styles.profileEmail}>
            {loggedIn
              ? profile?.email || user?.email || "No email"
              : "Not logged in"}
          </Text>

          {loggedIn ? (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil-outline" size={14} color="#C35822" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/auth/login")}
            >
              <Ionicons name="log-in-outline" size={14} color="#FFF" />
              <Text style={styles.loginButtonText}>Log In / Sign Up</Text>
            </TouchableOpacity>
          )}

          {/* Stats Row - Reviews, Wishlist, Following */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigateTo("reviews")}
            >
              <Text style={styles.statNumber}>{reviewsCount}</Text>
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
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigateTo("following")}
            >
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Orders - Quick Action */}
        <TouchableOpacity
          style={styles.myOrdersCard}
          onPress={() => navigateTo("orders")}
        >
          <View style={styles.myOrdersLeft}>
            <View style={styles.myOrdersIcon}>
              <Ionicons name="bag-handle-outline" size={24} color="#C35822" />
            </View>
            <View>
              <Text style={styles.myOrdersTitle}>My Orders</Text>
              <Text style={styles.myOrdersSubtitle}>
                {loggedIn
                  ? "View your order history"
                  : "Log in to view your orders"}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C0B7AE" />
        </TouchableOpacity>

        {/* Account Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <MenuItem
            icon="location-outline"
            title="Shipping Addresses"
            subtitle={
              loggedIn
                ? `${addresses?.length || 0} saved addresses`
                : "Log in to manage addresses"
            }
            onPress={() => navigateTo("addresses")}
          />

          <MenuItem
            icon="card-outline"
            title="Payment Methods"
            subtitle="Credit cards, GCash, Maya"
            onPress={() => {
              if (!loggedIn) {
                showLoginPrompt("manage payment methods");
                return;
              }
              Alert.alert(
                "Coming Soon",
                "Payment methods will be available soon!",
              );
            }}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <MenuItem
            icon="chatbubble-outline"
            title="Contact Us"
            subtitle="Chat with our support team"
            onPress={() => router.push("/chatbot?from=profile")}
          />

          <MenuItem
            icon="information-circle-outline"
            title="About"
            subtitle="App version 1.0.0"
            onPress={() =>
              Alert.alert("About", "MarketMNL - Your local marketplace")
            }
          />
        </View>

        {/* Preferences - Only show for logged in users */}
        {loggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#8F796F"
                />
                <Text style={styles.preferenceTitle}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E8E2DC", true: "#C35822" }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        )}

        {/* Logout Button - Only show for logged in users */}
        {loggedIn ? (
          <TouchableOpacity
            style={[
              styles.logoutButton,
              loggingOut && styles.logoutButtonDisabled,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <>
                <ActivityIndicator size="small" color="#FF3B30" />
                <Text style={styles.logoutText}>Logging out...</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.logoutText}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.guestLoginButton}
            onPress={() => router.push("/auth/login")}
          >
            <Ionicons name="log-in-outline" size={20} color="#C35822" />
            <Text style={styles.guestLoginText}>Log In / Sign Up</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Login Required Modal */}
      <LoginRequiredModal />
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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#C35822",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#C35822",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#C35822",
    marginBottom: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#C35822",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#C35822",
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFF",
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
    fontSize: 20,
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
  myOrdersCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  myOrdersLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  myOrdersIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
  },
  myOrdersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  myOrdersSubtitle: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0EB",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
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
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  preferenceTitle: {
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
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF3B30",
  },
  guestLoginButton: {
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
    borderColor: "#C35822",
  },
  guestLoginText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C35822",
  },
  bottomPadding: {
    height: 40,
  },
  // Login Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loginModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
  },
  loginModalMessage: {
    fontSize: 16,
    color: "#32221B",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  loginModalSubMessage: {
    fontSize: 13,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  loginModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  loginModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  loginButtonModal: {
    backgroundColor: "#C35822",
  },
  loginButtonModalText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signupButtonModal: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#C35822",
  },
  signupButtonModalText: {
    color: "#C35822",
    fontSize: 16,
    fontWeight: "600",
  },
  loginModalClose: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginModalCloseText: {
    color: "#8F796F",
    fontSize: 14,
  },
});
