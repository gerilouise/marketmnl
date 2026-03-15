import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function LoadingScreen() {
  useEffect(() => {
    // Simple 2 second delay then go to login
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>Taste of Home, Preserved for You</Text>
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
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#8F796F',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  loader: {
    marginTop: 10,
  },
});