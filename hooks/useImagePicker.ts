// hooks/useImagePicker.ts
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform } from "react-native";

export const useImagePicker = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Request permission for gallery
  const requestGalleryPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant gallery permissions to upload images.",
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Request permission for camera
  const requestCameraPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera permissions to take photos.",
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Pick image from gallery (works on both web and mobile)
  const pickImageFromGallery = async () => {
    try {
      // For Web
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/jpg,image/png";
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setSelectedImage(e.target?.result as string);
              Alert.alert("Success", "Image selected!");
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // For Mobile
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        Alert.alert("Success", "Image selected!");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Take photo with camera (mobile only)
  const takePhotoWithCamera = async () => {
    try {
      if (Platform.OS === "web") {
        Alert.alert("Not Available", "Camera is not available on web");
        return;
      }

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        Alert.alert("Success", "Photo taken!");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Show options for selecting image
  const showImagePickerOptions = () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Upload Image",
        "Choose an option",
        [
          { text: "Choose from Gallery", onPress: pickImageFromGallery },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true },
      );
    } else {
      Alert.alert(
        "Upload Image",
        "Choose an option",
        [
          { text: "Take Photo", onPress: takePhotoWithCamera },
          { text: "Choose from Gallery", onPress: pickImageFromGallery },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true },
      );
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
  };

  // Set image directly (for editing existing products)
  const setImage = (uri: string | null) => {
    setSelectedImage(uri);
  };

  return {
    selectedImage,
    uploading,
    setUploading,
    pickImageFromGallery,
    takePhotoWithCamera,
    showImagePickerOptions,
    clearImage,
    setImage,
  };
};
