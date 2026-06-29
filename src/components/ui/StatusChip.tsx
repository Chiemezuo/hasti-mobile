import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radii } from "@/theme";
import { Text } from "./Text";
import type { StatusChipFamily } from "@/lib/escrow-labels";

interface StatusChipProps {
  label: string;
  family?: StatusChipFamily;
}

const CHIP_STYLES: Record<StatusChipFamily, { bg: string; text: string; dot: string }> = {
  positive: { bg: colors.blueSoft, text: colors.blue, dot: colors.blue },
  attention: { bg: colors.goldSoft, text: colors.ink, dot: colors.gold },
  negative: { bg: `${colors.error}1a`, text: colors.error, dot: colors.error },
  unknown: { bg: `${colors.ink}0f`, text: colors.muted, dot: colors.muted },
};

export function StatusChip({ label, family = "unknown" }: StatusChipProps) {
  const s = CHIP_STYLES[family];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Text variant="bodySm" style={{ color: s.text }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.chip,
    alignSelf: "flex-start",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
});
