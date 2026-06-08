// Definição dos slots de pedras do Mir4 (layout em grid).
//
// Pedras Mágicas — 9 slots num grid 3×3:
//   • Fileira 1 (slots 1-3): Tier 1 ou superior
//   • Fileira 2 (slots 4-6): Tier 1 ou superior
//   • Fileira 3 (slots 7-9): Tier 2 ou superior
// Espectromite — 3 slots numa fileira:
//   • Slots 1 e 2: Tier 1 ou superior
//   • Slot 3: Tier 2 ou superior

export const SLOT_TYPE = {
  MAGIC: 'magic', // Pedra Mágica
  SPECTRO: 'spectro', // Espectromite
}

export const MAGIC_SLOTS = [
  // Fileira 1 — Tier 1+
  { id: 'magic-1', type: SLOT_TYPE.MAGIC, row: 1, minTier: 1 },
  { id: 'magic-2', type: SLOT_TYPE.MAGIC, row: 1, minTier: 1 },
  { id: 'magic-3', type: SLOT_TYPE.MAGIC, row: 1, minTier: 1 },
  // Fileira 2 — Tier 1+
  { id: 'magic-4', type: SLOT_TYPE.MAGIC, row: 2, minTier: 1 },
  { id: 'magic-5', type: SLOT_TYPE.MAGIC, row: 2, minTier: 1 },
  { id: 'magic-6', type: SLOT_TYPE.MAGIC, row: 2, minTier: 1 },
  // Fileira 3 — Tier 2+
  { id: 'magic-7', type: SLOT_TYPE.MAGIC, row: 3, minTier: 2 },
  { id: 'magic-8', type: SLOT_TYPE.MAGIC, row: 3, minTier: 2 },
  { id: 'magic-9', type: SLOT_TYPE.MAGIC, row: 3, minTier: 2 },
]

export const SPECTRO_SLOTS = [
  { id: 'spectro-1', type: SLOT_TYPE.SPECTRO, row: 1, minTier: 1 },
  { id: 'spectro-2', type: SLOT_TYPE.SPECTRO, row: 1, minTier: 1 },
  { id: 'spectro-3', type: SLOT_TYPE.SPECTRO, row: 1, minTier: 2 },
]

export const ALL_SLOTS = [...MAGIC_SLOTS, ...SPECTRO_SLOTS]

// Numeral romano para exibir o tier (ex.: tier 2 -> "II").
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
export const tierToRoman = (t) => ROMAN[t] ?? String(t)

// Monta o nome da pedra no padrão do jogo, ex.:
//   "Magic Stone of Force Legendary"  /  "Spectromite Epic II"
// O tier em romano só aparece a partir do Tier 2 (igual ao jogo).
export function buildStoneName(stone) {
  if (!stone) return ''
  const tierSuffix = stone.tier >= 2 ? ` ${tierToRoman(stone.tier)}` : ''
  if (stone.type === SLOT_TYPE.SPECTRO) {
    return `Spectromite ${stone.rarity ?? ''}${tierSuffix}`.trim()
  }
  // attribute já inclui o conector (ex.: "of Force", "of Agility")
  const attr = stone.attribute ? ` ${stone.attribute}` : ''
  return `Magic Stone${attr} ${stone.rarity ?? ''}${tierSuffix}`
    .replace(/\s+/g, ' ')
    .trim()
}
