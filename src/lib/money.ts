const NGN = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });

export function formatNaira(amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `₦${amount}`;
  return NGN.format(n);
}

export function formatNairaAccessible(amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} naira`;
  return NGN.format(n).replace("₦", "").trim() + " naira";
}
