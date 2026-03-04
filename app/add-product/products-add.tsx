// app/(seller)/products-add.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const CATEGORIES = ["All", "Specials", "Seafood", "Meat", "Bottled", "Dried"];

export default function AddProductScreen() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState(""); // NEW FIELD

  // Recipe fields
  const [recipes, setRecipes] = useState([
    { id: Date.now().toString(), name: "", description: "", prepTime: "", difficulty: "Easy" }
  ]);

  const addRecipe = () => {
    setRecipes([
      ...recipes,
      { id: Date.now().toString(), name: "", description: "", prepTime: "", difficulty: "Easy" }
    ]);
  };

  const updateRecipe = (id: string, field: string, value: string) => {
    setRecipes(recipes.map(recipe => 
      recipe.id === id ? { ...recipe, [field]: value } : recipe
    ));
  };

  const removeRecipe = (id: string) => {
    if (recipes.length > 1) {
      setRecipes(recipes.filter(recipe => recipe.id !== id));
    } else {
      Alert.alert("Error", "You need at least one recipe");
    }
  };

  const handleSaveProduct = () => {
    // Validate fields
    if (!productName || !description || !price || !stock || !weight) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    Alert.alert(
      "Success",
      "Product added successfully!",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <TouchableOpacity onPress={handleSaveProduct} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Product Image */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Product Image</Text>
          <TouchableOpacity style={styles.imageUploader}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#8F796F" />
              <Text style={styles.imageUploadText}>Upload Image</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Product Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Authentic Bottled Spicy Tuyo"
              placeholderTextColor="#8F796F"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Bottled Spicy Tuyo"
              placeholderTextColor="#8F796F"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price (₱) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="250.00"
                placeholderTextColor="#8F796F"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Stock <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor="#8F796F"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Net Weight <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 250g"
                placeholderTextColor="#8F796F"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            {/* NEW: Calories Field - maintaining same style */}
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Calories (kcal)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 350"
                placeholderTextColor="#8F796F"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* NEW: Recipes Section - maintaining your design */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipes</Text>
          
          {recipes.map((recipe, index) => (
            <View key={recipe.id} style={styles.recipeContainer}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>Recipe {index + 1}</Text>
                {recipes.length > 1 && (
                  <TouchableOpacity onPress={() => removeRecipe(recipe.id)}>
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
                  onChangeText={(text) => updateRecipe(recipe.id, "name", text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Brief description of the recipe"
                  placeholderTextColor="#8F796F"
                  value={recipe.description}
                  onChangeText={(text) => updateRecipe(recipe.id, "description", text)}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Prep Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 15 mins"
                    placeholderTextColor="#8F796F"
                    value={recipe.prepTime}
                    onChangeText={(text) => updateRecipe(recipe.id, "prepTime", text)}
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
                          recipe.difficulty === level && styles.difficultyChipActive
                        ]}
                        onPress={() => updateRecipe(recipe.id, "difficulty", level)}
                      >
                        <Text style={[
                          styles.difficultyChipText,
                          recipe.difficulty === level && styles.difficultyChipTextActive
                        ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Add Recipe Button - maintaining your button style */}
          <TouchableOpacity style={styles.addRecipeButton} onPress={addRecipe}>
            <Ionicons name="add-circle-outline" size={20} color="#C35822" />
            <Text style={styles.addRecipeText}>Add Another Recipe</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Origin</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Cotabato City, Mindanao"
              placeholderTextColor="#8F796F"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cultural Background</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Traditional Maguindanaoan dish..."
              placeholderTextColor="#8F796F"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Storage Instructions</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Keep refrigerated after opening"
              placeholderTextColor="#8F796F"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shelf Life</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 6 months unopened"
              placeholderTextColor="#8F796F"
            />
          </View>
        </View>

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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
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
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
  },
  imageUploader: {
    width: "100%",
    height: 150,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imageUploadText: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 8,
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
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
    marginBottom: 6,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FBF8F4",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    minWidth: 70,
    alignItems: "center",
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
  // NEW STYLES - maintaining your design
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
    height: 30,
  },
});