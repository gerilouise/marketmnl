// app/product/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, setDoc, deleteDoc, updateDoc, addDoc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: string;
  difficulty: string;
}

interface ProductReview {
  id: string;
  userName: string;
  userInitials: string;
  userId: string;
  rating: number;
  date: string;
  comment: string;
  createdAt: any;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  imageUrl: string | null;
  sellerId: string;
  sellerName?: string;
  storeName?: string;
  rating?: number;
  reviewsCount?: number;
  createdAt: any;
  netWeight?: string;
  calories?: number;
  origin?: string;
  culturalBackground?: string;
  storage?: string;
  shelfLife?: string;
  recipes?: Recipe[];
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>("");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load product data from Firebase
  useEffect(() => {
    loadProduct();
  }, [id]);

  // Load reviews when product is loaded
  useEffect(() => {
    if (product?.id) {
      loadReviews();
    }
  }, [product?.id]);

  const showSuccessMessage = () => {
    setShowSuccessPopup(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessPopup(false);
    });
  };

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const productRef = doc(db, 'products', id as string);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = { id: productSnap.id, ...productSnap.data() } as Product;
        setProduct(productData);
        
        if (productData.sellerId) {
          const storeRef = doc(db, 'stores', productData.sellerId);
          const storeSnap = await getDoc(storeRef);
          if (storeSnap.exists()) {
            const storeData = storeSnap.data();
            setStoreName(storeData.storeName || productData.sellerName || "MarketMNL");
          } else {
            setStoreName(productData.sellerName || "MarketMNL");
          }
        }
        
        await checkWishlistStatus();
      } else {
        Alert.alert("Error", "Product not found");
        router.back();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert("Error", "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!product?.id) return;
    
    setLoadingReviews(true);
    try {
      const reviewsRef = collection(db, 'product_reviews');
      const q = query(
        reviewsRef, 
        where('productId', '==', product.id),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const loadedReviews: ProductReview[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedReviews.push({
          id: doc.id,
          userName: data.userName || "Anonymous",
          userInitials: data.userInitials || "??",
          userId: data.userId,
          rating: data.rating,
          date: data.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || new Date().toLocaleDateString(),
          comment: data.comment,
          createdAt: data.createdAt,
        });
      });
      
      setReviews(loadedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const checkWishlistStatus = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const wishlistRef = collection(db, 'wishlists');
      const itemId = `${user.uid}_${id}`;
      const docRef = doc(wishlistRef, itemId);
      const docSnap = await getDoc(docRef);
      setIsWishlisted(docSnap.exists());
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleAddToCart = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to cart", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") }
      ]);
      return;
    }

    if (addingToCart) return;
    
    setAddingToCart(true);
    try {
      const cartRef = collection(db, 'carts');
      const cartItemId = `${user.uid}_${product?.id}`;
      const docRef = doc(cartRef, cartItemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const newQuantity = docSnap.data().quantity + quantity;
        await updateDoc(docRef, {
          quantity: newQuantity,
          updatedAt: Timestamp.now()
        });
        showSuccessMessage();
      } else {
        await setDoc(docRef, {
          id: cartItemId,
          userId: user.uid,
          productId: product?.id,
          productName: product?.name,
          productPrice: product?.price,
          sellerName: storeName,
          sellerId: product?.sellerId,
          quantity: quantity,
          imageUrl: product?.imageUrl,
          addedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        showSuccessMessage();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert("Error", "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to wishlist", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") }
      ]);
      return;
    }

    try {
      const wishlistRef = collection(db, 'wishlists');
      const itemId = `${user.uid}_${product?.id}`;
      const docRef = doc(wishlistRef, itemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await deleteDoc(docRef);
        setIsWishlisted(false);
        Alert.alert("Removed", `${product?.name} removed from wishlist`);
      } else {
        await setDoc(docRef, {
          id: itemId,
          userId: user.uid,
          productId: product?.id,
          productName: product?.name,
          productPrice: product?.price,
          sellerName: storeName,
          sellerId: product?.sellerId,
          imageUrl: product?.imageUrl,
          addedAt: Timestamp.now()
        });
        setIsWishlisted(true);
        Alert.alert("Added", `${product?.name} added to wishlist`);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      Alert.alert("Error", "Failed to update wishlist");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product?.name} from ${storeName} on MarketMNL! ₱${product?.price}\n\n${product?.description}\n\nGet it here: ${Platform.OS === 'ios' ? 'marketmnl://product/' + product?.id : 'https://marketmnl.com/product/' + product?.id}`,
        title: product?.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSubmitReview = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to write a review", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") }
      ]);
      return;
    }

    if (!reviewComment.trim()) {
      Alert.alert("Error", "Please write a comment");
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewsRef = collection(db, 'product_reviews');
      const userInitials = user.email?.substring(0, 2).toUpperCase() || "U";
      const userName = user.displayName || user.email?.split('@')[0] || "Anonymous";
      
      await addDoc(reviewsRef, {
        productId: product?.id,
        userId: user.uid,
        userName: userName,
        userInitials: userInitials,
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: Timestamp.now(),
      });
      
      await loadReviews();
      setReviewRating(5);
      setReviewComment("");
      setShowReviewModal(false);
      
      Alert.alert("Success", "Your review has been submitted!");
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const navigateToStore = () => {
    if (product?.sellerId) {
      router.push(`/store/${product.sellerId}`);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const toggleRecipe = (recipeId: string) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={14}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const renderRatingStars = (rating: number, size: number = 20, interactive: boolean = false) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setReviewRating(star)}
            disabled={!interactive}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={size}
              color="#FFD700"
              style={interactive && styles.interactiveStar}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#C35822" />
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={handleToggleWishlist}>
              <Ionicons 
                name={isWishlisted ? "heart" : "heart-outline"} 
                size={24} 
                color={isWishlisted ? "#C35822" : "#32221B"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#32221B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={50} color="#CCC" />
              </View>
            )}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{storeName || "MarketMNL"}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>
          
          <View style={styles.namePriceRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>₱{product.price}</Text>
          </View>
          
          <Text style={styles.description}>{product.description}</Text>
          
          <View style={styles.weightCalorieRow}>
            {product.netWeight && (
              <Text style={styles.netWeight}>Net weight: {product.netWeight}</Text>
            )}
            {product.calories && (
              <View style={styles.calorieBadge}>
                <Ionicons name="flame-outline" size={14} color="#C35822" />
                <Text style={styles.calorieText}>{product.calories} kcal</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.sellerCard} onPress={navigateToStore} activeOpacity={0.7}>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Store</Text>
              <View style={styles.sellerNameContainer}>
                <Text style={styles.sellerName}>{storeName || "MarketMNL"}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C35822" />
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating || reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "4.5"}</Text>
              <Text style={styles.reviewsText}>({product.reviewsCount || reviews.length})</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.detailsCard}>
            {product.origin && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Product Origin</Text>
                  <Text style={styles.detailValue}>{product.origin}</Text>
                </View>
              </View>
            )}

            {product.culturalBackground && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="leaf-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Cultural Background</Text>
                  <Text style={styles.detailValue}>{product.culturalBackground}</Text>
                </View>
              </View>
            )}

            {product.storage && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="snow-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Storage</Text>
                  <Text style={styles.detailValue}>{product.storage}</Text>
                </View>
              </View>
            )}

            {product.shelfLife && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="time-outline" size={18} color="#C35822" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Shelf Life</Text>
                  <Text style={styles.detailValue}>{product.shelfLife}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Recipe Section */}
          {product.recipes && product.recipes.length > 0 && (
            <View style={styles.recipeSection}>
              <View style={styles.recipeHeader}>
                <View style={styles.recipeTitleContainer}>
                  <Ionicons name="restaurant-outline" size={20} color="#C35822" />
                  <Text style={styles.recipeSectionTitle}>Recipe Ideas</Text>
                </View>
                <Text style={styles.recipeCount}>{product.recipes.length} recipes</Text>
              </View>

              {product.recipes.map((recipe) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <TouchableOpacity style={styles.recipeCardHeader} onPress={() => toggleRecipe(recipe.id)}>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <View style={styles.recipeMeta}>
                        <View style={styles.recipeMetaItem}>
                          <Ionicons name="time-outline" size={12} color="#8F796F" />
                          <Text style={styles.recipeMetaText}>{recipe.prepTime}</Text>
                        </View>
                        <View style={styles.recipeMetaItem}>
                          <Ionicons name="stats-chart-outline" size={12} color="#8F796F" />
                          <Text style={styles.recipeMetaText}>{recipe.difficulty}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name={expandedRecipe === recipe.id ? "chevron-up" : "chevron-down"} size={20} color="#8F796F" />
                  </TouchableOpacity>

                  {expandedRecipe === recipe.id && (
                    <View style={styles.recipeExpanded}>
                      <Text style={styles.recipeDescription}>{recipe.description}</Text>
                      <TouchableOpacity style={styles.viewRecipeButton} onPress={() => Alert.alert("Recipe", `Full recipe for ${recipe.name} coming soon!`)}>
                        <Text style={styles.viewRecipeButtonText}>View Full Recipe</Text>
                        <Ionicons name="arrow-forward" size={16} color="#C35822" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <View style={styles.reviewsTitleContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.reviewsTitle}>Customer Reviews</Text>
              </View>
              <Text style={styles.reviewsCount}>{reviews.length} reviews</Text>
            </View>

            <TouchableOpacity style={styles.writeReviewButton} onPress={() => setShowReviewModal(true)}>
              <Ionicons name="create-outline" size={18} color="#C35822" />
              <Text style={styles.writeReviewText}>Write a Review</Text>
            </TouchableOpacity>

            {loadingReviews && (
              <View style={styles.loadingReviewsContainer}>
                <ActivityIndicator size="small" color="#C35822" />
              </View>
            )}

            {!loadingReviews && displayedReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitials}>{review.userInitials}</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>{review.userName}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  {renderStars(review.rating)}
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}

            {!loadingReviews && reviews.length === 0 && (
              <View style={styles.emptyReviewsContainer}>
                <Ionicons name="chatbubble-outline" size={40} color="#E0DAD1" />
                <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to review!</Text>
              </View>
            )}

            {reviews.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton} onPress={() => setShowAllReviews(!showAllReviews)}>
                <Text style={styles.viewAllText}>
                  {showAllReviews ? "Show Less" : `View All ${reviews.length} Reviews`}
                </Text>
                <Ionicons name={showAllReviews ? "chevron-up" : "chevron-down"} size={16} color="#C35822" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Success Popup */}
      {showSuccessPopup && (
        <Animated.View style={[styles.successPopup, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.successText}>
            Added {quantity} x {product?.name} to cart
          </Text>
        </Animated.View>
      )}

      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={decrementQuantity} 
            style={styles.quantityButton}
            disabled={addingToCart}
          >
            <Ionicons name="remove" size={20} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            onPress={incrementQuantity} 
            style={styles.quantityButton}
            disabled={addingToCart}
          >
            <Ionicons name="add" size={20} color="#32221B" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]} 
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#FFF" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showReviewModal} animationType="slide" transparent={true} onRequestClose={() => setShowReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Rating</Text>
              {renderRatingStars(reviewRating, 32, true)}
              
              <Text style={[styles.modalLabel, { marginTop: 20 }]}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this product..."
                placeholderTextColor="#8F796F"
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitButton, submittingReview && styles.submitButtonDisabled]} onPress={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#32221B",
    marginTop: 16,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#C35822",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  imageWrapper: {
    position: "relative",
  },
  productImage: {
    width: 280,
    height: 280,
    borderRadius: 24,
  },
  imagePlaceholder: {
    width: 280,
    height: 280,
    backgroundColor: "#EFEAE4",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    borderStyle: "dashed",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: "#8F796F",
    letterSpacing: 1,
  },
  categoryTag: {
    backgroundColor: "#E0DAD1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#32221B",
    fontWeight: "500",
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32221B",
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#C35822",
    marginLeft: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 4,
  },
  weightCalorieRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  netWeight: {
    fontSize: 14,
    color: "#8F796F",
  },
  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  calorieText: {
    fontSize: 12,
    color: "#32221B",
    fontWeight: "500",
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0DAD1",
    marginVertical: 20,
  },
  sellerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 4,
  },
  sellerNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerName: {
    fontSize: 14,
    color: "#C35822",
    marginRight: 4,
    textDecorationLine: "underline",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: "#8F796F",
    marginLeft: 4,
  },
  detailsCard: {
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
  detailItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#32221B",
    lineHeight: 20,
  },
  recipeSection: {
    marginBottom: 20,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recipeTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recipeSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  recipeCount: {
    fontSize: 12,
    color: "#8F796F",
  },
  recipeCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    overflow: "hidden",
  },
  recipeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 6,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 12,
  },
  recipeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 12,
    color: "#8F796F",
  },
  recipeExpanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  recipeDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  viewRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  viewRecipeButtonText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  reviewsSection: {
    marginBottom: 20,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
  },
  reviewsCount: {
    fontSize: 12,
    color: "#8F796F",
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#C35822",
    marginBottom: 16,
    gap: 6,
  },
  writeReviewText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  reviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0DAD1",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewerInitials: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: "#8F796F",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
  },
  interactiveStar: {
    marginRight: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  loadingReviewsContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyReviewsContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyReviewsText: {
    fontSize: 14,
    color: "#8F796F",
    marginTop: 12,
    textAlign: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#C35822",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  modalBody: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: "#FBF8F4",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#C35822",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#FFB6A5",
  },
  submitButtonText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FBF8F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0DAD1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0DAD1",
    borderRadius: 20,
    padding: 5,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    paddingHorizontal: 12,
  },
  addToCartButton: {
    flexDirection: "row",
    backgroundColor: "#C35822",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonDisabled: {
    opacity: 0.6,
  },
  addToCartText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  successPopup: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  successText: {
    fontSize: 14,
    color: "#32221B",
    fontWeight: "500",
  },
});