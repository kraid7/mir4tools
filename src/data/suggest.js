// Sugestão de loadout a partir do filtro de encantamentos.
//
// Dada a lista de encantamentos filtrados, escolhe entre TODAS as pedras do set
// (equipadas + bolsa) quais devem ocupar cada slot para maximizar esses stats.
//
// Pontuação: cada encantamento filtrado é normalizado pelo maior valor daquele
// stat entre todas as pedras, virando 0–1. Sem isso o HP (flat, na casa dos
// milhares) esmagaria stats percentuais como CRIT ATK DMG Boost. Cada
// encantamento entra multiplicado pelo peso da sua posição no filtro (ver
// PRIORITY_WEIGHTS); o score da pedra é a soma.
//
// Uma pedra pode ter o MESMO encantamento repetido (ex.: dois "PHYS ATK"): os
// valores repetidos são somados, tanto na pontuação quanto nos totais.
//
// Escolha: como os slots de um mesmo tipo só diferem no tier mínimo, o conjunto
// de pedras "encaixável" é um matroide transversal — um conjunto S cabe se
// |S| <= total de slots e |{tier 1 em S}| <= slots que aceitam tier 1. Logo
// pegar as pedras em ordem decrescente de score, testando essa condição, dá o
// resultado ótimo (não precisa de algoritmo de atribuição).

import { MAGIC_SLOTS, SPECTRO_SLOTS, SLOT_TYPE } from './slots.js'
import { ENCHANT_UNIT_BY_NAME } from './enchantments.js'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const norm = (name) => (name || '').trim().toLowerCase()

// Valor de um encantamento na pedra (0 se ela não tiver). Encantamentos
// repetidos na mesma pedra somam — é assim que o jogo aplica.
export function valueOf(stone, key) {
  let sum = 0
  for (const e of stone?.enchantments || []) {
    if (norm(e.name) === key) sum += num(e.value)
  }
  return sum
}

// Peso de cada encantamento conforme a posição no filtro: o 1º é o mais
// importante. Com N filtros os pesos são N, N-1, ..., 1 — o topo pesa mais sem
// zerar os de baixo (que ainda servem de desempate e de ganho real).
export function priorityWeight(index, total) {
  return Math.max(1, total - index)
}

// Pedras equipadas + bolsa numa lista única, cada uma sabendo de onde veio.
export function candidatesFrom(stones, bag) {
  const equipped = Object.entries(stones || {}).map(([slotId, stone]) => ({
    key: `slot:${slotId}`,
    stone,
    from: 'slot',
    slotId,
  }))
  const inBag = (bag || []).map((item) => ({
    key: `bag:${item.id}`,
    stone: item.stone,
    from: 'bag',
    bagId: item.id,
  }))
  return [...equipped, ...inBag]
}

// Acrescenta .score a cada candidato: normalizado por stat e multiplicado pelo
// peso da posição no filtro (o 1º encantamento manda mais).
function withScores(candidates, keys) {
  const max = new Map()
  for (const k of keys) {
    let m = 0
    for (const c of candidates) m = Math.max(m, Math.abs(valueOf(c.stone, k)))
    max.set(k, m)
  }
  return candidates.map((c) => {
    let score = 0
    keys.forEach((k, i) => {
      const m = max.get(k)
      if (m > 0) score += priorityWeight(i, keys.length) * (valueOf(c.stone, k) / m)
    })
    return { ...c, score }
  })
}

const tierOf = (c) => c.stone?.tier ?? 1

// Escolhe as melhores pedras de um tipo e as distribui entre os slots daquele
// tipo. Empate no score: mantém quem já está equipado (evita bagunçar o set à
// toa). Retorna { [slotId]: candidato }.
function planGroup(slots, candidates) {
  const lowSlots = slots.filter((s) => s.minTier <= 1) // aceitam tier 1
  const highSlots = slots.filter((s) => s.minTier >= 2) // só tier 2+

  const ranked = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if ((a.from === 'slot') !== (b.from === 'slot')) return a.from === 'slot' ? -1 : 1
    return tierOf(b) - tierOf(a)
  })

  // Greedy sobre o matroide: pega enquanto couber.
  const chosen = []
  let usedTier1 = 0
  for (const c of ranked) {
    if (chosen.length >= slots.length) break
    if (tierOf(c) >= 2) {
      chosen.push(c)
    } else if (usedTier1 < lowSlots.length) {
      chosen.push(c)
      usedTier1 += 1
    }
  }

  // Distribuição: os slots de tier 2+ têm que receber pedras tier 2+. Reserva
  // essas primeiro (preferindo quem já está num slot alto), e o resto vai para
  // os slots de tier 1+. Dentro de cada grupo, quem já estava no slot fica nele.
  const tier2 = chosen.filter((c) => tierOf(c) >= 2)
  const tier1 = chosen.filter((c) => tierOf(c) < 2)
  const highIds = new Set(highSlots.map((s) => s.id))

  const forHigh = [...tier2]
    .sort((a, b) => {
      const aIn = a.from === 'slot' && highIds.has(a.slotId)
      const bIn = b.from === 'slot' && highIds.has(b.slotId)
      if (aIn !== bIn) return aIn ? -1 : 1
      return b.score - a.score
    })
    .slice(0, highSlots.length)

  const forHighKeys = new Set(forHigh.map((c) => c.key))
  const forLow = [...tier2.filter((c) => !forHighKeys.has(c.key)), ...tier1]

  const assignments = {}
  const place = (group, groupSlots) => {
    const free = new Set(groupSlots.map((s) => s.id))
    const pending = []
    for (const c of group) {
      // Já está neste slot? Mantém — nenhuma troca desnecessária.
      if (c.from === 'slot' && free.has(c.slotId)) {
        assignments[c.slotId] = c
        free.delete(c.slotId)
      } else {
        pending.push(c)
      }
    }
    const openSlots = groupSlots.filter((s) => free.has(s.id))
    pending.forEach((c, i) => {
      const slot = openSlots[i]
      if (slot) assignments[slot.id] = c
    })
  }
  place(forHigh, highSlots)
  place(forLow, lowSlots)

  return assignments
}

// Total de um encantamento somando as pedras equipadas de um loadout.
function totalFor(stoneList, key) {
  return stoneList.reduce((sum, stone) => sum + valueOf(stone, key), 0)
}

// Monta a sugestão completa. `names` são os encantamentos do filtro.
// Retorna null se não houver filtro.
export function suggestLoadout(stones, bag, names) {
  const keys = [...new Set((names || []).map(norm).filter(Boolean))]
  if (keys.length === 0) return null

  const all = withScores(candidatesFrom(stones, bag), keys)
  const magic = all.filter((c) => c.stone?.type === SLOT_TYPE.MAGIC)
  const spectro = all.filter((c) => c.stone?.type === SLOT_TYPE.SPECTRO)

  const assignments = {
    ...planGroup(MAGIC_SLOTS, magic),
    ...planGroup(SPECTRO_SLOTS, spectro),
  }

  const usedKeys = new Set(Object.values(assignments).map((c) => c.key))
  const leftover = all.filter((c) => !usedKeys.has(c.key))

  // Diferenças em relação ao que está equipado agora.
  const changes = []
  for (const slot of [...MAGIC_SLOTS, ...SPECTRO_SLOTS]) {
    const before = stones?.[slot.id] ?? null
    const after = assignments[slot.id] ?? null
    const same = after?.from === 'slot' && after.slotId === slot.id
    if (!same && (before || after)) {
      changes.push({ slot, before, after: after?.stone ?? null, source: after ?? null })
    }
  }

  const beforeStones = Object.values(stones || {})
  const afterStones = Object.values(assignments).map((c) => c.stone)
  const totals = keys.map((key, i) => {
    const display = (names || []).find((n) => norm(n) === key) ?? key
    const unit =
      ENCHANT_UNIT_BY_NAME[display] ??
      all
        .flatMap((c) => c.stone?.enchantments || [])
        .find((e) => norm(e.name) === key)?.unit ??
      'flat'
    return {
      name: display,
      unit,
      before: totalFor(beforeStones, key),
      after: totalFor(afterStones, key),
      order: i,
      weight: priorityWeight(i, keys.length),
    }
  })

  return { assignments, leftover, changes, totals }
}

// Converte a sugestão no formato que o contexto aplica: mapa de slots + bolsa.
// Itens que já estavam na bolsa mantêm o id (não "piscam" na lista).
export function loadoutToState(suggestion) {
  const stones = {}
  for (const [slotId, c] of Object.entries(suggestion.assignments)) {
    stones[slotId] = c.stone
  }
  const bag = suggestion.leftover.map((c) => ({
    id: c.from === 'bag' ? c.bagId : undefined,
    stone: c.stone,
  }))
  return { stones, bag }
}
