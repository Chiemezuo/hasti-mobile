import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { StatusChip } from "@/components/ui/StatusChip";
import { useAuthStore } from "@/auth/store";
import { logout } from "@/api/endpoints/auth";
import { disconnect } from "@/auth/realtime";

interface MenuRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
  destructive?: boolean;
}

function MenuRow({ icon, label, onPress, badge, destructive }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text
        variant="body"
        style={[styles.menuLabel, destructive && { color: colors.error }]}
      >
        {label}
      </Text>
      {badge && (
        <StatusChip label={badge} family="attention" />
      )}
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

export function AccountScreen() {
  const navigation = useNavigation<any>();
  const { user, logout: localLogout } = useAuthStore();

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch {}
          disconnect();
          localLogout();
        },
      },
    ]);
  }

  const fullName = user?.profile?.displayName ?? "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <View style={styles.avatarContainer}>
            {user?.profile?.avatarUrl ? (
              <Image
                source={{ uri: user.profile.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text variant="h3">{fullName || "Your account"}</Text>
          <Text variant="bodySm" muted>
            {user?.email ?? user?.phone ?? ""}
          </Text>
          {!user?.kycApproved && (
            <StatusChip label="Unverified" family="attention" />
          )}
        </View>
      </View>

      {/* Menu sections */}
      <View style={styles.section}>
        <Text variant="label" style={styles.sectionLabel}>Profile</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="👤" label="Edit profile" onPress={() => navigation.navigate("Profile")} />
          <View style={styles.divider} />
          <MenuRow icon="🔑" label="Change password" onPress={() => navigation.navigate("ChangePassword")} />
          <View style={styles.divider} />
          <MenuRow icon="📱" label="Devices & sessions" onPress={() => navigation.navigate("Sessions")} />
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="label" style={styles.sectionLabel}>Finance</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="💳" label="Wallet" onPress={() => navigation.navigate("Wallet")} />
          <View style={styles.divider} />
          <MenuRow
            icon="🪪"
            label="Identity verification"
            onPress={() => navigation.navigate("Kyc")}
            badge={user?.kycApproved ? undefined : "Required"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="label" style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="🔔" label="Notifications" onPress={() => navigation.navigate("Notifications")} />
          <View style={styles.divider} />
          <MenuRow icon="⚙️" label="Notification preferences" onPress={() => navigation.navigate("NotificationPrefs")} />
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="label" style={styles.sectionLabel}>Data & privacy</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="📤" label="Export my data" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuRow icon="ℹ️" label="Terms & privacy" onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <MenuRow
            icon="🚪"
            label="Sign out"
            onPress={handleLogout}
            destructive
          />
        </View>
      </View>

      <Text variant="bodySm" muted center style={styles.versionText}>
        HASTI v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingBottom: 40 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.base,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  avatar: { width: 64, height: 64 },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 28, color: colors.blue, fontWeight: "700" },
  profileInfo: { flex: 1, gap: 4 },
  section: { marginBottom: spacing.base },
  sectionLabel: { marginBottom: spacing.sm },
  menuCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    gap: spacing.sm,
  },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1 },
  menuChevron: { color: colors.muted, fontSize: 18 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 60 },
  versionText: { marginTop: spacing.xl },
});
