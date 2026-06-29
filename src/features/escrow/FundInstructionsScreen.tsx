import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Clipboard } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getTransaction } from "@/api/endpoints/transactions";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { formatNaira } from "@/lib/money";
import { Skeleton } from "@/components/ui/Skeleton";
import * as Haptics from "expo-haptics";
import { useRoute } from "@react-navigation/native";

export function FundInstructionsScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const { data: transaction, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => getTransaction(id),
  });

  async function copyToClipboard(text: string) {
    Clipboard.setString(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton height={200} />
      </View>
    );
  }

  const instructions = transaction?.paymentInstructions;

  if (!instructions) {
    return (
      <View style={styles.container}>
        <Text muted center>Payment instructions unavailable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label">Transfer to</Text>
        <Text variant="h2" style={styles.amount}>
          {formatNaira(instructions.amount)}
        </Text>
        <Text variant="body" muted>
          Funds are held securely in escrow until you confirm conditions are met
        </Text>
      </View>

      <View style={styles.instructionsCard}>
        {[
          { label: "Account name", value: instructions.accountName },
          { label: "Account number", value: instructions.accountNumber },
          { label: "Bank", value: instructions.bankName },
          { label: "Amount", value: formatNaira(instructions.amount) },
        ].map(({ label, value }) => (
          <View key={label} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text variant="bodySm" muted>
                {label}
              </Text>
              <Text
                variant="body"
                style={styles.rowValue}
                selectable
              >
                {value}
              </Text>
            </View>
            {(label === "Account number" || label === "Amount") && (
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => copyToClipboard(value)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text variant="bodySm" style={{ color: colors.blue }}>
                  Copy
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeIcon}>ℹ️</Text>
        <Text variant="bodySm" style={styles.noticeText}>
          Transfer the exact amount shown. HASTI will automatically detect your payment via our banking partner. This may take up to 30 minutes on business days.
        </Text>
      </View>

      <Text variant="bodySm" muted center style={styles.trust}>
        Funds held by licensed payment partners · Verified before live
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  header: { marginBottom: spacing.xl, gap: spacing.sm },
  amount: { color: colors.ink },
  instructionsCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  rowInfo: { flex: 1 },
  rowValue: { fontWeight: "600", marginTop: 2 },
  copyBtn: { marginLeft: 16 },
  noticeBox: {
    flexDirection: "row",
    backgroundColor: colors.blueSoft,
    borderRadius: radii.card,
    padding: spacing.base,
    marginTop: spacing.base,
    gap: spacing.sm,
  },
  noticeIcon: { fontSize: 18 },
  noticeText: { flex: 1, color: colors.blue, lineHeight: 20 },
  trust: { marginTop: spacing.xl },
});
