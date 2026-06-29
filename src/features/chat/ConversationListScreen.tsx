import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getConversations } from "@/api/endpoints/conversations";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";

export function ConversationListScreen() {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["conversations"],
      queryFn: ({ pageParam }) => getConversations(pageParam as string | undefined),
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      initialPageParam: undefined as string | undefined,
    });

  const conversations = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, item.status === "LOCKED" && styles.lockedRow]}
            onPress={() => navigation.navigate("ConversationThread", { id: item.id })}
          >
            <View style={styles.avatar}>
              {item.counterpart.avatarUrl ? (
                <Image
                  source={{ uri: item.counterpart.avatarUrl }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {item.counterpart.displayName[0]}
                </Text>
              )}
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text variant="body" style={styles.name} numberOfLines={1}>
                  {item.counterpart.displayName}
                </Text>
                {item.lastMessageAt && (
                  <Text variant="bodySm" muted>
                    {new Date(item.lastMessageAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <Text variant="bodySm" muted numberOfLines={1}>
                {item.property.title}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
            {item.status === "LOCKED" && (
              <Text style={styles.lockIcon}>🔒</Text>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}>
              {[1, 2, 3, 4].map((k) => <Skeleton key={k} height={72} style={{ marginBottom: 8 }} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text variant="h3" center>No conversations yet</Text>
              <Text variant="body" muted center style={{ marginTop: 8 }}>
                Start a conversation by tapping "Chat with realtor" on a listing
              </Text>
            </View>
          )
        }
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    marginBottom: 8,
    gap: spacing.base,
  },
  lockedRow: { opacity: 0.7 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 48, height: 48 },
  avatarInitial: { fontSize: 20, color: colors.blue, fontWeight: "700" },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  name: { fontWeight: "600", flex: 1 },
  preview: { marginTop: 2 },
  badge: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.paper, fontSize: 12, fontWeight: "700" },
  lockIcon: { fontSize: 16 },
  skeletons: { gap: 8 },
  empty: { padding: spacing.xl, alignItems: "center" },
});
