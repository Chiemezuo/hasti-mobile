import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPropertyById } from "@/api/endpoints/properties";
import {
  presignMedia,
  confirmMedia,
  deleteMedia,
  presignDocument,
  confirmDocument,
} from "@/api/endpoints/realtor";
import { putToStorage, getContentType, mediaUrl } from "@/lib/upload";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { StatusChip } from "@/components/ui/StatusChip";
import { useRoute } from "@react-navigation/native";

export function ListingMediaScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { data: property } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getPropertyById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => deleteMedia(id, mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property", id] }),
  });

  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    const contentType = getContentType(uri);
    setUploading(true);
    setUploadError("");
    try {
      const { url, key } = await presignMedia(id, "IMAGE", contentType);
      await putToStorage(url, uri, contentType);
      await confirmMedia(id, key);
      queryClient.invalidateQueries({ queryKey: ["property", id] });
    } catch {
      setUploadError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function addDocument() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    const contentType = getContentType(uri);
    setUploading(true);
    try {
      const { url, key } = await presignDocument(id, "C_OF_O", contentType);
      await putToStorage(url, uri, contentType);
      await confirmDocument(id, key, "C_OF_O");
      queryClient.invalidateQueries({ queryKey: ["property", id] });
    } catch {
      setUploadError("Document upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const media = property?.media ?? [];
  const isDraft = property?.status === "DRAFT";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="body" muted style={styles.intro}>
        Upload at least 3 photos to submit for verification. Ownership documents (C of O, survey) are required.
      </Text>

      {uploadError ? (
        <View style={styles.errorBanner}>
          <Text variant="bodySm" style={{ color: colors.error }}>{uploadError}</Text>
        </View>
      ) : null}

      {/* Photos */}
      <View style={styles.section}>
        <Text variant="label">
          Photos ({media.filter((m) => m.type === "IMAGE").length})
        </Text>
        <View style={styles.grid}>
          {media.filter((m) => m.type === "IMAGE").map((item) => (
            <View key={item.id} style={styles.mediaItem}>
              <Image
                source={{ uri: mediaUrl(item.thumbnailKeys?.["400"] ?? item.key) }}
                style={styles.mediaImage}
                contentFit="cover"
              />
              {item.status === "PENDING" && (
                <View style={styles.processingOverlay}>
                  <Text style={styles.processingText}>Processing…</Text>
                </View>
              )}
              {item.status === "FAILED" && (
                <View style={styles.failedOverlay}>
                  <Text style={styles.failedText}>Failed</Text>
                </View>
              )}
              {isDraft && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert("Remove photo", "Remove this photo?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                    ])
                  }
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add photo button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={addPhoto}
            disabled={uploading}
          >
            <Text style={styles.addIcon}>{uploading ? "⏳" : "+"}</Text>
            <Text variant="bodySm" muted>Add photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Documents */}
      <View style={styles.section}>
        <Text variant="label">Ownership documents</Text>
        <Text variant="bodySm" muted style={{ marginBottom: spacing.sm }}>
          Upload C of O, survey, deed, or other title documents (max 10MB each)
        </Text>
        <TouchableOpacity style={styles.docUploadBtn} onPress={addDocument} disabled={uploading}>
          <Text style={{ fontSize: 28 }}>📄</Text>
          <View>
            <Text variant="body">Upload document</Text>
            <Text variant="bodySm" muted>PDF or image, max 10MB</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  intro: { marginBottom: spacing.xl },
  errorBanner: {
    backgroundColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  section: { marginBottom: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  mediaItem: {
    width: 104,
    height: 104,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mediaImage: { width: 104, height: 104 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,24,45,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: { color: colors.paper, fontSize: 11 },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(179,70,60,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  failedText: { color: colors.paper, fontSize: 11, fontWeight: "700" },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: colors.paper, fontSize: 12 },
  addButton: {
    width: 104,
    height: 104,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.paper,
  },
  addIcon: { fontSize: 28, color: colors.muted },
  docUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    padding: spacing.base,
    gap: spacing.base,
  },
});
