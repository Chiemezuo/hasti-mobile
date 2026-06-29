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
import { register } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { getFieldErrors, getGlobalError } from "@/lib/problem";

type Props = NativeStackScreenProps<AuthStackParams, "Register">;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>();

  const password = watch("password");

  async function onSubmit(data: FormData) {
    setLoading(true);
    setGlobalError("");
    try {
      await register({
        email: data.email,
        password: data.password,
        role: "USER",
        acceptTerms: true,
      });
      navigation.navigate("OtpVerify", {
        identifier: data.email,
        purpose: "SIGNUP",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = getFieldErrors(err.problem);
        for (const [field, msg] of Object.entries(fieldErrors)) {
          setError(field as keyof FormData, { message: msg });
        }
        setGlobalError(getGlobalError(err.problem));
      } else {
        setGlobalError("Can't reach HASTI. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h2" style={styles.title}>
          Create your account
        </Text>
        <Text variant="body" muted style={styles.subtitle}>
          Join HASTI to discover and secure property
        </Text>

        {globalError ? (
          <View style={styles.errorBanner}>
            <Text variant="bodySm" style={{ color: colors.error }}>
              {globalError}
            </Text>
          </View>
        ) : null}

        <View style={styles.nameRow}>
          <Controller
            control={control}
            name="firstName"
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Input
                label="First name"
                placeholder="Ada"
                autoCapitalize="words"
                returnKeyType="next"
                error={errors.firstName?.message}
                value={field.value}
                onChangeText={field.onChange}
                containerStyle={{ flex: 1 }}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Input
                label="Last name"
                placeholder="Obi"
                autoCapitalize="words"
                returnKeyType="next"
                error={errors.lastName?.message}
                value={field.value}
                onChangeText={field.onChange}
                containerStyle={{ flex: 1 }}
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email" },
          }}
          render={({ field }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              error={errors.email?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: { value: 8, message: "At least 8 characters" },
            pattern: {
              value: /(?=.*[A-Z])(?=.*\d)/,
              message: "Must include a capital letter and a number",
            },
          }}
          render={({ field }) => (
            <Input
              label="Password"
              placeholder="Choose a strong password"
              secureTextEntry
              returnKeyType="next"
              error={errors.password?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: "Please confirm your password",
            validate: (v) => v === password || "Passwords do not match",
          }}
          render={({ field }) => (
            <Input
              label="Confirm password"
              placeholder="Repeat your password"
              secureTextEntry
              returnKeyType="done"
              error={errors.confirmPassword?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Button
          label="Create account"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        />

        <View style={styles.loginRow}>
          <Text variant="bodySm" muted>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text variant="bodySm" style={{ color: colors.blue }}>
              Sign in
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
  nameRow: { flexDirection: "row", gap: spacing.sm },
  errorBanner: {
    backgroundColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.base,
  },
});
