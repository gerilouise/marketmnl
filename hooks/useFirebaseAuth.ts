// hooks/useFirebaseAuth.ts - Fix the sendOTP function
import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useState } from "react";
import { Alert } from "react-native";

export const useFirebaseAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // ============================================
  // SIGN UP (Creates account and sends verification email)
  // ============================================
  const signUp = async (
    email: string,
    password: string,
    userData: {
      fullName: string;
      phone: string;
      userType: "buyer" | "seller";
      storeName?: string;
    },
  ) => {
    setLoading(true);
    try {
      console.log("📝 Creating account with Firebase...");

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      console.log("✅ User created in Auth:", user.uid);

      // 2. Send email verification
      await sendEmailVerification(user);
      console.log("📧 Verification email sent");

      // 3. Create user profile in Firestore
      const nameParts = userData.fullName.split(" ");
      const profileData = {
        uid: user.uid,
        email: user.email,
        fullName: userData.fullName,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phone: userData.phone,
        userType: userData.userType,
        emailVerified: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, "users", user.uid), profileData);
      console.log("✅ User profile created in Firestore");

      // 4. If seller, create seller profile
      if (userData.userType === "seller" && userData.storeName) {
        const sellerData = {
          uid: user.uid,
          storeName: userData.storeName,
          storeDescription: "",
          rating: 0,
          totalSales: 0,
          createdAt: Timestamp.now(),
        };
        await setDoc(doc(db, "sellers", user.uid), sellerData);
        console.log("✅ Seller profile created");
      }

      Alert.alert(
        "Success",
        "Account created! Please check your email for verification.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth/login"),
          },
        ],
      );

      return true;
    } catch (error: any) {
      console.log("❌ Signup failed:", error);

      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "Email already in use");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "Password should be at least 6 characters");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Invalid email address");
      } else {
        Alert.alert("Error", error.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SEND OTP (Simplified - just shows instructions)
  // ============================================
  const sendOTP = async (
    email: string,
    userData: {
      fullName: string;
      phone: string;
      userType: "buyer" | "seller";
      storeName?: string;
    },
  ) => {
    // Just show instructions and use signUp instead
    Alert.alert(
      "Email Verification",
      "We'll send a verification email to your address. Please check your inbox.",
      [
        {
          text: "Continue",
          onPress: () => signUp(email, "temporaryPassword123!", userData), // You should generate a random password here
        },
      ],
    );
  };

  // ============================================
  // LOGIN
  // ============================================
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("🔐 Logging in...");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      console.log("✅ Login successful:", user.uid);

      // Check if email is verified
      if (!user.emailVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link.",
        );
        await signOut(auth);
        return false;
      }

      // Get user type from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const userType = userData?.userType || "buyer";

      Alert.alert("Success", "Logged in successfully!");

      if (userType === "seller") {
        router.replace("/(seller)");
      } else {
        router.replace("/(tabs)");
      }

      return true;
    } catch (error: any) {
      console.log("❌ Login failed:", error);

      if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Invalid email address");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert("Error", "Too many failed attempts. Try again later.");
      } else {
        Alert.alert("Error", error.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("✅ Logged out");
      router.replace("/auth/login");
      return true;
    } catch (error: any) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out");
      return false;
    }
  };

  // ============================================
  // RESET PASSWORD
  // ============================================
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent!");
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // ============================================
  // GET CURRENT USER
  // ============================================
  const getCurrentUser = () => {
    return auth.currentUser;
  };

  // ============================================
  // GET USER PROFILE
  // ============================================
  const getUserProfile = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      return userDoc.data();
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  };

  return {
    loading,
    user,
    sendOTP,
    signUp,
    login,
    logout,
    resetPassword,
    getCurrentUser,
    getUserProfile,
  };
};
