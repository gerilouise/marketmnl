import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

// Your Supabase credentials - FIXED THE URL
export const supabaseUrl = "https://qlqgqmceapizsrjponxv.supabase.co"; 
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscWdxbWNlYXppenNyanBvbnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODMyNDQsImV4cCI6MjA4Nzk1OTI0NH0.eNu1YSouCASxJ9YUK7Edea_6AffBsrw1rzPjNeFCcT8";

// Check if we're on web
const isWeb = Platform.OS === "web";

// Use appropriate storage
let storage: any;

if (isWeb) {
  // Web storage using localStorage
  storage = {
    getItem: async (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error("Error saving to localStorage", e);
      }
    },
    removeItem: async (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("Error removing from localStorage", e);
      }
    },
  };
} else {
  // Mobile storage using AsyncStorage
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  storage = AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
