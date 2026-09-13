import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ListRenderItem,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProperties, toggleFavorite, type ListingCard as ListingCardData } from "@/api/endpoints/properties";
import { getFavoriteIds } from "@/api/endpoints/favorites";
import { colors, spacing, radii, fonts } from "@/theme";
import { Text } from "@/components/ui/Text";
import { ListingCard } from "@/components/ui/ListingCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/auth/store";
import { useDiscoveryStore, filtersToSearchFilter, hasActiveFilters } from "./discoveryStore";

const DISCOVERY_CAP = 120;
const SECTION_CARD_WIDTH = 220;

const CATEGORY_TYPES = ["SALE", "RENT", "LEASE", "SHORT_STAY"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  SALE: "Buy",
  RENT: "Rent",
  LEASE: "Lease",
  SHORT_STAY: "Shortlets",
};

interface CategorySectionProps {
  type: (typeof CATEGORY_TYPES)[number];
  favSet: Set<string>;
  onToggleFavorite: (id: string) => void;
  onPressItem: (id: string) => void;
  onSeeAll: () => void;
}

function CategorySection({ type, favSet, onToggleFavorite, onPressItem, onSeeAll }: CategorySectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["properties-section", type],
    queryFn: () => getProperties({ type, limit: 10 }),
  });

  const items = data?.items ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text variant="h3">{CATEGORY_LABELS[type]}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text variant="bodySm" style={{ color: colors.blue }}>See all</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.sectionSkeletonRow}>
          {[1, 2].map((k) => (
            <View key={k} style={{ width: SECTION_CARD_WIDTH }}>
              <CardSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.sectionList}
          renderItem={({ item }) => (
            <View style={{ width: SECTION_CARD_WIDTH }}>
              <ListingCard
                property={item}
                isFavorited={favSet.has(item.id)}
                onPress={() => onPressItem(item.id)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

export function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const { filters, setFilters } = useDiscoveryStore();
  const filtersActive = hasActiveFilters(filters);
  const user = useAuthStore((s) => s.user);

  // Browsing (no search, no explicit type filter) shows type-sectioned horizontal
  // rails instead of one long list; searching or picking a category switches to
  // a flat, filtered results list.
  const browsing = !submittedSearch && !filters.type;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["properties", submittedSearch, filters],
    queryFn: ({ pageParam }) =>
      getProperties({
        ...filtersToSearchFilter(filters, submittedSearch || undefined),
        cursor: pageParam as string | undefined,
        limit: 20,
      }),
    getNextPageParam: (last) =>
      last.pageInfo.hasMore ? last.pageInfo.nextCursor ?? undefined : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !browsing,
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

  const toggleFav = useCallback(
    (id: string) => favoriteMutation.mutate({ id, add: !favSet.has(id) }),
    [favoriteMutation, favSet]
  );
  const openListing = useCallback(
    (id: string) => navigation.navigate("ListingDetail", { id }),
    [navigation]
  );

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const hitCap = allItems.length >= DISCOVERY_CAP;

  const renderItem: ListRenderItem<ListingCardData> = useCallback(({ item }) => (
    <ListingCard
      property={item}
      isFavorited={favSet.has(item.id)}
      onPress={() => openListing(item.id)}
      onToggleFavorite={() => toggleFav(item.id)}
    />
  ), [favSet, openListing, toggleFav]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Brand header */}
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Image source={require("../../../assets/icon.png")} style={styles.logoMark} />
          <Text variant="h2" style={styles.brandName}>Hasti</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => navigation.navigate("AccountTab", { screen: "Notifications" })}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("AccountTab", { screen: "Profile" })}>
            {user?.profile?.avatarUrl ? (
              <Image source={{ uri: user.profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text variant="bodySm" style={{ color: colors.blue, fontWeight: "700" }}>
                  {user?.profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar — filter icon lives inside the search field itself */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
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
              <Ionicons name="close" size={16} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.searchDivider} />
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            onPress={() => navigation.navigate("Filters")}
          >
            <Ionicons name="options-outline" size={20} color={filtersActive ? colors.blueDeep : colors.ink} />
            {filtersActive && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => navigation.navigate("MapView")}
        >
          <Ionicons name="map-outline" size={16} color={colors.paper} />
          <Text style={styles.mapBtnLabel}>Map</Text>
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      <View style={styles.categoryRow}>
        {CATEGORY_TYPES.map((type) => {
          const active = filters.type === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setFilters({ ...filters, type: active ? undefined : type })}
            >
              <Text
                variant="bodySm"
                style={active ? { color: colors.paper, fontWeight: "600" } : { color: colors.ink }}
              >
                {CATEGORY_LABELS[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {browsing ? (
        <ScrollView contentContainerStyle={styles.browseContent}>
          {CATEGORY_TYPES.map((type) => (
            <CategorySection
              key={type}
              type={type}
              favSet={favSet}
              onToggleFavorite={toggleFav}
              onPressItem={openListing}
              onSeeAll={() => setFilters({ ...filters, type })}
            />
          ))}
        </ScrollView>
      ) : (
        <>
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoMark: { width: 34, height: 34, borderRadius: 8 },
  brandName: { color: colors.blueDeep },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
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
  searchInput: {
    flex: 1,
    fontFamily: fonts.hankenRegular,
    fontSize: 15,
    color: colors.ink,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.line,
  },
  filterDot: {
    position: "absolute",
    top: -2, right: -2,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.blueDeep,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.blueDeep,
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    height: 44,
  },
  mapBtnLabel: { color: colors.paper, fontSize: 13, fontWeight: "600" },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  categoryChipActive: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  resultsCount: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  list: { padding: spacing.base },
  empty: { padding: spacing.xl, alignItems: "center" },
  browseContent: { paddingBottom: spacing.xl },
  sectionBlock: { marginTop: spacing.base },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  sectionList: { paddingHorizontal: spacing.base, gap: spacing.sm },
  sectionSkeletonRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.base },
});
