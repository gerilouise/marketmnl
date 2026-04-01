// app/reviews/edit.tsx
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditReviewScreen() {
  const params = useLocalSearchParams();
  const reviewId = params.reviewId as string;
  const productId = params.productId as string;
  const productName = params.productName as string;
  const sellerName = params.sellerName as string;
  const initialRating = parseInt((params.rating as string) || "5");
  const initialComment = (params.comment as string) || "";
  const imageUrl = params.imageUrl as string;

  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);

  const renderStars = (selectedRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= selectedRating ? "star" : "star-outline"}
              size={40}
              color="#FFD700"
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleUpdate = async () => {
    if (!comment.trim()) {
      Alert.alert("Error", "Please write a review before submitting");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in");
      router.push("/auth/login");
      return;
    }

    setSubmitting(true);

    try {
      const reviewRef = doc(db, "product_reviews", reviewId);
      await updateDoc(reviewRef, {
        rating: rating,
        comment: comment.trim(),
        updatedAt: Timestamp.now(),
      });

      Alert.alert("Success", "Your review has been updated!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error updating review:", error);
      Alert.alert("Error", "Failed to update review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Review</Text>
        <TouchableOpacity
          onPress={handleUpdate}
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Update</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Info */}
        <View style={styles.productCard}>
          <View style={styles.productImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#CCC" />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.sellerName}>from {sellerName}</Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate this product</Text>
          {renderStars(rating)}
          <Text style={styles.ratingHint}>
            Tap the stars to change your rating
          </Text>
        </View>

        {/* Review Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience with this product..."
            placeholderTextColor="#8F796F"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length} characters</Text>
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
    paddingVertical: 12,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  submitButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    marginRight: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
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
  sellerName: {
    fontSize: 13,
    color: "#C35822",
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
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  ratingHint: {
    fontSize: 12,
    color: "#8F796F",
    textAlign: "center",
    marginTop: 8,
  },
  reviewInput: {
    backgroundColor: "#FBF8F4",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: "#8F796F",
    textAlign: "right",
    marginTop: 8,
  },
});
