import { apiFetch } from "../client";

export interface RealtorOverview {
  userId: string;
  scope: string;
}

export interface ListingSummary {
  id: string;
  title: string;
  status: string;
  listingType: "SALE" | "RENT" | "LEASE" | "SHORT_STAY";
  price: string;
  city: string;
  state: string;
  createdAt: string;
}

export interface CreateListingInput {
  listingType: "SALE" | "RENT" | "LEASE" | "SHORT_STAY";
  title: string;
  description: string;
  price: number;
  pricePeriod?: string;
  address: string;
  city: string;
  state: string;
  negotiable?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  amenities?: string[];
  availableFrom?: string;
  lat?: number;
  lng?: number;
}

export interface CreateListingResponse {
  id: string;
  status: string;
  warnings: Array<{ code: string; message: string }>;
}

export async function getMyListings(): Promise<{ listings: ListingSummary[] }> {
  return apiFetch<{ listings: ListingSummary[] }>({ path: "/realtor/listings" });
}

export async function getRealtorOverview(): Promise<RealtorOverview> {
  return apiFetch<RealtorOverview>({ path: "/realtor/overview" });
}

export async function createListing(input: CreateListingInput): Promise<CreateListingResponse> {
  return apiFetch<CreateListingResponse>({
    path: "/properties",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateListing(
  id: string,
  input: Partial<Omit<CreateListingInput, "listingType">>
): Promise<unknown> {
  return apiFetch({
    path: `/properties/${id}`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateListingStatus(
  id: string,
  event: "SUBMIT" | "PUBLISH" | "TAKE_DOWN" | "RELIST" | "CLOSE"
): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>({
    path: `/properties/${id}/status`,
    method: "PATCH",
    body: JSON.stringify({ event }),
  });
}

export async function presignMedia(
  propertyId: string,
  type: "IMAGE" | "VIDEO",
  contentType: string
): Promise<{ url: string; key: string; maxSize: number; expiresIn: number }> {
  return apiFetch({
    path: `/properties/${propertyId}/media/presign`,
    method: "POST",
    body: JSON.stringify({ type, contentType }),
  });
}

export async function confirmMedia(
  propertyId: string,
  key: string,
  order?: number
): Promise<{ id: string }> {
  return apiFetch({
    path: `/properties/${propertyId}/media`,
    method: "POST",
    body: JSON.stringify({ key, order: order ?? 0 }),
  });
}

export async function deleteMedia(propertyId: string, mediaId: string): Promise<void> {
  await apiFetch({
    path: `/properties/${propertyId}/media/${mediaId}`,
    method: "DELETE",
  });
}

export async function presignDocument(
  propertyId: string,
  docType: string,
  contentType: string
): Promise<{ url: string; key: string; maxSize: number; expiresIn: number }> {
  return apiFetch({
    path: `/properties/${propertyId}/documents/presign`,
    method: "POST",
    body: JSON.stringify({ docType, contentType }),
  });
}

export async function confirmDocument(
  propertyId: string,
  key: string,
  docType: string
): Promise<{ id: string }> {
  return apiFetch({
    path: `/properties/${propertyId}/documents`,
    method: "POST",
    body: JSON.stringify({ key, docType }),
  });
}
