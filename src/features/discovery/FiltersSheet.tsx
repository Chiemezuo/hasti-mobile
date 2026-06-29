import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, radii } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const LISTING_TYPES = ["BUY", "RENT", "LEASE", "SHORT_STAY"];
const LISTING_TYPE_LABELS: Record<string, string> = {
  BUY: "For sale",
  RENT: "For rent",
  LEASE: "Lease",
  SHORT_STAY: "Short stay",
};

export function FiltersSheet() {
  const navigation = useNavigation<any>();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [city, setCity] = useState("");

  function handleApply() {
    // In real app, pass filters back to DiscoverScreen via navigation params or shared state
    navigation.goBack();
  }

  function handleClear() {
    setSelectedType(null);
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setCity("");
  }

  return (
    <View style={styles.container}>
      {/* Handle */}
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text variant="h2">Filters</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text variant="bodySm" style={{ color: colors.blue }}>
            Clear all
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Listing type */}
        <View style={styles.section}>
          <Text variant="label">Property type</Text>
          <View style={styles.typeRow}>
            {LISTING_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  selectedType === type && styles.typeChipSelected,
                ]}
                onPress={() =>
                  setSelectedType(selectedType === type ? null : type)
                }
              >
                <Text
                  variant="bodySm"
                  style={
                    selectedType === type
                      ? { color: colors.paper }
                      : { color: colors.ink }
                  }
                >
                  {LISTING_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price range */}
        <View style={styles.section}>
          <Text variant="label">Price range (₦)</Text>
          <View style={styles.priceRow}>
            <Input
              label="Min"
              placeholder="0"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
              prefix="₦"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Max"
              placeholder="Any"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
              prefix="₦"
              containerStyle={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Bedrooms */}
        <View style={styles.section}>
          <Text variant="label">Minimum bedrooms</Text>
          <View style={styles.bedsRow}>
            {["1", "2", "3", "4", "5+"].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.bedChip,
                  bedrooms === n && styles.bedChipSelected,
                ]}
                onPress={() => setBedrooms(bedrooms === n ? "" : n)}
              >
                <Text
                  variant="bodySm"
                  style={bedrooms === n ? { color: colors.paper } : undefined}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* City */}
        <View style={styles.section}>
          <Input
            label="City"
            placeholder="Lagos, Abuja, Port Harcourt…"
            value={city}
            onChangeText={setCity}
            returnKeyType="done"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Show results" onPress={handleApply} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.base },
  section: { marginBottom: spacing.xl },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  typeChipSelected: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  priceRow: { flexDirection: "row", gap: spacing.sm },
  bedsRow: { flexDirection: "row", gap: 8, marginTop: spacing.sm },
  bedChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  bedChipSelected: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
});
