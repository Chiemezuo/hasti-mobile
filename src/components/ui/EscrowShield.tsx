import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radii, spacing } from "@/theme";
import { Text } from "./Text";
import { Card } from "./Card";

export function EscrowShield() {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWell}>
        <Text style={styles.icon}>🛡️</Text>
      </View>
      <View style={styles.content}>
        <Text variant="bodySm" style={styles.title}>
          Funds held in escrow
        </Text>
        <Text variant="bodySm" style={styles.sub}>
          Released only when both sides agree
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    gap: spacing.md,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontWeight: "600",
  },
  sub: {
    color: colors.muted,
    marginTop: 2,
  },
});
