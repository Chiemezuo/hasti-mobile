import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getFavorites } from "@/api/endpoints/favorites";
import { colors, spacing } from "@/theme";
import { Text } from "@/components/ui/Text";
import { ListingCard } from "@/components/ui/ListingCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useNavigation } from "@react-navigation/native";

export function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : (data?.items ?? [])}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            property={item}
            isFavorited
            onPress={() => navigation.navigate("ListingDetail", { id: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="h2">Saved properties</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SavedSearches")}
            >
              <Text variant="bodySm" style={{ color: colors.blue }}>
                Saved searches
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View>{[1, 2].map((k) => <CardSkeleton key={k} />)}</View>
          ) : (
            <View style={styles.empty}>
              <Text variant="h3" center>Nothing saved yet</Text>
              <Text variant="body" muted center style={{ marginTop: 8 }}>
                Tap the heart on a listing to keep it here
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate("DiscoverTab")}
              >
                <Text style={{ color: colors.blue }}>Browse listings</Text>
              </TouchableOpacity>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.blue}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  list: { padding: spacing.base },
  empty: { padding: spacing.xl, alignItems: "center" },
  browseBtn: { marginTop: spacing.base },
});
