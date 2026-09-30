"use client";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { rooms } from "@/data/coworking";
import { tables, roomZones } from "@/data/floorplans";

type View = { scale: number; x: number; y: number };
type Point = { x: number; y: number };
const fit: View = { scale: 1, x: 0, y: 0 };

export default function Floorplan({ kind, selected, onSelect, readOnly = false }: {
  kind: "table" | "room";
  selected: string | null;
  onSelect: (id: string) => void;
  readOnly?: boolean;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(fit);
  const current = useRef(view);
  const pointers = useRef(new Map<number, Point>());
  const origin = useRef(new Map<number, Point>());
  const suppressTap = useRef(false);
  const zones = kind === "table" ? tables : roomZones;
  function update(next: View) {
    const bounds = stage.current?.getBoundingClientRect();
    const scale = Math.min(2.5, Math.max(1, next.scale));
    const maxX = (bounds?.width ?? 0) * (scale - 1) / 2;
    const maxY = (bounds?.height ?? 0) * (scale - 1) / 2;
    const clamped = { scale, x: Math.max(-maxX, Math.min(maxX, next.x)), y: Math.max(-maxY, Math.min(maxY, next.y)) };
    current.current = clamped;
    setView(clamped);
  }
  function endPointer(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    origin.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!pointers.current.size) window.setTimeout(() => { suppressTap.current = false; }, 0);
  }
  return <div className="plan-shell">
    <div className="plan-tools" role="group" aria-label="Zoom del plano">
      <button className="icon-btn" aria-label="Alejar plano" disabled={view.scale <= 1}
        onClick={() => update({ ...current.current, scale: current.current.scale - .25 })}><Minus size={18} /></button>
      <output aria-live="polite">{Math.round(view.scale * 100)}%</output>
      <button className="icon-btn" aria-label="Acercar plano" disabled={view.scale >= 2.5}
        onClick={() => update({ ...current.current, scale: current.current.scale + .25 })}><Plus size={18} /></button>
      <button className="icon-btn" aria-label="Restablecer plano" onClick={() => update(fit)}><RotateCcw size={18} /></button>
    </div>
    <div className="plan-stage" ref={stage} tabIndex={0}
      aria-label="Plano ampliable. Usa más y menos para zoom y las flechas para desplazar."
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const direction = { ArrowLeft: [30, 0], ArrowRight: [-30, 0], ArrowUp: [0, 30], ArrowDown: [0, -30] }[event.key];
        if (direction && current.current.scale > 1) {
          event.preventDefault(); update({ ...current.current, x: current.current.x + direction[0], y: current.current.y + direction[1] });
        } else if (event.key === "+" || event.key === "-") {
          event.preventDefault(); update({ ...current.current, scale: current.current.scale + (event.key === "+" ? .25 : -.25) });
        }
      }}
      onPointerDown={(event) => {
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        origin.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        suppressTap.current = pointers.current.size > 1;
      }}
      onPointerMove={(event) => {
        const old = pointers.current.get(event.pointerId);
        if (!old) return;
        const before = [...pointers.current.values()];
        const point = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, point);
        const after = [...pointers.current.values()];
        const deltaX = point.x - old.x, deltaY = point.y - old.y;
        const start = origin.current.get(event.pointerId) ?? old;
        const dragged = Math.hypot(point.x - start.x, point.y - start.y) > 6;
        if (after.length === 2) {
          const distance = (points: Point[]) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
          const ratio = distance(before) > 0 ? distance(after) / distance(before) : 1;
          suppressTap.current = true;
          update({ scale: current.current.scale * ratio, x: current.current.x + deltaX / 2, y: current.current.y + deltaY / 2 });
        } else if (dragged || suppressTap.current) {
          suppressTap.current = true;
          if (current.current.scale > 1) {
            event.currentTarget.setPointerCapture(event.pointerId);
            update({ ...current.current, x: current.current.x + deltaX, y: current.current.y + deltaY });
          }
        }
      }}
      onPointerUp={endPointer} onPointerCancel={endPointer}>
      <div className="plan-scaled" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <Image src={`/floorplans/${kind === "table" ? "planta-baja" : "segundo-piso"}.svg`}
          alt={kind === "table" ? "Plano digital de planta baja: mesas, pasillo, barra, cocina, baños, escaleras y entrada" : "Plano digital del segundo piso: cuatro cuartos, accesos, baño y escaleras"}
          width={1200} height={1600} unoptimized draggable={false} />
        <svg className="plan-overlay" viewBox="0 0 1200 1600" aria-label={readOnly ? "Selección en el plano" : kind === "table" ? "Seleccionar mesa en el plano" : "Seleccionar cuarto en el plano"}>
          {zones.map((zone) => <g key={zone.id} tabIndex={readOnly ? undefined : 0} role={readOnly ? undefined : "button"}
            aria-label={readOnly ? undefined : kind === "table" ? `Seleccionar mesa ${"label" in zone ? zone.label : ""}` : `Seleccionar ${rooms.find((room) => room.id === zone.id)?.name}`}
            aria-pressed={readOnly ? undefined : selected === zone.id}
            className={`plan-hotspot ${selected === zone.id ? "selected" : ""} ${readOnly ? "read-only" : ""}`}
            onClick={(event) => {
              if (readOnly || suppressTap.current) { event.preventDefault(); return; }
              onSelect(zone.id);
            }}
            onKeyDown={(event) => {
              if (!readOnly && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(zone.id); }
            }}>
            <rect className="plan-hit-area" x={zone.x - (kind === "table" ? 20 : 0)} y={zone.y} width={zone.w + (kind === "table" ? 40 : 0)} height={zone.h} />
            <rect className="plan-outline" x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="8" />
          </g>)}
        </svg>
      </div>
    </div>
    <p className="plan-caption">Esquema sin escala. {readOnly ? "La selección se muestra en dorado." : "Selecciona en el plano. Amplía con dos dedos o con los controles y arrastra para desplazarte."}</p>
    {kind === "table" && !readOnly && <details className="table-options">
      <summary className="eyebrow">Elegir mesa por ubicación</summary>
      <div>{tables.map((table) => <button key={table.id} className={selected === table.id ? "selected" : ""}
        aria-pressed={selected === table.id} onClick={() => onSelect(table.id)}>Mesa {table.label}</button>)}</div>
    </details>}
  </div>;
}
