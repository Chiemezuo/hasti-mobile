import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/theme";
import { Text } from "./Text";

interface SnackbarProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  isError?: boolean;
}

export function Snackbar({ message, visible, onDismiss, isError }: SnackbarProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(3600, withTiming(0, { duration: 200 }, () => runOnJS(onDismiss)()))
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(3600, withTiming(20, { duration: 200 }))
      );
    }
  }, [visible, message]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.snackbar,
        { bottom: insets.bottom + 80 },
        animStyle,
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: "absolute",
    left: spacing.base,
    right: spacing.base,
    backgroundColor: colors.blueInk,
    borderRadius: radii.card,
    padding: spacing.base,
    zIndex: 1000,
  },
  text: {
    color: colors.paper,
    fontSize: 14,
  },
});
