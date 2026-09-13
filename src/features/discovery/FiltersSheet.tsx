import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, fonts } from "@/theme";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { geoSuggest, getProperties } from "@/api/endpoints/properties";
import { useDiscoveryStore, filtersToSearchFilter, type ActiveFilters } from "./discoveryStore";

const LISTING_TYPES = ["SALE", "RENT", "LEASE", "SHORT_STAY"] as const;
const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: "Buy",
  RENT: "Rent",
  LEASE: "Lease",
  SHORT_STAY: "Shortlets",
};
const ROOM_OPTIONS = ["Any", "1", "2", "3", "4", "5+"];
const POPULAR_CITIES = ["Lagos", "Abuja", "Port Harcourt", "Enugu", "Kano", "Ibadan"];

interface GeoSuggestion {
  label: string;
  lat: number;
  lng: number;
  bbox: number[] | null;
}

export function FiltersSheet() {
  const navigation = useNavigation<any>();
  const { filters, setFilters, clearFilters } = useDiscoveryStore();

  const [type, setType] = useState<string>(filters.type ?? "");
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? "");
  const [bedrooms, setBedrooms] = useState(filters.bedrooms ?? "");
  const [bathrooms, setBathrooms] = useState(filters.bathrooms ?? "");
  const [locationText, setLocationText] = useState(filters.city ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(filters.verifiedOnly ?? false);

  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [selectedGeo, setSelectedGeo] = useState<GeoSuggestion | null>(
    filters.lat !== undefined
      ? { label: filters.city ?? "", lat: filters.lat!, lng: filters.lng!, bbox: filters.bbox ? JSON.parse(filters.bbox) : null }
      : null
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedGeo) return; // already resolved — don't suggest again
    if (locationText.length < 2) { setSuggestions([]); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await geoSuggest(locationText);
        setSuggestions(res.suggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [locationText, selectedGeo]);

  function pickSuggestion(s: GeoSuggestion) {
    setSelectedGeo(s);
    setLocationText(s.label);
    setSuggestions([]);
  }

  function pickCity(city: string) {
    setSelectedGeo(null);
    setSuggestions([]);
    setLocationText((prev) => (prev === city ? "" : city));
  }

  function clearLocation() {
    setSelectedGeo(null);
    setLocationText("");
    setSuggestions([]);
  }

  const draftFilters: ActiveFilters = {
    ...(type ? { type } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    ...(bedrooms && bedrooms !== "Any" ? { bedrooms } : {}),
    ...(bathrooms && bathrooms !== "Any" ? { bathrooms } : {}),
    ...(verifiedOnly ? { verifiedOnly: true } : {}),
    ...(selectedGeo
      ? {
          city: selectedGeo.label,
          lat: selectedGeo.lat,
          lng: selectedGeo.lng,
          ...(selectedGeo.bbox ? { bbox: JSON.stringify(selectedGeo.bbox) } : {}),
        }
      : locationText
      ? { city: locationText }
      : {}),
  };

  // Live result count for the draft filters, debounced so we're not
  // re-querying on every keystroke.
  const [debouncedDraft, setDebouncedDraft] = useState(draftFilters);
  const draftDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
    draftDebounceRef.current = setTimeout(() => setDebouncedDraft(draftFilters), 400);
    return () => { if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, minPrice, maxPrice, bedrooms, bathrooms, verifiedOnly, locationText, selectedGeo]);

  const { data: countData, isFetching: countLoading } = useQuery({
    queryKey: ["properties-count", debouncedDraft],
    queryFn: () => getProperties({ ...filtersToSearchFilter(debouncedDraft), limit: 1 }),
  });

  function handleApply() {
    setFilters(draftFilters);
    navigation.goBack();
  }

  function handleClear() {
    setType("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setBathrooms("");
    setLocationText("");
    setVerifiedOnly(false);
    setSelectedGeo(null);
    setSuggestions([]);
    clearFilters();
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="h3">Filters</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text variant="bodySm" style={{ color: colors.blue }}>Clear all</Text>
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      <View style={styles.typeRow}>
        {LISTING_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, type === t && styles.chipSelected]}
            onPress={() => setType(type === t ? "" : t)}
          >
            <Text variant="bodySm" style={type === t ? { color: colors.paper, fontWeight: "600" } : { color: colors.ink }}>
              {LISTING_TYPE_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Location with autosuggest */}
        <View style={styles.section}>
          <Text variant="label">Location</Text>
          <View style={styles.locationBox}>
            <Ionicons name="search-outline" size={15} color={colors.muted} />
            <TextInput
              style={styles.locationInput}
              placeholder="Search city…"
              placeholderTextColor={colors.placeholder}
              value={locationText}
              onChangeText={(t) => { setSelectedGeo(null); setLocationText(t); }}
              returnKeyType="search"
            />
            {suggestLoading && <ActivityIndicator size="small" color={colors.blue} style={{ marginRight: 8 }} />}
            {locationText ? (
              <TouchableOpacity onPress={clearLocation}>
                <Ionicons name="close" size={14} color={colors.muted} style={styles.clearX} />
              </TouchableOpacity>
            ) : null}
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestBox}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestRow, i < suggestions.length - 1 && styles.suggestDivider]}
                  onPress={() => pickSuggestion(s)}
                >
                  <View style={styles.suggestRowContent}>
                    <Ionicons name="location-outline" size={14} color={colors.muted} />
                    <Text variant="body">{s.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular city quick-picks */}
          <View style={styles.cityChipRow}>
            {POPULAR_CITIES.map((city) => {
              const active = locationText === city && !selectedGeo;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityChip, active && styles.chipSelected]}
                  onPress={() => pickCity(city)}
                >
                  <Ionicons name="location-outline" size={12} color={active ? colors.paper : colors.muted} />
                  <Text variant="bodySm" style={active ? { color: colors.paper } : { color: colors.ink }}>
                    {city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Price range */}
        <View style={styles.section}>
          <Text variant="label">Budget (₦)</Text>
          <View style={styles.priceRow}>
            <View style={[styles.priceBox, { flex: 1 }]}>
              <Text style={styles.prefix}>₦</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>
            <View style={[styles.priceBox, { flex: 1 }]}>
              <Text style={styles.prefix}>₦</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>
        </View>

        {/* Rooms & spaces */}
        <View style={styles.section}>
          <Text variant="label">Rooms & spaces</Text>
          <Text variant="bodySm" muted style={styles.roomLabel}>Bedrooms</Text>
          <View style={styles.bedsRow}>
            {ROOM_OPTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.bedChip, (bedrooms === n || (!bedrooms && n === "Any")) && styles.chipSelected]}
                onPress={() => setBedrooms(n === "Any" ? "" : n)}
              >
                <Text variant="bodySm" style={(bedrooms === n || (!bedrooms && n === "Any")) ? { color: colors.paper } : undefined}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text variant="bodySm" muted style={styles.roomLabel}>Bathrooms</Text>
          <View style={styles.bedsRow}>
            {ROOM_OPTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.bedChip, (bathrooms === n || (!bathrooms && n === "Any")) && styles.chipSelected]}
                onPress={() => setBathrooms(n === "Any" ? "" : n)}
              >
                <Text variant="bodySm" style={(bathrooms === n || (!bathrooms && n === "Any")) ? { color: colors.paper } : undefined}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Verified only */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setVerifiedOnly(!verifiedOnly)}>
            <View>
              <Text variant="body">Verified listings only</Text>
              <Text variant="bodySm" muted>Show only HASTI-verified properties</Text>
            </View>
            <View style={[styles.toggle, verifiedOnly && styles.toggleOn]}>
              <View style={[styles.thumb, verifiedOnly && styles.thumbOn]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleClear}>
          <Text variant="bodySm" style={{ color: colors.muted, fontWeight: "600" }}>Reset all</Text>
        </TouchableOpacity>
        <Button
          label={countLoading ? "Show results" : `Show ${countData?.total ?? 0} results`}
          onPress={handleApply}
          fullWidth={false}
          style={styles.applyBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  handle: {
    width: 36, height: 4, backgroundColor: colors.line,
    borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.base, paddingBottom: spacing.base,
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.bg, alignItems: "center", justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: { padding: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  typeRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: spacing.base, paddingBottom: spacing.base,
    borderBottomWidth: 1, borderColor: colors.line,
  },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.chip, borderWidth: 1, borderColor: colors.line,
  },
  chipSelected: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  priceRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  priceBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bg, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: spacing.sm, height: 48,
  },
  prefix: { color: colors.muted, marginRight: 4 },
  priceInput: { flex: 1, fontFamily: fonts.hankenRegular, fontSize: 15, color: colors.ink },
  roomLabel: { marginTop: spacing.sm, marginBottom: 4 },
  bedsRow: { flexDirection: "row", gap: 8 },
  bedChip: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  locationBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.bg, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: spacing.sm, height: 48, marginTop: spacing.sm,
  },
  locationInput: { flex: 1, fontFamily: fonts.hankenRegular, fontSize: 15, color: colors.ink },
  clearX: { fontSize: 12, color: colors.muted, paddingHorizontal: 4 },
  suggestBox: {
    marginTop: 4, backgroundColor: colors.paper,
    borderRadius: radii.card, borderWidth: 1, borderColor: colors.line,
    overflow: "hidden",
  },
  suggestRow: { paddingVertical: 12, paddingHorizontal: spacing.base },
  suggestRowContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  suggestDivider: { borderBottomWidth: 1, borderColor: colors.line },
  cityChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  cityChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.chip, borderWidth: 1, borderColor: colors.line,
  },
  toggleRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: colors.line, justifyContent: "center", padding: 2,
  },
  toggleOn: { backgroundColor: colors.blueDeep },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.paper },
  thumbOn: { alignSelf: "flex-end" },
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: spacing.base, borderTopWidth: 1, borderColor: colors.line,
  },
  applyBtn: { paddingHorizontal: 24 },
});
