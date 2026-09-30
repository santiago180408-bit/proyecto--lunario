"use client";
import Image from "next/image";
import { rooms } from "@/data/coworking";
import { tables, roomZones } from "@/data/floorplans";

export default function Floorplan({
  kind,
  selected,
  onSelect,
  readOnly = false,
}: {
  kind: "table" | "room";
  selected: string | null;
  onSelect: (id: string) => void;
  readOnly?: boolean;
}) {
  const zones = kind === "table" ? tables : roomZones;
  return (
    <div className="plan-shell">
      <div className="plan-stage">
        <div className="plan-scaled">
          <Image
            src={`/floorplans/${kind === "table" ? "planta-baja" : "segundo-piso"}.svg`}
            alt={
              kind === "table"
                ? "Plano digital de planta baja: mesas, pasillo, barra, cocina, baños, escaleras y entrada"
                : "Plano digital del segundo piso: cuatro cuartos, accesos, baño y escaleras"
            }
            width={1200}
            height={1600}
            unoptimized
            draggable={false}
          />
          <svg
            className="plan-overlay"
            viewBox="0 0 1200 1600"
            aria-label={
              readOnly
                ? "Selección en el plano"
                : kind === "table"
                  ? "Seleccionar mesa en el plano"
                  : "Seleccionar cuarto en el plano"
            }
          >
            {zones.map((zone) => (
              <g
                key={zone.id}
                tabIndex={readOnly ? undefined : 0}
                role={readOnly ? undefined : "button"}
                aria-label={
                  readOnly
                    ? undefined
                    : kind === "table"
                      ? `Seleccionar mesa ${"label" in zone ? zone.label : ""}`
                      : `Seleccionar ${rooms.find((room) => room.id === zone.id)?.name}`
                }
                aria-pressed={readOnly ? undefined : selected === zone.id}
                className={`plan-hotspot ${selected === zone.id ? "selected" : ""} ${readOnly ? "read-only" : ""}`}
                onClick={(event) => {
                  if (readOnly) {
                    event.preventDefault();
                    return;
                  }
                  onSelect(zone.id);
                }}
                onKeyDown={(event) => {
                  if (
                    !readOnly &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    onSelect(zone.id);
                  }
                }}
              >
                <rect
                  className="plan-hit-area"
                  x={zone.x - (kind === "table" ? 20 : 0)}
                  y={zone.y}
                  width={zone.w + (kind === "table" ? 40 : 0)}
                  height={zone.h}
                />
                <rect
                  className="plan-outline"
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx="8"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
      <p className="plan-caption">
        Esquema sin escala.{" "}
        {readOnly
          ? "La selección se muestra en dorado."
          : kind === "table"
            ? "Toca una mesa para seleccionarla y continuar."
            : "Toca un cuarto para seleccionarlo y continuar."}
      </p>
      {kind === "table" && !readOnly && (
        <details className="table-options">
          <summary className="eyebrow">Elegir mesa por ubicación</summary>
          <div>
            {tables.map((table) => (
              <button
                key={table.id}
                className={selected === table.id ? "selected" : ""}
                aria-pressed={selected === table.id}
                onClick={() => onSelect(table.id)}
              >
                Mesa {table.label}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
