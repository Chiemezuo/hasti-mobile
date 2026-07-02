import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParams } from "@/navigation/AuthStack";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/theme";
import { resetPassword } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";

type Props = NativeStackScreenProps<AuthStackParams, "ResetPassword">;

interface FormData {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordScreen({ route, navigation }: Props) {
  const { identifier } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const newPassword = watch("newPassword");

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");
    try {
      const idField = identifier.includes("@") ? { email: identifier } : { phone: identifier };
      await resetPassword({ ...idField, code: data.code, password: data.newPassword });
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.problem.title || "Failed to reset password.");
      } else {
        setError("Can't reach HASTI. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <Text variant="h2" style={styles.title}>New password</Text>
        <Text variant="body" muted style={styles.subtitle}>
          Enter the code we sent and choose a new password.
        </Text>
        {error ? (
          <View style={styles.errorBanner}>
            <Text variant="bodySm" style={{ color: colors.error }}>{error}</Text>
          </View>
        ) : null}
        <Controller
          control={control}
          name="code"
          rules={{ required: "Code is required", minLength: { value: 6, message: "Enter the 6-digit code" } }}
          render={({ field }) => (
            <Input
              label="Reset code"
              placeholder="123456"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              returnKeyType="next"
              error={errors.code?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          rules={{
            required: "New password is required",
            minLength: { value: 8, message: "At least 8 characters" },
            pattern: { value: /(?=.*[A-Z])(?=.*\d)/, message: "Must include a capital and a number" },
          }}
          render={({ field }) => (
            <Input
              label="New password"
              placeholder="Choose a strong password"
              secureTextEntry
              returnKeyType="next"
              error={errors.newPassword?.message}
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
            validate: (v) => v === newPassword || "Passwords do not match",
          }}
          render={({ field }) => (
            <Input
              label="Confirm password"
              placeholder="Repeat your new password"
              secureTextEntry
              returnKeyType="done"
              error={errors.confirmPassword?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Button label="Reset password" onPress={handleSubmit(onSubmit)} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.base, paddingTop: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
  errorBanner: {
    backgroundColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
});
