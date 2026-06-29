import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors, fonts } from "@/theme";
import { Platform, View, StyleSheet } from "react-native";

// Tab feature screens
import { DiscoverScreen } from "@/features/discovery/DiscoverScreen";
import { ListingDetailScreen } from "@/features/discovery/ListingDetailScreen";
import { MapViewScreen } from "@/features/discovery/MapViewScreen";
import { FiltersSheet } from "@/features/discovery/FiltersSheet";
import { FavoritesScreen } from "@/features/discovery/FavoritesScreen";
import { SavedSearchesScreen } from "@/features/discovery/SavedSearchesScreen";
import { ConversationListScreen } from "@/features/chat/ConversationListScreen";
import { ConversationThreadScreen } from "@/features/chat/ConversationThreadScreen";
import { AttachmentViewerScreen } from "@/features/chat/AttachmentViewerScreen";
import { TransactionListScreen } from "@/features/escrow/TransactionListScreen";
import { EscrowReceiptScreen } from "@/features/escrow/EscrowReceiptScreen";
import { FundInstructionsScreen } from "@/features/escrow/FundInstructionsScreen";
import { AccountScreen } from "@/features/account/AccountScreen";
import { ProfileScreen } from "@/features/account/ProfileScreen";
import { ChangePasswordScreen } from "@/features/account/ChangePasswordScreen";
import { SessionsScreen } from "@/features/account/SessionsScreen";
import { WalletScreen } from "@/features/wallet/WalletScreen";
import { KycScreen } from "@/features/kyc/KycScreen";
import { NotificationPrefsScreen } from "@/features/notifications/NotificationPrefsScreen";
import { NotificationsScreen } from "@/features/notifications/NotificationsScreen";
import { Text } from "@/components/ui/Text";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/api/endpoints/notifications";

const Tab = createBottomTabNavigator();

// Stacks
const DiscoverStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();
const ChatsStack = createNativeStackNavigator();
const DealsStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.ink,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function DiscoverStackNav() {
  return (
    <DiscoverStack.Navigator screenOptions={stackOptions}>
      <DiscoverStack.Screen name="Discover" component={DiscoverScreen} options={{ title: "Discover" }} />
      <DiscoverStack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "", headerTransparent: true }} />
      <DiscoverStack.Screen name="MapView" component={MapViewScreen} options={{ title: "Map view" }} />
      <DiscoverStack.Screen name="Filters" component={FiltersSheet} options={{ title: "Filters", presentation: "modal" }} />
    </DiscoverStack.Navigator>
  );
}

function SavedStackNav() {
  return (
    <SavedStack.Navigator screenOptions={stackOptions}>
      <SavedStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Saved" }} />
      <SavedStack.Screen name="SavedSearches" component={SavedSearchesScreen} options={{ title: "Saved searches" }} />
      <SavedStack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "", headerTransparent: true }} />
    </SavedStack.Navigator>
  );
}

function ChatsStackNav() {
  return (
    <ChatsStack.Navigator screenOptions={stackOptions}>
      <ChatsStack.Screen name="ConversationList" component={ConversationListScreen} options={{ title: "Chats" }} />
      <ChatsStack.Screen name="ConversationThread" component={ConversationThreadScreen} options={{ title: "" }} />
      <ChatsStack.Screen name="AttachmentViewer" component={AttachmentViewerScreen} options={{ title: "Attachment" }} />
    </ChatsStack.Navigator>
  );
}

function DealsStackNav() {
  return (
    <DealsStack.Navigator screenOptions={stackOptions}>
      <DealsStack.Screen name="TransactionList" component={TransactionListScreen} options={{ title: "Deals" }} />
      <DealsStack.Screen name="EscrowReceipt" component={EscrowReceiptScreen} options={{ title: "", headerTransparent: true }} />
      <DealsStack.Screen name="FundInstructions" component={FundInstructionsScreen} options={{ title: "Pay into escrow" }} />
    </DealsStack.Navigator>
  );
}

function AccountStackNav() {
  return (
    <AccountStack.Navigator screenOptions={stackOptions}>
      <AccountStack.Screen name="Account" component={AccountScreen} options={{ title: "Account" }} />
      <AccountStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <AccountStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change password" }} />
      <AccountStack.Screen name="Sessions" component={SessionsScreen} options={{ title: "Devices" }} />
      <AccountStack.Screen name="Wallet" component={WalletScreen} options={{ title: "Wallet" }} />
      <AccountStack.Screen name="Kyc" component={KycScreen} options={{ title: "Identity verification" }} />
      <AccountStack.Screen name="NotificationPrefs" component={NotificationPrefsScreen} options={{ title: "Notification preferences" }} />
      <AccountStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
    </AccountStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Discover: "🔍",
    Saved: "❤️",
    Chats: "💬",
    Deals: "🔒",
    Account: "👤",
  };
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name] ?? "●"}</Text>
      {focused && <View style={styles.indicator} />}
    </View>
  );
}

export function UserTabs() {
  const { data } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  });

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.hankenSemibold,
          fontSize: 10.5,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverStackNav}
        options={{
          title: "Discover",
          tabBarIcon: ({ focused }) => <TabIcon name="Discover" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedStackNav}
        options={{
          title: "Saved",
          tabBarIcon: ({ focused }) => <TabIcon name="Saved" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStackNav}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("ChatsTab", { screen: "ConversationList" });
          },
        })}
        options={{
          title: "Chats",
          tabBarBadge: (data?.count ?? 0) > 0 ? data?.count : undefined,
          tabBarIcon: ({ focused }) => <TabIcon name="Chats" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="DealsTab"
        component={DealsStackNav}
        options={{
          title: "Deals",
          tabBarIcon: ({ focused }) => <TabIcon name="Deals" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountStackNav}
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => <TabIcon name="Account" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: `rgba(246,248,250,0.92)`,
    borderTopColor: colors.line,
    ...Platform.select({
      ios: {
        shadowColor: "#0a1e37",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  indicator: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
    marginTop: 2,
  },
});
