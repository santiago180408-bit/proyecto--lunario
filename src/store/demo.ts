"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Period } from "@/data/coworking";
import type {
  AccessMode,
  PaymentMethod,
  RequestKind,
} from "@/data/payment";
export type { RequestKind } from "@/data/payment";
export type CartItem = {
  lineId: string;
  productId: string;
  quantity: number;
  selections: Record<string, string>;
};
export type Reservation = {
  date: string;
  time: string;
  people: number;
  tableId: string | null;
};
export type CoworkDraft = {
  roomId: string | null;
  rateId: string | null;
  period: Period | null;
  duration: number;
  date: string;
  time: string;
  people: number;
};
export type ReceiptLine = {
  description: string;
  quantity: number;
  total: number;
};
export type Receipt = {
  id: string;
  requestId: string;
  kind: "PAID" | "CASH_DUE";
  createdAt: string;
  paymentMethod: PaymentMethod;
  paymentState: "cash_due" | "demo_paid";
  operation: string;
  lineItems: ReceiptLine[];
  subtotal: number;
  total: number;
  demo: true;
};
export type ReceiptSummary = Pick<
  Receipt,
  "lineItems" | "subtotal" | "total" | "operation"
>;
export type DemoRequest = {
  id: string;
  kind: RequestKind;
  snapshot: unknown;
  status: "submitted" | "pending" | "confirmed";
  paymentSelection: "card" | "apple-pay" | "cash" | null;
  accessMode: AccessMode;
  receipt: Receipt | null;
  demo: true;
};
export type { AccessMode } from "@/data/payment";
type State = {
  orderMode: "dineIn" | "pickup" | null;
  orderTableId: string | null;
  cart: CartItem[];
  reservation: Reservation;
  cowork: CoworkDraft;
  accessMode: AccessMode;
  request: DemoRequest | null;
  setOrderMode: (v: State["orderMode"]) => void;
  setOrderTable: (v: string | null) => void;
  addItem: (item: CartItem) => void;
  updateItem: (lineId: string, item: CartItem) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  setReservation: (v: Partial<Reservation>) => void;
  setCowork: (v: Partial<CoworkDraft>) => void;
  setAccess: (v: AccessMode) => void;
  submit: (kind: RequestKind) => void;
  advanceRequest: () => void;
  selectPayment: (
    v: PaymentMethod,
    summary: ReceiptSummary,
  ) => void;
  completePayment: (summary: ReceiptSummary) => void;
  resetFlow: (kind: RequestKind) => void;
};
const emptyReservation: Reservation = {
  date: "",
  time: "",
  people: 0,
  tableId: null,
};
const emptyCowork: CoworkDraft = {
  roomId: null,
  rateId: null,
  period: null,
  duration: 1,
  date: "",
  time: "",
  people: 0,
};
export const useDemoStore = create<State>()(
  persist(
    (set, get) => ({
      orderMode: null,
      orderTableId: null,
      cart: [],
      reservation: emptyReservation,
      cowork: emptyCowork,
      accessMode: null,
      request: null,
      setOrderMode: (v) =>
        set({
          orderMode: v,
          orderTableId: v === "dineIn" ? get().orderTableId : null,
        }),
      setOrderTable: (v) => set({ orderTableId: v }),
      addItem: (item) => set((s) => ({ cart: [...s.cart, item] })),
      updateItem: (lineId, item) =>
        set((s) => ({
          cart: s.cart.map((x) => (x.lineId === lineId ? item : x)),
        })),
      setQuantity: (lineId, quantity) =>
        set((s) => ({
          cart: s.cart.map((x) =>
            x.lineId === lineId ? { ...x, quantity: Math.max(1, quantity) } : x,
          ),
        })),
      removeItem: (lineId) =>
        set((s) => ({ cart: s.cart.filter((x) => x.lineId !== lineId) })),
      setReservation: (v) =>
        set((s) => ({ reservation: { ...s.reservation, ...v } })),
      setCowork: (v) => set((s) => ({ cowork: { ...s.cowork, ...v } })),
      setAccess: (v) => set({ accessMode: v }),
      submit: (kind) => {
        const s = get();
        const snapshot =
          kind === "order"
            ? { mode: s.orderMode, tableId: s.orderTableId, cart: s.cart }
            : kind === "tableReservation"
              ? s.reservation
              : s.cowork;
        set({
          request: {
            id: crypto.randomUUID(),
            kind,
            snapshot,
            status: "submitted",
            paymentSelection: null,
            accessMode: s.accessMode,
            receipt: null,
            demo: true,
          },
        });
      },
      advanceRequest: () =>
        set((s) => ({
          request: s.request
            ? {
                ...s.request,
                status:
                  s.request.status === "submitted" ? "pending" : "confirmed",
              }
            : null,
        })),
      selectPayment: (v, summary) =>
        set((s) => {
          const req = s.request;
          const accessMode = req?.accessMode ?? s.accessMode;
          if (
            !req ||
            req.status !== "confirmed" ||
            req.receipt ||
            req.kind === "tableReservation" ||
            ((accessMode !== "google-demo" && accessMode !== "email-demo") &&
              v !== "cash")
          )
            return {};
          const id = crypto.randomUUID();
          const createdAt = new Date().toISOString();
          return {
            request: {
              ...req,
              paymentSelection: v,
              ...(v === "cash"
                ? {
                    receipt: {
                      id,
                      requestId: req.id,
                      kind: "CASH_DUE" as const,
                      createdAt,
                      paymentMethod: v,
                      paymentState: "cash_due" as const,
                      ...summary,
                      demo: true as const,
                    },
                  }
                : { receipt: null }),
            },
          };
        }),
      completePayment: (summary) =>
        set((s) => {
          const req = s.request;
          const accessMode = req?.accessMode ?? s.accessMode;
          if (
            !req ||
            req.status !== "confirmed" ||
            req.receipt ||
            req.kind === "tableReservation" ||
            (accessMode !== "google-demo" && accessMode !== "email-demo") ||
            (req.paymentSelection !== "card" &&
              req.paymentSelection !== "apple-pay")
          )
            return {};
          return {
            request: {
              ...req,
              receipt: {
                ...summary,
                id: crypto.randomUUID(),
                requestId: req.id,
                kind: "PAID",
                createdAt: new Date().toISOString(),
                paymentMethod: req.paymentSelection,
                paymentState: "demo_paid",
                demo: true,
              },
            },
          };
        }),
      resetFlow: (kind) =>
        set((s) => ({
          ...(kind === "order"
            ? { orderMode: null, orderTableId: null, cart: [] }
            : kind === "tableReservation"
              ? { reservation: emptyReservation }
              : { cowork: emptyCowork }),
          request: s.request?.kind === kind ? null : s.request,
        })),
    }),
    {
      name: "lunario-demo-v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        orderMode: s.orderMode,
        orderTableId: s.orderTableId,
        cart: s.cart,
        reservation: s.reservation,
        cowork: s.cowork,
        accessMode: s.accessMode,
        request: s.request,
      }),
    },
  ),
);
