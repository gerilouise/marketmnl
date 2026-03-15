import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [currency, setCurrency] = useState("PHP (₱)");

  const handleChangePassword = () => {
    Alert.alert("Change Password", "Navigate to change password screen");
  };

  const handleChangeLanguage = () => {
    Alert.alert(
      "Select Language",
      "Choose your preferred language",
      [
        { text: "English", onPress: () => setLanguage("English") },
        { text: "Filipino", onPress: () => setLanguage("Filipino") },
        { text: "Cebuano", onPress: () => setLanguage("Cebuano") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleChangeCurrency = () => {
    Alert.alert(
      "Select Currency",
      "Choose your preferred currency",
      [
        { text: "PHP (₱)", onPress: () => setCurrency("PHP (₱)") },
        { text: "USD ($)", onPress: () => setCurrency("USD ($)") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "Are you sure you want to clear app cache? This will not delete your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: () => Alert.alert("Success", "Cache cleared successfully"),
          style: "destructive",
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => Alert.alert("Account Deleted", "Your account has been deleted"),
          style: "destructive",
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    showBorder = true 
  }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, !showBorder && styles.noBorder]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color="#8F796F" />
        </View>
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color="#8F796F" />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <View style={styles.section}>
          <SectionHeader title="Account" />
          
          <SettingItem
            icon="person-outline"
            title="Personal Information"
            subtitle="Name, email, phone number"
            onPress={() => Alert.alert("Personal Info", "Coming soon")}
          />
          
          <SettingItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={handleChangePassword}
          />
          
          <SettingItem
            icon="location-outline"
            title="Shipping Addresses"
            subtitle="Manage your addresses"
            onPress={() => Alert.alert("Addresses", "Navigate to addresses")}
            showBorder={false}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" />
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={22} color="#8F796F" />
              </View>
              <Text style={styles.settingTitle}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#E0DAD1", true: "#C35822" }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={22} color="#8F796F" />
              </View>
              <Text style={styles.settingTitle}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: "#E0DAD1", true: "#C35822" }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.settingItem, styles.noBorder]}>
            <View style={styles.settingItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="megaphone-outline" size={22} color="#8F796F" />
              </View>
              <Text style={styles.settingTitle}>Promotional Emails</Text>
            </View>
            <Switch
              value={promotionalEmails}
              onValueChange={setPromotionalEmails}
              trackColor={{ false: "#E0DAD1", true: "#C35822" }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <SectionHeader title="Preferences" />
          
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#E0DAD1", true: "#C35822" }}
                thumbColor="#FFF"
              />
            }
          />
          
          <SettingItem
            icon="language-outline"
            title="Language"
            subtitle={language}
            onPress={handleChangeLanguage}
          />
          
          <SettingItem
            icon="cash-outline"
            title="Currency"
            subtitle={currency}
            onPress={handleChangeCurrency}
            showBorder={false}
          />
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <SectionHeader title="Privacy & Security" />
          
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={() => Alert.alert("Privacy Policy", "Coming soon")}
          />
          
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => Alert.alert("Terms of Service", "Coming soon")}
          />
          
          <SettingItem
            icon="finger-print-outline"
            title="Biometric Login"
            rightElement={
              <Switch
                value={false}
                onValueChange={() => Alert.alert("Coming Soon", "Biometric login will be available soon")}
                trackColor={{ false: "#E0DAD1", true: "#C35822" }}
                thumbColor="#FFF"
              />
            }
            showBorder={false}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <SectionHeader title="Support" />
          
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => Alert.alert("Help Center", "Coming soon")}
          />
          
          <SettingItem
            icon="chatbubble-outline"
            title="Contact Us"
            subtitle="support@marketmnl.com"
            onPress={() => Alert.alert("Contact", "Email: support@marketmnl.com")}
          />
          
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert("About", "MarketMNL - Preserved Filipino Foods\nVersion 1.0.0")}
            showBorder={false}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <SectionHeader title="Danger Zone" />
          
          <TouchableOpacity 
            style={styles.dangerItem}
            onPress={handleClearCache}
          >
            <View style={styles.dangerItemLeft}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <Text style={styles.dangerTitle}>Clear Cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dangerItem, styles.noBorder]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.dangerItemLeft}>
              <Ionicons name="warning-outline" size={22} color="#FF3B30" />
              <Text style={styles.dangerTitle}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dangerSection: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8F796F",
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    alignItems: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    color: "#32221B",
    fontWeight: "500",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#8F796F",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  dangerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5E5",
  },
  dangerItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dangerTitle: {
    fontSize: 15,
    color: "#FF3B30",
    fontWeight: "500",
  },
  bottomPadding: {
    height: 30,
  },
});