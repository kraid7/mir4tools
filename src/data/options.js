// Sugestões para os comboboxes do cadastro. São apenas sugestões (datalist):
// o usuário pode digitar valores fora da lista. Futuramente podem virar fixas.

// Atributos das Pedras Mágicas — já incluem o conector ("of") para montar o
// nome no padrão do jogo (ver buildStoneName em slots.js). Nomes em inglês
// conforme a MIR4 Wiki.
export const ATTRIBUTE_OPTIONS = [
  'of Vigor', // HP — gema vermelha
  'of Mana', // MP — gema ciano
  'of Focus', // Monster ATK DMG boost — gema roxo-escuro
  'of Force', // Monster DMG reduction — gema verde
  'of Destruction', // CRIT ATK DMG boost — gema azul
  'of Awakening', // All ATK DMG boost — gema amarela
  'of Growth', // Hunting EXP boost — gema laranja
  'of Agility', // EVA — gema azul-marinho
  'of Antidemon', // Antidemon Power — gema escura
  'of Precision', // Accuracy — gema branca
]

export const RARITY_OPTIONS = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
]

// Unidade do valor de um encantamento.
export const ENCHANT_UNIT = {
  PERCENT: 'percent', // exibido como "12,5%"
  FLAT: 'flat', // valor decimal/absoluto, ex.: "1,5"
}
