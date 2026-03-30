// app/(tabs)/following.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface FollowedShop {
  id: string;
  storeName: string;
  storeImage?: string;
  description?: string;
}

export default function FollowingScreen() {
  const [followedShops, setFollowedShops] = useState<FollowedShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowedShops();
  }, []);

  const loadFollowedShops = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const followsRef = collection(db, 'follows');
      const q = query(followsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const shops: FollowedShop[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const followData = docSnapshot.data();
        const shopId = followData.shopId;
        
        // Try to get shop from sellers collection
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
        } else {
          // Check stores collection as fallback
          const storeRef = doc(db, 'stores', shopId);
          const storeSnap = await getDoc(storeRef);
          
          if (storeSnap.exists()) {
            const storeData = storeSnap.data();
            shops.push({
              id: shopId,
              storeName: storeData.storeName || "Market Store",
              storeImage: storeData.imageUrl,
              description: storeData.description,
            });
          }
        }
      }
      
      setFollowedShops(shops);
    } catch (error) {
      console.error('Error loading followed shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToStore = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  const renderShopItem = ({ item }: { item: FollowedShop }) => (
    <TouchableOpacity 
      style={styles.shopCard}
      onPress={() => navigateToStore(item.id)}
    >
      <View style={styles.shopImageContainer}>
        {item.storeImage ? (
          <Image source={{ uri: item.storeImage }} style={styles.shopImage} />
        ) : (
          <View style={styles.shopImagePlaceholder}>
            <Ionicons name="storefront-outline" size={32} color="#8F796F" />
          </View>
        )}
      </View>
      
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.storeName}</Text>
        {item.description && (
          <Text style={styles.shopDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#8F796F" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Following</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Following</Text>
        <Text style={styles.shopCount}>{followedShops.length} shops</Text>
      </View>

      {followedShops.length > 0 ? (
        <FlatList
          data={followedShops}
          renderItem={renderShopItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={60} color="#E0DAD1" />
          <Text style={styles.emptyTitle}>No shops followed yet</Text>
          <Text style={styles.emptyText}>
            Follow your favorite shops to see their products and updates
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => {
              router.back();
              router.push("/(tabs)/browse");
            }}
          >
            <Text style={styles.browseButtonText}>Browse Shops</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  shopCount: {
    fontSize: 12,
    color: "#8F796F",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shopImageContainer: {
    marginRight: 12,
  },
  shopImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  shopImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  shopDescription: {
    fontSize: 13,
    color: "#8F796F",
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});