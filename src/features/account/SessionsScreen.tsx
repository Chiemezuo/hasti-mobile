import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessions, deleteSession } from "@/api/endpoints/account";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { StatusChip } from "@/components/ui/StatusChip";
import { Skeleton } from "@/components/ui/Skeleton";

export function SessionsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["sessions"], queryFn: getSessions });
  const sessions = data?.sessions;

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  function handleRevoke(id: string) {
    Alert.alert("Revoke device", "Remove this device's access to your account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Revoke", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : (sessions ?? [])}

        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text variant="body" style={{ fontWeight: "600" }}>
                  {item.device ?? "Unknown device"}
                </Text>
                {item.current && <StatusChip label="This device" family="positive" />}
              </View>
              {item.ip && <Text variant="bodySm" muted>IP: {item.ip}</Text>}
              {item.lastUsedAt && (
                <Text variant="bodySm" muted>
                  Last used {new Date(item.lastUsedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            {!item.current && (
              <TouchableOpacity
                onPress={() => handleRevoke(item.id)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text variant="bodySm" style={{ color: colors.error }}>Revoke</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 8 }}>
              {[1, 2].map((k) => <Skeleton key={k} height={72} />)}
            </View>
          ) : (
            <Text muted center>No sessions found</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    gap: spacing.base,
  },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
});
