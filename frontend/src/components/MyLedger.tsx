import { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { PACKAGE_ID, txUrl } from '../config/network'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY as string

interface LedgerFields {
  owner: string
  total_entries: string
  next_id: string
  entries: { fields: { id: { id: string } } }
}

interface Entry {
  id: number
  amount: number
  is_credit: boolean
  category: string
  note: string
  epoch: number
}

interface AISummary {
  overview: string
  topCategory: string
  insight: string
  advice: string
}

export default function MyLedger() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [txDigest, setTxDigest] = useState('')
  const [error, setError] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [aiError, setAiError] = useState('')

  const { data, isPending: isLoading, refetch } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address ?? '',
    filter: { StructType: `${PACKAGE_ID}::ledger::Ledger` },
    options: { showContent: true },
  })

  const ledgers = data?.data ?? []
  const ledgerObj = ledgers[0]
  const content = ledgerObj?.data?.content
  const fields = content?.dataType === 'moveObject' ? content.fields as unknown as LedgerFields : null
  const tableId = fields?.entries?.fields?.id?.id
  const totalEntries = fields?.total_entries ?? '0'

  // Fetch entries from the Table via dynamic fields
  useEffect(() => {
    if (!tableId || totalEntries === '0') { setEntries([]); return }
    setEntriesLoading(true)
    ;(async () => {
      try {
        const dynFields = await client.getDynamicFields({ parentId: tableId })
        const fetched: Entry[] = []
        for (const f of dynFields.data) {
          const obj = await client.getDynamicFieldObject({ parentId: tableId, name: f.name })
          const val = (obj.data?.content as { dataType: string; fields: { name: number; value: { fields: Entry } } } | undefined)
          if (val?.dataType === 'moveObject') {
            const v = val.fields.value.fields
            fetched.push({
              id: Number(val.fields.name),
              amount: Number(v.amount),
              is_credit: v.is_credit,
              category: v.category,
              note: v.note,
              epoch: Number(v.epoch),
            })
          }
        }
        fetched.sort((a, b) => b.id - a.id)
        setEntries(fetched)
      } catch { setEntries([]) }
      finally { setEntriesLoading(false) }
    })()
  }, [tableId, totalEntries])

  const createLedger = () => {
    setError('')
    const tx = new Transaction()
    tx.moveCall({ target: `${PACKAGE_ID}::ledger::create_ledger`, arguments: [] })
    signAndExecute(
      { transaction: tx },
      { onSuccess: (r) => { setTxDigest(r.digest); refetch() }, onError: (e) => setError(e.message) }
    )
  }

  const summarizeWithAI = async () => {
    if (entries.length === 0) return
    setAiLoading(true); setAiError(''); setAiSummary(null)
    try {
      const totalCredit = entries.filter(e => e.is_credit).reduce((s, e) => s + e.amount, 0)
      const totalDebit = entries.filter(e => !e.is_credit).reduce((s, e) => s + e.amount, 0)
      const categories = entries.reduce((acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1; return acc
      }, {})
      const entrySummary = entries.slice(0, 10).map(e =>
        `${e.is_credit ? 'Credit' : 'Debit'} ${e.amount} | ${e.category}${e.note ? ` | "${e.note}"` : ''}`
      ).join('\n')

      const prompt = `You are a personal finance AI. Analyze this on-chain ledger and give insights.

Total entries: ${entries.length}
Total credits (income): ${totalCredit}
Total debits (expenses): ${totalDebit}
Net balance: ${totalCredit - totalDebit}
Category breakdown: ${JSON.stringify(categories)}
Recent entries:
${entrySummary}

Respond ONLY with valid JSON:
{
  "overview": "<1 sentence overall financial health>",
  "topCategory": "<most active category and what it means>",
  "insight": "<1 interesting pattern from the data>",
  "advice": "<1 actionable financial tip>"
}`

      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.4, max_tokens: 250 }),
      })
      if (!aiRes.ok) throw new Error(`OpenAI error ${aiRes.status}`)
      const aiData = await aiRes.json()
      const raw = aiData.choices?.[0]?.message?.content?.trim() ?? ''
      setAiSummary(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'AI summary failed')
    } finally { setAiLoading(false) }
  }

  if (isLoading) return <div className="status-box">Loading your ledger...</div>

  if (ledgers.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>My Ledger</h2>
          <p className="card-desc">Create your personal on-chain ledger to begin tracking.</p>
        </div>
        <div className="empty-state" style={{ padding: '2rem 0' }}>
          <div className="empty-icon">📒</div>
          <h3>No ledger found</h3>
          <p style={{ marginBottom: '1.5rem' }}>One ledger per wallet — yours forever on-chain.</p>
          <button className="btn-primary" onClick={createLedger} disabled={isPending}>
            {isPending ? 'Creating...' : '+ Create Ledger'}
          </button>
        </div>
        {error && <p className="error" style={{ marginTop: '1rem' }}>⚠ {error}</p>}
        {txDigest && (
          <div className="tx-success" style={{ marginTop: '1rem' }}>
            <span>✅ Ledger created</span>
            <a href={txUrl(txDigest)} target="_blank" rel="noreferrer">View tx ↗</a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Stats Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Your Financial Ledger</h2>
            <p className="card-desc">{totalEntries} entries recorded on-chain</p>
          </div>
          <button
            className="btn-ai-summary"
            onClick={summarizeWithAI}
            disabled={aiLoading || entries.length === 0}
            title={entries.length === 0 ? 'Record some entries first' : 'Summarize with AI'}
          >
            {aiLoading ? <><span className="ai-spin">⟳</span> Analyzing...</> : <>🤖 AI Summary</>}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="meta-label">Total Entries</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent)', marginTop: '.3rem' }}>{totalEntries}</div>
          </div>
          <div>
            <div className="meta-label">Credits</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#4ade80', marginTop: '.3rem' }}>
              {entries.filter(e => e.is_credit).reduce((s, e) => s + e.amount, 0)}
            </div>
          </div>
          <div>
            <div className="meta-label">Debits</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f87171', marginTop: '.3rem' }}>
              {entries.filter(e => !e.is_credit).reduce((s, e) => s + e.amount, 0)}
            </div>
          </div>
          <div>
            <div className="meta-label">Net Balance</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '.3rem', color: (() => { const n = entries.filter(e => e.is_credit).reduce((s, e) => s + e.amount, 0) - entries.filter(e => !e.is_credit).reduce((s, e) => s + e.amount, 0); return n >= 0 ? '#4ade80' : '#f87171' })() }}>
              {entries.filter(e => e.is_credit).reduce((s, e) => s + e.amount, 0) - entries.filter(e => !e.is_credit).reduce((s, e) => s + e.amount, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* AI Error */}
      {aiError && <p className="error" style={{ marginBottom: '1rem' }}>⚠ {aiError}</p>}

      {/* AI Summary Card */}
      {aiSummary && (
        <div className="card ai-summary-card">
          <div className="ai-summary-header">
            <span className="ai-badge-label">🤖 AI Financial Summary</span>
            <button onClick={() => setAiSummary(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
          <p className="ai-overview">{aiSummary.overview}</p>
          <div className="ai-insights-grid">
            <div className="ai-insight-item">
              <div className="ai-insight-label">📂 Top Category</div>
              <div className="ai-insight-value">{aiSummary.topCategory}</div>
            </div>
            <div className="ai-insight-item">
              <div className="ai-insight-label">🔍 Insight</div>
              <div className="ai-insight-value">{aiSummary.insight}</div>
            </div>
            <div className="ai-insight-item" style={{ gridColumn: '1 / -1' }}>
              <div className="ai-insight-label">💡 Advice</div>
              <div className="ai-insight-value">{aiSummary.advice}</div>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="card">
        <div className="card-header">
          <h2>Transaction History</h2>
          <p className="card-desc">{entriesLoading ? 'Loading entries...' : `${entries.length} entries`}</p>
        </div>

        {entriesLoading && <div className="status-box">Fetching entries from chain...</div>}

        {!entriesLoading && entries.length === 0 && (
          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <p>No entries yet. Record your first transaction.</p>
          </div>
        )}

        {!entriesLoading && entries.length > 0 && (
          <div className="entry-list">
            {entries.map((e) => (
              <div key={e.id} className="entry-row">
                <div className={`entry-type ${e.is_credit ? 'credit' : 'debit'}`}>
                  {e.is_credit ? '↑' : '↓'}
                </div>
                <div className="entry-details">
                  <div className="entry-category">{e.category}</div>
                  {e.note && <div className="entry-note">{e.note}</div>}
                </div>
                <div className={`entry-amount ${e.is_credit ? 'credit' : 'debit'}`}>
                  {e.is_credit ? '+' : '-'}{e.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
