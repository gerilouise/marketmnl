// app/(seller)/product-manage.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = ["Specials", "Spicy", "Seafood", "Meat", "Bottled", "Dried"];

interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: string;
  difficulty: string;
}

export default function SellerProductsManageScreen() {
  const { productId } = useLocalSearchParams();
  const isEditing = !!productId;

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [origin, setOrigin] = useState("");
  const [culturalBackground, setCulturalBackground] = useState("");
  const [storage, setStorage] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: Date.now().toString(),
      name: "",
      description: "",
      prepTime: "",
      difficulty: "Easy",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    console.log("🔵 pickImage called");

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("Picker result:", result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log("Image selected:", result.assets[0].uri);
        setImage(result.assets[0].uri);
        Alert.alert("Success", "Image selected!");
      } else {
        console.log("User cancelled");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Recipe functions
  const addRecipe = () => {
    setRecipes([
      ...recipes,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        prepTime: "",
        difficulty: "Easy",
      },
    ]);
  };

  const updateRecipe = (id: string, field: string, value: string) => {
    setRecipes(
      recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, [field]: value } : recipe,
      ),
    );
  };

  const removeRecipe = (id: string) => {
    if (recipes.length > 1) {
      setRecipes(recipes.filter((recipe) => recipe.id !== id));
    } else {
      Alert.alert("Error", "You need at least one recipe");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setSelectedCategories([]);
    setStock("");
    setWeight("");
    setCalories("");
    setOrigin("");
    setCulturalBackground("");
    setStorage("");
    setShelfLife("");
    setImage(null);
    setOriginalImage(null);
    setRecipes([
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        prepTime: "",
        difficulty: "Easy",
      },
    ]);
  };

  useEffect(() => {
    if (isEditing && productId) {
      loadProductData();
    } else {
      resetForm();
    }
  }, [productId, isEditing]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const productRef = doc(db, "products", productId as string);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const product = productSnap.data();
        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(product.price?.toString() || "");
        // Handle categories (can be string or array)
        if (product.categories && Array.isArray(product.categories)) {
          setSelectedCategories(product.categories);
        } else if (product.category) {
          setSelectedCategories([product.category]);
        } else {
          setSelectedCategories([]);
        }
        setStock(product.stockQuantity?.toString() || "");
        setWeight(product.netWeight || "");
        setCalories(product.calories?.toString() || "");
        setOrigin(product.origin || "");
        setCulturalBackground(product.culturalBackground || "");
        setStorage(product.storage || "");
        setShelfLife(product.shelfLife || "");
        setImage(product.imageUrl || null);
        setOriginalImage(product.imageUrl || null);

        if (
          product.recipes &&
          Array.isArray(product.recipes) &&
          product.recipes.length > 0
        ) {
          const loadedRecipes = product.recipes.map(
            (recipe: any, index: number) => ({
              id: recipe.id || Date.now().toString() + index,
              name: recipe.name || "",
              description: recipe.description || "",
              prepTime: recipe.prepTime || "",
              difficulty: recipe.difficulty || "Easy",
            }),
          );
          setRecipes(loadedRecipes);
        }
      } else {
        Alert.alert("Error", "Product not found");
        router.replace("/(seller)/products");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      Alert.alert("Error", "Failed to load product data");
      router.replace("/(seller)/products");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.replace("/(seller)/products");
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setUploading(true);
      console.log("Starting upload for:", uri);

      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const filename = `product_images/${Date.now()}.jpg`;
      const imageRef = ref(storage, filename);

      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);

      console.log("✅ Image uploaded to:", downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!name || !price || !stock || !weight || !storage || !shelfLife) {
      Alert.alert("Error", "Please fill in all required fields (*)");
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert("Error", "Please select at least one category");
      return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      Alert.alert("Error", "Please enter a valid stock quantity");
      return;
    }

    setSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in");
        router.push("/auth/login");
        return;
      }

      let imageUrl = null;
      if (image) {
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } else if (originalImage) {
        imageUrl = originalImage;
      }

      const now = Timestamp.now();
      const validRecipes = recipes.filter(
        (recipe) => recipe.name.trim() !== "",
      );

      const productData = {
        name: name.trim(),
        description: description.trim() || `${name}`,
        price: parseFloat(price),
        categories: selectedCategories, // Store as array for multiple categories
        category: selectedCategories[0] || "Bottled", // Keep single category for backward compatibility
        stockQuantity: parseInt(stock),
        netWeight: weight.trim(),
        calories: calories ? parseFloat(calories) : null,
        imageUrl: imageUrl,
        origin: origin.trim() || null,
        culturalBackground: culturalBackground.trim() || null,
        storage: storage.trim(),
        shelfLife: shelfLife.trim(),
        recipes: validRecipes.length > 0 ? validRecipes : null,
        sellerId: user.uid,
        sellerName: user.displayName || "MarketMNL Seller",
        createdAt: now,
        updatedAt: now,
      };

      console.log("Saving product with categories:", productData.categories);

      if (isEditing) {
        const productRef = doc(db, "products", productId as string);
        await updateDoc(productRef, {
          ...productData,
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", "Product updated successfully!");
      } else {
        const productsRef = collection(db, "products");
        await addDoc(productsRef, productData);
        Alert.alert("Success", "Product added successfully!");
      }

      router.replace("/(seller)/products");
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Error", "Failed to save product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Product" : "Add Product"}
          </Text>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Product" : "Add Product"}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Upload Section */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Product Image</Text>
            <TouchableOpacity
              style={styles.imageUploader}
              onPress={pickImage}
              activeOpacity={0.7}
              disabled={submitting}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={50} color="#8F796F" />
                  <Text style={styles.imageUploadText}>Tap to add image</Text>
                  <Text style={styles.imageUploadSubText}>
                    Select from gallery
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#C35822" />
                <Text style={styles.uploadingText}>Uploading image...</Text>
              </View>
            )}
            {image && !uploading && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImage(null);
                  console.log("Image removed");
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={styles.removeImageText}>Remove Image</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Product Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Product Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Authentic Bottled Spicy Tuyo"
                placeholderTextColor="#8F796F"
                value={name}
                onChangeText={setName}
                editable={!submitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your product"
                placeholderTextColor="#8F796F"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>
                  Price (₱) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="250.00"
                  placeholderTextColor="#8F796F"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  editable={!submitting}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>
                  Stock <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  placeholderTextColor="#8F796F"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>
                  Net Weight <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 250g"
                  placeholderTextColor="#8F796F"
                  value={weight}
                  onChangeText={setWeight}
                  editable={!submitting}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Calories (kcal)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 350"
                  placeholderTextColor="#8F796F"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  editable={!submitting}
                />
              </View>
            </View>
          </View>

          {/* Categories - Multi-select */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Categories <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.hintText}>Select one or more categories</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(cat) && styles.categoryChipActive,
                  ]}
                  onPress={() => toggleCategory(cat)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategories.includes(cat) && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                  {selectedCategories.includes(cat) && (
                    <Ionicons name="checkmark" size={14} color="#FFF" style={styles.categoryCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {selectedCategories.length > 0 && (
              <Text style={styles.selectedCount}>
                Selected: {selectedCategories.length} category(ies)
              </Text>
            )}
          </View>

          {/* Recipes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipes</Text>

            {recipes.map((recipe, index) => (
              <View key={recipe.id} style={styles.recipeContainer}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>Recipe {index + 1}</Text>
                  {recipes.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeRecipe(recipe.id)}
                      disabled={submitting}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Recipe Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Spicy Tuyo Fried Rice"
                    placeholderTextColor="#8F796F"
                    value={recipe.name}
                    onChangeText={(text) =>
                      updateRecipe(recipe.id, "name", text)
                    }
                    editable={!submitting}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Brief description of the recipe"
                    placeholderTextColor="#8F796F"
                    value={recipe.description}
                    onChangeText={(text) =>
                      updateRecipe(recipe.id, "description", text)
                    }
                    multiline
                    numberOfLines={2}
                    editable={!submitting}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                  >
                    <Text style={styles.label}>Prep Time</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 15 mins"
                      placeholderTextColor="#8F796F"
                      value={recipe.prepTime}
                      onChangeText={(text) =>
                        updateRecipe(recipe.id, "prepTime", text)
                      }
                      editable={!submitting}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Difficulty</Text>
                    <View style={styles.difficultyContainer}>
                      {["Easy", "Medium", "Hard"].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.difficultyChip,
                            recipe.difficulty === level &&
                              styles.difficultyChipActive,
                          ]}
                          onPress={() =>
                            updateRecipe(recipe.id, "difficulty", level)
                          }
                          disabled={submitting}
                        >
                          <Text
                            style={[
                              styles.difficultyChipText,
                              recipe.difficulty === level &&
                                styles.difficultyChipTextActive,
                            ]}
                          >
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addRecipeButton}
              onPress={addRecipe}
              disabled={submitting}
            >
              <Ionicons name="add-circle-outline" size={20} color="#C35822" />
              <Text style={styles.addRecipeText}>Add Another Recipe</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Origin</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Cotabato City, Mindanao"
                placeholderTextColor="#8F796F"
                value={origin}
                onChangeText={setOrigin}
                editable={!submitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cultural Background</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Traditional Maguindanaoan dish..."
                placeholderTextColor="#8F796F"
                value={culturalBackground}
                onChangeText={setCulturalBackground}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Storage Instructions <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Keep refrigerated after opening"
                placeholderTextColor="#8F796F"
                value={storage}
                onChangeText={setStorage}
                editable={!submitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Shelf Life <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 6 months unopened"
                placeholderTextColor="#8F796F"
                value={shelfLife}
                onChangeText={setShelfLife}
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#C35822",
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#FFB6A5",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 12,
  },
  imageUploader: {
    width: "100%",
    height: 180,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageUploadText: {
    fontSize: 16,
    color: "#8F796F",
    marginTop: 12,
    fontWeight: "500",
  },
  imageUploadSubText: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 4,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: "#8F796F",
  },
  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 4,
  },
  removeImageText: {
    fontSize: 12,
    color: "#FF3B30",
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: "row",
    marginBottom: 8,
  },
  required: {
    color: "#C35822",
  },
  input: {
    backgroundColor: "#FBF8F4",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FBF8F4",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#8F796F",
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  categoryCheck: {
    marginLeft: 2,
  },
  selectedCount: {
    fontSize: 12,
    color: "#C35822",
    marginTop: 8,
  },
  recipeContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  difficultyChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#FBF8F4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    alignItems: "center",
  },
  difficultyChipActive: {
    backgroundColor: "#C35822",
    borderColor: "#C35822",
  },
  difficultyChipText: {
    fontSize: 12,
    color: "#8F796F",
    fontWeight: "500",
  },
  difficultyChipTextActive: {
    color: "#FFF",
  },
  addRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#C35822",
    borderRadius: 10,
    borderStyle: "dashed",
    gap: 6,
  },
  addRecipeText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  bottomPadding: {
    height: 20,
  },
});