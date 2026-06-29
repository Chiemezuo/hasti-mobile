import { apiFetch } from "../client";
import type { OfferStatus } from "@/lib/escrow-labels";

export interface Offer {
  id: string;
  conversationId: string;
  makerId: string;
  amount: string;
  status: OfferStatus;
  parentOfferId: string | null;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
  mine: boolean;
}

export interface OfferListView {
  offers: Offer[];
  active: Offer | null;
  agreed: Offer | null;
}

export async function getOffers(conversationId: string): Promise<OfferListView> {
  return apiFetch<OfferListView>({ path: `/conversations/${conversationId}/offers` });
}

export async function makeOffer(
  conversationId: string,
  amount: string
): Promise<Offer> {
  return apiFetch<Offer>({
    path: `/conversations/${conversationId}/offers`,
    method: "POST",
    body: JSON.stringify({ amount: Number(amount) }),
  });
}

export async function acceptOffer(offerId: string): Promise<Offer> {
  return apiFetch<Offer>({ path: `/offers/${offerId}/accept`, method: "POST" });
}

export async function counterOffer(
  offerId: string,
  amount: string
): Promise<Offer> {
  return apiFetch<Offer>({
    path: `/offers/${offerId}/counter`,
    method: "POST",
    body: JSON.stringify({ amount: Number(amount) }),
  });
}

export async function rejectOffer(offerId: string): Promise<Offer> {
  return apiFetch<Offer>({ path: `/offers/${offerId}/reject`, method: "POST" });
}

export async function withdrawOffer(offerId: string): Promise<Offer> {
  return apiFetch<Offer>({
    path: `/offers/${offerId}/withdraw`,
    method: "POST",
  });
}
