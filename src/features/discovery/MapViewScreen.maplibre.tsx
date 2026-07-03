/**
 * MapLibre GL Native implementation of the map view.
 *
 * To switch from Mapbox to MapLibre:
 *   1. `npx expo install @maplibre/maplibre-react-native`
 *   2. Add `"@maplibre/maplibre-react-native"` to plugins in app.config.ts
 *      (no token needed — MapLibre is open-source)
 *   3. Replace MapViewScreen.tsx with this file:
 *        cp src/features/discovery/MapViewScreen.maplibre.tsx \
 *           src/features/discovery/MapViewScreen.tsx
 *   4. Remove @rnmapbox/maps and its plugin from app.config.ts + .env
 *   5. Set a free tile source (e.g. MapTiler, OpenFreeMap, or self-hosted):
 *        MAPTILER_KEY=<your-key>  (add to .env + app.config extra)
 *      The STYLE_URL below uses OpenFreeMap (no key required in dev).
 */

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
// import MapLibreGL from "@maplibre/maplibre-react-native";
import { useQuery } from "@tanstack/react-query";
import { getPropertiesMap, type MapPoint } from "@/api/endpoints/properties";
import { colors, spacing, radii, fonts } from "@/theme";
import { Text } from "@/components/ui/Text";
import { formatNaira } from "@/lib/money";
import { useNavigation } from "@react-navigation/native";
import { useDiscoveryStore, filtersToSearchFilter } from "./discoveryStore";

// Free vector tile style — no API key required for dev/prototype.
// For production, replace with your MapTiler key:
//   `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const NIGERIA_CENTER: [number, number] = [8.6753, 9.082];
const NIGERIA_ZOOM = 5.5;

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

export function MapViewScreen() {
  const navigation = useNavigation<any>();
  const { filters } = useDiscoveryStore();
  const [selectedPin, setSelectedPin] = useState<MapPoint | null>(null);
  // const cameraRef = useRef<MapLibreGL.Camera>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["properties-map", filters],
    queryFn: () => getPropertiesMap(filtersToSearchFilter(filters)),
  });

  const geojson = data ? toFeatureCollection(data.points) : null;

  const handlePinPress = useCallback(
    (e: { features?: GeoJSON.Feature[] }) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties as MapPoint;
      // const coords = (feature.geometry as GeoJSON.Point).coordinates;
      setSelectedPin(props);
      // cameraRef.current?.flyTo(coords as [number, number], 400);
    },
    []
  );

  return (
    <View style={styles.container}>
      {/*
        Uncomment once @maplibre/maplibre-react-native is installed:

        <MapLibreGL.MapView style={styles.map} styleURL={STYLE_URL} logoEnabled={false}>
          <MapLibreGL.Camera
            ref={cameraRef}
            zoomLevel={NIGERIA_ZOOM}
            centerCoordinate={NIGERIA_CENTER}
          />
          {geojson && (
            <MapLibreGL.ShapeSource
              id="properties"
              shape={geojson}
              cluster
              clusterRadius={50}
              onPress={handlePinPress}
            >
              <MapLibreGL.CircleLayer
                id="clusters"
                filter={["has", "point_count"]}
                style={{ circleColor: colors.blueDeep, circleRadius: 18, circleOpacity: 0.9 }}
              />
              <MapLibreGL.SymbolLayer
                id="cluster-count"
                filter={["has", "point_count"]}
                style={{ textField: ["get", "point_count_abbreviated"], textColor: colors.paper, textSize: 12 }}
              />
              <MapLibreGL.CircleLayer
                id="unclustered-pin"
                filter={["!", ["has", "point_count"]]}
                style={{
                  circleColor: ["case", ["get", "verified"], colors.gold, colors.blueDeep],
                  circleRadius: 10,
                  circleStrokeWidth: 2,
                  circleStrokeColor: colors.paper,
                }}
              />
            </MapLibreGL.ShapeSource>
          )}
        </MapLibreGL.MapView>
      */}

      {/* Placeholder shown until package is installed */}
      <View style={styles.placeholder}>
        <Text variant="h3" center muted>🗺️ MapLibre implementation</Text>
        <Text variant="bodySm" center muted style={{ marginTop: 8 }}>
          Install @maplibre/maplibre-react-native and{"\n"}uncomment the JSX above.
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.blue} />
        </View>
      )}

      {data?.capped && (
        <View style={styles.capBanner}>
          <Text variant="bodySm" style={{ color: colors.paper }}>
            Showing top results — zoom in or refine filters to see more
          </Text>
        </View>
      )}

      {selectedPin && (
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ListingDetail", { id: selectedPin.id })}
          >
            <View style={styles.cardBody}>
              <Text variant="h3">{formatNaira(selectedPin.price)}</Text>
              <Text variant="body" numberOfLines={1}>{selectedPin.title}</Text>
              <Text variant="bodySm" muted>{selectedPin.listingType.replace("_", " ")}</Text>
            </View>
            <Text style={{ color: colors.blue, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => setSelectedPin(null)}>
            <Text style={{ color: colors.muted }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: {
    flex: 1, backgroundColor: colors.blueSoft,
    alignItems: "center", justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(246,248,250,0.6)",
  },
  capBanner: {
    position: "absolute", top: spacing.base, alignSelf: "center",
    backgroundColor: colors.blueInk,
    paddingHorizontal: spacing.base, paddingVertical: 6,
    borderRadius: radii.chip, opacity: 0.9,
  },
  cardContainer: {
    position: "absolute", bottom: spacing.xl,
    left: spacing.base, right: spacing.base,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  card: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: colors.paper, borderRadius: radii.card,
    padding: spacing.base,
    shadowColor: colors.blueInk, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  cardBody: { flex: 1 },
  dismissBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.paper,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
  },
});
