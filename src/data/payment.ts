export type RequestKind = "order" | "tableReservation" | "coworking";
export type PaymentMethod = "cash" | "card" | "apple-pay";
export type AccessMode = "google-demo" | "email-demo" | "guest" | null;

export function canPayRequest(kind: RequestKind) {
  return kind === "order" || kind === "coworking";
}

export function availablePaymentMethods(
  kind: RequestKind,
  accessMode: AccessMode,
): PaymentMethod[] {
  if (!canPayRequest(kind)) return [];
  return accessMode === "google-demo" || accessMode === "email-demo"
    ? ["cash", "card", "apple-pay"]
    : ["cash"];
}
