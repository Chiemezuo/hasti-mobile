import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "@/theme";

// Auth screens
import { WelcomeScreen } from "@/features/auth/WelcomeScreen";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { RegisterScreen } from "@/features/auth/RegisterScreen";
import { OtpVerifyScreen } from "@/features/auth/OtpVerifyScreen";
import { ForgotPasswordScreen } from "@/features/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";

export type AuthStackParams = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerify: { identifier: string; purpose: "SIGNUP" | "RESET" };
  ForgotPassword: undefined;
  ResetPassword: { identifier: string };
};

const Stack = createNativeStackNavigator<AuthStackParams>();

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Sign in" }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Create account" }}
      />
      <Stack.Screen
        name="OtpVerify"
        component={OtpVerifyScreen}
        options={{ title: "Verify code" }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: "Reset password" }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: "New password" }}
      />
    </Stack.Navigator>
  );
}
