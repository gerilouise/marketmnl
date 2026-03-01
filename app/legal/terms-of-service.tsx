// app/legal/terms-of-service.tsx
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

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
            Welcome to MarketMNL ("Company," "we," "our," "us"). These Terms of Service ("Terms") govern your use of our mobile application, website, and services (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms. If you do not agree, please do not use our Platform.
          </Text>
        </View>

        {/* Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.text}>By using our Platform, you represent and warrant that:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You are at least 18 years of age</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You have the legal capacity to enter into binding contracts</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You will provide accurate and complete information</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Your use of the Platform complies with all applicable laws</Text>
          </View>
        </View>

        {/* Account Registration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Account Registration</Text>
          <Text style={styles.text}>
            To access certain features, you must create an account. You are responsible for:
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Maintaining the confidentiality of your account credentials</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>All activities that occur under your account</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Notifying us immediately of any unauthorized use</Text>
          </View>
          <Text style={styles.text}>
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </Text>
        </View>

        {/* User Conduct */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Conduct</Text>
          <Text style={styles.text}>You agree not to:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Use the Platform for any illegal purpose</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Harass, abuse, or harm other users</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Post false, misleading, or fraudulent content</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Interfere with the proper functioning of the Platform</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Attempt to gain unauthorized access to our systems</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Copy, modify, or distribute our content without permission</Text>
          </View>
        </View>

        {/* Buying and Selling */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Buying and Selling</Text>
          
          <Text style={styles.subTitle}>5.1 For Buyers</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You agree to pay for all purchases made through your account</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>All sales are final unless the item is damaged or defective</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You will provide accurate shipping information</Text>
          </View>

          <Text style={styles.subTitle}>5.2 For Sellers</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You must have the legal right to sell your products</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Products must be accurately described and depicted</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You are responsible for fulfilling orders promptly</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Sellers must comply with our separate Seller Agreement</Text>
          </View>
        </View>

        {/* Payments and Fees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Payments and Fees</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>All prices are in Philippine Peso (₱)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Payment methods include cash on delivery, GCash, and credit cards</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Sellers agree to pay applicable commission fees as outlined in the Seller Agreement</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>We may modify fees with 30 days' notice</Text>
          </View>
        </View>

        {/* Shipping and Delivery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Shipping and Delivery</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Shipping times are estimates, not guarantees</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Risk of loss passes to buyer upon delivery</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Sellers are responsible for providing tracking information</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>We are not liable for shipping delays or errors by third-party carriers</Text>
          </View>
        </View>

        {/* Returns and Refunds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Returns and Refunds</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Buyers may request returns for damaged or defective items within 7 days of delivery</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Sellers must process refunds within 3 business days of return receipt</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>We may mediate disputes between buyers and sellers</Text>
          </View>
        </View>

        {/* Intellectual Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
          <Text style={styles.text}>
            The Platform and its content (excluding user content) are owned by MarketMNL and protected by intellectual property laws. You may not:
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Use our trademarks without written permission</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Copy or reproduce any part of the Platform</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Reverse engineer our applications</Text>
          </View>
        </View>

        {/* Third-Party Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Third-Party Links</Text>
          <Text style={styles.text}>
            Our Platform may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of these third parties. Your use of third-party services is at your own risk.
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Termination</Text>
          <Text style={styles.text}>
            We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may terminate your account at any time by contacting us.
          </Text>
        </View>

        {/* Disclaimer of Warranties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Disclaimer of Warranties</Text>
          <Text style={styles.text}>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Limitation of Liability</Text>
          <Text style={styles.text}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MARKETMNL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Your use or inability to use the Platform</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Any conduct or content of any third party</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Unauthorized access to your content</Text>
          </View>
        </View>

        {/* Indemnification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Indemnification</Text>
          <Text style={styles.text}>
            You agree to indemnify and hold harmless MarketMNL, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses arising out of your use of the Platform, your violation of these Terms, or your violation of any rights of another.
          </Text>
        </View>

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Governing Law</Text>
          <Text style={styles.text}>
            These Terms shall be governed by the laws of the Republic of the Philippines. Any disputes shall be resolved in the courts of Quezon City, Metro Manila.
          </Text>
        </View>

        {/* Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Changes to Terms</Text>
          <Text style={styles.text}>
            We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Platform. Your continued use after such changes constitutes your acceptance of the new Terms.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. Contact Us</Text>
          <Text style={styles.text}>For questions about these Terms, please contact:</Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactText}>MarketMNL</Text>
            <Text style={styles.contactText}>Email: support@marketmnl.com</Text>
            <Text style={styles.contactText}>Phone: +63 (2) 1234 5678</Text>
            <Text style={styles.contactText}>Address: 11 Chico St., Brgy. Quirino 2-A, Quezon City, Metro Manila 1102</Text>
          </View>
        </View>

        {/* Acceptance */}
        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceText}>
            By creating an account or using our Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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