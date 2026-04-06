// app/(seller)/profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SellerData {
  fullName: string;
  email: string;
  phone: string;
  storeName: string;
  description?: string;
  location?: string;
  avatar?: string;
  joinDate?: string;
}

export default function SellerProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sellerData, setSellerData] = useState<SellerData | null>(null);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in');
        router.push('/auth/login');
        return;
      }

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get seller data from 'sellers' collection
        const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
        const sellerDataFromDb = sellerDoc.exists() ? sellerDoc.data() : {};

        // Format join date
        let formattedJoinDate = 'Recently';
        if (userData.createdAt) {
          try {
            const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
            formattedJoinDate = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          } catch (e) {
            formattedJoinDate = 'Recently';
          }
        }

        setSellerData({
          fullName: userData.fullName || '',
          email: user.email || '',
          phone: userData.phone || '',
          storeName: sellerDataFromDb.storeName || userData.storeName || 'My Store',
          description: sellerDataFromDb.storeDescription || 'No description yet',
          location: sellerDataFromDb.location || 'Not set',
          avatar: sellerDataFromDb.avatar || null,
          joinDate: formattedJoinDate,
        });
      }
    } catch (error) {
      console.error('Error loading seller data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Load seller data when screen opens
  useEffect(() => {
    loadSellerData();
  }, []);

  // Refresh when screen comes into focus (after editing)
  useFocusEffect(
    useCallback(() => {
      loadSellerData();
    }, [])
  );

  const handleEditProfile = () => {
    router.push("/(seller)/edit-profile");
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    
    try {
      await auth.signOut();
      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("Error", "Failed to log out. Please try again.");
      setLoggingOut(false);
    }
  };

  const handleViewStore = () => {
    const user = auth.currentUser;
    if (user) {
      router.push(`/store/${user.uid}`);
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

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
              {sellerData?.avatar ? (
                <Image source={{ uri: sellerData.avatar }} style={styles.profileImage} />
              ) : (
                <Ionicons name="storefront-outline" size={40} color="#8F796F" />
              )}
            </View>
            <TouchableOpacity style={styles.cameraButton} onPress={handleEditProfile}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Seller Name and Email */}
          <Text style={styles.sellerName}>{sellerData?.fullName || 'Seller Name'}</Text>
          <Text style={styles.sellerEmail}>{sellerData?.email || 'email@example.com'}</Text>

          {/* View Store Button */}
          <TouchableOpacity style={styles.viewStoreButton} onPress={handleViewStore}>
            <Ionicons name="storefront-outline" size={16} color="#C35822" />
            <Text style={styles.viewStoreText}>View My Store</Text>
          </TouchableOpacity>

          {/* Store Details */}
          <View style={styles.detailsContainer}>
            {/* Store Name */}
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={18} color="#8F796F" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Store Name</Text>
                <Text style={styles.detailValue}>{sellerData?.storeName || 'Not set'}</Text>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={18} color="#8F796F" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{sellerData?.phone || 'Not set'}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={18} color="#8F796F" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{sellerData?.description || 'No description'}</Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color="#8F796F" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{sellerData?.location || 'Not set'}</Text>
              </View>
            </View>

            {/* Member Since */}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color="#8F796F" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Member Since</Text>
                <Text style={styles.detailValue}>{sellerData?.joinDate || 'Recently'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <MenuItem
            icon="cube-outline"
            title="My Products"
            subtitle="Manage your products"
            onPress={() => router.push("/(seller)/products")}
          />

          <MenuItem
            icon="receipt-outline"
            title="Orders"
            subtitle="View customer orders"
            onPress={() => router.push("/(seller)/orders")}
          />

          <MenuItem
            icon="bar-chart-outline"
            title="Dashboard"
            subtitle="Sales and analytics"
            onPress={() => router.push("/(seller)/dashboard")}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Notifications Toggle - Only preference */}
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

          {/* Settings Menu Item - Opens Settings Page */}
          <MenuItem
            icon="settings-outline"
            title="Settings"
            subtitle="App preferences"
            onPress={() => router.push("/(seller)/settings")}
          />

          {/* Help & Support Menu Item - Opens Help & Support Page */}
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQs and support"
            onPress={() => router.push("/(seller)/help-support")}
          />
        </View>

        {/* Log Out Button - Red outline like customer side */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    overflow: "hidden",
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  sellerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    textAlign: "center",
    marginBottom: 4,
  },
  sellerEmail: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 12,
  },
  viewStoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBF8F4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  viewStoreText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 2,
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