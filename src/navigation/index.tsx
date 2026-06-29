import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "@/auth/store";
import { getMe } from "@/api/endpoints/account";
import { getAccessToken } from "@/auth/token-store";
import { connect as connectRealtime } from "@/auth/realtime";
import { AuthStack } from "./AuthStack";
import { UserTabs } from "./UserTabs";
import { RealtorTabs } from "./RealtorTabs";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/theme";

export function RootNavigator() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const at = await getAccessToken();
      if (!at) return;
      const me = await getMe();
      setUser(me);
      connectRealtime().catch(() => {});
    } catch {
      // No valid session
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  const isRealtor = user?.roles.includes("REALTOR") ?? false;

  return (
    <NavigationContainer>
      {!user ? <AuthStack /> : isRealtor ? <RealtorTabs /> : <UserTabs />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
