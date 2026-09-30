import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "./PublicHeader";
import { BrandActionIcon, type ActionIcon } from "./BrandActionIcon";
import { business, faq } from "./content";
import PublicMotion from "./PublicMotion";
import s from "./public.module.css";

export function LandingHero() {
  return (
    <section className={s.hero}>
      <Image
        className={s.heroPhoto}
        src="/media/coffee.webp"
        alt="Café con arte latte en una taza sobre una mesa de madera"
        fill
        sizes="100vw"
        priority
      />
      <div className={s.heroOverlay} aria-hidden="true" />
      <div className={`${s.container} ${s.heroContent}`}>
        <h1 className={s.heroBrand}>
          <Image
            src="/brand/lunario-logo-horizontal.png"
            alt="Lunario Café"
            width={900}
            height={265}
            priority
          />
        </h1>
        <p className={s.brandPhrase}>
          Buen café para <strong>grandes ideas.</strong>
        </p>
        <div className={s.heroActions}>
          <Link className={s.cta} href="/ordenar">
            Ir a ordenar <span aria-hidden="true">→</span>
          </Link>
          <a className={s.explore} href="#experiencia">
            Explorar Lunario <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
export default function Landing() {
  return (
    <div className={s.publicPage} data-public-motion>
      <PublicMotion />
      <a className={s.skip} href="#contenido">
        Saltar al contenido
      </a>
      <PublicHeader />
      <main id="contenido">
        <LandingHero />
        <ExperienceSection />
        <AtmosphereSection
          title="Un lugar para cambiar de ritmo."
          eyebrow="ESPACIOS"
          description="Café, encuentros y espacios para trabajar o reunirte."
          photos={[
            "/media/workspace-2.webp",
            "/media/workspace-1.webp",
            "/media/workspace-3.webp",
          ]}
          ctaHref="/ordenar"
        />
        <BusinessFacts />
        <FaqSection />
        <FinalOrderCTA />
      </main>
      <PublicFooter />
    </div>
  );
}
export function ExperienceSection() {
  return (
    <section id="experiencia" className={s.experience}>
      <div className={s.container} data-reveal>
        <p className={s.mobileEyebrow}>TU EXPERIENCIA</p>
        <h2>
          Tu experiencia <em>empieza aquí</em>
        </h2>
        <Link href="/ordenar" className={s.orderCluster}>
          <span className={s.clusterEmblem} aria-hidden="true">
            <Image
              src="/brand/lunario-isotipo.svg"
              alt=""
              width={74}
              height={74}
            />
          </span>
          <span>Ir a ordenar</span>
          <span className={s.clusterArrow} aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
export function OrbitalDecoration() {
  return (
    <div className={s.orbits} aria-hidden="true">
      <span />
      <span />
      <i />
    </div>
  );
}
function AtmosphereSection({
  title,
  eyebrow,
  description,
  photos,
  ctaHref,
}: {
  title: string;
  eyebrow: string;
  description: string;
  photos: string[];
  ctaHref: string;
}) {
  return (
    <section id="espacios" className={s.atmosphere}>
      <OrbitalDecoration />
      <div className={`${s.container} ${s.atmosphereInner}`} data-reveal>
        <div className={s.atmosphereCopy}>
          <p className={s.eyebrow}>{eyebrow}</p>
          <h2>
            {title.split("cambiar")[0]}
            <em>cambiar de ritmo.</em>
          </h2>
          <p className={s.atmosphereDescription}>{description}</p>
          <Link className={s.cta} href={ctaHref}>
            Ir a ordenar <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className={s.atmospherePhotos}>
          <Image
            className={s.spaceMain}
            src={photos[0]}
            alt="Espacio de Lunario con mesa, asientos y luz cálida"
            width={497}
            height={638}
            sizes="(min-width: 1024px) 55vw, 100vw"
            loading="lazy"
          />
          <div className={s.photoStrip}>
            <Image
              src={photos[1]}
              alt="Área de trabajo con mesas y sillas"
              width={489}
              height={638}
              sizes="(min-width: 1024px) 22vw, 30vw"
              loading="lazy"
            />
            <Image
              src={photos[2]}
              alt="Mesa redonda con sillas en un espacio de Lunario"
              width={497}
              height={637}
              sizes="(min-width: 1024px) 22vw, 30vw"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
function BusinessFacts() {
  return (
    <section className={s.facts} aria-label="Información de Lunario">
      <div className={s.container}>
        <div>
          <span>Cafetería</span>
          <p>{business.hours}</p>
        </div>
        <div>
          <span>Coffee Time</span>
          <p>{business.coffeeTime}</p>
        </div>
        <div>
          <span>Ubicación</span>
          <p>{business.address}</p>
        </div>
      </div>
    </section>
  );
}
function FaqItem({
  question,
  answer,
  icon,
}: {
  question: string;
  answer: string;
  icon: ActionIcon;
}) {
  return (
    <details className={s.faqItem}>
      <summary>
        <BrandActionIcon icon={icon} />
        <span>{question}</span>
        <span className={s.faqChevron} aria-hidden="true">
          ⌄
        </span>
      </summary>
      <p>{answer}</p>
    </details>
  );
}
function FaqSection() {
  return (
    <section className={s.faqSection}>
      <div className={s.faqInner} data-reveal>
        <p className={s.eyebrow}>LUNARIO, A TU RITMO</p>
        <h2>Preguntas frecuentes</h2>
        <div>
          {faq.map((item) => (
            <FaqItem key={item.question} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
function FinalOrderCTA() {
  return (
    <div className={s.finalCta}>
      <Link className={s.cta} href="/ordenar">
        Ir a ordenar <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
function PublicFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <Link className={s.footerBrand} href="/">
          <Image
            src="/brand/lunario-logo-circular.png"
            alt="Lunario Café"
            width={100}
            height={100}
          />
        </Link>
        <div className={s.contact}>
          <p>{business.address}</p>
          <a href="tel:+527711811972">{business.phone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <span>{business.social}</span>
        </div>
        <nav aria-label="Navegación del pie de página">
          <Link href="/menu">Menú</Link>
          <a href="#espacios">Espacios</a>
          <Link href="/ordenar">
            Ir a ordenar <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
