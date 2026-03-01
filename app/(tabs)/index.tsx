// app/(tabs)/index.tsx
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [showChat, setShowChat] = useState(false);
  const [wishlist, setWishlist] = useState({}); // Track wishlist items

  // Sample data for categories
  const categories = [
    { id: '1', name: 'Specials', icon: '🎉' },
    { id: '2', name: 'Spicy', icon: '🌶️' },
    { id: '3', name: 'Seafood', icon: '🦐' },
    { id: '4', name: 'Meat', icon: '🥩' },
  ];

  // Sample data for featured products (without images)
  const featuredProducts = [
    { id: '1', name: 'Spicy Tuyo', price: 250, rating: 4.9 },
    { id: '2', name: 'Spicy Tinapa', price: 250, rating: 4.9 },
    { id: '3', name: 'Spicy Bangus', price: 250, rating: 4.9 },
    { id: '4', name: 'Spicy Tapa', price: 250, rating: 4.9 },
  ];

  // Sample data for new arrivals (without images)
  const newArrivals = [
    { 
      id: '1', 
      name: 'Spicy Bangus', 
      seller: "Jangan's Kitchen", 
      price: 250, 
      rating: 4.9,
    },
    { 
      id: '2', 
      name: 'Spicy Tapa', 
      seller: "Gian's Preserved Food", 
      price: 250, 
      rating: 4.9,
    },
    { 
      id: '3', 
      name: 'Spicy Tuyo', 
      seller: 'Spicy Tuna', 
      price: 250, 
      rating: 4.9,
    },
  ];

  const toggleWishlist = (productId) => {
    setWishlist(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const navigateToProduct = (productId) => {
    router.push(`/product/${productId}`);
  };

  const navigateToCategory = (categoryName) => {
    // Navigate to browse screen with category filter
    router.push({
      pathname: '/browse',
      params: { category: categoryName }
    });
  };

  const navigateToSeeAll = (section) => {
    router.push({
      pathname: '/browse',
      params: { section: section }
    });
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => navigateToCategory(item.name)}
    >
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryIconText}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigateToProduct(item.id)}
    >
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="image-outline" size={30} color="#CCC" />
        {/* Heart icon for wishlist */}
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigation to product
            toggleWishlist(item.id);
          }}
        >
          <Ionicons 
            name={wishlist[item.id] ? "heart" : "heart-outline"} 
            size={20} 
            color={wishlist[item.id] ? "#C35822" : "#8F796F"} 
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
      <View style={styles.productRating}>
        <Ionicons name="star" size={14} color="#FFD700" />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
      <Text style={styles.productPrice}>₱{item.price}</Text>
    </TouchableOpacity>
  );

  const renderNewArrivalItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.newArrivalCard}
      onPress={() => navigateToProduct(item.id)}
    >
      <View style={styles.newArrivalImagePlaceholder}>
        <Ionicons name="image-outline" size={30} color="#CCC" />
      </View>
      <View style={styles.newArrivalInfo}>
        <Text style={styles.newArrivalName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        <Text style={styles.newArrivalSeller} numberOfLines={1} ellipsizeMode="tail">{item.seller}</Text>
        <View style={styles.newArrivalRating}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <Text style={styles.newArrivalPrice}>₱{item.price}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={(e) => {
          e.stopPropagation(); // Prevent navigation to product
          console.log('Add to cart:', item.id);
        }}
      >
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with greeting and separator line */}
        <View>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Magandang Araw,</Text>
              <Text style={styles.userName}>Ryza</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#8F796F" />
            </TouchableOpacity>
          </View>
          <View style={styles.separator} />
        </View>

        {/* Featured Promo Banner with Image */}
        <TouchableOpacity 
          style={styles.promoContainer}
          onPress={() => navigateToSeeAll('promo')}
        >
          <Image 
            source={require('@/assets/images/banner.png')}
            style={styles.promoImage}
            resizeMode="cover"
          />
          <View style={styles.promoOverlay}>
            <Text style={styles.promoTitle}>Featured Promo</Text>
            <Text style={styles.promoDescription}>
              Get 20% off on all delicacies this week!
            </Text>
            <View style={styles.shopNowButton}>
              <Text style={styles.shopNowText}>Shop Now</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity 
            style={styles.seeAllContainer}
            onPress={() => navigateToSeeAll('categories')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#C35822" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Featured Products Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity 
            style={styles.seeAllContainer}
            onPress={() => navigateToSeeAll('featured')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#C35822" />
          </TouchableOpacity>
        </View>

        <View style={styles.featuredContainer}>
          <FlatList
            data={featuredProducts}
            renderItem={renderFeaturedItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>

        {/* New Arrivals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <TouchableOpacity 
            style={styles.seeAllContainer}
            onPress={() => navigateToSeeAll('new')}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#C35822" />
          </TouchableOpacity>
        </View>

        <View style={styles.newArrivalsList}>
          {newArrivals.map((item) => (
            <View key={item.id} style={styles.newArrivalItem}>
              {renderNewArrivalItem({ item })}
            </View>
          ))}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* AI Chatbot Floating Button */}
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => router.push('/chat')}
        activeOpacity={0.8}
      >
        <View style={styles.chatButtonInner}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#FFF" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  greeting: {
    fontSize: 16,
    color: '#8F796F',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#32221B',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0DAD1',
    marginHorizontal: 25,
    marginBottom: 20,
  },
  promoContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 15,
    overflow: 'hidden',
    height: 180,
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  promoOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  promoTitle: {
    color: '#CA8342',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  promoDescription: {
    color: '#CA8342',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    width: '70%',
  },
  shopNowButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  shopNowText: {
    color: '#CA8342',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#32221B',
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#C35822',
    marginRight: 4,
  },
  categoriesContainer: {
    alignItems: 'center',
    marginBottom: 25,
    justifyContent: 'center',
    width: '100%',
  },
  categoriesList: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 10,
    marginLeft: 20,
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
  },
  featuredContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  featuredList: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  productCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    position: 'relative',
  },
  wishlistButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    width: '100%',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C35822',
  },
  newArrivalsList: {
    paddingHorizontal: 20,
  },
  newArrivalItem: {
    marginBottom: 15,
  },
  newArrivalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newArrivalImagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    position: 'relative',
  },
  newArrivalInfo: {
    flex: 1,
  },
  newArrivalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    width: '100%',
  },
  newArrivalSeller: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    width: '100%',
  },
  newArrivalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  newArrivalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C35822',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C35822',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 80,
  },
  // AI Chatbot Floating Button
  chatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 999,
  },
  chatButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C35822',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});