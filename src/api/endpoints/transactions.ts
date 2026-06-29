import { apiFetch } from "../client";
import type { TransactionStatus } from "@/lib/escrow-labels";

export interface TransactionSummary {
  id: string;
  reference: string;
  status: TransactionStatus;
  role: "buyer" | "realtor";
  propertyId: string;
  propertyTitle: string;
  listingType: string;
  amount: string;
  netAmount: string;
  feeAmount: string;
  buyerId: string;
  realtorId: string;
  fundedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface TransactionsResponse {
  items: TransactionSummary[];
  nextCursor: string | null;
}

export interface Transaction {
  id: string;
  reference: string;
  status: TransactionStatus;
  role: "buyer" | "realtor" | "admin";
  propertyId: string;
  propertyTitle: string;
  listingType: string;
  amount: string;
  netAmount: string;
  feeAmount: string;
  buyerId: string;
  realtorId: string;
  offerId: string | null;
  conversationId: string | null;
  refundWindowEndsAt: string | null;
  paymentInstructions: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    amount: string;
  } | null;
  fundedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export async function getTransactions(
  cursor?: string
): Promise<TransactionsResponse> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<TransactionsResponse>({ path: `/transactions${params}` });
}

export async function openTransaction(offerId: string): Promise<Transaction> {
  return apiFetch<Transaction>({
    path: "/transactions",
    method: "POST",
    body: JSON.stringify({ offerId }),
  });
}

export async function getTransaction(id: string): Promise<Transaction> {
  return apiFetch<Transaction>({ path: `/transactions/${id}` });
}

export async function simulateTransfer(id: string): Promise<void> {
  await apiFetch({ path: `/transactions/${id}/simulate-transfer`, method: "POST" });
}

export async function confirmConditions(id: string): Promise<Transaction> {
  return apiFetch<Transaction>({
    path: `/transactions/${id}/confirm-conditions`,
    method: "POST",
  });
}

export async function requestRefund(id: string): Promise<Transaction> {
  return apiFetch<Transaction>({
    path: `/transactions/${id}/refund-request`,
    method: "POST",
  });
}

export async function raiseDispute(id: string): Promise<Transaction> {
  return apiFetch<Transaction>({
    path: `/transactions/${id}/dispute`,
    method: "POST",
  });
}
