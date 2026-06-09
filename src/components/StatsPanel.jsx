import { useMemo } from 'react'
import { sumEnchantments } from '../data/stats.js'
import { enchantIconPath } from '../data/enchantments.js'

function formatTotal(total, unit) {
  const n = Number(total).toLocaleString('en-US', { maximumFractionDigits: 2 })
  return unit === 'percent' ? `${n}%` : n
}

// Painel lateral: soma dos encantamentos de todas as pedras equipadas no set.
export default function StatsPanel({ stones }) {
  const rows = useMemo(() => sumEnchantments(stones), [stones])

  return (
    <section className="rounded-xl border border-white/5 bg-[#17172c] p-5 shadow-lg shadow-black/30">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Total stats
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Sum of every enchantment across the equipped stones.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No enchantments yet. Add stones to your slots to see totals.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {rows.map((row) => {
            const icon = enchantIconPath(row.name)
            return (
              <li
                key={row.name}
                className="flex items-center gap-2.5 py-2 text-sm"
                title={`${row.count} stone${row.count === 1 ? '' : 's'}`}
              >
                {icon ? (
                  <img src={icon} alt="" className="size-5 shrink-0 object-contain" />
                ) : (
                  <span className="size-5 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate text-slate-200">{row.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-amber-200">
                  {formatTotal(row.total, row.unit)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
