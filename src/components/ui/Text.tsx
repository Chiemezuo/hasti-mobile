import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";
import { colors, fontSizes, lineHeights, fonts } from "@/theme";

type Variant =
  | "display"
  | "h2"
  | "h3"
  | "bodyLg"
  | "body"
  | "bodySm"
  | "label"
  | "button"
  | "tab"
  | "price";

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  serif?: boolean;
  italic?: boolean;
  muted?: boolean;
  center?: boolean;
}

export function Text({
  variant = "body",
  color,
  serif,
  italic,
  muted,
  center,
  style,
  ...props
}: TextProps) {
  const variantStyle = styles[variant];
  const isSerif = serif || variant === "display" || variant === "h2" || variant === "h3" || variant === "price";

  return (
    <RNText
      style={[
        variantStyle,
        isSerif && (italic ? { fontFamily: fonts.frauncesItalic } : { fontFamily: fonts.fraunces }),
        !isSerif && styles.hanken,
        variant === "label" && { fontFamily: fonts.hankenBold },
        variant === "button" && { fontFamily: fonts.hankenSemibold },
        variant === "tab" && { fontFamily: fonts.hankenSemibold },
        muted && { color: colors.muted },
        color ? { color } : undefined,
        center && { textAlign: "center" },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  hanken: {
    fontFamily: fonts.hankenRegular,
    color: colors.ink,
  },
  display: {
    fontFamily: fonts.fraunces,
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    letterSpacing: -0.48,
    color: colors.ink,
  },
  h2: {
    fontFamily: fonts.fraunces,
    fontSize: fontSizes.h2,
    lineHeight: lineHeights.h2,
    color: colors.ink,
  },
  h3: {
    fontFamily: fonts.fraunces,
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.h3,
    color: colors.ink,
  },
  price: {
    fontFamily: fonts.fraunces,
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.h3,
    color: colors.ink,
  },
  bodyLg: {
    fontFamily: fonts.hankenRegular,
    fontSize: fontSizes.bodyLg,
    lineHeight: lineHeights.bodyLg,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.hankenRegular,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    color: colors.ink,
  },
  bodySm: {
    fontFamily: fonts.hankenMedium,
    fontSize: fontSizes.bodySm,
    lineHeight: lineHeights.bodySm,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.hankenBold,
    fontSize: fontSizes.label,
    lineHeight: lineHeights.label,
    textTransform: "uppercase",
    letterSpacing: 1.32,
    color: colors.gold,
  },
  button: {
    fontFamily: fonts.hankenSemibold,
    fontSize: fontSizes.button,
    lineHeight: lineHeights.button,
    color: colors.paper,
  },
  tab: {
    fontFamily: fonts.hankenSemibold,
    fontSize: fontSizes.tab,
    lineHeight: lineHeights.tab,
    color: colors.muted,
  },
});
