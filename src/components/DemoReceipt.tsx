"use client";
import { useEffect, useRef } from "react";
import {
  type CartItem,
  type CoworkDraft,
  type DemoRequest,
  type Reservation,
} from "@/store/demo";
import { products, formatMoney, unitPrice, visibleGroups } from "@/data/menu";
import { periods, rates, rooms } from "@/data/coworking";
import { tables } from "@/data/floorplans";
import { canUsePayment, paymentMethods } from "@/data/payment";

export default function DemoReceipt({ request }: { request: DemoRequest }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "nearest" });
  }, []);
  if (
    !request.paymentCompleted ||
    !request.paymentSelection ||
    !canUsePayment(request.accessMode, request.paymentSelection)
  )
    return null;
  const method = paymentMethods.find(
    (option) => option.id === request.paymentSelection,
  )?.label;
  const order =
    request.kind === "order"
      ? (request.snapshot as {
          mode: string;
          tableId: string | null;
          cart: CartItem[];
        })
      : null;
  const reservation =
    request.kind === "tableReservation"
      ? (request.snapshot as Reservation)
      : null;
  const cowork =
    request.kind === "coworking" ? (request.snapshot as CoworkDraft) : null;
  const room = rooms.find((option) => option.id === cowork?.roomId);
  const rate = rates.find((option) => option.id === cowork?.rateId);
  const lines = (order?.cart ?? []).flatMap((item) => {
    const product = products.find((option) => option.id === item.productId);
    if (!product) return [];
    return [
      {
        ...item,
        name: product.name,
        amount: unitPrice(product, item.selections) * item.quantity,
        detail: visibleGroups(product, item.selections)
          .map(
            (group) =>
              group.options.find(
                (option) => option.id === item.selections[group.id],
              )?.label,
          )
          .filter(Boolean)
          .join(" · "),
      },
    ];
  });
  return (
    <section className="receipt-card" aria-labelledby="receipt-heading">
      <p className="eyebrow">LUNARIO CAFÉ · DEMO</p>
      <h2 id="receipt-heading" ref={heading} tabIndex={-1}>
        Comprobante visual
      </h2>
      <p className="receipt-status" role="status">
        {request.paymentSelection === "cash"
          ? "Finalización simulada · Pago en efectivo"
          : "Pago confirmado · Simulación"}
      </p>
      <dl className="receipt-meta">
        <div>
          <dt>Referencia demo</dt>
          <dd>{request.id.slice(0, 8).toUpperCase()}</dd>
        </div>
        <div>
          <dt>Método</dt>
          <dd>{method}</dd>
        </div>
        <div>
          <dt>Solicitud</dt>
          <dd>
            {order ? "Pedido" : reservation ? "Reserva de mesa" : "Coworking"}
          </dd>
        </div>
        {order && (
          <div>
            <dt>Modalidad</dt>
            <dd>{order.mode === "pickup" ? "Para recoger" : "En Lunario"}</dd>
          </div>
        )}
        {order?.tableId && (
          <div>
            <dt>Mesa</dt>
            <dd>{tables.find((table) => table.id === order.tableId)?.label}</dd>
          </div>
        )}
        {(reservation || cowork) && (
          <>
            <div>
              <dt>Fecha y hora solicitadas</dt>
              <dd>
                {(reservation || cowork)?.date} ·{" "}
                {(reservation || cowork)?.time}
              </dd>
            </div>
            <div>
              <dt>Personas</dt>
              <dd>{(reservation || cowork)?.people}</dd>
            </div>
          </>
        )}
        {reservation && (
          <div>
            <dt>Mesa</dt>
            <dd>
              {tables.find((table) => table.id === reservation.tableId)?.label}
            </dd>
          </div>
        )}
        {cowork && (
          <>
            <div>
              <dt>Espacio</dt>
              <dd>{room?.name}</dd>
            </div>
            <div>
              <dt>Tarifa y modalidad</dt>
              <dd>
                {rate?.name} ·{" "}
                {periods.find((period) => period.id === cowork.period)?.name} ·
                Cantidad: {cowork.duration}
              </dd>
            </div>
          </>
        )}
      </dl>
      {order && (
        <div className="receipt-lines">
          {lines.map((line) => (
            <div key={line.lineId}>
              <div>
                <strong>
                  {line.quantity} × {line.name}
                </strong>
                {line.detail && <small>{line.detail}</small>}
              </div>
              <span>{formatMoney(line.amount)}</span>
            </div>
          ))}
        </div>
      )}
      {cowork?.period && rate && (
        <p className="muted">
          Tarifa publicada: {formatMoney(rate.prices[cowork.period])} ·{" "}
          {periods.find((period) => period.id === cowork.period)?.name}.
          Aplicación sujeta a confirmación.
        </p>
      )}
      <div className="receipt-total">
        <span>Total</span>
        <strong>
          {order
            ? formatMoney(lines.reduce((sum, line) => sum + line.amount, 0))
            : "Por confirmar"}
        </strong>
      </div>
      <p className="info-note">
        Comprobante de demostración. No se realizó ningún cobro ni se emite un
        comprobante fiscal.
      </p>
    </section>
  );
}
