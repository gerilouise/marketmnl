// hooks/useFirebaseProfile.ts
import { auth, db, storage } from "@/lib/firebase";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

export interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  age?: number;
  birthdate?: string;
  userType: string;
  photoURL?: string;
  createdAt: Date;
  // Counts
  ordersCount: number;
  reviewsCount: number;
  wishlistCount: number;
  addressesCount: number;
}

export interface AddressData {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
  isDefault: boolean;
  label: string;
  createdAt: Date;
}

export const useFirebaseProfile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log("Fetching profile for user:", user.uid);

      // Get profile data
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        console.log("Profile doesn't exist, creating...");

        // Create profile if it doesn't exist
        const nameParts = (user.displayName || "").split(" ");
        const newProfile = {
          id: user.uid,
          email: user.email || "",
          fullName: user.displayName || "",
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          phone: "",
          userType: "buyer",
          photoURL: null,
          createdAt: Timestamp.now(),
          ordersCount: 0,
          reviewsCount: 0,
          wishlistCount: 0,
          addressesCount: 0,
        };

        await setDoc(profileRef, newProfile);

        setProfile({
          ...newProfile,
          createdAt: new Date(),
        } as ProfileData);
      } else {
        const data = profileSnap.data();
        console.log("Profile data from Firebase:", data);

        // Get counts from subcollections
        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
        );
        const ordersSnap = await getDocs(ordersQuery);

        const reviewsQuery = query(
          collection(db, "reviews"),
          where("userId", "==", user.uid),
        );
        const reviewsSnap = await getDocs(reviewsQuery);

        const wishlistQuery = query(
          collection(db, "wishlists"),
          where("userId", "==", user.uid),
        );
        const wishlistSnap = await getDocs(wishlistQuery);

        // Split fullName into first and last if not already present
        const firstName =
          data.firstName || (data.fullName ? data.fullName.split(" ")[0] : "");
        const lastName =
          data.lastName ||
          (data.fullName ? data.fullName.split(" ").slice(1).join(" ") : "");

        setProfile({
          id: profileSnap.id,
          email: data.email || "",
          fullName: data.fullName || "",
          firstName,
          lastName,
          phone: data.phone || "",
          age: data.age,
          birthdate: data.birthdate,
          userType: data.userType || "buyer",
          photoURL: data.photoURL,
          createdAt: data.createdAt?.toDate() || new Date(),
          ordersCount: ordersSnap.size,
          reviewsCount: reviewsSnap.size,
          wishlistCount: wishlistSnap.size,
          addressesCount: 0,
        });
      }

      await fetchAddresses();
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses - FIXED VERSION (no index required)
  const fetchAddresses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Simple query WITHOUT orderBy to avoid index error
      const addressesRef = collection(db, "addresses");
      const q = query(
        addressesRef,
        where("userId", "==", user.uid),
        // REMOVED: orderBy("isDefault", "desc"), orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);

      const addressesList: AddressData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        addressesList.push({
          id: doc.id,
          userId: data.userId || "",
          fullName: data.fullName || "",
          phone: data.phone || "",
          street: data.street || "",
          barangay: data.barangay || "",
          city: data.city || "",
          province: data.province || "",
          zipCode: data.zipCode || "",
          isDefault: data.isDefault || false,
          label: data.label || "Home",
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Sort manually in JavaScript (default first, then newest first)
      addressesList.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setAddresses(addressesList);

      // Update profile with addresses count
      if (profile) {
        setProfile({
          ...profile,
          addressesCount: addressesList.length,
        });
      }
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<ProfileData>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      // Combine first and last name
      let fullName = updates.fullName;
      if (updates.firstName && updates.lastName) {
        fullName = `${updates.firstName} ${updates.lastName}`.trim();
      } else if (updates.firstName) {
        fullName = updates.firstName;
      }

      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, {
        ...updates,
        fullName,
        updatedAt: Timestamp.now(),
      });

      Alert.alert("Success", "Profile updated successfully!");
      await fetchProfile();
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // Add address
  const addAddress = async (
    address: Omit<AddressData, "id" | "userId" | "createdAt">,
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      // If this is the first address or marked as default, update others
      if (address.isDefault) {
        const addressesRef = collection(db, "addresses");
        const q = query(addressesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const updatePromises: Promise<any>[] = [];
        querySnapshot.forEach((doc) => {
          updatePromises.push(updateDoc(doc.ref, { isDefault: false }));
        });

        await Promise.all(updatePromises);
      }

      const addressesRef = collection(db, "addresses");
      const newAddress = {
        ...address,
        userId: user.uid,
        createdAt: Timestamp.now(),
      };

      await addDoc(addressesRef, newAddress);

      Alert.alert("Success", "Address added successfully!");
      await fetchAddresses();
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // Update address
  const updateAddress = async (
    addressId: string,
    updates: Partial<AddressData>,
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      // If setting as default, update others
      if (updates.isDefault) {
        const addressesRef = collection(db, "addresses");
        const q = query(addressesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const updatePromises: Promise<any>[] = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== addressId) {
            updatePromises.push(updateDoc(doc.ref, { isDefault: false }));
          }
        });

        await Promise.all(updatePromises);
      }

      const addressRef = doc(db, "addresses", addressId);
      await updateDoc(addressRef, updates);

      Alert.alert("Success", "Address updated successfully!");
      await fetchAddresses();
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // Delete address
  const deleteAddress = async (addressId: string) => {
    try {
      const addressRef = doc(db, "addresses", addressId);
      await deleteDoc(addressRef);

      Alert.alert("Success", "Address deleted successfully!");
      await fetchAddresses();
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // Set default address
  const setDefaultAddress = async (addressId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      // Remove default from all addresses
      const addressesRef = collection(db, "addresses");
      const q = query(addressesRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const updatePromises: Promise<any>[] = [];
      querySnapshot.forEach((doc) => {
        updatePromises.push(updateDoc(doc.ref, { isDefault: false }));
      });

      await Promise.all(updatePromises);

      // Set new default
      const addressRef = doc(db, "addresses", addressId);
      await updateDoc(addressRef, { isDefault: true });

      await fetchAddresses();
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return false;
    }
  };

  // ============================================
  // Profile Picture Functions
  // ============================================

  // Request permission for image picker
  const requestImagePickerPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload a photo.",
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const hasPermission = await requestImagePickerPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        // Compress and resize image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        return manipulatedImage.uri;
      }
      return null;
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
      return null;
    }
  };

  // Upload profile picture to Firebase Storage
  const uploadProfilePicture = async (imageUri: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      setLoading(true);

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create storage reference
      const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);

      // Upload image
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user profile in Firestore with photo URL
      const userRef = doc(db, "profiles", user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: Timestamp.now(),
      });

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          photoURL: downloadURL,
        });
      }

      Alert.alert("Success", "Profile picture updated successfully!");
      return downloadURL;
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      Alert.alert("Error", error.message || "Failed to upload profile picture");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete profile picture
  const deleteProfilePicture = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      setLoading(true);

      // Delete from storage
      const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);
      await deleteObject(storageRef);

      // Update user profile in Firestore
      const userRef = doc(db, "profiles", user.uid);
      await updateDoc(userRef, {
        photoURL: null,
        updatedAt: Timestamp.now(),
      });

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          photoURL: undefined,
        });
      }

      Alert.alert("Success", "Profile picture removed successfully!");
      return true;
    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      Alert.alert("Error", error.message || "Failed to delete profile picture");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    addresses,
    loading,
    error,
    fetchProfile,
    fetchAddresses,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    pickImage,
    uploadProfilePicture,
    deleteProfilePicture,
  };
};
