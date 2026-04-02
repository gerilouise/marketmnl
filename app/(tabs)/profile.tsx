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
  const [ordersCount, setOrdersCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const { profile, addresses, loading, fetchProfile, fetchAddresses } = useFirebaseProfile();

  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time listener for orders count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setOrdersCount(0);
        return;
      }

      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setOrdersCount(snapshot.size);
      });

      return () => unsubscribe();
    }, [])
  );

  // Set up real-time listener for reviews count
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setReviewsCount(0);
        return;
      }

      const reviewsRef = collection(db, 'product_reviews');
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

  // Set up real-time listener for followed shops
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
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
              storeImage: sellerData.imageUrl,
              description: sellerData.description,
            });
          }
        }
        
        setFollowedShops(shops);
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
      setOrdersCount(0);
      setReviewsCount(0);
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
        Alert.alert("Coming Soon", "Reviews screen will be available soon!");
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

          {/* Stats Row - Real-time counts */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("orders")}>
              <Text style={styles.statNumber}>{ordersCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("reviews")}>
              <Text style={styles.statNumber}>{reviewsCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={() => navigateTo("wishlist")}>
              <Text style={styles.statNumber}>{wishlistCount}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Following Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Following</Text>
            <Text style={styles.sectionCount}>{followedShops.length} shops</Text>
          </View>

          {loadingFollowed ? (
            <ActivityIndicator size="small" color="#C35822" style={styles.sectionLoader} />
          ) : followedShops.length > 0 ? (
            <View>
              {followedShops.slice(0, 3).map((shop) => (
                <TouchableOpacity key={shop.id} style={styles.followedShopItem} onPress={() => navigateToStore(shop.id)}>
                  {shop.storeImage ? (
                    <Image source={{ uri: shop.storeImage }} style={styles.shopAvatar} />
                  ) : (
                    <View style={styles.shopAvatarPlaceholder}>
                      <Ionicons name="storefront-outline" size={22} color="#C0B7AE" />
                    </View>
                  )}
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{shop.storeName}</Text>
                    {shop.description && (
                      <Text style={styles.shopDescription} numberOfLines={1}>
                        {shop.description}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#C0B7AE" />
                </TouchableOpacity>
              ))}
              {followedShops.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton} onPress={navigateToAllFollowing}>
                  <Text style={styles.viewAllButtonText}>View all {followedShops.length} shops</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={40} color="#E0DAD1" />
              <Text style={styles.emptyStateText}>No shops followed yet</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/browse")}>
                <Text style={styles.emptyStateLink}>Browse shops</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Default Address</Text>
            <TouchableOpacity onPress={() => navigateTo("addresses")}>
              <Text style={styles.sectionLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {defaultAddress ? (
            <TouchableOpacity style={styles.addressItem} onPress={() => navigateTo("addresses")}>
              <View style={styles.addressIcon}>
                <Ionicons name="location-outline" size={20} color="#C35822" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{defaultAddress.fullName}</Text>
                <Text style={styles.addressText}>
                  {defaultAddress.street}, {defaultAddress.barangay}, {defaultAddress.city}
                </Text>
                <Text style={styles.addressText}>
                  {defaultAddress.province} {defaultAddress.zipCode}
                </Text>
                <Text style={styles.addressPhone}>{defaultAddress.phone}</Text>
                <View style={styles.addressLabel}>
                  <Text style={styles.addressLabelText}>{defaultAddress.label}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C0B7AE" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addAddressItem} onPress={() => router.push("/(tabs)/add-address")}>
              <Ionicons name="add-circle-outline" size={24} color="#C35822" />
              <Text style={styles.addAddressText}>Add a shipping address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigateTo("orders")}>
            <Ionicons name="bag-handle-outline" size={22} color="#C35822" />
            <Text style={styles.quickActionText}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push("/chatbot")}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#C35822" />
            <Text style={styles.quickActionText}>AI Chatbot</Text>
          </TouchableOpacity>
        </View>

        {/* Account Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem
            icon="location-outline"
            title="Shipping Addresses"
            subtitle={`${addresses?.length || 0} saved addresses`}
            onPress={() => navigateTo("addresses")}
          />
          <MenuItem
            icon="star-outline"
            title="My Reviews"
            subtitle={`${reviewsCount} reviews written`}
            onPress={() => navigateTo("reviews")}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={22} color="#8F796F" />
              </View>
              <Text style={styles.menuItemTitle}>Push Notifications</Text>
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  sectionCount: {
    fontSize: 13,
    color: "#8F796F",
  },
  sectionLink: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
  },
  sectionLoader: {
    paddingVertical: 20,
  },
  followedShopItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0EB",
  },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  shopAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 2,
  },
  shopDescription: {
    fontSize: 12,
    color: "#8F796F",
  },
  viewAllButton: {
    paddingTop: 12,
    alignItems: "center",
  },
  viewAllButtonText: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 8,
    marginBottom: 8,
  },
  emptyStateLink: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressIcon: {
    width: 32,
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
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
  addressLabel: {
    backgroundColor: "#F5F0EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  addressLabelText: {
    fontSize: 10,
    color: "#8F796F",
  },
  addAddressItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  addAddressText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
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