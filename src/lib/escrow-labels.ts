export type TransactionStatus =
  | "INITIATED"
  | "IN_ESCROW"
  | "UNDER_REVIEW"
  | "DISPUTED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type StatusChipFamily =
  | "positive"
  | "attention"
  | "negative"
  | "unknown";

export const TRANSACTION_LABELS: Record<TransactionStatus, string> = {
  INITIATED: "Awaiting funds",
  IN_ESCROW: "Funds in escrow",
  UNDER_REVIEW: "Under review",
  DISPUTED: "Disputed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const TRANSACTION_DESCRIPTIONS: Record<TransactionStatus, string> = {
  INITIATED: "Awaiting your transfer",
  IN_ESCROW: "Funds held securely in escrow",
  UNDER_REVIEW: "Conditions confirmed — awaiting release",
  DISPUTED: "Under dispute — on hold",
  COMPLETED: "Released to realtor — deal complete",
  CANCELLED: "Deal cancelled",
  REFUNDED: "Refunded to buyer",
};

export const TRANSACTION_CHIP_FAMILY: Record<
  TransactionStatus,
  StatusChipFamily
> = {
  INITIATED: "attention",
  IN_ESCROW: "positive",
  UNDER_REVIEW: "attention",
  DISPUTED: "negative",
  COMPLETED: "positive",
  CANCELLED: "negative",
  REFUNDED: "negative",
};

export const TERMINAL_STATES: TransactionStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export function isTerminal(status: TransactionStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

export type PropertyStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "LIVE"
  | "UNAVAILABLE"
  | "CLOSED"
  | "REJECTED";

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Draft",
  PENDING_VERIFICATION: "Pending review",
  VERIFIED: "Verified",
  LIVE: "Live",
  UNAVAILABLE: "Unavailable",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export const PROPERTY_STATUS_CHIP_FAMILY: Record<
  PropertyStatus,
  StatusChipFamily
> = {
  DRAFT: "unknown",
  PENDING_VERIFICATION: "attention",
  VERIFIED: "positive",
  LIVE: "positive",
  UNAVAILABLE: "attention",
  CLOSED: "negative",
  REJECTED: "negative",
};

export type OfferStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COUNTERED"
  | "WITHDRAWN"
  | "EXPIRED";

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COUNTERED: "Countered",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

export const OFFER_STATUS_CHIP_FAMILY: Record<OfferStatus, StatusChipFamily> =
  {
    PENDING: "attention",
    ACCEPTED: "positive",
    REJECTED: "negative",
    COUNTERED: "attention",
    WITHDRAWN: "unknown",
    EXPIRED: "unknown",
  };
