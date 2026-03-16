// hooks/useFirebaseProducts.ts
import { auth, db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  imageUrl: string | null;
  rating: number;
  reviews: number;
  createdAt: Date;
}

export const useFirebaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const q = query(productsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const productsList: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          sellerId: data.sellerId || "",
          name: data.name || "",
          description: data.description || "",
          price: data.price || 0,
          category: data.category || "",
          stockQuantity: data.stockQuantity || 0,
          imageUrl: data.imageUrl || null,
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      setProducts(productsList);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (category: string) => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      let q;

      if (category !== "All") {
        q = query(
          productsRef,
          where("category", "==", category),
          orderBy("createdAt", "desc"),
        );
      } else {
        q = query(productsRef, orderBy("createdAt", "desc"));
      }

      const querySnapshot = await getDocs(q);

      const productsList: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          sellerId: data.sellerId || "",
          name: data.name || "",
          description: data.description || "",
          price: data.price || 0,
          category: data.category || "",
          stockQuantity: data.stockQuantity || 0,
          imageUrl: data.imageUrl || null,
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      setProducts(productsList);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single product by ID
  const fetchProductById = async (id: string) => {
    try {
      const docRef = doc(db, "products", id);
      const docSnap = await getDocs(
        query(collection(db, "products"), where("__name__", "==", id)),
      );

      if (!docSnap.empty) {
        const data = docSnap.docs[0].data();
        return {
          id: docSnap.docs[0].id,
          sellerId: data.sellerId || "",
          name: data.name || "",
          description: data.description || "",
          price: data.price || 0,
          category: data.category || "",
          stockQuantity: data.stockQuantity || 0,
          imageUrl: data.imageUrl || null,
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Product;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching product:", error);
      return null;
    }
  };

  // Add new product (for sellers)
  const addProduct = async (
    product: Omit<Product, "id" | "createdAt" | "rating" | "reviews">,
  ) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "You must be logged in to add products");
        return null;
      }

      const productsRef = collection(db, "products");
      const newProduct = {
        ...product,
        sellerId: user.uid,
        rating: 0,
        reviews: 0,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(productsRef, newProduct);

      Alert.alert("Success", "Product added successfully!");
      await fetchProducts(); // Refresh the list

      return {
        id: docRef.id,
        ...newProduct,
        createdAt: new Date(),
      } as Product;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return null;
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, updates);

      Alert.alert("Success", "Product updated successfully!");
      await fetchProducts(); // Refresh the list
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const productRef = doc(db, "products", id);
      await deleteDoc(productRef);

      Alert.alert("Success", "Product deleted successfully!");
      await fetchProducts(); // Refresh the list
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // Search products
  const searchProducts = async (queryText: string) => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        orderBy("name"),
        // Note: Firestore doesn't support native text search
        // You might need to implement a more complex search or use Algolia
      );

      const querySnapshot = await getDocs(q);

      const productsList: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Client-side filtering for simple search
        if (data.name?.toLowerCase().includes(queryText.toLowerCase())) {
          productsList.push({
            id: doc.id,
            sellerId: data.sellerId || "",
            name: data.name || "",
            description: data.description || "",
            price: data.price || 0,
            category: data.category || "",
            stockQuantity: data.stockQuantity || 0,
            imageUrl: data.imageUrl || null,
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      setProducts(productsList);
    } catch (error: any) {
      setError(error.message);
      console.error("Error searching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load products on hook initialization
  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductsByCategory,
    fetchProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
  };
};
