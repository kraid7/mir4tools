import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SlotGrid from '../components/SlotGrid.jsx'
import StoneForm from '../components/StoneForm.jsx'
import EnchantFilter from '../components/EnchantFilter.jsx'
import { useSets } from '../context/SetsContext.jsx'
import { ALL_SLOTS } from '../data/slots.js'

export default function SetEditor() {
  const { id } = useParams()
  const { getSet, setStone, removeStone, renameSet, toggleFavorite } = useSets()

  const set = getSet(id)
  const [selectedSlotId, setSelectedSlotId] = useState(null)

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
  const selectedSlot = ALL_SLOTS.find((s) => s.id === selectedSlotId) ?? null
  const closeForm = () => setSelectedSlotId(null)

  const saveStone = (stone) => {
    setStone(set.id, selectedSlotId, stone)
    closeForm()
  }

  const handleRemove = () => {
    removeStone(set.id, selectedSlotId)
    closeForm()
  }

  const handleRename = () => {
    const name = window.prompt('Set name:', set.name)
    if (name != null) renameSet(set.id, name)
  }

  return (
    <div className="min-h-screen bg-[#14142a] text-slate-200">
      <header className="border-b border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-6">
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

      <main className="mx-auto max-w-3xl px-6 py-8">
        <SlotGrid stones={stones} onSlotClick={(slot) => setSelectedSlotId(slot.id)} />
        <EnchantFilter stones={stones} />
      </main>

      {selectedSlot && (
        <StoneForm
          slot={selectedSlot}
          stone={stones[selectedSlotId] ?? null}
          onSave={saveStone}
          onRemove={handleRemove}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
