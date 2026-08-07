import { MAGIC_SLOTS, SPECTRO_SLOTS, buildStoneName } from '../data/slots.js'
import { canEquip } from '../context/SetsContext.jsx'
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
  onSwap,
  onClearSlots,
  equippedCount = 0,
  highlight = [],
  pickedStone = null,
  onCancelPick,
}) {
  // Estado de destaque de um slot quando há pedra selecionada na bolsa:
  // 'ok' = pode receber a pedra, 'no' = incompatível (tipo/tier).
  const pickState = (slot) =>
    pickedStone ? (canEquip(pickedStone, slot) ? 'ok' : 'no') : null

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
      {pickedStone && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100">
          <span className="min-w-0 flex-1">
            Pick a slot for{' '}
            <strong className="font-semibold">{buildStoneName(pickedStone)}</strong> — only
            the highlighted slots accept it.
          </span>
          <button
            type="button"
            onClick={onCancelPick}
            className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-100 hover:bg-white/20"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

      <Panel title="Magic Stones" hint="6× Tier 1+ · 3× Tier 2+" action={clearAction}>
        {MAGIC_SLOTS.map((slot, i) => (
          <Slot
            key={slot.id}
            slot={slot}
            stone={stones[slot.id]}
            onClick={onSlotClick}
            onEquip={onEquip}
            onSwap={onSwap}
            highlight={highlight}
            pickState={pickState(slot)}
            // Última coluna: abre o tooltip para a esquerda para não vazar.
            align={i % 3 === 2 ? 'right' : 'left'}
          />
        ))}
      </Panel>

      <Panel title="Spectromite" hint="2× Tier 1+ · 1× Tier 2+">
        {SPECTRO_SLOTS.map((slot, i) => (
          <Slot
            key={slot.id}
            slot={slot}
            stone={stones[slot.id]}
            onClick={onSlotClick}
            onEquip={onEquip}
            onSwap={onSwap}
            highlight={highlight}
            pickState={pickState(slot)}
            align={i % 3 === 2 ? 'right' : 'left'}
          />
        ))}
      </Panel>
    </div>
  )
}
