import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "@/theme";
import { Text } from "./Text";

export function VerifiedBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="checkmark-circle" size={12} color={colors.goldBright} />
      <Text variant="bodySm" style={styles.text}>
        Verified
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.blueInk,
    borderRadius: radii.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  text: {
    color: colors.paper,
    fontSize: 11.5,
    fontWeight: "600",
  },
});
