import { useId, useMemo, useState } from 'react'
import { ENCHANTMENTS, enchantIconPath } from '../data/enchantments.js'
import { buildStoneName } from '../data/slots.js'
import { formatStatValue } from '../data/stats.js'
import { suggestLoadout, loadoutToState, BALANCE } from '../data/suggest.js'

function slotLabel(slotId) {
  const [type, n] = slotId.split('-')
  return `${type === 'magic' ? 'Magic Stone' : 'Spectromite'} ${n}`
}

// Reúne as pedras do set (equipadas + bolsa) numa lista única para o filtro.
function sourcesFrom(stones, bag) {
  const equipped = Object.entries(stones || {}).map(([slotId, stone]) => ({
    key: `slot:${slotId}`,
    stone,
    place: 'slot',
    label: slotLabel(slotId),
  }))
  const inBag = (bag || []).map((item) => ({
    key: `bag:${item.id}`,
    stone: item.stone,
    place: 'bag',
    label: 'Bag',
  }))
  return [...equipped, ...inBag]
}

// Para um encantamento, retorna as pedras (equipadas e da bolsa) que o possuem,
// com o valor, ordenadas do menor para o maior (sem valor vai pro fim).
// Se a pedra tiver o encantamento repetido, os valores somam.
function entriesFor(sources, name) {
  const key = name.toLowerCase()
  return sources
    .map((src) => {
      const hits = (src.stone.enchantments || []).filter(
        (e) => (e.name || '').toLowerCase() === key,
      )
      if (hits.length === 0) return null
      const value = hits.reduce((sum, e) => sum + (Number(e.value) || 0), 0)
      return { ...src, value, unit: hits[0].unit, repeats: hits.length }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.value == null) return 1
      if (b.value == null) return -1
      return a.value - b.value
    })
}

// Linha "antes → depois" de um stat filtrado, com o ganho destacado.
function TotalRow({ t }) {
  const icon = enchantIconPath(t.name)
  const delta = t.after - t.before
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return (
    <li className="flex items-center gap-2 py-1 text-xs">
      {icon ? (
        <img src={icon} alt="" className="size-4 shrink-0 object-contain" />
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate text-slate-300">{t.name}</span>
      <span
        className="shrink-0 rounded bg-white/5 px-1 text-[10px] font-semibold text-slate-400"
        title={`Priority weight ${t.weight}× (position ${t.order + 1} in the filter)`}
      >
        {t.weight}×
      </span>
      <span className="shrink-0 tabular-nums text-slate-500">
        {formatStatValue(t.before, t.unit)}
      </span>
      <span className="shrink-0 text-slate-600">→</span>
      <span className="shrink-0 font-semibold tabular-nums text-slate-100">
        {formatStatValue(t.after, t.unit)}
      </span>
      <span
        className={[
          'w-16 shrink-0 text-right font-semibold tabular-nums',
          delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-rose-300' : 'text-slate-600',
        ].join(' ')}
      >
        {delta === 0 ? '—' : `${sign}${formatStatValue(Math.abs(delta), t.unit)}`}
      </span>
    </li>
  )
}

// Filtro: escolha um ou mais encantamentos e veja, para cada um, as pedras do
// set (equipadas e na bolsa) que o possuem e seus valores. Controlado pelo pai
// para que a bolsa também consiga destacar as pedras correspondentes.
export default function EnchantFilter({ stones, bag = [], selected, onChange, onApply }) {
  const [input, setInput] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [mode, setMode] = useState(BALANCE.BALANCED)
  const listId = useId()
  const sources = sourcesFrom(stones, bag)

  // A prévia só é calculada depois que o usuário pede; a partir daí acompanha
  // mudanças no filtro, nas pedras e no modo.
  const suggestion = useMemo(
    () => (showSuggestion ? suggestLoadout(stones, bag, selected, mode) : null),
    [showSuggestion, stones, bag, selected, mode],
  )

  const applySuggestion = () => {
    if (!suggestion) return
    const { stones: nextStones, bag: nextBag } = loadoutToState(suggestion)
    onApply?.(nextStones, nextBag)
  }

  const addEnchant = (e) => {
    e?.preventDefault()
    const name = input.trim()
    if (!name) return
    if (!selected.some((p) => p.toLowerCase() === name.toLowerCase())) {
      onChange([...selected, name])
    }
    setInput('')
  }

  const removeEnchant = (name) => onChange(selected.filter((p) => p !== name))

  // A ordem da lista é a prioridade usada pela sugestão — daí as setas.
  const move = (name, dir) => {
    const i = selected.indexOf(name)
    const j = i + dir
    if (i < 0 || j < 0 || j >= selected.length) return
    const next = [...selected]
    next[i] = next[j]
    next[j] = name
    onChange(next)
  }

  return (
    <section className="mt-8 rounded-xl border border-white/5 bg-[#17172c] p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Filter by enchantment
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Choose one or more enchantments to see which of this set's stones have
        them — equipped and in the bag. The bag shows only matching stones. The
        order is the priority: the first one weighs most when suggesting stones
        (use ▲▼ to reorder).
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

      {/* Sugestão: melhor arranjo possível das pedras para os filtros ativos */}
      {selected.length > 0 && (
        <div className="mt-4 rounded-lg border border-white/10 bg-[#0f0f22] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-slate-100">Best stones</h3>
              <p className="text-xs text-slate-500">
                Picks the best loadout from every stone in this set — equipped and in
                the bag — following the priority order of the filters above.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSuggestion((v) => !v)}
              className="shrink-0 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
            >
              {showSuggestion ? 'Hide' : '✦ Suggest'}
            </button>
          </div>

          {suggestion && (
            <div className="mt-4 flex flex-col gap-4">
              {selected.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    {
                      id: BALANCE.BALANCED,
                      label: 'Balanced',
                      hint: 'Covers every enchantment in the filter — a stone that has two of them beats one that only stacks the first.',
                    },
                    {
                      id: BALANCE.TOTAL,
                      label: 'Max total',
                      hint: 'Maximizes the weighted sum. Can stack the top filter and leave the others at zero.',
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      title={m.hint}
                      className={[
                        'rounded-md px-2.5 py-1 text-xs font-medium transition',
                        mode === m.id
                          ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
                      ].join(' ')}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              <ul className="divide-y divide-white/5">
                {suggestion.totals.map((t) => (
                  <TotalRow key={t.name} t={t} />
                ))}
              </ul>

              {suggestion.changes.length === 0 ? (
                <p className="rounded-md border border-emerald-400/30 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
                  Your set is already the best possible for these enchantments.
                </p>
              ) : (
                <>
                  <ul className="flex flex-col gap-1.5">
                    {suggestion.changes.map((c) => (
                      <li
                        key={c.slot.id}
                        className="flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-xs"
                      >
                        <span className="w-28 shrink-0 text-slate-500">
                          {slotLabel(c.slot.id)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-slate-500 line-through">
                          {c.before ? buildStoneName(c.before) : 'empty'}
                        </span>
                        <span className="shrink-0 text-slate-600">→</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-emerald-200">
                          {c.after ? buildStoneName(c.after) : 'empty'}
                        </span>
                        {c.covers.length > 0 && selected.length > 1 && (
                          <span
                            className="flex shrink-0 items-center gap-0.5"
                            title={`Covers ${c.covers.length} of ${selected.length} filters: ${c.covers.join(', ')}`}
                          >
                            {c.covers.map((n) => {
                              const ico = enchantIconPath(n)
                              return ico ? (
                                <img
                                  key={n}
                                  src={ico}
                                  alt=""
                                  className="size-4 object-contain"
                                />
                              ) : null
                            })}
                            <span className="text-[10px] font-semibold text-slate-400">
                              {c.covers.length}/{selected.length}
                            </span>
                          </span>
                        )}
                        {c.source?.from === 'bag' && (
                          <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                            Bag
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                    >
                      Apply {suggestion.changes.length} change
                      {suggestion.changes.length === 1 ? '' : 's'}
                    </button>
                    <span className="text-xs text-slate-500">
                      Replaced stones go back to the bag.
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resultados por encantamento */}
      {selected.length > 0 && (
        <div className="mt-5 flex flex-col gap-5">
          {selected.map((name, i) => {
            const entries = entriesFor(sources, name)
            const icon = enchantIconPath(name)
            return (
              <div key={name}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200"
                    title={`Priority ${i + 1} of ${selected.length} — weight ${selected.length - i}× in the suggestion`}
                  >
                    {i + 1}º
                  </span>
                  {icon && (
                    <img src={icon} alt="" className="size-5 object-contain" />
                  )}
                  <h3 className="flex-1 text-sm font-medium text-slate-100">
                    {name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {entries.length} stone{entries.length === 1 ? '' : 's'}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => move(name, -1)}
                      disabled={i === 0}
                      className="rounded p-0.5 text-slate-500 hover:text-amber-200 disabled:cursor-not-allowed disabled:text-slate-700 disabled:hover:text-slate-700"
                      aria-label={`Raise priority of ${name}`}
                      title="Higher priority"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => move(name, 1)}
                      disabled={i === selected.length - 1}
                      className="rounded p-0.5 text-slate-500 hover:text-amber-200 disabled:cursor-not-allowed disabled:text-slate-700 disabled:hover:text-slate-700"
                      aria-label={`Lower priority of ${name}`}
                      title="Lower priority"
                    >
                      ▼
                    </button>
                  </div>
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
                        key={e.key}
                        className="flex items-center justify-between gap-3 px-1 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-slate-100">
                            <span className="truncate">
                              {buildStoneName(e.stone) || e.label}
                            </span>
                            {e.place === 'bag' && (
                              <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                                Bag
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{e.label}</p>
                        </div>
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
