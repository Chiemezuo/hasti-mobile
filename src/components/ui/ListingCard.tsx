import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors, radii, spacing, shadows } from "@/theme";
import { Text } from "./Text";
import { VerifiedBadge } from "./VerifiedBadge";
import { formatNaira } from "@/lib/money";
import { mediaUrl } from "@/lib/upload";
import type { ListingCard as ListingCardData } from "@/api/endpoints/properties";

interface ListingCardProps {
  property: ListingCardData;
  isFavorited?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: "For sale",
  RENT: "For rent",
  LEASE: "Lease",
  SHORT_STAY: "Short stay",
};

export function ListingCard({
  property,
  isFavorited,
  onPress,
  onToggleFavorite,
}: ListingCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const thumbnailKey =
    property.coverImage?.thumbnailKeys?.["400"] ??
    property.coverImage?.key;
  const thumbnailUri = thumbnailKey ? mediaUrl(thumbnailKey) : undefined;

  const listingTypeLabel = LISTING_TYPE_LABELS[property.listingType] ?? property.listingType;

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.98, { duration: 120 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
    >
      {/* Hero image */}
      <View style={styles.imageContainer}>
        <Image
          source={thumbnailUri ? { uri: thumbnailUri } : undefined}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        />
        {/* Scrim */}
        <View style={styles.scrim} />
        {/* Badges */}
        <View style={styles.topLeft}>
          <View style={styles.categoryPill}>
            <Text style={styles.pillText}>{listingTypeLabel}</Text>
          </View>
        </View>
        <View style={styles.topRight}>
          {property.verified && <VerifiedBadge />}
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={onToggleFavorite}
              style={styles.heartButton}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityLabel={isFavorited ? "Remove from saved" : "Save to favorites"}
            >
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={18}
                color={isFavorited ? colors.error : colors.muted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text variant="price">{formatNaira(property.price)}</Text>
        {property.pricePeriod && (
          <Text variant="bodySm" muted style={styles.period}>
            {" "}/ {property.pricePeriod.toLowerCase().replace("_", " ")}
          </Text>
        )}
        <Text variant="body" style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text variant="bodySm" muted numberOfLines={1} style={styles.location}>
            {property.city}, {property.state}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.specs}>
          {property.bedrooms != null && (
            <View style={styles.specItem}>
              <Ionicons name="bed-outline" size={14} color={colors.muted} />
              <Text variant="bodySm" muted>
                {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {property.bathrooms != null && (
            <View style={styles.specItem}>
              <Ionicons name="water-outline" size={14} color={colors.muted} />
              <Text variant="bodySm" muted>
                {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {property.sizeSqm != null && (
            <View style={styles.specItem}>
              <Ionicons name="resize-outline" size={14} color={colors.muted} />
              <Text variant="bodySm" muted>
                {property.sizeSqm} m²
              </Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    ...shadows.card,
    marginBottom: 16,
  },
  imageContainer: {
    height: 200,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  scrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(8,24,45,0.35)",
  },
  topLeft: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  topRight: {
    position: "absolute",
    top: 12,
    right: 12,
    gap: 8,
    alignItems: "flex-end",
  },
  categoryPill: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.blueInk,
  },
  heartButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
  },
  body: {
    padding: 16,
  },
  title: {
    marginTop: 4,
    fontWeight: "700",
  },
  period: {
    display: "flex",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  location: {},
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 12,
  },
  specs: {
    flexDirection: "row",
    gap: 16,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
