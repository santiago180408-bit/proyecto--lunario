"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Period } from "@/data/coworking";
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
export type RequestKind = "order" | "tableReservation" | "coworking";
export type DemoRequest = {
  id: string;
  kind: RequestKind;
  snapshot: unknown;
  status: "submitted" | "pending" | "confirmed";
  paymentSelection: "card" | "apple-pay" | "cash" | null;
  demo: true;
};
type AccessMode = "google-demo" | "email-demo" | "guest" | null;
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
  selectPayment: (v: DemoRequest["paymentSelection"]) => void;
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
      selectPayment: (v) =>
        set((s) => ({
          request: s.request ? { ...s.request, paymentSelection: v } : null,
        })),
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
