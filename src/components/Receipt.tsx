import type { Receipt as ReceiptModel } from "@/store/demo";
import { formatMoney } from "@/data/menu";

const methodNames = {
  cash: "Efectivo",
  card: "Tarjeta (simulación)",
  "apple-pay": "Apple Pay (simulación)",
} as const;

export default function Receipt({ receipt }: { receipt: ReceiptModel }) {
  const createdAt = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(receipt.createdAt));

  return (
    <section className="receipt-card" aria-labelledby="receipt-title">
      <p className="eyebrow">
        {receipt.kind === "CASH_DUE"
          ? "PENDIENTE DE PAGO EN EFECTIVO"
          : "PAGO SIMULADO COMPLETADO"}
      </p>
      <h2 id="receipt-title">
        {receipt.kind === "CASH_DUE"
          ? "Ticket de pago en efectivo"
          : "Comprobante de pago"}
      </h2>
      <dl className="receipt-meta">
        <div>
          <dt>Folio demo</dt>
          <dd>LUN-{receipt.id.slice(0, 8).toUpperCase()}</dd>
        </div>
        <div>
          <dt>Operación</dt>
          <dd>{receipt.operation}</dd>
        </div>
        <div>
          <dt>Método</dt>
          <dd>{methodNames[receipt.paymentMethod]}</dd>
        </div>
        <div>
          <dt>Generado</dt>
          <dd>{createdAt}</dd>
        </div>
      </dl>
      <div className="receipt-lines">
        {receipt.lineItems.map((item, index) => (
          <div key={`${item.description}-${index}`}>
            <span>{item.description}</span>
            <strong>{formatMoney(item.total)}</strong>
          </div>
        ))}
      </div>
      <div className="receipt-total">
        <span>{receipt.kind === "CASH_DUE" ? "Monto pendiente" : "Total"}</span>
        <strong>{formatMoney(receipt.total)}</strong>
      </div>
      <p className="info-note">
        {receipt.kind === "CASH_DUE"
          ? "Ticket de demostración. El pago en efectivo queda pendiente; no se ha marcado como pagado."
          : "Comprobante de demostración. No representa una transacción real."}
      </p>
    </section>
  );
}
