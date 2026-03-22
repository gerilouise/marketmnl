// hooks/useFirebaseProducts.ts
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { Alert } from 'react-native';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  imageUrl?: string;
  sellerId: string;
  sellerName?: string;
  rating?: number;
  reviews?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  netWeight?: string;
  origin?: string;
  culturalBackground?: string;
  storage?: string;
  shelfLife?: string;
}

export const useFirebaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // For SELLER: Fetch only their products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setProducts([]);
        return;
      }
      
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef, 
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const productsList: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // For CUSTOMER: Fetch ALL products
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const productsList: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      setAllProducts(productsList);
      return productsList;
    } catch (error) {
      console.error('Error fetching all products:', error);
      Alert.alert('Error', 'Failed to load products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // For CUSTOMER: Fetch products by category
  const fetchProductsByCategory = async (category: string) => {
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      let q;
      
      if (category === "All") {
        q = query(productsRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(
          productsRef, 
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const productsList: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      setAllProducts(productsList);
      return productsList;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      Alert.alert('Error', 'Failed to load products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // For CUSTOMER: Search products
  const searchProducts = async (searchTerm: string) => {
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const productsList: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product;
        
        if (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
          productsList.push(product);
        }
      });
      
      setAllProducts(productsList);
      return productsList;
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Error', 'Failed to search products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sellerId'>) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in');
        return false;
      }

      const productsRef = collection(db, 'products');
      await addDoc(productsRef, {
        ...productData,
        sellerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await fetchProducts();
      Alert.alert('Success', 'Product added successfully!');
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId: string, productData: Partial<Product>) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in');
        return false;
      }

      const productRef = doc(db, 'products', productId);
      const productSnapshot = await getDoc(productRef);
      
      if (!productSnapshot.exists()) {
        Alert.alert('Error', 'Product not found');
        return false;
      }

      const existingData = productSnapshot.data();
      if (existingData.sellerId !== user.uid) {
        Alert.alert('Error', 'You do not have permission to edit this product');
        return false;
      }

      await updateDoc(productRef, {
        ...productData,
        updatedAt: Timestamp.now(),
      });

      await fetchProducts();
      Alert.alert('Success', 'Product updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in');
        return false;
      }

      const productRef = doc(db, 'products', productId);
      const productSnapshot = await getDoc(productRef);
      
      if (!productSnapshot.exists()) {
        Alert.alert('Error', 'Product not found');
        return false;
      }

      const productData = productSnapshot.data();
      if (productData.sellerId !== user.uid) {
        Alert.alert('Error', 'You do not have permission to delete this product');
        return false;
      }

      await deleteDoc(productRef);
      await fetchProducts();
      Alert.alert('Success', 'Product deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // For seller view
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    
    // For customer view
    allProducts,
    fetchAllProducts,
    fetchProductsByCategory,
    searchProducts,
  };
};