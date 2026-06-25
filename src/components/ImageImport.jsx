import { useEffect, useId, useRef, useState } from 'react'
import { SLOT_TYPE, MAX_TIER, tierToRoman } from '../data/slots.js'
import {
  ENCHANT_UNIT,
  ATTRIBUTE_OPTIONS,
  ATTRIBUTE_FIXED_ENCHANT,
  RARITY_OPTIONS,
} from '../data/options.js'
import {
  ENCHANTMENTS,
  ENCHANT_UNIT_BY_NAME,
  enchantIconPath,
} from '../data/enchantments.js'
import { parseEnchantments, parseStoneInfo } from '../data/ocr.js'

let _rid = 0
const rowId = () => `r${++_rid}`

// Garante que a Pedra Mágica tenha seu encantamento fixo (stat principal do
// atributo, ex.: "of Awakening" -> "All ATK DMG Boost") no topo da lista, com a
// unidade correta. Reaproveita uma linha já lida com o mesmo nome (mantendo o
// valor do OCR) em vez de duplicar; se o OCR não pegou, cria a linha vazia.
function withFixedEnchant(list, type, attribute) {
  if (type !== SLOT_TYPE.MAGIC) return list
  const fixedName = ATTRIBUTE_FIXED_ENCHANT[attribute]
  if (!fixedName) return list
  const unit = ENCHANT_UNIT_BY_NAME[fixedName] ?? ENCHANT_UNIT.PERCENT
  const idx = list.findIndex((r) => r.name === fixedName)
  const base =
    idx >= 0 ? list[idx] : { id: rowId(), name: fixedName, value: '', score: 1 }
  const fixed = { ...base, name: fixedName, unit }
  const rest = idx >= 0 ? list.filter((_, i) => i !== idx) : list
  return [fixed, ...rest]
}

const canCapture =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia

// Importa uma pedra a partir de um print: o usuário captura a janela do jogo
// (ou sobe/cola uma imagem), recorta a região dos stats e o OCR (Tesseract.js,
// 100% no navegador — nada sai do PC) auto-preenche os encantamentos, casando
// cada linha contra os nomes oficiais. Cria a pedra direto na bolsa.
export default function ImageImport({ onConfirm, onClose }) {
  const [stoneType, setStoneType] = useState(SLOT_TYPE.MAGIC)
  const [attribute, setAttribute] = useState('')
  const [rarity, setRarity] = useState('')
  const [tier, setTier] = useState(1)
  const [enhance, setEnhance] = useState(0)
  const [imgSrc, setImgSrc] = useState(null)
  const [status, setStatus] = useState('idle') // idle | ready | running | done | error
  const [progress, setProgress] = useState(0)
  const [sel, setSel] = useState(null) // recorte em coords da imagem exibida
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const [debugImg, setDebugImg] = useState(null) // imagem pós-processamento
  const [rawText, setRawText] = useState('') // texto cru do OCR

  const fileRef = useRef(null)
  const imgRef = useRef(null)
  const startRef = useRef(null)
  const draggingRef = useRef(false)
  const listId = useId()

  // Fechar com Esc
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Colar imagem da área de transferência (Ctrl+V).
  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) =>
        i.type.startsWith('image/'),
      )
      const file = item?.getAsFile()
      if (file) loadImage(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carrega uma imagem (arquivo, colar ou captura) e volta ao passo de recorte.
  const loadImage = (src) => {
    setError('')
    setRows([])
    setSel(null)
    setProgress(0)
    setAttribute('')
    setRarity('')
    setTier(1)
    setEnhance(0)
    setDebugImg(null)
    setRawText('')
    setImgSrc(typeof src === 'string' ? src : URL.createObjectURL(src))
    setStatus('ready')
  }

  const onPickFile = (e) => {
    const file = e.target.files?.[0]
    if (file) loadImage(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setOver(false)
    const file = [...(e.dataTransfer?.files || [])].find((f) =>
      f.type.startsWith('image/'),
    )
    if (file) loadImage(file)
  }

  // Captura uma janela/tela via browser e usa o quadro como imagem.
  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' },
        audio: false,
      })
      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      await video.play()
      await new Promise((r) => requestAnimationFrame(r))
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      stream.getTracks().forEach((t) => t.stop())
      loadImage(canvas.toDataURL('image/png'))
    } catch (err) {
      // Usuário cancelou o seletor de tela: ignora silenciosamente.
      if (err?.name !== 'NotAllowedError') {
        console.error(err)
        setError('Screen capture failed.')
      }
    }
  }

  // ——— Seleção do recorte (pointer events: mouse no PC) ———
  const pointAt = (e) => {
    const r = imgRef.current.getBoundingClientRect()
    return {
      x: Math.min(Math.max(e.clientX - r.left, 0), r.width),
      y: Math.min(Math.max(e.clientY - r.top, 0), r.height),
    }
  }
  const onPointerDown = (e) => {
    if (status === 'running') return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    startRef.current = pointAt(e)
    setSel({ x: startRef.current.x, y: startRef.current.y, w: 0, h: 0 })
  }
  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    const p = pointAt(e)
    const s = startRef.current
    setSel({
      x: Math.min(s.x, p.x),
      y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
    })
  }
  const onPointerUp = () => {
    draggingRef.current = false
  }

  // Recorta (+ amplia) e roda o OCR.
  const readImage = async () => {
    const img = imgRef.current
    if (!img) return
    setError('')
    setRows([])
    setStatus('running')
    setProgress(0)
    let worker
    try {
      const scaleX = img.naturalWidth / img.clientWidth
      const scaleY = img.naturalHeight / img.clientHeight
      let sx = 0,
        sy = 0,
        sw = img.naturalWidth,
        sh = img.naturalHeight
      if (sel && sel.w > 6 && sel.h > 6) {
        sx = sel.x * scaleX
        sy = sel.y * scaleY
        sw = sel.w * scaleX
        sh = sel.h * scaleY
      }
      // Apenas amplia (3x) a região recortada. O painel da pedra tem fonte
      // pequena; o upscale dá mais pixels por caractere. NÃO mexemos nas cores —
      // o Tesseract já binariza sozinho, e manipular contraste/inverter estava
      // "estourando" os caracteres e piorando a leitura.
      const UP = 3
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(sw * UP)
      canvas.height = Math.round(sh * UP)
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      // Guarda a imagem processada p/ diagnóstico (é o que o OCR realmente vê).
      setDebugImg(canvas.toDataURL('image/png'))

      // Import dinâmico: o motor de OCR (pesado) só carrega quando usado.
      // Só inglês: mais preciso e download menor (o usuário é avisado para
      // tirar o print com o jogo em inglês).
      // Inglês + Português: o painel pode estar em qualquer um dos dois; os
      // números são iguais e os nomes acentuados em PT passam a ser lidos certos.
      const { createWorker } = await import('tesseract.js')
      worker = await createWorker('eng+por', undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        },
      })
      // PSM 6 = "um bloco uniforme de texto": melhor pro painel de stats recortado
      // (mantém nome e valor na mesma linha e acerta mais os números).
      await worker.setParameters({ tessedit_pageseg_mode: '6' })
      const {
        data: { text },
      } = await worker.recognize(canvas)
      setRawText(text)
      const parsed = parseEnchantments(text).map((p) => ({
        id: rowId(),
        name: p.name,
        value: p.value ?? '',
        unit: p.unit,
        score: p.score,
      }))
      // Identidade da pedra (tipo/atributo/raridade/tier) lida do cabeçalho.
      const info = parseStoneInfo(text)
      const type = info.type || stoneType
      // Já insere o stat fixo do atributo (a "base" da pedra) na lista lida.
      setRows(withFixedEnchant(parsed, type, info.attribute || ''))
      if (info.type) setStoneType(info.type)
      setAttribute(info.attribute || '')
      setRarity(info.rarity || '')
      setTier(info.tier || 1)
      setEnhance(info.enhance || 0)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Could not read the image. Try selecting a tighter area.')
      setStatus('error')
    } finally {
      if (worker) await worker.terminate()
    }
  }

  const setRow = (id, patch) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id))
  const addRow = () =>
    setRows((rs) => [
      ...rs,
      { id: rowId(), name: '', value: '', unit: ENCHANT_UNIT.PERCENT, score: 1 },
    ])
  const onRowName = (id, name) => {
    const knownUnit = ENCHANT_UNIT_BY_NAME[name]
    setRow(id, knownUnit ? { name, unit: knownUnit } : { name })
  }

  const handleConfirm = () => {
    const enchantments = rows
      .map((r) => ({
        name: r.name.trim(),
        value: r.value === '' ? null : Number(r.value),
        unit: r.unit,
      }))
      .filter((e) => e.name !== '' || e.value !== null)
    onConfirm({
      type: stoneType,
      attribute: stoneType === SLOT_TYPE.MAGIC ? attribute.trim() : undefined,
      rarity: rarity.trim(),
      tier: Number(tier) || 1,
      enhance: Number(enhance) || 0,
      enchantments,
    })
  }

  const showRows = status === 'done' || status === 'error'
  // Encantamento sempre tem valor: não deixa salvar com algum stat nomeado e sem valor.
  const missingValues = rows.some((r) => r.name.trim() !== '' && r.value === '')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#17172c] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Import from image</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Reads enchantments off a stone · processed on your device
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

        {/* Aviso de idioma: o OCR lê inglês. */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          <span aria-hidden>🌐</span>
          <span>
            Reads stat panels in <strong>English</strong> or{' '}
            <strong>Portuguese</strong>. Capture at a high resolution and crop
            tight around the stats for the best results.
          </span>
        </div>

        {/* Tipo da pedra */}
        <div className="mb-4 flex gap-2">
          {[
            [SLOT_TYPE.MAGIC, 'Magic Stone'],
            [SLOT_TYPE.SPECTRO, 'Spectromite'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStoneType(val)}
              className={[
                'flex-1 rounded-md px-3 py-2 text-sm font-medium',
                stoneType === val
                  ? 'bg-amber-500/30 text-amber-100 ring-1 ring-amber-400/40'
                  : 'bg-[#0f0f22] text-slate-400 hover:bg-white/5',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Fontes: capturar janela ou subir/colar */}
        <div className="mb-3 flex gap-2">
          {canCapture && (
            <button
              type="button"
              onClick={captureScreen}
              className="flex-1 rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
            >
              ⧉ Capture game window
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-md bg-[#0f0f22] px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            ⤓ Upload / paste image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        {/* Sem imagem ainda: dropzone */}
        {!imgSrc && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={[
              'flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition',
              over ? 'border-amber-400/60 bg-amber-400/5' : 'border-white/15 hover:border-white/30',
            ].join(' ')}
          >
            <p className="text-sm text-slate-300">
              Capture the game window, or drop / paste (Ctrl+V) a screenshot
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Then drag a box over the stat list to read just that area.
            </p>
          </div>
        )}

        {/* Imagem + recorte */}
        {imgSrc && (
          <div className="mt-1">
            <p className="mb-1.5 text-xs text-slate-400">
              Drag a box over the <strong>stat list</strong> (optional — leave empty
              to read the whole image).
            </p>
            <div className="flex justify-center">
              <div
                className="relative inline-block touch-none select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="to crop"
                  draggable={false}
                  className="max-h-72 w-auto rounded-md"
                />
                {sel && (
                  <div
                    className="pointer-events-none absolute border-2 border-amber-400 bg-amber-400/10"
                    style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
                  />
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {sel && (
                  <button
                    type="button"
                    onClick={() => setSel(null)}
                    className="rounded-md px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={readImage}
                disabled={status === 'running'}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'running' ? 'Reading…' : 'Read selection'}
              </button>
            </div>
          </div>
        )}

        {status === 'running' && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Reading image…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

        {/* Resultado: identidade da pedra (lida do cabeçalho, editável) */}
        {showRows && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stoneType === SLOT_TYPE.MAGIC && (
              <label className="flex flex-col gap-1 text-sm sm:col-span-3">
                <span className="text-slate-300">Attribute</span>
                <select
                  value={attribute}
                  onChange={(e) => {
                    const a = e.target.value
                    setAttribute(a)
                    setRows((rs) => withFixedEnchant(rs, stoneType, a))
                  }}
                  className="rounded-md border border-white/10 bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none focus:border-amber-400/60"
                >
                  <option value="">— Select —</option>
                  {ATTRIBUTE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Rarity</span>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="rounded-md border border-white/10 bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none focus:border-amber-400/60"
              >
                <option value="">— Select —</option>
                {RARITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Tier</span>
              <select
                value={tier}
                onChange={(e) => setTier(Number(e.target.value))}
                className="rounded-md border border-white/10 bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none focus:border-amber-400/60"
              >
                {Array.from({ length: MAX_TIER }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t}>
                    {t} ({tierToRoman(t)})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Enhancement (+N)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={enhance}
                onChange={(e) => setEnhance(e.target.value)}
                className="rounded-md border border-white/10 bg-[#0f0f22] px-3 py-2 text-slate-100 outline-none focus:border-amber-400/60"
              />
            </label>
          </div>
        )}

        {/* Resultado: encantamentos lidos (editáveis) */}
        {showRows && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">
                Detected enchantments
              </span>
              <button
                type="button"
                onClick={addRow}
                className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/25"
              >
                + Add
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-sm text-slate-500">
                Nothing recognized. Add rows manually or select a tighter area.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {rows.map((r) => {
                  const iconPath = enchantIconPath(r.name)
                  const lowConf = r.score < 0.78
                  // Stat reconhecido mas sem valor: o OCR não leu o número.
                  // Encantamento sempre tem valor, então sinalizamos p/ preencher.
                  const missingValue = r.name.trim() !== '' && r.value === ''
                  return (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center">
                        {iconPath && (
                          <img src={iconPath} alt="" className="size-6 object-contain" />
                        )}
                      </span>
                      <input
                        list={listId}
                        value={r.name}
                        onChange={(e) => onRowName(r.id, e.target.value)}
                        placeholder="Enchantment name"
                        title={lowConf ? 'Low confidence — please check' : ''}
                        className={[
                          'min-w-0 flex-1 rounded-md border bg-[#0f0f22] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400/60',
                          lowConf ? 'border-amber-400/50' : 'border-white/10',
                        ].join(' ')}
                      />
                      <input
                        type="number"
                        step="any"
                        value={r.value}
                        onChange={(e) => setRow(r.id, { value: e.target.value })}
                        placeholder="Value"
                        title={
                          missingValue
                            ? "Couldn't read this value — type it in"
                            : ''
                        }
                        className={[
                          'w-20 rounded-md border bg-[#0f0f22] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400/60',
                          missingValue
                            ? 'border-rose-400/70 ring-1 ring-rose-400/40'
                            : 'border-white/10',
                        ].join(' ')}
                      />
                      <div className="flex overflow-hidden rounded-md border border-white/10">
                        <button
                          type="button"
                          onClick={() => setRow(r.id, { unit: ENCHANT_UNIT.PERCENT })}
                          className={[
                            'px-2 py-1.5 text-sm',
                            r.unit === ENCHANT_UNIT.PERCENT
                              ? 'bg-amber-500/30 text-amber-100'
                              : 'text-slate-400 hover:bg-white/5',
                          ].join(' ')}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => setRow(r.id, { unit: ENCHANT_UNIT.FLAT })}
                          className={[
                            'px-2 py-1.5 text-sm',
                            r.unit === ENCHANT_UNIT.FLAT
                              ? 'bg-amber-500/30 text-amber-100'
                              : 'text-slate-400 hover:bg-white/5',
                          ].join(' ')}
                        >
                          0,0
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {missingValues && (
              <p className="mt-2 text-xs text-rose-300">
                Couldn't read one or more values (highlighted). Type them in —
                an enchantment always has a value.
              </p>
            )}
          </div>
        )}

        {/* Diagnóstico: o que o OCR realmente recebeu e leu (ajuda a calibrar). */}
        {showRows && (debugImg || rawText) && (
          <details className="mt-5 rounded-lg border border-white/10 bg-[#0f0f22]">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200">
              OCR diagnostics (processed image + raw text)
            </summary>
            <div className="space-y-3 px-3 pb-3">
              {debugImg && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">
                    Image sent to the reader. If the text looks blurry here,
                    capture at a higher resolution / crop tighter.
                  </p>
                  <img
                    src={debugImg}
                    alt="processed"
                    className="max-h-60 w-auto rounded border border-white/10"
                  />
                </div>
              )}
              {rawText && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Raw text:</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded border border-white/10 bg-black/30 p-2 text-xs text-slate-300">
                    {rawText}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        <datalist id={listId}>
          {ENCHANTMENTS.map((e) => (
            <option key={e.name} value={e.name} />
          ))}
        </datalist>

        {/* Ações */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={rows.length === 0 || missingValues}
            title={missingValues ? 'Fill in the highlighted value(s) first' : ''}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to bag
          </button>
        </div>
      </div>
    </div>
  )
}
