import { create } from "zustand";
import type { SearchFilter } from "@/api/endpoints/properties";

export interface ActiveFilters {
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  city?: string;
  state?: string;
  verifiedOnly?: boolean;
  lat?: number;
  lng?: number;
  bbox?: string;
}

interface DiscoveryState {
  filters: ActiveFilters;
  setFilters: (f: ActiveFilters) => void;
  clearFilters: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),
}));

export function filtersToSearchFilter(f: ActiveFilters, q?: string): SearchFilter {
  return {
    ...(q ? { q } : {}),
    ...(f.type ? { type: f.type } : {}),
    ...(f.minPrice ? { minPrice: f.minPrice } : {}),
    ...(f.maxPrice ? { maxPrice: f.maxPrice } : {}),
    ...(f.bedrooms ? { bedrooms: Number(f.bedrooms.replace("+", "")) } : {}),
    ...(f.city ? { city: f.city } : {}),
    ...(f.state ? { state: f.state } : {}),
    ...(f.verifiedOnly ? { verifiedOnly: true } : {}),
    ...(f.lat !== undefined ? { lat: f.lat } : {}),
    ...(f.lng !== undefined ? { lng: f.lng } : {}),
    ...(f.bbox ? { bbox: f.bbox } : {}),
  };
}

export function hasActiveFilters(f: ActiveFilters): boolean {
  return Object.values(f).some((v) => v !== undefined && v !== "" && v !== false);
}
