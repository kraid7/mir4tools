import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SlotGrid from '../components/SlotGrid.jsx'
import StoneForm from '../components/StoneForm.jsx'
import EnchantFilter from '../components/EnchantFilter.jsx'
import StatsPanel from '../components/StatsPanel.jsx'
import BagPanel from '../components/BagPanel.jsx'
import ImageImport from '../components/ImageImport.jsx'
import { useSets, canEquip } from '../context/SetsContext.jsx'
import { ALL_SLOTS } from '../data/slots.js'

export default function SetEditor() {
  const { id } = useParams()
  const {
    getSet,
    setStone,
    removeStone,
    renameSet,
    toggleFavorite,
    addToBag,
    updateBagStone,
    removeFromBag,
    unequipToBag,
    unequipAllToBag,
    equipFromBag,
    applyLoadout,
  } = useSets()

  const set = getSet(id)
  // Estado do modal de cadastro. kind: 'slot' | 'bag-new' | 'bag-edit'.
  const [editing, setEditing] = useState(null)
  // Encantamentos selecionados no filtro (elevado p/ destacar pedras na bolsa).
  const [filterEnchants, setFilterEnchants] = useState([])
  // Abre o modal de importação por imagem (OCR -> bolsa).
  const [importing, setImporting] = useState(false)
  // Pedra "na mão": selecionada na bolsa por clique, aguardando um slot.
  // Alternativa ao arrastar-e-soltar (essencial quando a bolsa está grande).
  const [pickedBagId, setPickedBagId] = useState(null)

  // Esc cancela a seleção.
  useEffect(() => {
    if (!pickedBagId) return
    const onKey = (e) => e.key === 'Escape' && setPickedBagId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickedBagId])

  if (!set) {
    return (
      <div className="min-h-screen bg-[#14142a] px-6 py-10 text-center text-slate-300">
        <p>Set not found.</p>
        <Link to="/" className="mt-3 inline-block text-amber-300 hover:underline">
          ← Back to my sets
        </Link>
      </div>
    )
  }

  const stones = set.stones || {}
  const bag = set.bag || []
  const closeForm = () => setEditing(null)

  // Slot usado pelo StoneForm: real (do grid) ou sintético (bolsa, sem tier mínimo).
  const editingSlot =
    editing?.kind === 'slot'
      ? ALL_SLOTS.find((s) => s.id === editing.slotId) ?? null
      : editing
        ? { id: 'bag', type: editing.stoneType, minTier: 1 }
        : null

  const editingStone =
    editing?.kind === 'slot'
      ? stones[editing.slotId] ?? null
      : editing?.kind === 'bag-edit'
        ? bag.find((b) => b.id === editing.bagId)?.stone ?? null
        : null

  const saveStone = (stone) => {
    if (editing.kind === 'slot') setStone(set.id, editing.slotId, stone)
    else if (editing.kind === 'bag-new') addToBag(set.id, stone)
    else if (editing.kind === 'bag-edit') updateBagStone(set.id, editing.bagId, stone)
    closeForm()
  }

  const handleRemove = () => {
    if (editing.kind === 'slot') removeStone(set.id, editing.slotId)
    else if (editing.kind === 'bag-edit') removeFromBag(set.id, editing.bagId)
    closeForm()
  }

  const handleRename = () => {
    const name = window.prompt('Set name:', set.name)
    if (name != null) renameSet(set.id, name)
  }

  // Item da bolsa atualmente selecionado (some sozinho se a pedra sair da bolsa).
  const pickedItem = pickedBagId ? (bag.find((b) => b.id === pickedBagId) ?? null) : null

  // Clique no slot: com uma pedra selecionada, equipa/troca ali; senão, abre o
  // formulário do slot como antes.
  const handleSlotClick = (slot) => {
    if (pickedItem) {
      if (canEquip(pickedItem.stone, slot)) {
        equipFromBag(set.id, slot.id, pickedItem.id)
        setPickedBagId(null)
      }
      return
    }
    setEditing({ kind: 'slot', slotId: slot.id })
  }

  // Botão da bolsa: manda a pedra para o primeiro slot livre compatível. Se não
  // houver nenhum livre, deixa a pedra selecionada para o usuário escolher qual
  // trocar.
  const handleQuickEquip = (item) => {
    const free = ALL_SLOTS.find((s) => !stones[s.id] && canEquip(item.stone, s))
    if (free) {
      equipFromBag(set.id, free.id, item.id)
      setPickedBagId(null)
      return
    }
    setPickedBagId(item.id)
  }

  const equippedCount = Object.keys(stones).length
  const handleClearToBag = () => {
    if (equippedCount === 0) return
    const ok = window.confirm(
      `Move all ${equippedCount} equipped stone${equippedCount === 1 ? '' : 's'} back to the bag? Slots will be emptied so you can rebuild the deck.`,
    )
    if (ok) unequipAllToBag(set.id)
  }

  return (
    <div className="min-h-screen bg-[#14142a] text-slate-200">
      <header className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-amber-200">
            ← My sets
          </Link>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(set.id)}
                title={set.favorite ? 'Favorite' : 'Mark as favorite'}
                className={[
                  'text-xl leading-none',
                  set.favorite ? 'text-amber-300' : 'text-slate-600 hover:text-amber-200',
                ].join(' ')}
              >
                {set.favorite ? '★' : '☆'}
              </button>
              <button
                type="button"
                onClick={handleRename}
                title="Rename"
                className="text-left text-xl font-bold tracking-wide text-slate-100 hover:text-amber-200"
              >
                {set.name}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="order-2 xl:order-1">
            <StatsPanel stones={stones} />
          </aside>

          <div className="order-1 xl:order-2">
            <SlotGrid
              stones={stones}
              onSlotClick={handleSlotClick}
              onEquip={(slotId, bagId) => equipFromBag(set.id, slotId, bagId)}
              onClearSlots={handleClearToBag}
              equippedCount={equippedCount}
              highlight={filterEnchants}
              pickedStone={pickedItem?.stone ?? null}
              onCancelPick={() => setPickedBagId(null)}
            />
            <EnchantFilter
              stones={stones}
              bag={bag}
              selected={filterEnchants}
              onChange={setFilterEnchants}
              onApply={(nextStones, nextBag) => {
                applyLoadout(set.id, nextStones, nextBag)
                setPickedBagId(null)
              }}
            />
          </div>

          <aside className="order-3">
            <BagPanel
              bag={bag}
              highlight={filterEnchants}
              onAdd={(stoneType) => setEditing({ kind: 'bag-new', stoneType })}
              onImport={() => setImporting(true)}
              onEdit={(item) =>
                setEditing({
                  kind: 'bag-edit',
                  bagId: item.id,
                  stoneType: item.stone.type,
                })
              }
              onRemove={(bagId) => removeFromBag(set.id, bagId)}
              onDropToBag={(slotId) => unequipToBag(set.id, slotId)}
              pickedId={pickedItem?.id ?? null}
              onPick={(bagId) => setPickedBagId((cur) => (cur === bagId ? null : bagId))}
              onQuickEquip={handleQuickEquip}
            />
          </aside>
        </div>
      </main>

      {editingSlot && (
        <StoneForm
          slot={editingSlot}
          stone={editingStone}
          onSave={saveStone}
          onRemove={handleRemove}
          onClose={closeForm}
          removeLabel={editing.kind === 'slot' ? 'Remove from slot' : 'Remove from bag'}
        />
      )}

      {importing && (
        <ImageImport
          onConfirm={(stone) => {
            addToBag(set.id, stone)
            setImporting(false)
          }}
          onClose={() => setImporting(false)}
        />
      )}
    </div>
  )
}
