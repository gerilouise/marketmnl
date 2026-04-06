// app/payment-callback.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function PaymentCallback() {
  const { status, session_id, payment_intent } = useLocalSearchParams();

  useEffect(() => {
    // Wait a moment before redirecting
    const timer = setTimeout(() => {
      if (status === "success") {
        // Navigate back to checkout with success flag
        router.replace(
          "/checkout?payment_success=true&session_id=" + session_id,
        );
      } else {
        // Navigate back to checkout with failure flag
        router.replace("/checkout?payment_failed=true");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [status]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#C35822" />
      <Text style={styles.title}>
        {status === "success" ? "Payment Successful!" : "Processing Payment..."}
      </Text>
      <Text style={styles.message}>
        {status === "success"
          ? "Your payment has been confirmed. Redirecting..."
          : "Please wait while we confirm your payment."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBF8F4",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
    lineHeight: 20,
  },
});
