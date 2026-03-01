// app/auth/signup-seller.tsx
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function SignupSellerScreen() {
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeSellerAgreement, setAgreeSellerAgreement] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = () => {
    if (!agreeTerms || !agreeSellerAgreement) {
      Alert.alert('Error', 'Please agree to all terms');
      return;
    }

    if (!fullName || !storeName || !email || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // Navigate to OTP verification screen with user data
      router.push({
        pathname: '/auth/verify-otp',
        params: {
          email,
          userType: 'seller',
          fullName,
          phone,
          storeName,
          storeDescription: '',
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const allAgreed = agreeTerms && agreeSellerAgreement;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* User Type Toggle with Icons */}
        <View style={styles.userTypeContainer}>
          <TouchableOpacity 
            style={[styles.userTypeButton]}
            onPress={() => router.push('/auth/signup-customer')}
          >
            <Ionicons 
              name="cart-outline" 
              size={20} 
              color="#8F796F" 
              style={styles.userTypeIcon}
            />
            <Text style={[styles.userTypeText]}>Buyer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.userTypeButton, styles.userTypeActive]}
          >
            <Ionicons 
              name="storefront-outline" 
              size={20} 
              color="#32221B" 
              style={styles.userTypeIcon}
            />
            <Text style={[styles.userTypeText, styles.userTypeTextActive]}>Seller</Text>
          </TouchableOpacity>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8F796F" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#8F796F"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Store Name - Special for sellers */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Store Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#8F796F" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="Your Store Name"
                  placeholderTextColor="#8F796F"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#8F796F" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="juan@email.com"
                  placeholderTextColor="#8F796F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#8F796F" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+63 906 561 8297"
                  placeholderTextColor="#8F796F"
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Note about verification */}
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#C35822" />
              <Text style={styles.noteText}>
                We'll send a verification link to your email
              </Text>
            </View>

            {/* Terms of Service Agreement */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
              disabled={loading}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => router.push('/legal/terms-of-service')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => router.push('/legal/privacy-policy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Seller Agreement */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreeSellerAgreement(!agreeSellerAgreement)}
              disabled={loading}
            >
              <View style={[styles.checkbox, agreeSellerAgreement && styles.checkboxChecked]}>
                {agreeSellerAgreement && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.termsText}>
                I have read and agree to the{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => router.push('/legal/seller-agreement')}
                >
                  Seller Agreement
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Create Account Button */}
            <TouchableOpacity 
              style={[styles.signupButton, (!allAgreed || loading) && styles.signupButtonDisabled]} 
              onPress={handleSignup}
              disabled={!allAgreed || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.signupButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            {/* Note about seller agreement */}
            <Text style={styles.noteText}>
              By creating a seller account, you enter into a legally binding agreement with MarketMNL.
            </Text>
          </View>
        </View>
        
        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F4',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: -70,
  },
  userTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0DAD1',
    borderRadius: 15,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  userTypeIcon: {
    marginRight: 8,
  },
  userTypeActive: {
    backgroundColor: '#FAF8F4',
  },
  userTypeText: {
    fontSize: 14,
    color: '#8F796F',
    fontWeight: '500',
  },
  userTypeTextActive: {
    color: '#32221B',
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#32221B',
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0DAD1',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#32221B',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#C35822',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C35822',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#C35822',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  termsLink: {
    color: '#C35822',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signupButton: {
    backgroundColor: '#C35822',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#C35822',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonDisabled: {
    backgroundColor: '#FFB6A5',
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#8F796F',
    fontSize: 14,
  },
  loginLink: {
    color: '#C35822',
    fontSize: 14,
    fontWeight: '600',
  },
});