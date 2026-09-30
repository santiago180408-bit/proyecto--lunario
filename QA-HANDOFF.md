# Lunario Café — traspaso a Chat 05

Demo frontend pública V1 contrastada con el Build Brief técnico final y el addendum de Dirección del 30 de septiembre de 2026. Lista para QA independiente y presentación; esta entrega no autoriza un sistema productivo.

## Fuentes y decisiones

- Build Brief: `Texto pegado.txt` entregado por Chat 02. El addendum prevalece en croquis, efectos visuales, tipografía y logos.
- Menú: `Menu_Lunario_organizado.docx`, contrastado con `MenuLunarioCafe.pdf`. Se conservan productos y precios publicados; los puntos expresamente pendientes no se convierten en selectores.
- Visual: `Guia-identidad-visual-Lunario.pdf`; sus mockups bastan como referencia. Cormorant Garamond e Inter son tipografías de esta implementación, sin declararlas oficiales de la identidad corporativa.
- Logos y favicons: comparación SHA-256 idéntica con `Lunario-logos-isotipos-favicons.zip`. El paquete incluye adaptaciones digitales; no se presenta como archivos maestros originales.
- Planos: SVG existentes cotejados contra los dos croquis digitales del workspace y la página 3 de la guía. Conservan diez mesas, cuatro cuartos, mobiliario, circulación, accesos, cocina, barra, baños y escaleras. No contienen fotografías ni medidas arquitectónicas. El cotejo documentado corresponde a estos croquis disponibles, no a fotografías originales de libreta que no estaban separadas entre las fuentes localizadas.

## Comprobaciones de construcción

Los 12 bloques del brief están cubiertos: assets/datos; foundation; Home; menú; store/pedido; planta baja; pedido completo; reserva; coworking; acceso/solicitud; pago visual; responsive/accesibilidad/SEO.

- `npm run build`: exportación estática completa y carpeta `dist` para Pages. Conserva los alias de segmentos que necesita la navegación de Next al exportar en Windows.
- TypeScript y `git diff --check` correctos. `node scripts/check-menu.mjs`: 116 productos y 487 configuraciones verificadas, con chequeos explícitos para excluir opciones pendientes.
- Chromium: pedido para recoger, pedido en mesa, reserva y coworking por hora/día/semana/mes; carrito, variantes, extras autorizados, cantidades, edición, eliminación, recarga y conservación entre secciones.
- Google/correo/invitado de demo; enviada → pendiente → confirmación explícita; las tres opciones de pago visual aparecen después. Sin correo en almacenamiento, entradas financieras, cobros, recibos de pago o llamadas comerciales.
- Planos: teclado, gesto táctil emulado de dos dedos, zoom hasta 2.5x, desplazamiento limitado y reset sin perder selección. Las mesas pequeñas se pueden ampliar y cuentan con alternativas por ubicación de al menos 44px.
- Viewports 390, 430, 768, 1024 y 1440px: sin desbordamiento horizontal, un h1 por vista, navegación móvil, foco, Escape, focus trap, noindex/nofollow y movimiento reducido.
- Cero errores de ejecución, recursos fallidos y solicitudes externas durante los recorridos medidos. Dos avisos no críticos de precarga de fuentes de Next en Chromium; las fuentes y la navegación cargaron correctamente.

Vista local disponible durante esta sesión: http://127.0.0.1:3012/. Para Cloudflare Pages: comando `npm run build`, salida `dist`. Los flujos usan únicamente `sessionStorage`, clave `lunario-demo-v1`.

Demo verificada en Cloudflare Pages: https://01672f25.proyecto--lunario.pages.dev/. Se comprobaron pedido como invitado hasta confirmación y elecciones de pago visuales, reserva con selección de mesa y coworking mensual hasta revisión, sin errores de ejecución ni recursos fallidos.

Límites de esta comprobación: no se probó Safari/iPhone físico. Las reglas comerciales pendientes del brief siguen pendientes y no bloquean esta demo. Chat 05 debe realizar su propia revisión visual y de presentación.

## Checklist del Build Brief, con prevalencia del addendum

Los checks registran la inspección de código/datos, el cotejo visual con las fuentes disponibles y las pruebas de navegador anteriores; no representan aprobación independiente de Chat 05.


### Identidad

- [x] Usa assets aprobados del ZIP y fotografías de los materiales entregados.
- [x] No hay logos reconstruidos.
- [x] No se estira el lockup.
- [x] Negro, marfil, champán y taupe siguen la guía.
- [x] Dorado no domina toda la interfaz.
- [x] Titulares y UI utilizan jerarquía tipográfica aprobada.
- [x] Glassmorphism es selectivo.
- [x] No hay estética genérica de plantilla SaaS/restaurante.

### Home

- [x] Hero oscuro.
- [x] Fotografía autorizada.
- [x] CTA Pedir.
- [x] CTA Reservar.
- [x] Acceso a Coworking.
- [x] No existe módulo Bar.

### Menú

- [x] Existen las seis categorías aprobadas.
- [x] Todos los precios cargados provienen del material autorizado.
- [x] No existen productos inventados.
- [x] No existen sabores inventados.
- [x] No existen extras inventados.
- [x] Las opciones ambiguas no fueron convertidas en selectores.
- [x] Producto sin foto no utiliza stock ni IA.
- [x] Variantes cambian precio correctamente.
- [x] Cantidad actualiza subtotal.
- [x] Carrito calcula total correctamente.
- [x] Editar un ítem conserva su configuración.
- [x] Eliminar funciona.

### Pedido

- [x] Existen En Lunario y Para recoger.
- [x] No existe delivery.
- [x] En Lunario exige selección de mesa antes de continuar.
- [x] Para recoger va al menú.
- [x] Volver no elimina el carrito.
- [x] Refresh durante la sesión conserva el estado.

### Planta baja

- [x] SVG conserva elementos y posiciones relativas del croquis disponible, conforme al addendum.
- [x] Ningún mueble fue movido.
- [x] Ninguna mesa fue agregada/eliminada.
- [x] Hotspots coinciden con elementos reales.
- [x] Mesa seleccionada utiliza dorado.
- [x] No aparece “Mesa 1”, “Mesa 2”, etc.
- [x] Funciona con touch.
- [x] Funciona con teclado.
- [x] Zoom/pan funciona en móvil.

### Reserva

- [x] Orden: fecha → hora → personas → mesa → revisión.
- [x] No afirma disponibilidad.
- [x] No inventa duración.
- [x] No inventa tolerancia.
- [x] Al enviar pasa al estado simulado.

### Coworking

- [x] Cuarto 1 muestra capacidad 4.
- [x] Cuarto 2 muestra capacidad 4.
- [x] Cuarto 3 muestra capacidad 4.
- [x] Cuarto 4 muestra capacidad 10.
- [x] SVG del plano 2 conserva elementos y posiciones relativas.
- [x] Premium tiene precios correctos.
- [x] Básica tiene precios correctos.
- [x] Light tiene precios correctos.
- [x] Light muestra renta mínima de 3 horas.
- [x] Light conserva sus tarifas por persona.
- [x] Ninguna tarifa está asignada automáticamente a un cuarto.
- [x] Ninguna fotografía general se atribuye falsamente a un cuarto específico.
- [x] Flujo: cuarto → tarifa/duración → fecha/hora/personas → revisión.

### Acceso

- [x] Google es solo UI.
- [x] Correo es solo UI.
- [x] Invitado funciona.
- [x] No existe OAuth.
- [x] No existe sesión remota.
- [x] No se almacena el correo introducido.

### Solicitud

- [x] Puede mostrar Solicitud enviada.
- [x] Puede pasar a Pendiente.
- [x] Existe control explícito Simular confirmación.
- [x] Puede pasar a Confirmada.
- [x] El estado simulado está identificado como demo.

### Pago

- [x] Aparece solo después de confirmación simulada.
- [x] Tarjeta visible.
- [x] Apple Pay visible.
- [x] Efectivo visible.
- [x] No existen inputs financieros.
- [x] No existe SDK de Apple Pay.
- [x] No existe pasarela.
- [x] No hay llamadas de red para cobrar.
- [x] Aparece mensaje de no cobro.

### Responsive

- [x] 390 px usable sin scroll horizontal de página.
- [x] 430 px usable.
- [x] Tablet usable.
- [x] 1024 px usable.
- [x] 1440 px no parece mobile ampliado.
- [x] CTAs principales permanecen accesibles.

### Accesibilidad

- [x] Focus visible.
- [x] Navegación por teclado completa.
- [x] Touch targets adecuados.
- [x] Dialogs gestionan focus correctamente.
- [x] Imágenes tienen alt correcto.
- [x] Decorative assets tienen alt vacío.
- [x] Reduced motion funciona.
- [x] Contraste funcional suficiente.

### Técnica

- [x] No existe backend.
- [x] No existe base remota.
- [x] No existe admin.
- [x] No existe autenticación real.
- [x] No existe pago real.
- [x] No existen automatizaciones.
- [x] Estado persiste únicamente en sessionStorage.
- [x] Datos comerciales están separados de componentes.
- [x] Demo tiene noindex, nofollow.
- [x] No hay warnings/error críticos en consola.
- [x] No hay enlaces o botones muertos dentro de los flujos incluidos.
