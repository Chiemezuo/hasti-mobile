import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  PanResponder,
  Animated,
  BackHandler,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPropertyById, toggleFavorite } from "@/api/endpoints/properties";
import { mediaUrl } from "@/lib/upload";
import { openConversation } from "@/api/endpoints/conversations";
import { colors, spacing, radii, fonts } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { EscrowShield } from "@/components/ui/EscrowShield";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNaira } from "@/lib/money";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuthStore } from "@/auth/store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GALLERY_BASE = 300;

export function ListingDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeImage, setActiveImage] = useState(0);

  // 0 = gallery at resting height (300px), 1 = gallery fills the screen
  const expansionAnim = useRef(new Animated.Value(0)).current;
  // Ref copy so PanResponder closures (created once) always read the latest value
  const expansionRef = useRef(0);
  const gestureStartExpansion = useRef(0);

  useEffect(() => {
    const listenerId = expansionAnim.addListener(({ value }) => {
      expansionRef.current = value;
    });
    return () => expansionAnim.removeListener(listenerId);
  }, []);

  // Android hardware back: collapse gallery instead of navigating away when expanded
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (expansionRef.current > 0.1) {
        collapseGallery();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const EXPAND_RANGE = SCREEN_HEIGHT - GALLERY_BASE;

  const galleryHeight = expansionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GALLERY_BASE, SCREEN_HEIGHT],
    extrapolate: "clamp",
  });
  const bodyOpacity = expansionAnim.interpolate({
    inputRange: [0, 0.4],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const bodyTranslateY = expansionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
    extrapolate: "clamp",
  });
  const collapseIndicatorOpacity = expansionAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  function expandGallery() {
    Animated.spring(expansionAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 65,
      friction: 12,
    }).start();
  }

  function collapseGallery() {
    Animated.spring(expansionAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 65,
      friction: 12,
    }).start();
  }

  const galleryPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Claim vertical gestures (both directions); horizontal ones pass to the inner FlatList
      onMoveShouldSetPanResponder: (_, { dy, dx }) =>
        Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.5,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        gestureStartExpansion.current = expansionRef.current;
      },
      onPanResponderMove: (_, { dy }) => {
        // dy is total displacement from gesture start; map it to a 0–1 progress delta
        const delta = dy / EXPAND_RANGE;
        const next = Math.max(0, Math.min(1, gestureStartExpansion.current + delta));
        expansionAnim.setValue(next);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const delta = dy / EXPAND_RANGE;
        const projected = gestureStartExpansion.current + delta;
        // Snap open if dragged past midpoint or flicked down; snap closed otherwise
        if (projected > 0.45 || vy > 0.8) {
          expandGallery();
        } else {
          collapseGallery();
        }
      },
    })
  ).current;

  const favData = queryClient.getQueryData<{ ids: string[] }>(["favorite-ids"]);
  const favSet = new Set(favData?.ids ?? []);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getPropertyById(id),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ add }: { add: boolean }) => toggleFavorite(id, add),
    onMutate: async ({ add }) => {
      const prev = queryClient.getQueryData<{ ids: string[] }>(["favorite-ids"]);
      queryClient.setQueryData<{ ids: string[] }>(["favorite-ids"], (old) => ({
        ids: add
          ? [...(old?.ids ?? []), id]
          : (old?.ids ?? []).filter((fid) => fid !== id),
      }));
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["favorite-ids"], ctx.prev);
    },
  });

  const chatMutation = useMutation({
    mutationFn: () => openConversation(id),
    onSuccess: (conv) => {
      navigation.navigate("ChatsTab", { screen: "ConversationThread", params: { id: conv.id } });
    },
  });

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <Skeleton height={300} radius={0} />
        <View style={styles.body}>
          <Skeleton height={28} width="50%" />
          <Skeleton height={20} width="80%" style={{ marginTop: 8 }} />
          <Skeleton height={16} width="60%" style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    );
  }

  if (!property) return null;

  const images = property.media.filter((m) => m.type === "IMAGE" && m.status === "READY");

  const period = property.pricePeriod
    ? ` / ${property.pricePeriod.toLowerCase().replace("_", " ")}`
    : "";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero gallery — drawer-expands to fill the screen on swipe-down / tap */}
      <Animated.View style={[styles.galleryContainer, { height: galleryHeight }]} {...galleryPanResponder.panHandlers}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            contentContainerStyle={{ alignItems: "stretch" }}
            scrollEventThrottle={200}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImage(idx);
            }}
          >
            {images.map((img) => (
              <TouchableOpacity
                key={img.id}
                activeOpacity={0.9}
                onPress={() =>
                  expansionRef.current > 0.5 ? collapseGallery() : expandGallery()
                }
                style={{ width: SCREEN_WIDTH }}
              >
                <Image
                  source={{ uri: mediaUrl(img.thumbnailKeys?.["800"] ?? img.key) }}
                  style={{ flex: 1, width: SCREEN_WIDTH }}
                  contentFit="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noImage}>
            <Text muted center>No photos available</Text>
          </View>
        )}
        {/* Scrim */}
        <View style={styles.heroScrim} />
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => {
            if (expansionRef.current > 0.1) collapseGallery();
            else navigation.goBack();
          }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        {/* Favorite button */}
        {user && (
          <TouchableOpacity
            style={[styles.favoriteBtn, { top: insets.top + 8 }]}
            onPress={() => {
              const isFav = favSet.has(id);
              favoriteMutation.mutate({ add: !isFav });
            }}
          >
            <Text style={styles.favoriteIcon}>{favSet.has(id) ? "♥" : "♡"}</Text>
          </TouchableOpacity>
        )}
        {/* Image counter */}
        {images.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.counterText}>{activeImage + 1}/{images.length}</Text>
          </View>
        )}
        {/* Verified badge */}
        {property.verifiedAt && (
          <View style={styles.verifiedBadge}>
            <VerifiedBadge />
          </View>
        )}
        {/* Collapse handle — appears only when fully expanded */}
        <Animated.View style={[styles.collapseHandle, { opacity: collapseIndicatorOpacity }]}>
          <TouchableOpacity onPress={collapseGallery} style={styles.collapseBtn}>
            <Text style={styles.collapseBtnIcon}>↓</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Scrollable body — fades and slides away as gallery expands */}
      <Animated.View style={{ flex: 1, opacity: bodyOpacity, transform: [{ translateY: bodyTranslateY }] }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.body}>
          {/* Price & type */}
          <View style={styles.priceRow}>
            <View style={styles.priceBlock}>
              <Text variant="display">{formatNaira(property.price)}</Text>
              {period ? (
                <Text variant="bodySm" muted style={styles.period}>
                  {period}
                </Text>
              ) : null}
            </View>
            <StatusChip
              label={property.listingType.replace("_", " ")}
              family="positive"
            />
          </View>

          <Text variant="h2" style={styles.title}>
            {property.title}
          </Text>
          <Text variant="body" muted style={styles.address}>
            📍 {property.address}, {property.city}, {property.state}
          </Text>

          {/* Specs */}
          <View style={styles.specsRow}>
            {property.bedrooms != null && (
              <View style={styles.specItem}>
                <Text style={styles.specIcon}>🛏</Text>
                <Text variant="bodySm">{property.bedrooms} beds</Text>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.specItem}>
                <Text style={styles.specIcon}>🚿</Text>
                <Text variant="bodySm">{property.bathrooms} baths</Text>
              </View>
            )}
            {property.sizeSqm != null && (
              <View style={styles.specItem}>
                <Text style={styles.specIcon}>📐</Text>
                <Text variant="bodySm">{property.sizeSqm} m²</Text>
              </View>
            )}
          </View>

          {/* Escrow trust strip */}
          <EscrowShield />

          {/* Description */}
          <View style={styles.section}>
            <Text variant="label">About this property</Text>
            <Text variant="body" style={styles.description}>
              {property.description}
            </Text>
          </View>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text variant="label">Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((a) => (
                  <View key={a} style={styles.amenityChip}>
                    <Text variant="bodySm">{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Realtor */}
          <View style={styles.section}>
            <Text variant="label">Listed by</Text>
            <View style={styles.realtorRow}>
              <View style={styles.realtorAvatar}>
                <Text style={styles.realtorInitial}>🏠</Text>
              </View>
              <Text variant="body" style={{ fontWeight: "600" }}>
                Verified realtor
              </Text>
            </View>
          </View>

          {/* CTA spacer */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
      </Animated.View>

      {/* Sticky CTA */}

      {user && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label="Chat with realtor"
            onPress={() => chatMutation.mutate()}
            loading={chatMutation.isPending}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  galleryContainer: { position: "relative", overflow: "hidden", backgroundColor: colors.ink },
  heroScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(8,24,45,0.3)",
  },
  noImage: {
    width: SCREEN_WIDTH,
    height: GALLERY_BASE,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  collapseHandle: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  collapseBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  collapseBtnIcon: { fontSize: 18, color: colors.ink },
  backBtn: {
    position: "absolute",
    left: spacing.base,
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 18, color: colors.ink },
  favoriteBtn: {
    position: "absolute",
    right: spacing.base,
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteIcon: { fontSize: 18, color: colors.error },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(8,24,45,0.6)",
    borderRadius: radii.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { color: colors.paper, fontSize: 12 },
  verifiedBadge: { position: "absolute", bottom: 16, left: 16 },
  body: { padding: spacing.base },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  priceBlock: { flex: 1 },
  period: { marginTop: 2 },
  title: { marginBottom: spacing.xs },
  address: { marginBottom: spacing.base },
  specsRow: {
    flexDirection: "row",
    gap: spacing.xl,
    paddingVertical: spacing.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.base,
  },
  specItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  specIcon: { fontSize: 16 },
  section: { marginTop: spacing.xl },
  description: { marginTop: spacing.sm, lineHeight: 24 },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },
  amenityChip: {
    backgroundColor: colors.blueSoft,
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  realtorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  realtorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  realtorInitial: { fontSize: 20, color: colors.blue, fontWeight: "700" },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(246,248,250,0.96)",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
