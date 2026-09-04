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
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { presignKyc, submitKyc } from "@/api/endpoints/kyc";
import { putToStorage, getContentType } from "@/lib/upload";
import { useAuthStore } from "@/auth/store";
import { getMe } from "@/api/endpoints/account";

const ID_TYPES = [
  { value: "NIN_SLIP", label: "NIN slip" },
  { value: "NATIONAL_ID", label: "National ID card" },
  { value: "PASSPORT", label: "International passport" },
  { value: "DRIVERS_LICENCE", label: "Driver's licence" },
] as const;

type IdType = (typeof ID_TYPES)[number]["value"];

interface UploadSlot {
  uri: string | null;
  key: string | null;
  uploading: boolean;
  error: string | null;
}

const emptySlot: UploadSlot = { uri: null, key: null, uploading: false, error: null };

export function KycScreen() {
  const { user, setUser } = useAuthStore();
  const [idType, setIdType] = useState<IdType | null>(null);
  const [idSlot, setIdSlot] = useState<UploadSlot>(emptySlot);
  const [selfieSlot, setSelfieSlot] = useState<UploadSlot>(emptySlot);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isApproved = user?.kycApproved;

  async function pickAndUpload(
    slot: "id" | "selfie",
    useCamera = false
  ) {
    const setSlot = slot === "id" ? setIdSlot : setSelfieSlot;

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85 });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const contentType = asset.mimeType ?? getContentType(asset.uri);

    setSlot((prev) => ({ ...prev, uri: asset.uri, uploading: true, error: null }));
    try {
      const { url, key } = await presignKyc(slot, contentType);
      await putToStorage(url, asset.uri, contentType);
      setSlot((prev) => ({ ...prev, key, uploading: false }));
    } catch {
      setSlot((prev) => ({ ...prev, uploading: false, error: "Upload failed. Tap to retry." }));
    }
  }

  async function handleSubmit() {
    if (!idType || !idSlot.key || !selfieSlot.key) {
      setError("Please provide your ID document, selfie, and ID type.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitKyc({
        idType,
        idDocumentKey: idSlot.key,
        selfieKey: selfieSlot.key,
      });
      setSubmitted(true);
      // Refresh user to pick up any status change
      const me = await getMe();
      setUser(me);
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isApproved) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle" size={56} color={colors.blue} />
        <Text variant="h2" center style={{ marginTop: 16 }}>Identity verified</Text>
        <Text variant="body" muted center style={{ marginTop: 8 }}>
          Your identity has been verified. You can now access all HASTI features.
        </Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="hourglass-outline" size={56} color={colors.gold} />
        <Text variant="h2" center style={{ marginTop: 16 }}>Under review</Text>
        <Text variant="body" muted center style={{ marginTop: 8 }}>
          Your documents have been submitted. You'll be notified when the review is complete.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="body" muted style={styles.intro}>
        HASTI verifies your identity to protect buyers and realtors. Upload clear photos of your ID and a selfie.
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text variant="bodySm" style={{ color: colors.error }}>{error}</Text>
        </View>
      ) : null}

      {/* ID Type */}
      <View style={styles.section}>
        <Text variant="label">ID type</Text>
        <View style={styles.typeGrid}>
          {ID_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeChip,
                idType === t.value && styles.typeChipSelected,
              ]}
              onPress={() => setIdType(t.value)}
            >
              <Text
                variant="bodySm"
                style={idType === t.value ? { color: colors.paper } : {}}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ID document upload */}
      <UploadSlotUI
        label="ID document"
        hint="Front of your ID card, passport biodata page, or driver's licence"
        slot={idSlot}
        onPickFromLibrary={() => pickAndUpload("id", false)}
        onPickFromCamera={() => pickAndUpload("id", true)}
      />

      {/* Selfie upload */}
      <UploadSlotUI
        label="Selfie"
        hint="A clear photo of your face holding your ID document"
        slot={selfieSlot}
        onPickFromLibrary={() => pickAndUpload("selfie", false)}
        onPickFromCamera={() => pickAndUpload("selfie", true)}
      />

      <Button
        label="Submit for verification"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!idType || !idSlot.key || !selfieSlot.key}
      />

      <Text variant="bodySm" muted center style={styles.legalNote}>
        Your documents are encrypted and reviewed only by HASTI staff. They are never shared with third parties.
      </Text>
    </ScrollView>
  );
}

interface UploadSlotUIProps {
  label: string;
  hint: string;
  slot: UploadSlot;
  onPickFromLibrary: () => void;
  onPickFromCamera: () => void;
}

function UploadSlotUI({ label, hint, slot, onPickFromLibrary, onPickFromCamera }: UploadSlotUIProps) {
  return (
    <View style={styles.section}>
      <Text variant="label">{label}</Text>
      <Text variant="bodySm" muted style={{ marginBottom: spacing.sm }}>{hint}</Text>
      {slot.uri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: slot.uri }} style={styles.preview} contentFit="cover" />
          {slot.uploading && (
            <View style={styles.uploadingOverlay}>
              <Text style={{ color: colors.paper }}>Uploading…</Text>
            </View>
          )}
          {slot.key && (
            <View style={styles.doneOverlay}>
              <Ionicons name="checkmark" size={16} color={colors.paper} />
            </View>
          )}
          {slot.error && (
            <View style={styles.errorOverlay}>
              <Text style={{ color: colors.paper, fontSize: 12 }}>{slot.error}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadBtn} onPress={onPickFromCamera}>
            <Ionicons name="camera-outline" size={26} color={colors.blue} />
            <Text variant="bodySm">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={onPickFromLibrary}>
            <Ionicons name="image-outline" size={26} color={colors.blue} />
            <Text variant="bodySm">Library</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.bg },
  intro: { marginBottom: spacing.xl },
  errorBanner: {
    backgroundColor: `${colors.error}1a`,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  section: { marginBottom: spacing.xl },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  typeChipSelected: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  previewContainer: { height: 200, borderRadius: radii.card, overflow: "hidden", position: "relative" },
  preview: { width: "100%", height: "100%" },
  uploadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  doneOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d7a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(179,70,60,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.base,
  },
  uploadButtons: { flexDirection: "row", gap: spacing.sm },
  uploadBtn: {
    flex: 1,
    height: 100,
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  legalNote: { marginTop: spacing.base },
});
