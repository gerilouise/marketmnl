// app/product/[id].tsx - Categories removed
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  isAnonymous?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
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

  // Guest login modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "wishlist" | "cart";
  } | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const user = auth.currentUser;
    setIsGuest(!user);
  }, []);

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

  // Show login modal for guest users
  const showLoginPrompt = (type: "wishlist" | "cart") => {
    setPendingAction({ type });
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setPendingAction(null);
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    router.push("/auth/login");
  };

  const handleSignUp = () => {
    setShowLoginModal(false);
    router.push("/auth/signup-customer");
  };

  const loadProduct = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const productRef = doc(db, "products", id as string);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = {
          id: productSnap.id,
          ...productSnap.data(),
        } as Product;
        setProduct(productData);

        // Get store name from sellers collection
        if (productData.sellerId) {
          const sellerRef = doc(db, "sellers", productData.sellerId);
          const sellerSnap = await getDoc(sellerRef);

          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            setStoreName(
              sellerData.storeName || productData.sellerName || "MarketMNL",
            );
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
      console.error("Error loading product:", error);
      Alert.alert("Error", "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!product?.id) return;

    setLoadingReviews(true);
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("productId", "==", product.id),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);

      const loadedReviews: ProductReview[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isAnonymous = data.isAnonymous || false;

        loadedReviews.push({
          id: doc.id,
          userName: isAnonymous ? "Anonymous" : data.userName || "Anonymous",
          userInitials: isAnonymous ? "AN" : data.userInitials || "??",
          userId: data.userId,
          rating: data.rating,
          date:
            data.createdAt?.toDate?.()?.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) || new Date().toLocaleDateString(),
          comment: data.comment,
          createdAt: data.createdAt,
          isAnonymous: isAnonymous,
        });
      });

      setReviews(loadedReviews);

      // Update product rating based on reviews
      if (loadedReviews.length > 0) {
        const totalRating = loadedReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / loadedReviews.length;
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                rating: averageRating,
                reviewsCount: loadedReviews.length,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const checkWishlistStatus = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const wishlistRef = collection(db, "wishlists");
      const itemId = `${user.uid}_${id}`;
      const docRef = doc(wishlistRef, itemId);
      const docSnap = await getDoc(docRef);
      setIsWishlisted(docSnap.exists());
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handleAddToCart = async () => {
    const user = auth.currentUser;
    if (!user) {
      showLoginPrompt("cart");
      return;
    }

    if (addingToCart) return;

    setAddingToCart(true);
    try {
      const cartRef = collection(db, "carts");
      const cartItemId = `${user.uid}_${product?.id}`;
      const docRef = doc(cartRef, cartItemId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const newQuantity = docSnap.data().quantity + quantity;
        await updateDoc(docRef, {
          quantity: newQuantity,
          updatedAt: Timestamp.now(),
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
          updatedAt: Timestamp.now(),
        });
        showSuccessMessage();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      showLoginPrompt("wishlist");
      return;
    }

    try {
      const wishlistRef = collection(db, "wishlists");
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
          addedAt: Timestamp.now(),
        });
        setIsWishlisted(true);
        Alert.alert("Added", `${product?.name} added to wishlist`);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      Alert.alert("Error", "Failed to update wishlist");
    }
  };

  const handleShare = async () => {
    if (!product) {
      Alert.alert("Error", "Product information not available");
      return;
    }

    try {
      const productUrl = Platform.select({
        ios: `marketmnl://product/${product.id}`,
        android: `marketmnl://product/${product.id}`,
        default: `https://marketmnl.com/product/${product.id}`,
      });

      const shareMessage =
        `✨ *${product.name}* ✨\n\n` +
        `🏪 Store: ${storeName}\n` +
        `💰 Price: ₱${product.price.toLocaleString()}\n\n` +
        `📝 ${product.description?.substring(0, 150)}${product.description?.length > 150 ? "..." : ""}\n\n` +
        `⭐ Rating: ${product.rating?.toFixed(1) || "4.5"} ★\n\n` +
        `👉 Check it out on MarketMNL: ${productUrl}\n\n` +
        `📱 Download MarketMNL app: https://marketmnl.com/download`;

      const result = await Share.share({
        message: shareMessage,
        title: product.name,
        url: productUrl,
      });

      if (result.action === Share.sharedAction) {
        console.log("Shared successfully");
      }
    } catch (error: any) {
      console.error("Error sharing:", error);
      if (error.message !== "User canceled share dialog") {
        Alert.alert(
          "Share Failed",
          "Unable to share at this time. Please try again.",
        );
      }
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const navigateToStore = () => {
    const user = auth.currentUser;
    if (!user) {
      showLoginPrompt("cart");
      return;
    }
    if (product?.sellerId) {
      router.push(`/store/${product.sellerId}`);
    }
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

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

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // Login Required Modal Component
  const LoginRequiredModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLoginModal}
      onRequestClose={closeLoginModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.loginModalContent}>
          <View style={styles.loginModalIcon}>
            <Ionicons name="log-in-outline" size={60} color="#C35822" />
          </View>
          <Text style={styles.loginModalTitle}>Login Required</Text>
          <Text style={styles.loginModalMessage}>
            {pendingAction?.type === "wishlist"
              ? "Please log in to add items to your wishlist"
              : pendingAction?.type === "cart"
                ? "Please log in to add items to your cart"
                : "Please log in to continue"}
          </Text>
          <Text style={styles.loginModalSubMessage}>
            Create an account to enjoy personalized shopping, save your
            favorites, and track your orders!
          </Text>

          <View style={styles.loginModalButtons}>
            <TouchableOpacity
              style={[styles.loginModalButton, styles.loginButtonModal]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonModalText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginModalButton, styles.signupButtonModal]}
              onPress={handleSignUp}
            >
              <Text style={styles.signupButtonModalText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginModalClose}
            onPress={closeLoginModal}
          >
            <Text style={styles.loginModalCloseText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleToggleWishlist}
            >
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
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={50} color="#CCC" />
              </View>
            )}
          </View>
        </View>

        {/* Product Info - Category badges removed */}
        <View style={styles.contentContainer}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{storeName || "MarketMNL"}</Text>
          </View>

          <View style={styles.namePriceRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>₱{product.price}</Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.weightCalorieRow}>
            {product.netWeight && (
              <Text style={styles.netWeight}>
                Net weight: {product.netWeight}
              </Text>
            )}
            {product.calories && (
              <View style={styles.calorieBadge}>
                <Ionicons name="flame-outline" size={14} color="#C35822" />
                <Text style={styles.calorieText}>{product.calories} kcal</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.sellerCard}
            onPress={navigateToStore}
            activeOpacity={0.7}
          >
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Store</Text>
              <View style={styles.sellerNameContainer}>
                <Text style={styles.sellerName}>
                  {storeName || "MarketMNL"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C35822" />
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {product.rating || reviews.length > 0
                  ? (
                      reviews.reduce((sum, r) => sum + r.rating, 0) /
                      reviews.length
                    ).toFixed(1)
                  : "4.5"}
              </Text>
              <Text style={styles.reviewsText}>
                ({product.reviewsCount || reviews.length})
              </Text>
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
                  <Text style={styles.detailValue}>
                    {product.culturalBackground}
                  </Text>
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
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color="#C35822"
                  />
                  <Text style={styles.recipeSectionTitle}>Recipe Ideas</Text>
                </View>
                <Text style={styles.recipeCount}>
                  {product.recipes.length} recipes
                </Text>
              </View>

              {product.recipes.map((recipe) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <TouchableOpacity
                    style={styles.recipeCardHeader}
                    onPress={() => toggleRecipe(recipe.id)}
                  >
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <View style={styles.recipeMeta}>
                        <View style={styles.recipeMetaItem}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#8F796F"
                          />
                          <Text style={styles.recipeMetaText}>
                            {recipe.prepTime}
                          </Text>
                        </View>
                        <View style={styles.recipeMetaItem}>
                          <Ionicons
                            name="stats-chart-outline"
                            size={12}
                            color="#8F796F"
                          />
                          <Text style={styles.recipeMetaText}>
                            {recipe.difficulty}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={
                        expandedRecipe === recipe.id
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={20}
                      color="#8F796F"
                    />
                  </TouchableOpacity>

                  {expandedRecipe === recipe.id && (
                    <View style={styles.recipeExpanded}>
                      <Text style={styles.recipeDescription}>
                        {recipe.description}
                      </Text>
                      <TouchableOpacity
                        style={styles.viewRecipeButton}
                        onPress={() =>
                          Alert.alert(
                            "Recipe",
                            `Full recipe for ${recipe.name} coming soon!`,
                          )
                        }
                      >
                        <Text style={styles.viewRecipeButtonText}>
                          View Full Recipe
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color="#C35822"
                        />
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

            {loadingReviews && (
              <View style={styles.loadingReviewsContainer}>
                <ActivityIndicator size="small" color="#C35822" />
              </View>
            )}

            {!loadingReviews &&
              displayedReviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerInitials}>
                          {review.userInitials}
                        </Text>
                      </View>
                      <View>
                        <View style={styles.reviewerNameRow}>
                          <Text style={styles.reviewerName}>
                            {review.userName}
                          </Text>
                          {review.isAnonymous && (
                            <View style={styles.anonymousBadge}>
                              <Ionicons
                                name="eye-off-outline"
                                size={10}
                                color="#8F796F"
                              />
                              <Text style={styles.anonymousBadgeText}>
                                Anonymous
                              </Text>
                            </View>
                          )}
                        </View>
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
                <Text style={styles.emptyReviewsText}>No reviews yet.</Text>
              </View>
            )}

            {reviews.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowAllReviews(!showAllReviews)}
              >
                <Text style={styles.viewAllText}>
                  {showAllReviews
                    ? "Show Less"
                    : `View All ${reviews.length} Reviews`}
                </Text>
                <Ionicons
                  name={showAllReviews ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#C35822"
                />
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
          style={[
            styles.addToCartButton,
            addingToCart && styles.addToCartButtonDisabled,
          ]}
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

      {/* Login Required Modal */}
      <LoginRequiredModal />
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
    alignItems: "center",
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: "#8F796F",
    letterSpacing: 1,
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
    flex: 1,
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
  reviewerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#32221B",
  },
  anonymousBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  anonymousBadgeText: {
    fontSize: 9,
    color: "#8F796F",
  },
  reviewDate: {
    fontSize: 11,
    color: "#8F796F",
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 8,
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
  // Login Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loginModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
  },
  loginModalMessage: {
    fontSize: 16,
    color: "#32221B",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  loginModalSubMessage: {
    fontSize: 13,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
  loginModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  loginModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  loginButtonModal: {
    backgroundColor: "#C35822",
  },
  loginButtonModalText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signupButtonModal: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#C35822",
  },
  signupButtonModalText: {
    color: "#C35822",
    fontSize: 16,
    fontWeight: "600",
  },
  loginModalClose: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginModalCloseText: {
    color: "#8F796F",
    fontSize: 14,
  },
});
