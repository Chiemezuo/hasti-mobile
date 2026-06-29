import React, { useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationsRead } from "@/api/endpoints/notifications";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";
import { useNavigation } from "@react-navigation/native";

const NOTIFICATION_ICONS: Record<string, string> = {
  "message.new": "💬",
  "offer.made": "💰",
  "offer.accepted": "💰",
  "offer.countered": "💰",
  "offer.rejected": "💰",
  "offer.withdrawn": "💰",
  "transaction.funded": "🔒",
  "transaction.completed": "🔒",
  "transaction.disputed": "🔒",
  "kyc.approved": "🪪",
  "kyc.rejected": "🪪",
  "listing.verified": "🏠",
  "savedSearch.match": "🔍",
};

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["notifications"],
      queryFn: ({ pageParam }) => getNotifications(pageParam as string | undefined),
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      initialPageParam: undefined as string | undefined,
    });

  const markReadMutation = useMutation({
    mutationFn: () => markNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  useEffect(() => {
    markReadMutation.mutate();
  }, []);

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.readAt && styles.unreadRow]}
            onPress={() => {
              const d = item.data;
              const conversationId = d?.conversationId as string | undefined;
              const transactionId = d?.transactionId as string | undefined;
              if (conversationId) {
                navigation.navigate("ChatsTab", { screen: "ConversationThread", params: { id: conversationId } });
              } else if (transactionId) {
                navigation.navigate("DealsTab", { screen: "EscrowReceipt", params: { id: transactionId } });
              }
            }}
          >
            <View style={styles.iconWell}>
              <Text style={styles.icon}>{NOTIFICATION_ICONS[item.event] ?? "🔔"}</Text>
            </View>
            <View style={styles.content}>
              <Text variant="body" style={{ fontWeight: !item.readAt ? "600" : "400" }}>
                {item.title}
              </Text>
              <Text variant="bodySm" muted numberOfLines={2}>
                {item.body}
              </Text>
              <Text variant="bodySm" muted style={{ marginTop: 2 }}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {!item.readAt && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4].map((k) => <Skeleton key={k} height={72} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>🔔</Text>
              <Text variant="h3" center style={{ marginTop: 16 }}>No notifications</Text>
              <Text variant="body" muted center style={{ marginTop: 8 }}>
                You'll see updates about your messages, offers, and deals here
              </Text>
            </View>
          )
        }
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
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
  list: { padding: spacing.base, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    gap: spacing.base,
  },
  unreadRow: { backgroundColor: colors.blueSoft },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 22 },
  content: { flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
    marginTop: 6,
  },
  empty: { padding: spacing.xl, alignItems: "center" },
});
