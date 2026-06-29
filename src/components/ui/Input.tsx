import React, { useState } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors, radii, spacing, fonts, fontSizes } from "@/theme";
import { Text } from "./Text";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  prefix?: string;
  rightElement?: React.ReactNode;
  containerStyle?: object;
}

export function Input({
  label,
  error,
  prefix,
  rightElement,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.focused,
          error ? styles.errored : undefined,
        ]}
      >
        {prefix ? (
          <Text variant="body" style={styles.prefix}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement}
      </View>
      {error ? (
        <Text variant="bodySm" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 48,
    paddingHorizontal: spacing.base,
  },
  focused: {
    borderColor: colors.blue,
    borderWidth: 2,
  },
  errored: {
    borderColor: colors.error,
  },
  prefix: {
    color: colors.muted,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontFamily: fonts.hankenRegular,
    fontSize: fontSizes.body,
    color: colors.ink,
    paddingVertical: 12,
  },
  errorText: {
    color: colors.error,
    marginTop: 4,
  },
});
