// app/_layout.tsx
import { CartProvider } from "@/app/contexts/CartContext";
import { ChatProvider } from "@/app/contexts/ChatContext";
import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";

export default function RootLayout() {
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

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <CartProvider>
      <ChatProvider>
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
          <Stack.Screen
            name="(tabs)/chat-list"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(tabs)/chat-detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(seller)/chat-list"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(seller)/chat-detail"
            options={{ headerShown: false }}
          />
        </Stack>
      </ChatProvider>
    </CartProvider>
  );
}
