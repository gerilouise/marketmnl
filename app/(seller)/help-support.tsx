// app/(seller)/help-support.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HelpSupportScreen() {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@marketmnl.com?subject=Support Request');
  };

  const handleFAQ = () => {
    Alert.alert(
      "Frequently Asked Questions",
      "Q: How do I add a product?\nA: Go to Products tab and tap Add Product\n\nQ: How do I view my orders?\nA: Go to Orders tab in your dashboard\n\nQ: How do I edit my store?\nA: Tap Edit Profile in profile screen\n\nQ: How do I contact support?\nA: Use email support option below\n\nQ: How do I update my profile picture?\nA: Go to Edit Profile and tap the camera icon"
    );
  };

  const handleReportProblem = () => {
    Linking.openURL('mailto:support@marketmnl.com?subject=Problem Report');
  };

  const handleAbout = () => {
    Alert.alert(
      "About MarketMNL",
      "MarketMNL is a marketplace for authentic Filipino delicacies.\n\nVersion: 1.0.0\n\n© 2024 MarketMNL. All rights reserved."
    );
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/1234567890?text=Hi%20I%20need%20help%20with%20MarketMNL');
  };

  const SupportOption = ({ icon, title, description, onPress }: any) => (
    <TouchableOpacity style={styles.supportOption} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.supportIcon}>
        <Ionicons name={icon} size={24} color="#C35822" />
      </View>
      <View style={styles.supportContent}>
        <Text style={styles.supportTitle}>{title}</Text>
        <Text style={styles.supportDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C0B7AE" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          <SupportOption
            icon="mail-outline"
            title="Email Support"
            description="Get help via email"
            onPress={handleEmailSupport}
          />
          
          <SupportOption
            icon="logo-whatsapp"
            title="WhatsApp"
            description="Chat with us on WhatsApp"
            onPress={handleWhatsApp}
          />
          
          <SupportOption
            icon="alert-circle-outline"
            title="Report a Problem"
            description="Report bugs or issues"
            onPress={handleReportProblem}
          />
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          
          <SupportOption
            icon="help-circle-outline"
            title="FAQ"
            description="Frequently asked questions"
            onPress={handleFAQ}
          />
          
          <SupportOption
            icon="information-circle-outline"
            title="About MarketMNL"
            description="App version and information"
            onPress={handleAbout}
          />
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencyCard}>
          <Ionicons name="alert-circle" size={32} color="#FF9800" />
          <Text style={styles.emergencyTitle}>Urgent Issue?</Text>
          <Text style={styles.emergencyText}>
            For urgent matters, please call our hotline:
          </Text>
          <Text style={styles.emergencyPhone}>+63 2 8123 4567</Text>
          <Text style={styles.emergencyHours}>
            Available Mon-Sat, 9AM - 6PM
          </Text>
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
  section: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
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
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 12,
    color: "#8F796F",
  },
  emergencyCard: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF9800",
    marginTop: 8,
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emergencyPhone: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF9800",
    marginBottom: 4,
  },
  emergencyHours: {
    fontSize: 11,
    color: "#8F796F",
  },
});