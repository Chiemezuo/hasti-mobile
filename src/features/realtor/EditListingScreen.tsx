import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPropertyById } from "@/api/endpoints/properties";
import { updateListingStatus } from "@/api/endpoints/realtor";
import { colors, spacing } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_CHIP_FAMILY } from "@/lib/escrow-labels";
import { useNavigation, useRoute } from "@react-navigation/native";

const STATUS_TRANSITIONS: Record<string, Array<{ action: string; label: string }>> = {
  DRAFT: [{ action: "SUBMIT", label: "Submit for review" }],
  PENDING_VERIFICATION: [],
  VERIFIED: [{ action: "PUBLISH", label: "Publish listing" }],
  LIVE: [
    { action: "TAKE_DOWN", label: "Take down" },
    { action: "CLOSE", label: "Close listing" },
  ],
  UNAVAILABLE: [
    { action: "RELIST", label: "Relist" },
    { action: "CLOSE", label: "Close listing" },
  ],
  CLOSED: [],
  REJECTED: [],
};

export function EditListingScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getPropertyById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (action: string) => updateListingStatus(id, action as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", id] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });

  if (isLoading) {
    return <View style={styles.container}><Skeleton height={200} style={{ margin: spacing.base }} /></View>;
  }

  if (!property) return null;

  const statusLabel = PROPERTY_STATUS_LABELS[property.status as keyof typeof PROPERTY_STATUS_LABELS] ?? property.status;
  const chipFamily = PROPERTY_STATUS_CHIP_FAMILY[property.status as keyof typeof PROPERTY_STATUS_CHIP_FAMILY] ?? "unknown";
  const transitions = STATUS_TRANSITIONS[property.status] ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <Text variant="h2" numberOfLines={2} style={{ flex: 1 }}>{property.title}</Text>
        <StatusChip label={statusLabel} family={chipFamily} />
      </View>

      <Text variant="body" muted style={styles.address}>
        📍 {property.address}, {property.city}
      </Text>

      {/* Actions */}
      {transitions.length > 0 && (
        <View style={styles.actionsSection}>
          <Text variant="label">Actions</Text>
          <View style={styles.actions}>
            {transitions.map(({ action, label }) => (
              <Button
                key={action}
                label={label}
                onPress={() =>
                  Alert.alert(
                    label,
                    `Are you sure you want to ${label.toLowerCase()}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: label, onPress: () => statusMutation.mutate(action) },
                    ]
                  )
                }
                loading={statusMutation.isPending}
                variant={action === "SUBMIT" || action === "PUBLISH" ? "primary" : "outline"}
              />
            ))}
          </View>
        </View>
      )}

      {/* Media & docs CTA */}
      <View style={styles.section}>
        <Text variant="label">Media & documents</Text>
        <Text variant="bodySm" muted style={{ marginTop: 4, marginBottom: spacing.sm }}>
          {property.media.length} photo{property.media.length !== 1 ? "s" : ""} uploaded
          {property.status === "DRAFT" ? " — minimum 3 required to submit" : ""}
        </Text>
        <Button
          label="Manage photos & documents"
          variant="outline"
          onPress={() => navigation.navigate("ListingMedia", { id })}
        />
      </View>

      {property.status === "REJECTED" && (
        <View style={styles.rejectedNotice}>
          <Text variant="bodySm" style={{ color: colors.error, fontWeight: "600" }}>
            Listing rejected
          </Text>
          <Text variant="bodySm" style={{ color: colors.error, marginTop: 4 }}>
            Please check the notification for the rejection reason, address the issues, and resubmit.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  address: { marginBottom: spacing.xl },
  actionsSection: { marginBottom: spacing.xl },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  section: { marginBottom: spacing.xl },
  rejectedNotice: {
    backgroundColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: spacing.base,
  },
});
