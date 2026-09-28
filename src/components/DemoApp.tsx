"use client";
import { useEffect, useRef, useState } from "react";
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
  RotateCcw,
  CreditCard,
  Banknote,
} from "lucide-react";
import {
  categories,
  formatMoney,
  products,
  startingPrice,
  unitPrice,
  type Product,
} from "@/data/menu";
import { periods, rates, rooms, type Period } from "@/data/coworking";
import { useDemoStore, type CartItem, type RequestKind } from "@/store/demo";

const productById = (id: string) => products.find((p) => p.id === id);
const selectedLabels = (p: Product, selections: Record<string, string>) =>
  p.optionGroups
    .map((g) => g.options.find((o) => o.id === selections[g.id])?.label)
    .filter(Boolean)
    .join(" · ");
const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => {
    const p = productById(item.productId);
    return sum + (p ? unitPrice(p, item.selections) * item.quantity : 0);
  }, 0);
const makeLineId = () => crypto.randomUUID();
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
  return (
    <div className="step-header wrap">
      {back && <GoBack href={back} />}
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="muted lead">{description}</p>}
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
  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement;
    const root = ref.current;
    root
      ?.querySelector<HTMLElement>('button, input, a, [tabindex="0"]')
      ?.focus();
    const key = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll(".dialog");
      if (dialogs[dialogs.length - 1] !== root) return;
      if (e.key === "Escape") onClose();
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
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      returnTo.current?.focus();
    };
  }, [onClose]);
  return (
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
    </div>
  );
}
function Header() {
  const path = usePathname();
  const cart = useDemoStore((s) => s.cart);
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
                aria-label={`Abrir carrito, ${cart.length} productos`}
                className="icon-btn"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={22} />
                <span className="cart-badge">{cart.length}</span>
              </button>
            )}
            <button
              className="icon-btn"
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <MenuIcon />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav" aria-label="Menú móvil">
            <Link href="/">Inicio</Link>
            <Link href="/menu">Menú</Link>
            <Link href="/reservar">Reservar</Link>
            <Link href="/coworking">Coworking</Link>
            <Link href="/pedido">Pedir</Link>
          </nav>
        )}
      </header>
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
  return (
    <article className="product-card">
      <div>
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
        <button className="text-action" onClick={() => onOpen(product)}>
          {transactionalMode ? "Ver opciones" : "Ver detalle"}{" "}
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}
function MenuView() {
  const mode = useDemoStore((s) => s.orderMode);
  const cart = useDemoStore((s) => s.cart);
  const [active, setActive] = useState<string>("cafe");
  const [open, setOpen] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <>
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
              onClick={() => setActive(c.id)}
              className={active === c.id ? "active" : ""}
              aria-current={active === c.id ? "true" : undefined}
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
              {categories.find((c) => c.id === active)?.name}
            </p>
            <p className="muted">Precios en pesos mexicanos.</p>
          </div>
          {cart.length > 0 && (
            <button className="btn dark" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={17} /> Carrito · {formatMoney(cartTotal(cart))}
            </button>
          )}
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.categoryId === active && p.enabledInDemo)
            .map((p) => (
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
  const [error, setError] = useState("");
  const price = unitPrice(product, selections);
  function commit() {
    const missing = product.optionGroups.find(
      (g) => g.required && !selections[g.id],
    );
    if (missing) {
      setError(`Elige ${missing.label.toLowerCase()}.`);
      return;
    }
    if (!mode && !editing) {
      onClose();
      router.push("/pedido");
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
    onClose();
  }
  return (
    <Dialog title={product.name} onClose={onClose} className="product-dialog">
      <p className="eyebrow">LUNARIO CAFÉ</p>
      <h2>{product.name}</h2>
      {product.description && <p className="muted">{product.description}</p>}
      <div className="config-options">
        {product.optionGroups.map((g) => (
          <fieldset key={g.id}>
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
                        setError("");
                      }}
                    />
                    <span>{o.label}</span>
                    {o.priceMode !== "none" && (
                      <strong>
                        {o.priceMode === "delta" && "+"}
                        {formatMoney(o.price)}
                      </strong>
                    )}
                  </label>
                ))}
            </div>
          </fieldset>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
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
              ? "Agregar al carrito"
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
            <button className="btn dark" onClick={onClose}>
              Volver al menú
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
                          Editar
                        </button>
                        <button
                          className="text-action"
                          onClick={() => remove(item.lineId)}
                        >
                          Eliminar
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
                  router.push("/pedido/revision");
                }}
              >
                Revisar pedido <ArrowRight size={16} />
              </button>
              <button className="text-action" onClick={onClose}>
                Volver al menú
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
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinch = useRef<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const source =
    kind === "table"
      ? "/floorplans/planta-baja.svg"
      : "/floorplans/segundo-piso.svg";
  const zones = kind === "table" ? tables : roomZones;
  function clamp(z: number, x: number, y: number) {
    const el = stage.current;
    if (!el) return { x: 0, y: 0 };
    const w = el.clientWidth,
      h = el.clientHeight;
    return {
      x: Math.min(0, Math.max(w - w * z, x)),
      y: Math.min(0, Math.max(h - h * z, y)),
    };
  }
  function changeZoom(next: number) {
    const z = Math.min(2.5, Math.max(1, next));
    setZoom(z);
    setPan((p) => clamp(z, p.x, p.y));
  }
  function onMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const vals = [...pointers.current.values()];
    if (vals.length === 2) {
      const dist = Math.hypot(vals[0].x - vals[1].x, vals[0].y - vals[1].y);
      if (lastPinch.current) {
        const next = Math.min(
          2.5,
          Math.max(1, (zoom * dist) / lastPinch.current),
        );
        setZoom(next);
        setPan((p) => clamp(next, p.x, p.y));
      }
      lastPinch.current = dist;
    } else if (vals.length === 1 && zoom > 1) {
      setPan((p) =>
        clamp(zoom, p.x + e.clientX - prev.x, p.y + e.clientY - prev.y),
      );
    }
  }
  function onEnd(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    lastPinch.current = null;
  }
  return (
    <div className="plan-shell">
      <div className="plan-toolbar" aria-label="Controles del plano">
        <button
          aria-label="Acercar plano"
          onClick={() => changeZoom(zoom + 0.25)}
        >
          <Plus size={18} />
        </button>
        <button
          aria-label="Alejar plano"
          onClick={() => changeZoom(zoom - 0.25)}
        >
          <Minus size={18} />
        </button>
        <button
          aria-label="Restablecer plano"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <div
        className="plan-stage"
        ref={stage}
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }}
        onPointerMove={onMove}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
      >
        <div
          className="plan-scaled"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
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
                onClick={() => onSelect(z.id)}
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
        <div className="table-options">
          <p className="eyebrow">ELEGIR POR UBICACIÓN</p>
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
        </div>
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
  const request = useDemoStore((s) => s.request);
  const reset = useDemoStore((s) => s.resetFlow);
  useEffect(() => {
    if (request?.kind === "order" && request.status === "confirmed") reset("order");
  }, [request, reset]);
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
          <span className="choice-num">01</span>
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
          <span className="choice-num">02</span>
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
  const request = useDemoStore((s) => s.request);
  const reset = useDemoStore((s) => s.resetFlow);
  useEffect(() => {
    if (request?.kind === "tableReservation" && request.status === "confirmed")
      reset("tableReservation");
  }, [request, reset]);
  const router = useRouter();
  const [error, setError] = useState("");
  function next() {
    if (!draft.date || !draft.time || !draft.people) {
      setError("Completa fecha, hora y personas.");
      return;
    }
    setError("");
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
            Fecha
            <input
              type="date"
              value={draft.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </label>
          <label>
            Hora
            <input
              type="time"
              value={draft.time}
              onChange={(e) => set({ time: e.target.value })}
            />
          </label>
          <label>
            Personas
            <input
              type="number"
              min="1"
              step="1"
              value={draft.people || ""}
              onChange={(e) =>
                set({ people: Math.max(0, Number(e.target.value)) })
              }
              placeholder="Número de personas"
            />
          </label>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
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
function ReviewList({ items }: { items: [string, string][] }) {
  return (
    <dl className="review-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
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
            <ReviewList
              items={[
                [
                  "Modalidad",
                  mode === "dineIn" ? "En Lunario" : "Para recoger",
                ],
                ...(mode === "dineIn"
                  ? [["Mesa", "Mesa seleccionada"] as [string, string]]
                  : []),
              ]}
            />
            <p className="muted">La solicitud no realiza un pedido real.</p>
            <ReviewActions kind="order" />
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
  const request = useDemoStore((s) => s.request);
  const reset = useDemoStore((s) => s.resetFlow);
  useEffect(() => {
    if (request?.kind === "coworking" && request.status === "confirmed")
      reset("coworking");
  }, [request, reset]);
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
          onSelect={(id) => set({ roomId: id, people: 0 })}
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
                className={d.roomId === r.id ? "selected" : ""}
                onClick={() => set({ roomId: r.id, people: 0 })}
              >
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
  function next() {
    if (
      !d.rateId ||
      !d.period ||
      !d.duration ||
      !d.date ||
      !d.time ||
      !d.people
    ) {
      setError("Completa tarifa, duración, fecha, hora y personas.");
      return;
    }
    if (d.rateId === "light" && d.period === "hour" && d.duration < 3) {
      setError("La tarifa Light requiere un mínimo de 3 horas.");
      return;
    }
    setError("");
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
            <div className="rate-grid">
              {rates.map((r) => (
                <button
                  key={r.id}
                  className={`rate-card ${d.rateId === r.id ? "selected" : ""}`}
                  onClick={() =>
                    set({
                      rateId: r.id,
                      duration:
                        r.id === "light" && d.period === "hour"
                          ? Math.max(3, d.duration)
                          : d.duration,
                    })
                  }
                >
                  <span className="eyebrow">TARIFA</span>
                  <strong>{r.name}</strong>
                  <p>{r.includes}</p>
                  <small>Desde {formatMoney(r.prices.hour)} / hora</small>
                </button>
              ))}
            </div>
            <div className="form-panel cowork-fields">
              <div className="field-grid">
                <label>
                  Periodo
                  <select
                    value={d.period ?? ""}
                    onChange={(e) => {
                      const period = e.target.value as Period;
                      set({
                        period,
                        duration:
                          d.rateId === "light" && period === "hour"
                            ? Math.max(3, d.duration)
                            : d.duration,
                      });
                    }}
                  >
                    <option value="">Selecciona un periodo</option>
                    {periods.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Duración
                  <input
                    type="number"
                    min={d.rateId === "light" && d.period === "hour" ? 3 : 1}
                    step="1"
                    value={d.duration || ""}
                    onChange={(e) =>
                      set({ duration: Math.max(0, Number(e.target.value)) })
                    }
                  />
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={d.date}
                    onChange={(e) => set({ date: e.target.value })}
                  />
                </label>
                <label>
                  Hora
                  <input
                    type="time"
                    value={d.time}
                    onChange={(e) => set({ time: e.target.value })}
                  />
                </label>
                <label>
                  Personas
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
                          Math.max(0, Number(e.target.value)),
                        ),
                      })
                    }
                  />
                </label>
              </div>
              {d.rateId === "light" && d.period === "hour" && (
                <p className="info-note">
                  Renta mínima: 3 horas. Tarifa por persona publicada: 1–4
                  personas $30; 5–10 $27; 11–16 $25.
                </p>
              )}
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn dark" onClick={next}>
                Revisar solicitud <ArrowRight size={17} />
              </button>
            </div>
          </div>
          <aside className="review-side cowork-summary">
            <p className="eyebrow">REFERENCIA</p>
            <h2>{room?.name}</h2>
            <p className="muted">Capacidad: {room?.capacity} personas</p>
            {rate && d.period && (
              <ReviewList
                items={[
                  ["Tarifa", rate.name],
                  [
                    "Periodo",
                    periods.find((p) => p.id === d.period)?.name ?? "",
                  ],
                  ["Tarifa publicada", formatMoney(rate.prices[d.period])],
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
          (rate.id !== "light" || period.id !== "hour" || d.duration >= 3)
        )
      }
      to={room ? "/coworking/configurar" : "/coworking"}
    >
      <main>
        <StepHeader
          eyebrow="COWORKING / REVISIÓN"
          title="Revisa tu espacio"
          description="Esta es una solicitud. Lunario confirmaría su aplicación y condiciones."
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
                ["Hora", d.time],
                ["Personas", String(d.people)],
                [
                  "Tarifa publicada",
                  rate && d.period ? formatMoney(rate.prices[d.period]) : "",
                ],
              ]}
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
              Aplicación de tarifa sujeta a confirmación de Lunario. No se
              calcula un total definitivo ni se realiza un cobro.
            </p>
            <ReviewActions kind="coworking" />
          </aside>
        </div>
      </main>
    </Guard>
  );
}
function RequestView() {
  const req = useDemoStore((s) => s.request);
  const advance = useDemoStore((s) => s.advanceRequest);
  const payment = useDemoStore((s) => s.selectPayment);
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
              <p className="muted">
                Así podría continuar la experiencia después de confirmar.
              </p>
              <div className="payment-options">
                <button
                  className={req.paymentSelection === "card" ? "selected" : ""}
                  onClick={() => payment("card")}
                >
                  <CreditCard />
                  Tarjeta
                </button>
                <button
                  className={
                    req.paymentSelection === "apple-pay" ? "selected" : ""
                  }
                  onClick={() => payment("apple-pay")}
                >
                  <span className="apple-mark">●</span>Apple Pay
                </button>
                <button
                  className={req.paymentSelection === "cash" ? "selected" : ""}
                  onClick={() => payment("cash")}
                >
                  <Banknote />
                  Efectivo
                </button>
              </div>
              {req.paymentSelection && (
                <p className="payment-selected">
                  <Check size={17} /> Opción visual seleccionada
                </p>
              )}
              <p className="info-note">
                Demostración visual. No se realizará ningún cobro.
              </p>
            </div>
          )}
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
      {routes[path] ?? (
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
