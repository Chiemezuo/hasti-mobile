import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransaction,
  confirmConditions,
  requestRefund,
  raiseDispute,
  simulateTransfer,
} from "@/api/endpoints/transactions";
import { colors, spacing } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNaira } from "@/lib/money";
import {
  TRANSACTION_LABELS,
  TRANSACTION_DESCRIPTIONS,
  TRANSACTION_CHIP_FAMILY,
  isTerminal,
  type TransactionStatus,
} from "@/lib/escrow-labels";
import { useNavigation, useRoute } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";

const IS_PRODUCTION = Constants.expoConfig?.extra?.isProduction as boolean ?? true;

// The escrow receipt is bound 1:1 to the state machine
const STEPS: Array<{ status: TransactionStatus | TransactionStatus[]; label: string }> = [
  { status: "INITIATED", label: "Transfer into escrow" },
  { status: "IN_ESCROW", label: "Funds held in escrow" },
  { status: "UNDER_REVIEW", label: "Conditions confirmed" },
  { status: "COMPLETED", label: "Funds released" },
];

function getStepState(
  stepStatus: TransactionStatus | TransactionStatus[],
  currentStatus: TransactionStatus
): "done" | "current" | "pending" {
  const statusOrder: TransactionStatus[] = [
    "INITIATED", "IN_ESCROW", "UNDER_REVIEW", "COMPLETED",
  ];

  const stepStatuses = Array.isArray(stepStatus) ? stepStatus : [stepStatus];
  const stepIndex = statusOrder.findIndex((s) => stepStatuses.includes(s));
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentIndex < 0) return "pending"; // DISPUTED, CANCELLED, REFUNDED
  if (currentIndex > stepIndex) return "done";
  if (currentIndex === stepIndex) return "current";
  return "pending";
}

export function EscrowReceiptScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => getTransaction(id),
    refetchInterval: (q) => {
      // Poll if non-terminal
      const status = q.state.data?.status;
      return status && !isTerminal(status) ? 10_000 : false;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmConditions(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const refundMutation = useMutation({
    mutationFn: () => requestRefund(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction", id] }),
  });

  const disputeMutation = useMutation({
    mutationFn: () => raiseDispute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
  });

  const simulateMutation = useMutation({
    mutationFn: () => simulateTransfer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction", id] }),
  });

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <View style={[styles.darkHeader, { paddingTop: insets.top + 60 }]}>
          <Skeleton height={48} width="60%" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
        </View>
        <View style={styles.body}>
          {[1, 2, 3].map((k) => <Skeleton key={k} height={56} style={{ marginBottom: 8 }} />)}
        </View>
      </ScrollView>
    );
  }

  if (!transaction) return null;

  const status = transaction.status;
  const chipFamily = TRANSACTION_CHIP_FAMILY[status];
  const description = TRANSACTION_DESCRIPTIONS[status];
  const terminal = isTerminal(status);

  // Refund window check (if the date is in the past, window is closed)
  const refundWindowOpen =
    status === "IN_ESCROW" &&
    transaction.refundWindowEndsAt &&
    new Date(transaction.refundWindowEndsAt) > new Date();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dark header panel */}
        <View style={[styles.darkHeader, { paddingTop: insets.top + 20 }]}>
          {/* Eyebrow */}
          <View style={styles.eyebrowRow}>
            <View style={styles.goldRule} />
            <Text variant="label" style={styles.eyebrow}>
              {transaction.propertyTitle}
            </Text>
          </View>

          {/* Amount — the serif moment */}
          <Text variant="display" style={styles.amount}>
            {formatNaira(transaction.amount)}
          </Text>
          <Text variant="bodySm" style={styles.feeText}>
            Fee: {formatNaira(transaction.feeAmount)} · Total snapshotted
          </Text>

          {/* Status chip */}
          <View style={styles.chipRow}>
            <StatusChip label={TRANSACTION_LABELS[status]} family={chipFamily} />
          </View>

          {/* Description */}
          <Text style={styles.statusDescription}>{description}</Text>

          {/* Gold CTA on dark panel for INITIATED state */}
          {status === "INITIATED" && (
            <View style={styles.ctaBlock}>
              <Button
                label="View payment instructions"
                variant="gold"
                onPress={() => navigation.navigate("FundInstructions", { id })}
              />
              {!IS_PRODUCTION && (
                <Button
                  label="I've paid (dev only)"
                  variant="white-outline"
                  onPress={() => simulateMutation.mutate()}
                  loading={simulateMutation.isPending}
                  style={styles.devBtn}
                />
              )}
            </View>
          )}
        </View>

        {/* Gold seal */}
        <View style={styles.seal}>
          <Text style={styles.sealText}>🛡️</Text>
        </View>

        {/* Body — stepped checklist */}
        <View style={styles.body}>
          {STEPS.map((step, i) => {
            const stepState = getStepState(step.status, status);
            const isDisputed = status === "DISPUTED";
            const isRefunded = status === "REFUNDED";
            const isCancelled = status === "CANCELLED";

            // Branch states re-skin the current step
            const showBranchAtStep = i === 1 && (isDisputed || isRefunded || isCancelled);

            return (
              <View key={i} style={styles.step}>
                <View
                  style={[
                    styles.stepIcon,
                    stepState === "done" && styles.stepDone,
                    stepState === "current" && styles.stepCurrent,
                    showBranchAtStep && styles.stepBranch,
                  ]}
                >
                  {stepState === "done" && <Text style={styles.checkMark}>✓</Text>}
                  {stepState === "current" && !showBranchAtStep && (
                    <View style={styles.goldDot} />
                  )}
                  {showBranchAtStep && (
                    <Text style={styles.branchIcon}>
                      {isDisputed ? "⚠️" : "↩️"}
                    </Text>
                  )}
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, stepState === "done" && styles.stepLineDone]} />
                )}
                <View style={styles.stepContent}>
                  <Text variant="body" style={stepState === "done" ? { fontWeight: "600" } : {}}>
                    {showBranchAtStep
                      ? isDisputed
                        ? "Under dispute"
                        : isRefunded
                        ? "Refunded to buyer"
                        : "Deal cancelled"
                      : step.label}
                  </Text>
                  {stepState === "current" && (
                    <Text variant="bodySm" muted>
                      {description}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Recall window footnote */}
          {transaction.refundWindowEndsAt && status === "IN_ESCROW" && (
            <Text variant="bodySm" muted style={styles.footnote}>
              Recall window closes{" "}
              {new Date(transaction.refundWindowEndsAt).toLocaleDateString()} — funds
              held by licensed payment partners.
            </Text>
          )}

          {/* Buyer actions */}
          <View style={styles.actions}>
            {status === "IN_ESCROW" && (
              <>
                <Button
                  label="Confirm conditions met"
                  onPress={() =>
                    Alert.alert(
                      "Confirm conditions",
                      "This does not release money yet. Are you satisfied that conditions have been met?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Confirm",
                          onPress: () => confirmMutation.mutate(),
                        },
                      ]
                    )
                  }
                  loading={confirmMutation.isPending}
                />
                {refundWindowOpen && (
                  <Button
                    label="Request refund"
                    variant="outline"
                    onPress={() =>
                      Alert.alert(
                        "Request refund",
                        "Request a refund of your escrowed funds?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Request", onPress: () => refundMutation.mutate() },
                        ]
                      )
                    }
                    loading={refundMutation.isPending}
                    style={styles.secondaryAction}
                  />
                )}
                <Button
                  label="Raise dispute"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert(
                      "Raise dispute",
                      "Raise a dispute about this transaction? HASTI will review and arbitrate.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Raise dispute", style: "destructive", onPress: () => disputeMutation.mutate() },
                      ]
                    )
                  }
                  loading={disputeMutation.isPending}
                  style={styles.secondaryAction}
                />
              </>
            )}

            {status === "UNDER_REVIEW" && (
              <Button
                label="Raise dispute"
                variant="ghost"
                onPress={() =>
                  Alert.alert(
                    "Raise dispute",
                    "Raise a dispute about this transaction?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Raise dispute", style: "destructive", onPress: () => disputeMutation.mutate() },
                    ]
                  )
                }
                loading={disputeMutation.isPending}
              />
            )}

            {(status === "COMPLETED" || status === "REFUNDED") && (
              <Button
                label="View wallet"
                variant="outline"
                onPress={() => navigation.navigate("Wallet")}
              />
            )}

            {(status === "CANCELLED") && (
              <Button
                label="Back to listings"
                variant="outline"
                onPress={() => navigation.navigate("DiscoverTab")}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  darkHeader: {
    backgroundColor: colors.blueInk,
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  goldRule: { width: 26, height: 1, backgroundColor: colors.goldBright },
  eyebrow: { color: colors.goldBright },
  amount: { color: colors.darkHeading, fontSize: 36, marginBottom: 4 },
  feeText: { color: colors.darkSecondary, marginBottom: spacing.base },
  chipRow: { marginBottom: spacing.sm },
  statusDescription: { color: colors.darkBody, fontSize: 15, lineHeight: 22 },
  ctaBlock: { marginTop: spacing.base, gap: spacing.sm },
  devBtn: { marginTop: spacing.sm },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.goldSoft,
    alignSelf: "center",
    marginTop: -28,
    marginBottom: spacing.base,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.paper,
    shadowColor: "#0a1e37",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  sealText: { fontSize: 28 },
  body: { padding: spacing.base },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.base,
    position: "relative",
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.base,
    backgroundColor: colors.bg,
  },
  stepDone: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    borderStyle: "solid",
  },
  stepCurrent: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
    borderStyle: "solid",
  },
  stepBranch: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}1a`,
    borderStyle: "solid",
  },
  stepLine: {
    position: "absolute",
    left: 15,
    top: 32,
    width: 2,
    height: spacing.base + 8,
    backgroundColor: colors.line,
  },
  stepLineDone: { backgroundColor: colors.blue },
  checkMark: { color: colors.blue, fontSize: 16, fontWeight: "700" },
  goldDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  branchIcon: { fontSize: 14 },
  stepContent: { flex: 1, paddingTop: 6 },
  footnote: {
    marginTop: spacing.base,
    marginBottom: spacing.base,
    lineHeight: 18,
  },
  actions: { gap: spacing.sm, marginTop: spacing.base },
  secondaryAction: { marginTop: 0 },
});
