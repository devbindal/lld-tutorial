import { useState } from 'react'
import { Code, C, Reveal, Note, Warn, Good, Quiz } from '../../../components/ui.jsx'

/* ============================================================
   Demo 1 — Upload with dedup + reference counting + GC
   ============================================================ */

// Pre-defined "files" with chunk hashes.
// File 1: 6 unique chunks. File 2: shares 4 chunks with File 1.
const FILE_DEFS = {
  'notes.txt': {
    label: 'notes.txt (6 chunks)',
    chunks: ['a1b2', 'c3d4', 'e5f6', 'g7h8', 'i9j0', 'k1l2'],
  },
  'report.docx': {
    label: 'report.docx (8 chunks, 4 shared)',
    chunks: ['a1b2', 'c3d4', 'm3n4', 'o5p6', 'e5f6', 'g7h8', 'q7r8', 's9t0'],
  },
}

function UploadDedupDemo() {
  // blockStore: { [hash]: { refs: number } }
  const [blockStore, setBlockStore] = useState({})
  // uploaded files: { [name]: chunkList }
  const [uploaded, setUploaded] = useState({})
  const [log, setLog] = useState([])
  const [selected, setSelected] = useState('notes.txt')

  function addLog(msg, type = 'info') {
    setLog(prev => [...prev, { msg, type }])
  }

  function handleUpload() {
    const file = FILE_DEFS[selected]
    if (uploaded[selected]) {
      addLog(`"${selected}" is already uploaded.`, 'warn')
      return
    }

    const existingHashes = Object.keys(blockStore)
    const needed = file.chunks.filter(h => !existingHashes.includes(h))
    const deduped = file.chunks.filter(h => existingHashes.includes(h))

    addLog(`Uploading "${selected}" — ${file.chunks.length} chunks total.`)
    if (needed.length < file.chunks.length) {
      addLog(`Server says: "I already have [${deduped.join(', ')}] — only send [${needed.join(', ')}]"`, 'good')
    } else {
      addLog(`Server says: "No existing chunks — send all ${needed.length} chunks"`)
    }

    const newStore = { ...blockStore }
    // add missing chunks to block store
    for (const h of needed) {
      newStore[h] = { refs: 0 }
    }
    // increment ref counts for ALL chunks this file uses
    for (const h of file.chunks) {
      newStore[h] = { refs: newStore[h].refs + 1 }
    }

    const savedChunks = file.chunks.length - needed.length
    const savedPct = Math.round((savedChunks / file.chunks.length) * 100)

    setBlockStore(newStore)
    setUploaded(prev => ({ ...prev, [selected]: file.chunks }))
    addLog(
      savedChunks > 0
        ? `Done! Uploaded ${needed.length} new chunks. Deduped ${savedChunks} (saved ${savedPct}% storage).`
        : `Done! Uploaded all ${needed.length} new chunks.`,
      'good'
    )
  }

  function handleDelete(name) {
    if (!uploaded[name]) return
    const chunks = uploaded[name]
    const newStore = { ...blockStore }
    const gcList = []

    for (const h of chunks) {
      newStore[h] = { refs: newStore[h].refs - 1 }
      if (newStore[h].refs === 0) {
        delete newStore[h]
        gcList.push(h)
      }
    }

    const newUploaded = { ...uploaded }
    delete newUploaded[name]

    setBlockStore(newStore)
    setUploaded(newUploaded)
    addLog(
      gcList.length > 0
        ? `Deleted "${name}". GC removed chunks [${gcList.join(', ')}] (refCount=0). Shared chunks kept.`
        : `Deleted "${name}". All chunks still referenced by other files — nothing GC'd.`,
      gcList.length > 0 ? 'info' : 'good'
    )
  }

  function handleReset() {
    setBlockStore({})
    setUploaded({})
    setLog([])
  }

  const totalChunks = Object.keys(blockStore).length
  const naiveTotal = Object.values(uploaded).reduce((s, ch) => s + ch.length, 0)
  const saved = naiveTotal - totalChunks

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Upload with dedup — reference counting + GC</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div className="modbtns">
          {Object.keys(FILE_DEFS).map(name => (
            <button key={name} className={selected === name ? 'on' : ''} onClick={() => setSelected(name)}>
              {FILE_DEFS[name].label}
            </button>
          ))}
        </div>
        <button className="act" onClick={handleUpload}>Upload</button>
        <button className="act ghost" onClick={handleReset}>Reset</button>
      </div>

      {/* Block store grid */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
          Block Store (content-addressed by SHA-256 hash):
        </div>
        {totalChunks === 0 ? (
          <div className="heap" style={{ minHeight: 60 }}>
            <div className="empty">Block store empty</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(blockStore).map(([hash, { refs }]) => (
              <div key={hash} className="obj" style={{ minWidth: 90, textAlign: 'center', padding: '8px 12px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)' }}>{hash}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>refs: <strong>{refs}</strong></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploaded files */}
      {Object.keys(uploaded).length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Uploaded files:</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(uploaded).map(([name, chunks]) => (
              <div key={name} className="class-card" style={{ padding: '8px 14px', minWidth: 160 }}>
                <div className="cname" style={{ fontSize: 12 }}>{name}</div>
                <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'var(--mono)', color: '#555' }}>
                  [{chunks.join(', ')}]
                </div>
                <button className="act ghost" style={{ fontSize: 11, padding: '3px 8px', marginTop: 6 }}
                  onClick={() => handleDelete(name)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {totalChunks > 0 && (
        <div className="statbar" style={{ marginBottom: 12 }}>
          Unique chunks in block store: <strong>{totalChunks}</strong>
          &nbsp;|&nbsp;Naive total (no dedup): <strong>{naiveTotal}</strong>
          &nbsp;|&nbsp;Chunks saved by dedup: <strong>{saved}</strong>
          {naiveTotal > 0 && <>&nbsp;({Math.round((saved / naiveTotal) * 100)}% savings)</>}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div style={{ fontSize: 12, background: '#F4F4F0', borderRadius: 6, padding: '8px 12px', maxHeight: 160, overflowY: 'auto' }}>
          {log.map((entry, i) => (
            <div key={i} style={{
              color: entry.type === 'good' ? '#2E7D32' : entry.type === 'warn' ? '#E65100' : 'var(--ink)',
              marginBottom: 3
            }}>
              &gt; {entry.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Demo 2 — Delta Sync across devices
   ============================================================ */

// A file "notes.txt" with 4 chunks
const INITIAL_CHUNKS = ['AA11', 'BB22', 'CC33', 'DD44']

function DeltaSyncDemo() {
  const [serverChunks, setServerChunks] = useState([...INITIAL_CHUNKS])
  const [devices, setDevices] = useState({
    laptop: { chunks: [...INITIAL_CHUNKS], dirty: [] },
    phone:  { chunks: [...INITIAL_CHUNKS], dirty: [] },
    tablet: { chunks: [...INITIAL_CHUNKS], dirty: [] },
  })
  const [log, setLog] = useState([])
  const [naiveBytes, setNaiveBytes] = useState(0)
  const [deltaBytes, setDeltaBytes] = useState(0)

  function addLog(msg, type = 'info') {
    setLog(prev => [...prev, { msg, type }])
  }

  function editChunk(device, idx) {
    const newHash = Math.random().toString(36).slice(2, 6).toUpperCase()
    setDevices(prev => {
      const dev = prev[device]
      const newChunks = [...dev.chunks]
      newChunks[idx] = newHash
      const newDirty = dev.dirty.includes(idx) ? dev.dirty : [...dev.dirty, idx]
      return { ...prev, [device]: { chunks: newChunks, dirty: newDirty } }
    })
    addLog(`${device}: edited chunk ${idx + 1} → new hash ${newHash}`)
  }

  function syncDevice(device) {
    const dev = devices[device]
    if (dev.dirty.length === 0) {
      addLog(`${device}: nothing changed — no sync needed.`, 'good')
      return
    }

    const changedChunks = dev.dirty.length
    const totalChunks = dev.chunks.length
    const naiveCost = totalChunks  // naive: upload all chunks
    const deltaCost = changedChunks  // delta: only changed chunks

    addLog(`${device} → server: "here are my chunk hashes: [${dev.chunks.join(', ')}]"`)
    addLog(`server → ${device}: "chunks ${dev.dirty.map(i => i + 1).join(', ')} differ — upload only those"`)
    addLog(`${device}: uploading ${deltaCost} chunk(s) instead of ${naiveCost}. Saved ${naiveCost - deltaCost} chunk uploads!`, 'good')

    const newServerChunks = [...dev.chunks]
    setServerChunks(newServerChunks)
    setNaiveBytes(prev => prev + naiveCost)
    setDeltaBytes(prev => prev + deltaCost)

    // other devices get notification to pull changed chunks
    const otherDevices = Object.keys(devices).filter(d => d !== device)
    setDevices(prev => {
      const next = { ...prev, [device]: { ...prev[device], dirty: [] } }
      for (const other of otherDevices) {
        // mark the same indices as needing download
        next[other] = {
          chunks: [...dev.chunks],
          dirty: [],
        }
      }
      return next
    })
    addLog(`server → [${otherDevices.join(', ')}]: "chunks ${dev.dirty.map(i => i + 1).join(', ')} updated — download only these"`, 'good')
  }

  function handleReset() {
    setServerChunks([...INITIAL_CHUNKS])
    setDevices({
      laptop: { chunks: [...INITIAL_CHUNKS], dirty: [] },
      phone:  { chunks: [...INITIAL_CHUNKS], dirty: [] },
      tablet: { chunks: [...INITIAL_CHUNKS], dirty: [] },
    })
    setLog([])
    setNaiveBytes(0)
    setDeltaBytes(0)
  }

  const deviceLabels = { laptop: 'Alice\'s Laptop', phone: 'Alice\'s Phone', tablet: 'Alice\'s Tablet' }
  const deviceIcons  = { laptop: '💻', phone: '📱', tablet: '📟' }

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Delta sync — edit chunks on a device, then sync</div>
      <p style={{ fontSize: 13, marginBottom: 12 }}>
        <strong>Step 1:</strong> Click a chunk on a device to simulate editing it.
        <strong> Step 2:</strong> Click Sync to upload only changed chunks to the server.
        Watch other devices pull only the changed chunks too.
      </p>

      {/* Server state */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Server — latest version of notes.txt:</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {serverChunks.map((h, i) => (
            <div key={i} className="obj" style={{ padding: '6px 12px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 10, color: '#888' }}>chunk {i + 1}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>{h}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Devices */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.entries(devices).map(([devId, dev]) => (
          <div key={devId} className="class-card" style={{ padding: '10px 14px', minWidth: 200 }}>
            <div className="cname" style={{ fontSize: 13, marginBottom: 8 }}>
              {deviceIcons[devId]} {deviceLabels[devId]}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {dev.chunks.map((h, i) => (
                <div key={i}
                  onClick={() => editChunk(devId, i)}
                  title="Click to edit this chunk"
                  style={{
                    padding: '5px 8px', borderRadius: 4, textAlign: 'center', cursor: 'pointer',
                    background: dev.dirty.includes(i) ? '#FFF3E0' : '#EEF2FF',
                    border: dev.dirty.includes(i) ? '2px solid var(--amber)' : '1px solid var(--line)',
                    minWidth: 50
                  }}>
                  <div style={{ fontSize: 9, color: '#888' }}>chunk {i + 1}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: dev.dirty.includes(i) ? '#E65100' : 'var(--blue)', marginTop: 1 }}>{h}</div>
                  {dev.dirty.includes(i) && <div style={{ fontSize: 9, color: '#E65100' }}>edited</div>}
                </div>
              ))}
            </div>
            <button className="act" style={{ fontSize: 12, padding: '4px 12px' }}
              onClick={() => syncDevice(devId)}>
              Sync {dev.dirty.length > 0 ? `(${dev.dirty.length} changed)` : ''}
            </button>
          </div>
        ))}
      </div>

      {/* Bandwidth meter */}
      {(naiveBytes > 0 || deltaBytes > 0) && (
        <div className="statbar" style={{ marginBottom: 12 }}>
          Chunks uploaded (naive re-upload all): <strong>{naiveBytes}</strong>
          &nbsp;|&nbsp;Chunks uploaded (delta sync): <strong>{deltaBytes}</strong>
          &nbsp;|&nbsp;Savings: <strong>{naiveBytes - deltaBytes} chunks</strong>
          {naiveBytes > 0 && <>&nbsp;({Math.round(((naiveBytes - deltaBytes) / naiveBytes) * 100)}%)</>}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div style={{ fontSize: 12, background: '#F4F4F0', borderRadius: 6, padding: '8px 12px', maxHeight: 160, overflowY: 'auto' }}>
          {log.map((entry, i) => (
            <div key={i} style={{
              color: entry.type === 'good' ? '#2E7D32' : 'var(--ink)',
              marginBottom: 3
            }}>
              &gt; {entry.msg}
            </div>
          ))}
        </div>
      )}

      <button className="act ghost" style={{ marginTop: 10, fontSize: 12 }} onClick={handleReset}>Reset</button>
    </div>
  )
}

/* ============================================================
   Demo 3 — Version history + storage efficiency
   ============================================================ */

const VERSION_DEFS = [
  { label: 'Version 1', chunks: ['A', 'B', 'C', 'D'] },
  { label: 'Version 2', chunks: ['A', "B'", 'C', 'D'] },       // only B changed
  { label: 'Version 3', chunks: ['A', "B'", "C'", "D'"] },     // B, C, D changed
]

function VersionHistoryDemo() {
  const [versions, setVersions] = useState([VERSION_DEFS[0]])
  const [log, setLog] = useState([])

  function addVersion(idx) {
    if (versions.length > idx) return   // already added
    const def = VERSION_DEFS[idx]
    if (!def) return
    setVersions(prev => [...prev, def])
    const prevChunks = VERSION_DEFS[idx - 1].chunks
    const newChunks = def.chunks.filter(c => !prevChunks.includes(c))
    setLog(prev => [
      ...prev,
      `Added ${def.label}: ${def.chunks.length} chunks total. Only ${newChunks.length} new chunk(s) [${newChunks.join(', ')}] stored. Shared chunks cost 0 extra bytes.`
    ])
  }

  function restoreV1() {
    // Restoring V1 = uploading [A,B,C,D]. All already exist → 0 new chunks
    const already = versions.flatMap(v => v.chunks)
    const v1Chunks = VERSION_DEFS[0].chunks
    const newChunks = v1Chunks.filter(c => !already.includes(c))
    const v4 = { label: 'Version 4 (restored V1)', chunks: v1Chunks }
    setVersions(prev => [...prev, v4])
    setLog(prev => [
      ...prev,
      `Restored to V1 as Version 4. All chunks [${v1Chunks.join(', ')}] already in block store — 0 new chunks uploaded. Restoration is free!`
    ])
  }

  // Compute unique chunks across all versions
  const allChunks = [...new Set(versions.flatMap(v => v.chunks))]
  const naiveTotal = versions.reduce((s, v) => s + v.chunks.length, 0)
  const storageUsed = allChunks.length
  const saved = naiveTotal - storageUsed

  const alreadyRestored = versions.some(v => v.label.includes('restored'))

  return (
    <div className="panel">
      <div className="ptitle">Live demo · Version history — shared chunks across versions</div>

      {/* Version buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {VERSION_DEFS.slice(1).map((def, i) => (
          <button key={i} className="act"
            disabled={versions.length > i + 1}
            onClick={() => addVersion(i + 1)}>
            {versions.length > i + 1 ? `${def.label} (added)` : `Add ${def.label}`}
          </button>
        ))}
        {versions.length >= 3 && !alreadyRestored && (
          <button className="act ghost" onClick={restoreV1}>Restore to V1</button>
        )}
      </div>

      {/* Versions table */}
      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table className="matrix" style={{ fontSize: 12, minWidth: 360 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Version</th>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>Chunk list</th>
              <th style={{ textAlign: 'left', padding: '6px 10px' }}>New chunks stored</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v, i) => {
              const prevAllChunks = i === 0 ? [] : [...new Set(versions.slice(0, i).flatMap(vv => vv.chunks))]
              const newChunks = v.chunks.filter(c => !prevAllChunks.includes(c))
              return (
                <tr key={i}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{v.label}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    {v.chunks.map((c, ci) => {
                      const isNew = newChunks.includes(c)
                      return (
                        <span key={ci} style={{
                          display: 'inline-block', marginRight: 6, padding: '2px 6px', borderRadius: 3,
                          background: isNew ? '#E8F5E9' : '#EEF2FF',
                          border: isNew ? '1px solid #81C784' : '1px solid #C5CAE9',
                          color: isNew ? '#2E7D32' : 'var(--blue)'
                        }}>
                          {c}{isNew ? ' ★' : ''}
                        </span>
                      )
                    })}
                  </td>
                  <td style={{ padding: '6px 10px', color: newChunks.length === 0 ? '#2E7D32' : 'var(--ink)' }}>
                    {newChunks.length === 0 ? '0 (free!)' : newChunks.join(', ')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Block store */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Unique chunks in block store (★ = first introduced in that version):</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {allChunks.map(c => (
            <div key={c} className="obj" style={{ padding: '6px 10px', minWidth: 50, textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--blue)' }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="statbar">
        Unique chunks stored: <strong>{storageUsed}</strong>
        &nbsp;|&nbsp;Naive (store each version separately): <strong>{naiveTotal}</strong>
        &nbsp;|&nbsp;Chunks saved: <strong>{saved}</strong>
        {naiveTotal > 0 && saved > 0 && <>&nbsp;({Math.round((saved / naiveTotal) * 100)}% savings)</>}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ fontSize: 12, background: '#F4F4F0', borderRadius: 6, padding: '8px 12px', marginTop: 10 }}>
          {log.map((msg, i) => (
            <div key={i} style={{ color: '#2E7D32', marginBottom: 3 }}>&gt; {msg}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Quiz data
   ============================================================ */
const QUESTIONS = [
  {
    q: 'What is the key insight behind content-addressable storage (CAS)?',
    o: [
      'Each file is assigned a random unique ID at upload time',
      'Chunks are addressed by their position (byte offset) in the file',
      'Files are stored in alphabetical order by name',
      'A chunk\'s ID is computed from its content (SHA-256), so identical content always has the same ID',
    ],
    a: 3,
    e: 'In CAS, the ID of a chunk IS its content hash. Two chunks with identical bytes get the same hash, so the block store stores them once. This is what enables automatic deduplication.',
    w: {
      0: 'Random UUIDs are common for file IDs in the metadata layer, but chunk IDs in a CAS system are derived deterministically from content — that\'s the whole point.',
      1: 'Byte-offset addressing is how a naive file system works. CAS uses content hashes so the same data at different offsets still gets the same ID.',
      2: 'File names are metadata in the metadata DB — they have nothing to do with how chunks are stored or addressed.',
    },
    r: { id: 's3', label: 'Section 3 — Content-addressable storage' },
  },
  {
    q: 'A user uploads a 10-chunk file. The server already has 6 of those chunks. How many chunks are actually transferred?',
    o: ['4 (only the missing ones)', '10 (all chunks — always re-upload the whole file)', '0 (the server constructs the file from the hashes)', '6 (the ones the server has)'],
    a: 0,
    e: 'The upload init step sends all chunk hashes to the server. The server responds with a list of chunks it NEEDS (the ones it doesn\'t already have). The client uploads only those — 4 in this case.',
    w: {
      1: 'That\'s what naive single-blob upload does. Chunked upload + CAS exists precisely to avoid this.',
      2: 'The server can\'t reconstruct byte content from hashes alone — it needs the actual chunk bytes for any hash it doesn\'t already store.',
      3: 'The 6 chunks the server already has are the ones it does NOT need — the client skips those.',
    },
    r: { id: 's6', label: 'Section 6 — Upload protocol (init → upload → commit)' },
  },
  {
    q: 'Why is storageUsed updated at commit time, not at chunk upload time?',
    o: [
      'Chunks are too large to track individually',
      'Commits are faster than chunk uploads',
      'Because deduped chunks cost the user 0 bytes — we only charge for truly new chunks, and we know that only after all chunks arrive',
      'To avoid database writes during the slow upload phase',
    ],
    a: 2,
    e: 'When a chunk is uploaded it might already exist in the block store (deduped). In that case it costs this user 0 bytes of new storage. Only at commit time do we know exactly which chunks were new (neededChunks), so we charge only for those.',
    w: {
      0: 'Chunk sizes are tracked precisely — each Chunk record has a size field.',
      1: 'Commit speed is unrelated. The reason is semantic: we don\'t know the final deduplicated cost until we know which chunks were already present.',
      3: 'Avoiding DB writes during upload is a valid performance concern, but the primary reason here is correctness: only new chunks should count against quota.',
    },
    r: { id: 's7', label: 'Section 7 — Commit, quota check, and reference counting' },
  },
  {
    q: 'A chunk has a reference count of 0. What does that mean, and what should happen?',
    o: [
      'The chunk is corrupted and should be repaired',
      'The chunk is shared between many files and is too expensive to delete',
      'No file version references this chunk anymore — it can be garbage collected from the block store',
      'The chunk is brand new and has not been referenced yet — keep it',
    ],
    a: 2,
    e: 'Reference counting tracks how many FileVersion records list a given chunk. When every version that referenced a chunk is deleted, the count drops to 0. At that point no one needs the chunk, so the block store can safely delete it to free space.',
    w: {
      0: 'A refCount of 0 has nothing to do with corruption — it purely means the chunk is unreachable from any live file version.',
      1: 'A count of 0 means the OPPOSITE — no files reference it, so it is safe to delete.',
      3: 'A newly uploaded chunk gets its reference count set to 1 immediately at commit time. A count of 0 means all references have been removed.',
    },
    r: { id: 's7', label: 'Section 7 — Reference counting and GC' },
  },
  {
    q: 'What is delta sync, and why does it save bandwidth?',
    o: [
      'Syncing only when on Wi-Fi, not on mobile data',
      'Storing only the diff (line-by-line changes) between two file versions',
      'Compressing the file before upload',
      'Uploading only the changed chunks (identified by comparing chunk hashes), not the whole file',
    ],
    a: 3,
    e: 'Delta sync works because of chunking + CAS. The client computes the SHA-256 of each local chunk and sends those hashes to the server. The server compares with the stored version\'s chunk hashes. Any chunk whose hash matches is unchanged — only the chunks with a different hash need to be transferred.',
    w: {
      0: 'Wi-Fi vs mobile data is a client-side network policy, not the delta sync algorithm.',
      1: 'Line-level diffs (like git) operate on text. Chunked delta sync works on binary chunks and doesn\'t require understanding file format — it\'s more general.',
      2: 'Compression reduces size but still transfers all chunks. Delta sync is about only transferring chunks that actually changed — a fundamentally different saving.',
    },
    r: { id: 's8', label: 'Section 8 — Delta sync' },
  },
  {
    q: 'Why does restoring a file to a previous version cost 0 bytes of new storage (in the ideal case)?',
    o: [
      'The file is small enough to fit in a cache',
      'Because the chunks of the old version are still in the block store (refCount &gt; 0 from other versions) — the new version just points to the same chunk hashes',
      'Only the latest version is stored; all others are deleted',
      'The system copies the old file data back into the new version\'s slot',
    ],
    a: 1,
    e: 'As long as any version of a file still exists, its chunks stay in the block store with refCount &gt; 0. Restoring V1 means creating a new FileVersion record with the same chunkIds as V1. Those chunks are already there — 0 new bytes stored, 0 new chunk uploads needed.',
    w: {
      0: 'Cache size is irrelevant. The savings come from the fact that unchanged chunk hashes point to existing block-store entries.',
      2: 'Keeping only the latest version would be the naive approach. The whole point of versioning is to keep all versions efficiently by sharing chunks.',
      3: 'The block store is content-addressed; there are no "slots" to copy into. The new version simply lists the same hashes — the bytes are never moved.',
    },
    r: { id: 's9', label: 'Section 9 — Version history demo' },
  },
  {
    q: 'Why does the system use TWO separate stores — a metadata DB and a block store — instead of storing everything in one database?',
    o: [
      'Because two stores are always better than one',
      'Because raw chunk bytes are large and would bloat the metadata DB; block stores (S3/GCS) are purpose-built for cheap, scalable blob storage while the metadata DB handles fast relational queries',
      'Because files must be encrypted in a separate store',
      'Because relational databases cannot store files at all',
    ],
    a: 1,
    e: 'A metadata DB (Postgres/MySQL) excels at fast indexed queries: "find all files owned by user X", "list versions of file Y". But storing gigabytes of raw bytes in a relational DB is expensive and slow. Block stores like S3 are cheap per GB, infinitely scalable, and optimized for large binary objects. Separating concerns gives you the best of both.',
    w: {
      0: 'Two stores adds operational complexity. The reason must be concrete: the two stores serve fundamentally different access patterns and cost profiles.',
      2: 'Encryption is orthogonal — you can encrypt data in either store. Separation is about access pattern and cost, not encryption.',
      3: 'Many databases support BLOB columns. The reason is not that it\'s impossible — it\'s that it\'s impractical at scale.',
    },
    r: { id: 's5', label: 'Section 5 — Entity model and two-store architecture' },
  },
  {
    q: 'Two users upload the exact same 100MB file. How much total storage does the block store use?',
    o: [
      '100MB — content-addressed storage means identical chunks hash to the same ID and are stored once',
      '200MB — one copy per user',
      '0MB — the block store deduplicates entire files, not chunks',
      '50MB — the second upload is compressed automatically',
    ],
    a: 0,
    e: 'Both users\' files are split into chunks. Each chunk gets the SHA-256 of its content as its ID. Because both files are identical, every chunk has the same hash. The block store already has all those chunks after the first upload. The second user\'s commit just increments the refCounts — no new bytes stored. Total block store usage: 100MB.',
    w: {
      1: 'That would be a naive per-user silo with no deduplication. Content-addressable storage exists to avoid exactly this.',
      2: 'Deduplication happens at the chunk level, not the whole-file level. But because the files are identical, all chunks are identical, so the net effect is the same as whole-file dedup here.',
      3: 'Compression is a separate concern and is not automatic in the base design. Even with compression, you\'d store one compressed copy, not half.',
    },
    r: { id: 's3', label: 'Section 3 — CAS and dedup savings' },
  },
]

/* ============================================================
   Day 83 page
   ============================================================ */
export default function Day83() {
  return (
    <div className="scrollarea">

      {/* ── HERO ── */}
      <div className="hero">
        <div className="eyebrow">Bonus · Week 17 · Day 83</div>
        <h1>File Storage System:<br />Chunking, Dedup &amp; Sync</h1>
        <p>
          Dropbox stores billions of files without storing duplicate bytes.
          The secret: every file is a list of chunk hashes, not a blob.
          Change one word in a document, sync one chunk. Build the whole system from scratch.
        </p>
        <div className="chips">
          {['Chunking', 'Content Hash', 'Dedup', 'Delta Sync', 'Block Store', 'Versioning', 'Reference Counting', 'Quota'].map(c => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── SECTION 1 — THE PROBLEM + ANALOGY ── */}
      <section id="s1">
        <div className="sec-label">Section 1</div>
        <h2>The problem: storing billions of files without wasting space</h2>
        <p>
          Imagine you are building Dropbox. One hundred million users each store photos, documents, and
          code. Many users have the same software installer, the same stock photo, the same template
          document. If you store every file as a separate blob in a database, you waste enormous space on
          duplicates. And if a user edits one sentence of a 100MB file, do you really re-upload 100MB?
        </p>
        <p>
          The solution is the <strong>library archive analogy</strong>. Picture a national library's archive
          system. Every book is cut into standard-size "chapters" (chunks). Each chapter is given a unique
          ID based on its exact content — the chapter ID is a fingerprint of the words on the page.
          Two copies of the same book don't use double the shelf space: the library keeps one physical copy
          of each chapter and two index cards pointing to it. When you borrow a book, the librarian
          assembles the chapters in order from the shelf.
        </p>
        <Code html={`<span class="cm">// The library archive analogy mapped to file storage:</span>

Chapter     →  Chunk           <span class="cm">// fixed-size piece of a file</span>
Chapter ID  →  SHA-256(chunk)  <span class="cm">// fingerprint of the content, not the file</span>
Index card  →  FileVersion     <span class="cm">// "this file = chapters [C1, C3, C7, ...]"</span>
Shelf slot  →  Block Store     <span class="cm">// where actual bytes live (S3 / GCS)</span>
Card index  →  Metadata DB     <span class="cm">// fast lookup: user, folder, version</span>

<span class="cm">// Two users upload the same 100MB installer:</span>
<span class="cm">// Block store holds 100MB once.</span>
<span class="cm">// Two FileVersion records each list the same chunk IDs.</span>
<span class="cm">// User B's upload costs 0 new bytes of block-store storage.</span>`} />
        <Note>
          The key insight: <strong>a file is not a blob. A file is a list of chunk IDs.</strong> The chunk bytes
          live in a separate block store, addressed purely by their content hash.
        </Note>
      </section>

      {/* ── SECTION 2 — CHUNKING ── */}
      <section id="s2">
        <div className="sec-label">Section 2</div>
        <h2>Chunking — why not one big blob?</h2>
        <p>
          Chunking means splitting a file into pieces of fixed size (e.g. 4 MB each). Why bother?
          Three reasons, each powerful on its own:
        </p>
        <Code html={`<span class="cm">// Reason 1 — RESUMABLE UPLOADS</span>
<span class="cm">// Upload a 1GB file. Network drops at chunk 60 of 250.</span>
<span class="cm">// Without chunking: restart from byte 0. Lose 60% of work.</span>
<span class="cm">// With chunking: resume from chunk 61. Only 40% left.</span>

<span class="cm">// Reason 2 — DELTA SYNC</span>
<span class="cm">// A 10-chunk file. User edits only chunk 3.</span>
<span class="cm">// Client sends chunk hashes [h1,h2,h3_new,h4,...,h10] to server.</span>
<span class="cm">// Server: "h3 is new; the rest I already have."</span>
<span class="cm">// Client uploads 1 chunk, not 10. 90% bandwidth saved.</span>

<span class="cm">// Reason 3 — DEDUPLICATION</span>
<span class="cm">// Two files share a common header (license block, template, etc.)</span>
<span class="cm">// Those shared chunks have the same content → same SHA-256 → same ID.</span>
<span class="cm">// Block store stores them once, both files point to the same slot.</span>

File:     [ chunk1 | chunk2 | chunk3 | chunk4 ]  ← each ~4 MB
                                 ↑
           hash(chunk3) = e5f6a1...  (chunk ID in block store)
           If chunk3 is unchanged in the next upload → no re-upload`} />
        <Warn>
          Chunk size is a trade-off. Smaller chunks = finer dedup and sync, but more metadata rows and
          more HTTP round-trips. Larger chunks = fewer round-trips, but coarser delta sync. 4 MB is a
          common real-world sweet spot (Dropbox uses variable-length "rolling hash" chunking for even
          better dedup, but fixed-size is the right starting point for an interview).
        </Warn>
      </section>

      {/* ── SECTION 3 — CONTENT-ADDRESSABLE STORAGE ── */}
      <section id="s3">
        <div className="sec-label">Section 3</div>
        <h2>Content-addressable storage — the fingerprint trick</h2>
        <p>
          In a normal file system, you name a file and give it an ID. Content-addressable storage (CAS)
          flips this: the ID of a piece of data <em>is</em> its content fingerprint (SHA-256 hash).
          You don't assign an ID — you compute it. Same content always gets the same ID.
        </p>
        <Code html={`<span class="cm">// CAS in one line:</span>
<span class="cm">// chunk ID = SHA-256(chunk bytes)</span>

<span class="cm">// Example:</span>
byte[] chunk = <span class="str">"Hello, world!"</span>.getBytes();
String id = sha256(chunk);  <span class="cm">// "315f5bdb76..."  ← always the same string</span>

<span class="cm">// Now store it:</span>
<span class="cm">// blockStore.put("315f5bdb76...", chunk);</span>

<span class="cm">// Ten users upload a file containing "Hello, world!" as chunk 2:</span>
<span class="cm">// All compute id = "315f5bdb76..."</span>
<span class="cm">// Block store check: already exists? YES.</span>
<span class="cm">// No upload needed. Just increment refCount.</span>

┌──────────────────────────────────────────────┐
│            DEDUP FLOW                        │
│                                              │
│  Client hashes:   [h1] [h2] [h3] [h4]       │
│                          ↓                  │
│  POST /upload/init  (sends all hashes)       │
│                          ↓                  │
│  Server checks block store for each hash     │
│   h1: NOT found → needed                    │
│   h2: FOUND  ✓  → skip                      │
│   h3: NOT found → needed                    │
│   h4: FOUND  ✓  → skip                      │
│                          ↓                  │
│  Response: { chunksNeeded: [h1, h3] }        │
│  Client uploads ONLY h1 and h3              │
│  Commit: server creates FileVersion          │
│           [h1, h2, h3, h4]                  │
└──────────────────────────────────────────────┘`} />
        <Good>
          This three-step dance (init → upload missing → commit) is the heart of every efficient file
          sync system. The server never asks for bytes it already has.
        </Good>
        <Reveal summary="Why SHA-256? What if two different chunks happen to produce the same hash?">
          SHA-256 produces a 256-bit hash. The chance of a collision (two different inputs giving the
          same hash) is astronomically small — roughly 1 in 2^128 if you store 10^18 chunks. In practice,
          the entire internet has not produced a known SHA-256 collision. Real systems (Dropbox, Git) treat
          SHA-256 collisions as an acceptable theoretical risk. For a new system, it's a fine assumption
          to state aloud in an interview.
        </Reveal>
      </section>

      {/* ── SECTION 4 — DEMO 1: UPLOAD WITH DEDUP ── */}
      <section id="s4">
        <div className="sec-label">Section 4 · Interactive</div>
        <h2>Play: Upload with dedup — watch the block store fill</h2>
        <p>
          Select a file and click <strong>Upload</strong>. Watch which chunks are added to the block
          store and which are reused. Upload the second file — it shares 4 chunks with the first.
          Then delete files and see reference counts drop. When a chunk's refCount hits 0, it gets
          garbage collected.
        </p>
        <UploadDedupDemo />
        <Good>
          Notice that "report.docx" (8 chunks) uploads only 6 new chunks because 4 were already in
          the block store from "notes.txt". The savings counter shows the dedup benefit. When you
          delete "notes.txt", the shared chunks drop to refCount=1 (still held by report.docx). Only
          when the last file referencing a chunk is deleted does that chunk get GC'd.
        </Good>
      </section>

      {/* ── SECTION 5 — ENTITY MODEL + TWO-STORE ARCHITECTURE ── */}
      <section id="s5">
        <div className="sec-label">Section 5</div>
        <h2>Entity model and two-store architecture</h2>
        <Code html={`<span class="cm">// ── METADATA DB (Postgres/MySQL) ──────────────────────────────</span>
<span class="cm">// Small rows. Fast indexed queries. Relationships between entities.</span>

<span class="kw">class</span> User {
    String id;           <span class="cm">// UUID</span>
    String email;
    <span class="kw">long</span> storageUsed;   <span class="cm">// bytes currently used</span>
    <span class="kw">long</span> storageQuota;  <span class="cm">// max allowed bytes (e.g. 15GB free tier)</span>
}

<span class="kw">class</span> File {
    String id, ownerId, name, folderId;
    <span class="kw">long</span> size;            <span class="cm">// bytes (latest version)</span>
    String latestVersionId;
}

<span class="kw">class</span> FileVersion {
    String id, fileId;
    <span class="kw">int</span> versionNumber;
    List&lt;String&gt; chunkIds;   <span class="cm">// ordered list of chunk hashes</span>
    String checksum;          <span class="cm">// SHA-256 of the whole file (integrity check)</span>
    Instant createdAt;
}

<span class="kw">class</span> Chunk {
    String id;    <span class="cm">// SHA-256 of content ← this IS the primary key</span>
    <span class="kw">int</span> size;     <span class="cm">// bytes — needed for quota math</span>
    <span class="kw">int</span> refCount; <span class="cm">// how many FileVersion rows reference this chunk</span>
    <span class="cm">// Note: actual bytes are NOT here — they're in the block store</span>
}

<span class="kw">enum</span> Permission { READ, WRITE, COMMENT }

<span class="kw">class</span> Share {
    String id, fileId, sharedWithUserId;
    Permission permission;
}

<span class="cm">// ── BLOCK STORE (S3 / GCS) ────────────────────────────────────</span>
<span class="cm">// Large blobs. Cheap per GB. Content-addressed by hash key.</span>
<span class="cm">// API:  blockStore.put(hash, bytes)</span>
<span class="cm">//       blockStore.get(hash)  → bytes</span>
<span class="cm">//       blockStore.delete(hash)</span>
<span class="cm">// The application NEVER stores raw bytes in the metadata DB.</span>`} />

        <Code html={`<span class="cm">// TWO-STORE ARCHITECTURE  (why separate them?)</span>

┌──────────────────────────┐      ┌────────────────────────────┐
│     Metadata DB          │      │      Block Store (S3)       │
│  (Postgres / MySQL)      │      │                            │
│                          │      │  315f5b...  → [bytes]      │
│  File rows               │      │  a1b2c3...  → [bytes]      │
│  FileVersion rows        │─────▶│  e5f6aa...  → [bytes]      │
│  Chunk rows (no bytes!)  │      │  (cheap per GB, scalable)  │
│  User / Share rows       │      │                            │
│                          │      │  Access: by hash key only  │
│  Access: SQL queries,    │      │  No joins, no indexes       │
│  joins, indexes, TX      │      └────────────────────────────┘
└──────────────────────────┘

Metadata DB: fast queries, ACID transactions, small rows
Block store: unlimited scale, cheap storage, large blobs`} />
        <Note>
          Sharing and permissions: the <C>Share</C> table links a file to another user with a
          permission level. Folder sharing means all child files inherit the share — you can either
          store one row per child (expensive) or store the share at the folder level and resolve
          permissions recursively at access time (common approach).
        </Note>
      </section>

      {/* ── SECTION 6 — UPLOAD PROTOCOL + JAVA CODE ── */}
      <section id="s6">
        <div className="sec-label">Section 6</div>
        <h2>Upload protocol: init → upload missing chunks → commit</h2>
        <p>
          The upload is a three-step protocol, not a single request. This is what enables dedup
          and resumability.
        </p>
        <Code html={`<span class="cm">// STEP 1 — Client splits the file and sends chunk hashes</span>
<span class="cm">// POST /files/upload/init</span>
<span class="cm">// Body: { userId, fileName, chunkHashes: ["a1b2", "c3d4", "e5f6"] }</span>

UploadSession initUpload(String userId, String fileName,
                         List&lt;String&gt; chunkHashes) {

    <span class="cm">// ask the DB: which of these hashes do we already have?</span>
    Set&lt;String&gt; existing = chunkRepo.findExistingHashes(chunkHashes);

    <span class="cm">// only ask the client to upload what we're missing</span>
    List&lt;String&gt; needed = chunkHashes.stream()
        .filter(h -&gt; !existing.contains(h))
        .collect(toList());

    <span class="cm">// create a session so we remember the full ordered list</span>
    String sessionId = UUID.randomUUID().toString();
    UploadSession session = <span class="kw">new</span> UploadSession(sessionId, userId,
                                  fileName, chunkHashes, needed);
    uploadSessions.put(sessionId, session);  <span class="cm">// in-memory or Redis</span>
    <span class="kw">return</span> session;   <span class="cm">// client reads session.needed() to know what to send</span>
}

<span class="cm">// STEP 2 — Client uploads ONLY the missing chunks</span>
<span class="cm">// PUT /chunks/{hash}  (one request per missing chunk)</span>
<span class="kw">void</span> storeChunk(String hash, <span class="kw">byte</span>[] data) {
    String computed = sha256(data);         <span class="cm">// verify integrity</span>
    <span class="kw">if</span> (!computed.equals(hash))
        <span class="kw">throw new</span> IntegrityException(<span class="str">"Hash mismatch — data corrupted in transit"</span>);
    blockStore.put(hash, data);             <span class="cm">// write to S3 / GCS</span>
    chunkRepo.save(<span class="kw">new</span> Chunk(hash, data.length, <span class="num">0</span>));  <span class="cm">// refCount=0 until commit</span>
}`} />
        <Note>
          At step 2, the chunk is written to the block store with refCount=0. It is not yet
          linked to any FileVersion. This is intentional — if the client crashes before commit,
          a background job can GC orphan chunks (refCount=0 with no pending session).
        </Note>
      </section>

      {/* ── SECTION 7 — COMMIT, QUOTA, REFCOUNT, GC ── */}
      <section id="s7">
        <div className="sec-label">Section 7</div>
        <h2>Commit, quota check, reference counting, and GC</h2>
        <Code html={`<span class="cm">// STEP 3 — Client commits: creates FileVersion + charges quota</span>
<span class="cm">// POST /files/upload/commit  { sessionId, fileId }</span>

FileVersion commitUpload(String sessionId, String fileId) {
    UploadSession session = uploadSessions.get(sessionId);

    <span class="cm">// count bytes of NEW chunks only</span>
    <span class="cm">// deduped chunks (already in block store) cost this user 0 bytes</span>
    <span class="kw">long</span> newBytes = session.neededChunks().stream()
        .mapToLong(chunkRepo::getSize)
        .sum();

    User user = userRepo.find(session.userId());
    <span class="kw">if</span> (user.storageUsed() + newBytes &gt; user.storageQuota())
        <span class="kw">throw new</span> QuotaExceededException(
            <span class="str">"Upload would exceed your storage quota"</span>);

    <span class="cm">// create the new version — ordered list of all chunk hashes</span>
    <span class="kw">int</span> nextVersion = fileVersionRepo.countVersions(fileId) + <span class="num">1</span>;
    FileVersion v = <span class="kw">new</span> FileVersion(fileId, nextVersion,
                          session.chunkHashes(), Instant.now());
    fileVersionRepo.save(v);

    <span class="cm">// CRITICAL: increment reference count on EVERY chunk (old and new)</span>
    <span class="cm">// old chunks were already in block store; their refCount was &gt;= 1</span>
    <span class="cm">// new chunks just arrived with refCount=0; after this they'll be 1</span>
    session.chunkHashes().forEach(hash -&gt; chunkRepo.incrementRef(hash));

    <span class="cm">// charge only new bytes to user's quota</span>
    userRepo.addStorageUsed(session.userId(), newBytes);
    uploadSessions.remove(sessionId);
    <span class="kw">return</span> v;
}

<span class="cm">// ── DELETE A VERSION (GC via reference counting) ─────────────</span>
<span class="kw">void</span> deleteVersion(String versionId) {
    FileVersion v = fileVersionRepo.find(versionId);
    fileVersionRepo.delete(versionId);

    <span class="kw">for</span> (String hash : v.chunkIds()) {
        <span class="kw">int</span> refs = chunkRepo.decrementRef(hash);
        <span class="kw">if</span> (refs == <span class="num">0</span>) {
            <span class="cm">// nobody else references this chunk — safe to delete from block store</span>
            blockStore.delete(hash);
            chunkRepo.delete(hash);
        }
        <span class="cm">// if refs &gt; 0, chunk is shared with other versions — leave it alone</span>
    }
}

<span class="cm">// ── DOWNLOAD FILE ────────────────────────────────────────────</span>
InputStream downloadFile(String fileId, String userId) {
    File file = fileRepo.find(fileId);
    checkAccess(userId, file);           <span class="cm">// throws if no READ permission</span>

    FileVersion latest = fileVersionRepo.findLatest(fileId);

    <span class="cm">// fetch all chunks in parallel from block store</span>
    List&lt;CompletableFuture&lt;<span class="kw">byte</span>[]&gt;&gt; futures = latest.chunkIds().stream()
        .map(hash -&gt; CompletableFuture.supplyAsync(
                        () -&gt; blockStore.get(hash)))  <span class="cm">// async S3 reads</span>
        .collect(toList());

    <span class="kw">byte</span>[][] chunks = futures.stream()
        .map(CompletableFuture::join)    <span class="cm">// wait for all, collect in order</span>
        .toArray(<span class="kw">byte</span>[][]::new);

    <span class="cm">// concatenate chunks in order and stream to client</span>
    <span class="kw">return</span> <span class="kw">new</span> SequenceInputStream(Arrays.stream(chunks)
        .map(ByteArrayInputStream::<span class="kw">new</span>)
        .collect(toList()));
}`} />
        <Warn>
          Reference counting has a race condition: two commits referencing the same chunk must
          increment atomically. Use a DB <C>UPDATE chunks SET ref_count = ref_count + 1 WHERE id = ?</C>
          statement, not a read-modify-write in application code.
        </Warn>
        <Reveal summary="What if two users simultaneously commit files that both need a new chunk?">
          Both clients upload the chunk bytes (PUT /chunks/{'{hash}'}). The second upload is a no-op:
          the block store already has it. The server can use a "put-if-absent" semantic. Only one commit
          race condition matters: the moment we set refCount from 0 to 1. Use an atomic DB upsert or
          a transaction that first inserts the Chunk row if absent, then increments refCount.
        </Reveal>
      </section>

      {/* ── SECTION 8 — DEMO 2: DELTA SYNC ── */}
      <section id="s8">
        <div className="sec-label">Section 8 · Interactive</div>
        <h2>Play: Delta sync — edit chunks, sync only what changed</h2>
        <p>
          Alice's file "notes.txt" has 4 chunks synced to all three devices. Click a chunk on any
          device to simulate editing it (it gets a new random hash). Then click <strong>Sync</strong>
          on that device — watch only the changed chunks travel to the server, and the other devices
          download only those chunks too. The bandwidth meter shows the savings vs. naive full re-upload.
        </p>
        <DeltaSyncDemo />
        <Good>
          The key observation: <strong>comparing hashes is free</strong> (just a string comparison).
          The server can identify exactly which chunks changed without touching the actual bytes.
          Only the changed chunk bytes cross the network.
        </Good>
      </section>

      {/* ── SECTION 9 — DEMO 3: VERSION HISTORY ── */}
      <section id="s9">
        <div className="sec-label">Section 9 · Interactive</div>
        <h2>Play: Version history — shared chunks across versions</h2>
        <p>
          Add Version 2 (one chunk changed from V1), then Version 3 (two more chunks changed).
          Watch the block store: it holds only the <em>unique</em> chunks across all versions.
          Then restore to V1 — the system creates V4 pointing to the same chunk hashes as V1.
          Zero new bytes stored.
        </p>
        <VersionHistoryDemo />
        <Good>
          Three versions of a 4-chunk file store only 7 unique chunks (not 12 = 3×4).
          Chunks A, B', and C are shared across versions. Restoration is literally free: the old
          chunks never left the block store because their refCounts stayed above 0.
        </Good>
      </section>

      {/* ── SECTION 10 — SYNC PROTOCOL, SHARING, CONFLICTS, CHEAT SHEET ── */}
      <section id="s10">
        <div className="sec-label">Section 10</div>
        <h2>Sync protocol, sharing &amp; conflicts — cheat sheet</h2>

        <h3 style={{ fontSize: 16, marginTop: 18, marginBottom: 8 }}>Sync protocol (client-side)</h3>
        <Code html={`<span class="cm">// Client keeps a local "sync DB": path → { hash, modifiedAt }</span>
<span class="cm">// On startup and every N seconds:</span>

<span class="num">1</span>. Ask server: GET /files/manifest → list of { fileId, path, hash, modifiedAt }
<span class="num">2</span>. Compare with local sync DB:
   - File on server but not local → DOWNLOAD it
   - File on local but not server → UPLOAD it (new file)
   - File on both, same hash → no action needed
   - File on both, different hash, server newer → DOWNLOAD
   - File on both, different hash, local newer → UPLOAD (new version)
   - File on both, BOTH changed (different timestamps) → CONFLICT

<span class="cm">// CONFLICT HANDLING</span>
<span class="cm">// Both server and client changed the same file since last sync.</span>
<span class="cm">// Strategy: keep both. Rename local copy:</span>
<span class="cm">//   "report.docx"  →  "report (Alice's conflicted copy 2024-01-15).docx"</span>
<span class="cm">// Upload the local version as a new file. User resolves manually.</span>`} />

        <h3 style={{ fontSize: 16, marginTop: 18, marginBottom: 8 }}>Quota management</h3>
        <Code html={`<span class="cm">// storageUsed is updated at COMMIT time, not chunk upload time.</span>
<span class="cm">// Reason: deduped chunks cost 0 bytes to this user — we only know</span>
<span class="cm">// which chunks were new (neededChunks) after the init step.</span>

<span class="cm">// Quota check formula (in commitUpload):</span>
<span class="cm">// newBytes = sum of sizes of neededChunks only</span>
<span class="kw">if</span> (user.storageUsed() + newBytes &gt; user.storageQuota())
    <span class="kw">throw new</span> QuotaExceededException(...)  <span class="cm">// reject before writing FileVersion</span>

<span class="cm">// When user deletes a VERSION: storageUsed decremented by size of GC'd chunks</span>
<span class="cm">// When user deletes the last version of a file: same — only GC'd chunks count</span>
<span class="cm">// Shared chunks (refCount &gt; 1) are NOT charged again to the second user</span>`} />

        <h3 style={{ fontSize: 16, marginTop: 18, marginBottom: 8 }}>Sharing &amp; permissions</h3>
        <Code html={`<span class="cm">// Share table: one row per (file, sharedWithUser) pair</span>
<span class="cm">// Permission levels:</span>
READ    → can download, view file. Cannot create new versions.
WRITE   → can upload new versions.
COMMENT → can annotate, but not change content. (Read implied.)

<span class="cm">// Folder sharing: share the Folder, all children inherit.</span>
<span class="cm">// Implementation options:</span>
<span class="cm">// A) Recursive resolution at access time (walk up the parent chain)</span>
<span class="cm">// B) Denormalized rows: one Share row per child file (expensive for big folders)</span>
<span class="cm">// Option A is standard; cache the permission result per (user, file) for perf.</span>

<span class="cm">// checkAccess implementation:</span>
<span class="kw">void</span> checkAccess(String userId, File file, Permission required) {
    <span class="kw">if</span> (file.ownerId().equals(userId)) <span class="kw">return</span>;  <span class="cm">// owner has all permissions</span>
    Share share = shareRepo.find(file.id(), userId);   <span class="cm">// direct or inherited</span>
    <span class="kw">if</span> (share == <span class="kw">null</span> || !share.permission().includes(required))
        <span class="kw">throw new</span> AccessDeniedException(<span class="str">"No "</span> + required + <span class="str">" access"</span>);
}`} />

        <h3 style={{ fontSize: 16, marginTop: 18, marginBottom: 8 }}>Cheat sheet — the whole system</h3>
        <table className="matrix">
          <thead>
            <tr><th>Concept</th><th>One-liner</th><th>Key detail</th></tr>
          </thead>
          <tbody>
            <tr><td>Chunking</td><td>Split file into fixed-size pieces (4 MB)</td><td>Enables resumable upload, delta sync, dedup</td></tr>
            <tr><td>CAS</td><td>Chunk ID = SHA-256(content)</td><td>Same content → same ID everywhere</td></tr>
            <tr><td>Dedup</td><td>Init sends hashes; server asks only for missing chunks</td><td>Second user to upload identical file pays 0 bytes</td></tr>
            <tr><td>Block store</td><td>S3/GCS — raw bytes, content-addressed</td><td>Never put chunk bytes in the metadata DB</td></tr>
            <tr><td>Metadata DB</td><td>File, FileVersion, Chunk (size+refCount), User, Folder, Share</td><td>No raw bytes; chunkIds is a list of hashes</td></tr>
            <tr><td>Delta sync</td><td>Compare hashes; upload only changed chunks</td><td>One changed chunk → only one chunk transferred</td></tr>
            <tr><td>Versioning</td><td>Each upload → new FileVersion row with chunkIds</td><td>Unchanged chunks shared across versions at no cost</td></tr>
            <tr><td>Reference counting</td><td>refCount tracks how many FileVersions use a chunk</td><td>GC the block-store entry only when refCount = 0</td></tr>
            <tr><td>Quota</td><td>storageUsed += new-chunk bytes at commit time</td><td>Deduped chunks cost 0; check before writing FileVersion</td></tr>
            <tr><td>Sharing</td><td>Share(fileId, userId, READ/WRITE/COMMENT)</td><td>Owner bypass; folder shares inherited by children</td></tr>
            <tr><td>Conflict</td><td>Both sides changed → "conflicted copy" with timestamp</td><td>Last-write-wins is dangerous for file data; keep both</td></tr>
            <tr><td>Download</td><td>FileVersion → chunkIds → parallel block-store fetches → stream</td><td>Parallel chunk fetches; assemble in order</td></tr>
          </tbody>
        </table>

        <Reveal summary="Common traps and interview gotchas">
          <ul>
            <li><strong>Don't store bytes in the metadata DB.</strong> A Chunk row holds only the hash, size, and refCount. Raw bytes are in the block store.</li>
            <li><strong>Don't charge quota at chunk-upload time.</strong> You won't know the dedup savings until commit. Charge only neededChunks sizes at commit.</li>
            <li><strong>Don't decrement refCount before deleting the FileVersion row.</strong> If the DB crashes mid-delete, you could lose a chunk that's still referenced.</li>
            <li><strong>Don't let refCount go negative.</strong> Use <C>UPDATE ... SET ref_count = ref_count - 1 WHERE ref_count &gt; 0</C> and check rows-affected = 1.</li>
            <li><strong>Don't forget to verify chunk integrity on upload</strong> (compare received hash vs. computed SHA-256). Silent bit-flip corruption is a real problem in storage systems.</li>
            <li><strong>Last-write-wins is wrong for shared files.</strong> Two users editing simultaneously should both see their copy preserved as a conflicted copy. Data loss is worse than having two copies.</li>
          </ul>
        </Reveal>
      </section>

      {/* ── INTERVIEW CORNER ── */}
      <section id="interview">
        <div className="sec-label">Interview corner · Rapid fire</div>
        <h2>6 questions that trip people up</h2>

        <Reveal summary="Why store chunk ID as SHA-256(content) instead of SHA-256(position in file)?">
          If you hash by position, a chunk gets a different ID every time even if its bytes are
          unchanged. You lose deduplication entirely — two files with the same data at different
          offsets wouldn't share chunks. Content hashing means identical bytes always get the same
          ID, globally and forever. This is the foundation of dedup, delta sync, and version sharing.
          Position-based hashing is how naive block storage works; CAS is the upgrade.
        </Reveal>

        <Reveal summary="Walk me through exactly how deduplication works at upload time.">
          Three steps. (1) <strong>Init:</strong> the client computes SHA-256 of each chunk and sends
          the ordered list of hashes to the server. The server queries its chunk table for which hashes
          already exist. It responds with <C>chunksNeeded</C> — only the hashes not found.
          (2) <strong>Upload:</strong> the client uploads only the missing chunks (PUT /chunks/{'{hash}'}
          for each). The server stores each in the block store and writes a Chunk row with refCount=0.
          (3) <strong>Commit:</strong> the client sends the session ID. The server creates a FileVersion
          row with the full ordered chunkIds list, increments refCount on every chunk (old and new),
          and charges only the new-chunk bytes to the user's quota.
        </Reveal>

        <Reveal summary="What is content-addressable storage, and how does it differ from a normal key-value store?">
          In a normal key-value store, you choose the key. In CAS, the key is computed from the value
          — specifically, it's a cryptographic hash of the data. You can't choose a key; you discover it
          by hashing. The consequence: if two different callers store identical data, they both get the
          same key back and the store keeps only one copy. This is automatic deduplication. Git's object
          store is content-addressable: every commit, tree, and blob is stored by its SHA-1/SHA-256 hash.
        </Reveal>

        <Reveal summary="How do you handle the case where Alice and Bob both edit the same file at the same time?">
          This is the sync conflict problem. Both clients read version 3. Alice edits and syncs — the
          server now has version 4. Bob then tries to sync his edit. The server sees Bob's base is
          version 3, but the latest is version 4. Two strategies:
          (1) <strong>Last-write-wins</strong> — Bob's version becomes version 5, Alice's changes are
          lost. Simple but dangerous for user data.
          (2) <strong>Conflicted copy</strong> (Dropbox's approach) — Bob's file is saved as
          "document (Bob's conflicted copy 2024-01-15).docx". Both versions exist; the user resolves.
          (3) <strong>Operational transform / CRDT</strong> (Google Docs's approach) — changes are
          represented as operations that can be merged automatically. This requires format awareness
          and is far more complex. For a file storage system (binary files), conflicted copy is the
          right answer.
        </Reveal>

        <Reveal summary="How does reference counting prevent orphan chunks (unused bytes in the block store)?">
          Every FileVersion row that lists a chunk hash "holds a reference" — conceptually a pointer.
          The <C>refCount</C> field in the Chunk table counts how many FileVersion rows list that hash.
          When a FileVersion is deleted, the server decrements refCount for every chunk in its list.
          If refCount reaches 0, no live FileVersion points to that chunk anymore. The server can safely
          delete it from the block store and free the storage. This is the same mechanism as Java's
          garbage collector (reference counting GC), applied to chunk storage. The trap: you must
          decrement refCounts transactionally with the FileVersion deletion, or you risk a chunk being
          deleted while it still has a reference.
        </Reveal>

        <Reveal summary="Why separate the metadata DB from the block store? Can't you just put everything in Postgres?">
          You can store BLOBs in Postgres, and for small scale it works. But at billions of files:
          (1) <strong>Cost</strong>: SSD-backed Postgres storage costs ~$0.10/GB/month. S3 costs ~$0.023/GB/month — 4x cheaper.
          (2) <strong>Scale</strong>: S3 scales to exabytes with no DBA work. Postgres needs sharding, replicas, and careful sizing.
          (3) <strong>Access pattern</strong>: Block bytes are accessed by a single hash key — no joins, no indexes needed. That's what object stores are optimized for.
          (4) <strong>Metadata queries</strong>: "List all files shared with user X, sorted by modified date" requires indexes, joins, and transactions — perfect for a relational DB, terrible for an object store.
          The two-store split matches each store's strength to the access pattern that suits it.
        </Reveal>
      </section>

      {/* ── QUIZ ── */}
      <section id="quiz">
        <div className="sec-label">Section 11 · Test yourself</div>
        <h2>Quiz — 8 questions</h2>
        <p>Click an answer. Explanations and revisit pointers appear for every choice.</p>
        <Quiz questions={QUESTIONS} />
      </section>

      {/* ── HOMEWORK FOOTER ── */}
      <div className="footer">
        <strong>Day 83 complete?</strong> Homework: implement a simple content-addressable store
        in Java. Class <C>ChunkStore</C> with three methods:
        (1) <C>String put(byte[] data)</C> — compute SHA-256 of data, store in a <C>HashMap</C>,
        increment a refCount map, return the hash;
        (2) <C>byte[] get(String hash)</C> — return the bytes or throw;
        (3) <C>void release(String hash)</C> — decrement refCount; if it drops to 0, remove from
        both maps (garbage collect). Write a test that puts the same bytes twice, verifies only one
        copy is stored, calls release twice, and verifies the chunk is gone after the second release.
        <br /><br />
        Next: <strong>Day 84 — Circuit Breaker &amp; Resilience</strong>: how services protect
        themselves from failing dependencies — the circuit breaker pattern, half-open probing,
        bulkheads, timeouts, and retry with exponential back-off.
      </div>

    </div>
  )
}
