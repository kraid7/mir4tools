import { MAGIC_SLOTS, SPECTRO_SLOTS } from '../data/slots.js'
import Slot from './Slot.jsx'

function Panel({ title, hint, action, children }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#17172c] p-5 shadow-lg shadow-black/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {hint && <span className="text-xs text-slate-500">{hint}</span>}
          {action}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  )
}

// Grid de pedras: painel de Pedras Mágicas (3×3) e painel de Espectromite (1×3).
export default function SlotGrid({
  stones,
  onSlotClick,
  onEquip,
  onClearSlots,
  equippedCount = 0,
  highlight = [],
}) {
  const clearAction = onClearSlots ? (
    <button
      type="button"
      onClick={onClearSlots}
      disabled={equippedCount === 0}
      title="Move every equipped stone back to the bag and empty all slots"
      className="rounded-md bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500"
    >
      ⤓ Empty to bag
    </button>
  ) : null

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Magic Stones" hint="6× Tier 1+ · 3× Tier 2+" action={clearAction}>
        {MAGIC_SLOTS.map((slot) => (
          <Slot
            key={slot.id}
            slot={slot}
            stone={stones[slot.id]}
            onClick={onSlotClick}
            onEquip={onEquip}
            highlight={highlight}
          />
        ))}
      </Panel>

      <Panel title="Spectromite" hint="2× Tier 1+ · 1× Tier 2+">
        {SPECTRO_SLOTS.map((slot) => (
          <Slot
            key={slot.id}
            slot={slot}
            stone={stones[slot.id]}
            onClick={onSlotClick}
            onEquip={onEquip}
            highlight={highlight}
          />
        ))}
      </Panel>
    </div>
  )
}
