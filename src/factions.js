export const FACTIONS = Object.freeze({
  guardian: Object.freeze({
    id: 'guardian',
    name: 'Alianza Guardiana',
    shortName: 'Guardiana',
    title: 'Organización Protectora',
    color: '#5b9856',
    accent: '#8cd77e',
    motto: 'Custodia, estabilidad y bienestar Pokémon.',
    description: 'Coalición de entrenadores comprometidos a frenar el contrabando, defender las zonas naturales y rescatar ejemplares cautivos.',
    perks: ['Acceso prioritario a suministros médicos oficiales', 'Bonificación de reputación en rescates'],
  }),
  syndicate: Object.freeze({
    id: 'syndicate',
    name: 'Sindicato Sombra',
    shortName: 'Sindicato',
    title: 'Red Clandestina',
    color: '#8b4b9b',
    accent: '#d47ce8',
    motto: 'Oportunidad, influencia y control de recursos.',
    description: 'Organización clandestina que opera en las sombras, controlando el mercado negro, rutas ocultas y almacenes no regulados.',
    perks: ['Acceso exclusivo al Mercado Negro y dispositivos de sigilo', 'Bonificación en venta de mercancías de contrabando'],
  }),
});

export const INITIAL_TERRITORY = Object.freeze({
  meadow: { guardian: 70, syndicate: 30 },
  forest: { guardian: 50, syndicate: 50 },
  quarry: { guardian: 30, syndicate: 70 },
});

export const CONFLICT_TYPES = Object.freeze([
  {
    type: 'raid',
    title: 'Incursión en Almacén',
    attacker: 'syndicate',
    defender: 'guardian',
    description: 'El Sindicato intenta asaltar un depósito de suministros.',
  },
  {
    type: 'ambush',
    title: 'Emboscada en Ruta',
    attacker: 'syndicate',
    defender: 'guardian',
    description: 'Patrullas de la Alianza han sido interceptadas durante un traslado.',
  },
  {
    type: 'rescue',
    title: 'Operación de Rescate',
    attacker: 'guardian',
    defender: 'syndicate',
    description: 'La Alianza localiza un puesto clandestino donde retienen Pokémon.',
  },
  {
    type: 'dispute',
    title: 'Disputa Territorial',
    attacker: 'guardian',
    defender: 'syndicate',
    description: 'Ambas facciones reclaman el control de un paso estratégico.',
  },
  {
    type: 'contraband_run',
    title: 'Convoy Clandestino',
    attacker: 'guardian',
    defender: 'syndicate',
    description: 'Un cargamento no registrado atraviesa el sector al anochecer.',
  },
]);

export function getFactionDefinition(id) {
  return FACTIONS[id] || FACTIONS.guardian;
}

export function adjustReputation(gameState, factionId, delta) {
  if (!gameState) return;
  if (!gameState.reputation) gameState.reputation = { guardian: 10, syndicate: 0 };
  const current = gameState.reputation[factionId] ?? 0;
  gameState.reputation[factionId] = Math.max(-100, Math.min(100, current + delta));
}

export function createDynamicConflict(idFactory, { zoneId = 'meadow', forceType } = {}) {
  const chosen = forceType
    ? CONFLICT_TYPES.find(c => c.type === forceType) || CONFLICT_TYPES[0]
    : CONFLICT_TYPES[Math.floor(Math.random() * CONFLICT_TYPES.length)];

  return {
    id: `conflict-${idFactory()}`,
    type: chosen.type,
    title: chosen.title,
    zoneId,
    attacker: chosen.attacker,
    defender: chosen.defender,
    description: chosen.description,
    durationMs: 45_000,
    createdAt: Date.now(),
    expiresAt: Date.now() + 45_000,
    resolved: false,
    outcome: null,
  };
}

export function resolveConflict(conflict, gameState, { playerIntervened = false, playerWon = false } = {}) {
  if (conflict.resolved) return conflict.outcome;

  const zone = conflict.zoneId;
  const territory = gameState.territory || (gameState.territory = { ...INITIAL_TERRITORY });
  if (!territory[zone]) territory[zone] = { guardian: 50, syndicate: 50 };

  const playerFaction = gameState.faction || 'guardian';
  let winner = null;

  if (playerIntervened) {
    winner = playerWon ? playerFaction : (playerFaction === 'guardian' ? 'syndicate' : 'guardian');
  } else {
    // Simulated resolution based on territory influence and minor randomness
    const guardianPower = territory[zone].guardian + (gameState.reputation?.guardian || 0) * 0.2;
    const syndicatePower = territory[zone].syndicate + (gameState.reputation?.syndicate || 0) * 0.2;
    const roll = Math.random() * (guardianPower + syndicatePower);
    winner = roll < guardianPower ? 'guardian' : 'syndicate';
  }

  // Shift territory influence
  const shift = playerIntervened ? 12 : 6;
  if (winner === 'guardian') {
    territory[zone].guardian = Math.min(95, territory[zone].guardian + shift);
    territory[zone].syndicate = Math.max(5, 100 - territory[zone].guardian);
  } else {
    territory[zone].syndicate = Math.min(95, territory[zone].syndicate + shift);
    territory[zone].guardian = Math.max(5, 100 - territory[zone].syndicate);
  }

  // Handle consequences on Pokémon (theft or rescue)
  let consequenceMessage = '';
  if (winner === 'syndicate' && conflict.attacker === 'syndicate') {
    // High-stakes raid: syndicate can steal a reserve pokemon if available
    const reserveAvailable = (gameState.collection || []).filter(p => !p.stolen && (!gameState.team || !gameState.team.includes(p.id)));
    if (reserveAvailable.length > 0 && Math.random() < 0.4) {
      const victim = reserveAvailable[Math.floor(Math.random() * reserveAvailable.length)];
      victim.stolen = true;
      victim.stolenBy = 'syndicate';
      victim.stolenAtZone = zone;
      consequenceMessage = `¡El Sindicato capturó a tu ${victim.speciesId.toUpperCase()} en la incursión! Puedes organizar una misión de rescate.`;
    } else {
      consequenceMessage = 'El Sindicato se apoderó de suministros y expandió su influencia en el sector.';
    }
  } else if (winner === 'guardian') {
    // If player or guardians win, check if any stolen pokemon can be recovered
    const stolenPokemon = (gameState.collection || []).filter(p => p.stolen && p.stolenAtZone === zone);
    if (stolenPokemon.length > 0) {
      const recovered = stolenPokemon[0];
      recovered.stolen = false;
      delete recovered.stolenBy;
      delete recovered.stolenAtZone;
      consequenceMessage = `¡Operación exitosa! ${recovered.speciesId.toUpperCase()} fue liberado y devuelto a la reserva.`;
    } else {
      consequenceMessage = 'La Alianza aseguró el perímetro y protegió a los entrenadores del sector.';
    }
  }

  // Adjust player reputation and rewards if intervened
  if (playerIntervened) {
    if (playerWon) {
      adjustReputation(gameState, playerFaction, 8);
      adjustReputation(gameState, playerFaction === 'guardian' ? 'syndicate' : 'guardian', -4);
      if (playerFaction === 'guardian') {
        gameState.money = (gameState.money || 0) + 400;
      } else {
        gameState.darkTokens = (gameState.darkTokens || 0) + 20;
      }
    } else {
      adjustReputation(gameState, playerFaction, -3);
    }
  }

  conflict.resolved = true;
  conflict.outcome = {
    winner,
    zone,
    consequenceMessage,
    playerIntervened,
    playerWon,
    timestamp: Date.now(),
  };

  // Log in event register
  const log = gameState.eventLog || (gameState.eventLog = []);
  log.unshift({
    title: `${conflict.title} (${zone.toUpperCase()})`,
    winner,
    message: consequenceMessage,
    time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
  });
  if (log.length > 25) log.pop();

  return conflict.outcome;
}
