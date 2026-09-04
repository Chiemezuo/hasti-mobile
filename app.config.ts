import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "HASTI",
  slug: "hasti-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  web: {
    favicon: "./assets/favicon.png",
  },
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
      backgroundColor: "#ffffff",
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
    "expo-font",
    "expo-image",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#081c36",
      },
    ],
    "expo-status-bar",
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN ?? "",
        RNMAPBOX_MAPS_DOWNLOAD_TOKEN: process.env.MAPBOX_DOWNLOADS_TOKEN ?? "",
      },
    ],
    ["expo-build-properties", {
      android: { usesCleartextTraffic: true },
    }],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#024487",
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
    mapboxPublicToken: process.env.MAPBOX_PUBLIC_TOKEN ?? "",
    isProduction: process.env.APP_ENV === "production",
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "2671a17a-7f15-4971-ae8b-703b48137412",
    },
  },
  updates: {
    url: "https://u.expo.dev/hasti",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
});
