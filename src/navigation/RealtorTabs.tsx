import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors, fonts } from "@/theme";
import { Platform, StyleSheet, View } from "react-native";

import { MyListingsScreen } from "@/features/realtor/MyListingsScreen";
import { CreateListingScreen } from "@/features/realtor/CreateListingScreen";
import { EditListingScreen } from "@/features/realtor/EditListingScreen";
import { ListingMediaScreen } from "@/features/realtor/ListingMediaScreen";
import { RealtorOverviewScreen } from "@/features/realtor/RealtorOverviewScreen";
import { ConversationListScreen } from "@/features/chat/ConversationListScreen";
import { ConversationThreadScreen } from "@/features/chat/ConversationThreadScreen";
import { TransactionListScreen } from "@/features/escrow/TransactionListScreen";
import { EscrowReceiptScreen } from "@/features/escrow/EscrowReceiptScreen";
import { WalletScreen } from "@/features/wallet/WalletScreen";
import { AccountScreen } from "@/features/account/AccountScreen";
import { ProfileScreen } from "@/features/account/ProfileScreen";
import { ChangePasswordScreen } from "@/features/account/ChangePasswordScreen";
import { SessionsScreen } from "@/features/account/SessionsScreen";
import { KycScreen } from "@/features/kyc/KycScreen";
import { NotificationPrefsScreen } from "@/features/notifications/NotificationPrefsScreen";
import { Text } from "@/components/ui/Text";

const Tab = createBottomTabNavigator();
const ListingsStack = createNativeStackNavigator();
const LeadsStack = createNativeStackNavigator();
const DealsStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.ink,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function ListingsStackNav() {
  return (
    <ListingsStack.Navigator screenOptions={stackOptions}>
      <ListingsStack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "Listings" }} />
      <ListingsStack.Screen name="RealtorOverview" component={RealtorOverviewScreen} options={{ title: "Overview" }} />
      <ListingsStack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: "New listing" }} />
      <ListingsStack.Screen name="EditListing" component={EditListingScreen} options={{ title: "Edit listing" }} />
      <ListingsStack.Screen name="ListingMedia" component={ListingMediaScreen} options={{ title: "Photos & documents" }} />
    </ListingsStack.Navigator>
  );
}

function LeadsStackNav() {
  return (
    <LeadsStack.Navigator screenOptions={stackOptions}>
      <LeadsStack.Screen name="ConversationList" component={ConversationListScreen} options={{ title: "Leads" }} />
      <LeadsStack.Screen name="ConversationThread" component={ConversationThreadScreen} options={{ title: "" }} />
    </LeadsStack.Navigator>
  );
}

function DealsStackNav() {
  return (
    <DealsStack.Navigator screenOptions={stackOptions}>
      <DealsStack.Screen name="TransactionList" component={TransactionListScreen} options={{ title: "Deals" }} />
      <DealsStack.Screen name="EscrowReceipt" component={EscrowReceiptScreen} options={{ title: "" }} />
      <DealsStack.Screen name="Wallet" component={WalletScreen} options={{ title: "Wallet" }} />
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
      <AccountStack.Screen name="Kyc" component={KycScreen} options={{ title: "Identity verification" }} />
      <AccountStack.Screen name="NotificationPrefs" component={NotificationPrefsScreen} options={{ title: "Notification preferences" }} />
    </AccountStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Listings: "🏘️",
    Leads: "👥",
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

export function RealtorTabs() {
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
        name="ListingsTab"
        component={ListingsStackNav}
        options={{
          title: "Listings",
          tabBarIcon: ({ focused }) => <TabIcon name="Listings" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LeadsTab"
        component={LeadsStackNav}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("LeadsTab", { screen: "ConversationList" });
          },
        })}
        options={{
          title: "Leads",
          tabBarIcon: ({ focused }) => <TabIcon name="Leads" focused={focused} />,
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
      android: { elevation: 8 },
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
