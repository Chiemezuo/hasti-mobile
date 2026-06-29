import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getRealtorOverview } from "@/api/endpoints/realtor";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";
import { EscrowShield } from "@/components/ui/EscrowShield";

export function RealtorOverviewScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["realtor-overview"],
    queryFn: getRealtorOverview,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={80} />
          <Skeleton height={80} />
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text variant="label">Account scope</Text>
            <Text variant="h2" style={{ marginTop: 8 }}>
              {data?.scope ?? "Realtor"}
            </Text>
          </View>

          {/* Placeholder for future count fields */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text variant="label">Live listings</Text>
              <Text variant="h2" style={styles.statValue}>—</Text>
              <Text variant="bodySm" muted>Coming soon</Text>
            </View>
            <View style={styles.statCard}>
              <Text variant="label">Active deals</Text>
              <Text variant="h2" style={styles.statValue}>—</Text>
              <Text variant="bodySm" muted>Coming soon</Text>
            </View>
          </View>

          <EscrowShield />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, gap: spacing.base },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
  },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    gap: 4,
  },
  statValue: { color: colors.blueDeep },
});
