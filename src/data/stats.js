// Soma dos encantamentos das pedras equipadas, agrupados por nome.
// Pedras só na bolsa não entram (status reflete o build equipado).

import { ENCHANTMENTS } from './enchantments.js'

// Ordem canônica (segue a lista oficial); desconhecidos vão para o fim.
const ORDER = new Map(ENCHANTMENTS.map((e, i) => [e.name.toLowerCase(), i]))

// Recebe o mapa { [slotId]: stone } e devolve [{ name, unit, total, count }]
// somando o valor de cada encantamento por nome (case-insensitive).
export function sumEnchantments(stones) {
  const acc = new Map()
  for (const stone of Object.values(stones || {})) {
    for (const en of stone.enchantments || []) {
      const name = (en.name || '').trim()
      if (!name || en.value == null) continue
      const key = name.toLowerCase()
      const cur = acc.get(key)
      if (cur) {
        cur.total += Number(en.value) || 0
        cur.count += 1
      } else {
        acc.set(key, { name, unit: en.unit, total: Number(en.value) || 0, count: 1 })
      }
    }
  }
  return sortByCanonical([...acc.values()])
}

// Formata o valor de um stat (en-US; sufixo % quando percentual).
export function formatStatValue(value, unit) {
  if (value == null) return '—'
  const n = Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })
  return unit === 'percent' ? `${n}%` : n
}

// Encantamentos de uma pedra que batem com os nomes do filtro (objetos completos
// {name, value, unit}), na ordem canônica. Se a pedra tiver o mesmo encantamento
// repetido, as ocorrências viram uma só com os valores somados (é o efeito real
// na pedra — e evita duas linhas iguais na tela).
export function matchedEnchantments(stone, names) {
  if (!names?.length) return []
  const wanted = new Set(names.map((n) => n.toLowerCase()))
  const acc = new Map()
  for (const e of stone.enchantments || []) {
    const key = (e.name || '').toLowerCase()
    if (!wanted.has(key)) continue
    const cur = acc.get(key)
    if (cur) cur.value = (Number(cur.value) || 0) + (Number(e.value) || 0)
    else acc.set(key, { ...e, value: Number(e.value) || 0 })
  }
  return sortByCanonical([...acc.values()])
}

function sortByCanonical(list) {
  return list.sort((a, b) => {
    const ia = ORDER.has(a.name.toLowerCase()) ? ORDER.get(a.name.toLowerCase()) : Infinity
    const ib = ORDER.has(b.name.toLowerCase()) ? ORDER.get(b.name.toLowerCase()) : Infinity
    if (ia !== ib) return ia - ib
    return a.name.localeCompare(b.name)
  })
}
