// app/(seller)/product-manage.tsx
import { auth, db } from '@/lib/firebase';
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

const CATEGORIES = ["Specials", "Spicy", "Seafood", "Meat", "Bottled", "Dried"];

export default function SellerProductsManageScreen() {
  const { productId } = useLocalSearchParams();
  const isEditing = !!productId;
  
  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Bottled");
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [origin, setOrigin] = useState("");
  const [culturalBackground, setCulturalBackground] = useState("");
  const [storage, setStorage] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset form function
  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("Bottled");
    setStock("");
    setWeight("");
    setOrigin("");
    setCulturalBackground("");
    setStorage("");
    setShelfLife("");
    setImage(null);
    setOriginalImage(null);
  };

  // Load product data if editing
  useEffect(() => {
    if (isEditing && productId) {
      loadProductData();
    } else {
      resetForm(); // Reset form when adding new product
    }
  }, [productId, isEditing]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const productRef = doc(db, 'products', productId as string);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const product = productSnap.data();
        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(product.price?.toString() || "");
        setCategory(product.category || "Bottled");
        setStock(product.stockQuantity?.toString() || "");
        setWeight(product.netWeight || "");
        setOrigin(product.origin || "");
        setCulturalBackground(product.culturalBackground || "");
        setStorage(product.storage || "");
        setShelfLife(product.shelfLife || "");
        setImage(product.imageUrl || null);
        setOriginalImage(product.imageUrl || null);
      } else {
        Alert.alert("Error", "Product not found");
        router.replace("/(seller)/products");
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product data');
      router.replace("/(seller)/products");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    // Go directly to products page
    router.replace("/(seller)/products");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permissions to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Upload Image",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const filename = `products/${auth.currentUser?.uid}/${Date.now()}.jpg`;
      const imageRef = ref(storage, filename);
      
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!name || !price || !stock || !weight) {
      Alert.alert("Error", "Please fill in all required fields");
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

      // Upload image if selected and changed
      let imageUrl = originalImage;
      if (image && image !== originalImage) {
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const now = Timestamp.now();

      const productData = {
        name: name.trim(),
        description: description.trim() || `${name} - Authentic Filipino delicacy`,
        price: parseFloat(price),
        category,
        stockQuantity: parseInt(stock),
        netWeight: weight.trim(),
        imageUrl: imageUrl || null,
        origin: origin.trim() || null,
        culturalBackground: culturalBackground.trim() || null,
        storage: storage.trim() || null,
        shelfLife: shelfLife.trim() || null,
        sellerId: user.uid,
        createdAt: now,
        updatedAt: now,
      };

      console.log('Saving product:', productData);

      if (isEditing) {
        const productRef = doc(db, 'products', productId as string);
        await updateDoc(productRef, {
          ...productData,
          updatedAt: Timestamp.now(),
        });
        Alert.alert("Success", "Product updated successfully!");
      } else {
        const productsRef = collection(db, 'products');
        await addDoc(productsRef, productData);
        Alert.alert("Success", "Product added successfully!");
      }
      
      // Navigate directly to products page
      router.replace("/(seller)/products");
      
    } catch (error) {
      console.error('Error saving product:', error);
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
          <View style={styles.imageSection}>
            <Text style={styles.label}>Product Image</Text>
            <TouchableOpacity 
              style={styles.imageUploader} 
              onPress={showImageOptions}
              disabled={submitting}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#8F796F" />
                  <Text style={styles.imageUploadText}>Upload Image</Text>
                </View>
              )}
            </TouchableOpacity>
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#C35822" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.label}>Price (₱) <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.label}>Stock <Text style={styles.required}>*</Text></Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Net Weight <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 250g"
                placeholderTextColor="#8F796F"
                value={weight}
                onChangeText={setWeight}
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive
                  ]}
                  onPress={() => setCategory(cat)}
                  disabled={submitting}
                >
                  <Text style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
            
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
              <Text style={styles.label}>Storage Instructions</Text>
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
              <Text style={styles.label}>Shelf Life</Text>
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
    fontSize: 14,
    color: "#8F796F",
    marginTop: 8,
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
  bottomPadding: {
    height: 20,
  },
});