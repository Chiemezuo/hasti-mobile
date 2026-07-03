import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  BackHandler,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useQuery } from "@tanstack/react-query";
import { getPropertiesMap, type MapPoint } from "@/api/endpoints/properties";
import { colors, spacing, radii, fonts } from "@/theme";
import { Text } from "@/components/ui/Text";
import { formatNaira } from "@/lib/money";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useDiscoveryStore, filtersToSearchFilter } from "./discoveryStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - spacing.base * 2;

// Nigeria centroid — default camera position
const NIGERIA_CENTER: [number, number] = [8.6753, 9.082];
const NIGERIA_ZOOM = 5.5;

MapboxGL.setAccessToken(
  (Constants.expoConfig?.extra?.mapboxPublicToken as string | undefined) ?? ""
);

// ── GeoJSON helpers ──────────────────────────────────────────────────────────

function toFeatureCollection(points: MapPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        title: p.title,
        price: p.price,
        listingType: p.listingType,
        verified: p.verified,
      },
    })),
  };
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function MapViewScreen() {
  const navigation = useNavigation<any>();
  const { filters } = useDiscoveryStore();
  const [selectedPin, setSelectedPin] = useState<MapPoint | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (isZoomedIn) {
          cameraRef.current?.flyTo(NIGERIA_CENTER, 600);
          cameraRef.current?.zoomTo(NIGERIA_ZOOM, 600);
          setIsZoomedIn(false);
          setSelectedPin(null);
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [isZoomedIn])
  );

  const { data, isLoading } = useQuery({
    queryKey: ["properties-map", filters],
    queryFn: () => getPropertiesMap(filtersToSearchFilter(filters)),
  });

  const geojson = data ? toFeatureCollection(data.points) : null;

  const handleShapePress = useCallback(
    (e: { features?: GeoJSON.Feature[] }) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      const props = feature.properties ?? {};

      // Individual pins always have our 'id' property.
      // Mapbox cluster features never have 'id' — they only have point_count etc.
      if (!props.id) {
        cameraRef.current?.flyTo(coords, 400);
        cameraRef.current?.zoomTo(15, 400);
        setIsZoomedIn(true);
        return;
      }

      setSelectedPin(props as unknown as MapPoint);
      cameraRef.current?.flyTo(coords, 400);
    },
    []
  );

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={NIGERIA_ZOOM}
          centerCoordinate={NIGERIA_CENTER}
          animationMode="flyTo"
          animationDuration={600}
        />

        {geojson && (
          <MapboxGL.ShapeSource
            id="properties"
            shape={geojson}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={14}
            onPress={handleShapePress}
          >
            {/* Cluster circle */}
            <MapboxGL.CircleLayer
              id="clusters"
              filter={["has", "point_count"]}
              style={{
                circleColor: colors.blueDeep,
                circleRadius: [
                  "step",
                  ["get", "point_count"],
                  16, 10,
                  22, 50,
                  28,
                ],
                circleOpacity: 0.9,
              }}
            />
            {/* Cluster count label */}
            <MapboxGL.SymbolLayer
              id="cluster-count"
              filter={["has", "point_count"]}
              style={{
                textField: ["get", "point_count_abbreviated"],
                textColor: colors.paper,
                textSize: 12,
                textFont: ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              }}
            />
            {/* Individual pin circle */}
            <MapboxGL.CircleLayer
              id="unclustered-pin"
              filter={["!", ["has", "point_count"]]}
              style={{
                circleColor: [
                  "case",
                  ["get", "verified"],
                  colors.gold,
                  colors.blueDeep,
                ],
                circleRadius: 10,
                circleStrokeWidth: 2,
                circleStrokeColor: colors.paper,
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.blue} />
        </View>
      )}

      {/* Cap warning */}
      {data?.capped && (
        <View style={styles.capBanner}>
          <Text variant="bodySm" style={{ color: colors.paper }}>
            Showing top results — zoom in or refine filters to see more
          </Text>
        </View>
      )}

      {/* Selected pin card */}
      {selectedPin && (
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("ListingDetail", { id: selectedPin.id })}
          >
            <View style={styles.cardBody}>
              <Text variant="h3" style={styles.cardPrice}>
                {formatNaira(selectedPin.price)}
                {selectedPin.pricePeriod ? (
                  <Text variant="bodySm" muted> /{selectedPin.pricePeriod}</Text>
                ) : null}
              </Text>
              <Text variant="body" numberOfLines={1}>{selectedPin.title}</Text>
              <Text variant="bodySm" muted style={{ marginTop: 2 }}>
                {selectedPin.listingType.replace("_", " ")}
                {selectedPin.verified ? "  ✓ Verified" : ""}
              </Text>
            </View>
            <View style={styles.cardArrow}>
              <Text style={{ color: colors.blue, fontSize: 18 }}>›</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => setSelectedPin(null)}>
            <Text style={styles.dismissX}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(246,248,250,0.6)",
  },
  capBanner: {
    position: "absolute",
    top: spacing.base,
    alignSelf: "center",
    backgroundColor: colors.blueInk,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    borderRadius: radii.chip,
    opacity: 0.9,
  },
  cardContainer: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.base,
    right: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    padding: spacing.base,
    shadowColor: colors.blueInk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardBody: { flex: 1 },
  cardPrice: {
    fontFamily: fonts.frauncesRegular,
    marginBottom: 2,
  },
  cardArrow: { paddingLeft: spacing.sm },
  dismissBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.blueInk,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  dismissX: { color: colors.muted, fontSize: 14 },
});
