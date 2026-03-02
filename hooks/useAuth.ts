import { supabase, supabaseUrl } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState("");

  const sendOTP = async (email: string, userType: "buyer" | "seller") => {
    setLoading(true);
    try {
      console.log("1️⃣ Starting OTP process for:", email);
      console.log("2️⃣ Supabase URL:", supabaseUrl);

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (error) {
        console.log("3️⃣❌ Supabase error:", error);

        // Check for specific error types
        if (error.message.includes("rate limit")) {
          Alert.alert(
            "Rate Limited",
            "Too many attempts. Please wait a few minutes and try again.",
          );
        } else {
          Alert.alert("Error", error.message);
        }
        throw error;
      }

      console.log("4️⃣✅ OTP sent successfully", data);
      setEmail(email);
      setVerificationSent(true);

      // Navigate to OTP verification screen
      console.log("5️⃣ Navigating to verify-otp screen");
      router.push({
        pathname: "/auth/verify-otp",
        params: { email, userType },
      });
    } catch (error: any) {
      console.log("❌ Error caught:", error);
      // Don't show duplicate alerts
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string) => {
    setLoading(true);
    try {
      console.log("🔐 Verifying OTP for:", email);

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      console.log("✅ Verification successful:", data);
      Alert.alert("Success", "Email verified successfully!");

      const userType = data.user?.user_metadata?.user_type;
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

  const resendOTP = async (userType: "buyer" | "seller") => {
    if (!email) {
      Alert.alert("Error", "No email address found");
      return;
    }
    await sendOTP(email, userType);
  };

  const login = async (email: string, password: string) => {
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

      const userType = data.user?.user_metadata?.user_type;
      if (userType === "seller") {
        router.replace("/(seller)" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      console.log("❌ Login failed:", error);
      Alert.alert("Login Failed", error.message || "Invalid email or password");
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
  };
};
