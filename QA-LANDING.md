# Lunario — Landing + entrada /ordenar

## Entrega y alcance

Implementación de los diez bloques del Build Brief recibido el 30/09/2026. Revisión de construcción completada en Chromium; lista para revisión independiente de Dirección/Chat 05. Esta aceptación técnica no sustituye su aprobación visual.

Demo desplegada y verificada: https://3e9e296a.proyecto--lunario.pages.dev/. PR de esta fase: https://github.com/santiago180408-bit/proyecto--lunario/pull/3, con base en la entrega V1 del PR #2. No se fusionó a main.

Solo cambian `/` y la nueva vista `/ordenar`, sus componentes, contenido, ilustraciones, fotografía derivada y SEO. `DemoApp.tsx`, CSS transaccional, stores, persistencia, datos de menú/coworking/pago, croquis y todas las rutas internas conservan exactamente sus archivos de la base `12a5583`.

## Referencias abiertas individualmente

| Vista | Referencia principal | Aplicación |
|---|---|---|
| Landing 1024/1440 | Foto 3 | Hero fotográfico, franja marfil curva, tres cards, sección oscura asimétrica con fotografía |
| Landing desktop | Foto 7 | Variación orbital secundaria, conservando la estructura de Foto 3 |
| Landing 390/430 | Foto 4 | Hero compacto, cards oscuras apiladas, órbitas, FAQ marfil y CTA ancho |
| Landing 768 | Foto 4 adaptada | Sistema apilado con composición fotográfica intermedia |
| /ordenar 1024/1440 | Foto 5 | H1 centrado, tres cards iguales, ilustración protagonista, iluminación champán |
| /ordenar 390/430/768 | Foto 6 | Volver a Lunario, cards horizontales apiladas, ilustración y chevron |
| Referencias secundarias | Fotos 1–2 | Contraste, profundidad e iluminación; no se mezclaron sus estructuras con la principal |

También se consultó la guía de identidad existente. El ZIP se utiliza directamente; no se extrajeron logos de los mockups. Las fuentes de implementación existentes, Cormorant Garamond + Inter, se conservan y se sirven localmente con Next.

## Assets y desviaciones justificadas

- `cafe-hero.jpg`: **food/drink**, foto autorizada de taza de café. No existe la fotografía panorámica de cafetería/croissant del mockup entre los assets actuales. Se mantiene fondo fotográfico, foco de taza hacia centro/derecha y gradiente oscuro de lectura. Su encuadre y resolución difieren del mockup por el original vertical disponible; no se generaron ni descargaron fotos.
- `coworking-1/2/3.jpg`: **coworking**, utilizados como composición ambiental sin atribuirlos a un cuarto concreto. No hay otra fotografía clasificada como **cafeteria** entre los cuatro assets existentes.
- `coffee.webp` y `workspace-1/2/3.webp`: derivados de esas fotos, únicamente recorte de bordes blancos y codificación WebP, sin alteración generativa. `lunario-og.jpg`: recorte 1200×630 del café autorizado.
- Las ilustraciones son SVG locales con geometría y gradientes cálidos, como exige el brief; conservan bolsa/café, mesa/calendario y puerta/escritorio. Su profundidad vectorial es menor que los renders de referencia. El detalle de marca en la bolsa incorpora el SVG existente sin reconstruirlo.
- Se utiliza el lockup/isotipo del ZIP, cuyo wordmark difiere de los exploratorios de los mockups. No se recrearon alternativas.
- Se aplican las correcciones textuales vinculantes: CTA principal **Ir a ordenar**, tres acciones **Pedir / Reservar mesa / Reservar coworking**, microcopy exacto, cuatro FAQ y datos prácticos/footer. Por eso la página móvil es más larga que la exploración visual de tres preguntas.

## Archivos

- Modificados: `src/app/page.tsx`, `.gitignore` (excluir configuración local de entorno).
- Nuevos: `src/app/ordenar/page.tsx`, `src/app/sitemap.ts`, `.env.example`.
- Componentes/contenido: `src/features/public/{Landing,PublicHeader,OrderEntry,BrandActionIcon,PublicMotion}.tsx`, `content.ts`, `seo.ts`, `public.module.css`.
- Ilustraciones: `public/ui/actions/{order,table,coworking}.svg`.
- Fotografía derivada: `public/media/{coffee,workspace-1,workspace-2,workspace-3}.webp`, `lunario-og.jpg`.
- Este reporte: `QA-LANDING.md`. No se añadieron dependencias.

## Capturas y checks por viewport

Capturas individuales del build exportado, después de revelar cada sección y volver arriba. Se inspeccionaron visualmente contra las referencias correspondientes.

| Ancho | Landing | /ordenar | Estado |
|---|---|---|---|
| 390 | [Captura](output/playwright/landing-final-390.png) | [Captura](output/playwright/ordenar-final-390.png) | Pasa: una columna, texto visible, targets ≥44 px, sin overflow |
| 430 | [Captura](output/playwright/landing-final-430.png) | [Captura](output/playwright/ordenar-final-430.png) | Pasa: mismas jerarquías móviles y sin overflow |
| 768 | [Captura](output/playwright/landing-final-768.png) | [Captura](output/playwright/ordenar-final-768.png) | Pasa: formato intermedio, cards sin comprimir en tres columnas |
| 1024 | [Captura](output/playwright/landing-final-1024.png) | [Captura](output/playwright/ordenar-final-1024.png) | Pasa: composición desktop, tres cards en fila |
| 1440 | [Captura](output/playwright/landing-final-1440.png) | [Captura](output/playwright/ordenar-final-1440.png) | Pasa: max-width, fotografía y escala editorial |

Las capturas son artefactos locales de QA, no assets de producción. Hero/header se comprobaron primero a 1440 y 390, también a 430 y 1024; la Landing completa se comparó a 1440 y 390 antes de avanzar a `/ordenar`.

## Comprobaciones técnicas

- `npm run build`: exportación estática de 16 páginas, incluyendo `/ordenar` y `sitemap.xml`, copiada a `dist` para Pages. TypeScript incluido en el build.
- `node scripts/check-menu.mjs`: 116 productos, 487 configuraciones; precios/opciones/categorías y exclusión de opciones pendientes pasan.
- Navegación Landing → gateway contextual → cada uno de los tres flujos existentes. El parámetro solo enfoca/resalta/desplaza, nunca entra automáticamente al flujo.
- Menú móvil: estado accesible, focus inicial, ciclo Tab/Shift+Tab, Escape, retorno de foco, tap fuera y bloqueo/restauración de scroll. Se corrigió el overlay limitado por el containing block del backdrop blur.
- FAQ: cuatro respuestas idénticas al JSON-LD, presentes en HTML; Enter y JavaScript deshabilitado comprobados.
- No regresión: pedido para recoger → menú/configuración/carrito → invitado → enviada/pendiente/confirmación → tres elecciones visuales de pago; reserva → croquis/mesa/revisión; coworking mensual → configuración/revisión. Cero errores de ejecución, recursos fallidos o acciones comerciales de red.
- SEO: title/description, canonical y OG, `index, follow` de `/`, `noindex, nofollow` del gateway y todas las subrutas transaccionales; sitemap contiene únicamente `/`. Sin ratings, reseñas, disponibilidad ni otros datos inventados.
- `SITE_URL` configura el origen real. La validación local utilizó `https://proyecto--lunario.pages.dev`, cuya respuesta HTTP 200 se verificó. Pages puede usar su `CF_PAGES_URL` real para previews cuando no se configura `SITE_URL`; no se fija un dominio dentro del código. Para hosting fuera de Pages se debe configurar `SITE_URL` antes de compilar.
- Performance local Chromium, exportación estática sin throttling: 390 px LCP **232 ms**, CLS **0**, interacción medida **32 ms**; 1440 px LCP **224 ms**, CLS **0**, interacción **32 ms**. Son observaciones locales, no métricas de campo ni certificación de INP. El WebP del hero pesa aproximadamente **22 KB**.
- Cero errores críticos de consola, recursos fallidos o peticiones externas en los recorridos medidos. Chromium muestra avisos no críticos de precarga de fuentes heredados de Next; no hubo fallos de fuente.
- Cloudflare Pages: despliegue exitoso; Landing y las tres conexiones del gateway comprobadas públicamente a 390/1440 px, sin errores ni recursos fallidos. Canonical, OG y sitemap de ese preview resuelven a su `CF_PAGES_URL` real.

## Checklist de aceptación del Build Brief

### Visual — 72

- [x] Landing reconocible respecto a sus referencias, con las sustituciones de assets documentadas.
- [x] /ordenar reconocible respecto a sus referencias desktop/mobile.
- [x] Landing y /ordenar son contextos visuales distintos.
- [x] Identidad, paleta y tipografías de implementación conservadas.
- [x] Hero fotográfico dominante con zona oscura legible.
- [x] “grandes ideas” champán/editorial.
- [x] “Ir a ordenar” es el CTA comercial prioritario.
- [x] Alternancia fotografía/negro/marfil; página no completamente oscura.
- [x] “Tu experiencia empieza aquí” aparece temprano.
- [x] Tres cards de una misma familia, sin fotografías.
- [x] Sección disruptiva con copy, función y CTA.
- [x] Máximo dos órbitas principales por composición; no dominan todo el sitio.

### Landing — 73

- [x] `/` carga correctamente; headers desktop/mobile y hamburguesa funcionales.
- [x] Menú → ruta existente; Espacios → #espacios; Explorar → #experiencia.
- [x] Todos los CTA comerciales principales → /ordenar.
- [x] Cards Pedir/Mesa/Coworking → gateway con contexto correcto.
- [x] Cuatro FAQ exactas, datos oficiales de horario/dirección.
- [x] Footer sin datos/URLs inventados; no se añadió Bar ni otros módulos comerciales.

### /ordenar — 74

- [x] H1 y subtítulo exactos.
- [x] Exactamente tres acciones en orden Pedir → Reservar mesa → Reservar coworking.
- [x] Toda card es un único link y conduce al flujo existente correspondiente.
- [x] Volver a Lunario → /; sin módulos extra.
- [x] No utiliza “Asegura tu lugar”.
- [x] Fondo carbón, iluminación champán y cards iguales.
- [x] Desktop horizontal; mobile apilado con ilustración, microcopy y chevron.

### Fotografía — 75

- [x] No hay fotografía nueva de IA, stock ni screenshots de mockups.
- [x] Hero y coworking usan exclusivamente assets autorizados disponibles.
- [x] No se relaciona una fotografía con un cuarto específico.
- [x] Action cards usan ilustraciones SVG.

### Motion — 76

- [x] Tokens fast 140 ms, normal 220 ms, section 420 ms.
- [x] Entrada de hero sin bloquear interacción.
- [x] Reveals una sola vez, IntersectionObserver desconecta elementos revelados.
- [x] Iconos responden a hover/focus/tap.
- [x] Sin loops infinitos, scroll hijacking, WebGL/canvas o librería nueva.
- [x] Reduced motion elimina animación y desplazamiento no esencial.

### Responsive — 77

- [x] 390/430 sin overflow, cards y CTA cómodos.
- [x] 768 usable con composición intermedia.
- [x] 1024 activa desktop y tres columnas.
- [x] 1440 usa max-width sin estiramiento artificial.
- [x] Hero móvil compacto; acción aparece temprano.
- [x] Títulos sin corte; desktop no es un móvil ampliado.

### SEO/AEO — 78

- [x] Title, description, canonical, OG y `index, follow` en Landing con origen configurado.
- [x] /ordenar y rutas transaccionales noindex/nofollow por metadata.
- [x] Sitemap incluye Landing y excluye gateway/pasos transaccionales.
- [x] Un H1, headings semánticos, FAQ en HTML y FAQPage equivalente.
- [x] CafeOrCoffeeShop con datos verificados y logo aprobado.
- [x] Sin ratings/reseñas falsas, disponibilidad ni información inventada.

### Accesibilidad — 79

- [x] Navegación por teclado, focus visible y targets ≥44 px.
- [x] Estado de hamburguesa y control de focus comprobados.
- [x] Cards con nombre accesible, sin controles interactivos anidados.
- [x] Ilustraciones y órbitas decorativas aria-hidden.
- [x] Fotografías con alt descriptivo; logos alt Lunario Café.
- [x] FAQ funciona sin mouse y sin JavaScript.
- [x] Texto funcional legible sin depender de glow/sombra.

### Performance — 80

- [x] Hero WebP, responsive, dimensiones/layout definidos y carga prioritaria.
- [x] Fotografías posteriores lazy-load.
- [x] Sin vídeos, filtros fullscreen o blur anidados.
- [x] Motion principalmente transform/opacity, sin dependencia pesada nueva.
- [x] Sin CLS observable en las mediciones locales.
- [x] Sin errores críticos de consola.

### No regresión y Definition of Done — 81/82

- [x] Gateway vuelve a conectar con pedido, reserva y coworking existentes.
- [x] Lógica/persistencia/componentes internos permanecen sin cambios.
- [x] Se puede entrar a Landing, entender Lunario, encontrar CTA, descubrir acciones y consultar respuestas.
- [x] Se puede pasar al gateway y continuar cada flujo en los cinco viewports definidos.

## Límites de esta comprobación

No se probó Safari/iPhone físico ni se midieron Core Web Vitals de campo. La conformidad visual registrada es la revisión de construcción contra las siete referencias; Dirección/Chat 05 conserva la aceptación final. Las divergencias reales de fotografía, logo y técnica vectorial están indicadas arriba.
