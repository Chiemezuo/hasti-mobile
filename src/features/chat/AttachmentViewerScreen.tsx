import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/theme";
import { useRoute } from "@react-navigation/native";
import { API_BASE } from "@/api/client";
import { getAccessToken } from "@/auth/token-store";

export function AttachmentViewerScreen() {
  const route = useRoute<any>();
  const { objectId, conversationId } = route.params;
  const [authHeader, setAuthHeader] = useState<Record<string, string>>({});

  useEffect(() => {
    getAccessToken().then((token) => {
      if (token) setAuthHeader({ Authorization: `Bearer ${token}` });
    });
  }, []);

  const uri = `${API_BASE}/conversations/${conversationId}/attachments/${objectId}`;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri, headers: authHeader }}
        style={styles.image}
        contentFit="contain"
        cachePolicy="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueInk,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
});
