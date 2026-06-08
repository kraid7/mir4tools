import { useState } from 'react'
import { buildStoneName, tierToRoman } from '../data/slots.js'
import { getStoneIcon } from '../data/stoneIcons.js'

// Ícone real da pedra (arte oficial do MIR4) quando disponível; senão, gema
// neutra estilizada como fallback. Feedback visual de "slot preenchido".
export default function Slot({ slot, stone, onClick }) {
  const filled = Boolean(stone)
  const name = buildStoneName(stone)
  const [imgError, setImgError] = useState(false)
  const icon = filled && !imgError ? getStoneIcon(stone) : null

  return (
    <button
      type="button"
      onClick={() => onClick?.(slot)}
      title={filled ? name : `Empty slot — Min tier ${slot.minTier}`}
      className={[
        'group flex w-full items-center gap-3 rounded-lg border p-1.5 text-left transition',
        filled
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
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-sm font-medium text-slate-100">{name}</span>
          {stone.enchantments?.length > 0 && (
            <span className="text-xs text-slate-400">
              {stone.enchantments.length} enchantment
              {stone.enchantments.length > 1 ? 's' : ''}
            </span>
          )}
        </span>
      ) : (
        <span className="text-slate-500">—</span>
      )}
    </button>
  )
}
