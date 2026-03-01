// app/legal/privacy-policy.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 28, 2026</Text>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.text}>
            MarketMNL ("Company," "we," "our," "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application, website, and services (collectively, the "Platform").
          </Text>
          <Text style={styles.text}>
            Please read this Privacy Policy carefully. By accessing or using our Platform, you consent to the practices described in this policy.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          
          <Text style={styles.subTitle}>2.1 Personal Information</Text>
          <Text style={styles.text}>We may collect the following personal information:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Name and contact information (email address, phone number)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Shipping and billing addresses</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Payment information (processed through secure third-party providers)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Account credentials (username and password)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Profile information (profile picture, store information for sellers)</Text>
          </View>

          <Text style={styles.subTitle}>2.2 Automatically Collected Information</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Device information (device type, operating system, unique device identifiers)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Usage data (pages visited, time spent, interactions)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Log data (IP address, browser type, access times)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Location information (approximate location based on IP address)</Text>
          </View>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.text}>We use your information for the following purposes:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To provide and maintain our Platform</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To process transactions and send order confirmations</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To communicate with you about your account or orders</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To improve our Platform and develop new features</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To personalize your experience</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To detect, prevent, and address technical issues or fraud</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To comply with legal obligations</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>To send promotional communications (with your consent)</Text>
          </View>
        </View>

        {/* Legal Basis for Processing (GDPR Compliance) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Legal Basis for Processing</Text>
          <Text style={styles.text}>If you are in the European Economic Area, our legal basis for processing your information includes:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Performance of a contract with you</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Your consent (which you may withdraw at any time)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Our legitimate business interests</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Compliance with legal obligations</Text>
          </View>
        </View>

        {/* Sharing Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Sharing Your Information</Text>
          <Text style={styles.text}>We may share your information with:</Text>
          
          <Text style={styles.subTitle}>5.1 Sellers</Text>
          <Text style={styles.text}>When you place an order, we share your name, shipping address, and contact information with the seller to fulfill your order.</Text>

          <Text style={styles.subTitle}>5.2 Service Providers</Text>
          <Text style={styles.text}>We engage third-party service providers to perform functions on our behalf, including:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Payment processing (GCash, PayMongo, etc.)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Shipping and logistics partners</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Cloud storage providers</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Analytics services</Text>
          </View>

          <Text style={styles.subTitle}>5.3 Legal Requirements</Text>
          <Text style={styles.text}>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</Text>

          <Text style={styles.subTitle}>5.4 Business Transfers</Text>
          <Text style={styles.text}>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</Text>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Security</Text>
          <Text style={styles.text}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.text}>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we have no ongoing legitimate business need to process your information, we will either delete or anonymize it.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Your Rights</Text>
          <Text style={styles.text}>Depending on your location, you may have the following rights:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Right to access your personal information</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Right to correct inaccurate information</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Right to delete your information</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Right to restrict or object to processing</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Right to data portability</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Right to withdraw consent</Text>
          </View>
          <Text style={styles.text}>
            To exercise these rights, please contact us at privacy@marketmnl.com.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
          <Text style={styles.text}>
            Our Platform is not intended for children under 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us.
          </Text>
        </View>

        {/* Cookies and Tracking Technologies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Cookies and Tracking Technologies</Text>
          <Text style={styles.text}>
            We use cookies and similar tracking technologies to track activity on our Platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Platform.
          </Text>
        </View>

        {/* Third-Party Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Third-Party Links</Text>
          <Text style={styles.text}>
            Our Platform may contain links to third-party websites. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to read the privacy policies of every website you visit.
          </Text>
        </View>

        {/* International Data Transfers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. International Data Transfers</Text>
          <Text style={styles.text}>
            Your information may be transferred to and maintained on servers located outside your country of residence. By using our Platform, you consent to the transfer of your information to countries that may have different data protection laws than your country.
          </Text>
        </View>

        {/* Changes to This Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Changes to This Privacy Policy</Text>
          <Text style={styles.text}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Us</Text>
          <Text style={styles.text}>If you have questions about this Privacy Policy, please contact us:</Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactText}>MarketMNL</Text>
            <Text style={styles.contactText}>Data Protection Officer</Text>
            <Text style={styles.contactText}>Email: privacy@marketmnl.com</Text>
            <Text style={styles.contactText}>Phone: +63 (2) 1234 5678</Text>
            <Text style={styles.contactText}>Address: 11 Chico St., Brgy. Quirino 2-A, Quezon City, Metro Manila 1102</Text>
          </View>
        </View>

        {/* For Philippine Users (NPC Compliance) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. For Philippine Users</Text>
          <Text style={styles.text}>
            In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to be informed, object, access, rectify, and suspend or withdraw your personal information. You may also file a complaint with the National Privacy Commission if you believe your data privacy rights have been violated.
          </Text>
        </View>

        {/* Acceptance */}
        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceText}>
            By using our Platform, you acknowledge that you have read and understood this Privacy Policy.
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#8F796F",
    marginBottom: 20,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#32221B",
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: "#C35822",
    marginRight: 8,
    width: 10,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  contactBox: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E0DAD1",
  },
  contactText: {
    fontSize: 14,
    color: "#32221B",
    marginBottom: 4,
  },
  acceptanceBox: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#C35822",
    backgroundColor: "#FFF8F0",
  },
  acceptanceText: {
    fontSize: 14,
    color: "#32221B",
    lineHeight: 22,
    fontStyle: "italic",
  },
});