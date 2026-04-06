// app/(seller)/help-support.tsx
import React, { useState } from "react";
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

export default function SellerHelpSupportScreen() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: "1",
      question: "How do I add a new product?",
      answer: "Go to your Products tab, tap the + button, fill in the product details (name, price, description, images), and tap Save. Your product will be listed immediately.",
    },
    {
      id: "2",
      question: "How do I manage orders?",
      answer: "Go to the Orders tab to see all customer orders. You can update order status from Pending → Confirmed → Shipped → Delivered.",
    },
    {
      id: "3",
      question: "How do I process refunds?",
      answer: "When a customer requests a refund, you'll see it in the Orders section under Refund Requests. Review the request and Approve or Reject accordingly.",
    },
    {
      id: "4",
      question: "How do I edit my store information?",
      answer: "Tap Edit Profile on your Profile page to update your store name, description, location, and profile picture.",
    },
    {
      id: "5",
      question: "How do I promote my products?",
      answer: "Ensure your product listings have clear photos and descriptions. You can also share your store link on social media.",
    },
  ];

  const supportOptions = [
    {
      icon: "chatbubble-outline",
      title: "Live Chat",
      description: "Chat with support (9 AM - 6 PM)",
      onPress: () => Alert.alert("Live Chat", "Connecting to support... (Coming soon)"),
    },
    {
      icon: "mail-outline",
      title: "Email Support",
      description: "seller-support@marketmnl.com",
      onPress: () => Linking.openURL("mailto:seller-support@marketmnl.com"),
    },
    {
      icon: "call-outline",
      title: "Hotline",
      description: "+63 2 1234 5678",
      onPress: () => Linking.openURL("tel:+63212345678"),
    },
    {
      icon: "logo-facebook",
      title: "Facebook Page",
      description: "fb.com/MarketMNL",
      onPress: () => Alert.alert("Facebook", "Opening Facebook page..."),
    },
  ];

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const FaqItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.faqItem} onPress={() => toggleFaq(item.id)}>
      <View style={styles.faqQuestionContainer}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons
          name={expandedFaq === item.id ? "chevron-up" : "chevron-down"}
          size={20}
          color="#8F796F"
        />
      </View>
      {expandedFaq === item.id && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const SupportCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.supportCard} onPress={item.onPress}>
      <View style={styles.supportIconContainer}>
        <Ionicons name={item.icon} size={28} color="#C35822" />
      </View>
      <View style={styles.supportInfo}>
        <Text style={styles.supportTitle}>{item.title}</Text>
        <Text style={styles.supportDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C0B7AE" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(seller)/profile")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#32221B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.sectionDescription}>
            Choose how you'd like to reach us
          </Text>
          
          {supportOptions.map((option, index) => (
            <SupportCard key={index} item={option} />
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq) => (
            <FaqItem key={faq.id} item={faq} />
          ))}
        </View>

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          
          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={() => Alert.alert("Seller Guide", "Seller guide will open here")}
          >
            <Ionicons name="book-outline" size={22} color="#C35822" />
            <Text style={styles.resourceText}>Seller Guide</Text>
            <Ionicons name="chevron-forward" size={20} color="#C0B7AE" style={styles.resourceArrow} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={() => Alert.alert("Video Tutorials", "Tutorials will open here")}
          >
            <Ionicons name="videocam-outline" size={22} color="#C35822" />
            <Text style={styles.resourceText}>Video Tutorials</Text>
            <Ionicons name="chevron-forward" size={20} color="#C0B7AE" style={styles.resourceArrow} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={() => Alert.alert("Community Forum", "Forum will open here")}
          >
            <Ionicons name="people-outline" size={22} color="#C35822" />
            <Text style={styles.resourceText}>Seller Community</Text>
            <Ionicons name="chevron-forward" size={20} color="#C0B7AE" style={styles.resourceArrow} />
          </TouchableOpacity>
        </View>

        {/* Report Issue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report an Issue</Text>
          
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => Alert.alert("Report Issue", "Please describe the issue you're experiencing.")}
          >
            <Ionicons name="flag-outline" size={20} color="#C35822" />
            <Text style={styles.reportButtonText}>Report a Problem</Text>
          </TouchableOpacity>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: "#8F796F",
    marginBottom: 16,
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  supportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  supportInfo: {
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
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  faqQuestionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: "#32221B",
    flex: 1,
    marginRight: 12,
  },
  faqAnswerContainer: {
    marginTop: 8,
    paddingTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#C35822",
  },
  faqAnswer: {
    fontSize: 13,
    color: "#8F796F",
    lineHeight: 18,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    color: "#32221B",
    marginLeft: 12,
  },
  resourceArrow: {
    marginLeft: 8,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF5ED",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#C35822",
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C35822",
  },
  bottomPadding: {
    height: 40,
  },
});