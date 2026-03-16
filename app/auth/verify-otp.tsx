import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const userType = params.userType as string;
  const fullName = params.fullName as string;
  const phone = params.phone as string;
  const storeName = params.storeName as string | undefined;
  const storeDescription = params.storeDescription as string | undefined;

  // Changed from 6 to 8 digits
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { loading, verifyOTP, resendOTP } = useAuth();

  // Timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input - changed from 5 to 7 for 8 digits
    if (text && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    // Changed from 6 to 8
    if (otpString.length === 8) {
      // Prepare user data based on type
      const userData = {
        fullName,
        phone,
        userType,
        ...(userType === "seller" && { storeName, storeDescription }),
      };
      await verifyOTP(otpString, userData);
    } else {
      // Updated error message
      Alert.alert("Error", "Please enter the 8-digit verification code");
    }
  };

  const handleResend = async () => {
    const userData = {
      fullName,
      phone,
      ...(userType === "seller" && { storeName, storeDescription }),
    };
    await resendOTP(userType as "buyer" | "seller", userData);
    setTimer(60);
    setCanResend(false);
    // Reset to 8 empty strings
    setOtp(["", "", "", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#32221B" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="mail-outline" size={60} color="#C35822" />
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent an 8-digit verification code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* OTP Input Boxes - 8 boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
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

          {/* Timer / Resend */}
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend code in {formatTime(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={loading}>
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
            onPress={handleVerify}
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

          <Text style={styles.helpText}>
            Didn't receive the code? Check your spam folder.
          </Text>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#32221B",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8F796F",
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C35822",
    marginTop: 4,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpInput: {
    width: 40, // Slightly smaller to fit 8 boxes
    height: 50,
    backgroundColor: "#FFF",
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
    marginBottom: 24,
  },
  resendText: {
    textAlign: "center",
    fontSize: 16,
    color: "#C35822",
    fontWeight: "600",
    marginBottom: 24,
  },
  verifyButton: {
    backgroundColor: "#C35822",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: "#E0DAD1",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  helpText: {
    textAlign: "center",
    fontSize: 12,
    color: "#8F796F",
  },
});
