import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { colors, radii, shadows } from "@/theme";

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated = false, style, children, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated ? shadows.hero : shadows.card,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
});
