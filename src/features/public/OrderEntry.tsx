"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { actions } from "./content";
import { BrandActionIcon, type ActionIcon } from "./BrandActionIcon";
import s from "./public.module.css";
import PublicMotion from "./PublicMotion";

export function OrderEntryHeader() {
  return (
    <header className={s.entryHeader}>
      <Link className={s.entryBrand} href="/">
        <Image
          className={s.entryLockup}
          src="/brand/lunario-logo-horizontal.png"
          alt="Lunario Café"
          width={270}
          height={80}
          priority
        />
        <Image
          className={s.entryIsotipo}
          src="/brand/lunario-isotipo.svg"
          alt="Lunario Café"
          width={64}
          height={64}
          priority
        />
      </Link>
      <Link className={s.returnLink} href="/">
        <span className={s.returnBack} aria-hidden="true">
          ‹
        </span>
        Volver a Lunario{" "}
        <span className={s.returnForward} aria-hidden="true">
          →
        </span>
      </Link>
    </header>
  );
}
function OrderEntryCard({
  title,
  description,
  icon,
  href,
  isHighlighted,
  intent,
}: {
  title: string;
  description: string;
  icon: ActionIcon;
  href: string;
  isHighlighted?: boolean;
  intent: string;
}) {
  return (
    <Link
      className={`${s.entryCard} ${isHighlighted ? s.highlighted : ""}`}
      href={href}
      data-intent={intent}
      data-reveal
    >
      <BrandActionIcon icon={icon} />
      <div className={s.entryCardCopy}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className={s.entryArrow} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
export function OrderEntryGrid() {
  const [intent, setIntent] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("accion");
    if (!actions.some((action) => action.intent === value)) return;
    setIntent(value);
    const link = grid.current?.querySelector<HTMLAnchorElement>(
      `[data-intent="${value}"]`,
    );
    const timer = window.setTimeout(() => {
      link?.focus({ preventScroll: true });
      if (window.innerWidth < 1024)
        link?.scrollIntoView({ block: "center", behavior: "instant" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div ref={grid} className={s.entryGrid}>
      {actions.map((action) => (
        <OrderEntryCard
          key={action.intent}
          title={action.title}
          description={action.entryDescription}
          icon={action.icon}
          href={action.href}
          intent={action.intent}
          isHighlighted={intent === action.intent}
        />
      ))}
    </div>
  );
}
export default function OrderEntry() {
  return (
    <div className={s.entryPage} data-public-motion>
      <PublicMotion />
      <a className={s.skip} href="#acciones">
        Saltar al contenido
      </a>
      <div className={s.entryContainer}>
        <OrderEntryHeader />
        <main id="acciones" className={s.entryMain}>
          <h1>¿Qué te gustaría hacer?</h1>
          <p className={s.entrySubtitle}>Elige una opción para continuar.</p>
          <OrderEntryGrid />
          <p className={s.guestNote}>Puedes explorar como invitado</p>
        </main>
      </div>
    </div>
  );
}
