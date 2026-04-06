// app/components/PayMongoWebView.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";

interface PayMongoWebViewProps {
  visible: boolean;
  checkoutUrl: string;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: (error: string) => void;
}

export default function PayMongoWebView({
  visible,
  checkoutUrl,
  onClose,
  onSuccess,
  onFailure,
}: PayMongoWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    console.log("🔗 WebView navigated to:", url);

    // Check if payment was successful
    if (url.includes("payment-success") || url.includes("success")) {
      console.log("✅ Payment successful! Processing order...");
      onSuccess();
      onClose();
    }

    // Check if payment failed
    if (url.includes("payment-failed") || url.includes("failed")) {
      console.log("❌ Payment failed");
      onFailure("Payment failed. Please try again.");
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#32221B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C35822" />
            <Text style={styles.loadingText}>Loading payment gateway...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          style={styles.webview}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0DAD1",
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8F796F",
  },
  webview: {
    flex: 1,
  },
});
