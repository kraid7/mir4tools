// Export/import dos sets em arquivo JSON (backup/transferência entre
// dispositivos). Sem backend: o arquivo fica com o próprio usuário.

const FILE_TAG = 'mir4tools'
const FILE_TYPE = 'stone-sets'

// Dispara o download de um objeto como arquivo JSON.
export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Monta o envelope de exportação (com metadados).
export function buildExport(sets) {
  return {
    app: FILE_TAG,
    type: FILE_TYPE,
    version: 1,
    exportedAt: new Date().toISOString(),
    sets,
  }
}

// Lê/valida um arquivo importado e devolve uma lista de sets "limpa"
// (apenas name + stones; ids/favorito são recriados na importação).
export function parseImport(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid file (not valid JSON).')
  }
  const sets = Array.isArray(data) ? data : data?.sets
  if (!Array.isArray(sets)) {
    throw new Error('No sets found in this file.')
  }
  return sets
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      name: String(s.name || 'Imported set'),
      stones:
        s.stones && typeof s.stones === 'object' && !Array.isArray(s.stones)
          ? s.stones
          : {},
      bag: Array.isArray(s.bag) ? s.bag : [],
    }))
}
