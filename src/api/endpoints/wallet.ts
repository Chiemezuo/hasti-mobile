import { apiFetch } from "../client";

export interface WalletLedgerLine {
  id: string;
  account: string;
  direction: "CREDIT" | "DEBIT";
  amount: string;
  memo: string | null;
  transactionId: string | null;
  transactionReference: string | null;
  propertyTitle: string | null;
  createdAt: string;
}

export interface Wallet {
  escrowBalance: string;
  availableBalance: string;
  statement: {
    items: WalletLedgerLine[];
    nextCursor: string | null;
  };
}

export async function getWallet(cursor?: string): Promise<Wallet> {
  const params = cursor ? `?cursor=${cursor}` : "";
  return apiFetch<Wallet>({ path: `/me/wallet${params}` });
}
