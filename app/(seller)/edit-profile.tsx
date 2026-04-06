// app/(seller)/edit-profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export default function EditProfileScreen() {
  const {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    pickImage,
    uploadProfilePicture,
    deleteProfilePicture,
  } = useSellerProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setStoreName(profile.storeName || "");
      setDescription(profile.storeDescription || "");
      setLocation(profile.location || "");
      setProfileImage(profile.avatar || null);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }
    if (!storeName.trim()) {
      Alert.alert("Error", "Please enter your store name");
      return;
    }

    setSaving(true);

    try {
      let finalPhotoURL = profileImage;

      if (newImageUri) {
        const uploadedUrl = await uploadProfilePicture(newImageUri);
        if (uploadedUrl) {
          finalPhotoURL = uploadedUrl;
        } else {
          Alert.alert("Error", "Failed to upload profile picture");
          setSaving(false);
          return;
        }
      }

      const updates = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        storeName: storeName.trim(),
        storeDescription: description.trim() || null,
        location: location.trim() || null,
        avatar: finalPhotoURL,
      };

      const success = await updateProfile(updates);

      if (success) {
        Alert.alert("Success", "Profile updated successfully!");
        router.replace("/(seller)/profile");
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        setUploadingImage(true);
        setNewImageUri(imageUri);
        setProfileImage(imageUri);
        setUploadingImage(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setUploadingImage(true);
            const success = await deleteProfilePicture();
            if (success) {
              setProfileImage(null);
              setNewImageUri(null);
            }
            setUploadingImage(false);
          },
        },
      ],
    );
  };

  const handleGoBack = () => {
    router.replace("/(seller)/profile");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35822" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving || uploadingImage}
        >
          {saving || uploadingImage ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="storefront-outline" size={50} color="#8F796F" />
              </View>
            )}

            {/* Upload overlay */}
            <View style={styles.imageOverlay}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="camera" size={24} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.profileImageHint}>
            Tap to change profile picture
          </Text>

          {profileImage && (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleDeleteImage}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={styles.removeImageText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+63 912 345 6789"
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>
        </View>

        {/* Store Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Enter your store name"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your store..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Quezon City"
              editable={!saving}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FBF8F4",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#C35822",
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#8F796F",
  },
  scrollContainer: {
    padding: 20,
  },
  // Profile Picture Styles
  profileImageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#C35822",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E0DAD1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#C35822",
    borderStyle: "dashed",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#C35822",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  profileImageHint: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 8,
  },
  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
  },
  removeImageText: {
    fontSize: 12,
    color: "#FF3B30",
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#32221B",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F5F0EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});