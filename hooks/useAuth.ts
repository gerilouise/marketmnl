import { supabase } from "@/lib/supabase";
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
      console.log("Sending OTP to:", email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (error) throw error;

      setEmail(email);
      setVerificationSent(true);

      router.push({
        pathname: "/auth/verify-otp" as any,
        params: { email, userType },
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string, userData?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      Alert.alert("Success", "Email verified successfully!");

      const userType = data.user?.user_metadata?.user_type;
      if (userType === "seller") {
        router.replace("/(seller)" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async (userType: "buyer" | "seller") => {
    if (!email) return;
    await sendOTP(email, userType);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userType = data.user?.user_metadata?.user_type;
      if (userType === "seller") {
        router.replace("/(seller)" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth/login" as any);
    } catch (error: any) {
      Alert.alert("Error", error.message);
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
    logout,
  };
};
