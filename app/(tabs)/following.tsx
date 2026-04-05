// app/(tabs)/following.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const GRID_GAP = 12;
const GRID_ITEM_WIDTH = (width - 40 - GRID_GAP) / GRID_COLUMNS;

interface FollowedShop {
  id: string;
  storeName: string;
  storeImage?: string;
  description?: string;
  productCount?: number;
  followerCount?: number;
  rating?: number;
}

export default function FollowingScreen() {
  const [followedShops, setFollowedShops] = useState<FollowedShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewLayout, setViewLayout] = useState<"list" | "grid">("list");

  // Load saved layout preference
  useEffect(() => {
    loadLayoutPreference();
  }, []);

  const loadLayoutPreference = async () => {
    try {
      const savedLayout = await AsyncStorage.getItem('following_layout');
      if (savedLayout === 'grid' || savedLayout === 'list') {
        setViewLayout(savedLayout);
      }
    } catch (error) {
      console.error('Error loading layout preference:', error);
    }
  };

  const saveLayoutPreference = async (layout: "list" | "grid") => {
    try {
      await AsyncStorage.setItem('following_layout', layout);
    } catch (error) {
      console.error('Error saving layout preference:', error);
    }
  };

  const toggleLayout = () => {
    const newLayout = viewLayout === "list" ? "grid" : "list";
    setViewLayout(newLayout);
    saveLayoutPreference(newLayout);
  };

  const loadFollowedShops = async () => {
    const user = auth.currentUser;
    if (!user) {
      setFollowedShops([]);
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
        
        const sellerRef = doc(db, 'sellers', shopId);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          
          const productsRef = collection(db, 'products');
          const productsQuery = query(productsRef, where('sellerId', '==', shopId));
          const productsSnapshot = await getDocs(productsQuery);
          const productCount = productsSnapshot.size;
          
          shops.push({
            id: shopId,
            storeName: sellerData.storeName || "Market Seller",
            storeImage: sellerData.avatar || sellerData.imageUrl,
            description: sellerData.storeDescription || sellerData.description,
            productCount: productCount,
            rating: sellerData.rating || 4.5,
          });
        }
      }
      
      setFollowedShops(shops);
    } catch (error) {
      console.error('Error loading followed shops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time listener for follows
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setFollowedShops([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
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
            
            const productsRef = collection(db, 'products');
            const productsQuery = query(productsRef, where('sellerId', '==', shopId));
            const productsSnapshot = await getDocs(productsQuery);
            const productCount = productsSnapshot.size;
            
            shops.push({
              id: shopId,
              storeName: sellerData.storeName || "Market Seller",
              storeImage: sellerData.avatar || sellerData.imageUrl,
              description: sellerData.storeDescription || sellerData.description,
              productCount: productCount,
              rating: sellerData.rating || 4.5,
            });
          }
        }
        
        setFollowedShops(shops);
        setLoading(false);
      }, (error) => {
        console.error('Error in real-time listener:', error);
        setLoading(false);
      });
      
      return () => unsubscribe();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFollowedShops();
  };

  const navigateToStore = (storeId: string) => {
    router.push(`/store/${storeId}`);
  };

  // List View Renderer
  const renderListItem = ({ item }: { item: FollowedShop }) => (
    <TouchableOpacity 
      style={styles.listCard}
      onPress={() => navigateToStore(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.listImageContainer}>
        {item.storeImage ? (
          <Image source={{ uri: item.storeImage }} style={styles.listImage} />
        ) : (
          <View style={styles.listImagePlaceholder}>
            <Ionicons name="storefront-outline" size={28} color="#C35822" />
          </View>
        )}
      </View>
      
      <View style={styles.listInfo}>
        <Text style={styles.listName} numberOfLines={1}>{item.storeName}</Text>
        
        {item.description && (
          <Text style={styles.listDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.listStats}>
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={12} color="#8F796F" />
            <Text style={styles.statText}>{item.productCount || 0} products</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.statText}>{item.rating?.toFixed(1) || "4.5"}</Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#C0B7AE" />
    </TouchableOpacity>
  );

  // Grid View Renderer
  const renderGridItem = ({ item }: { item: FollowedShop }) => (
    <TouchableOpacity 
      style={styles.gridCard}
      onPress={() => navigateToStore(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.gridImageContainer}>
        {item.storeImage ? (
          <Image source={{ uri: item.storeImage }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Ionicons name="storefront-outline" size={32} color="#C35822" />
          </View>
        )}
      </View>
      
      <Text style={styles.gridName} numberOfLines={1}>{item.storeName}</Text>
      
      <View style={styles.gridStats}>
        <View style={styles.statItem}>
          <Ionicons name="cube-outline" size={10} color="#8F796F" />
          <Text style={styles.gridStatText}>{item.productCount || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={10} color="#FFD700" />
          <Text style={styles.gridStatText}>{item.rating?.toFixed(1) || "4.5"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
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
          <Text style={styles.loadingText}>Loading shops you follow...</Text>
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
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.layoutToggle}
            onPress={toggleLayout}
          >
            <Ionicons 
              name={viewLayout === "list" ? "grid-outline" : "list-outline"} 
              size={22} 
              color="#C35822" 
            />
          </TouchableOpacity>
          <View style={styles.shopCountBadge}>
            <Text style={styles.shopCountText}>{followedShops.length}</Text>
          </View>
        </View>
      </View>

      {followedShops.length > 0 ? (
        viewLayout === "list" ? (
          <FlatList
            key="list-view"
            data={followedShops}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#C35822"]}
                tintColor="#C35822"
              />
            }
          />
        ) : (
          <FlatList
            key="grid-view"
            data={followedShops}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMNS}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#C35822"]}
                tintColor="#C35822"
              />
            }
            ListFooterComponent={<View style={{ height: 20 }} />}
          />
        )
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="heart-outline" size={60} color="#C35822" />
          </View>
          <Text style={styles.emptyTitle}>No shops followed yet</Text>
          <Text style={styles.emptyText}>
            Follow your favorite shops to see their products and updates here
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => {
              router.back();
              router.push("/(tabs)/browse?viewMode=shops");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront-outline" size={20} color="#FFF" />
            <Text style={styles.browseButtonText}>Discover Shops</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FBF8F4",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#32221B",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  layoutToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  shopCountBadge: {
    backgroundColor: "#C35822",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 32,
    alignItems: "center",
  },
  shopCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8F796F",
  },
  // List View Styles
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listImageContainer: {
    marginRight: 14,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  listImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 13,
    color: "#8F796F",
    lineHeight: 18,
    marginBottom: 6,
  },
  listStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // Grid View Styles
  gridContent: {
    padding: 12,
    paddingBottom: 20,
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gridImageContainer: {
    marginBottom: 10,
  },
  gridImage: {
    width: GRID_ITEM_WIDTH - 24,
    height: GRID_ITEM_WIDTH - 24,
    borderRadius: 12,
  },
  gridImagePlaceholder: {
    width: GRID_ITEM_WIDTH - 24,
    height: GRID_ITEM_WIDTH - 24,
    borderRadius: 12,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
  },
  gridName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    textAlign: "center",
    marginBottom: 6,
  },
  gridStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  gridStatText: {
    fontSize: 11,
    color: "#8F796F",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: {
    fontSize: 11,
    color: "#8F796F",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  browseButton: {
    backgroundColor: "#C35822",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 10,
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});