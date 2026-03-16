import { supabase, supabaseUrl } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState("");

  // ============================================
  // METHOD 1: Send OTP for email verification
  // ============================================
  const sendOTP = async (
    email: string,
    userType: "buyer" | "seller",
    userData?: any,
  ) => {
    console.log("========== SEND OTP CALLED ==========");
    console.log("Setting loading to true");
    setLoading(true);

    try {
      console.log("1️⃣ Starting OTP process for:", email);
      console.log("2️⃣ Supabase URL:", supabaseUrl);
      console.log("3️⃣ User type:", userType);
      console.log("4️⃣ User data:", userData);

      // Prepare metadata based on user type
      const metadata: any = {
        user_type: userType,
        full_name: userData?.fullName || "",
        phone: userData?.phone || "",
      };

      // Add store name if seller
      if (userType === "seller" && userData?.storeName) {
        metadata.store_name = userData.storeName;
      }

      console.log("5️⃣ Metadata being sent:", metadata);
      console.log("6️⃣ Calling supabase.auth.signInWithOtp...");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: metadata,
        },
      });

      if (error) {
        console.log("7️⃣❌ Supabase error:", error);
        throw error;
      }

      console.log("8️⃣✅ OTP sent successfully");
      setEmail(email);
      setVerificationSent(true);

      // Navigate to OTP verification screen with ALL user data
      console.log("9️⃣ Navigating to verify-otp screen");

      // Prepare params based on user type
      const params: any = {
        email,
        userType,
        fullName: userData?.fullName || "",
        phone: userData?.phone || "",
      };

      // Add seller-specific data
      if (userType === "seller") {
        params.storeName = userData?.storeName || "";
        params.storeDescription = userData?.storeDescription || "";
      }

      console.log("🔟 Navigation params:", params);

      router.push({
        pathname: "/auth/verify-otp",
        params: params,
      });

      console.log("1️⃣1️⃣ Navigation complete");
    } catch (error: any) {
      console.log("❌❌❌ ERROR CAUGHT ❌❌❌");
      console.log("Error:", error);
      console.log("Error message:", error.message);
      console.log("Error status:", error.status);
      Alert.alert("Error", error.message || "Failed to send verification code");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  // ============================================
  // METHOD 2: Verify OTP and create account
  // ============================================
  const verifyOTP = async (otp: string, userData?: any) => {
    setLoading(true);
    try {
      console.log("🔐 Verifying OTP for:", email);
      console.log("👤 User data:", userData);

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      console.log("✅ Verification successful:", data);

      // Create profile in database after successful verification
      if (data.user && userData) {
        await createUserProfile(data.user, userData);
      }

      Alert.alert("Success", "Email verified successfully!");

      // Redirect based on user type
      const userType =
        data.user?.user_metadata?.user_type || userData?.userType;
      if (userType === "seller") {
        router.replace("/(seller)" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      console.log("❌ Verification failed:", error);
      Alert.alert(
        "Verification Failed",
        error.message || "Invalid verification code",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Helper: Create user profile in database
  // ============================================
  const createUserProfile = async (user: any, userData: any) => {
    try {
      console.log("📝 Creating profile for user:", user.id);

      // Insert into profiles table
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          full_name: userData.fullName,
          phone: userData.phone,
          user_type: userData.userType,
        },
      ]);

      if (profileError) {
        console.error("❌ Profile creation error:", profileError);
        throw profileError;
      }

      // If seller, create seller profile
      if (userData.userType === "seller" && userData.storeName) {
        const { error: sellerError } = await supabase.from("sellers").insert([
          {
            id: user.id,
            store_name: userData.storeName,
            store_description: userData.storeDescription || "",
          },
        ]);

        if (sellerError) {
          console.error("❌ Seller creation error:", sellerError);
        }
      }

      console.log("✅ Profile created successfully");
    } catch (error: any) {
      console.error("❌ Error creating profile:", error);
      Alert.alert("Profile Error", "Failed to create user profile");
    }
  };

  // ============================================
  // METHOD 3: Resend OTP
  // ============================================
  const resendOTP = async (userType: "buyer" | "seller", userData?: any) => {
    if (!email) {
      Alert.alert("Error", "No email address found");
      return;
    }
    await sendOTP(email, userType, userData);
  };

  // ============================================
  // METHOD 4: Traditional Login with Password
  // ============================================
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log("🔐 Logging in with:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("✅ Login successful:", data);
      Alert.alert("Success", "Logged in successfully!");

      // Get user type from metadata
      const userType = data.user?.user_metadata?.user_type;

      // Redirect based on user type
      if (userType === "seller") {
        router.replace("/(seller)" as any);
      } else {
        router.replace("/(tabs)" as any);
      }

      return true;
    } catch (error: any) {
      console.log("❌ Login failed:", error);
      Alert.alert("Login Failed", error.message || "Invalid email or password");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // METHOD 5: Traditional Signup with Password
  // ============================================
  const signUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      console.log("📝 Signing up with:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            phone: userData.phone,
            user_type: userData.userType || "buyer",
          },
        },
      });

      if (error) throw error;

      console.log("✅ Signup successful:", data);

      // Create profile in profiles table
      if (data.user) {
        await createUserProfile(data.user, userData);
      }

      Alert.alert(
        "Success",
        "Account created successfully! Please check your email for verification.",
      );

      // Navigate to login screen
      router.replace("/auth/login" as any);

      return true;
    } catch (error: any) {
      console.log("❌ Signup failed:", error);
      Alert.alert("Signup Failed", error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    verificationSent,
    email,
    sendOTP,
    verifyOTP,
    resendOTP,
    login,
    signUp,
  };
};
