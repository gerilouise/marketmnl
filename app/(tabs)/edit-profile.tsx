// app/(tabs)/edit-profile.tsx
import { useFirebaseProfile } from "@/hooks/useFirebaseProfile";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
  const {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    pickImage,
    uploadProfilePicture,
    deleteProfilePicture,
  } = useFirebaseProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhone(profile.phone || "");
      setAge(profile.age?.toString() || "");
      setBirthdate(profile.birthdate || "");
      setProfileImage(profile.photoURL || null);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!firstName) {
      Alert.alert("Error", "First name is required");
      return;
    }

    setSaving(true);

    try {
      const updates = {
        firstName,
        lastName,
        phone: phone || null,
        age: age ? parseInt(age) : null,
        birthdate: birthdate || null,
      };

      const success = await updateProfile(updates);

      if (success) {
        router.back();
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
        // Temporarily show the selected image
        setProfileImage(imageUri);

        // Upload to Firebase
        const downloadURL = await uploadProfilePicture(imageUri);
        if (!downloadURL) {
          // If upload failed, revert to previous image
          setProfileImage(profile?.photoURL || null);
        }
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
            const success = await deleteProfilePicture();
            if (success) {
              setProfileImage(null);
            }
          },
        },
      ],
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setBirthdate(formattedDate);

      const today = new Date();
      const birthDate = new Date(selectedDate);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
      setAge(calculatedAge.toString());
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C35822" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          {profile?.email ? `Logged in as: ${profile.email}` : "Not logged in"}
        </Text>
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
                <Ionicons name="person" size={50} color="#8F796F" />
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birthdate</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
              disabled={saving}
            >
              <Text
                style={birthdate ? styles.dateText : styles.placeholderText}
              >
                {birthdate
                  ? new Date(birthdate).toLocaleDateString()
                  : "Select birthdate"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#8F796F" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={age}
              onChangeText={setAge}
              placeholder="Auto-calculated"
              keyboardType="numeric"
              editable={false}
            />
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={birthdate ? new Date(birthdate) : new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
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
  debugContainer: {
    backgroundColor: "#FFF3E0",
    padding: 8,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  debugText: {
    color: "#C35822",
    fontSize: 12,
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
  disabledInput: {
    backgroundColor: "#E9E4E0",
    color: "#8F796F",
  },
  dateInput: {
    backgroundColor: "#F5F0EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#32221B",
    borderWidth: 1,
    borderColor: "#E0DAD1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    color: "#32221B",
  },
  placeholderText: {
    color: "#8F796F",
  },
});
