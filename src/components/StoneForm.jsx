import { useEffect, useId, useState } from 'react'
import { SLOT_TYPE, buildStoneName, tierToRoman } from '../data/slots.js'
import {
  ATTRIBUTE_OPTIONS,
  RARITY_OPTIONS,
  ENCHANT_UNIT,
} from '../data/options.js'
import {
  ENCHANTMENTS,
  ENCHANT_UNIT_BY_NAME,
  enchantIconPath,
} from '../data/enchantments.js'

let _eid = 0
const newEnchant = () => ({
  id: `e${++_eid}`,
  name: '',
  value: '',
  unit: ENCHANT_UNIT.PERCENT,
})

function initialState(slot, stone) {
  if (stone) {
    return {
      attribute: stone.attribute ?? '',
      rarity: stone.rarity ?? '',
      tier: stone.tier ?? slot.minTier,
      enhance: stone.enhance ?? 0,
      enchantments:
        stone.enchantments?.map((e) => ({ ...e, id: e.id ?? newEnchant().id })) ??
        [],
    }
  }
  return {
    attribute: '',
    rarity: '',
    tier: slot.minTier,
    enhance: 0,
    enchantments: [newEnchant()],
  }
}

export default function StoneForm({ slot, stone, onSave, onRemove, onClose }) {
  const [form, setForm] = useState(() => initialState(slot, stone))
  const attrListId = useId()
  const rarityListId = useId()
  const enchantListId = useId()

  // Ao digitar/escolher o nome do encantamento, se for um conhecido, já define
  // automaticamente a unidade (% ou decimal).
  const onEnchantName = (id, name) => {
    const knownUnit = ENCHANT_UNIT_BY_NAME[name]
    setEnchant(id, knownUnit ? { name, unit: knownUnit } : { name })
  }

  const isMagic = slot.type === SLOT_TYPE.MAGIC

  // Fechar com Esc
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const setEnchant = (id, patch) =>
    set({
      enchantments: form.enchantments.map((e) =>
        e.id === id ? { ...e, ...patch } : e,
      ),
    })
  const addEnchant = () =>
    set({ enchantments: [...form.enchantments, newEnchant()] })
  const removeEnchant = (id) =>
    set({ enchantments: form.enchantments.filter((e) => e.id !== id) })

  const previewName = buildStoneName({
    type: slot.type,
    attribute: form.attribute,
    rarity: form.rarity,
    tier: Number(form.tier),
  })

  const tierTooLow = Number(form.tier) < slot.minTier

  const handleSubmit = (e) => {
    e.preventDefault()
    if (tierTooLow) return
    const enchantments = form.enchantments
      .map((en) => ({
        name: en.name.trim(),
        value: en.value === '' ? null : Number(en.value),
        unit: en.unit,
      }))
      .filter((en) => en.name !== '' || en.value !== null)
    onSave({
      type: slot.type,
      attribute: isMagic ? form.attribute.trim() : undefined,
      rarity: form.rarity.trim(),
      tier: Number(form.tier),
      enhance: Number(form.enhance) || 0,
      enchantments,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#17172c] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {stone ? 'Edit stone' : 'Add stone'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {isMagic ? 'Magic Stone' : 'Spectromite'} · Slot min tier:{' '}
              {tierToRoman(slot.minTier)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Pré-visualização do nome */}
        <div className="mb-4 rounded-lg bg-black/30 px-3 py-2 text-sm text-amber-200">
          {previewName || 'Name preview'}
        </div>

        {/* Atributo + Raridade + Tier */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {isMagic && (
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-slate-300">Attribute</span>
              <input
                list={attrListId}
                value={form.attribute}
                onChange={(e) => set({ attribute: e.target.value })}
                placeholder="e.g. of Force"
                className="rounded-md border border-white/10 bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none focus:border-amber-400/60"
              />
              <datalist id={attrListId}>
                {ATTRIBUTE_OPTIONS.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Rarity</span>
            <input
              list={rarityListId}
              value={form.rarity}
              onChange={(e) => set({ rarity: e.target.value })}
              placeholder="e.g. Legendary"
              className="rounded-md border border-white/10 bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none focus:border-amber-400/60"
            />
            <datalist id={rarityListId}>
              {RARITY_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Tier</span>
            <input
              type="number"
              min={slot.minTier}
              step={1}
              value={form.tier}
              onChange={(e) => set({ tier: e.target.value })}
              className={[
                'rounded-md border bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none',
                tierTooLow
                  ? 'border-rose-500/70 focus:border-rose-400'
                  : 'border-white/10 focus:border-amber-400/60',
              ].join(' ')}
            />
            {tierTooLow && (
              <span className="text-xs text-rose-400">
                This slot requires Tier {tierToRoman(slot.minTier)} or higher.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Enhancement (+N)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.enhance}
              onChange={(e) => set({ enhance: e.target.value })}
              className="rounded-md border border-white/10 bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none focus:border-amber-400/60"
            />
          </label>
        </div>

        {/* Encantamentos */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              Enchantments
            </span>
            <button
              type="button"
              onClick={addEnchant}
              className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/25"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {form.enchantments.length === 0 && (
              <p className="text-xs text-slate-500">
                No enchantments. Click “Add”.
              </p>
            )}

            {form.enchantments.map((en) => {
              const iconPath = enchantIconPath(en.name)
              return (
              <div key={en.id} className="flex items-center gap-2">
                {/* Ícone do encantamento (se conhecido) */}
                <span className="flex size-7 shrink-0 items-center justify-center">
                  {iconPath && (
                    <img src={iconPath} alt="" className="size-6 object-contain" />
                  )}
                </span>
                <input
                  list={enchantListId}
                  value={en.name}
                  onChange={(e) => onEnchantName(en.id, e.target.value)}
                  placeholder="Enchantment name"
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#0f0f22] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400/60"
                />
                <input
                  type="number"
                  step="any"
                  value={en.value}
                  onChange={(e) => setEnchant(en.id, { value: e.target.value })}
                  placeholder="Value"
                  className="w-24 rounded-md border border-white/10 bg-[#0f0f22] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400/60"
                />
                {/* Toggle %/decimal */}
                <div className="flex overflow-hidden rounded-md border border-white/10">
                  <button
                    type="button"
                    onClick={() => setEnchant(en.id, { unit: ENCHANT_UNIT.PERCENT })}
                    className={[
                      'px-2 py-1.5 text-sm',
                      en.unit === ENCHANT_UNIT.PERCENT
                        ? 'bg-amber-500/30 text-amber-100'
                        : 'text-slate-400 hover:bg-white/5',
                    ].join(' ')}
                    title="Percentage"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnchant(en.id, { unit: ENCHANT_UNIT.FLAT })}
                    className={[
                      'px-2 py-1.5 text-sm',
                      en.unit === ENCHANT_UNIT.FLAT
                        ? 'bg-amber-500/30 text-amber-100'
                        : 'text-slate-400 hover:bg-white/5',
                    ].join(' ')}
                    title="Decimal/flat value"
                  >
                    0,0
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeEnchant(en.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
                  aria-label="Remove enchantment"
                >
                  ✕
                </button>
              </div>
              )
            })}
          </div>
        </div>

        <datalist id={enchantListId}>
          {ENCHANTMENTS.map((e) => (
            <option key={e.name} value={e.name} />
          ))}
        </datalist>

        {/* Ações */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            {stone && (
              <button
                type="button"
                onClick={onRemove}
                className="rounded-md px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/15"
              >
                Remove from slot
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={tierTooLow}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
