import { apiFetch } from "../client";
import type { ListingCard } from "./properties";

export interface SavedSearch {
  id: string;
  name: string;
  filter: Record<string, unknown>;
  notifyOnNew: boolean;
  createdAt: string;
}

export async function getFavorites(): Promise<{ items: ListingCard[] }> {
  return apiFetch<{ items: ListingCard[] }>({ path: "/me/favorites" });
}

export async function getFavoriteIds(): Promise<{ ids: string[] }> {
  return apiFetch<{ ids: string[] }>({ path: "/me/favorites?ids=1" });
}

export async function getSavedSearches(): Promise<{ items: SavedSearch[] }> {
  return apiFetch<{ items: SavedSearch[] }>({ path: "/me/saved-searches" });
}

export async function saveSearch(input: {
  name: string;
  filter: Record<string, unknown>;
  notifyOnNew?: boolean;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>({
    path: "/me/saved-searches",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSavedSearch(
  id: string,
  input: { name?: string; notifyOnNew?: boolean }
): Promise<SavedSearch> {
  return apiFetch<SavedSearch>({
    path: `/me/saved-searches/${id}`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await apiFetch({ path: `/me/saved-searches/${id}`, method: "DELETE" });
}
