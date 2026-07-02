import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParams } from "@/navigation/AuthStack";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/theme";
import { login } from "@/api/endpoints/auth";
import { getMe } from "@/api/endpoints/account";
import { useAuthStore } from "@/auth/store";
import { connect as connectRealtime } from "@/auth/realtime";
import { ApiError } from "@/api/client";
import { getGlobalError } from "@/lib/problem";

type Props = NativeStackScreenProps<AuthStackParams, "Login">;

interface FormData {
  identifier: string;
  password: string;
}

export function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const { setUser } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setLoading(true);
    setGlobalError("");
    try {
      const isEmail = data.identifier.includes("@");
      await login({
        ...(isEmail ? { email: data.identifier } : { phone: data.identifier }),
        password: data.password,
      });
      const me = await getMe();
      setUser(me);
      connectRealtime().catch(() => {});
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(getGlobalError(err.problem) || "Invalid credentials. Please try again.");
      } else {
        setGlobalError("Can't reach HASTI. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h2" style={styles.title}>
          Welcome back
        </Text>
        <Text variant="body" muted style={styles.subtitle}>
          Sign in to continue to HASTI
        </Text>

        {globalError ? (
          <View style={styles.errorBanner}>
            <Text variant="bodySm" style={{ color: colors.error }}>
              {globalError}
            </Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="identifier"
          rules={{ required: "Email or phone is required" }}
          render={({ field }) => (
            <Input
              label="Email or phone"
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              error={errors.identifier?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{ required: "Password is required" }}
          render={({ field }) => (
            <Input
              label="Password"
              placeholder="Your password"
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              error={errors.password?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.forgotLink}
        >
          <Text variant="bodySm" style={{ color: colors.blue }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <Button
          label="Sign in"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        />

        <View style={styles.registerRow}>
          <Text variant="bodySm" muted>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text variant="bodySm" style={{ color: colors.blue }}>
              Create one
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingTop: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
  errorBanner: {
    backgroundColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: spacing.base,
    marginTop: -spacing.sm,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.base,
  },
});
