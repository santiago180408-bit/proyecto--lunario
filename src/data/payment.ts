export type RequestKind = "order" | "tableReservation" | "coworking";
export type PaymentMethod = "cash" | "card" | "apple-pay";
export type AccessMode = "google-demo" | "email-demo" | "guest" | null;
export const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: "card", label: "Tarjeta" },
  { id: "apple-pay", label: "Apple Pay" },
  { id: "cash", label: "Efectivo" },
];
export const availablePaymentMethods = (access: AccessMode) =>
  paymentMethods.filter(
    (method) =>
      method.id === "cash" ||
      access === "google-demo" ||
      access === "email-demo",
  );
export const canUsePayment = (access: AccessMode, method: PaymentMethod) =>
  availablePaymentMethods(access).some((option) => option.id === method);
