import { useProducts } from "@/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FILTERS = ["All", "Bottled", "Dried"];

export default function BrowseScreen() {
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const { products, loading, fetchProductsByCategory, searchProducts } =
    useProducts();

  // Handle category from home screen
  useEffect(() => {
    if (params.category) {
      setSelectedFilter(params.category as string);
      fetchProductsByCategory(params.category as string);
    } else {
      fetchProductsByCategory("All");
    }
  }, [params.category]);

  // Handle filter change
  useEffect(() => {
    fetchProductsByCategory(selectedFilter);
  }, [selectedFilter]);

  // Handle search
  useEffect(() => {
    if (searchQuery.length > 2) {
      const delayDebounce = setTimeout(() => {
        searchProducts(searchQuery);
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else if (searchQuery.length === 0) {
      fetchProductsByCategory(selectedFilter);
    }
  }, [searchQuery]);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.price - b.price;
    } else {
      return b.price - a.price;
    }
  });

  const toggleSort = () => {
    setShowSortOptions(!showSortOptions);
  };

  const selectSortOrder = (order: string) => {
    setSortOrder(order);
    setShowSortOptions(false);
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigateToProduct(item.id)}
    >
      {/* Image Placeholder */}
      <View style={styles.imagePlaceholder}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <Ionicons name="image-outline" size={30} color="#CCC" />
        )}
      </View>

      {/* Wishlist icon */}
      <TouchableOpacity
        style={styles.heartButton}
        onPress={(e) => {
          e.stopPropagation();
          console.log("Toggle wishlist:", item.id);
        }}
      >
        <Ionicons name="heart-outline" size={20} color="#8F796F" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {item.name}
      </Text>

      <View style={styles.row}>
        <Text style={styles.price}>₱{item.price}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35822" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar with Icon */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#8F796F"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search products..."
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
            style={[
              styles.sortOption,
              sortOrder === "asc" && styles.sortOptionActive,
            ]}
            onPress={() => selectSortOrder("asc")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortOrder === "asc" && styles.sortOptionTextActive,
              ]}
            >
              Price: Low to High
            </Text>
            {sortOrder === "asc" && (
              <Ionicons name="checkmark" size={18} color="#C35822" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortOrder === "desc" && styles.sortOptionActive,
            ]}
            onPress={() => selectSortOrder("desc")}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortOrder === "desc" && styles.sortOptionTextActive,
              ]}
            >
              Price: High to Low
            </Text>
            {sortOrder === "desc" && (
              <Ionicons name="checkmark" size={18} color="#C35822" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
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
      <Text style={styles.count}>Showing {sortedProducts.length} products</Text>

      {/* Product Grid */}
      <FlatList
        data={sortedProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#E0DAD1" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBF7F2",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8F796F",
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 8,
    position: "relative",
    zIndex: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
    color: "#32221B",
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
    position: "absolute",
    top: 70,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    padding: 8,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: 180,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: "#FBF7F2",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#32221B",
  },
  sortOptionTextActive: {
    color: "#C35822",
    fontWeight: "500",
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
    shadowColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#32221B",
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#8F796F",
    marginTop: 12,
  },
});
