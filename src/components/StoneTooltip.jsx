import { buildStoneName, tierToRoman } from '../data/slots.js'
import { enchantIconPath } from '../data/enchantments.js'
import { formatStatValue } from '../data/stats.js'

// Cartão com os status completos da pedra, exibido ao passar o mouse.
//
// Só usa <span> porque é renderizado dentro de um <button> (o slot) — <div>
// dentro de <button> é HTML inválido. Aparece via `group-hover/tip`, então o
// elemento pai precisa ter as classes `group/tip relative`.
//
// `highlight` são os encantamentos do filtro ativo: eles ficam em âmbar para
// você achar na hora o que estava procurando.
export default function StoneTooltip({ stone, highlight = [], align = 'left' }) {
  if (!stone) return null

  const wanted = new Set((highlight || []).map((n) => (n || '').toLowerCase()))
  const list = stone.enchantments || []
  const meta = [
    stone.rarity,
    stone.tier >= 2 ? `Tier ${tierToRoman(stone.tier)}` : 'Tier I',
    stone.enhance > 0 ? `+${stone.enhance}` : null,
  ].filter(Boolean)

  return (
    <span
      className={[
        'pointer-events-none absolute top-full z-50 mt-2 hidden w-72 flex-col rounded-lg',
        'border border-white/10 bg-[#0b0b18]/98 p-3 text-left shadow-xl shadow-black/60',
        'group-hover/tip:flex',
        align === 'right' ? 'right-0' : 'left-0',
      ].join(' ')}
      role="tooltip"
    >
      <span className="text-sm font-semibold text-slate-100">
        {buildStoneName(stone) || 'Stone'}
      </span>
      {meta.length > 0 && (
        <span className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">
          {meta.join(' · ')}
        </span>
      )}

      <span className="my-2 h-px bg-white/10" />

      {list.length === 0 ? (
        <span className="text-xs text-slate-500">No enchantments registered.</span>
      ) : (
        <span className="flex flex-col gap-1">
          {list.map((en, i) => {
            const icon = enchantIconPath(en.name)
            const hit = wanted.has((en.name || '').toLowerCase())
            return (
              // Índice como chave: a mesma pedra pode ter o encantamento
              // repetido, então o nome não serve de identificador único.
              <span key={`${en.name}-${i}`} className="flex items-center gap-1.5 text-xs">
                {icon ? (
                  <img src={icon} alt="" className="size-4 shrink-0 object-contain" />
                ) : (
                  <span className="size-4 shrink-0" />
                )}
                <span
                  className={[
                    'min-w-0 flex-1 truncate',
                    hit ? 'text-amber-300' : 'text-slate-300',
                  ].join(' ')}
                >
                  {en.name}
                </span>
                <span
                  className={[
                    'shrink-0 font-semibold tabular-nums',
                    hit ? 'text-amber-200' : 'text-slate-100',
                  ].join(' ')}
                >
                  {formatStatValue(en.value, en.unit)}
                </span>
              </span>
            )
          })}
        </span>
      )}
    </span>
  )
}
