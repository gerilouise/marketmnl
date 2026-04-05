// hooks/useSellerProfile.ts
import { useState } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export const useSellerProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
      
      const profileData = {
        ...userDoc.data(),
        ...sellerDoc.data(),
        uid: user.uid,
        email: user.email,
      };
      
      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');

      // Update users collection
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: updates.fullName,
        phone: updates.phone,
        updatedAt: new Date().toISOString(),
      });

      // Update sellers collection
      await updateDoc(doc(db, 'sellers', user.uid), {
        storeName: updates.storeName,
        storeDescription: updates.storeDescription,
        location: updates.location,
        avatar: updates.avatar,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setProfile((prev: any) => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access gallery is required!');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');

      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const filename = `avatar_${Date.now()}.jpg`;
      const storageRef = ref(storage, `sellers/${user.uid}/${filename}`);
      
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const deleteProfilePicture = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      
      // Get current avatar URL
      const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
      const currentAvatar = sellerDoc.data()?.avatar;
      
      if (currentAvatar) {
        // Delete from storage
        try {
          const storageRef = ref(storage, currentAvatar);
          await deleteObject(storageRef);
        } catch (error) {
          console.log('Error deleting from storage:', error);
        }
        
        // Update Firestore
        await updateDoc(doc(db, 'sellers', user.uid), {
          avatar: null,
          updatedAt: new Date().toISOString(),
        });
        
        setProfile((prev: any) => ({ ...prev, avatar: null }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }
  };

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    pickImage,
    uploadProfilePicture,
    deleteProfilePicture,
  };
};