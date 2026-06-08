import { MAGIC_SLOTS, SPECTRO_SLOTS } from '../data/slots.js'
import Slot from './Slot.jsx'

function Panel({ title, hint, children }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#17172c] p-5 shadow-lg shadow-black/30">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h2>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  )
}

// Grid de pedras: painel de Pedras Mágicas (3×3) e painel de Espectromite (1×3).
export default function SlotGrid({ stones, onSlotClick }) {
  return (
    <div className="flex flex-col gap-5">
      <Panel title="Magic Stones" hint="6× Tier 1+ · 3× Tier 2+">
        {MAGIC_SLOTS.map((slot) => (
          <Slot
            key={slot.id}
            slot={slot}
            stone={stones[slot.id]}
            onClick={onSlotClick}
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
          />
        ))}
      </Panel>
    </div>
  )
}
