"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import s from "./public.module.css";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
      if (event.key === "Tab") {
        const links = Array.from(
          panel.current?.querySelectorAll<HTMLElement>("a") ?? [],
        );
        const all = [button.current!, ...links];
        const index = all.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          all.at(-1)?.focus();
        } else if (!event.shiftKey && index === all.length - 1) {
          event.preventDefault();
          all[0]?.focus();
        }
      }
    };
    const resize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    document.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  return (
    <header className={`${s.header} ${scrolled || open ? s.scrolled : ""}`}>
      <div className={s.headerInner}>
        <Link href="/" className={s.brand}>
          <Image
            src="/brand/lunario-isotipo.svg"
            width={64}
            height={64}
            alt="Lunario Café"
            priority
          />
        </Link>
        <nav className={s.desktopNav} aria-label="Navegación pública">
          <Link href="/menu">Menú</Link>
          <a href="#espacios">Espacios</a>
          <Link className={s.cta} href="/ordenar">
            Ir a ordenar <span aria-hidden="true">→</span>
          </Link>
        </nav>
        <button
          ref={button}
          className={`${s.menuButton} ${open ? s.menuOpen : ""}`}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="public-menu"
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <>
          <div className={s.menuBackdrop} onClick={close} aria-hidden="true" />
          <MobilePublicMenu panelRef={panel} onClose={close} />
        </>
      )}
    </header>
  );
}
function MobilePublicMenu({
  panelRef,
  onClose,
}: {
  panelRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  return (
    <nav
      id="public-menu"
      ref={panelRef}
      className={s.mobileNav}
      aria-label="Navegación pública móvil"
    >
      <Link href="/menu" onClick={onClose}>
        Menú <span aria-hidden="true">→</span>
      </Link>
      <a href="#espacios" onClick={onClose}>
        Espacios <span aria-hidden="true">→</span>
      </a>
      <Link className={s.cta} href="/ordenar" onClick={onClose}>
        Ir a ordenar <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
