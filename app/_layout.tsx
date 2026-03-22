// app/_layout.tsx
import { CartProvider } from "@/app/contexts/CartContext";
import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle deep links for email verification
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (url && url.includes("verify")) {
        Alert.alert(
          "Email Verified",
          "Your email has been verified! You can now log in.",
          [
            {
              text: "Go to Login",
              onPress: () => router.replace("/auth/login"),
            },
          ],
        );
      }
    };

    // Add deep link listener
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes("verify")) {
        setTimeout(() => {
          Alert.alert(
            "Email Verified",
            "Your email has been verified! You can now log in.",
            [
              {
                text: "Go to Login",
                onPress: () => router.replace("/auth/login"),
              },
            ],
          );
        }, 1000);
      }
    });

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(seller)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen
          name="seller/products-add"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="legal" options={{ headerShown: false }} />
      </Stack>
    </CartProvider>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brandName}>MarketMNL</Text>
      <Text style={styles.brandTagline}>Preserved Filipino Foods</Text>
      <ActivityIndicator size="large" color="#C35822" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 8,
    textAlign: "center",
  },
  brandTagline: {
    fontSize: 16,
    color: "#8F796F",
    textAlign: "center",
    marginBottom: 50,
  },
  loader: {
    marginTop: 20,
  },
});
