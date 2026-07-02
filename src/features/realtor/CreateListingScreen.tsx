import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createListing, type CreateListingInput } from "@/api/endpoints/realtor";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useNavigation } from "@react-navigation/native";
import { ApiError } from "@/api/client";

const LISTING_TYPES = ["SALE", "RENT", "LEASE", "SHORT_STAY"] as const;
type ListingType = (typeof LISTING_TYPES)[number];

const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SALE: "For sale",
  RENT: "For rent",
  LEASE: "Lease",
  SHORT_STAY: "Short stay",
};

export function CreateListingScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ListingType>("SALE");
  const [error, setError] = useState("");

  const { control, handleSubmit, formState: { errors } } = useForm<Omit<CreateListingInput, "listingType">>();

  const mutation = useMutation({
    mutationFn: (input: CreateListingInput) => createListing(input),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      navigation.replace("EditListing", { id: listing.id });
    },
    onError: (err) => {
      if (err instanceof ApiError) setError(err.problem.title);
      else setError("Failed to create listing.");
    },
  });

  function onSubmit(data: Omit<CreateListingInput, "listingType">) {
    mutation.mutate({
      ...data,
      price: Number(data.price),
      listingType: selectedType,
      lat: Number(data.lat),
      lng: Number(data.lng),
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="body" muted style={styles.intro}>
          Create a draft listing. You'll add photos and documents next.
        </Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text variant="bodySm" style={{ color: colors.error }}>{error}</Text>
          </View>
        ) : null}

        {/* Listing type */}
        <View style={styles.section}>
          <Text variant="label">Listing type</Text>
          <View style={styles.typeRow}>
            {LISTING_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, selectedType === type && styles.typeChipSelected]}
                onPress={() => setSelectedType(type)}
              >
                <Text variant="bodySm" style={selectedType === type ? { color: colors.paper } : {}}>
                  {LISTING_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Controller
          control={control}
          name="title"
          rules={{ required: "Title is required", minLength: { value: 10, message: "At least 10 characters" }, maxLength: { value: 120, message: "Max 120 characters" } }}
          render={({ field }) => (
            <Input label="Title" placeholder="5-bedroom detached duplex, Lekki Phase 1" error={errors.title?.message} value={field.value} onChangeText={field.onChange} />
          )}
        />

        <Controller
          control={control}
          name="description"
          rules={{ required: "Description is required" }}
          render={({ field }) => (
            <Input label="Description" placeholder="Describe the property…" multiline numberOfLines={4} error={errors.description?.message} value={field.value} onChangeText={field.onChange} />
          )}
        />

        <Controller
          control={control}
          name="price"
          rules={{ required: "Price is required", pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Enter a valid amount" } }}
          render={({ field }) => (
            <Input label="Price (₦)" placeholder="25000000" keyboardType="numeric" prefix="₦" error={errors.price?.message} value={String(field.value ?? "")} onChangeText={field.onChange} />
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="bedrooms"
            render={({ field }) => (
              <Input label="Bedrooms" placeholder="3" keyboardType="numeric" value={String(field.value ?? "")} onChangeText={(v) => field.onChange(Number(v))} containerStyle={{ flex: 1 }} />
            )}
          />
          <Controller
            control={control}
            name="bathrooms"
            render={({ field }) => (
              <Input label="Bathrooms" placeholder="2" keyboardType="numeric" value={String(field.value ?? "")} onChangeText={(v) => field.onChange(Number(v))} containerStyle={{ flex: 1 }} />
            )}
          />
        </View>

        <Controller
          control={control}
          name="address"
          rules={{ required: "Address is required" }}
          render={({ field }) => (
            <Input label="Street address" placeholder="12 Admiralty Way" error={errors.address?.message} value={field.value} onChangeText={field.onChange} />
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="city"
            rules={{ required: "City is required" }}
            render={({ field }) => (
              <Input label="City" placeholder="Lagos" error={errors.city?.message} value={field.value} onChangeText={field.onChange} containerStyle={{ flex: 1 }} />
            )}
          />
          <Controller
            control={control}
            name="state"
            rules={{ required: "State is required" }}
            render={({ field }) => (
              <Input label="State" placeholder="Lagos" error={errors.state?.message} value={field.value} onChangeText={field.onChange} containerStyle={{ flex: 1 }} />
            )}
          />
        </View>

        <View style={styles.row}>
          <Controller
            control={control}
            name="lat"
            render={({ field }) => (
              <Input label="Latitude" placeholder="6.4281" keyboardType="decimal-pad" value={String(field.value ?? "")} onChangeText={(v) => field.onChange(Number(v))} containerStyle={{ flex: 1 }} />
            )}
          />
          <Controller
            control={control}
            name="lng"
            render={({ field }) => (
              <Input label="Longitude" placeholder="3.4219" keyboardType="decimal-pad" value={String(field.value ?? "")} onChangeText={(v) => field.onChange(Number(v))} containerStyle={{ flex: 1 }} />
            )}
          />
        </View>

        <Button label="Create draft listing" onPress={handleSubmit(onSubmit)} loading={mutation.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base },
  intro: { marginBottom: spacing.xl },
  errorBanner: { backgroundColor: `${colors.error}1a`, borderRadius: 12, padding: spacing.base, marginBottom: spacing.base },
  section: { marginBottom: spacing.base },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.chip, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  typeChipSelected: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  row: { flexDirection: "row", gap: spacing.sm },
});
