// app/(seller)/settings.tsx
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

export default function SellerSettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    isSwitch,
    switchValue,
    onSwitchChange
  }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={isSwitch}
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
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#E0DAD1", true: "#C35822" }}
          thumbColor="#FFF"
        />
      ) : (
        rightElement || <Ionicons name="chevron-forward" size={20} color="#8F796F" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(seller)/profile")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Switch between light and dark theme"
            isSwitch={true}
            switchValue={darkMode}
            onSwitchChange={setDarkMode}
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Receive updates via email"
            isSwitch={true}
            switchValue={emailNotifications}
            onSwitchChange={setEmailNotifications}
          />

          <SettingItem
            icon="cart-outline"
            title="Order Alerts"
            subtitle="Get notified when new orders arrive"
            isSwitch={true}
            switchValue={orderAlerts}
            onSwitchChange={setOrderAlerts}
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          <SettingItem
            icon="lock-closed-outline"
            title="Privacy Policy"
            onPress={() => Alert.alert("Privacy Policy", "MarketMNL Privacy Policy - Your data is safe with us.")}
          />

          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => Alert.alert("Terms of Service", "MarketMNL Terms and Conditions apply.")}
          />

          <SettingItem
            icon="shield-checkmark-outline"
            title="Security"
            subtitle="Two-factor authentication"
            onPress={() => Alert.alert("Security", "Security settings coming soon!")}
          />
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <SettingItem
            icon="trash-outline"
            title="Clear Cache"
            onPress={() => Alert.alert("Clear Cache", "Cache cleared successfully!")}
          />

          <SettingItem
            icon="download-outline"
            title="Export Data"
            onPress={() => Alert.alert("Export Data", "Your data export will be sent to your email.")}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            icon="information-circle-outline"
            title="App Version"
            rightElement={<Text style={styles.versionText}>1.0.0</Text>}
            onPress={() => {}}
          />

          <SettingItem
            icon="business-outline"
            title="MarketMNL"
            subtitle="Your local marketplace"
            onPress={() => Alert.alert("About", "MarketMNL - Connecting local sellers with buyers")}
          />
        </View>

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
  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#8F796F",
    marginTop: 2,
  },
  versionText: {
    fontSize: 14,
    color: "#8F796F",
  },
  bottomPadding: {
    height: 40,
  },
});