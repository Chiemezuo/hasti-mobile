import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { getMyListings } from "@/api/endpoints/realtor";
import { getTransactions } from "@/api/endpoints/transactions";
import { getWallet } from "@/api/endpoints/wallet";
import { isTerminal } from "@/lib/escrow-labels";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Skeleton } from "@/components/ui/Skeleton";
import { EscrowShield } from "@/components/ui/EscrowShield";
import { formatNaira } from "@/lib/money";
import { useAuthStore } from "@/auth/store";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function RealtorOverviewScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: getMyListings,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(),
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet(),
  });

  const isLoading = listingsLoading || transactionsLoading || walletLoading;

  const activeDeals = (transactionsData?.items ?? []).filter((t) => !isTerminal(t.status)).length;
  const firstName = user?.profile?.displayName?.split(" ")[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text variant="h3">{greeting()}{firstName ? `, ${firstName}` : ""}</Text>
          <Text variant="bodySm" muted style={{ marginTop: 2 }}>
            Here's how your listings are doing
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => navigation.navigate("AccountTab", { screen: "Notifications" })}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
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

      {isLoading ? (
        <View style={{ gap: 12, marginTop: spacing.base }}>
          <Skeleton height={80} />
          <Skeleton height={80} />
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text variant="h2" style={styles.statValue}>{activeDeals}</Text>
              <Text variant="bodySm" muted>Active deals</Text>
            </View>
            <View style={styles.statCard}>
              <Text variant="h3" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatNaira(wallet?.escrowBalance ?? "0")}
              </Text>
              <Text variant="bodySm" muted>In escrow</Text>
            </View>
            <View style={styles.statCard}>
              <Text variant="h3" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatNaira(wallet?.availableBalance ?? "0")}
              </Text>
              <Text variant="bodySm" muted>Available</Text>
            </View>
          </View>

          {/* Quick links */}
          <View style={styles.linksRow}>
            <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate("MyListings")}>
              <Ionicons name="business-outline" size={20} color={colors.blue} />
              <Text variant="bodySm" style={{ fontWeight: "600", marginTop: 6 }}>
                My listings
              </Text>
              <Text variant="label" style={{ marginTop: 2 }}>
                {(listingsData?.listings ?? []).filter((l) => l.status === "LIVE").length} live
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate("DealsTab", { screen: "TransactionList" })}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.blue} />
              <Text variant="bodySm" style={{ fontWeight: "600", marginTop: 6 }}>
                Deals
              </Text>
              <Text variant="label" style={{ marginTop: 2 }}>
                {transactionsData?.items.length ?? 0} total
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate("DealsTab", { screen: "Wallet" })}
            >
              <Ionicons name="wallet-outline" size={20} color={colors.blue} />
              <Text variant="bodySm" style={{ fontWeight: "600", marginTop: 6 }}>
                Wallet
              </Text>
              <Text variant="label" style={{ marginTop: 2 }}>
                View balance
              </Text>
            </TouchableOpacity>
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
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.base, marginTop: 2 },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    gap: 4,
    alignItems: "flex-start",
  },
  statValue: { color: colors.blueDeep },
  linksRow: { flexDirection: "row", gap: spacing.sm },
  linkCard: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.base,
  },
});
