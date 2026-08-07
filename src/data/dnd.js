// Carga de arrastar-e-soltar (drag and drop) entre a bolsa e os slots.
// from: 'bag' (arrastando da bolsa) ou 'slot' (arrastando uma pedra equipada).
//
// A carga leva junto `type` e `tier` da pedra (e, quando vem de um slot, o
// `minTier` do slot de origem) para que o alvo consiga dizer se aceita a pedra
// SEM precisar consultar o set. Isso é necessário porque durante o `dragover` o
// navegador bloqueia a leitura do dataTransfer por segurança — daí o espelho em
// memória abaixo.

export const DND_MIME = 'application/x-mir4-stone'

// Espelho da carga do arrasto em andamento. Só é confiável dentro da mesma
// aba/gesto de arraste, que é exatamente o caso de uso.
let current = null
let listening = false

// Marca no <body> que há um arraste em curso. O CSS usa isso para esconder os
// cartões de status, que senão cobrem o slot alvo bem na hora de soltar.
function markDragging(on) {
  if (typeof document === 'undefined') return
  if (on) document.body.dataset.dragging = 'true'
  else delete document.body.dataset.dragging
}

// Rede de segurança: solta a marcação mesmo que a pedra seja largada fora de
// qualquer alvo (aí nenhum onDrop de componente roda).
function listen(on) {
  if (typeof window === 'undefined' || on === listening) return
  const fn = on ? window.addEventListener : window.removeEventListener
  fn.call(window, 'dragend', clearDragPayload)
  fn.call(window, 'drop', clearDragPayload)
  listening = on
}

export function setDragPayload(e, payload) {
  current = payload
  markDragging(true)
  listen(true)
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
    return raw ? JSON.parse(raw) : current
  } catch {
    return current
  }
}

// Carga do arrasto em andamento, legível durante o dragover.
export function getCurrentDrag() {
  return current
}

export function clearDragPayload() {
  current = null
  markDragging(false)
  listen(false)
}
