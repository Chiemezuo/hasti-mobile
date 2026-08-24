import React from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParams } from "@/navigation/AuthStack";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/theme";
import { EscrowShield } from "@/components/ui/EscrowShield";

type Props = NativeStackScreenProps<AuthStackParams, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.blueInk} />
      {/* Dark hero panel */}
      <View style={styles.hero}>
        <SafeAreaView style={styles.logoRow}>
          <Image
            source={require("../../../assets/logo-mark-white.png")}
            style={styles.logoMark}
            resizeMode="contain"
          />
        </SafeAreaView>
        <SafeAreaView>
          <View style={styles.heroContent}>
            <View style={styles.eyebrowRow}>
              <View style={styles.goldRule} />
              <Text variant="label" style={styles.eyebrow}>
                Nigeria's trusted marketplace
              </Text>
            </View>
            <Text variant="display" style={styles.heading}>
              Find property you can{" "}
              <Text variant="display" style={[styles.heading, styles.italic]}>
                trust.
              </Text>
            </Text>
            <Text style={styles.subheading}>
              Verified listings. Escrow-protected deals. Your next property,
              done right.
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Action panel */}
      <View style={styles.actions}>
        <EscrowShield />
        <View style={styles.buttons}>
          <Button
            label="Create account"
            onPress={() => navigation.navigate("Register")}
            variant="primary"
          />
          <Button
            label="Sign in"
            onPress={() => navigation.navigate("Login")}
            variant="outline"
            style={styles.secondaryBtn}
          />
        </View>
        <Text variant="bodySm" muted center style={styles.legal}>
          By continuing, you agree to HASTI's Terms of Service and Privacy
          Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    flex: 1,
    backgroundColor: colors.blueInk,
    paddingHorizontal: spacing.base,
    justifyContent: "space-between",
    paddingBottom: spacing.xl,
  },
  logoRow: {
    paddingTop: spacing.lg,
  },
  logoMark: {
    width: 40,
    height: 36,
  },
  heroContent: {
    gap: spacing.base,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  goldRule: {
    width: 26,
    height: 1,
    backgroundColor: colors.goldBright,
  },
  eyebrow: {
    color: colors.goldBright,
  },
  heading: {
    color: colors.darkHeading,
    fontSize: 38,
    lineHeight: 44,
  },
  italic: {
    fontStyle: "italic",
    color: colors.goldBright,
  },
  subheading: {
    color: colors.darkBody,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "HankenGrotesk_400Regular",
  },
  actions: {
    padding: spacing.base,
    paddingBottom: spacing.section,
    gap: spacing.base,
    backgroundColor: colors.bg,
  },
  buttons: {
    gap: spacing.sm,
  },
  secondaryBtn: {
    borderColor: colors.line,
  },
  legal: {
    fontSize: 12,
  },
});
