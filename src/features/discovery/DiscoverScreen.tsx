import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProperties, toggleFavorite, type ListingCard as ListingCardData } from "@/api/endpoints/properties";
import { getFavoriteIds } from "@/api/endpoints/favorites";
import { colors, spacing, radii, fonts } from "@/theme";
import { Text } from "@/components/ui/Text";
import { ListingCard } from "@/components/ui/ListingCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useNavigation } from "@react-navigation/native";

const DISCOVERY_CAP = 120;

export function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["properties", submittedSearch],
    queryFn: ({ pageParam }) =>
      getProperties({
        q: submittedSearch || undefined,
        cursor: pageParam as string | undefined,
        limit: 20,
      }),
    getNextPageParam: (last) =>
      last.pageInfo.hasMore ? last.pageInfo.nextCursor ?? undefined : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const { data: favoriteIds } = useQuery({
    queryKey: ["favorite-ids"],
    queryFn: getFavoriteIds,
    staleTime: Infinity,
  });

  const favSet = new Set(favoriteIds?.ids ?? []);

  const favoriteMutation = useMutation({
    mutationFn: ({ id, add }: { id: string; add: boolean }) =>
      toggleFavorite(id, add),
    onMutate: async ({ id, add }) => {
      await queryClient.cancelQueries({ queryKey: ["favorite-ids"] });
      const prev = queryClient.getQueryData<{ ids: string[] }>(["favorite-ids"]);
      queryClient.setQueryData<{ ids: string[] }>(["favorite-ids"], (old) => ({
        ids: add
          ? [...(old?.ids ?? []), id]
          : (old?.ids ?? []).filter((fid) => fid !== id),
      }));
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["favorite-ids"], ctx.prev);
    },
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const hitCap = allItems.length >= DISCOVERY_CAP;

  const renderItem: ListRenderItem<ListingCardData> = useCallback(({ item }) => (
    <ListingCard
      property={item}
      isFavorited={favSet.has(item.id)}
      onPress={() => navigation.navigate("ListingDetail", { id: item.id })}
      onToggleFavorite={() =>
        favoriteMutation.mutate({ id: item.id, add: !favSet.has(item.id) })
      }
    />
  ), [favSet, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city, title, or address"
            placeholderTextColor={colors.placeholder}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={() => setSubmittedSearch(searchText)}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => { setSearchText(""); setSubmittedSearch(""); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => navigation.navigate("Filters")}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => navigation.navigate("MapView")}
        >
          <Text style={styles.mapIcon}>🗺️</Text>
        </TouchableOpacity>
      </View>

      {/* Results count */}
      {!isLoading && total > 0 ? (
        <Text variant="bodySm" muted style={styles.resultsCount}>
          {hitCap ? `Showing top ${DISCOVERY_CAP} results — refine your search to see more` : `${allItems.length} of ${total} properties`}
        </Text>
      ) : null}

      <FlatList
        data={isLoading ? [] : allItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? (
            <View>
              {[1, 2, 3].map((k) => <CardSkeleton key={k} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text variant="h3" center>No properties found</Text>
              <Text variant="body" muted center style={{ marginTop: 8 }}>
                Try adjusting your search or filters
              </Text>
            </View>
          )
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !hitCap) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.blue}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.base,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontFamily: fonts.hankenRegular,
    fontSize: 15,
    color: colors.ink,
  },
  clearBtn: { fontSize: 12, color: colors.muted },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  filterIcon: { fontSize: 18 },
  mapBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.blueSoft,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mapIcon: { fontSize: 18 },
  resultsCount: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  list: { padding: spacing.base },
  empty: { padding: spacing.xl, alignItems: "center" },
});
