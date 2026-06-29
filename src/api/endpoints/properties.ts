import { apiFetch } from "../client";

export interface PropertyMedia {
  id: string;
  type: "IMAGE" | "VIDEO";
  status: "PENDING" | "READY" | "FAILED";
  key: string;
  order: number;
  width: number | null;
  height: number | null;
  thumbnailKeys: Record<string, string> | null;
}

export interface Property {
  id: string;
  realtorId: string;
  title: string;
  description: string;
  price: string;
  pricePeriod: string | null;
  listingType: "SALE" | "RENT" | "LEASE" | "SHORT_STAY";
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: string | null;
  address: string;
  city: string;
  state: string;
  amenities: string[];
  negotiable: boolean;
  availableFrom: string | null;
  verified: boolean;
  verifiedAt: string | null;
  media: PropertyMedia[];
  createdAt: string;
}

export interface ListingCard {
  id: string;
  title: string;
  listingType: "SALE" | "RENT" | "LEASE" | "SHORT_STAY";
  price: string;
  pricePeriod: string | null;
  negotiable: boolean;
  status: string;
  address: string;
  city: string;
  state: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: string | null;
  availableFrom: string | null;
  verified: boolean;
  verifiedAt: string | null;
  coverImage: {
    key: string;
    thumbnailKeys: Record<string, string>;
  } | null;
  distanceM: number | null;
  createdAt: string;
}

export interface SearchFilter {
  q?: string;
  state?: string;
  city?: string;
  type?: string;
  stayKind?: string;
  minPrice?: string;
  maxPrice?: string;
  verifiedOnly?: boolean;
  availableFrom?: string;
  bedrooms?: number;
  bathrooms?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  bbox?: string;
  cursor?: string;
  limit?: number;
  facets?: boolean;
}

export interface PageInfo {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
}

export interface PropertiesResponse {
  items: ListingCard[];
  pageInfo: PageInfo;
  total: number | null;
  totalIsCapped: boolean;
  facets?: {
    type?: Record<string, number>;
    state?: Record<string, number>;
  };
}

export interface MapPoint {
  id: string;
  title: string;
  listingType: string;
  price: string;
  pricePeriod: string | null;
  lng: number;
  lat: number;
  verified: boolean;
}

export interface MapResponse {
  points: MapPoint[];
  capped: boolean;
}

export interface GeoSuggestResponse {
  suggestions: Array<{
    label: string;
    lat: number;
    lng: number;
    bbox: number[] | null;
  }>;
  attribution: string;
}

export async function getProperties(
  filter: SearchFilter = {}
): Promise<PropertiesResponse> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  return apiFetch<PropertiesResponse>({ path: `/properties?${params}` });
}

export async function getPropertyById(id: string): Promise<Property> {
  return apiFetch<Property>({ path: `/properties/${id}` });
}

export async function getPropertiesMap(filter: SearchFilter = {}): Promise<MapResponse> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  return apiFetch<MapResponse>({ path: `/properties/map?${params}` });
}

export async function toggleFavorite(propertyId: string, add: boolean): Promise<void> {
  await apiFetch({
    path: `/properties/${propertyId}/favorite`,
    method: add ? "POST" : "DELETE",
  });
}

export async function geoSuggest(q: string): Promise<GeoSuggestResponse> {
  return apiFetch<GeoSuggestResponse>({ path: `/geo/suggest?q=${encodeURIComponent(q)}` });
}
