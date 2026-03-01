// app/(tabs)/browse.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const PRODUCTS = Array.from({ length: 48 }).map((_, i) => ({
  id: i.toString(),
  name: ["Spicy Tuyo", "Spicy Bangus", "Spicy Tinapa", "Original Tapa"][i % 4],
  price: 250,
  priceDisplay: "₱250",
  rating: 4.9,
  category: ["Bottled", "Dried"][i % 2],
}));

const FILTERS = ["All Products", "Bottled"];

export default function BrowseScreen() {
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Handle category from home screen
  useEffect(() => {
    if (params.category) {
      setSelectedFilter(params.category as string);
    }
  }, [params.category]);

  // Filter products based on selected filter and search query
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesFilter = selectedFilter === "All Products" || product.category === selectedFilter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort products based on sort order
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.price - b.price;
    } else {
      return b.price - a.price;
    }
  });

  const toggleSort = () => {
    setShowSortOptions(!showSortOptions);
  };

  const selectSortOrder = (order) => {
    setSortOrder(order);
    setShowSortOptions(false);
  };

  const navigateToProduct = (productId) => {
    router.push(`/product/${productId}`);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigateToProduct(item.id)}
    >
      {/* Image Placeholder */}
      <View style={styles.imagePlaceholder}>
        <Ionicons name="image-outline" size={30} color="#CCC" />
      </View>

      {/* Wishlist icon */}
      <TouchableOpacity 
        style={styles.heartButton}
        onPress={(e) => {
          e.stopPropagation();
          console.log('Toggle wishlist:', item.id);
        }}
      >
        <Ionicons name="heart-outline" size={20} color="#8F796F" />
      </TouchableOpacity>

      <Text style={styles.title}>{item.name}</Text>

      <View style={styles.row}>
        <Text style={styles.price}>{item.priceDisplay}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar with Icon */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#8F796F" style={styles.searchIcon} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#8F796F"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Sort Button */}
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Ionicons name="options-outline" size={20} color="#32221B" />
        </TouchableOpacity>
      </View>

      {/* Sort Options Dropdown */}
      {showSortOptions && (
        <View style={styles.sortDropdown}>
          <TouchableOpacity 
            style={[styles.sortOption, sortOrder === 'asc' && styles.sortOptionActive]} 
            onPress={() => selectSortOrder('asc')}
          >
            <Text style={[styles.sortOptionText, sortOrder === 'asc' && styles.sortOptionTextActive]}>
              Price: Low to High
            </Text>
            {sortOrder === 'asc' && <Ionicons name="checkmark" size={18} color="#C35822" />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortOption, sortOrder === 'desc' && styles.sortOptionActive]} 
            onPress={() => selectSortOrder('desc')}
          >
            <Text style={[styles.sortOptionText, sortOrder === 'desc' && styles.sortOptionTextActive]}>
              Price: High to Low
            </Text>
            {sortOrder === 'desc' && <Ionicons name="checkmark" size={18} color="#C35822" />}
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product Count */}
      <Text style={styles.count}>
        Showing {sortedProducts.length} products
      </Text>

      {/* Product Grid */}
      <FlatList
        data={sortedProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF7F2",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 8,
    position: 'relative',
    zIndex: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0DAD1",
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#32221B',
    paddingVertical: 10,
  },
  sortButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0DAD1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sortDropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DAD1',
    padding: 8,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: 180,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: '#FBF7F2',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#32221B',
  },
  sortOptionTextActive: {
    color: '#C35822',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#E6E0DA",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#32221B",
  },
  filterText: {
    fontSize: 13,
    color: "#32221B",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  count: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    width: "48%",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  heartButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: '#32221B',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBF7F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  rating: {
    fontSize: 12,
    color: "#666",
    marginLeft: 2,
  },
});