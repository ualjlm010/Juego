# Auditoría y validación — Pokémon: Black Market

## Fase 1 — Auditoría Inicial
*Completada el 26 de octubre de 2026.*
- Revisión de colisiones, capturas básicas, prevención de dobles lanzamientos y escenarios iniciales.

---

## Fase 2 — Sistemas de Facciones, Combate y Economía
*Completada el 26 de octubre de 2026.*
- Introducción de Alianza Guardiana y Sindicato Sombra.
- Mercado Negro, transacciones en Pokédólares y Fichas Sombra.
- Combate por turnos RPG y sistema de gestión de equipo (límite 6).
- Persistencia versionada (esquemas v1, v2 y v3 con migración sin pérdidas).
- 48 pruebas unitarias pasando con 100% de éxito (`npm test`).

---

## Fase 3 — Reconstrucción Visual Profunda y Expansión Masiva (Build 2.0 Fullscreen)
*Completada el 26 de octubre de 2026.*

### 1. Pantalla Completa Real y Maquetación
- Eliminados los bordes artificiales encajonados (`width: min(1320px, 100%)`).
- Contenedor responsive con `100vw` y `100dvh` reales.
- Integración de la API nativa de pantalla completa: `requestFullscreen()`, `exitFullscreen()`, `document.fullscreenElement`.
- Listeners del evento `fullscreenchange` para actualizar automáticamente el estado de la interfaz.
- Botones de acceso directo en Topbar (`#fullscreenTopBtn`) y Menú Principal (`#fullscreenMenuBtn`).
- Atajos de teclado: tecla `F` o `F11` para alternar pantalla completa; tecla `G` para panel de Facciones.

### 2. Expansión a 74 Especies Oficiales Auténticas
- Catálogo ampliado de 12 a 74 especies icónicas de Pokémon.
- Las 12 especies fundacionales se conservan 100% intactas.
- Todas las especies disponen de:
  - Sprites estáticos normales (`assets/pokemon/sprites/{id}.png`) a 128×128 px con renderizado pixelado.
  - Variantes Shiny oficiales (`assets/pokemon/shiny/{id}.png`) con paletas cromáticas auténticas extraídas de SpriteCollab (`s/`).
  - Hojas completas de animación 8-way (`Idle`, `Walk`, `Attack`, `Hurt`, `Faint`) en `assets/pokemon/anim/{id}/`.
  - Metadatos técnicos (`src/anim-data.js`) con anclajes al suelo (`ax`, `ay`), recuento de fotogramas y duraciones en ticks a 60 fps.

### 3. Visor Interactivo de Animaciones en Ficha Individual
- En la ficha de detalle de cada Pokémon, se implementó un lienzo Canvas en tiempo real donde se ejecutan las animaciones direccionales.
- Botones interactivos para alternar posturas: Reposo (`Idle`), Marcha (`Walk`), Ataque (`Attack`) e Impacto (`Hurt`).
- Selectores angulares direccionales (`↓`, `→`, `↑`, `←`).
- Ciclo de animación optimizado con `requestAnimationFrame` que se cancela limpiamente al cerrar la ficha.

### 4. Colección con Buscador, Filtros y Ordenación
- Diseñada para navegar con agilidad por el catálogo de 74 especies y cientos de capturas:
  - Buscador reactivo en tiempo real por texto (nombre, tipo, naturaleza, habilidad).
  - Filtro por Tipo (18 tipos elementales).
  - Filtro por Categoría (Equipo activo, En reserva, Variocolor ★, Retenidos).
  - Ordenación por Nivel (asc/desc), Nº Pokédex (#1 - #74), Nombre (A-Z) o PS Máximos.

### 5. Dirección Artística y Atmósfera de Biomas
- **Pradera del Refugio:** Pétalos florales y esporas meciéndose con el viento.
- **Bosque Susurro:** Luciérnagas y esporas bioluminiscentes flotantes con efecto halo pulsante.
- **Cantera Antigua:** Briznas de polvo mineral dorado y esquirlas de arena sobre el terreno árido.
- Bordes naturales temáticos por bioma y viñetas de iluminación cálidas y nocturnas.

### 6. Verificación Automatizada y Cero Errores
- `npm test`: **48 pruebas unitarias pasando con 100% de éxito**.
- Verificación con Microsoft Edge Headless CDP (`tools/verify_browser.js`):
  - 13 capturas de pantalla de alta fidelidad auditadas en 1920×1080 y 1280×720.
  - **0 errores de JavaScript en consola.**
  - **0 peticiones de red fallidas (404/500).**
  - Todas las imágenes, animaciones y fuentes locales se cargan y renderizan correctamente.

---

## Fase 4 — Control 100% por Ratón, Depuración Visual y HUD Estilo PokéBonk
*Completada el 26 de octubre de 2026.*

### 1. Interacción Completa Mediante Clics de Ratón
- **Navegación Click-to-Move en Campo Salvaje:** Al hacer clic en el terreno de exploración (Pradera, Bosque o Cantera), el personaje se desplaza fluidamente hacia el destino marcado con un efecto de onda expansiva animada en el lienzo.
- **Interacción y Persecución con un Clic:** Al hacer clic sobre cualquier Pokémon salvaje en el mapa, el personaje acude automáticamente a su encuentro e inicia la interacción al llegar.
- **Tarjeta Contextual de Encuentro Salvaje (`#wildTargetCard`):** Se reemplazó el texto arcaico de consola por una tarjeta flotante moderna con el sprite animado de la criatura, su nivel, tipos y dos botones táctiles: `[ ⚔ COMBATIR ]` y `[ ● CAPTURAR ]`.
- **Botón de Silencio en Barra Superior (`#soundTopBtn`):** Píldora interactiva que alterna sonido activado (`🔊`) y silenciado (`🔇`) de forma inmediata con el ratón.
- **Estaciones Interactivas del Refugio con Clic:** Centro Médico, Puesto de Operaciones, Estrado de Mando, Terrarios de Hábitat y Portal de Expedición responden directamente al clic del ratón y presentan cursor interactivo con realce.

### 2. Depuración y Limpieza Visual del HUD
- Eliminada la barra inferior de controles de teclado (`#controls`) para despejar la vista.
- Eliminado el banner rígido de interacción (`#prompt`) en favor de la tarjeta táctil contextual.
- Eliminados los indicadores obsoletos de la barra superior (`#saveIndicator` y `#clock`), reemplazados por el diseño limpio de píldoras flotantes de PokéBonk.
- Retorno al Refugio instantáneo mediante botón flotante en pantalla (`#returnToRefugioBtn`).
