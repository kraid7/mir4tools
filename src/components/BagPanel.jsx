import { useState } from 'react'
import { buildStoneName, tierToRoman } from '../data/slots.js'
import { getStoneIcon } from '../data/stoneIcons.js'
import { setDragPayload, getDragPayload } from '../data/dnd.js'
import { matchedEnchantments, formatStatValue } from '../data/stats.js'
import { enchantIconPath } from '../data/enchantments.js'

// Mini-ícone de uma pedra (arte oficial, com fallback de gema neutra).
function StoneIcon({ stone }) {
  const [imgError, setImgError] = useState(false)
  const icon = !imgError ? getStoneIcon(stone) : null
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center">
      {icon ? (
        <img
          src={icon}
          alt=""
          className="size-full object-contain drop-shadow"
          draggable={false}
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="size-9 rounded-full ring-2 ring-amber-300/40"
          style={{
            background:
              'radial-gradient(circle at 38% 30%, #6b7280 0%, #3a4055 70%, #1a1a2f 100%)',
          }}
        />
      )}
      <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full border border-slate-900 bg-slate-950/90 px-1 text-[10px] font-bold leading-4 text-amber-200">
        {tierToRoman(stone.tier)}
      </span>
    </span>
  )
}

// Bolsa de pedras: guarda pedras extras (não equipadas). Arraste um item para
// um slot do grid para equipar/trocar; arraste uma pedra equipada para cá para
// guardá-la de volta.
// Linha de um encantamento que bateu com o filtro: ícone + nome + valor.
function MatchRow({ en }) {
  const icon = enchantIconPath(en.name)
  return (
    <span className="flex items-center gap-1 text-xs">
      {icon && <img src={icon} alt="" className="size-4 shrink-0 object-contain" />}
      <span className="min-w-0 truncate text-amber-300/90">{en.name}</span>
      <span className="ml-auto shrink-0 font-semibold tabular-nums text-amber-200">
        {formatStatValue(en.value, en.unit)}
      </span>
    </span>
  )
}

export default function BagPanel({
  bag = [],
  onAdd,
  onEdit,
  onRemove,
  onDropToBag,
  highlight = [],
}) {
  const [adding, setAdding] = useState(false)
  const [over, setOver] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setOver(false)
    const payload = getDragPayload(e)
    if (payload?.from === 'slot' && payload.slotId) onDropToBag(payload.slotId)
  }

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={[
        'rounded-xl border bg-[#17172c] p-5 shadow-lg shadow-black/30 transition',
        over ? 'border-amber-400/60 bg-amber-400/5' : 'border-white/5',
      ].join(' ')}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Bag
        </h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/25"
          >
            + Add
          </button>
          {adding && (
            <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-md border border-white/10 bg-[#0f0f22] shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setAdding(false)
                  onAdd('magic')
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
              >
                Magic Stone
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false)
                  onAdd('spectro')
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
              >
                Spectromite
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Spare stones. Drag onto a slot to equip/swap, or drop an equipped stone here
        to store it.
      </p>

      {bag.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-500">
          Bag is empty.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bag.map((item) => {
            const matched = matchedEnchantments(item.stone, highlight)
            const isMatch = matched.length > 0
            return (
            <li
              key={item.id}
              draggable
              onDragStart={(e) => setDragPayload(e, { from: 'bag', bagId: item.id })}
              className={[
                'group flex cursor-grab items-center gap-2.5 rounded-lg border p-2 active:cursor-grabbing',
                isMatch
                  ? 'border-amber-400/70 bg-amber-400/10 ring-1 ring-amber-400/40'
                  : 'border-white/10 bg-[#0f0f22]',
              ].join(' ')}
            >
              <StoneIcon stone={item.stone} />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-slate-100">
                  {buildStoneName(item.stone) || 'Stone'}
                </p>
                {isMatch ? (
                  <span className="mt-0.5 flex flex-col gap-0.5">
                    {matched.map((en) => (
                      <MatchRow key={en.name} en={en} />
                    ))}
                  </span>
                ) : (
                  item.stone.enchantments?.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {item.stone.enchantments.length} enchantment
                      {item.stone.enchantments.length > 1 ? 's' : ''}
                    </p>
                  )
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  aria-label="Edit stone"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
                  aria-label="Remove stone"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
