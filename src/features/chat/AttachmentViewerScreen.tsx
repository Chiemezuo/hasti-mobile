import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/theme";
import { Text } from "@/components/ui/Text";
import { useRoute } from "@react-navigation/native";

export function AttachmentViewerScreen() {
  const route = useRoute<any>();
  const { objectId, conversationId } = route.params;

  // The attachment URL comes from GET /conversations/:id/attachments/:objectId
  // In real app, use useQuery to fetch the attachment URL
  const url = `${conversationId}/attachments/${objectId}`;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: url }}
        style={styles.image}
        contentFit="contain"
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
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
