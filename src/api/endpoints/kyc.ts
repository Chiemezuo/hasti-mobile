import { apiFetch } from "../client";

export type KycSlot = "id" | "selfie" | "business";
export type KycIdType = "NIN_SLIP" | "NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENCE";

export async function presignKyc(
  slot: KycSlot,
  contentType: string
): Promise<{ url: string; key: string; maxSize: number; expiresIn: number }> {
  return apiFetch({
    path: "/me/kyc/presign",
    method: "POST",
    body: JSON.stringify({ slot, contentType }),
  });
}

export async function submitKyc(input: {
  idType: KycIdType;
  idDocumentKey: string;
  selfieKey: string;
  businessDocKey?: string;
}): Promise<{ id: string; status: string }> {
  return apiFetch({ path: "/me/kyc", method: "POST", body: JSON.stringify(input) });
}
