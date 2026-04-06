// app/(tabs)/settings.tsx
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { auth } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  // Change Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const { resetPassword } = useFirebaseAuth();

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    isSwitch = false,
    switchValue,
    onSwitchChange,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    isSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
      disabled={isSwitch}
    >
      <View style={styles.settingRowLeft}>
        <Ionicons name={icon as any} size={22} color="#8F796F" />
        <Text style={styles.settingRowLabel}>{label}</Text>
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#E8E2DC", true: "#C35822" }}
          thumbColor="#FFF"
        />
      ) : (
        <View style={styles.settingRowRight}>
          {value && <Text style={styles.settingRowValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={18} color="#C0B7AE" />
        </View>
      )}
    </TouchableOpacity>
  );

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    try {
      Alert.alert(
        "Reset Password Email",
        "For security, we'll send a password reset link to your email address. Click the link to create a new password.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send Email",
            onPress: async () => {
              const user = auth.currentUser;
              if (user && user.email) {
                const success = await resetPassword(user.email);
                if (success) {
                  Alert.alert(
                    "Email Sent",
                    "We've sent a password reset link to your email. Please check your inbox.",
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          setShowPasswordModal(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        },
                      },
                    ],
                  );
                } else {
                  Alert.alert(
                    "Error",
                    "Failed to send reset email. Please try again.",
                  );
                }
              } else {
                Alert.alert("Error", "No email found for this account.");
              }
            },
          },
        ],
      );
    } catch (error: any) {
      console.error("Error:", error);
      Alert.alert("Error", error.message || "Failed to send reset email");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear temporary data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => Alert.alert("Success", "Cache cleared successfully!"),
        },
      ],
    );
  };

  // Updated: Navigate to chatbot instead of opening email
  const handleContactSupport = () => {
    router.push("/chatbot");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <SettingRow
            icon="notifications-outline"
            label="Push Notifications"
            isSwitch={true}
            switchValue={pushNotifications}
            onSwitchChange={setPushNotifications}
          />

          {pushNotifications && (
            <>
              <SettingRow
                icon="cart-outline"
                label="Order Updates"
                isSwitch={true}
                switchValue={orderUpdates}
                onSwitchChange={setOrderUpdates}
              />
              <SettingRow
                icon="megaphone-outline"
                label="Promotions & Offers"
                isSwitch={true}
                switchValue={promotions}
                onSwitchChange={setPromotions}
              />
            </>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => setShowPasswordModal(true)}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <SettingRow
            icon="chatbubble-outline"
            label="Contact Support"
            onPress={() => router.push("/chatbot?from=settings")}
          />

          <SettingRow
            icon="trash-outline"
            label="Clear Cache"
            onPress={handleClearCache}
          />
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>

          <SettingRow
            icon="information-circle-outline"
            label="App Version"
            value="1.0.0"
          />

          <SettingRow
            icon="star-outline"
            label="Rate Us"
            onPress={() =>
              Alert.alert("Rate Us", "Thank you for supporting MarketMNL!")
            }
          />

          <SettingRow
            icon="share-social-outline"
            label="Share App"
            onPress={() =>
              Alert.alert("Share", "Share MarketMNL with your friends!")
            }
          />

          <SettingRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() =>
              Alert.alert(
                "Privacy Policy",
                "View our privacy policy at marketmnl.com/privacy",
              )
            }
          />

          <SettingRow
            icon="shield-checkmark-outline"
            label="Terms of Service"
            onPress={() =>
              Alert.alert(
                "Terms of Service",
                "View our terms at marketmnl.com/terms",
              )
            }
          />
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPasswordError("");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#32221B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalInfoText}>
                For security, we'll send a password reset link to your email
                address.
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#8F796F"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={(text) => {
                      setCurrentPassword(text);
                      setPasswordError("");
                    }}
                    placeholder="Enter current password"
                    placeholderTextColor="#8F796F"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#8F796F"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setPasswordError("");
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor="#8F796F"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#8F796F"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setPasswordError("");
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor="#8F796F"
                    secureTextEntry
                  />
                </View>
              </View>

              {passwordError !== "" && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  changingPassword && styles.modalButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
    paddingBottom: 12,
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F0EB",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingRowLabel: {
    fontSize: 15,
    color: "#32221B",
    fontWeight: "500",
  },
  settingRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingRowValue: {
    fontSize: 14,
    color: "#8F796F",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "85%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  modalBody: {
    padding: 20,
  },
  modalInfoText: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#32221B",
    marginBottom: 6,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0EB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#32221B",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#FF3B30",
  },
  modalButton: {
    backgroundColor: "#C35822",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  modalButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
