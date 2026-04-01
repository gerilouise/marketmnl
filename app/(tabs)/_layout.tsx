// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C35822",
        tabBarInactiveTintColor: "#8F796F",
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          backgroundColor: "#FAF8F4",
          borderTopWidth: 1,
          borderTopColor: "#E0DAD1",
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

      {/* 👇 HIDE ORDERS TAB FROM NAVBAR 👇 */}
      <Tabs.Screen
        name="orders"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      {/* 👇 HIDE CHAT TAB FROM NAVBAR 👇 */}
      <Tabs.Screen
        name="chatbot"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      {/* 👇 EXPLICITLY HIDE THESE SCREENS 👇 */}
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="addresses"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="add-address"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="edit-address"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="chat-list"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="chat-detail"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="following"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
