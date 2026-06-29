import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSavedSearches,
  deleteSavedSearch,
  updateSavedSearch,
} from "@/api/endpoints/favorites";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";

export function SavedSearchesScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["saved-searches"],
    queryFn: getSavedSearches,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, notifyOnNew }: { id: string; notifyOnNew: boolean }) =>
      updateSavedSearch(id, { notifyOnNew }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
  });

  function handleDelete(id: string) {
    Alert.alert("Remove saved search", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : (data?.items ?? [])}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text variant="body" style={{ fontWeight: "600" }}>
                {item.name}
              </Text>
              <Text variant="bodySm" muted>
                {JSON.stringify(item.filter)}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Switch
                value={item.notifyOnNew}
                onValueChange={(v) => updateMutation.mutate({ id: item.id, notifyOnNew: v })}
                trackColor={{ true: colors.blue }}
                thumbColor={colors.paper}
              />
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={{ color: colors.error, fontSize: 13 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map((k) => <Skeleton key={k} height={64} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text variant="h3" center>No saved searches</Text>
              <Text variant="body" muted center style={{ marginTop: 8 }}>
                Save a search from the Discover screen to get notified about new matches
              </Text>
            </View>
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
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    flexDirection: "row",
    alignItems: "center",
  },
  rowContent: { flex: 1 },
  rowActions: { alignItems: "flex-end", gap: 8 },
  empty: { padding: spacing.xl, alignItems: "center" },
});
