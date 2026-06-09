// Carga de arrastar-e-soltar (drag and drop) entre a bolsa e os slots.
// from: 'bag' (arrastando da bolsa) ou 'slot' (arrastando uma pedra equipada).

export const DND_MIME = 'application/x-mir4-stone'

export function setDragPayload(e, payload) {
  try {
    e.dataTransfer.setData(DND_MIME, JSON.stringify(payload))
    // Fallback para navegadores que só expõem text/plain durante o dragover.
    e.dataTransfer.setData('text/plain', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  } catch {
    /* ignora */
  }
}

export function getDragPayload(e) {
  try {
    const raw = e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData('text/plain')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
