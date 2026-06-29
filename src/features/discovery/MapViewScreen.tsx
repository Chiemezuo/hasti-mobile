import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getPropertiesMap } from "@/api/endpoints/properties";
import { colors, spacing } from "@/theme";
import { Text } from "@/components/ui/Text";
import { formatNaira } from "@/lib/money";
import { useNavigation } from "@react-navigation/native";

// MapLibre / Mapbox import — using a placeholder for the map component
// In production: import MapboxGL from "@rnmapbox/maps";
// The map itself requires a Mapbox token configured in app.config.ts

export function MapViewScreen() {
  const navigation = useNavigation<any>();
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const { data: pins, isLoading } = useQuery({
    queryKey: ["properties-map"],
    queryFn: () => getPropertiesMap({}),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.blue} size="large" />
        <Text variant="bodySm" muted style={{ marginTop: 8 }}>
          Loading map…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map placeholder — replace with MapboxGL.MapView in production */}
      <View style={styles.mapPlaceholder}>
        <Text variant="h3" center muted>
          🗺️ Map View
        </Text>
        <Text variant="bodySm" center muted style={{ marginTop: 8 }}>
          {pins?.points.length ?? 0} properties in this area
          {pins?.capped ? " (showing top results — zoom or refine to narrow)" : ""}
        </Text>
        <Text variant="bodySm" center muted style={{ marginTop: 4, fontSize: 11 }}>
          Integrate @rnmapbox/maps or MapLibre RN here.{"\n"}
          Showing top results only — zoom or refine to narrow.
        </Text>
      </View>

      {/* Pin list for testing */}
      <View style={styles.pinList}>
        <Text variant="label" style={{ padding: spacing.base }}>
          Properties ({pins?.points.length ?? 0})
        </Text>
        {(pins?.points ?? []).slice(0, 5).map((pin) => (
          <TouchableOpacity
            key={pin.id}
            style={styles.pinRow}
            onPress={() => navigation.navigate("ListingDetail", { id: pin.id })}
          >
            <Text variant="body">{formatNaira(pin.price)}</Text>
            <Text variant="bodySm" muted>
              {pin.listingType}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  pinList: {
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderColor: colors.line,
    maxHeight: 300,
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
});
