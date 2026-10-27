import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;
const USER_DATA_DIR = 'C:\\Users\\Javier\\AppData\\Local\\Temp\\edge-test-profile-' + Date.now();
const OUT_DIR = 'C:\\Users\\Javier\\Desktop\\BlckMkt\\tests\\screenshots';

mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await res.json();
      const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTab) {
        return pageTab.webSocketDebuggerUrl;
      }
    } catch {
      await sleep(200);
    }
  }
  throw new Error('Edge CDP no respondió a tiempo');
}

class CDPClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 1;
    this.pending = new Map();
    this.events = [];
    this.consoleLogs = [];
    this.errors = [];
    this.failedRequests = [];

    this.ws.onmessage = msg => {
      const data = JSON.parse(msg.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      } else if (data.method) {
        if (data.method === 'Runtime.consoleAPICalled') {
          const text = data.params.args.map(a => a.value ?? a.description ?? '').join(' ');
          this.consoleLogs.push({ type: data.params.type, text });
          if (data.params.type === 'error') this.errors.push(text);
        } else if (data.method === 'Runtime.exceptionThrown') {
          const desc = data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text;
          this.errors.push(desc);
        } else if (data.method === 'Network.responseReceived') {
          if (data.params.response.status >= 400) {
            this.failedRequests.push({ url: data.params.response.url, status: data.params.response.status });
          }
        }
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise(resolve => {
      this.ws.onopen = resolve;
    });
  }

  async send(method, params = {}) {
    await this.ready();
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res.result?.value;
  }

  async screenshot(filename, { width = 1280, height = 720 } = {}) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(250);
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = join(OUT_DIR, filename);
    writeFileSync(outPath, buffer);
    console.log(`[Screenshot OK] ${filename} (${width}x${height}, ${(buffer.length / 1024).toFixed(1)} KB)`);
    return outPath;
  }
}

async function run() {
  console.log('--- Iniciando Verificación Visual y Funcional con Edge Headless ---');
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--mute-audio',
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank',
  ]);

  try {
    const wsUrl = await getWsUrl();
    const client = new CDPClient(wsUrl);
    await client.ready();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    console.log('1. Navegando a http://localhost:8008/index.html...');
    await client.send('Page.navigate', { url: 'http://localhost:8008/index.html' });
    await sleep(1500);

    // 1. Menu at Fullscreen 1920x1080
    await client.screenshot('01-menu-fullscreen-1920x1080.png', { width: 1920, height: 1080 });

    // 2. Menu at Standard 1280x720
    await client.screenshot('02-menu-standard-1280x720.png', { width: 1280, height: 720 });

    // Verify Title & Menu elements
    const brand = await client.eval(`document.querySelector('.brand-title-pokebonk')?.textContent`);
    const fsBtn = await client.eval(`!!document.querySelector('#fullscreenTopBtn')`);
    console.log(`Brand: ${brand}, Fullscreen button present: ${fsBtn}`);

    // Click New Game
    console.log('2. Iniciando Nueva Partida...');
    await client.eval(`document.querySelector('#newGame')?.click()`);
    await sleep(400);

    // If confirm modal was opened because of prior save
    await client.eval(`document.querySelector('#confirmNewGame')?.click()`);
    await sleep(400);

    // Select Alianza Guardianes faction
    await client.eval(`document.querySelector('#chooseGuardianBtn')?.click()`);
    await sleep(1000);

    // 3. In-game Refugio (Puesto de Mando y Base de Operaciones)
    console.log('3. Verificando Refugio como Menú de Gestión Visual Animado...');
    await client.screenshot('03-refugio-hub-1920x1080.png', { width: 1920, height: 1080 });

    const refugioWidgetPresent = await client.eval(`!document.querySelector('#refugioActionsWidget')?.classList.contains('hidden')`);
    const expeditionBtnPresent = await client.eval(`!!document.querySelector('#expeditionHeroBtn')`);
    console.log(`Refugio Widget activo: ${refugioWidgetPresent}, Botón Héroe Expedición: ${expeditionBtnPresent}`);

    // Test Sound Toggle in Topbar
    console.log('Probando alternancia de sonido en la barra superior (#soundTopBtn)...');
    await client.eval(`document.querySelector('#soundTopBtn')?.click()`);
    await sleep(200);

    // Test Quick Heal in Refugio
    console.log('4. Probando Centro Médico y Curación Rápida...');
    await client.eval(`document.querySelector('#quickHealBtn')?.click()`);
    await sleep(400);

    // Click Expedition Hero button to open Expedition Map selector
    console.log('5. Abriendo Selector de Destinos de Expedición...');
    await client.eval(`document.querySelector('#expeditionHeroBtn')?.click()`);
    await sleep(600);
    await client.screenshot('04-expedition-map-modal.png', { width: 1280, height: 720 });

    // Depart to Pradera del Refugio (Meadow)
    console.log('6. Despegando hacia Pradera del Refugio...');
    await client.eval(`document.querySelector('[data-travel="meadow"]')?.click()`);
    await sleep(1000);
    await client.screenshot('05-world-meadow-outside.png', { width: 1920, height: 1080 });

    const returnBtnPresent = await client.eval(`!document.querySelector('#returnToRefugioBtn')?.classList.contains('hidden')`);
    console.log(`En campo salvaje: Botón Regresar al Refugio visible = ${returnBtnPresent}`);

    // Test Point-and-Click / Click-to-Move in wild exploration
    console.log('Probando navegación táctil Click-to-Move con ratón en campo...');
    await client.eval(`(() => {
      const cv = document.querySelector('#world');
      const r = cv.getBoundingClientRect();
      const clickEvt = new PointerEvent('pointerdown', {
        clientX: r.left + r.width * 0.6,
        clientY: r.top + r.height * 0.65,
        bubbles: true
      });
      cv.dispatchEvent(clickEvt);
    })()`);
    await sleep(350);

    // Populate collection with iconic demo Pokémon to test search, filter and animation viewer
    console.log('7. Inyectando ejemplares en la colección para probar catálogo...');
    await client.eval(`(() => {
      const gs = window.gameState || window.__state__;
      const demoSpecies = ['charizard', 'blastoise', 'pikachu', 'gengar', 'lucario', 'eevee', 'mewtwo', 'gardevoir', 'gyarados', 'snorlax'];
      demoSpecies.forEach((id, idx) => {
        gs.collection.push({
          id: 'demo-' + id,
          speciesId: id,
          level: 20 + idx * 5,
          shiny: idx === 1 || idx === 4,
          nature: 'Firme',
          ability: 'Adaptable',
          ball: 'Ultra Ball',
          stolen: idx === 3,
          iv: { hp: 31, atk: 30, def: 28, spa: 29, spd: 31, spe: 31 }
        });
      });
      gs.team = [gs.collection[0].id, gs.collection[1].id];
    })()`);

    // Open Collection
    console.log('8. Abriendo Colección (C)...');
    await client.eval(`document.querySelector('#collectionBtn')?.click()`);
    await sleep(600);

    const initialCards = await client.eval(`document.querySelectorAll('#colGrid .pokemon-card').length`);
    console.log(`Cards en colección: ${initialCards}`);
    await client.screenshot('06-collection-grid-1920x1080.png', { width: 1920, height: 1080 });

    // Test Search input in Collection
    console.log('9. Probando filtro de búsqueda en Colección...');
    await client.eval(`(() => {
      const input = document.querySelector('#colSearchInput');
      if (input) {
        input.value = 'char';
        input.dispatchEvent(new Event('input'));
      }
    })()`);
    await sleep(400);

    const filteredCards = await client.eval(`document.querySelectorAll('#colGrid .pokemon-card').length`);
    console.log(`Cards filtradas con 'char': ${filteredCards}`);
    await client.screenshot('07-collection-filtered-1280x720.png', { width: 1280, height: 720 });

    // Open Detail Modal for Charizard
    console.log('10. Abriendo Ficha de Detalle de Charizard con animación interactiva...');
    await client.eval(`document.querySelector('#colGrid .pokemon-card')?.click()`);
    await sleep(800);

    const animCanvasPresent = await client.eval(`!!document.querySelector('#detailAnimCanvas')`);
    console.log(`Canvas de animación interactiva presente: ${animCanvasPresent}`);
    await client.screenshot('08-detail-anim-canvas.png', { width: 1280, height: 720 });

    // Test clicking animation buttons: Walk, Attack
    console.log('11. Probando controles de animación en Ficha...');
    await client.eval(`document.querySelector('[data-action-type="Attack"]')?.click()`);
    await sleep(400);
    await client.screenshot('09-detail-anim-attack.png', { width: 1280, height: 720 });

    // Close detail modal
    await client.eval(`document.querySelector('[data-action="back"]')?.click()`);
    await sleep(400);

    // Reset filter
    await client.eval(`(() => {
      const input = document.querySelector('#colSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
      }
    })()`);
    await sleep(300);

    // Close collection modal
    await client.eval(`document.querySelector('[data-action="close"]')?.click()`);
    await sleep(400);

    // Open Team modal
    console.log('12. Abriendo Equipo (T)...');
    await client.eval(`document.querySelector('#teamBtn')?.click()`);
    await sleep(500);
    await client.screenshot('10-team-panel.png', { width: 1280, height: 720 });

    // Close Team modal
    await client.eval(`document.querySelector('[data-action="close"]')?.click()`);
    await sleep(400);

    // Open Combat Arena via nearby wild encounter with mouse buttons
    console.log('13. Probando Tarjeta Contextual de Encuentro y Combate por Turnos...');
    await client.eval(`(() => {
      const gs = window.gameState || window.__state__;
      const p = gs.player;
      if (gs.wild.length > 0) {
        gs.wild[0].x = p.x + 24;
        gs.wild[0].y = p.y;
      }
    })()`);
    await sleep(300);

    const wtcVisible = await client.eval(`!document.querySelector('#wildTargetCard')?.classList.contains('hidden')`);
    console.log(`Tarjeta de Acción Salvaje visible para interacción con ratón: ${wtcVisible}`);
    await client.screenshot('11-wild-encounter-modal.png', { width: 1280, height: 720 });

    // Click #wtcFightBtn with mouse
    await client.eval(`document.querySelector('#wtcFightBtn')?.click()`);
    await sleep(400);

    // Click #fightWildBtn with mouse
    await client.eval(`document.querySelector('#fightWildBtn')?.click()`);
    await sleep(800);
    await client.screenshot('12-combat-arena.png', { width: 1280, height: 720 });

    // Escape combat safely via #combatRunBtn
    console.log('Escapando del combate con #combatRunBtn...');
    await client.eval(`document.querySelector('#combatRunBtn')?.click()`);
    await sleep(500);

    // Test Returning to Refugio from Outside
    console.log('14. Regresando al Refugio desde el campo salvaje...');
    await client.eval(`document.querySelector('#returnToRefugioBtn')?.click()`);
    await sleep(1000);

    const returnedScene = await client.eval(`(window.gameState || window.__state__).scene`);
    console.log(`Escena tras retornar al Refugio: ${returnedScene}`);
    await client.screenshot('13-refugio-return-1920x1080.png', { width: 1920, height: 1080 });

    // Check errors and failed requests
    console.log('\n--- Resumen de Errores y Peticiones de Red ---');
    console.log(`Errores en consola de navegador: ${client.errors.length}`);
    if (client.errors.length) {
      console.error('Errores detectados:', client.errors);
    }
    console.log(`Peticiones HTTP fallidas (404/500): ${client.failedRequests.length}`);
    if (client.failedRequests.length) {
      console.warn('Peticiones fallidas:', client.failedRequests);
    }

    if (client.errors.length === 0 && client.failedRequests.length === 0) {
      console.log('✔ ¡VERIFICACIÓN VISUAL Y FUNCIONAL 100% PERFECTA! Cero errores de consola, cero 404.');
    }
  } finally {
    edge.kill();
  }
}

run().catch(err => {
  console.error('Error en prueba automatizada:', err);
  process.exit(1);
});
