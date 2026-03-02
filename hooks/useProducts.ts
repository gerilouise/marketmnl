import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_url: string | null;
  rating: number;
  reviews: number;
  created_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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
      let query = supabase.from("products").select("*");

      if (category !== "All") {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setProducts(data || []);
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
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching product:", error);
      return null;
    }
  };

  // Add new product (for sellers)
  const addProduct = async (
    product: Omit<Product, "id" | "created_at" | "rating" | "reviews">,
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        Alert.alert("Error", "You must be logged in to add products");
        return null;
      }

      const { data, error } = await supabase
        .from("products")
        .insert([{ ...product, seller_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;

      Alert.alert("Success", "Product added successfully!");
      await fetchProducts(); // Refresh the list
      return data;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return null;
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      Alert.alert("Success", "Product updated successfully!");
      await fetchProducts(); // Refresh the list
      return data;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return null;
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;

      Alert.alert("Success", "Product deleted successfully!");
      await fetchProducts(); // Refresh the list
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // Search products
  const searchProducts = async (query: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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
