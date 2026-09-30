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
  periods,
  rates,
  rooms,
} from "@/data/coworking";
import { availablePaymentMethods, canUsePayment, paymentMethods } from "@/data/payment";
import DemoReceipt from "./DemoReceipt";
import {
  useDemoStore,
  type CartItem,
  type RequestKind,
} from "@/store/demo";
import Floorplan from "@/features/floorplans/Floorplan";

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
        ? ["Modalidad", "Tu pedido", "Revisión"]
        : [];
  const current = path.endsWith("revision")
    ? 2
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
  const cart = useDemoStore((s) => s.cart);
  const orderMode = useDemoStore((s) => s.orderMode);
  const count = cart.reduce((n, item) => n + item.quantity, 0);
  const showCart =
    count > 0 &&
    (path === "/" || path.startsWith("/menu") || path.startsWith("/pedido"));
  const [toast, setToast] = useState("");
  const [orderReviewActionOpen, setOrderReviewActionOpen] = useState(false);
  const isOrderReview = path.replace(/\/+$/, "") === "/pedido/revision";
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const notify = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      setToast(
        action === "added" ? "Agregado al pedido" : "Pedido actualizado",
      );
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
  const [menu, setMenu] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    if (path !== "/") return;
    const update = () =>
      setPastHero(window.scrollY > Math.max(300, window.innerHeight * 0.7));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [path]);
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => setMenu(false), [path]);
  return (
    <>
      <header
        className={`site-header ${path === "/" ? "home-header" : ""} ${path === "/" && !pastHero ? "on-hero" : ""}`}
      >
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
              <span
                className={`menu-icon ${menu ? "is-open" : ""}`}
                aria-hidden="true"
              >
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
          onClick={() =>
            isOrderReview ? setOrderReviewActionOpen(true) : setCartOpen(true)
          }
          aria-label={`${isOrderReview ? "Enviar solicitud" : "Ver pedido"}, ${count} ${count === 1 ? "producto" : "productos"}, ${formatMoney(cartTotal(cart))}`}
        >
          <span className="cart-icon">
            <ShoppingBag size={20} />
            <b key={count}>{count}</b>
          </span>
          <span>
            <small>
              {orderMode === "pickup" ? "Para recoger" : "Tu pedido"}
            </small>
            <strong>{formatMoney(cartTotal(cart))}</strong>

          </span>
          <span className="cart-cta">
            {isOrderReview ? "Enviar solicitud" : "Ver pedido"}{" "}
            <ArrowRight size={18} />
          </span>
        </button>
      )}
      {orderReviewActionOpen && (
        <AccessDialog
          kind="order"
          onClose={() => setOrderReviewActionOpen(false)}
        />
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
    <main>
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
            Buen café para
            <br />
            <em>grandes ideas.</em>
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
        <div className="hero-side">LUNARIO CAFÉ / DEMO V1</div>
      </section>
      <section className="wrap home-actions">
        <div className="section-intro">
          <p className="eyebrow">ELIGE TU MOMENTO</p>
          <h2>¿Qué te trae hoy?</h2>
        </div>
        <div className="action-grid">
          <Link href="/pedido" className="action-card">
            <span>01</span>
            <h3>Pedir</h3>
            <p>Para disfrutar aquí o recoger.</p>
            <ArrowRight />
          </Link>
          <Link href="/reservar" className="action-card">
            <span>02</span>
            <h3>Reservar mesa</h3>
            <p>Elige tu fecha y una mesa en el plano.</p>
            <ArrowRight />
          </Link>
          <Link href="/coworking" className="action-card">
            <span>03</span>
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
            {["latte", "chilaquiles", "crepa-dulce-8"].map((id) => {
              const product = productById(id)!;
              return <div key={id}>
                <small>{categories.find((category) => category.id === product.categoryId)?.name}</small>
                <strong>{product.name}</strong>
                <span>{product.pricingType === "variant" ? "Desde " : ""}{formatMoney(startingPrice(product))}</span>
              </div>;
            })}
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
    </main>
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
  const cart = useDemoStore((s) => s.cart);
  const [active, setActive] = useState<string>("cafe");
  const visible = products.filter((p) => p.enabledInDemo && p.categoryId === active);
  const [open, setOpen] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <main>
      <StepHeader
        eyebrow="MENÚ LUNARIO"
        title="La carta"
        description="Sabores para quedarte un poco más."
      />
      <div className="category-strip">
        <nav className="wrap category-inner" aria-label="Categorías del menú">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={(e) => {
                setActive(c.id);
                e.currentTarget.scrollIntoView({
                  block: "nearest",
                  inline: "center",
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                });
              }}
              className={active === c.id ? "active" : ""}
              aria-current={active === c.id ? "true" : undefined}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="wrap menu-content">
        <div className="menu-topline">
          <div>
            <h2 className="eyebrow">
              {categories.find((c) => c.id === active)?.name}
            </h2>
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
            No encontramos productos. Elige otra categoría.
          </p>
        )}
        {(active === "bebidas"
          ? ["Matcha", "Lattes saborizados", "Otras bebidas"]
          : [""]
        ).map((section) => (
          <section key={section} className="menu-family">
            {section && <h3>{section}</h3>}
            <div className="product-grid">
              {visible.filter((p) => !section || (p.menuSection ?? "Otras bebidas") === section).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  transactionalMode={!!mode}
                  onOpen={setOpen}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {open && (
        <ProductConfigurator product={open} onClose={() => setOpen(null)} />
      )}{" "}
      {cartOpen && <CartDialog onClose={() => setCartOpen(false)} />}
    </main>
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
  const router = useRouter();
  const [editing, setEditing] = useState<CartItem | null>(null);
  const editProduct = editing && productById(editing.productId);
  return (
    <>
      <Dialog title="Carrito" onClose={onClose} className="cart-dialog">
        <p className="eyebrow">TU PEDIDO</p>
        <h2>Carrito</h2>
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
                  router.push(!orderMode ? "/pedido" : orderMode === "dineIn" && !useDemoStore.getState().orderTableId ? "/pedido/mesa" : "/pedido/revision");
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
            set("pickup");
            router.push("/menu");
          }}
        >
          <span className="icon-holder sage">
            <PackageCheck />
          </span>
          <h2>Para recoger</h2>
          <p>Explora el menú y prepara tu pedido.</p>
          <span className="choice-arrow">
            <ArrowRight />
          </span>
        </button>
      </div>
    </main>
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
  const [missing, setMissing] = useState<"date" | "time" | "people" | null>(
    null,
  );
  function next() {
    const field = !draft.date
      ? "date"
      : !draft.time
        ? "time"
        : !draft.people
          ? "people"
          : null;
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
              onChange={(e) => {
                set({ date: e.target.value });
                setMissing(null);
              }}
            />
            {missing === "date" && (
              <span className="field-error" role="alert">
                Selecciona una fecha.
              </span>
            )}
          </label>
          <label>
            <span className="field-label">
              <Clock size={16} /> Hora
            </span>
            <input
              type="time"
              value={draft.time}
              aria-invalid={missing === "time"}
              onChange={(e) => {
                set({ time: e.target.value });
                setMissing(null);
              }}
            />
            {missing === "time" && (
              <span className="field-error" role="alert">
                Selecciona una hora.
              </span>
            )}
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
              onChange={(e) => {
                set({
                  people: Math.max(0, Math.floor(Number(e.target.value))),
                });
                setMissing(null);
              }}
              placeholder="Número de personas"
            />
            {missing === "people" && (
              <span className="field-error" role="alert">
                Indica cuántas personas asistirán.
              </span>
            )}
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
  return (
    <Guard
      valid={!!(mode && cart.length && (mode === "pickup" || table))}
      to={
        !cart.length
          ? "/menu"
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
            {mode === "pickup" && <ReviewList items={[["Modalidad", "Para recoger"]]} edits={{ Modalidad: { label: "Cambiar", href: "/pedido" } }} />}
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
            <div className="order-review-submit">
              <ReviewActions kind="order" />
            </div>
          </aside>
        </div>
      </main>
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
                readOnly
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
          onSelect={(id) => {
            const nextRoom = rooms.find((r) => r.id === id);
            set({
              roomId: id,
              people: nextRoom && d.people <= nextRoom.capacity ? d.people : 0,
            });
          }}
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
                onClick={() =>
                  set({
                    roomId: r.id,
                    people: d.people <= r.capacity ? d.people : 0,
                  })
                }
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const minimum =
    d.rateId === "light" && d.period === "hour"
      ? (rates.find((item) => item.id === "light")?.minHours ?? 1)
      : 1;
  const reference = rate && d.period ? rate.prices[d.period] : null;

  function next() {
    const missing: Record<string, string> = {};
    if (!d.rateId) missing.rate = "Elige una tarifa.";
    if (!d.period) missing.period = "Elige un periodo.";
    if (d.duration < minimum) missing.duration = `Indica al menos ${minimum} ${minimum === 1 ? "unidad" : "horas"}.`;
    if (!d.date) missing.date = "Selecciona una fecha.";
    if (!d.time) missing.time = "Indica la hora de inicio.";
    if (!d.people) missing.people = "Indica cuántas personas asistirán.";
    else if (d.people > (room?.capacity ?? 0)) missing.people = `Este cuarto admite hasta ${room?.capacity} personas.`;
    setErrors(missing);
    if (Object.keys(missing).length) return;
    router.push("/coworking/revision");
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
            <div className="rate-grid" aria-describedby={errors.rate ? "cowork-rate-error" : undefined}>
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
                  <small>{formatMoney(r.prices.hour)} / hora · tarifa publicada</small>
                </button>
              ))}
            </div>
            {errors.rate && <p id="cowork-rate-error" className="field-error" role="alert">{errors.rate}</p>}
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
                        });
                        setErrors({});
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
                        Solicitud de demostración
                      </small>
                    </button>
                  ))}
                </div>
                {errors.period && <p className="field-error" role="alert">{errors.period}</p>}
              </fieldset>
              <div className="field-grid">
                <label>
                  Cantidad
                  <input
                    type="number"
                    min={minimum}
                    step="1"
                    value={d.duration || ""}
                    aria-invalid={!!errors.duration}
                    aria-describedby={errors.duration ? "cowork-duration-error" : undefined}
                    onChange={(e) =>
                      set({
                        duration: Math.max(
                          minimum,
                          Math.floor(Number(e.target.value) || minimum),
                        ),
                      })
                    }
                  />
                  {errors.duration && <span id="cowork-duration-error" className="field-error" role="alert">{errors.duration}</span>}
                </label>
                <label>
                  <span className="field-label">
                    <CalendarDays size={16} /> Fecha deseada
                  </span>
                  <input
                    type="date"
                    value={d.date}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "cowork-date-error" : undefined}
                    onChange={(e) => set({ date: e.target.value })}
                  />
                  {errors.date && <span id="cowork-date-error" className="field-error" role="alert">{errors.date}</span>}
                </label>
                <label>
                    <span className="field-label">
                      <Clock size={16} /> Hora de inicio
                    </span>
                    <input
                      type="time"
                      value={d.time}
                      aria-invalid={!!errors.time}
                      aria-describedby={errors.time ? "cowork-time-error" : undefined}
                      onChange={(e) => set({ time: e.target.value })}
                    />
                    {errors.time && <span id="cowork-time-error" className="field-error" role="alert">{errors.time}</span>}
                </label>
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
                    aria-invalid={!!errors.people}
                    aria-describedby={errors.people ? "cowork-people-error" : undefined}
                    onChange={(e) =>
                      set({
                        people: Math.min(
                          room?.capacity ?? 10,
                          Math.max(0, Math.floor(Number(e.target.value) || 0)),
                        ),
                      })
                    }
                  />
                  {errors.people && <span id="cowork-people-error" className="field-error" role="alert">{errors.people}</span>}
                </label>
              </div>
              {rate?.id === "light" && <p className="info-note">
                Renta mínima: {rate.minHours} horas. Light por persona y hora: {rate.perPersonHourlyTiers.map((tier) => `${tier.people} personas ${formatMoney(tier.price)}`).join("; ")}.
              </p>}
              {reference !== null && rate && d.period && (
                <div className="cowork-quote" aria-live="polite">
                  <span>{rate.name} · {periods.find((period) => period.id === d.period)?.name}</span>
                  <strong>{formatMoney(reference)} · tarifa publicada</strong>
                  <small>Aplicación de tarifa sujeta a confirmación de Lunario.</small>
                </div>
              )}
              <button className="btn dark" onClick={next}>
                Revisar solicitud <ArrowRight size={17} />
              </button>
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
                    reference === null ? "Elige una tarifa y un periodo" : formatMoney(reference),
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
          d.time &&
          d.people &&
          d.people <= room.capacity &&
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
                ["Hora de inicio", d.time],
                ["Personas", String(d.people)],
                [
                  "Tarifa publicada",
                  rate && d.period ? formatMoney(rate.prices[d.period]) : "",
                ],
              ]}
              edits={{ Capacidad: { label: "Cambiar cuarto", href: "/coworking" }, Tarifa: { label: "Cambiar", href: "/coworking/configurar" }, Periodo: { label: "Cambiar", href: "/coworking/configurar" }, Duración: { label: "Cambiar", href: "/coworking/configurar" }, Fecha: { label: "Cambiar", href: "/coworking/configurar" }, "Hora de inicio": { label: "Cambiar", href: "/coworking/configurar" }, Personas: { label: "Cambiar", href: "/coworking/configurar" }}}
            />
            {rate?.id === "light" && (
              <p className="info-note">
                Light: renta mínima de {rate.minHours} horas. Tarifa por persona por hora: {rate.perPersonHourlyTiers.map((tier) => `${tier.people} personas ${formatMoney(tier.price)}`).join("; ")}.
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
function RequestView() {
  const router = useRouter();
  const [startingNew, setStartingNew] = useState(false);
  const req = useDemoStore((s) => s.request);
  const advance = useDemoStore((s) => s.advanceRequest);
  const payment = useDemoStore((s) => s.selectPayment);
  const completePayment = useDemoStore((s) => s.completePayment);
  const reset = useDemoStore((s) => s.resetFlow);
  const target =
    req?.kind === "order"
      ? "/pedido"
      : req?.kind === "tableReservation"
        ? "/reservar"
        : req?.kind === "coworking" ? "/coworking" : "/";
  return (
    <Guard valid={!!req || startingNew} to={target ?? "/"}>
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
          {req?.status === "confirmed" && (
            <div className="payment-panel">
              <h2>Opciones de pago</h2>
              <p className="muted">Así podría continuar la experiencia después de la confirmación.</p>
              <div className="payment-options">
                {availablePaymentMethods(req.accessMode).map(({ id, label }) => (
                  <button key={id} className={req.paymentSelection === id ? "selected" : ""}
                    aria-pressed={req.paymentSelection === id} onClick={() => payment(id)}>
                    {id === "cash" ? <Banknote /> : <CreditCard />}{label}
                  </button>
                ))}
              </div>
              {req.paymentSelection && canUsePayment(req.accessMode, req.paymentSelection) && <p className="payment-selected" role="status">
                <Check size={17} /> {paymentMethods.find((method) => method.id === req.paymentSelection)?.label} seleccionado para la demostración.
              </p>}
              <p className="info-note">Demostración visual. No se realizará ningún cobro.</p>
              {req.paymentSelection && canUsePayment(req.accessMode, req.paymentSelection) && !req.paymentCompleted && <button className="btn dark" onClick={completePayment}>Finalizar demostración <Check size={17} /></button>}
            </div>
          )}
          {req?.status === "confirmed" && req.paymentCompleted && <DemoReceipt request={req} />}
          <Link className="back-link" href="/">
            Volver al inicio
          </Link>
          {req?.status === "confirmed" && <button className="btn dark" onClick={() => {
            setStartingNew(true);
            reset(req.kind);
            router.push(target);
          }}>{req.kind === "order" ? "Nuevo pedido" : req.kind === "tableReservation" ? "Nueva reserva" : "Nueva solicitud de coworking"}</button>}
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
