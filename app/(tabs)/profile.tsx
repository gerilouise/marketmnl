// app/(tabs)/profile.tsx
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';

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
  const { profile, addresses, loading, fetchProfile, fetchAddresses } = useFirebaseProfile();

  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time listener for reviews count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setReviewsCount(0);
        return;
      }

      const reviewsRef = collection(db, 'reviews');
      const q = query(reviewsRef, where('userId', '==', user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setReviewsCount(snapshot.size);
      });

      return () => unsubscribe();
    }, [])
  );

  // Set up real-time listener for wishlist count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setWishlistCount(0);
        return;
      }

      const wishlistRef = collection(db, 'wishlists');
      const q = query(wishlistRef, where('userId', '==', user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setWishlistCount(snapshot.size);
      });

      return () => unsubscribe();
    }, [])
  );

  // Set up real-time listener for followed shops count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setFollowingCount(0);
        setFollowedShops([]);
        setLoadingFollowed(false);
        return;
      }

      setLoadingFollowed(true);

      const followsRef = collection(db, 'follows');
      const q = query(followsRef, where('userId', '==', user.uid));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const shops: FollowedShop[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const followData = docSnapshot.data();
          const shopId = followData.shopId;
          
          const sellerRef = doc(db, 'sellers', shopId);
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
    }, [])
  );

  const loadData = async () => {
    await fetchProfile();
    await fetchAddresses();
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    
    try {
      await auth.signOut();
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
    router.push("/(tabs)/edit-profile");
  };

  const navigateToStore = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  const navigateToAllFollowing = () => {
    router.push({
      pathname: "/(tabs)/following",
      params: { followedShops: JSON.stringify(followedShops) }
    });
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
        router.push("/(tabs)/my-reviews");
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
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={48} color="#C0B7AE" />
              </View>
            )}
            <TouchableOpacity style={styles.editImageButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{profile?.fullName || "User"}</Text>
          <Text style={styles.profileEmail}>{profile?.email || user?.email || "No email"}</Text>

          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Ionicons name="pencil-outline" size={14} color="#C35822" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Stats Row - Reviews, Wishlist, Following */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("reviews")}>
              <Text style={styles.statNumber}>{reviewsCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("wishlist")}>
              <Text style={styles.statNumber}>{wishlistCount}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("following")}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Orders - Quick Action */}
        <TouchableOpacity style={styles.myOrdersCard} onPress={() => navigateTo("orders")}>
          <View style={styles.myOrdersLeft}>
            <View style={styles.myOrdersIcon}>
              <Ionicons name="bag-handle-outline" size={24} color="#C35822" />
            </View>
            <View>
              <Text style={styles.myOrdersTitle}>My Orders</Text>
              <Text style={styles.myOrdersSubtitle}>View your order history</Text>
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
            subtitle={`${addresses?.length || 0} saved addresses`}
            onPress={() => navigateTo("addresses")}
          />
          
          <MenuItem
            icon="card-outline"
            title="Payment Methods"
            subtitle="Credit cards, GCash, Maya"
            onPress={() => Alert.alert("Coming Soon", "Payment methods will be available soon!")}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <MenuItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and support"
            onPress={() => Alert.alert("Help Center", "Coming soon!")}
          />
          
          <MenuItem
            icon="chatbubble-outline"
            title="Contact Us"
            subtitle="Get in touch with us"
            onPress={() => Alert.alert("Contact Us", "Email: support@marketmnl.com")}
          />
          
          <MenuItem
            icon="information-circle-outline"
            title="About"
            subtitle="App version 1.0.0"
            onPress={() => Alert.alert("About", "MarketMNL - Your local marketplace")}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="notifications-outline" size={22} color="#8F796F" />
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

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]} 
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
  bottomPadding: {
    height: 40,
  },
});