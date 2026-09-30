"use client";
import { useEffect } from "react";
export default function PublicMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-public-motion]");
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const configure = () => {
      observer?.disconnect();
      if (preference.matches) {
        root.removeAttribute("data-motion-ready");
        nodes.forEach((node) => node.setAttribute("data-visible", "true"));
        return;
      }
      root.setAttribute("data-motion-ready", "true");
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-visible", "true");
              observer?.unobserve(entry.target);
            }
          }),
        { threshold: 0.08 },
      );
      nodes.forEach((node) => {
        if (
          node.getBoundingClientRect().top < window.innerHeight ||
          node.dataset.visible
        )
          node.setAttribute("data-visible", "true");
        else observer?.observe(node);
      });
    };
    configure();
    preference.addEventListener("change", configure);
    const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    const scroll = (event: Event) => {
      const anchor = event.currentTarget as HTMLAnchorElement;
      const target = document.getElementById(anchor.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: preference.matches ? "auto" : "smooth",
      });
      history.replaceState(null, "", anchor.hash);
      if (anchor.hash === "#contenido") {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    };
    anchors.forEach((anchor) => anchor.addEventListener("click", scroll));
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", configure);
      anchors.forEach((anchor) => anchor.removeEventListener("click", scroll));
      root.removeAttribute("data-motion-ready");
    };
  }, []);
  return null;
}
