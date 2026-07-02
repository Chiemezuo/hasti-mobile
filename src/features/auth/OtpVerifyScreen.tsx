import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParams } from "@/navigation/AuthStack";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radii, fonts } from "@/theme";
import { verifyOtp, requestOtp, login } from "@/api/endpoints/auth";
import { getMe } from "@/api/endpoints/account";
import { useAuthStore } from "@/auth/store";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AuthStackParams, "OtpVerify">;

const CODE_LENGTH = 6;

export function OtpVerifyScreen({ route, navigation }: Props) {
  const { identifier, purpose } = route.params;
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  function handleChange(text: string, index: number) {
    // Handle paste
    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = text.replace(/\D/g, "");
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function identifierField(): { email: string } | { phone: string } {
    return identifier.includes("@") ? { email: identifier } : { phone: identifier };
  }

  async function handleVerify() {
    const fullCode = code.join("");
    if (fullCode.length < CODE_LENGTH) {
      setError("Enter the full 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyOtp({ ...identifierField(), purpose, code: fullCode });

      if (purpose === "SIGNUP") {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else if (purpose === "RESET") {
        navigation.navigate("ResetPassword", { identifier });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.problem.title || "Invalid code. Please try again.");
      } else {
        setError("Can't verify. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await requestOtp({ ...identifierField(), purpose });
      setCooldown(60);
    } catch {
      setError("Failed to resend. Try again shortly.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text variant="h2" style={styles.title}>
          Enter code
        </Text>
        <Text variant="body" muted style={styles.subtitle}>
          We sent a 6-digit code to{"\n"}
          <Text variant="body" style={{ color: colors.ink }}>
            {identifier}
          </Text>
        </Text>

        <View style={styles.otpRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(r) => { inputRefs.current[index] = r; }}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={(t) => handleChange(t, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              selectTextOnFocus
              accessibilityLabel={`Digit ${index + 1}`}
            />
          ))}
        </View>

        {error ? (
          <Text variant="bodySm" style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Verify code"
          onPress={handleVerify}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={cooldown > 0}
          style={styles.resendButton}
        >
          <Text
            variant="bodySm"
            style={{ color: cooldown > 0 ? colors.muted : colors.blue }}
          >
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.base,
    paddingTop: spacing.xl,
  },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
  otpRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.base,
  },
  otpBox: {
    flex: 1,
    height: 56,
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    textAlign: "center",
    fontSize: 24,
    fontFamily: fonts.hankenBold,
    color: colors.ink,
  },
  otpBoxFilled: {
    borderColor: colors.blue,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.base,
  },
  button: { marginTop: spacing.sm },
  resendButton: {
    alignItems: "center",
    marginTop: spacing.base,
  },
});
