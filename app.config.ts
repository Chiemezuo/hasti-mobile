import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "HASTI",
  slug: "hasti-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#081c36",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.hasti.mobile",
    infoPlist: {
      NSCameraUsageDescription:
        "HASTI uses your camera to capture KYC documents, listing photos, and chat images.",
      NSPhotoLibraryUsageDescription:
        "HASTI accesses your photos to upload listing images, KYC documents, and chat attachments.",
      NSFaceIDUsageDescription:
        "HASTI uses Face ID to protect your account and transactions.",
    },
  },
  android: {
    package: "com.hasti.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#081c36",
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
    ],
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#16497e",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "HASTI uses your camera to capture KYC documents, listing photos, and chat images.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "HASTI accesses your photos to upload listing images, KYC documents, and chat attachments.",
      },
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "HASTI uses Face ID to protect your account and transactions.",
      },
    ],
  ],
  scheme: "hasti",
  extra: {
    apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3100",
    storageBaseUrl: process.env.STORAGE_BASE_URL ?? "http://localhost:9000/hasti-public",
    isProduction: process.env.APP_ENV === "production",
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "",
    },
  },
  updates: {
    url: "https://u.expo.dev/hasti",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
});
