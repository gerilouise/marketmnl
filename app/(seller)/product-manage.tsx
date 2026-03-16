import { useFirebaseProducts } from "@/hooks/useFirebaseProducts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SellerProductsManageScreen() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Dried");
  const [stock, setStock] = useState("");

  const { products, loading, addProduct, deleteProduct, fetchProducts } =
    useFirebaseProducts();

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    if (!name || !price || !stock) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const newProduct = {
      name,
      description: description || `${name} - Authentic Filipino delicacy`,
      price: parseFloat(price),
      category,
      stockQuantity: parseInt(stock),
      imageUrl: null,
      sellerId: "", // Will be set by the hook
    };

    const success = await addProduct(newProduct);
    if (success) {
      setShowAddForm(false);
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      await fetchProducts();
    }
  };

  const handleGoBack = () => {
    router.push("/(seller)/products");
  };

  const renderProduct = ({ item }: any) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₱{item.price}</Text>
        <Text style={styles.productStock}>Stock: {item.stockQuantity}</Text>
        <Text style={styles.productCategory}>Category: {item.category}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert("Edit", "Edit feature coming soon")}
        >
          <Ionicons name="create-outline" size={20} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert("Delete Product", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", onPress: () => deleteProduct(item.id) },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Products</Text>
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
          <Ionicons
            name={showAddForm ? "close-circle" : "add-circle"}
            size={28}
            color="#C35822"
          />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add New Product</Text>

          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Stock Quantity"
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
          />

          <View style={styles.categoryRow}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                category === "Dried" && styles.categoryActive,
              ]}
              onPress={() => setCategory("Dried")}
            >
              <Text
                style={
                  category === "Dried"
                    ? styles.categoryTextActive
                    : styles.categoryText
                }
              >
                Dried
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                category === "Bottled" && styles.categoryActive,
              ]}
              onPress={() => setCategory("Bottled")}
            >
              <Text
                style={
                  category === "Bottled"
                    ? styles.categoryTextActive
                    : styles.categoryText
                }
              >
                Bottled
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddProduct}
          >
            <Text style={styles.saveButtonText}>Save Product</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#C35822" style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={60} color="#E0DAD1" />
              <Text style={styles.emptyText}>No products yet</Text>
            </View>
          }
        />
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
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
  },
  formContainer: {
    backgroundColor: "#FFF",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#F5F0EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F5F0EB",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  categoryActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  categoryText: {
    color: "#8F796F",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#C35822",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginTop: 50,
  },
  list: {
    padding: 20,
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "600",
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: "#8F796F",
  },
  productCategory: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#8F796F",
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    padding: 8,
    borderRadius: 6,
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
