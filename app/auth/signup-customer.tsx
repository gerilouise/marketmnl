import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupCustomerScreen() {
  const [userType, setUserType] = useState("buyer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // OTP related states - 8 DIGITS
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]); // 8 empty strings
  const inputRefs = useRef<(TextInput | null)[]>(Array(8).fill(null)); // 8 refs
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { loading, sendOTP, verifyOTP, resendOTP } = useAuth();

  // Timer for OTP resend
  useEffect(() => {
    let intervalId: any;
    if (showOTP && timer > 0 && !canResend) {
      intervalId = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showOTP, timer, canResend]);

  const validatePassword = () => {
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    if (!agreeTerms) {
      Alert.alert(
        "Error",
        "Please agree to the Terms of Service and Privacy Policy",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Send OTP using the hook
    await sendOTP(email, "buyer");

    // Show OTP input section
    setShowOTP(true);
    setTimer(60);
    setCanResend(false);
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 7) {
      // 8 digits, so last index is 7
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length === 8) {
      // You can pass password to verifyOTP if needed
      await verifyOTP(otpString);
    } else {
      Alert.alert("Error", "Please enter the 8-digit verification code");
    }
  };

  const handleResendOTP = async () => {
    await resendOTP("buyer");
    setTimer(60);
    setCanResend(false);
    setOtp(["", "", "", "", "", "", "", ""]); // Reset to 8 empty strings
    inputRefs.current[0]?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const setInputRef = (index: number) => (ref: TextInput | null) => {
    inputRefs.current[index] = ref;
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return { text: "Too short", color: "#FF3B30" };
    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password)
    ) {
      return { text: "Strong", color: "#4CAF50" };
    }
    if (password.length >= 8) {
      return { text: "Medium", color: "#FFA500" };
    }
    return { text: "Weak", color: "#FF3B30" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* User Type Toggle */}
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === "buyer" && styles.userTypeActive,
              ]}
              onPress={() => setUserType("buyer")}
            >
              <Ionicons
                name="cart-outline"
                size={20}
                color={userType === "buyer" ? "#32221B" : "#8F796F"}
                style={styles.userTypeIcon}
              />
              <Text
                style={[
                  styles.userTypeText,
                  userType === "buyer" && styles.userTypeTextActive,
                ]}
              >
                Buyer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userTypeButton]}
              onPress={() => router.push("/auth/signup-seller")}
            >
              <Ionicons
                name="storefront-outline"
                size={20}
                color="#8F796F"
                style={styles.userTypeIcon}
              />
              <Text style={styles.userTypeText}>Seller</Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>

            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#8F796F"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#8F796F"
                  editable={!loading && !showOTP}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#8F796F"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="juan@email.com"
                  placeholderTextColor="#8F796F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading && !showOTP}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#8F796F"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+63 906 561 6297"
                  placeholderTextColor="#8F796F"
                  keyboardType="phone-pad"
                  editable={!loading && !showOTP}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#8F796F"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#8F796F"
                  secureTextEntry={!showPassword}
                  editable={!loading && !showOTP}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8F796F"
                  />
                </TouchableOpacity>
              </View>
              {/* Password strength indicator */}
              {passwordStrength && !showOTP && (
                <View style={styles.strengthContainer}>
                  <Text
                    style={[
                      styles.strengthText,
                      { color: passwordStrength.color },
                    ]}
                  >
                    Password strength: {passwordStrength.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#8F796F"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#8F796F"
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading && !showOTP}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#8F796F"
                  />
                </TouchableOpacity>
              </View>
              {/* Password match indicator */}
              {confirmPassword.length > 0 && !showOTP && (
                <View style={styles.matchContainer}>
                  {password === confirmPassword ? (
                    <Text style={styles.matchText}>✓ Passwords match</Text>
                  ) : (
                    <Text style={styles.noMatchText}>
                      ✗ Passwords do not match
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Send OTP Button */}
            {!showOTP && (
              <TouchableOpacity
                style={[
                  styles.sendOTPButtonFull,
                  loading && styles.sendOTPButtonDisabled,
                ]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.sendOTPButtonText}>
                    Send Verification Code
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* OTP Input Section - Only shows after Send OTP is clicked */}
            {showOTP && (
              <View style={styles.otpSection}>
                <View style={styles.divider} />

                <Text style={styles.otpTitle}>Enter Verification Code</Text>
                <Text style={styles.otpSubtitle}>
                  We've sent an 8-digit code to {email}
                </Text>

                {/* OTP Input Boxes - 8 boxes */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={setInputRef(index)}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!loading}
                    />
                  ))}
                </View>

                {/* Timer and Resend */}
                {!canResend ? (
                  <Text style={styles.timerText}>
                    Resend code in {formatTime(timer)}
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={loading}
                  >
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (otp.join("").length !== 8 || loading) &&
                      styles.verifyButtonDisabled,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={otp.join("").length !== 8 || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      Verify & Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Terms Agreement - Hide when OTP is shown */}
            {!showOTP && (
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAgreeTerms(!agreeTerms)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreeTerms && styles.checkboxChecked,
                  ]}
                >
                  {agreeTerms && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push("/legal/terms-of-service")}
                  >
                    Terms of Service
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push("/legal/privacy-policy")}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: -40,
  },
  userTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#E0DAD1",
    borderRadius: 15,
    padding: 4,
    marginBottom: 20,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  userTypeIcon: {
    marginRight: 8,
  },
  userTypeActive: {
    backgroundColor: "#FAF8F4",
  },
  userTypeText: {
    fontSize: 14,
    color: "#8F796F",
    fontWeight: "500",
  },
  userTypeTextActive: {
    color: "#32221B",
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#32221B",
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#32221B",
    marginBottom: 6,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0EB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#32221B",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 14,
  },
  strengthContainer: {
    marginTop: 4,
    marginLeft: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "500",
  },
  matchContainer: {
    marginTop: 4,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  noMatchText: {
    fontSize: 12,
    color: "#FF3B30",
    fontWeight: "500",
  },
  sendOTPButtonFull: {
    backgroundColor: "#C35822",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  sendOTPButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  sendOTPButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  otpSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0DAD1",
    marginVertical: 20,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
    marginBottom: 8,
    textAlign: "center",
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 20,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  otpInput: {
    width: 38,
    height: 48,
    backgroundColor: "#F5F0EB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0DAD1",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#32221B",
  },
  timerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#8F796F",
    marginBottom: 16,
  },
  resendText: {
    textAlign: "center",
    fontSize: 16,
    color: "#C35822",
    fontWeight: "600",
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: "#C35822",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  verifyButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#C35822",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#C35822",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
  },
  termsLink: {
    color: "#C35822",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#8F796F",
    fontSize: 14,
  },
  loginLink: {
    color: "#C35822",
    fontSize: 14,
    fontWeight: "600",
  },
});
