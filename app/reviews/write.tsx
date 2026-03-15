import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import StarRating from 'react-native-star-rating-widget';

export default function WriteReviewScreen() {
  const { productId, productName } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Error", "Please write a review");
      return;
    }

    // TODO: Save to database
    Alert.alert(
      "Success",
      "Your review has been submitted",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );
  };

  const addImage = () => {
    // TODO: Implement image picker
    Alert.alert("Coming Soon", "Image upload will be available soon");
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Product Info */}
        <View style={styles.productCard}>
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={30} color="#CCC" />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.productLabel}>Product ID: {productId}</Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate this product</Text>
          <View style={styles.ratingContainer}>
            <StarRating
              rating={rating}
              onChange={setRating}
              starSize={32}
              color="#FFD700"
              enableSwiping
            />
          </View>
          <Text style={styles.ratingHint}>
            {rating === 0 ? "Tap a star to rate" : `You rated ${rating} out of 5 stars`}
          </Text>
        </View>

        {/* Review Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share your experience with this product..."
            placeholderTextColor="#8F796F"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Add Photos (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
          
          {/* Image List */}
          <View style={styles.imageList}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.reviewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add Image Button */}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={addImage}>
                <Ionicons name="camera-outline" size={24} color="#8F796F" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.imageHint}>You can add up to 5 photos</Text>
        </View>

        {/* Review Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="information-circle-outline" size={20} color="#C35822" />
          <Text style={styles.tipsText}>
            Write honest reviews to help other buyers make informed decisions. Reviews should be based on your own experience with the product.
          </Text>
        </View>
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
    backgroundColor: "#FFF",
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
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#C35822",
    borderRadius: 20,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    flexDirection: "row",
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
  productImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  productLabel: {
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
  ratingContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  ratingHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#8F796F",
    marginTop: 8,
    fontStyle: "italic",
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  imageList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageContainer: {
    position: "relative",
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    backgroundColor: "#FBF8F4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 10,
    color: "#8F796F",
    marginTop: 4,
  },
  imageHint: {
    fontSize: 11,
    color: "#8F796F",
    marginTop: 8,
    fontStyle: "italic",
  },
  tipsCard: {
    flexDirection: "row",
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C35822",
    gap: 8,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: "#32221B",
    lineHeight: 18,
  },
});