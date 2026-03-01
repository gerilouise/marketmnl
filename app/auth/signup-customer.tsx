import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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

export default function SignupCustomerScreen() {
  const [userType, setUserType] = useState("buyer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const { loading, sendOTP } = useAuth();

  const handleSignup = () => {
    if (!agreeTerms) {
      Alert.alert(
        "Error",
        "Please agree to the Terms of Service and Privacy Policy",
      );
      return;
    }

    if (!fullName || !email || !phone) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    sendOTP(email, "buyer");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

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

        <View style={styles.formContainer}>
          <View style={styles.form}>
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
                  editable={!loading}
                />
              </View>
            </View>

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
                  editable={!loading}
                />
              </View>
            </View>

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
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.noteContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#C35822"
              />
              <Text style={styles.noteText}>
                We'll send a 6-digit verification code to your email
              </Text>
            </View>

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
              disabled={loading}
            >
              <View
                style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
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

            <TouchableOpacity
              style={[
                styles.signupButton,
                (!agreeTerms || loading) && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={!agreeTerms || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBF8F4" },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  logoContainer: { alignItems: "center", marginBottom: 10 },
  logo: { width: 250, height: 250, marginBottom: -70 },
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
  userTypeIcon: { marginRight: 8 },
  userTypeActive: { backgroundColor: "#FAF8F4" },
  userTypeText: { fontSize: 14, color: "#8F796F", fontWeight: "500" },
  userTypeTextActive: { color: "#32221B", fontWeight: "600" },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  form: { width: "100%" },
  inputWrapper: { marginBottom: 15 },
  label: { fontSize: 14, color: "#32221B", marginBottom: 6, fontWeight: "500" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0DAD1",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#32221B" },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  noteText: { flex: 1, marginLeft: 8, fontSize: 13, color: "#C35822" },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
  checkboxChecked: { backgroundColor: "#C35822" },
  termsText: { flex: 1, fontSize: 13, color: "#666" },
  termsLink: {
    color: "#C35822",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  signupButton: {
    backgroundColor: "#C35822",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    shadowColor: "#C35822",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonDisabled: { backgroundColor: "#FFB6A5" },
  signupButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginText: { color: "#8F796F", fontSize: 14 },
  loginLink: { color: "#C35822", fontSize: 14, fontWeight: "600" },
});
