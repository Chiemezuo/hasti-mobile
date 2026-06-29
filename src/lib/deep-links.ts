export const Routes = {
  listing: (id: string) => `/listing/${id}`,
  chat: (id: string) => `/chat/${id}`,
  deal: (id: string) => `/deal/${id}`,
  offer: (id: string) => `/offer/${id}`,
} as const;

export function parseDeepLink(url: string): {
  type: "listing" | "chat" | "deal" | "offer" | null;
  id: string | null;
} {
  const match = url.match(/hasti:\/\/(\w+)\/([^/?]+)/);
  if (!match) return { type: null, id: null };
  const [, type, id] = match;
  if (
    type === "listing" ||
    type === "chat" ||
    type === "deal" ||
    type === "offer"
  ) {
    return { type, id: id ?? null };
  }
  return { type: null, id: null };
}
