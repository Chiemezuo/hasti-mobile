import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParams } from "@/navigation/AuthStack";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/theme";
import { forgotPassword } from "@/api/endpoints/auth";

type Props = NativeStackScreenProps<AuthStackParams, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<{ identifier: string }>();
  const identifier = watch("identifier");

  async function onSubmit(data: { identifier: string }) {
    setLoading(true);
    const id = data.identifier;
    try {
      await forgotPassword(id.includes("@") ? { email: id } : { phone: id });
      setSent(true);
    } catch {
      // Always show success to prevent enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text variant="h2" style={styles.title}>Check your inbox</Text>
        <Text variant="body" muted style={styles.subtitle}>
          If an account exists for {identifier}, we've sent a reset code.
        </Text>
        <Button
          label="Enter reset code"
          onPress={() => navigation.navigate("OtpVerify", { identifier, purpose: "RESET" })}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text variant="h2" style={styles.title}>Reset password</Text>
        <Text variant="body" muted style={styles.subtitle}>
          Enter your email or phone and we'll send a reset code.
        </Text>
        <Controller
          control={control}
          name="identifier"
          rules={{ required: "Email or phone is required" }}
          render={({ field }) => (
            <Input
              label="Email or phone"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              error={errors.identifier?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Button label="Send reset code" onPress={handleSubmit(onSubmit)} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.base, paddingTop: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
});
