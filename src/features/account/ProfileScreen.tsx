import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getMe, patchMe, presignAvatar } from "@/api/endpoints/account";
import { putToStorage, getContentType } from "@/lib/upload";
import { useAuthStore } from "@/auth/store";

export function ProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      displayName: user?.profile?.displayName ?? "",
      bio: user?.profile?.bio ?? "",
      address: user?.profile?.address ?? "",
      businessName: user?.profile?.businessName ?? "",
    },
  });

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const contentType = asset.mimeType ?? getContentType(asset.uri);
    setAvatarUri(asset.uri);
    try {
      const { url, key } = await presignAvatar(contentType);
      await putToStorage(url, asset.uri, contentType);
      setAvatarKey(key);
    } catch {
      setError("Avatar upload failed. Please try again.");
    }
  }

  async function onSubmit(data: { displayName: string; bio: string; address: string; businessName: string }) {
    setSaving(true);
    setError("");
    try {
      await patchMe({
        displayName: data.displayName || undefined,
        bio: data.bio || undefined,
        address: data.address || undefined,
        businessName: data.businessName || undefined,
        ...(avatarKey ? { avatarKey } : {}),
      });
      // Re-fetch full user to refresh store
      const updated = await getMe();
      setUser(updated);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = user?.profile?.displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar}>
            <View style={styles.avatarContainer}>
              {(avatarUri ?? user?.profile?.avatarUrl) ? (
                <Image
                  source={{ uri: avatarUri ?? user?.profile?.avatarUrl ?? undefined }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontSize: 32, color: colors.blue, fontWeight: "700" }}>
                    {initials}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil-outline" size={14} color={colors.paper} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text variant="bodySm" style={{ color: colors.error }}>{error}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="displayName"
          rules={{ required: "Display name is required" }}
          render={({ field }) => (
            <Input
              label="Display name"
              placeholder="Ada Obi"
              error={errors.displayName?.message}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="bio"
          render={({ field }) => (
            <Input
              label="Bio"
              placeholder="Tell us about yourself"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <Input
              label="Address"
              placeholder="Your address"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        {user?.roles.includes("REALTOR") && (
          <Controller
            control={control}
            name="businessName"
            render={({ field }) => (
              <Input
                label="Business name"
                placeholder="Your business name"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        )}

        {/* Read-only info */}
        <View style={styles.readOnly}>
          <Text variant="label" style={{ marginBottom: 4 }}>Email</Text>
          <Text variant="body" muted>{user?.email ?? "—"}</Text>
        </View>

        {user?.phone ? (
          <View style={styles.readOnly}>
            <Text variant="label" style={{ marginBottom: 4 }}>Phone</Text>
            <Text variant="body" muted>{user.phone}</Text>
          </View>
        ) : null}

        <Button label="Save changes" onPress={handleSubmit(onSubmit)} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  avatarSection: { alignItems: "center", marginBottom: spacing.xl },
  avatarContainer: { position: "relative", width: 80, height: 80 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.blueDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.paper,
  },
  errorBanner: {
    backgroundColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  readOnly: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
});
