import { useId, useState } from 'react'
import { ENCHANTMENTS, enchantIconPath } from '../data/enchantments.js'
import { buildStoneName } from '../data/slots.js'

function slotLabel(slotId) {
  const [type, n] = slotId.split('-')
  return `${type === 'magic' ? 'Magic Stone' : 'Spectromite'} ${n}`
}

function formatValue(value, unit) {
  if (value == null) return '—'
  const n = Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })
  return unit === 'percent' ? `${n}%` : n
}

// Para um encantamento, retorna as pedras do set que o possuem, com o valor,
// ordenadas do menor para o maior (sem valor vai pro fim).
function entriesFor(stones, name) {
  return Object.entries(stones || {})
    .map(([slotId, stone]) => {
      const en = stone.enchantments?.find(
        (e) => e.name.toLowerCase() === name.toLowerCase(),
      )
      return en ? { slotId, stone, value: en.value, unit: en.unit } : null
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.value == null) return 1
      if (b.value == null) return -1
      return a.value - b.value
    })
}

// Filtro: escolha um ou mais encantamentos e veja, para cada um, as pedras do
// set que o possuem e seus valores.
export default function EnchantFilter({ stones }) {
  const [selected, setSelected] = useState([])
  const [input, setInput] = useState('')
  const listId = useId()

  const addEnchant = (e) => {
    e?.preventDefault()
    const name = input.trim()
    if (!name) return
    setSelected((prev) =>
      prev.some((p) => p.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name],
    )
    setInput('')
  }

  const removeEnchant = (name) =>
    setSelected((prev) => prev.filter((p) => p !== name))

  return (
    <section className="mt-8 rounded-xl border border-white/5 bg-[#17172c] p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Filter by enchantment
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Choose one or more enchantments to see the values found on this set's
        stones.
      </p>

      <form onSubmit={addEnchant} className="flex gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-white/10 bg-[#0f0f22] px-2.5">
          {enchantIconPath(input) ? (
            <img
              src={enchantIconPath(input)}
              alt=""
              className="size-5 shrink-0 object-contain"
            />
          ) : (
            <span className="size-5 shrink-0" />
          )}
          <input
            list={listId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enchantment (e.g. CRIT ATK DMG Boost)"
            className="w-full bg-transparent py-2 text-sm text-slate-100 outline-none"
          />
          <datalist id={listId}>
            {ENCHANTMENTS.map((e) => (
              <option key={e.name} value={e.name} />
            ))}
          </datalist>
        </label>
        <button
          type="submit"
          className="rounded-md bg-amber-500/15 px-3 text-sm font-medium text-amber-200 hover:bg-amber-500/25"
        >
          + Add
        </button>
      </form>

      {/* Resultados por encantamento */}
      {selected.length > 0 && (
        <div className="mt-5 flex flex-col gap-5">
          {selected.map((name) => {
            const entries = entriesFor(stones, name)
            const icon = enchantIconPath(name)
            return (
              <div key={name}>
                <div className="mb-2 flex items-center gap-2">
                  {icon && (
                    <img src={icon} alt="" className="size-5 object-contain" />
                  )}
                  <h3 className="flex-1 text-sm font-medium text-slate-100">
                    {name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {entries.length} stone{entries.length === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEnchant(name)}
                    className="rounded p-0.5 text-slate-500 hover:text-rose-300"
                    aria-label={`Remove filter ${name}`}
                  >
                    ✕
                  </button>
                </div>

                {entries.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No stone in this set has this enchantment.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-white/5">
                    {entries.map((e) => (
                      <li
                        key={e.slotId}
                        className="flex items-center justify-between gap-3 px-1 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-slate-100">
                            {buildStoneName(e.stone) || slotLabel(e.slotId)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {slotLabel(e.slotId)}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold tabular-nums text-amber-200">
                          {formatValue(e.value, e.unit)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
