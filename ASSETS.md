# Registro de Recursos Visuales y Estructura — Edición Expandida (74 Especies)

## Ilustraciones de interfaz
- `assets/ui/rocket-fortress-night.png`: paisaje pixel-art nocturno suministrado por el usuario y usado como fondo fijo del menú principal.
- `src/menu-background.js`: capa Canvas transparente para la animación ambiental del menú; no añade imágenes ni dependencias externas.
- `assets/ui/faction-trainers.png`: ilustración vertical suministrada por el usuario para Entrenador Pokémon.
- `assets/ui/faction-rocket.png`: ilustración vertical suministrada por el usuario para Team Rocket.
- `assets/ui/poster-trainers.svg` y `assets/ui/poster-rocket.svg`: carteles anteriores, conservados como recursos sin uso.

## 1. Sprites Estáticos y Variantes Variocolor (74 Especies)
Ubicación física:
- `assets/pokemon/sprites/{id}.png`: 74 imágenes PNG individuales en alta definición pixel-art centradas a 128×128 píxeles.
- `assets/pokemon/shiny/{id}.png`: 74 variantes variocolor oficiales correspondientes, con paletas cromáticas auténticas extraídas de SpriteCollab (`s/`).
- `assets/pokemon/fallback.svg`: Silueta vectorial de contingencia para resolución de activos imprevistos.

### Catálogo Completo de las 74 Especies Registradas:
1. **Las 12 Especies Fundacionales (Preservadas al 100%):**
   - Rattata, Zubat, Oddish, Geodude, Meowth, Gastly, Growlithe, Abra, Magnemite, Eevee, Dratini, Ditto.
2. **Iniciales de Kanto y Líneas Evolutivas:**
   - Bulbasaur, Ivysaur, Venusaur.
   - Charmander, Charmeleon, Charizard.
   - Squirtle, Wartortle, Blastoise.
3. **Evoluciones Clásicas e Icónicas:**
   - Raichu, Arbok, Sandslash, Ninetales, Golbat, Vileplume, Alakazam, Machamp, Golem, Gengar, Onix, Gengar, Marowak, Arcanine.
4. **Evoluciones de Eevee (Eeveeluciones):**
   - Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon.
5. **Especies de Campo, Caverna y Costa:**
   - Butterfree, Beedrill, Pidgeot, Sandshrew, Vulpix, Jigglypuff, Diglett, Dugtrio, Psyduck, Golduck, Mankey, Primeape, Machop, Machoke, Slowpoke, Slowbro, Magnemite, Magneton, Cubone, Scyther, Gyarados, Lapras, Snorlax, Dragonair, Dragonite.
6. **Especies Icónicas Multigeneracionales y Legendarios:**
   - Pikachu, Lucario, Gardevoir, Tyranitar, Blaziken, Mudkip, Swampert, Torchic, Greninja, Mewtwo, Mew, Rayquaza.

## 2. Hojas de Animación 8-Way de Campo, Interfaz y Combate
Ubicación física:
- `assets/pokemon/anim/{especie}/`:
  - `Idle.png`: Animación continua de reposo en 8 orientaciones angulares.
  - `Walk.png`: Ciclo de marcha y desplazamiento direccional.
  - `Attack.png`: Animación de embestida o ataque ofensivo.
  - `Hurt.png`: Reacción de impacto y retroceso.
  - `Faint.png`: Secuencia de debilitamiento.
  - Subdirectorio `s/`: Variantes variocolor completas para cada acción y dirección.

Metadatos técnicos:
- `src/anim-data.js`: Diccionario integral `ANIM_META` que define el ancho de celda (`w`), alto (`h`), número de fotogramas (`n`), filas angulares (`r`), duraciones en ticks (`d`) y coordenadas de anclaje de contacto con el suelo (`ax`, `ay`).

## 3. Fuentes Tipográficas Locales
Ubicación: `assets/fonts/`
- `PixelifySans.ttf`: Fuente titular para interfaz de usuario pixel-art nítida.
- `PixelifyPS-400.ttf`: Peso estándar para cuerpos de texto, diálogos y fichas técnicas.
- `PixelifyPS-700.ttf`: Peso en negrita para encabezados, estados y valores numéricos.
- `OFL.txt`: Licencia de código abierto SIL Open Font License 1.1.
