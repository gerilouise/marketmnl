// app/loading.tsx
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function LoadingScreen() {
  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // Simulate loading for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Replace with actual auth check from Supabase
      const isLoggedIn = false; // Change to true to test logged-in state
      const userType = 'buyer'; // or 'seller' - this would come from user metadata
      
      if (!isLoggedIn) {
        // Not logged in - go to login
        router.replace('/auth/login');
      } else {
        // Logged in - go to appropriate tab based on user type
        if (userType === 'seller') {
          router.replace('/(seller)');
        } else {
          router.replace('/(tabs)');
        }
      }
    };

    checkAuthAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#C35822" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});