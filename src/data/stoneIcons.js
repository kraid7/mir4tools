// Ícones reais das pedras (arte oficial do MIR4, servida de public/icons/).
// Origem: API do xdraco/MIR4 (webapi.mir4global.com/nft/character/magicstone),
// que mapeia cada pedra para uma "gema" em file.mir4global.com. Baixamos a
// matriz cor × raridade para public/icons/jewel_{cor}_{num}.png.
//
// O ícone depende de TIPO (cor) e RARIDADE (número), NÃO do tier:
//   "Vigor" e "Vigor II" usam o mesmo ícone.

import { SLOT_TYPE } from './slots.js'

// Atributo -> cor da gema (mapeamento oficial vindo da API).
const COLOR_BY_ATTR = {
  vigor: 'red',
  mana: 'cyan',
  focus: 'darkpurple',
  force: 'green',
  destruction: 'blue',
  awakening: 'yellow',
  growth: 'orange',
  agility: 'navy',
  antidemon: 'dark',
  precision: 'white',
}

// Raridade -> número do arquivo da gema.
const NUM_BY_RARITY = {
  common: '001',
  uncommon: '002',
  rare: '003',
  epic: '004',
  legendary: '005',
  mythic: '006',
}

// Retorna o caminho do ícone real da pedra, ou null (usa fallback estilizado).
export function getStoneIcon(stone) {
  if (!stone) return null

  const num = NUM_BY_RARITY[(stone.rarity || '').trim().toLowerCase()]
  if (!num) return null

  let color
  if (stone.type === SLOT_TYPE.SPECTRO) {
    color = 'rainbow' // Spectrumite usa a gema "arco-íris"
  } else {
    const attr = (stone.attribute || '')
      .replace(/^of\s+/i, '')
      .trim()
      .toLowerCase()
    color = COLOR_BY_ATTR[attr]
  }
  if (!color) return null

  return `/icons/jewel_${color}_${num}.png`
}
