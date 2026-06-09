import { createContext, useContext, useEffect, useState } from 'react'
import { ALL_SLOTS } from '../data/slots.js'

// Estado global dos sets de pedras, persistido no LocalStorage.
// Cada set: { id, name, favorite, stones: { [slotId]: stone }, bag: [{ id, stone }] }.
// A "bolsa" (bag) guarda pedras extras que não estão equipadas em nenhum slot;
// servem para trocar com as equipadas (arrastar e soltar no grid).

// Uma pedra só pode ir para um slot se for do mesmo tipo e atender ao tier mínimo.
export function canEquip(stone, slot) {
  if (!stone || !slot) return false
  return stone.type === slot.type && (stone.tier ?? 1) >= slot.minTier
}

const KEY = 'mir4tools:sets:v1'
const OLD_KEY = 'mir4tools:stones' // versão antiga (set único)

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`

function loadSets() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignora */
  }
  // Migração do set único antigo, se existir.
  try {
    const old = localStorage.getItem(OLD_KEY)
    if (old) {
      const stones = JSON.parse(old)
      if (stones && Object.keys(stones).length > 0) {
        return [{ id: uid(), name: 'Meu set', favorite: true, stones }]
      }
    }
  } catch {
    /* ignora */
  }
  return []
}

const SetsContext = createContext(null)

export function SetsProvider({ children }) {
  const [sets, setSets] = useState(loadSets)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(sets))
    } catch {
      /* ignora cota/indisponibilidade */
    }
  }, [sets])

  const createSet = (name = 'Novo set') => {
    const id = uid()
    setSets((prev) => [
      ...prev,
      { id, name: name.trim() || 'Novo set', favorite: prev.length === 0, stones: {} },
    ])
    return id
  }

  const renameSet = (id, name) =>
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s)),
    )

  const deleteSet = (id) => setSets((prev) => prev.filter((s) => s.id !== id))

  const duplicateSet = (id) => {
    const src = sets.find((s) => s.id === id)
    if (!src) return null
    const newId = uid()
    setSets((prev) => [
      ...prev,
      {
        id: newId,
        name: `${src.name} (cópia)`,
        favorite: false,
        stones: structuredClone(src.stones),
        bag: structuredClone(src.bag ?? []),
      },
    ])
    return newId
  }

  const toggleFavorite = (id) =>
    setSets((prev) =>
      prev.map((s) => ({ ...s, favorite: s.id === id ? !s.favorite : false })),
    )

  const setStone = (id, slotId, stone) =>
    setSets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, stones: { ...s.stones, [slotId]: stone } } : s,
      ),
    )

  const removeStone = (id, slotId) =>
    setSets((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const stones = { ...s.stones }
        delete stones[slotId]
        return { ...s, stones }
      }),
    )

  const replaceStones = (id, stones) =>
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, stones } : s)))

  // ——— Bolsa de pedras ———

  const addToBag = (id, stone) =>
    setSets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, bag: [...(s.bag ?? []), { id: uid(), stone }] } : s,
      ),
    )

  const updateBagStone = (id, bagId, stone) =>
    setSets((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, bag: (s.bag ?? []).map((b) => (b.id === bagId ? { ...b, stone } : b)) }
          : s,
      ),
    )

  const removeFromBag = (id, bagId) =>
    setSets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, bag: (s.bag ?? []).filter((b) => b.id !== bagId) } : s,
      ),
    )

  // Move a pedra equipada num slot de volta para a bolsa (deixa o slot vazio).
  const unequipToBag = (id, slotId) =>
    setSets((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const stone = s.stones[slotId]
        if (!stone) return s
        const stones = { ...s.stones }
        delete stones[slotId]
        return { ...s, stones, bag: [...(s.bag ?? []), { id: uid(), stone }] }
      }),
    )

  // Equipa uma pedra da bolsa num slot. Se o slot já tinha uma pedra, ela é
  // trocada (volta para a bolsa). Só aplica se a pedra for compatível com o slot.
  const equipFromBag = (id, slotId, bagId) =>
    setSets((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const bag = s.bag ?? []
        const item = bag.find((b) => b.id === bagId)
        const slot = ALL_SLOTS.find((sl) => sl.id === slotId)
        if (!item || !canEquip(item.stone, slot)) return s
        const displaced = s.stones[slotId]
        const stones = { ...s.stones, [slotId]: item.stone }
        let nextBag = bag.filter((b) => b.id !== bagId)
        if (displaced) nextBag = [...nextBag, { id: uid(), stone: displaced }]
        return { ...s, stones, bag: nextBag }
      }),
    )

  const getSet = (id) => sets.find((s) => s.id === id) ?? null

  // Acrescenta sets importados (ids novos; favorito zerado para não conflitar).
  // Retorna a quantidade adicionada.
  const addSets = (incoming) => {
    const clean = (incoming || []).map((s) => ({
      id: uid(),
      name: String(s.name || 'Imported set'),
      favorite: false,
      stones: s.stones && typeof s.stones === 'object' ? s.stones : {},
      bag: Array.isArray(s.bag) ? s.bag : [],
    }))
    if (clean.length) setSets((prev) => [...prev, ...clean])
    return clean.length
  }

  const value = {
    sets,
    getSet,
    createSet,
    renameSet,
    deleteSet,
    duplicateSet,
    toggleFavorite,
    setStone,
    removeStone,
    replaceStones,
    addToBag,
    updateBagStone,
    removeFromBag,
    unequipToBag,
    equipFromBag,
    addSets,
  }

  return <SetsContext.Provider value={value}>{children}</SetsContext.Provider>
}

export function useSets() {
  const ctx = useContext(SetsContext)
  if (!ctx) throw new Error('useSets deve ser usado dentro de <SetsProvider>')
  return ctx
}
