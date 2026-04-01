// hooks/useFirebaseAuth.ts
import { auth, db } from "@/lib/firebase";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useState } from "react";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export const useFirebaseAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // ============================================
  // GOOGLE SIGN-IN CONFIGURATION
  // ============================================
  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useAuthRequest({
      expoClientId:
        "6849567096-crlf30huc0i74bprblacb3kr5a6ii6an.apps.googleusercontent.com",
      iosClientId:
        "6849567096-crlf30huc0i74bprblacb3kr5a6ii6an.apps.googleusercontent.com",
      androidClientId:
        "6849567096-crlf30huc0i74bprblacb3kr5a6ii6an.apps.googleusercontent.com",
      webClientId:
        "6849567096-crlf30huc0i74bprblacb3kr5a6ii6an.apps.googleusercontent.com",
      scopes: ["profile", "email", "openid"],
      responseType: "id_token",
    });

  // ============================================
  // GOOGLE SIGN-IN FUNCTION - FIXED
  // ============================================
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log("🔐 Starting Google sign in...");

      const result = await googlePromptAsync();

      console.log("Google result:", result);

      if (result?.type === "success") {
        // Try to get id_token from different possible locations
        let id_token = result.params?.id_token;

        // If id_token is not in params, try to get from authentication
        if (!id_token && result.params?.access_token) {
          // For some configurations, we need to exchange access_token
          console.log("No id_token, trying with access_token");
          const credential = GoogleAuthProvider.credential(
            null,
            result.params.access_token,
          );
          const userCredential = await signInWithCredential(auth, credential);
          const firebaseUser = userCredential.user;

          console.log(
            "✅ Google sign in successful with access_token:",
            firebaseUser.uid,
          );
          await handleUserProfile(firebaseUser);
          return true;
        }

        if (id_token) {
          const credential = GoogleAuthProvider.credential(id_token);
          const userCredential = await signInWithCredential(auth, credential);
          const firebaseUser = userCredential.user;

          console.log("✅ Google sign in successful:", firebaseUser.uid);
          await handleUserProfile(firebaseUser);
          return true;
        } else {
          throw new Error("No id_token or access_token received from Google");
        }
      } else if (result?.type === "error") {
        console.log("Google sign in error:", result.error);
        Alert.alert("Error", result.error?.message || "Google sign in failed");
        return false;
      }
      return false;
    } catch (error: any) {
      console.error("❌ Google sign in failed:", error);
      Alert.alert("Error", error.message || "Google sign in failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle user profile
  const handleUserProfile = async (firebaseUser: User) => {
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!userDoc.exists()) {
      const nameParts = firebaseUser.displayName?.split(" ") || ["", ""];
      const profileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || "",
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phone: firebaseUser.phoneNumber || "",
        photoURL: firebaseUser.photoURL,
        userType: "buyer",
        emailVerified: firebaseUser.emailVerified,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), profileData);
      console.log("✅ User profile created in Firestore");
    }

    Alert.alert("Success", "Logged in successfully with Google!");
    router.replace("/(tabs)");
  };

  // ============================================
  // SIGN UP
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

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      console.log("✅ User created in Auth:", user.uid);

      await sendEmailVerification(user);
      console.log("📧 Verification email sent");

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
  // SEND OTP
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
    Alert.alert(
      "Email Verification",
      "We'll send a verification email to your address. Please check your inbox.",
      [
        {
          text: "Continue",
          onPress: () => signUp(email, "temporaryPassword123!", userData),
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

      if (!user.emailVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link.",
        );
        await signOut(auth);
        return false;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const userType = userData?.userType || "buyer";

      Alert.alert("Success", "Logged in successfully!");

      if (userType === "seller") {
        router.replace("/(seller)/dashboard");
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
    signInWithGoogle,
  };
};
