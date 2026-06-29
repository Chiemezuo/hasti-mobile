import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { colors, spacing } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { changePassword } from "@/api/endpoints/account";
import { useNavigation } from "@react-navigation/native";

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const newPassword = watch("newPassword");

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      navigation.goBack();
    } catch {
      setError("Failed to change password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="body" muted style={styles.intro}>
          Changing your password will sign out all other devices.
        </Text>
        {error ? (
          <View style={styles.errorBanner}>
            <Text variant="bodySm" style={{ color: colors.error }}>{error}</Text>
          </View>
        ) : null}
        <Controller
          control={control}
          name="currentPassword"
          rules={{ required: "Current password is required" }}
          render={({ field }) => (
            <Input label="Current password" placeholder="Your current password" secureTextEntry error={errors.currentPassword?.message} value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          rules={{ required: "New password is required", minLength: { value: 8, message: "At least 8 characters" }, pattern: { value: /(?=.*[A-Z])(?=.*\d)/, message: "Must include a capital and a number" } }}
          render={({ field }) => (
            <Input label="New password" placeholder="Choose a strong password" secureTextEntry error={errors.newPassword?.message} value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          rules={{ required: "Please confirm your password", validate: (v) => v === newPassword || "Passwords do not match" }}
          render={({ field }) => (
            <Input label="Confirm new password" placeholder="Repeat your new password" secureTextEntry error={errors.confirmPassword?.message} value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Button label="Change password" onPress={handleSubmit(onSubmit)} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  intro: { marginBottom: spacing.xl },
  errorBanner: { backgroundColor: `${colors.error}1a`, borderRadius: 12, padding: spacing.base, marginBottom: spacing.base },
});
