"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Menu as MenuIcon,
  Minus,
  Plus,
  ShoppingBag,
  X,
  CreditCard,
  Banknote,
  Coffee,
  CalendarDays,
  Laptop,
  Search,
  Utensils,
  PackageCheck,
  Pencil,
  Trash2,
  Users,
  Clock,
  Leaf,
  CakeSlice,
  Sandwich,
} from "lucide-react";
import {
  categories,
  formatMoney,
  visibleGroups,
  products,
  startingPrice,
  unitPrice,
  type Product,
} from "@/data/menu";
import {
  coworkingQuote,
  hourlyCoworkRate,
  periods,
  rates,
  rooms,
  type Period,
} from "@/data/coworking";
import { localDateKey } from "@/data/order";
import {
  availablePaymentMethods,
  canPayRequest,
  type PaymentMethod,
} from "@/data/payment";
import {
  useDemoStore,
  type CartItem,
  type ReceiptSummary,
  type CoworkDraft,
  type DemoRequest,
  type RequestKind,
} from "@/store/demo";
import Receipt from "@/components/Receipt";

const productById = (id: string) => products.find((p) => p.id === id);
const selectedLabels = (p: Product, selections: Record<string, string>) =>
  visibleGroups(p, selections)
    .map((g) => g.options.find((o) => o.id === selections[g.id])?.label)
    .filter(Boolean)
    .join(" · ");
const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => {
    const p = productById(item.productId);
    return sum + (p ? unitPrice(p, item.selections) * item.quantity : 0);
  }, 0);
const makeLineId = () => crypto.randomUUID();
let dialogLocks = 0;
function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
function GoBack({ href }: { href: string }) {
  return (
    <Link className="back-link" href={href}>
      <ArrowLeft size={16} /> Volver
    </Link>
  );
}
function StepHeader({
  eyebrow,
  title,
  description,
  back,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  back?: string;
}) {
  const path = usePathname().replace(/\/+$/, "");
  const steps = path.startsWith("/reservar")
    ? ["Tu visita", "Mesa", "Revisión"]
    : path.startsWith("/coworking")
      ? ["Espacio", "Tarifa y fecha", "Revisión"]
      : path.startsWith("/pedido")
        ? path === "/pedido/recoger-hora"
          ? ["Modalidad", "Recogida", "Tu pedido", "Revisión"]
          : ["Modalidad", "Tu pedido", "Revisión"]
        : [];
  const current = path.endsWith("revision")
    ? 2
    : path === "/pedido/recoger-hora"
      ? 1
    : path.endsWith("mesa") || path.endsWith("configurar")
      ? 1
      : 0;
  return (
    <div className="step-header wrap">
      {back && <GoBack href={back} />}
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="muted lead">{description}</p>}
      {steps.length > 0 && (
        <ol className="flow-progress" aria-label="Progreso">
          {steps.map((step, i) => (
            <li key={step} aria-current={i === current ? "step" : undefined}>
              <span>{i < current ? <Check size={12} /> : i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
function Dialog({
  title,
  onClose,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement;
    const root = ref.current;
    root
      ?.querySelector<HTMLElement>('button, input, a, [tabindex="0"]')
      ?.focus();
    const key = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll(".dialog");
      if (dialogs[dialogs.length - 1] !== root) return;
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && root) {
        const nodes = [
          ...root.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input:not([disabled]),a[href],[tabindex="0"]',
          ),
        ];
        if (!nodes.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    dialogLocks += 1;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      dialogLocks -= 1;
      if (dialogLocks === 0) document.body.style.overflow = "";
      returnTo.current?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="dialog-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        className={`dialog ${className}`}
      >
        <button
          className="icon-btn dialog-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
function Header() {
  const path = usePathname();
  const router = useRouter();
  const cart = useDemoStore((s) => s.cart);
  const orderMode = useDemoStore((s) => s.orderMode);
  const pickupDate = useDemoStore((s) => s.pickupDate);
  const pickupTime = useDemoStore((s) => s.pickupTime);
  const refreshPickupDate = useDemoStore((s) => s.refreshPickupDate);
  const count = cart.reduce((n, item) => n + item.quantity, 0);
  const showCart =
    count > 0 &&
    (path === "/" || path.startsWith("/menu") || path.startsWith("/pedido"));
  const [toast, setToast] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const notify = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      setToast(action === "added" ? "Agregado al pedido" : "Pedido actualizado");
      clearTimeout(timer);
      timer = setTimeout(() => setToast(""), 2200);
    };
    window.addEventListener("lunario:cart", notify);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("lunario:cart", notify);
    };
  }, []);
  useEffect(() => {
    document.body.classList.toggle("has-cart", showCart);
    return () => document.body.classList.remove("has-cart");
  }, [showCart]);
  useEffect(() => refreshPickupDate(), [refreshPickupDate]);
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => setMenu(false), [path]);
  return (
    <>
      <header className={`site-header ${path === "/" ? "on-hero" : ""}`}>
        <div className="wrap header-inner">
          <Link
            href="/"
            className="desktop-logo"
            aria-label="Lunario Café, inicio"
          >
            <Image
              src="/brand/lunario-logo-horizontal.png"
              alt="Lunario Café"
              width={185}
              height={52}
              priority
            />
          </Link>
          <Link
            href="/"
            className="mobile-logo"
            aria-label="Lunario Café, inicio"
          >
            <Image
              src="/brand/lunario-isotipo-marfil.svg"
              alt=""
              width={42}
              height={42}
            />
          </Link>
          <nav className="desktop-nav" aria-label="Principal">
            {count > 0 && (
              <button
                className="icon-btn"
                aria-label="Abrir carrito"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={20} />
                <span className="cart-badge">{count}</span>
              </button>
            )}
            <Link href="/menu">Menú</Link>
            <Link href="/reservar">Reservar</Link>
            <Link href="/coworking">Coworking</Link>
            <Link className="header-order" href="/pedido">
              Pedir <ArrowRight size={15} />
            </Link>
          </nav>
          <div className="mobile-actions">
            {cart.length > 0 && (
              <button
                aria-label={`Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`}
                className="icon-btn"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={22} />
                <span key={count} className="cart-badge">
                  {count}
                </span>
              </button>
            )}
            <button
              className="icon-btn"
              type="button"
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <span className={`menu-icon ${menu ? "is-open" : ""}`} aria-hidden="true">
                <MenuIcon className="menu-glyph" />
                <X className="close-glyph" />
              </span>
            </button>
          </div>
        </div>
        <nav
          className={`mobile-nav ${menu ? "is-open" : ""}`}
          aria-label="Menú móvil"
          aria-hidden={!menu}
          inert={!menu}
        >
          <Link href="/">Inicio</Link>
          <Link href="/menu">Menú</Link>
          <Link href="/reservar">Reservar</Link>
          <Link href="/coworking">Coworking</Link>
          <Link href="/pedido">Pedir</Link>
        </nav>
      </header>
      {showCart && !cartOpen && !menu && (
        <button
          className="floating-cart"
          onClick={() => setCartOpen(true)}
          aria-label={`Ver pedido, ${count} ${count === 1 ? "producto" : "productos"}, ${formatMoney(cartTotal(cart))}`}
        >
          <span className="cart-icon">
            <ShoppingBag size={20} />
            <b key={count}>{count}</b>
          </span>
          <span>
            <small>{orderMode === "pickup" ? "Para recoger" : "Tu pedido"}</small>
            <strong>{formatMoney(cartTotal(cart))}</strong>
            {orderMode === "pickup" && pickupTime && (
              <small className="pickup-cart-context">
                {pickupDate === localDateKey() ? `Hoy · ${pickupTime}` : "Hora por elegir"}
              </small>
            )}
          </span>
          <span className="cart-cta">
            Ver pedido <ArrowRight size={18} />
          </span>
        </button>
      )}
      <div className="toast" role="status">
        {toast && (
          <span>
            <Check size={16} />
            {toast}
          </span>
        )}
      </div>
      {cartOpen && <CartDialog onClose={() => setCartOpen(false)} />}
    </>
  );
}
function PickupTimeDialog({ onClose }: { onClose: () => void }) {
  const pickupTime = useDemoStore((s) => s.pickupTime);
  const setPickupTime = useDemoStore((s) => s.setPickupTime);
  const [time, setTime] = useState(pickupTime);
  const [error, setError] = useState(false);
  return (
    <Dialog
      title="Cambiar hora de recogida"
      onClose={onClose}
      className="pickup-time-dialog"
    >
      <p className="eyebrow">PARA RECOGER · HOY</p>
      <h2>¿A qué hora pasarás?</h2>
      <label>
        <span className="field-label">
          <Clock size={16} /> Hora preferida de recogida
        </span>
        <input
          autoFocus
          type="time"
          value={time}
          aria-invalid={error}
          aria-describedby={error ? "pickup-time-error" : "pickup-time-note"}
          onChange={(event) => {
            setTime(event.target.value);
            setError(false);
          }}
        />
      </label>
      {error && (
        <p id="pickup-time-error" className="field-error" role="alert">
          Selecciona una hora para recoger.
        </p>
      )}
      <p id="pickup-time-note" className="muted pickup-time-note">
        Es una hora preferida para hoy, no una confirmación de disponibilidad.
      </p>
      <button
        className="btn dark full"
        onClick={() => {
          if (!time) {
            setError(true);
            return;
          }
          setPickupTime(time);
          onClose();
        }}
      >
        Guardar hora <Check size={17} />
      </button>
    </Dialog>
  );
}
function PickupContext() {
  const mode = useDemoStore((s) => s.orderMode);
  const pickupDate = useDemoStore((s) => s.pickupDate);
  const pickupTime = useDemoStore((s) => s.pickupTime);
  const [editing, setEditing] = useState(false);
  if (mode !== "pickup") return null;
  return (
    <>
      <div className="pickup-context">
        <span className="pickup-context-icon"><PackageCheck size={17} /></span>
        <span className="pickup-context-copy">
          <strong>Para recoger</strong>
          <small>
            {pickupDate === localDateKey() && pickupTime
              ? `Hoy · ${pickupTime}`
              : "Recoger hoy · hora por elegir"}
          </small>
        </span>
        <button
          type="button"
          className="pickup-context-edit"
          onClick={() => setEditing(true)}
        >
          Cambiar
        </button>
      </div>
      {editing && <PickupTimeDialog onClose={() => setEditing(false)} />}
    </>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <Link href="/" aria-label="Lunario Café, inicio">
          <Image
            src="/brand/lunario-logo-circular.png"
            alt="Lunario Café"
            width={106}
            height={106}
          />
        </Link>
        <nav aria-label="Navegación de pie de página">
          <Link href="/menu">Menú</Link>
          <Link href="/pedido">Pedir</Link>
          <Link href="/reservar">Reservar</Link>
          <Link href="/coworking">Coworking</Link>
        </nav>
        <p>
          Demo visual de Lunario Café.
          <br />
          Ninguna solicitud o pago se realiza realmente.
        </p>
      </div>
    </footer>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div
          className="hero-photo"
          role="img"
          aria-label="Café fotografiado en el menú oficial de Lunario"
        />
        <div className="hero-shade" />
        <div className="wrap hero-content">
          <p className="eyebrow light">CAFÉ · ENCUENTROS · IDEAS</p>
          <h1>
            Un momento
            <br />
            <em>para quedarte.</em>
          </h1>
          <p>Explora la experiencia de Lunario Café.</p>
          <div className="hero-actions">
            <Link className="btn champagne" href="/pedido">
              Pedir <ArrowRight size={17} />
            </Link>
            <Link className="btn outline-light" href="/reservar">
              Reservar mesa
            </Link>
          </div>
        </div>
        <div className="hero-side">LUNARIO CAFÉ / DEMO V2</div>
      </section>
      <section className="wrap home-actions">
        <div className="section-intro">
          <p className="eyebrow">ELIGE TU MOMENTO</p>
          <h2>¿Qué te trae hoy?</h2>
        </div>
        <div className="action-grid">
          <Link href="/pedido" className="action-card">
            <span className="icon-holder warm">
              <ShoppingBag />
            </span>
            <h3>Pedir</h3>
            <p>Para disfrutar aquí o recoger.</p>
            <ArrowRight />
          </Link>
          <Link href="/reservar" className="action-card">
            <span className="icon-holder lavender">
              <CalendarDays />
            </span>
            <h3>Reservar mesa</h3>
            <p>Elige tu fecha y una mesa en el plano.</p>
            <ArrowRight />
          </Link>
          <Link href="/coworking" className="action-card">
            <span className="icon-holder mist">
              <Laptop />
            </span>
            <h3>Coworking</h3>
            <p>Encuentra un espacio para tus ideas.</p>
            <ArrowRight />
          </Link>
        </div>
      </section>
      <section className="home-menu">
        <div className="wrap split-section">
          <div>
            <p className="eyebrow">LA CARTA</p>
            <h2>
              Tu pausa favorita
              <br />
              empieza aquí.
            </h2>
            <p className="muted">
              Cafés, desayunos y algo para cada antojo. Explora los productos y
              precios publicados por Lunario.
            </p>
            <Link className="btn dark" href="/menu">
              Ver menú <ArrowRight size={17} />
            </Link>
          </div>
          <div className="menu-preview">
            <div>
              <small>BEBIDAS CON CAFÉ</small>
              <strong>Café latte</strong>
              <span>Desde $52</span>
            </div>
            <div>
              <small>DESAYUNOS</small>
              <strong>Chilaquiles</strong>
              <span>Desde $85</span>
            </div>
            <div>
              <small>CREPAS Y POSTRES</small>
              <strong>Crepa de frutos rojos</strong>
              <span>$84</span>
            </div>
          </div>
        </div>
      </section>
      <section className="cowork-band">
        <div className="wrap split-section">
          <div
            className="cowork-band-photo"
            role="img"
            aria-label="Espacio de coworking fotografiado por Lunario"
          />
          <div>
            <p className="eyebrow light">COFFEE TIME</p>
            <h2>
              Espacio para
              <br />
              hacer que pase.
            </h2>
            <p>
              Cuatro cuartos para trabajar, estudiar o reunirte. Explora el
              plano y las tarifas publicadas.
            </p>
            <Link className="btn champagne" href="/coworking">
              Ver coworking <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
function ProductCard({
  product,
  transactionalMode,
  onOpen,
}: {
  product: Product;
  transactionalMode: boolean;
  onOpen: (p: Product) => void;
}) {
  const Symbol =
    {
      cafe: Coffee,
      bebidas: Leaf,
      desayunos: Utensils,
      postres: CakeSlice,
      emparedados: Sandwich,
      antojitos: Utensils,
    }[product.categoryId] ?? Coffee;
  return (
    <button
      type="button"
      className="product-card"
      onClick={() => onOpen(product)}
    >
      <div>
        <span
          className={`product-symbol tone-${product.categoryId}`}
          aria-hidden="true"
        >
          <Symbol size={20} />
        </span>
        <p className="product-category">
          {categories.find((c) => c.id === product.categoryId)?.name}
        </p>
        <h3>{product.name}</h3>
        {product.description && (
          <p className="muted product-desc">{product.description}</p>
        )}
      </div>
      <div className="product-card-bottom">
        <strong>
          {product.optionGroups.some((g) =>
            g.options.some((o) => o.priceMode === "absolute"),
          )
            ? "Desde "
            : ""}
          {formatMoney(startingPrice(product))}
        </strong>
        <span className="text-action">
          {transactionalMode ? "Ver opciones" : "Ver detalle"}{" "}
          <ArrowRight size={16} />
        </span>
      </div>
    </button>
  );
}
function MenuView() {
  const mode = useDemoStore((s) => s.orderMode);
  const pickupDate = useDemoStore((s) => s.pickupDate);
  const pickupTime = useDemoStore((s) => s.pickupTime);
  const cart = useDemoStore((s) => s.cart);
  const [active, setActive] = useState<string>("cafe");
  const [query, setQuery] = useState("");
  const normalize = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visible = products.filter(
    (p) =>
      p.enabledInDemo &&
      (query.trim()
        ? normalize(
            `${p.name} ${p.description} ${categories.find((c) => c.id === p.categoryId)?.name}`,
          ).includes(normalize(query.trim()))
        : p.categoryId === active),
  );
  const [open, setOpen] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <Guard valid={mode !== "pickup" || (pickupDate === localDateKey() && !!pickupTime)} to="/pedido/recoger-hora">
    <>
      <StepHeader
        eyebrow="MENÚ LUNARIO"
        title="La carta"
        description="Sabores para quedarte un poco más."
      />
      {mode === "pickup" && <div className="wrap"><PickupContext /></div>}
      <div className="wrap search-wrap">
        <label className="menu-search">
          <Search size={20} />
          <input
            type="search"
            placeholder="Buscar en la carta"
            aria-label="Buscar en la carta"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="category-strip">
        <nav className="wrap category-inner" aria-label="Categorías del menú">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={(e) => {
                setActive(c.id);
                setQuery("");
                e.currentTarget.scrollIntoView({
                  block: "nearest",
                  inline: "center",
                  behavior: "smooth",
                });
              }}
              className={!query && active === c.id ? "active" : ""}
              aria-current={!query && active === c.id ? "true" : undefined}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </div>
      <main className="wrap menu-content">
        <div className="menu-topline">
          <div>
            <p className="eyebrow">
              {query
                ? `${visible.length} ${visible.length === 1 ? "resultado" : "resultados"}`
                : categories.find((c) => c.id === active)?.name}
            </p>
            <p className="muted">Precios en pesos mexicanos.</p>
          </div>
          {cart.length > 0 && (
            <button className="btn dark" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={17} /> Carrito · {formatMoney(cartTotal(cart))}
            </button>
          )}
        </div>
        {visible.length === 0 && (
          <p className="empty-state">
            No encontramos productos. Prueba con otro nombre o categoría.
          </p>
        )}
        <div className="product-grid">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              transactionalMode={!!mode}
              onOpen={setOpen}
            />
          ))}
        </div>
      </main>
      {open && (
        <ProductConfigurator product={open} onClose={() => setOpen(null)} />
      )}{" "}
      {cartOpen && <CartDialog onClose={() => setCartOpen(false)} />}
    </>
    </Guard>
  );
}
function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label="Reducir cantidad"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus size={17} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        onClick={() => onChange(value + 1)}
      >
        <Plus size={17} />
      </button>
    </div>
  );
}
function ProductConfigurator({
  product,
  onClose,
  editing,
}: {
  product: Product;
  onClose: () => void;
  editing?: CartItem;
}) {
  const add = useDemoStore((s) => s.addItem);
  const update = useDemoStore((s) => s.updateItem);
  const router = useRouter();
  const mode = useDemoStore((s) => s.orderMode);
  const [selections, setSelections] = useState<Record<string, string>>(
    editing?.selections ?? {},
  );
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [missingGroup, setMissingGroup] = useState<string | null>(null);
  const price = unitPrice(product, selections);
  function commit() {
    const missing = visibleGroups(product, selections).find(
      (g) => g.required && !selections[g.id],
    );
    if (missing) {
      setMissingGroup(missing.id);
      document
        .querySelector<HTMLInputElement>(`[data-group="${missing.id}"] input`)
        ?.focus();
      return;
    }
    const line: CartItem = {
      lineId: editing?.lineId ?? makeLineId(),
      productId: product.id,
      selections,
      quantity,
    };
    if (editing) update(editing.lineId, line);
    else add(line);
    window.dispatchEvent(new CustomEvent("lunario:cart", { detail: { action: editing ? "updated" : "added" } }));
    onClose();
    if (!mode && !editing) router.push("/pedido");
  }
  return (
    <Dialog title={product.name} onClose={onClose} className="product-dialog">
      <p className="eyebrow">LUNARIO CAFÉ</p>
      <h2>{product.name}</h2>
      {product.description && <p className="muted">{product.description}</p>}
      {mode === "pickup" && <PickupContext />}
      <div className="config-options">
        {visibleGroups(product, selections).map((g) => (
          <fieldset key={g.id} data-group={g.id} aria-describedby={missingGroup === g.id ? `option-error-${g.id}` : undefined}>
            <legend>
              {g.label} {g.required && <span aria-hidden="true">*</span>}
            </legend>
            <div className="option-list">
              {g.options
                .filter((o) => o.enabled)
                .map((o) => (
                  <label
                    key={o.id}
                    className={selections[g.id] === o.id ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name={g.id}
                      checked={selections[g.id] === o.id}
                      onChange={() => {
                        setSelections((s) => ({ ...s, [g.id]: o.id }));
                        setMissingGroup(null);
                      }}
                    />
                    <span>{o.label}</span>
                    {o.priceMode !== "none" && o.price !== 0 && (
                      <strong>
                        {o.priceMode === "delta" && "+"}
                        {formatMoney(o.price)}
                      </strong>
                    )}
                  </label>
                ))}
            </div>
            {missingGroup === g.id && <p id={`option-error-${g.id}`} className="field-error" role="alert">Selecciona {g.label.toLowerCase()}.</p>}
          </fieldset>
        ))}
      </div>
      <div className="config-footer">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <div>
          <small>Subtotal</small>
          <strong>
            {price
              ? formatMoney(price * quantity)
              : `Desde ${formatMoney(startingPrice(product) * quantity)}`}
          </strong>
        </div>
        <button className="btn dark" onClick={commit}>
          {editing
            ? "Guardar cambios"
            : mode
              ? `Agregar · ${formatMoney((price || startingPrice(product)) * quantity)}`
              : "Elegir modalidad"}{" "}
          <ArrowRight size={16} />
        </button>
      </div>
    </Dialog>
  );
}
function CartDialog({
  onClose,
  onEdit,
}: {
  onClose: () => void;
  onEdit?: (p: Product, item: CartItem) => void;
}) {
  const cart = useDemoStore((s) => s.cart);
  const setQuantity = useDemoStore((s) => s.setQuantity);
  const remove = useDemoStore((s) => s.removeItem);
  const orderMode = useDemoStore((s) => s.orderMode);
  const pickupDate = useDemoStore((s) => s.pickupDate);
  const pickupTime = useDemoStore((s) => s.pickupTime);
  const router = useRouter();
  const [editing, setEditing] = useState<CartItem | null>(null);
  const editProduct = editing && productById(editing.productId);
  return (
    <>
      <Dialog title="Carrito" onClose={onClose} className="cart-dialog">
        <p className="eyebrow">TU PEDIDO</p>
        <h2>Carrito</h2>
        {orderMode === "pickup" && <PickupContext />}
        {cart.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={32} />
            <p>Tu carrito está vacío.</p>
            <button className="btn dark" onClick={() => { onClose(); router.push("/menu"); }}>
              Ver menú
            </button>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {cart.map((item) => {
                const p = productById(item.productId);
                if (!p) return null;
                return (
                  <article className="cart-row" key={item.lineId}>
                    <div>
                      <h3>{p.name}</h3>
                      <p className="muted">
                        {selectedLabels(p, item.selections)}
                      </p>
                      <div className="cart-row-actions">
                        <button
                          className="text-action"
                          onClick={() =>
                            onEdit ? onEdit(p, item) : setEditing(item)
                          }
                        >
                          <Pencil size={15} /> Editar
                        </button>
                        <button
                          className="text-action"
                          onClick={() => remove(item.lineId)}
                        >
                          <Trash2 size={15} /> Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="cart-row-right">
                      <strong>
                        {formatMoney(
                          unitPrice(p, item.selections) * item.quantity,
                        )}
                      </strong>
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(v) => setQuantity(item.lineId, v)}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="cart-footer">
              <div className="total-line">
                <span>Total</span>
                <strong>{formatMoney(cartTotal(cart))}</strong>
              </div>
              <button
                className="btn dark full"
                onClick={() => {
                  onClose();
                  router.push(!orderMode ? "/pedido" : orderMode === "pickup" && (pickupDate !== localDateKey() || !pickupTime) ? "/pedido/recoger-hora" : orderMode === "dineIn" && !useDemoStore.getState().orderTableId ? "/pedido/mesa" : "/pedido/revision");
                }}
              >
                Revisar pedido <ArrowRight size={16} />
              </button>
              <button className="text-action" onClick={onClose}>
                Volver al menú
              </button>
              <button className="text-action" onClick={() => { onClose(); router.push("/pedido"); }}>
                Cambiar modalidad
              </button>
            </div>
          </>
        )}
      </Dialog>
      {editing && editProduct && (
        <ProductConfigurator
          product={editProduct}
          editing={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

const tables = [
  {
    id: "table-a",
    x: 187,
    y: 255,
    w: 106,
    h: 65,
    label: "junto a la pared superior izquierda",
  },
  {
    id: "table-b",
    x: 187,
    y: 354,
    w: 106,
    h: 63,
    label: "en la zona superior izquierda",
  },
  {
    id: "table-c",
    x: 190,
    y: 526,
    w: 109,
    h: 62,
    label: "junto al pasillo, a la izquierda",
  },
  {
    id: "table-d",
    x: 194,
    y: 589,
    w: 104,
    h: 65,
    label: "junto a las escaleras",
  },
  {
    id: "table-e",
    x: 218,
    y: 979,
    w: 132,
    h: 70,
    label: "debajo de las escaleras",
  },
  {
    id: "table-f",
    x: 221,
    y: 1104,
    w: 123,
    h: 77,
    label: "en la zona central izquierda",
  },
  {
    id: "table-g",
    x: 191,
    y: 1261,
    w: 161,
    h: 90,
    label: "cerca de la entrada, a la izquierda",
  },
  {
    id: "table-h",
    x: 757,
    y: 983,
    w: 162,
    h: 61,
    label: "debajo de los baños",
  },
  {
    id: "table-i",
    x: 760,
    y: 1088,
    w: 154,
    h: 100,
    label: "en la zona central derecha",
  },
  {
    id: "table-j",
    x: 810,
    y: 1265,
    w: 165,
    h: 80,
    label: "cerca de la entrada, a la derecha",
  },
];
const roomZones = [
  { id: "room-01", x: 112, y: 193, w: 510, h: 340 },
  { id: "room-02", x: 112, y: 537, w: 510, h: 357 },
  { id: "room-03", x: 724, y: 753, w: 362, h: 364 },
  { id: "room-04", x: 113, y: 1122, w: 973, h: 304 },
];
function Floorplan({
  kind,
  selected,
  onSelect,
}: {
  kind: "table" | "room";
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const source =
    kind === "table"
      ? "/floorplans/planta-baja.svg"
      : "/floorplans/segundo-piso.svg";
  const zones = kind === "table" ? tables : roomZones;
  const pointerStart = useRef(new Map<number, { x: number; y: number }>());
  const suppressTap = useRef(false);
  const clearSuppressedTap = () => {
    window.setTimeout(() => {
      suppressTap.current = false;
    }, 0);
  };
  return (
    <div className="plan-shell">
      <div className="plan-stage">
        <div className="plan-scaled">
          <Image
            src={source}
            alt={
              kind === "table"
                ? "Plano digital de planta baja con mesas, pasillo, barra, cocina, baños, escaleras y entrada"
                : "Plano digital de segundo piso con cuatro cuartos, entradas, baño y escaleras"
            }
            width={1200}
            height={1600}
            unoptimized
          />
          <svg
            className="plan-overlay"
            viewBox="0 0 1200 1600"
            aria-label={
              kind === "table"
                ? "Seleccionar mesa en el plano"
                : "Seleccionar cuarto en el plano"
            }
          >
            {zones.map((z) => (
              <rect
                key={z.id}
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="8"
                tabIndex={0}
                role="button"
                aria-label={
                  kind === "table"
                    ? `Seleccionar mesa ${"label" in z ? z.label : ""}`
                    : `Seleccionar ${rooms.find((r) => r.id === z.id)?.name}`
                }
                aria-pressed={selected === z.id}
                className={`plan-hotspot ${selected === z.id ? "selected" : ""}`}
                onPointerDown={(e) =>
                  pointerStart.current.set(e.pointerId, {
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onPointerMove={(e) => {
                  const start = pointerStart.current.get(e.pointerId);
                  if (
                    e.pointerType === "touch" &&
                    start &&
                    Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10
                  )
                    suppressTap.current = true;
                }}
                onPointerUp={(e) => {
                  pointerStart.current.delete(e.pointerId);
                  clearSuppressedTap();
                }}
                onPointerCancel={(e) => {
                  pointerStart.current.delete(e.pointerId);
                  clearSuppressedTap();
                }}
                onClick={(e) => {
                  if (suppressTap.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    suppressTap.current = false;
                    return;
                  }
                  onSelect(z.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(z.id);
                  }
                }}
              />
            ))}
          </svg>
        </div>
      </div>
      <p className="plan-caption">
        Plano orientativo sin escala. Selecciona{" "}
        {kind === "table" ? "una mesa" : "un cuarto"}; la selección se marca en
        dorado.
      </p>
      {kind === "table" && (
        <details className="table-options">
          <summary className="eyebrow">Elegir mesa por ubicación</summary>
          <div>
            {tables.map((t) => (
              <button
                key={t.id}
                aria-pressed={selected === t.id}
                className={selected === t.id ? "selected" : ""}
                onClick={() => onSelect(t.id)}
              >
                Mesa {t.label}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
function Guard({
  valid,
  to,
  children,
}: {
  valid: boolean;
  to: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    if (!valid) router.replace(to);
  }, [valid, to, router]);
  return valid ? (
    <>{children}</>
  ) : (
    <div className="wrap loading-view">Preparando recorrido…</div>
  );
}
function ChoicePage() {
  const router = useRouter();
  const set = useDemoStore((s) => s.setOrderMode);
  const pickupDate = useDemoStore((s) => s.pickupDate);
  const pickupTime = useDemoStore((s) => s.pickupTime);
  return (
    <main>
      <StepHeader
        eyebrow="PEDIDO"
        title="¿Cómo lo prefieres?"
        description="Elige cómo disfrutar tu pedido."
        back="/"
      />
      <div className="wrap choice-grid">
        <button
          className="choice-card"
          onClick={() => {
            set("dineIn");
            router.push("/pedido/mesa");
          }}
        >
          <span className="icon-holder warm">
            <Utensils />
          </span>
          <h2>En Lunario</h2>
          <p>Selecciona una mesa y elige desde la carta.</p>
          <span className="choice-arrow">
            <ArrowRight />
          </span>
        </button>
        <button
          className="choice-card"
          onClick={() => {
            const hasSameDayTime =
              pickupDate === localDateKey() && !!pickupTime;
            set("pickup");
            router.push(hasSameDayTime ? "/menu" : "/pedido/recoger-hora");
          }}
        >
          <span className="icon-holder sage">
            <PackageCheck />
          </span>
          <h2>Para recoger</h2>
          <p>Recoge hoy. Elige la hora preferida y prepara tu pedido.</p>
          <span className="choice-arrow">
            <ArrowRight />
          </span>
        </button>
      </div>
    </main>
  );
}
function PickupTimePage() {
  const mode = useDemoStore((s) => s.orderMode);
  const pickupTime = useDemoStore((s) => s.pickupTime);
  const setPickupTime = useDemoStore((s) => s.setPickupTime);
  const router = useRouter();
  const [error, setError] = useState(false);
  return (
    <Guard valid={mode === "pickup"} to="/pedido">
      <main>
        <StepHeader
          eyebrow="PEDIDO / PARA RECOGER"
          title="Recoger hoy"
          description="Indica a qué hora prefieres pasar por tu pedido. La hora no confirma disponibilidad."
          back="/pedido"
        />
        <div className="wrap form-layout pickup-layout">
          <div className="form-panel pickup-form">
            <p className="eyebrow">¿A qué hora pasarás?</p>
            <label>
              <span className="field-label">
                <Clock size={16} /> Hora preferida de recogida
              </span>
              <input
                type="time"
                value={pickupTime}
                aria-invalid={error}
                aria-describedby={error ? "pickup-time-inline-error" : "pickup-time-inline-note"}
                onChange={(event) => {
                  setPickupTime(event.target.value);
                  setError(false);
                }}
              />
              {error && (
                <span id="pickup-time-inline-error" className="field-error" role="alert">
                  Selecciona una hora para recoger.
                </span>
              )}
            </label>
            <p id="pickup-time-inline-note" className="muted pickup-time-note">
              Preferencia para hoy. No representa un horario disponible ni una
              confirmación del pedido.
            </p>
            <button
              className="btn dark full"
              onClick={() => {
                if (!pickupTime) {
                  setError(true);
                  return;
                }
                setPickupTime(pickupTime);
                router.push("/menu");
              }}
            >
              Continuar al menú <ArrowRight size={17} />
            </button>
          </div>
          <aside className="form-aside">
            <span>HOY · {pickupTime || "HORA PENDIENTE"}</span>
            <h2>Tu pedido, a tu ritmo.</h2>
            <p>
              No usamos intervalos ni cupos simulados. El equipo confirmaría la
              solicitud posteriormente.
            </p>
          </aside>
        </div>
      </main>
    </Guard>
  );
}
function OrderTable() {
  const mode = useDemoStore((s) => s.orderMode);
  const selected = useDemoStore((s) => s.orderTableId);
  const set = useDemoStore((s) => s.setOrderTable);
  const router = useRouter();
  return (
    <Guard valid={mode === "dineIn"} to="/pedido">
      <main>
        <StepHeader
          eyebrow="PEDIDO / EN LUNARIO"
          title="Elige una mesa"
          description="Señala tu preferencia en el plano. Lunario confirmaría la solicitud posteriormente."
          back="/pedido"
        />
        <div className="wrap plan-layout">
          <Floorplan kind="table" selected={selected} onSelect={set} />
          <aside className="selection-panel">
            <p className="eyebrow">TU SELECCIÓN</p>
            <h2>{selected ? "Mesa seleccionada" : "Selecciona una mesa"}</h2>
            <p className="muted">
              El plano es orientativo. No indica disponibilidad en tiempo real.
            </p>
            <button
              className="btn dark full"
              disabled={!selected}
              onClick={() => router.push("/menu")}
            >
              Continuar al menú <ArrowRight size={17} />
            </button>
          </aside>
        </div>
      </main>
    </Guard>
  );
}
function ReservationStart() {
  const draft = useDemoStore((s) => s.reservation);
  const set = useDemoStore((s) => s.setReservation);
  const router = useRouter();
  const [missing, setMissing] = useState<"date" | "time" | "people" | null>(null);
  function next() {
    const field = !draft.date ? "date" : !draft.time ? "time" : !draft.people ? "people" : null;
    if (field) {
      setMissing(field);
      return;
    }
    setMissing(null);
    router.push("/reservar/mesa");
  }
  return (
    <main>
      <StepHeader
        eyebrow="RESERVAR MESA"
        title="Tu próxima visita"
        description="Indica cuándo deseas venir. La hora es una preferencia para la solicitud, no una disponibilidad confirmada."
        back="/"
      />
      <div className="wrap form-layout">
        <div className="form-panel">
          <label>
            <span className="field-label">
              <CalendarDays size={16} /> Fecha
            </span>
            <input
              type="date"
              value={draft.date}
              aria-invalid={missing === "date"}
              onChange={(e) => { set({ date: e.target.value }); setMissing(null); }}
            />
            {missing === "date" && <span className="field-error" role="alert">Selecciona una fecha.</span>}
          </label>
          <label>
            <span className="field-label">
              <Clock size={16} /> Hora
            </span>
            <input
              type="time"
              value={draft.time}
              aria-invalid={missing === "time"}
              onChange={(e) => { set({ time: e.target.value }); setMissing(null); }}
            />
            {missing === "time" && <span className="field-error" role="alert">Selecciona una hora.</span>}
          </label>
          <label>
            <span className="field-label">
              <Users size={16} /> Personas
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={draft.people || ""}
              aria-invalid={missing === "people"}
              onChange={(e) =>
                { set({ people: Math.max(0, Math.floor(Number(e.target.value))) }); setMissing(null); }
              }
              placeholder="Número de personas"
            />
            {missing === "people" && <span className="field-error" role="alert">Indica cuántas personas asistirán.</span>}
          </label>
          <button className="btn dark" onClick={next}>
            Elegir mesa <ArrowRight size={17} />
          </button>
        </div>
        <div className="form-aside">
          <span>01 / 03</span>
          <h2>
            Una mesa
            <br />a tu manera.
          </h2>
          <p>
            Primero tu fecha, hora y personas. Después eliges una mesa en el
            plano y revisas tu solicitud.
          </p>
        </div>
      </div>
    </main>
  );
}
function ReservationTable() {
  const draft = useDemoStore((s) => s.reservation);
  const set = useDemoStore((s) => s.setReservation);
  const router = useRouter();
  return (
    <Guard valid={!!(draft.date && draft.time && draft.people)} to="/reservar">
      <main>
        <StepHeader
          eyebrow="RESERVAR MESA / PLANO"
          title="Encuentra tu mesa"
          description="Selecciona tu mesa preferida. Su disponibilidad se confirmaría después de enviar la solicitud."
          back="/reservar"
        />
        <div className="wrap plan-layout">
          <Floorplan
            kind="table"
            selected={draft.tableId}
            onSelect={(v) => set({ tableId: v })}
          />
          <aside className="selection-panel">
            <p className="eyebrow">TU PREFERENCIA</p>
            <h2>
              {draft.tableId ? "Mesa seleccionada" : "Selecciona una mesa"}
            </h2>
            <p className="muted">
              {draft.date} · {draft.time} · {draft.people}{" "}
              {draft.people === 1 ? "persona" : "personas"}
            </p>
            <button
              className="btn dark full"
              disabled={!draft.tableId}
              onClick={() => router.push("/reservar/revision")}
            >
              Revisar solicitud <ArrowRight size={17} />
            </button>
          </aside>
        </div>
      </main>
    </Guard>
  );
}
function AccessDialog({
  kind,
  onClose,
}: {
  kind: RequestKind;
  onClose: () => void;
}) {
  const setAccess = useDemoStore((s) => s.setAccess);
  const submit = useDemoStore((s) => s.submit);
  const router = useRouter();
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  function go(mode: "guest" | "google-demo" | "email-demo") {
    setAccess(mode);
    submit(kind);
    onClose();
    router.push("/solicitud");
  }
  return (
    <Dialog
      title="Continuar solicitud"
      onClose={onClose}
      className="access-dialog"
    >
      <Image src="/brand/lunario-isotipo.svg" alt="" width={52} height={52} />
      <p className="eyebrow">ACCESO VISUAL</p>
      <h2>Un paso más.</h2>
      <p className="muted">
        Elige cómo continuar esta demostración. No se crea una cuenta ni se
        envía información.
      </p>
      <div className="access-options">
        <button onClick={() => go("google-demo")}>
          Continuar con Google <ArrowRight size={17} />
        </button>
        {emailMode ? (
          <div className="email-option">
            <label>
              Correo electrónico
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="tu@correo.com"
              />
            </label>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="btn dark full"
              onClick={() => {
                if (!/^\S+@\S+\.\S+$/.test(email)) {
                  setError("Introduce un correo válido.");
                  return;
                }
                go("email-demo");
              }}
            >
              Continuar con correo
            </button>
          </div>
        ) : (
          <button onClick={() => setEmailMode(true)}>
            Continuar con correo <ArrowRight size={17} />
          </button>
        )}
        <button onClick={() => go("guest")}>
          Continuar como invitado <ArrowRight size={17} />
        </button>
      </div>
    </Dialog>
  );
}
function ReviewActions({ kind }: { kind: RequestKind }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn dark" onClick={() => setOpen(true)}>
        Enviar solicitud <ArrowRight size={17} />
      </button>
      {open && <AccessDialog kind={kind} onClose={() => setOpen(false)} />}
    </>
  );
}
function ReviewList({ items, edits = {} }: { items: [string, string][]; edits?: Record<string, { label: string; href?: string; onClick?: () => void }> }) {
  return (
    <dl className="review-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}{edits[label] && (edits[label].href ? <Link className="review-edit" href={edits[label].href!}>{edits[label].label}</Link> : <button type="button" className="review-edit" onClick={edits[label].onClick}>{edits[label].label}</button>)}</dd>
        </div>
      ))}
    </dl>
  );
}
function OrderReview() {
  const cart = useDemoStore((s) => s.cart);
  const mode = useDemoStore((s) => s.orderMode);
  const table = useDemoStore((s) => s.orderTableId);
  const pickupDate = useDemoStore((s) => s.pickupDate);
  const pickupTime = useDemoStore((s) => s.pickupTime);
  const [editingPickup, setEditingPickup] = useState(false);
  return (
    <Guard
      valid={!!(mode && cart.length && (mode === "pickup" ? pickupDate === localDateKey() && pickupTime : table))}
      to={
        !cart.length
          ? "/menu"
            : mode === "pickup" && (pickupDate !== localDateKey() || !pickupTime)
              ? "/pedido/recoger-hora"
              : mode === "dineIn" && !table
            ? "/pedido/mesa"
            : "/pedido"
      }
    >
      <main>
        <StepHeader
          eyebrow="PEDIDO / REVISIÓN"
          title="Revisa tu pedido"
          description="Confirma los productos antes de enviar esta solicitud de demostración."
          back="/menu"
        />
        <div className="wrap review-layout">
          <div className="review-card">
            <h2>Tu selección</h2>
            {mode === "pickup" && <ReviewList items={[["Modalidad", "Para recoger"], ["Fecha", "Hoy"], ["Hora preferida", pickupTime]]} edits={{ "Modalidad": { label: "Cambiar", href: "/pedido" }, "Hora preferida": { label: "Cambiar hora", onClick: () => setEditingPickup(true) } }} />}
            {mode === "dineIn" && <ReviewList items={[["Modalidad", "En Lunario"], ["Mesa", table ? "Mesa seleccionada" : "Sin mesa"]]} edits={{ "Modalidad": { label: "Cambiar", href: "/pedido" }, "Mesa": { label: "Cambiar mesa", href: "/pedido/mesa" } }} />}
            {cart.map((item) => {
              const p = productById(item.productId);
              return (
                p && (
                  <div className="review-product" key={item.lineId}>
                    <div>
                      <strong>
                        {item.quantity} × {p.name}
                      </strong>
                      <p className="muted">
                        {selectedLabels(p, item.selections)}
                      </p>
                    </div>
                    <strong>
                      {formatMoney(
                        unitPrice(p, item.selections) * item.quantity,
                      )}
                    </strong>
                  </div>
                )
              );
            })}
            <div className="total-line">
              <span>Total</span>
              <strong>{formatMoney(cartTotal(cart))}</strong>
            </div>
            <Link className="text-action" href="/menu">
              Editar productos <ArrowRight size={15} />
            </Link>
          </div>
          <aside className="review-side">
            <p className="eyebrow">RESUMEN</p>
            <p className="muted">La solicitud no realiza un pedido real.</p>
            <ReviewActions kind="order" />
          </aside>
        </div>
      </main>
      {editingPickup && <PickupTimeDialog onClose={() => setEditingPickup(false)} />}
    </Guard>
  );
}
function ReservationReview() {
  const d = useDemoStore((s) => s.reservation);
  return (
    <Guard
      valid={!!(d.date && d.time && d.people && d.tableId)}
      to={d.date && d.time && d.people ? "/reservar/mesa" : "/reservar"}
    >
      <main>
        <StepHeader
          eyebrow="RESERVA / REVISIÓN"
          title="Revisa tu visita"
          description="Tu mesa y horario son preferencias sujetas a confirmación de Lunario."
          back="/reservar/mesa"
        />
        <div className="wrap review-layout">
          <div className="review-card">
            <h2>Solicitud de mesa</h2>
            <ReviewList
              items={[
                ["Fecha", d.date],
                ["Hora", d.time],
                ["Personas", String(d.people)],
                ["Mesa", "Mesa seleccionada"],
              ]}
              edits={{ Fecha: { label: "Cambiar", href: "/reservar" }, Hora: { label: "Cambiar", href: "/reservar" }, Personas: { label: "Cambiar", href: "/reservar" }, Mesa: { label: "Cambiar mesa", href: "/reservar/mesa" }}}
            />
            <div className="mini-plan">
              <Floorplan
                kind="table"
                selected={d.tableId}
                onSelect={() => {}}
              />
            </div>
          </div>
          <aside className="review-side">
            <p className="eyebrow">ÚLTIMO PASO</p>
            <h2>Nos vemos pronto.</h2>
            <p className="muted">
              Al enviar, verás únicamente estados simulados. No se registra una
              reserva real.
            </p>
            <ReviewActions kind="tableReservation" />
          </aside>
        </div>
      </main>
    </Guard>
  );
}
function CoworkingStart() {
  const d = useDemoStore((s) => s.cowork);
  const set = useDemoStore((s) => s.setCowork);
  const router = useRouter();
  const room = rooms.find((r) => r.id === d.roomId);
  return (
    <main>
      <StepHeader
        eyebrow="COFFEE TIME"
        title="Ideas con espacio."
        description="Explora los cuartos de coworking y señala el que prefieres para tu solicitud."
        back="/"
      />
      <div className="wrap gallery-grid">
        {/* Producción: Lunario debe entregar o autorizar las fotografías definitivas para esta galería. */}
        {[1, 2, 3].map((n) => (
          <div key={n} className="gallery-image">
            <Image
              src={`/media/coworking-${n}.jpg`}
              alt={`Espacio general de coworking de Lunario, fotografía ${n}`}
              fill
              sizes="(max-width: 700px) 80vw, 33vw"
            />
          </div>
        ))}
      </div>
      <div className="wrap plan-layout cowork-plan">
        <Floorplan
          kind="room"
          selected={d.roomId}
          onSelect={(id) => { const nextRoom = rooms.find((r) => r.id === id); set({ roomId: id, people: nextRoom && d.people <= nextRoom.capacity ? d.people : 0 }); }}
        />
        <aside className="selection-panel">
          <p className="eyebrow">CUARTOS</p>
          <h2>{room ? room.name : "Elige un cuarto"}</h2>
          {room && (
            <p className="capacity">Capacidad: {room.capacity} personas</p>
          )}
          <div className="room-list">
            {rooms.map((r) => (
              <button
                key={r.id}
                aria-pressed={d.roomId === r.id}
                className={d.roomId === r.id ? "selected" : ""}
                onClick={() => set({ roomId: r.id, people: d.people <= r.capacity ? d.people : 0 })}
              >
                <Laptop size={20} />
                <span>{r.name}</span>
                <small>Hasta {r.capacity} personas</small>
              </button>
            ))}
          </div>
          <button
            className="btn dark full"
            disabled={!room}
            onClick={() => router.push("/coworking/configurar")}
          >
            Continuar <ArrowRight size={17} />
          </button>
        </aside>
      </div>
    </main>
  );
}
function CoworkingConfigure() {
  const d = useDemoStore((s) => s.cowork);
  const set = useDemoStore((s) => s.setCowork);
  const router = useRouter();
  const room = rooms.find((r) => r.id === d.roomId);
  const rate = rates.find((r) => r.id === d.rateId);
  const [error, setError] = useState("");
  const minimum =
    d.rateId === "light" && d.period === "hour"
      ? (rates.find((item) => item.id === "light")?.minHours ?? 1)
      : 1;
  const quote = coworkingQuote(d.rateId, d.period, d.duration, d.people);
  const longTerm = d.period === "week" || d.period === "month";

  function next() {
    if (!d.rateId || !d.period || !d.duration || !d.date || !d.people) {
      setError("Completa tarifa, periodo, cantidad, fecha y personas.");
      return;
    }
    if (d.period === "hour" && !d.time) {
      setError("Indica la hora de inicio.");
      return;
    }
    if (d.duration < minimum) {
      setError(`La tarifa Light requiere un mínimo de ${minimum} horas.`);
      return;
    }
    if (d.people > (room?.capacity ?? 0)) {
      setError(`Este cuarto admite hasta ${room?.capacity} personas.`);
      return;
    }
    setError("");
    router.push("/coworking/revision");
  }

  function requestLongStay() {
    if (!room || !rate || !d.period || !d.date || !d.people || d.duration < 1)
      return;
    const periodName = periods.find((item) => item.id === d.period)?.name.toLowerCase();
    const message = [
      "Hola, quiero solicitar información para reservar coworking en Lunario.",
      "",
      `Espacio: ${room.name}`,
      `Capacidad: ${room.capacity} personas`,
      `Personas: ${d.people}`,
      `Tarifa: ${rate.name}`,
      `Periodo: ${d.duration} ${periodName}`,
      `Fecha deseada: ${d.date}`,
      "¿Me pueden confirmar disponibilidad y condiciones?",
    ].join("\n");
    window.open(
      `https://wa.me/527711811972?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <Guard valid={!!room} to="/coworking">
      <main>
        <StepHeader
          eyebrow="COWORKING / CONFIGURAR"
          title="Arma tu solicitud"
          description={`${room?.name ?? ""} · capacidad ${room?.capacity ?? ""} personas. La tarifa está sujeta a confirmación de Lunario.`}
          back="/coworking"
        />
        <div className="wrap cowork-config">
          <div>
            <h2>Elige una tarifa</h2>
            <div className="rate-grid">
              {rates.map((r) => (
                <button
                  key={r.id}
                  aria-pressed={d.rateId === r.id}
                  className={`rate-card ${d.rateId === r.id ? "selected" : ""}`}
                  onClick={() => {
                    const nextMinimum =
                      r.id === "light" && d.period === "hour"
                        ? (r.minHours ?? 1)
                        : 1;
                    set({
                      rateId: r.id,
                      duration: Math.max(nextMinimum, d.duration),
                    });
                  }}
                >
                  <span className="eyebrow">TARIFA</span>
                  <strong>{r.name}</strong>
                  <p>{r.includes}</p>
                  <small>Desde {formatMoney(r.prices.hour)} / hora</small>
                </button>
              ))}
            </div>
            <section className="form-panel cowork-fields">
              <fieldset className="duration-field">
                <legend>¿Cómo quieres reservar?</legend>
                <div className="period-options" role="group" aria-label="Periodo de coworking">
                  {periods.map((period) => (
                    <button
                      type="button"
                      key={period.id}
                      className={d.period === period.id ? "selected" : ""}
                      aria-pressed={d.period === period.id}
                      onClick={() => {
                        const nextMinimum =
                          d.rateId === "light" && period.id === "hour"
                            ? (rates.find((item) => item.id === "light")?.minHours ?? 1)
                            : 1;
                        set({
                          period: period.id,
                          duration:
                            d.period === period.id
                              ? Math.max(nextMinimum, d.duration)
                              : nextMinimum,
                          time: period.id === "hour" ? d.time : "",
                        });
                        setError("");
                      }}
                    >
                      <strong>
                        {period.id === "hour"
                          ? "Por hora"
                          : period.id === "day"
                            ? "Por día"
                            : period.name}
                      </strong>
                      <small>
                        {period.id === "week" || period.id === "month"
                          ? "Atención por WhatsApp"
                          : "Solicitud en línea"}
                      </small>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="field-grid">
                <label>
                  Cantidad
                  <input
                    type="number"
                    min={minimum}
                    step="1"
                    value={d.duration || ""}
                    onChange={(e) =>
                      set({
                        duration: Math.max(
                          minimum,
                          Math.floor(Number(e.target.value) || minimum),
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  <span className="field-label">
                    <CalendarDays size={16} /> Fecha deseada
                  </span>
                  <input
                    type="date"
                    value={d.date}
                    onChange={(e) => set({ date: e.target.value })}
                  />
                </label>
                {d.period === "hour" && (
                  <label>
                    <span className="field-label">
                      <Clock size={16} /> Hora de inicio
                    </span>
                    <input
                      type="time"
                      value={d.time}
                      onChange={(e) => set({ time: e.target.value })}
                    />
                  </label>
                )}
                <label>
                  <span className="field-label">
                    <Users size={16} /> Personas
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={room?.capacity}
                    step="1"
                    value={d.people || ""}
                    onChange={(e) =>
                      set({
                        people: Math.min(
                          room?.capacity ?? 10,
                          Math.max(0, Math.floor(Number(e.target.value) || 0)),
                        ),
                      })
                    }
                  />
                </label>
              </div>
              {d.rateId === "light" && d.period === "hour" && (
                <p className="info-note">
                  Renta mínima: {minimum} horas. Light por persona y hora:
                  1–4 personas $30; 5–10 $27; 11–16 $25.
                </p>
              )}
              {quote !== null && rate && d.period && (
                <div className="cowork-quote" aria-live="polite">
                  <span>
                    {rate.name} · {d.duration}{" "}
                    {d.period === "hour"
                      ? d.duration === 1 ? "hora" : "horas"
                      : d.duration === 1 ? "día" : "días"}
                    {d.period === "hour" && rate.id === "light"
                      ? ` · ${d.people} personas × ${formatMoney(hourlyCoworkRate(rate.id, d.people) ?? 0)}/persona/h`
                      : ""}
                  </span>
                  <strong>{formatMoney(quote)} de referencia</strong>
                  <small>Importe sujeto a confirmación de Lunario.</small>
                </div>
              )}
              {longTerm && (
                <p className="info-note">
                  Las solicitudes por semana o mes se atienden por WhatsApp. No
                  se confirma ni se cobra una reservación desde esta página.
                </p>
              )}
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              {longTerm ? (
                <button
                  className="btn dark"
                  disabled={!rate || !d.date || !d.people || d.duration < 1}
                  onClick={requestLongStay}
                >
                  Solicitar por WhatsApp <ArrowRight size={17} />
                </button>
              ) : (
                <button className="btn dark" onClick={next}>
                  Revisar solicitud <ArrowRight size={17} />
                </button>
              )}
            </section>
          </div>
          <aside className="review-side cowork-summary">
            <p className="eyebrow">REFERENCIA</p>
            <h2>{room?.name}</h2>
            <p className="muted">Capacidad: {room?.capacity} personas</p>
            {rate && d.period && (
              <ReviewList
                items={[
                  ["Tarifa", rate.name],
                  ["Periodo", periods.find((p) => p.id === d.period)?.name ?? ""],
                  [
                    "Cantidad",
                    `${d.duration} ${d.period === "hour" ? "horas" : d.period === "day" ? "días" : d.period === "week" ? "semanas" : "meses"}`,
                  ],
                  [
                    "Referencia",
                    quote === null ? "Solicitud por WhatsApp" : formatMoney(quote),
                  ],
                ]}
              />
            )}
            <p className="muted">
              Aplicación de tarifa sujeta a confirmación de Lunario.
            </p>
          </aside>
        </div>
      </main>
    </Guard>
  );
}
function CoworkingReview() {
  const d = useDemoStore((s) => s.cowork);
  const room = rooms.find((r) => r.id === d.roomId);
  const rate = rates.find((r) => r.id === d.rateId);
  const period = periods.find((p) => p.id === d.period);
  return (
    <Guard
      valid={
        !!(
          room &&
          rate &&
          period &&
          d.duration &&
          d.date &&
          (period.id !== "hour" || d.time) &&
          d.people &&
          d.people <= room.capacity &&
          period.id !== "week" &&
          period.id !== "month" &&
          (rate.id !== "light" || period.id !== "hour" || d.duration >= (rate.minHours ?? 1))
        )
      }
      to={room ? "/coworking/configurar" : "/coworking"}
    >
      <main>
        <StepHeader
          eyebrow="COWORKING / REVISIÓN"
          title="Revisa tu espacio"
          description="Revisa la referencia de tarifa y envía una solicitud sujeta a confirmación de Lunario."
          back="/coworking/configurar"
        />
        <div className="wrap review-layout">
          <div className="review-card">
            <h2>{room?.name}</h2>
            <ReviewList
              items={[
                ["Capacidad", `${room?.capacity} personas`],
                ["Tarifa", rate?.name ?? ""],
                ["Periodo", period?.name ?? ""],
                [
                  "Duración",
                  `${d.duration} ${d.duration > 1 ? ({ hour: "horas", day: "días", week: "semanas", month: "meses" } as const)[d.period ?? "hour"] : period?.name.toLowerCase()}`,
                ],
                ["Fecha", d.date],
                ...(d.period === "hour" ? [["Hora de inicio", d.time] as [string, string]] : []),
                ["Personas", String(d.people)],
                [
                  "Importe de referencia",
                  formatMoney(coworkingQuote(d.rateId, d.period, d.duration, d.people) ?? 0),
                ],
              ]}
              edits={{ Capacidad: { label: "Cambiar cuarto", href: "/coworking" }, Tarifa: { label: "Cambiar", href: "/coworking/configurar" }, Periodo: { label: "Cambiar", href: "/coworking/configurar" }, Duración: { label: "Cambiar", href: "/coworking/configurar" }, Fecha: { label: "Cambiar", href: "/coworking/configurar" }, "Hora de inicio": { label: "Cambiar", href: "/coworking/configurar" }, Personas: { label: "Cambiar", href: "/coworking/configurar" }}}
            />
            {rate?.id === "light" && (
              <p className="info-note">
                Light: renta mínima de 3 horas. Tarifa por persona por hora: 1–4
                $30, 5–10 $27, 11–16 $25.
              </p>
            )}
          </div>
          <aside className="review-side">
            <p className="eyebrow">CONFIRMACIÓN PENDIENTE</p>
            <h2>Todo listo para solicitar.</h2>
            <p className="muted">
              Esta referencia no confirma disponibilidad ni procesa un cobro.
            </p>
            <ReviewActions kind="coworking" />
          </aside>
        </div>
      </main>
    </Guard>
  );
}
function requestReceiptSummary(req: DemoRequest): ReceiptSummary | null {
  if (!canPayRequest(req.kind)) return null;
  if (req.kind === "order") {
    const snapshot = req.snapshot as {
      mode: "dineIn" | "pickup" | null;
      cart: CartItem[];
    };
    const lineItems = (snapshot.cart ?? []).flatMap((item) => {
      const product = productById(item.productId);
      if (!product) return [];
      const labels = selectedLabels(product, item.selections);
      return [{
        description: `${item.quantity} × ${product.name}${labels ? ` · ${labels}` : ""}`,
        quantity: item.quantity,
        total: unitPrice(product, item.selections) * item.quantity,
      }];
    });
    const total = lineItems.reduce((sum, item) => sum + item.total, 0);
    return {
      operation: snapshot.mode === "pickup" ? "Pedido para recoger" : "Pedido en Lunario",
      lineItems,
      subtotal: total,
      total,
    };
  }

  const draft = req.snapshot as CoworkDraft;
  const room = rooms.find((item) => item.id === draft.roomId);
  const rate = rates.find((item) => item.id === draft.rateId);
  const unit = draft.period === "hour" ? "horas" : "días";
  const total = coworkingQuote(
    draft.rateId,
    draft.period,
    draft.duration,
    draft.people,
  ) ?? 0;
  return {
    operation: "Coworking",
    lineItems: [{
      description: `${room?.name ?? "Espacio de coworking"} · ${rate?.name ?? "Tarifa"} · ${draft.duration} ${unit} · ${draft.people} ${draft.people === 1 ? "persona" : "personas"}`,
      quantity: draft.duration,
      total,
    }],
    subtotal: total,
    total,
  };
}

function RequestView() {
  const req = useDemoStore((s) => s.request);
  const advance = useDemoStore((s) => s.advanceRequest);
  const payment = useDemoStore((s) => s.selectPayment);
  const completePayment = useDemoStore((s) => s.completePayment);
  const accessMode = useDemoStore((s) => s.accessMode);
  const payable = req ? canPayRequest(req.kind) : false;
  const paymentMethods = req
    ? availablePaymentMethods(req.kind, req.accessMode ?? accessMode)
    : [];
  const summary = req ? requestReceiptSummary(req) : null;
  const target =
    req?.kind === "order"
      ? "/pedido"
      : req?.kind === "tableReservation"
        ? "/reservar"
        : "/coworking";
  return (
    <Guard valid={!!req} to={target ?? "/"}>
      <main className="request-page">
        <div className="wrap request-center">
          <span className="demo-badge">ESTADO DE DEMOSTRACIÓN</span>
          <ol className="request-progress" aria-label="Estado de solicitud">
            {["Enviada", "Pendiente", "Confirmada"].map((label, i) => (
              <li
                key={label}
                className={
                  i <=
                  ["submitted", "pending", "confirmed"].indexOf(
                    req?.status ?? "",
                  )
                    ? "complete"
                    : ""
                }
              >
                <span>{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="request-mark">
            <Check size={36} />
          </div>
          <p className="eyebrow">
            {req?.kind === "order"
              ? "PEDIDO"
              : req?.kind === "tableReservation"
                ? "RESERVA DE MESA"
                : "COWORKING"}
          </p>
          <h1>
            {req?.status === "submitted"
              ? "Solicitud enviada"
              : req?.status === "pending"
                ? "Pendiente de confirmación"
                : "Solicitud confirmada"}
          </h1>
          <p className="muted lead">
            {req?.status === "submitted"
              ? "Tu solicitud se ha creado solo en esta demo."
              : req?.status === "pending"
                ? "Lunario aún tendría que confirmar esta solicitud."
                : "Confirmación simulada para mostrar el siguiente paso."}
          </p>
          {req?.status === "submitted" && (
            <button className="btn dark" onClick={advance}>
              Continuar demostración <ArrowRight size={17} />
            </button>
          )}
          {req?.status === "pending" && (
            <button className="btn dark" onClick={advance}>
              Simular confirmación <ArrowRight size={17} />
            </button>
          )}
          {req?.status === "confirmed" && payable && !req.receipt && (
            <div className="payment-panel">
              <h2>Opciones de pago</h2>
              <p className="muted">
                Elige cómo completar esta demostración. No se procesan cobros.
              </p>
              <div className="payment-options">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    className={req.paymentSelection === method ? "selected" : ""}
                    aria-pressed={req.paymentSelection === method}
                    onClick={() => summary && payment(method, summary)}
                  >
                    {method === "cash" ? <Banknote /> : <CreditCard />}
                    {method === "apple-pay"
                      ? "Apple Pay"
                      : method === "card"
                        ? "Tarjeta"
                        : "Efectivo"}
                  </button>
                ))}
              </div>
              {(req.accessMode ?? accessMode) !== "google-demo" &&
                (req.accessMode ?? accessMode) !== "email-demo" && (
                <p className="info-note">
                  Inicia sesión para pagar con tarjeta o Apple Pay.
                </p>
              )}
              {req.paymentSelection && req.paymentSelection !== "cash" && (
                <button
                  className="btn dark payment-complete"
                  onClick={() => summary && completePayment(summary)}
                >
                  Simular pago con {req.paymentSelection === "card" ? "tarjeta" : "Apple Pay"}
                  <ArrowRight size={17} />
                </button>
              )}
              {req.paymentSelection && req.paymentSelection !== "cash" && (
                <p className="payment-selected">
                  <Check size={17} /> Método seleccionado para la simulación
                </p>
              )}
              <p className="info-note">
                Tarjeta y Apple Pay son simulaciones frontend.
              </p>
            </div>
          )}
          {req?.receipt && <Receipt receipt={req.receipt} />}
          <Link className="back-link" href="/">
            Volver al inicio
          </Link>
        </div>
      </main>
    </Guard>
  );
}
export default function DemoApp() {
  const path = usePathname();
  const routePath = path !== "/" ? path.replace(/\/+$/, "") : path;
  const ready = useHydrated();
  const routes: Record<string, React.ReactNode> = {
    "/": <Home />,
    "/menu": <MenuView />,
    "/pedido": <ChoicePage />,
    "/pedido/recoger-hora": <PickupTimePage />,
    "/pedido/mesa": <OrderTable />,
    "/pedido/revision": <OrderReview />,
    "/reservar": <ReservationStart />,
    "/reservar/mesa": <ReservationTable />,
    "/reservar/revision": <ReservationReview />,
    "/coworking": <CoworkingStart />,
    "/coworking/configurar": <CoworkingConfigure />,
    "/coworking/revision": <CoworkingReview />,
    "/solicitud": <RequestView />,
  };
  if (!ready)
    return (
      <div className="startup">
        <Image
          src="/brand/lunario-isotipo.svg"
          alt="Lunario Café"
          width={68}
          height={68}
          priority
        />
      </div>
    );
  return (
    <>
      <Header />
      {routes[routePath] ?? (
        <main className="wrap not-found">
          <h1>Página no encontrada</h1>
          <Link className="btn dark" href="/">
            Volver al inicio
          </Link>
        </main>
      )}
      <Footer />
    </>
  );
}
