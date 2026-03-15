// app/auth/signup-seller.tsx
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignupSellerScreen() {
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeSellerAgreement, setAgreeSellerAgreement] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!fullName || !storeName || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return false;
    }
    if (!agreeSellerAgreement) {
      Alert.alert('Error', 'Please agree to the Seller Agreement');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            store_name: storeName,
            user_type: 'seller',
          },
        },
      });

      if (error) {
        Alert.alert('Signup Failed', error.message);
      } else {
        Alert.alert(
          'Success!', 
          'Your seller account has been created! Please check your email to verify your account before logging in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
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
            disabled={loading}
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
            disabled={loading}
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

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#8F796F" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#8F796F"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#8F796F" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Hint */}
            <Text style={styles.passwordHint}>Must be at least 8 characters</Text>

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
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating Account...' : 'Create Seller Account'}
              </Text>
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
          <TouchableOpacity onPress={() => router.push('/auth/login')} disabled={loading}>
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
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  passwordHint: {
    color: '#8F796F',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 15,
    marginLeft: 4,
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
  noteText: {
    fontSize: 11,
    color: '#8F796F',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
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