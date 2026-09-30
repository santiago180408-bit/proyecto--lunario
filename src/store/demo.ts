"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Period } from "@/data/coworking";
import type { AccessMode, PaymentMethod, RequestKind } from "@/data/payment";
import { canUsePayment } from "@/data/payment";
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
export type DemoRequest = {
  id: string;
  kind: RequestKind;
  snapshot: unknown;
  status: "submitted" | "pending" | "confirmed";
  paymentSelection: PaymentMethod | null;
  paymentCompleted: boolean;
  accessMode: AccessMode;
  demo: true;
};
type State = {
  orderMode: "dineIn" | "pickup" | null;
  orderTableId: string | null;
  cart: CartItem[];
  reservation: Reservation;
  cowork: CoworkDraft;
  accessMode: AccessMode;
  request: DemoRequest | null;
  setOrderMode: (value: State["orderMode"]) => void;
  setOrderTable: (value: string | null) => void;
  addItem: (item: CartItem) => void;
  updateItem: (lineId: string, item: CartItem) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  setReservation: (value: Partial<Reservation>) => void;
  setCowork: (value: Partial<CoworkDraft>) => void;
  setAccess: (value: AccessMode) => void;
  submit: (kind: RequestKind) => void;
  advanceRequest: () => void;
  selectPayment: (value: PaymentMethod) => void;
  completePayment: () => void;
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
      setOrderMode: (value) =>
        set((state) => ({
          orderMode: value,
          orderTableId: value === "dineIn" ? state.orderTableId : null,
        })),
      setOrderTable: (value) => set({ orderTableId: value }),
      addItem: (item) => set((state) => ({ cart: [...state.cart, item] })),
      updateItem: (lineId, item) =>
        set((state) => ({
          cart: state.cart.map((old) => (old.lineId === lineId ? item : old)),
        })),
      setQuantity: (lineId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.lineId === lineId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        })),
      removeItem: (lineId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.lineId !== lineId),
        })),
      setReservation: (value) =>
        set((state) => ({ reservation: { ...state.reservation, ...value } })),
      setCowork: (value) =>
        set((state) => ({ cowork: { ...state.cowork, ...value } })),
      setAccess: (value) => set({ accessMode: value }),
      submit: (kind) => {
        const state = get();
        const snapshot =
          kind === "order"
            ? {
                mode: state.orderMode,
                tableId: state.orderTableId,
                cart: state.cart,
              }
            : kind === "tableReservation"
              ? state.reservation
              : state.cowork;
        set({
          request: {
            id: crypto.randomUUID(),
            kind,
            snapshot: structuredClone(snapshot),
            status: "submitted",
            paymentSelection: null,
            paymentCompleted: false,
            accessMode: state.accessMode,
            demo: true,
          },
        });
      },
      advanceRequest: () =>
        set((state) => ({
          request: state.request
            ? {
                ...state.request,
                status:
                  state.request.status === "submitted"
                    ? "pending"
                    : "confirmed",
              }
            : null,
        })),
      selectPayment: (value) =>
        set((state) =>
          state.request?.status === "confirmed" &&
          canUsePayment(state.request.accessMode, value)
            ? {
                request: {
                  ...state.request,
                  paymentSelection: value,
                  paymentCompleted: false,
                },
              }
            : {},
        ),
      completePayment: () =>
        set((state) =>
          state.request?.status === "confirmed" &&
          state.request.paymentSelection &&
          canUsePayment(
            state.request.accessMode,
            state.request.paymentSelection,
          )
            ? { request: { ...state.request, paymentCompleted: true } }
            : {},
        ),
      resetFlow: (kind) =>
        set((state) => ({
          ...(kind === "order"
            ? { orderMode: null, orderTableId: null, cart: [] }
            : kind === "tableReservation"
              ? { reservation: emptyReservation }
              : { cowork: emptyCowork }),
          request: state.request?.kind === kind ? null : state.request,
        })),
    }),
    {
      name: "lunario-demo-v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        orderMode: state.orderMode,
        orderTableId: state.orderTableId,
        cart: state.cart,
        reservation: state.reservation,
        cowork: state.cowork,
        accessMode: state.accessMode,
        request: state.request,
      }),
    },
  ),
);
