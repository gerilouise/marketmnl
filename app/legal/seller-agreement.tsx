// app/legal/seller-agreement.tsx
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

export default function SellerAgreementScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Agreement</Text>
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
            Welcome to MarketMNL. This Seller Agreement ("Agreement") is a legal contract between you ("Seller," "you," or "your") and MarketMNL, Ltd. ("Company," "we," "us," or "our") governing your participation as a seller on our platform.
          </Text>
          <Text style={styles.text}>
            By clicking "I Agree" or by using our services to list and sell products, you agree to be bound by the terms and conditions of this Agreement. If you do not agree, you may not register as a seller or use our seller services.
          </Text>
        </View>

        {/* Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.text}>To register as a seller, you must:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Be at least 18 years of age</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Have the legal capacity to enter into binding contracts</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Provide accurate and complete registration information</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Maintain a valid payment method for receiving funds</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Comply with all applicable laws and regulations</Text>
          </View>
        </View>

        {/* Seller Obligations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Seller Obligations</Text>
          <Text style={styles.text}>As a seller on our platform, you agree to:</Text>
          
          <Text style={styles.subTitle}>3.1 Product Listings</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Provide accurate, complete, and current product descriptions</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Include clear and truthful product images</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Specify accurate prices in Philippine Peso (₱)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Maintain accurate inventory counts</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Clearly indicate any allergens or dietary restrictions</Text>
          </View>

          <Text style={styles.subTitle}>3.2 Product Quality</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Ensure all products meet safety and quality standards</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Provide products that match their descriptions</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Comply with food safety regulations for preserved foods</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Include proper expiration dates and storage instructions</Text>
          </View>

          <Text style={styles.subTitle}>3.3 Order Fulfillment</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Process orders within 24-48 hours of receipt</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Package items securely for shipping</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Provide tracking information when available</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Respond to customer inquiries within 24 hours</Text>
          </View>
        </View>

        {/* Prohibited Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Prohibited Items</Text>
          <Text style={styles.text}>The following items may not be listed for sale:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Counterfeit or unauthorized replicas</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Expired or spoiled food products</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Items prohibited by Philippine law</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Alcohol or tobacco products</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Items that infringe on intellectual property rights</Text>
          </View>
        </View>

        {/* Fees and Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Fees and Payments</Text>
          
          <Text style={styles.subTitle}>5.1 Commission</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>A commission of 10% will be deducted from each completed sale</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Commission is calculated based on the final sale price</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Shipping fees are not subject to commission</Text>
          </View>

          <Text style={styles.subTitle}>5.2 Payment Schedule</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Payouts are processed every Friday</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Minimum payout threshold: ₱500</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Funds are transferred via bank transfer or GCash</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Sellers are responsible for any transfer fees</Text>
          </View>
        </View>

        {/* Returns and Refunds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Returns and Refunds</Text>
          
          <Text style={styles.subTitle}>6.1 Seller Responsibility</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Sellers must accept returns for damaged or defective items</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Refunds must be processed within 3 business days of return receipt</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Sellers may set their own return policies, provided they meet minimum standards</Text>
          </View>

          <Text style={styles.subTitle}>6.2 Disputes</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>We may mediate disputes between buyers and sellers</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Our decision in disputes is final and binding</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Repeated disputes may result in account suspension</Text>
          </View>
        </View>

        {/* Intellectual Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You retain ownership of your product images and descriptions</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You grant us a license to display your products on our platform</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You may not use our trademarks without permission</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>You represent that your products do not infringe on third-party rights</Text>
          </View>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Termination</Text>
          <Text style={styles.text}>We may suspend or terminate your account for:</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Violation of this Agreement</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Fraudulent activity or misrepresentation</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Poor seller performance (e.g., high cancellation rate)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Receiving excessive negative feedback</Text>
          </View>
          <Text style={styles.text}>You may terminate this agreement at any time by closing your seller account.</Text>
        </View>

        {/* Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.text}>
            To the maximum extent permitted by law, Markotsi's Markets, Ltd. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:
          </Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Your use of or inability to use our services</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Any conduct or content of any third party</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Unauthorized access, use, or alteration of your content</Text>
          </View>
        </View>

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.text}>
            This Agreement shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising under or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of Quezon City, Metro Manila.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.text}>For questions about this Agreement, please contact:</Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactText}>MarketMNL, Ltd.</Text>
            <Text style={styles.contactText}>Email: sellers@markotsi.com</Text>
            <Text style={styles.contactText}>Phone: +63 (2) 1234 5678</Text>
            <Text style={styles.contactText}>Address: 11 Chico St., Brgy. Quirino 2-A, Quezon City, Metro Manila 1102</Text>
          </View>
        </View>

        {/* Acceptance */}
        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceText}>
            By clicking "I Agree" during seller registration, you acknowledge that you have read, understood, and agree to be bound by this Seller Agreement.
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
    backgroundColor: "#FBF8F4",
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