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
  Timestamp 
} from 'firebase/firestore';
import { Alert } from 'react-native';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  imageUrl: string | null;
  sellerId: string;
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        setProducts([]);
        return;
      }

      console.log('Fetching products for seller:', user.uid);
      
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
      
      console.log(`Found ${productsList.length} products for seller`);
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
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

      console.log('Adding product for seller:', user.uid);

      const productsRef = collection(db, 'products');
      await addDoc(productsRef, {
        ...productData,
        sellerId: user.uid, // This ensures the product is tied to the logged-in seller
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await fetchProducts(); // Refresh the list
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

      // First verify this product belongs to the user
      const productRef = doc(db, 'products', productId);
      const productSnapshot = await getDoc(productRef);
      
      if (!productSnapshot.exists()) {
        Alert.alert('Error', 'Product not found');
        return false;
      }

      const productData_snap = productSnapshot.data();
      if (productData_snap.sellerId !== user.uid) {
        Alert.alert('Error', 'You do not have permission to edit this product');
        return false;
      }

      await updateDoc(productRef, {
        ...productData,
        updatedAt: Timestamp.now(),
      });

      await fetchProducts(); // Refresh the list
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

      // First verify this product belongs to the user
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
      await fetchProducts(); // Refresh the list
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
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
  };
};