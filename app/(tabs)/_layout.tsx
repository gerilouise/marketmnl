// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C35822",
        tabBarInactiveTintColor: "#8F796F",
        tabBarStyle: {
          backgroundColor: "#FAF8F4",
          borderTopWidth: 1,
          borderTopColor: "#E0DAD1",
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* 👇 HIDE THESE TABS FROM NAVBAR 👇 */}
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="chatbot"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="addresses"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="add-address"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="edit-address"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="chat-list"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="chat-detail"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="following"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="order-tracking"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="my-reviews"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}