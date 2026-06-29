import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getTransactions } from "@/api/endpoints/transactions";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { StatusChip } from "@/components/ui/StatusChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNaira } from "@/lib/money";
import { TRANSACTION_LABELS, TRANSACTION_CHIP_FAMILY } from "@/lib/escrow-labels";
import { useNavigation } from "@react-navigation/native";

export function TransactionListScreen() {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["transactions"],
      queryFn: ({ pageParam }) => getTransactions(pageParam as string | undefined),
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      initialPageParam: undefined as string | undefined,
    });

  const transactions = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("EscrowReceipt", { id: item.id })}
          >
            <View style={styles.rowLeft}>
              <View style={styles.escrowIcon}>
                <Text style={{ fontSize: 24 }}>🔒</Text>
              </View>
            </View>
            <View style={styles.rowContent}>
              <Text variant="body" style={styles.propertyTitle} numberOfLines={1}>
                {item.propertyTitle}
              </Text>
              <Text variant="price">{formatNaira(item.amount)}</Text>
              <Text variant="bodySm" muted>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <StatusChip
              label={TRANSACTION_LABELS[item.status]}
              family={TRANSACTION_CHIP_FAMILY[item.status]}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3].map((k) => <Skeleton key={k} height={80} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text variant="h3" center style={{ marginTop: 16 }}>No deals yet</Text>
              <Text variant="body" muted center style={{ marginTop: 8 }}>
                When you accept an offer on a property, your deal will appear here
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
  rowLeft: {},
  escrowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  propertyTitle: { fontWeight: "600", marginBottom: 2 },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyIcon: { fontSize: 48 },
});
