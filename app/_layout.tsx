// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="loading" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(seller)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
      <Stack.Screen name="orders/index" options={{ headerShown: false }} />
      <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="address/index" options={{ headerShown: false }} />
      <Stack.Screen name="address/add" options={{ headerShown: false }} />
      <Stack.Screen name="address/edit/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reviews/index" options={{ headerShown: false }} />
      <Stack.Screen name="reviews/write" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="seller/products-add" options={{ headerShown: false }} />
      <Stack.Screen name="legal/terms-of-service" options={{ headerShown: false }} />
      <Stack.Screen name="legal/privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="legal/seller-agreement" options={{ headerShown: false }} />
    </Stack>
  );
}