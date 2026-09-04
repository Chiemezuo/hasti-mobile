import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Switch, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/api/endpoints/notifications";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";

export function NotificationPrefsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: getNotificationPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-prefs"] }),
  });

  function handleToggle(groupKey: string, channel: "inApp" | "email", value: boolean) {
    updateMutation.mutate({ [groupKey]: { [channel]: value } });
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: spacing.base, gap: 8 }}>
          {[1, 2, 3].map((k) => <Skeleton key={k} height={80} />)}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />
      }
    >
      <Text variant="body" muted style={styles.intro}>
        Choose how you want to be notified for each category.
      </Text>

      {/* Push note */}
      <View style={styles.pushNote}>
        <Ionicons name="notifications-outline" size={16} color={colors.blue} />
        <Text variant="bodySm" style={{ flex: 1, color: colors.blue }}>
          Push notifications are coming soon — notifications currently arrive in-app and by email.
        </Text>
      </View>

      {(data?.groups ?? []).map((group) => (
        <View key={group.key} style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <Text variant="body" style={{ fontWeight: "600" }}>
              {group.label}
            </Text>
            {group.locked && (
              <View style={styles.lockedRow}>
                <Ionicons name="lock-closed-outline" size={12} color={colors.muted} />
                <Text variant="bodySm" muted>
                  Always on — critical updates
                </Text>
              </View>
            )}
          </View>
          <View style={styles.channelRow}>
            <Text variant="bodySm" muted style={{ flex: 1 }}>
              In-app
            </Text>
            <Switch
              value={group.channels.inApp}
              onValueChange={(v) => { if (!group.locked) handleToggle(group.key, "inApp", v); }}
              disabled={group.locked}
              trackColor={{ true: colors.blue }}
              thumbColor={colors.paper}
            />
          </View>
          <View style={[styles.channelRow, { borderTopWidth: 0 }]}>
            <Text variant="bodySm" muted style={{ flex: 1 }}>
              Email
            </Text>
            <Switch
              value={group.channels.email}
              onValueChange={(v) => { if (!group.locked) handleToggle(group.key, "email", v); }}
              disabled={group.locked}
              trackColor={{ true: colors.blue }}
              thumbColor={colors.paper}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, gap: 12 },
  intro: { marginBottom: spacing.sm },
  pushNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.blueSoft,
    borderRadius: radii.card,
    padding: spacing.base,
    gap: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  groupHeader: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  lockedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
});
