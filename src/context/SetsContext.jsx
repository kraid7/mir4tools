import { createContext, useContext, useEffect, useState } from 'react'

// Estado global dos sets de pedras, persistido no LocalStorage.
// Cada set: { id, name, favorite, stones: { [slotId]: stone } }.

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

  const getSet = (id) => sets.find((s) => s.id === id) ?? null

  // Acrescenta sets importados (ids novos; favorito zerado para não conflitar).
  // Retorna a quantidade adicionada.
  const addSets = (incoming) => {
    const clean = (incoming || []).map((s) => ({
      id: uid(),
      name: String(s.name || 'Imported set'),
      favorite: false,
      stones: s.stones && typeof s.stones === 'object' ? s.stones : {},
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
    addSets,
  }

  return <SetsContext.Provider value={value}>{children}</SetsContext.Provider>
}

export function useSets() {
  const ctx = useContext(SetsContext)
  if (!ctx) throw new Error('useSets deve ser usado dentro de <SetsProvider>')
  return ctx
}
