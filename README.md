Actualización 19

## Acabado de la experiencia jugable

- Se ajustan los accesos rápidos de las salas a una columna para despejar el centro y la salida.
- Se recoloca el marcador de salida y su zona de interacción para que permanezca visible por encima de la navegación.
- Pradera, bosque y cantera reciben capas de paisaje, iluminación ambiental y detalles vivos para ganar profundidad.
- El suelo de las salas pasa a losas discretas, con menos líneas de perspectiva; se libera la ilustración del gimnasio de los travesaños centrales.
- Se conserva intacta la secuencia del menú principal.

## Coherencia visual del juego

- Se unifica el HUD, los accesos rápidos, las tarjetas, los cuadros, los formularios y los paneles con la paleta azul noche, carmín y oro del menú principal.
- La sala de Entrenadores incorpora una vista ilustrada del gimnasio elegido; la sala Rocket usa la fortaleza nocturna en su consola central.
- Se vuelve a mostrar la navegación de sala y se despeja la salida a expediciones para que los controles no tapen el acceso.
- El equipo vacío presenta sus seis espacios disponibles y una indicación de cómo llenarlos.
- Las reglas de estilo del menú principal quedan separadas de la nueva capa visual de la interfaz del juego.

## Salas de facción

- Se rediseñan desde cero las salas de Entrenador Pokémon y Team Rocket como interiores separados, limpios y claramente reconocibles.
- Se retiran de estas salas la plaza exterior, el camino central, los puestos repetidos, los Pokémon que cruzaban la escena y el avatar del jugador.
- Se mantienen las zonas interactivas de cuidados, suministros, equipo y salida a expediciones, integradas en el nuevo decorado.
- La introducción y el menú principal conservan su diseño y animación.

## Crear perfil y reemplazo de progreso

- «NUEVO PERFIL» abre directamente el selector de bando, sin el diálogo intermedio.
- Si ya existe un guardado que se reemplazará, el selector muestra debajo de las tarjetas un aviso pequeño antes de elegir bando.

## Salir de la selección de bando

- Se añade un botón × en la esquina superior derecha del selector de Entrenador Pokémon / Team Rocket.
- Cierra el modal con la acción común de volver, sin seleccionar una facción; también funciona con teclado y mantiene un foco visible.

## Menú: título y botones

- El título adopta una paleta de luz lunar y rojo carmesí que encaja con la fortaleza nocturna.
- «ENTRAR» ocupa el lugar principal y queda desactivado hasta que existe un perfil guardado; «NUEVO PERFIL» aparece debajo como acción secundaria.
- Los botones tienen tratamientos visuales distintos, brillo animado, respuesta al puntero y foco accesible; la opción de movimiento reducido desactiva sus animaciones.

## Fondo animado del menú principal

- El menú usa el paisaje nocturno pixel-art de la fortaleza Rocket proporcionado por el usuario, conservado como imagen fija a pantalla completa.
- Una capa Canvas transparente añade nubes pixeladas con mayor desplazamiento, haces de búsqueda suaves desde la torre, halo lunar, luces pulsantes en la fortaleza y el emblema, destellos de ciudad, reflejos móviles del agua y puntos de luz sobre el bosque.
- El ciclo ambiental ahora dura 11 segundos para que el movimiento tenga un recorrido más visible; la cámara y la ilustración permanecen inmóviles. La animación se pausa al ocultarse el menú o la pestaña y respeta `prefers-reduced-motion`.
- No se incorporan recursos de Internet ni dependencias nuevas.

## Selección de facción

- Los carteles usan las dos ilustraciones verticales proporcionadas por el usuario.
- Al pasar el puntero o recibir foco, una franja diagonal cruza la imagen de borde a borde: azul para Entrenador Pokémon y negra para Team Rocket. El nombre aparece dentro de la franja junto a una Poké Ball con un breve rebote.
- En pantallas táctiles, la franja y el nombre permanecen visibles para conservar la identificación de cada opción.

## Cambios visuales de la actualización 6

- La pantalla inicial centra el título animado y reduce las opciones a crear un perfil local o entrar al perfil guardado.
- La sala usa una plaza urbana Kanto al anochecer, con edificios de facción, pavimento irregular y Pokémon ambientales en movimiento.
- El jugador se muestra sin un Pokémon compañero impuesto.

Esta edición continúa usando guardado local del navegador. «Entrar» carga ese perfil guardado; no existe autenticación en línea.

# Pokémon: Black Market — Videojuego RPG 2D

Videojuego 2D de rol, exploración de hábitats salvajes, colección de criaturas individuales, economía clandestina, combate por turnos y rivalidad estratégica entre facciones.

Desarrollado en HTML5, CSS y JavaScript moderno (ES Modules) con persistencia local versionada en el navegador y ejecución 100% autónoma sin dependencias de red.

---

## 🚀 Cómo Ejecutar el Juego

### Requisitos
- Un navegador web moderno (Edge, Chrome, Firefox, Safari).
- Python 3 instalado (o cualquier servidor estático HTTP local).

### Instrucciones
1. Abre una terminal en la carpeta del juego (`BlckMkt`).
2. Inicia el servidor local:
   ```bash
   python -m http.server 8000
   ```
3. Abre tu navegador y accede a:
   [http://localhost:8000](http://localhost:8000)

---

## 🌟 Novedades anteriores (Actualización 5 · Build 2.0 Fullscreen)

1. **Pantalla Completa Nativa Real:**
   - Botón nativo de pantalla completa en la barra superior (`#fullscreenTopBtn`) y en el menú de inicio (`#fullscreenMenuBtn`).
   - Atajo de teclado directo con la tecla `F` o `F11`.
   - Adaptación fluida sin marcos artificiales a cualquier resolución (1920×1080, 1366×768, 1280×720, etc.).

2. **Expansión Masiva a 74 Especies Oficiales Auténticas:**
   - Catálogo ampliado de 12 a 74 especies icónicas de Pokémon oficiales.
   - Sprites estáticos nítidos y auténticos para las 74 especies (`assets/pokemon/sprites/`).
   - Variantes Shiny oficiales (`assets/pokemon/shiny/`) con paletas auténticas.
   - Hojas completas de animación 8-way (`Idle`, `Walk`, `Attack`, `Hurt`, `Faint`) procedentes de SpriteCollab / PMDCollab para todas las especies (`assets/pokemon/anim/{id}/`).

3. **Visor y Previsualizador Interactivo de Animaciones:**
   - En la ficha de detalle de cada ejemplar, un lienzo en tiempo real reproduce las animaciones del Pokémon.
   - Controles interactivos para cambiar postura (`Reposo`, `Andar`, `Ataque`, `Daño`) y dirección (`↓`, `→`, `↑`, `←`).

4. **Buscador, Filtros y Ordenación en Colección:**
   - Con 74 especies disponibles, el panel de Colección (`C`) cuenta con:
     - Buscador en tiempo real por nombre, tipo, naturaleza o habilidad.
     - Filtro por Tipo elemental (Normal, Fuego, Agua, Planta, Eléctrico, etc.).
     - Filtro por Estado (Equipo activo, En reserva, Variocolor ★, Retenidos).
     - Ordenación por Nivel (asc/desc), Nº Pokédex (#1 - #74), Nombre (A-Z) o PS Máximos.

5. **Atmósfera y Partículas Ambientales por Bioma:**
   - **Pradera del Refugio:** Pétalos florales y esporas soleadas mecidas por la brisa.
   - **Bosque Susurro:** Luciérnagas bioluminiscentes y esporas místicas flotantes con halo resplandeciente.
   - **Cantera Antigua:** Briznas de polvo mineral dorado y esquirlas de arena sobre el terreno árido.
   - Viñeta e iluminación atmosférica diferenciada para cada hábitat e interiores.

---

## 🧪 Pruebas Automatizadas

El proyecto incluye una suite completa de pruebas unitarias con el ejecutor nativo `node:test`:

```bash
npm test
```

Actualmente cuenta con **48 pruebas automáticas pasando con 0 errores**, cubriendo:
- Lógica de captura y consumo de bolas.
- Registro atómico de ejemplares en colección.
- Sistema económico, compra, venta y saldo legal/clandestino.
- Gestión de equipo (límite de 6, líder activo, curación, debilitados).
- Combate por turnos, cálculo de daño, multiplicadores de tipo y experiencia.
- Facciones, control territorial y resolución de conflictos dinámicos.
- Misiones principales e investigación regional.
- Guardado versionado, persistencia y migración de esquemas legados (v1, v2 y v3).
- Verificación exhaustiva de registros de sprites y activos locales.

---

## 🎮 Controles y Navegación

| Tecla / Acción | Función |
|---|---|
| `WASD` / Flechas | Desplazamiento libre del personaje en zonas salvajes de expedición |
| `E` | **Explorar** desde la sala / **Interactuar y Combatir** en campo salvaje |
| `H` | **Curar Equipo al 100%** desde la sala |
| `R` | **Volver a la sala** desde cualquier punto del campo salvaje |
| `T` | Abrir panel de **Gestión de Equipo** activo y reserva |
| `B` | Abrir la **Bolsa** (inventario, objetos y fondos) |
| `G` | Abrir panel de **Facciones y Disputas Territoriales** |
| `M` | Abrir **Misiones** de campo y encargos de historia |
| `C` | Abrir la **Colección / Pokédex** general con filtros y buscador |
| `F` | Alternar **Pantalla Completa Nativa** (también disponible en Topbar) |
| `Esc` | Menú de **Pausa** / Cerrar ventana modal activa |
| `Clic / Puntero` | Interactuar con edificios de la sala, botones o Pokémon salvajes |

---

## 🏙️ Sala Central y Expediciones

- La **sala** es una escena fija de gestión que conserva las acciones, economía y controles existentes.
- La expedición continúa como exploración 2D libre con `WASD`, encuentros y sprites animados.
- Regresa a la sala con `R` o con el control de retorno en pantalla.

---

## 🏛️ Las Dos Facciones Principales

Al comenzar una nueva partida, deberás elegir a qué organización unirte:

### 1. Alianza Guardiana (Organización Protectora)
- **Objetivo:** Proteger a los Pokémon, frenar el contrabando, defender asentamientos y rescatar ejemplares cautivos.
- **Ventajas:** Acceso prioritario a centros de salud, suministros médicos y misiones de custodia y patrulla.

### 2. Sindicato Sombra (Red Clandestina)
- **Objetivo:** Controlar rutas ocultas, traficar recursos, infiltrarse en almacenes rivales y expandir el Mercado Negro.
- **Ventajas:** Acceso exclusivo a dispositivos encriptados, pago con Fichas Sombra (◈) y bonificaciones en compraventa clandestina.

---

## ⚡ Conflictos Dinámicos y Mecánica de Rescate

- **Alertas Periódicas:** Cada 60 segundos se generan acontecimientos dinámicos entre facciones en una de las 3 zonas (Pradera del Refugio, Bosque Susurro o Cantera Antigua).
- **Tipos de Disputa:** Incursiones en depósitos, emboscadas a convoyes, disputas territoriales y transporte de contrabando.
- **Intervención del Jugador:** Puedes acudir a intervenir en el combate para inclinar la balanza a favor de tu facción.
- **Pokémon Retenidos:** Si tu equipo es derrotado en un conflicto o incurres en penalizaciones del Sindicato, tus ejemplares pueden ser retenidos y deberás completar misiones de infiltración o negociar para rescatarlos sin perder sus estadísticas ni datos.

---

## 💾 Persistencia de Partida y Compatibilidad

El juego implementa guardado local versionado en el almacenamiento del navegador (`localStorage`):
- Estructura envelope protegida con hash de versión e integridad.
- Totalmente compatible hacia atrás con partidas creadas en versiones previas.
- Respaldo automático antes de cada transacción sensible.
