import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSets } from '../context/SetsContext.jsx'
import { ALL_SLOTS } from '../data/slots.js'
import { buildExport, downloadJSON, parseImport } from '../data/io.js'

const TOTAL_SLOTS = ALL_SLOTS.length

const fileName = (s) =>
  `mir4tools-${String(s).trim().replace(/\s+/g, '-').toLowerCase() || 'set'}.json`

export default function SetsList() {
  const {
    sets,
    createSet,
    deleteSet,
    duplicateSet,
    renameSet,
    toggleFavorite,
    addSets,
  } = useSets()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const handleExportAll = () => {
    if (sets.length === 0) return
    downloadJSON('mir4tools-sets.json', buildExport(sets))
  }

  const handleExportOne = (set) =>
    downloadJSON(fileName(set.name), buildExport([set]))

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reimportar o mesmo arquivo
    if (!file) return
    try {
      const imported = parseImport(await file.text())
      if (imported.length === 0) throw new Error('No sets found in this file.')
      const n = addSets(imported)
      window.alert(`${n} set(s) imported.`)
    } catch (err) {
      window.alert(`Import failed: ${err.message}`)
    }
  }

  const handleCreate = () => {
    const id = createSet('New set')
    navigate(`/set/${id}`)
  }

  const handleRename = (set) => {
    const name = window.prompt('Set name:', set.name)
    if (name != null) renameSet(set.id, name)
  }

  const handleDelete = (set) => {
    if (window.confirm(`Delete set "${set.name}"? This cannot be undone.`))
      deleteSet(set.id)
  }

  // Favorites first, then creation order.
  const ordered = [...sets].sort((a, b) => Number(b.favorite) - Number(a.favorite))

  return (
    <div className="min-h-screen bg-[#14142a] text-slate-200">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-xl font-bold tracking-wide text-slate-100">
              My Stone Sets
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Create and manage different stone configurations.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Import
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              disabled={sets.length === 0}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-40"
            >
              Export all
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
            >
              + New set
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {ordered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-400">
            <p>You don't have any sets yet.</p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
            >
              Create first set
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ordered.map((set) => {
              const count = Object.keys(set.stones || {}).length
              return (
                <li
                  key={set.id}
                  className="flex flex-col rounded-xl border border-white/5 bg-[#17172c] p-4 shadow-lg shadow-black/30"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/set/${set.id}`)}
                      className="text-left"
                    >
                      <h2 className="font-semibold text-slate-100 hover:text-amber-200">
                        {set.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {count}/{TOTAL_SLOTS} stones
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(set.id)}
                      title={set.favorite ? 'Favorite' : 'Mark as favorite'}
                      className={[
                        'rounded p-1 text-lg leading-none transition',
                        set.favorite
                          ? 'text-amber-300'
                          : 'text-slate-600 hover:text-amber-200',
                      ].join(' ')}
                    >
                      {set.favorite ? '★' : '☆'}
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => navigate(`/set/${set.id}`)}
                      className="rounded-md bg-white/5 px-2.5 py-1.5 text-slate-200 hover:bg-white/10"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRename(set)}
                      className="rounded-md bg-white/5 px-2.5 py-1.5 text-slate-200 hover:bg-white/10"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateSet(set.id)}
                      className="rounded-md bg-white/5 px-2.5 py-1.5 text-slate-200 hover:bg-white/10"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportOne(set)}
                      className="rounded-md bg-white/5 px-2.5 py-1.5 text-slate-200 hover:bg-white/10"
                    >
                      Export
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(set)}
                      className="rounded-md bg-rose-500/10 px-2.5 py-1.5 text-rose-300 hover:bg-rose-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
