// Parser do texto cru de OCR (Tesseract) -> lista de encantamentos.
// Estratégia: como temos o dicionário fixo de nomes (enchantments.js), cada
// linha lida é casada por SIMILARIDADE contra os nomes oficiais. Isso corrige
// erros típicos de OCR (ex.: "Antldemon Powor" -> "Antidemon Power") muito
// melhor do que confiar no texto cru.

import {
  ENCHANTMENTS,
  ENCHANT_UNIT_BY_NAME,
  ENCHANT_PT_ALIASES,
} from './enchantments.js'
import { ENCHANT_UNIT } from './options.js'

// Normaliza para comparar: remove acentos, minúsculas, só letras/dígitos,
// espaços colapsados. (Remover acentos é essencial p/ casar prints em PT:
// "EVASÃO" -> "evasao".)
function normalize(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Quebra um texto em tokens normalizados (palavras).
function tokenize(s) {
  return normalize(s).split(' ').filter(Boolean)
}

// Candidatos = nomes em inglês + aliases em PT, todos apontando para o nome
// canônico em inglês (que é o que o app armazena). Assim reconhecemos prints
// do jogo em qualquer um dos dois idiomas. Guardamos os tokens de cada um.
const CANON = [
  ...ENCHANTMENTS.map((e) => ({ name: e.name, toks: tokenize(e.name) })),
  ...Object.entries(ENCHANT_PT_ALIASES).map(([en, pt]) => ({
    name: en,
    toks: tokenize(pt),
  })),
]

// Distância de Levenshtein (iterativa, O(n·m)) entre duas strings.
function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let cur = new Array(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[b.length]
}

// Similaridade normalizada (0..1): 1 = idêntico.
function similarity(a, b) {
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  return 1 - levenshtein(a, b) / max
}

// Um token do nome do stat "aparece" no rótulo lido se houver um token igual
// (curtos têm de bater exatamente) ou bem parecido (≥0.75 p/ tolerar erro de OCR).
function tokenAppears(needle, labelToks) {
  return labelToks.some((lt) => {
    if (needle.length <= 2 || lt.length <= 2) return needle === lt
    return similarity(needle, lt) >= 0.75
  })
}

// Acha o melhor encantamento conhecido para um rótulo lido, por sobreposição de
// tokens: score = fração das palavras do nome do stat presentes no rótulo. Isso
// ignora lixo em volta (texto de outras colunas que o OCR junta na linha) e
// ainda distingue "EVASÃO" de "EVASÃO DE CRÍTICO". Empate é desfeito pelo nº de
// palavras casadas (mais específico vence). Devolve { name, score }.
function bestMatch(label) {
  const labelToks = tokenize(label)
  if (!labelToks.length) return { name: '', score: 0 }
  let best = { name: '', score: 0, hits: 0 }
  for (const c of CANON) {
    if (!c.toks.length) continue
    let hits = 0
    for (const t of c.toks) if (tokenAppears(t, labelToks)) hits++
    const score = hits / c.toks.length
    if (score > best.score || (score === best.score && hits > best.hits)) {
      best = { name: c.name, score, hits }
    }
  }
  return best
}

// Converte um token numérico lido em Number, lidando com separadores de
// milhar/decimal em PT e EN (o print pode estar em qualquer idioma):
//   "1,234" -> 1234   (vírgula + 3 dígitos = milhar)
//   "4,5"   -> 4.5    (vírgula + 1-2 dígitos = decimal, padrão PT)
//   "1.234,56" -> 1234.56 (último separador = decimal)
function parseNumber(raw) {
  let s = (raw || '').replace(/[+\s]/g, '')
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  if (hasDot && hasComma) {
    // O separador que aparece por último é o decimal.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (hasComma) {
    const after = s.split(',').pop()
    const grouped = /^-?\d{1,3}(,\d{3})+$/.test(s)
    if (grouped || (after.length === 3 && s.split(',').length === 2 && Number(s.split(',')[0]) !== 0))
      s = s.replace(/,/g, '') // milhar
    else s = s.replace(',', '.') // decimal
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// Extrai o valor de uma linha. Devolve { value, hadPercent, labelText }
// onde labelText é a linha sem a parte numérica (o provável nome do stat).
//
// Numa pedra APRIMORADA (+1, +2…) o jogo mostra a quebra entre parênteses, ex.:
// "HP 2,250 (2,250 +337)". O valor efetivo é a SOMA do que está DENTRO dos
// parênteses (2.250 + 337 = 2.587) — e NÃO de todos os números da linha (o que
// está fora dos parênteses é ignorado). Numa pedra sem aprimoramento não há
// parênteses: usamos o número normal da linha.
function extractValue(line) {
  // Se há parênteses, só o conteúdo deles conta para o valor.
  const paren = line.match(/\(([^)]*)\)/)
  const numSource = paren ? paren[1] : line

  // Captura todos os tokens numéricos, com sinal +/- opcional.
  const re = /([+\-]?\d[\d.,]*)/g
  let match
  let sum = 0
  let count = 0
  while ((match = re.exec(numSource)) !== null) {
    // Ignora tokens "vazios" (ex.: só um ponto solto).
    if (!/\d/.test(match[1])) continue
    const n = parseNumber(match[1])
    if (n == null) continue
    sum += n
    count++
  }
  if (!count) return { value: null, hadPercent: /%/.test(line), labelText: line }

  // Arredonda p/ evitar ruído de ponto flutuante ao somar decimais (ex.: 2.0 + 0.5).
  const value = Math.round(sum * 10000) / 10000
  const hadPercent = /%/.test(line)
  // Rótulo = texto antes do 1º número da linha inteira (o nome do stat não tem dígitos).
  const firstNum = line.match(/[+\-]?\d[\d.,]*/)
  const labelText = line
    .slice(0, firstNum ? firstNum.index : line.length)
    .replace(/[:=+\-(]+\s*$/, '')
    .trim()
  return { value, hadPercent, labelText: labelText || line }
}

// Fração mínima de palavras do stat presentes na linha para aceitar o match.
const MIN_SCORE = 0.65

// Recebe o texto cru do OCR e devolve as linhas que casaram com um stat
// conhecido: [{ name, value, unit, score, raw }], ordenadas pela ordem de
// leitura. Quem não bate com nada conhecido é descartado.
export function parseEnchantments(rawText) {
  const lines = (rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const out = []
  for (const rawLine of lines) {
    // O ícone à esquerda de cada stat costuma ser lido como um número solto no
    // começo da linha (ex.: "9 Hp 800" ou "7% Aumento ... 9%"). Se há um número
    // logo antes de uma letra, ele é lixo do ícone — removemos para não roubar o
    // valor do stat. (No layout do jogo o valor vem sempre DEPOIS do nome.)
    const line = rawLine.replace(/^\s*[+\-]?\d[\d.,]*%?\s+(?=[A-Za-zÀ-ɏ])/, '')
    const { value, hadPercent, labelText } = extractValue(line)
    const { name, score, hits } = bestMatch(labelText)
    if (!name || score < MIN_SCORE) continue
    // Sem número na linha: pode ser (a) texto de descrição do card — que NÃO
    // queremos — ou (b) um stat de verdade cujo valor o OCR não conseguiu ler
    // (ex.: "EVASAO DE CRÍTICO EV)" onde o 32 virou "EV)"). Para incluir (b) e
    // deixar o usuário só digitar o número — sem cair em (a) — exigimos um match
    // forte E uma linha "compacta" (poucas palavras além do nome do stat).
    if (value == null) {
      const extra = tokenize(labelText).length - hits
      if (score < 0.8 || extra > 2) continue
    }
    // Unidade: prioriza a canônica do stat; cai no sinal de % como reforço.
    const unit =
      ENCHANT_UNIT_BY_NAME[name] ??
      (hadPercent ? ENCHANT_UNIT.PERCENT : ENCHANT_UNIT.FLAT)
    out.push({ name, value, unit, score, raw: line })
  }
  return out
}

// ——— Identidade da pedra (cabeçalho do card) ———
// Tenta ler tipo, atributo, raridade e tier do texto. Inglês é o esperado
// (o usuário é avisado p/ capturar em inglês); aliases PT entram como reserva.

// Padrões por raridade (canônico em inglês -> grafias normalizadas EN/PT).
const RARITY_PATTERNS = [
  ['Common', ['common', 'comum']],
  ['Uncommon', ['uncommon', 'incomum']],
  ['Rare', ['rare', 'raro', 'rara']],
  ['Epic', ['epic', 'epico', 'epica']],
  ['Legendary', ['legendary', 'lendario', 'lendaria']],
  ['Mythic', ['mythic', 'mitico', 'mitica']],
]

// O jogo às vezes mostra a raridade só pela inicial entre colchetes (ex.: "[L]"
// = Legendary). Mapa da letra -> raridade canônica.
const BRACKET_RARITY = {
  c: 'Common',
  u: 'Uncommon',
  r: 'Rare',
  e: 'Epic',
  l: 'Legendary',
  m: 'Mythic',
}

// Padrões por atributo (canônico de options.js -> trecho "of X" / "de X").
const ATTR_PATTERNS = {
  'of Vigor': ['of vigor', 'de vigor'],
  'of Mana': ['of mana', 'de mana'],
  'of Focus': ['of focus', 'de foco'],
  'of Force': ['of force', 'de forca'],
  'of Destruction': ['of destruction', 'de destruicao'],
  'of Awakening': ['of awakening', 'de ascensao', 'de despertar'],
  'of Growth': ['of growth', 'de crescimento'],
  'of Agility': ['of agility', 'de agilidade'],
  'of Antidemon': ['of antidemon', 'antidemonio'],
  'of Precision': ['of precision', 'de precisao'],
}

function romanOrNum(s) {
  const map = { i: 1, ii: 2, iii: 3, iv: 4, v: 5 }
  if (/^\d+$/.test(s)) return Number(s)
  return map[s] ?? null
}

// Lê { type, attribute, rarity, tier, enhance } do cabeçalho do card. Ex. de
// título: "[L] Magic Stone of Force II +3" -> rarity Legendary (pela letra [L]),
// attribute "of Force", tier 2 (o romano "II", também grafado "II Grade/Grau") e
// enhance 3 (o "+3" após o nome). Campos não achados = '' / null / 0.
export function parseStoneInfo(rawText) {
  const raw = rawText || ''
  const low = raw.toLowerCase()
  const norm = normalize(raw)

  let attribute = ''
  for (const [opt, pats] of Object.entries(ATTR_PATTERNS)) {
    if (pats.some((p) => norm.includes(p))) {
      attribute = opt
      break
    }
  }

  // Tipo: Espectromite tem palavra própria; senão, "magic stone"/atributo = magic.
  let type = null
  if (/spectr|espectr/.test(norm)) type = 'spectro'
  else if (/magic stone|pedra magic/.test(norm) || attribute) type = 'magic'

  // Raridade: palavra cheia (EN/PT); senão a inicial entre colchetes ("[L]").
  let rarity = ''
  for (const [opt, pats] of RARITY_PATTERNS) {
    if (pats.some((p) => new RegExp(`\\b${p}\\b`).test(norm))) {
      rarity = opt
      break
    }
  }
  if (!rarity) {
    // Tolera o OCR ler os colchetes como (), {} ou |.
    const mb = low.match(/[[({|]\s*([curelm])\s*[\])}|]/)
    if (mb) rarity = BRACKET_RARITY[mb[1]] || ''
  }

  // Tier/Grau/Grade: "tier N", "II Grade", "grau 2"... ou o romano logo antes do
  // "+N" do aprimoramento (ex.: "Force II +3"). Aceita número ou romano.
  let tier = null
  const mt =
    low.match(/\b(\d+|i{1,3}|iv|v)\s*(?:grade|grau)\b/) ||
    low.match(/\b(?:grade|grau|tier)\s*(\d+|i{1,3}|iv|v)\b/) ||
    low.match(/\b(i{1,3}|iv|v)\s*\+\s*\d/)
  if (mt) {
    const t = romanOrNum(mt[1])
    if (t && t >= 1 && t <= 9) tier = t
  }

  // Aprimoramento "+N": buscado só numa linha de cabeçalho (que contém tipo/
  // raridade/grade/atributo), p/ não confundir com os "+337" dos próprios stats.
  let enhance = 0
  const headerLine = low
    .split(/\r?\n/)
    .find((l) => /stone|spectr|grade|grau|of \w|de \w|[[({|]\s*[curelm]\s*[\])}|]/.test(l) && /\+\s*\d/.test(l))
  const me = (headerLine || '').match(/\+\s*(\d{1,2})\b/)
  if (me) enhance = Number(me[1])

  return { type, attribute, rarity, tier, enhance }
}
