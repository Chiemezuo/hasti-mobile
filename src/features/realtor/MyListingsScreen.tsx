import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { getMyListings } from "@/api/endpoints/realtor";
import { mediaUrl } from "@/lib/upload";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNaira } from "@/lib/money";
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_CHIP_FAMILY } from "@/lib/escrow-labels";
import { useNavigation } from "@react-navigation/native";
import { useKycApproved } from "@/auth/store";

export function MyListingsScreen() {
  const navigation = useNavigation<any>();
  const kycApproved = useKycApproved();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-listings"],
    queryFn: getMyListings,
  });

  const listings = data?.listings ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={isLoading ? [] : listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusLabel = PROPERTY_STATUS_LABELS[item.status as keyof typeof PROPERTY_STATUS_LABELS] ?? item.status;
          const chipFamily = PROPERTY_STATUS_CHIP_FAMILY[item.status as keyof typeof PROPERTY_STATUS_CHIP_FAMILY] ?? "unknown";
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("EditListing", { id: item.id })}
            >
              <View style={styles.thumbnail}>
                {item.coverImage ? (
                  <Image
                    source={{ uri: mediaUrl(item.coverImage.thumbnailKeys?.["400"] ?? item.coverImage.key) }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 28 }}>🏠</Text>
                )}
              </View>
              <View style={styles.rowContent}>
                <Text variant="body" style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text variant="price">{formatNaira(item.price)}</Text>
                <StatusChip label={statusLabel} family={chipFamily} />
              </View>
              <TouchableOpacity
                style={styles.mediaBtn}
                onPress={() => navigation.navigate("ListingMedia", { id: item.id })}
              >
                <Text style={{ fontSize: 18 }}>🖼️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="h2">My listings</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => navigation.navigate("RealtorOverview")}>
                <Text variant="bodySm" style={{ color: colors.blue }}>Overview</Text>
              </TouchableOpacity>
              <Button
                label="+ New listing"
                onPress={() => {
                  if (!kycApproved) {
                    navigation.navigate("AccountTab", { screen: "Kyc" });
                    return;
                  }
                  navigation.navigate("CreateListing");
                }}
                fullWidth={false}
                style={styles.newBtn}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3].map((k) => <Skeleton key={k} height={80} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🏘️</Text>
              <Text variant="h3" center style={{ marginTop: 16 }}>No listings yet</Text>
              <Text variant="body" muted center style={{ marginTop: 8 }}>
                {kycApproved
                  ? "Create your first listing to start attracting buyers"
                  : "Complete identity verification to start listing properties"}
              </Text>
            </View>
          )
        }
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
  header: { marginBottom: spacing.base },
  headerActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  newBtn: { paddingHorizontal: 16, height: 36, fontSize: 13 },
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
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.blueSoft,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 4 },
  title: { fontWeight: "600" },
  mediaBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  empty: { padding: spacing.xl, alignItems: "center" },
});
