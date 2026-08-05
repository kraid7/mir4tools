import { useState } from 'react'
import { buildStoneName, tierToRoman } from '../data/slots.js'
import { getStoneIcon } from '../data/stoneIcons.js'
import { setDragPayload, getDragPayload } from '../data/dnd.js'
import { matchedEnchantments, formatStatValue } from '../data/stats.js'
import { enchantIconPath } from '../data/enchantments.js'

// Ícone real da pedra (arte oficial do MIR4) quando disponível; senão, gema
// neutra estilizada como fallback. Feedback visual de "slot preenchido".
// Suporta arrastar-e-soltar: arraste a pedra equipada para fora, ou solte uma
// pedra da bolsa aqui para equipar/trocar.
// pickState: quando há uma pedra selecionada na bolsa (clique em vez de
// arrastar), 'ok' marca este slot como alvo válido e 'no' como incompatível.
export default function Slot({
  slot,
  stone,
  onClick,
  onEquip,
  highlight = [],
  pickState = null,
}) {
  const filled = Boolean(stone)
  const name = buildStoneName(stone)
  const [imgError, setImgError] = useState(false)
  const [over, setOver] = useState(false)
  const icon = filled && !imgError ? getStoneIcon(stone) : null
  const matched = filled ? matchedEnchantments(stone, highlight) : []

  const handleDrop = (e) => {
    e.preventDefault()
    setOver(false)
    const payload = getDragPayload(e)
    if (payload?.from === 'bag' && payload.bagId) onEquip?.(slot.id, payload.bagId)
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(slot)}
      draggable={filled}
      onDragStart={(e) =>
        filled && setDragPayload(e, { from: 'slot', slotId: slot.id })
      }
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      title={
        pickState === 'ok'
          ? filled
            ? `Click to swap — ${name}`
            : 'Click to equip here'
          : pickState === 'no'
            ? `Incompatible slot — Min tier ${slot.minTier}`
            : filled
              ? name
              : `Empty slot — Min tier ${slot.minTier}`
      }
      className={[
        'group flex w-full items-center gap-3 rounded-lg border p-1.5 text-left transition',
        pickState === 'no' ? 'cursor-not-allowed opacity-40' : '',
        pickState === 'ok'
          ? 'border-emerald-400/70 bg-emerald-400/10 ring-2 ring-emerald-400/50 hover:bg-emerald-400/20'
          : over
            ? 'border-amber-400/70 bg-amber-400/15'
            : matched.length > 0
              ? 'border-amber-400/60 bg-amber-400/10 ring-1 ring-amber-400/40'
              : filled
                ? 'border-amber-400/25 bg-amber-400/5 hover:bg-amber-400/10'
                : 'border-transparent hover:bg-white/5',
      ].join(' ')}
    >
      {/* Gema / círculo do slot */}
      <span className="relative shrink-0">
        {icon ? (
          // Ícone real da pedra (já vem com moldura própria; não recortar).
          <span className="flex size-14 items-center justify-center">
            <img
              src={icon}
              alt={name}
              className="size-full object-contain drop-shadow"
              draggable={false}
              onError={() => setImgError(true)}
            />
          </span>
        ) : (
          <span
            className={[
              'flex size-14 items-center justify-center rounded-full ring-2 transition',
              filled
                ? 'ring-amber-300/50'
                : 'ring-slate-600/40 group-hover:ring-slate-400/60',
            ].join(' ')}
            style={
              filled
                ? {
                    background:
                      'radial-gradient(circle at 38% 30%, #6b7280 0%, #3a4055 70%, #1a1a2f 100%)',
                  }
                : { backgroundColor: '#232337' }
            }
          >
            {!filled && (
              <span className="text-xl text-transparent transition group-hover:text-slate-300">
                +
              </span>
            )}
          </span>
        )}

        {/* Badge de tier no canto superior direito */}
        {filled && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border border-slate-900 bg-slate-950/90 px-1 text-[11px] font-bold leading-5 text-amber-200">
            {tierToRoman(stone.tier)}
          </span>
        )}

        {/* Selo de "incluída" no canto inferior esquerdo */}
        {filled && (
          <span className="absolute -bottom-1 -left-1 flex size-4 items-center justify-center rounded-full border border-slate-900 bg-emerald-500 text-[10px] font-bold leading-none text-slate-950 shadow">
            ✓
          </span>
        )}

        {/* Badge de aprimoramento (+N) no canto inferior direito */}
        {filled && stone.enhance > 0 && (
          <span className="absolute -bottom-1 -right-1 rounded-full border border-slate-900 bg-amber-500 px-1 text-[10px] font-bold leading-4 text-slate-950 shadow">
            +{stone.enhance}
          </span>
        )}
      </span>

      {/* Nome da pedra (ou placeholder "-") */}
      {filled ? (
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-sm font-medium text-slate-100">{name}</span>
          {matched.length > 0 ? (
            <span className="mt-0.5 flex flex-col gap-0.5">
              {matched.map((en) => {
                const enIcon = enchantIconPath(en.name)
                return (
                  <span key={en.name} className="flex items-center gap-1 text-xs">
                    {enIcon && (
                      <img
                        src={enIcon}
                        alt=""
                        className="size-4 shrink-0 object-contain"
                      />
                    )}
                    <span className="min-w-0 truncate text-amber-300/90">
                      {en.name}
                    </span>
                    <span className="ml-auto shrink-0 font-semibold tabular-nums text-amber-200">
                      {formatStatValue(en.value, en.unit)}
                    </span>
                  </span>
                )
              })}
            </span>
          ) : (
            stone.enchantments?.length > 0 && (
              <span className="text-xs text-slate-400">
                {stone.enchantments.length} enchantment
                {stone.enchantments.length > 1 ? 's' : ''}
              </span>
            )
          )}
        </span>
      ) : (
        <span className="text-slate-500">—</span>
      )}
    </button>
  )
}
