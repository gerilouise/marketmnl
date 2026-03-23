// app/(tabs)/profile.tsx
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface FollowedShop {
  id: string;
  storeName: string;
  storeImage?: string;
}

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [followedShops, setFollowedShops] = useState<FollowedShop[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const { profile, addresses, loading, fetchProfile, fetchAddresses } = useFirebaseProfile();
  const { logout } = useFirebaseAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      loadFollowedShops();
    }
  }, [auth.currentUser]);

  const loadData = async () => {
    await fetchProfile();
    await fetchAddresses();
  };

  const loadFollowedShops = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoadingFollowed(true);
    try {
      const followsRef = collection(db, 'follows');
      const q = query(followsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const shops: FollowedShop[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const followData = docSnapshot.data();
        const shopId = followData.shopId;
        
        const storeRef = doc(db, 'stores', shopId);
        const storeSnap = await getDoc(storeRef);
        
        if (storeSnap.exists()) {
          const storeData = storeSnap.data();
          shops.push({
            id: shopId,
            storeName: storeData.storeName || "Unknown Store",
            storeImage: storeData.imageUrl,
          });
        }
      }
      
      setFollowedShops(shops);
    } catch (error) {
      console.error('Error loading followed shops:', error);
    } finally {
      setLoadingFollowed(false);
    }
  };

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
            {profile?.photoURL ? (
              <Image
                source={{ uri: profile.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#8F796F" />
              </View>
            )}
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

        {/* Following Section - Added from second code */}
        <View style={styles.followingSection}>
          <View style={styles.followingHeader}>
            <View style={styles.followingHeaderLeft}>
              <Ionicons name="heart-outline" size={20} color="#C35822" />
              <Text style={styles.followingTitle}>Following</Text>
              <Text style={styles.followingCount}>{followedShops.length} shops</Text>
            </View>
          </View>

          {loadingFollowed ? (
            <View style={styles.loadingFollowedContainer}>
              <ActivityIndicator size="small" color="#C35822" />
            </View>
          ) : followedShops.length > 0 ? (
            <View>
              {followedShops.slice(0, 3).map((shop) => (
                <TouchableOpacity 
                  key={shop.id}
                  style={styles.followedShopItem}
                  onPress={() => navigateToStore(shop.id)}
                >
                  {shop.storeImage ? (
                    <Image source={{ uri: shop.storeImage }} style={styles.shopAvatar} />
                  ) : (
                    <View style={styles.shopAvatarPlaceholder}>
                      <Ionicons name="storefront-outline" size={24} color="#8F796F" />
                    </View>
                  )}
                  
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{shop.storeName}</Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#8F796F" />
                </TouchableOpacity>
              ))}
              
              {followedShops.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => Alert.alert("Following", `You follow ${followedShops.length} shops. View all feature coming soon!`)}
                >
                  <Text style={styles.viewMoreText}>
                    View {followedShops.length - 3} more {followedShops.length - 3 === 1 ? 'shop' : 'shops'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyFollowing}>
              <Ionicons name="heart-outline" size={32} color="#E0DAD1" />
              <Text style={styles.emptyFollowingText}>
                You're not following any shops yet
              </Text>
              <TouchableOpacity 
                style={styles.browseShopsButton}
                onPress={() => router.push("/(tabs)/browse")}
              >
                <Text style={styles.browseShopsText}>Browse Shops</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Default Address Section */}
        {defaultAddress ? (
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
        ) : (
          <TouchableOpacity
            style={styles.noAddressCard}
            onPress={() => navigateTo("addresses")}
          >
            <Ionicons name="location-outline" size={32} color="#C35822" />
            <Text style={styles.noAddressTitle}>No Address Added Yet</Text>
            <Text style={styles.noAddressText}>
              Add your first shipping address to start ordering
            </Text>
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => router.push("/(tabs)/add-address")}
            >
              <Text style={styles.addAddressButtonText}>Add Address</Text>
            </TouchableOpacity>
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
            subtitle={`${addresses?.length || 0} saved addresses`}
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#C35822",
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
  // Following Section Styles
  followingSection: {
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
  followingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  followingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  followingCount: {
    fontSize: 12,
    color: "#8F796F",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  followedShopItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
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
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#32221B",
  },
  viewMoreButton: {
    paddingTop: 12,
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
  },
  loadingFollowedContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyFollowing: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyFollowingText: {
    fontSize: 13,
    color: "#8F796F",
    marginTop: 8,
  },
  browseShopsButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  browseShopsText: {
    fontSize: 13,
    color: "#C35822",
    fontWeight: "500",
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
  noAddressCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  noAddressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginTop: 12,
    marginBottom: 4,
  },
  noAddressText: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 16,
  },
  addAddressButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  addAddressButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
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