// Sugestão de loadout a partir do filtro de encantamentos.
//
// Dada a lista de encantamentos filtrados, escolhe entre TODAS as pedras do set
// (equipadas + bolsa) quais devem ocupar cada slot.
//
// ——— Como um stat é medido ———
// Cada encantamento é normalizado pelo maior valor daquele stat entre todas as
// pedras. Sem isso o HP (flat, na casa dos milhares) esmagaria stats
// percentuais como CRIT ATK DMG Boost. A posição no filtro vira peso: com N
// encantamentos os pesos são N, N-1, ..., 1 (ver priorityWeight).
//
// ——— Como o conjunto é medido (o "balanceamento") ———
// Somar os stats direto (modo 'total') maximiza a soma, mas empilha o filtro do
// topo: 9 pedras de CRIT rendem mais pontos que 6 de CRIT + 3 do segundo stat,
// e você acaba com zero do segundo. O modo 'balanced' (padrão) aplica retorno
// decrescente — o valor de um stat é √(total), não total. Como a raiz é
// côncava, os primeiros pontos de um stat que falta valem muito mais que o
// décimo ponto de um que já está alto, então uma pedra que cobre 2 filtros
// vence naturalmente uma que só reforça o primeiro. Sem bônus arbitrário.
//
// ——— Como as pedras são escolhidas ———
// Com objetivo linear os slots formam um matroide e o greedy por score é ótimo.
// Com o objetivo côncavo isso deixa de valer (e os dois grids deixam de ser
// independentes, já que os stats somam entre pedras mágicas e espectromitas).
// Então: greedy por ganho marginal sobre o conjunto todo + busca local por
// trocas até não melhorar mais. Com 12 slots isso roda instantâneo e na prática
// chega no ótimo.
//
// Uma pedra pode ter o MESMO encantamento repetido (ex.: dois "PHYS ATK"): os
// valores repetidos são somados, tanto na pontuação quanto nos totais.

import { MAGIC_SLOTS, SPECTRO_SLOTS, SLOT_TYPE } from './slots.js'
import { ENCHANT_UNIT_BY_NAME } from './enchantments.js'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const norm = (name) => (name || '').trim().toLowerCase()

// Modos de balanceamento entre os encantamentos do filtro.
export const BALANCE = {
  BALANCED: 'balanced', // retorno decrescente: cobre todos os filtros
  TOTAL: 'total', // soma pura: maximiza o total, pode zerar um filtro
}

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

const tierOf = (c) => c.stone?.tier ?? 1

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

// ——— Capacidade dos grids ———
// Um grupo aceita no máximo `slots.length` pedras, das quais no máximo
// `lowSlots.length` podem ser tier 1 (o resto dos slots exige tier 2+).
function groupsFor() {
  const build = (slots) => ({
    slots,
    lowSlots: slots.filter((s) => s.minTier <= 1),
    highSlots: slots.filter((s) => s.minTier >= 2),
    count: 0,
    tier1: 0,
  })
  return {
    [SLOT_TYPE.MAGIC]: build(MAGIC_SLOTS),
    [SLOT_TYPE.SPECTRO]: build(SPECTRO_SLOTS),
  }
}

const groupOf = (groups, c) => groups[c.stone?.type] ?? null

function fits(groups, c) {
  const g = groupOf(groups, c)
  if (!g) return false
  if (g.count >= g.slots.length) return false
  if (tierOf(c) < 2 && g.tier1 >= g.lowSlots.length) return false
  return true
}

function take(groups, c, dir = 1) {
  const g = groupOf(groups, c)
  if (!g) return
  g.count += dir
  if (tierOf(c) < 2) g.tier1 += dir
}

// ——— Objetivo ———
// `totals` é o total bruto de cada encantamento filtrado no conjunto atual.
function makeObjective(keys, maxes, weights, mode) {
  const shape = mode === BALANCE.TOTAL ? (x) => x : (x) => Math.sqrt(x)
  return (totals) => {
    let v = 0
    for (let i = 0; i < keys.length; i++) {
      const m = maxes[i]
      if (m > 0) v += weights[i] * shape(Math.max(0, totals[i]) / m)
    }
    return v
  }
}

const addTo = (totals, stone, keys, dir = 1) =>
  totals.map((t, i) => t + dir * valueOf(stone, keys[i]))

// Escolhe o conjunto de pedras. Retorna a lista escolhida.
function pickStones(candidates, keys, maxes, weights, mode) {
  const objective = makeObjective(keys, maxes, weights, mode)
  const groups = groupsFor()
  const chosen = []
  const remaining = new Set(candidates)
  let totals = keys.map(() => 0)
  let current = objective(totals)

  // 1) Greedy por ganho marginal: a cada rodada entra a pedra que mais
  // acrescenta ao conjunto — é isso que faz a pedra que cobre um filtro ainda
  // descoberto passar na frente da que só reforça um filtro já saturado.
  for (;;) {
    let best = null
    let bestGain = 1e-12 // só entra quem acrescenta algo
    let bestTotals = null
    for (const c of remaining) {
      if (!fits(groups, c)) continue
      const next = addTo(totals, c.stone, keys)
      const gain = objective(next) - current
      const better =
        gain > bestGain ||
        // Empate: mantém quem já está equipado (menos troca à toa).
        (gain === bestGain && best && c.from === 'slot' && best.from !== 'slot')
      if (better) {
        best = c
        bestGain = gain
        bestTotals = next
      }
    }
    if (!best) break
    chosen.push(best)
    remaining.delete(best)
    take(groups, best)
    totals = bestTotals
    current = objective(totals)
  }

  // 2) Busca local: troca uma escolhida por uma de fora sempre que melhorar.
  // Corrige a miopia do greedy (uma pedra boa cedo pode bloquear um par melhor).
  for (let pass = 0; pass < 40; pass++) {
    let improved = false
    for (let i = 0; i < chosen.length; i++) {
      const out = chosen[i]
      let bestIn = null
      let bestVal = current
      let bestTotals = null
      for (const c of remaining) {
        if (c.stone?.type !== out.stone?.type) continue
        // Cabe no lugar da que sai? Só o tier pode inviabilizar.
        take(groups, out, -1)
        const ok = fits(groups, c)
        take(groups, out, 1)
        if (!ok) continue
        const next = addTo(addTo(totals, out.stone, keys, -1), c.stone, keys)
        const val = objective(next)
        if (val > bestVal + 1e-12) {
          bestIn = c
          bestVal = val
          bestTotals = next
        }
      }
      if (bestIn) {
        take(groups, out, -1)
        take(groups, bestIn, 1)
        remaining.add(out)
        remaining.delete(bestIn)
        chosen[i] = bestIn
        totals = bestTotals
        current = bestVal
        improved = true
      }
    }
    if (!improved) break
  }

  // 3) Slots que sobraram: completa com o resto, preferindo quem já está
  // equipado, para não desmontar o set por nada.
  const rest = [...remaining].sort((a, b) => {
    if ((a.from === 'slot') !== (b.from === 'slot')) return a.from === 'slot' ? -1 : 1
    return tierOf(b) - tierOf(a)
  })
  for (const c of rest) {
    if (!fits(groups, c)) continue
    chosen.push(c)
    take(groups, c)
  }

  return chosen
}

// Distribui as pedras escolhidas de um tipo entre os slots daquele tipo.
// Os slots de tier 2+ têm que receber pedras tier 2+, então essas são
// reservadas primeiro (preferindo quem já está num slot alto); o resto vai para
// os slots de tier 1+. Em ambos os grupos, quem já estava no slot fica nele.
function placeGroup(slots, chosen, rank) {
  const lowSlots = slots.filter((s) => s.minTier <= 1)
  const highSlots = slots.filter((s) => s.minTier >= 2)
  const highIds = new Set(highSlots.map((s) => s.id))

  const tier2 = chosen.filter((c) => tierOf(c) >= 2)
  const tier1 = chosen.filter((c) => tierOf(c) < 2)

  const forHigh = [...tier2]
    .sort((a, b) => {
      const aIn = a.from === 'slot' && highIds.has(a.slotId)
      const bIn = b.from === 'slot' && highIds.has(b.slotId)
      if (aIn !== bIn) return aIn ? -1 : 1
      return rank(b) - rank(a)
    })
    .slice(0, highSlots.length)

  const forHighKeys = new Set(forHigh.map((c) => c.key))
  const forLow = [...tier2.filter((c) => !forHighKeys.has(c.key)), ...tier1]

  const assignments = {}
  const place = (group, groupSlots) => {
    const free = new Set(groupSlots.map((s) => s.id))
    const pending = []
    for (const c of group) {
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

// Monta a sugestão completa. `names` são os encantamentos do filtro, na ordem
// de prioridade. Retorna null se não houver filtro.
export function suggestLoadout(stones, bag, names, mode = BALANCE.BALANCED) {
  const keys = [...new Set((names || []).map(norm).filter(Boolean))]
  if (keys.length === 0) return null

  const all = candidatesFrom(stones, bag)
  const maxes = keys.map((k) =>
    all.reduce((m, c) => Math.max(m, Math.abs(valueOf(c.stone, k))), 0),
  )
  const weights = keys.map((_, i) => priorityWeight(i, keys.length))

  // Score isolado da pedra (só para desempate de posicionamento e para a UI).
  const rank = (c) => {
    let s = 0
    keys.forEach((k, i) => {
      if (maxes[i] > 0) s += weights[i] * (valueOf(c.stone, k) / maxes[i])
    })
    return s
  }

  const chosen = pickStones(all, keys, maxes, weights, mode)
  const assignments = {
    ...placeGroup(
      MAGIC_SLOTS,
      chosen.filter((c) => c.stone?.type === SLOT_TYPE.MAGIC),
      rank,
    ),
    ...placeGroup(
      SPECTRO_SLOTS,
      chosen.filter((c) => c.stone?.type === SLOT_TYPE.SPECTRO),
      rank,
    ),
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
      changes.push({
        slot,
        before,
        after: after?.stone ?? null,
        source: after ?? null,
        // Quais filtros a pedra que entra cobre — mostra o "cobre os 2".
        covers: after
          ? (names || []).filter((n) => valueOf(after.stone, norm(n)) > 0)
          : [],
      })
    }
  }

  const beforeStones = Object.values(stones || {})
  const afterStones = Object.values(assignments).map((c) => c.stone)
  const totalFor = (list, key) => list.reduce((sum, st) => sum + valueOf(st, key), 0)

  const totals = keys.map((key, i) => {
    const display = (names || []).find((n) => norm(n) === key) ?? key
    const unit =
      ENCHANT_UNIT_BY_NAME[display] ??
      all.flatMap((c) => c.stone?.enchantments || []).find((e) => norm(e.name) === key)
        ?.unit ??
      'flat'
    return {
      name: display,
      unit,
      before: totalFor(beforeStones, key),
      after: totalFor(afterStones, key),
      order: i,
      weight: weights[i],
    }
  })

  return { assignments, leftover, changes, totals, mode }
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
