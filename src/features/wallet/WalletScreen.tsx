import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getWallet } from "@/api/endpoints/wallet";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNaira } from "@/lib/money";

export function WalletScreen() {
  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["wallet"],
      queryFn: ({ pageParam }) => getWallet(pageParam as string | undefined),
      getNextPageParam: (last) => last.statement.nextCursor ?? undefined,
      initialPageParam: undefined as string | undefined,
    });

  const wallet = data?.pages[0];
  const ledgerLines = data?.pages.flatMap((p) => p.statement.items) ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : ledgerLines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.ledgerRow}>
            <View style={styles.ledgerLeft}>
              <Text variant="body" style={{ fontWeight: "600" }} numberOfLines={1}>
                {item.memo ?? item.propertyTitle ?? "Transaction"}
              </Text>
              <Text variant="bodySm" muted>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              variant="body"
              style={[
                styles.ledgerAmount,
                item.direction === "CREDIT" ? styles.creditAmount : styles.debitAmount,
              ]}
            >
              {item.direction === "CREDIT" ? "+" : "−"} {formatNaira(item.amount)}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.balances}>
            {isLoading ? (
              <View style={styles.balancesLoading}>
                <Skeleton height={32} width="50%" />
                <Skeleton height={24} width="40%" style={{ marginTop: 8 }} />
              </View>
            ) : (
              <>
                <View style={styles.balanceCard}>
                  <Text variant="label">Available balance</Text>
                  <Text variant="display" style={styles.balanceAmount}>
                    {formatNaira(wallet?.availableBalance ?? "0")}
                  </Text>
                </View>
                <View style={styles.escrowBalance}>
                  <Text variant="bodySm" muted>In escrow:</Text>
                  <Text variant="body" style={{ fontWeight: "600" }}>
                    {formatNaira(wallet?.escrowBalance ?? "0")}
                  </Text>
                </View>
                <Text variant="label" style={styles.historyLabel}>
                  Transaction history
                </Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text variant="body" muted center>No transactions yet</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
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
  list: { padding: spacing.base },
  balances: { marginBottom: spacing.xl },
  balancesLoading: { gap: 8 },
  balanceCard: {
    backgroundColor: colors.blueInk,
    borderRadius: radii.card,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  balanceAmount: { color: colors.darkHeading, marginTop: spacing.xs },
  escrowBalance: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  historyLabel: { marginTop: spacing.base },
  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
    marginBottom: 8,
  },
  ledgerLeft: { flex: 1, marginRight: spacing.base },
  ledgerAmount: { fontWeight: "600" },
  creditAmount: { color: "#2d7a4f" },
  debitAmount: { color: colors.error },
  empty: { padding: spacing.xl },
});
