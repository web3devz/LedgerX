import { useState } from 'react'
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { PACKAGE_ID, txUrl } from '../config/network'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY as string

interface LedgerFields {
  owner: string
  total_entries: string
  next_id: string
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
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [aiError, setAiError] = useState('')

  const { data, isPending: isLoading, refetch } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address ?? '',
    filter: { StructType: `${PACKAGE_ID}::ledger::Ledger` },
    options: { showContent: true },
  })

  const createLedger = () => {
    setError('')
    const tx = new Transaction()
    tx.moveCall({ target: `${PACKAGE_ID}::ledger::create_ledger`, arguments: [] })
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (r) => { setTxDigest(r.digest); refetch() },
        onError: (e) => setError(e.message),
      }
    )
  }

  const summarizeWithAI = async (totalEntries: string) => {
    setAiLoading(true)
    setAiError('')
    setAiSummary(null)
    try {
      // Fetch EntryAdded events for this wallet
      const res = await client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::ledger::EntryAdded` },
        limit: 50,
      })

      const events = res.data
        .map((e) => e.parsedJson as { owner: string; amount: number; is_credit: boolean; category: string; epoch: number })
        .filter((e) => e.owner === account?.address)

      if (events.length === 0) {
        setAiError('No transaction events found to summarize.')
        return
      }

      const totalCredit = events.filter(e => e.is_credit).reduce((s, e) => s + Number(e.amount), 0)
      const totalDebit = events.filter(e => !e.is_credit).reduce((s, e) => s + Number(e.amount), 0)
      const categories = events.reduce((acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1
        return acc
      }, {})
      const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'

      const prompt = `You are a personal finance AI. Analyze this on-chain ledger summary and give insights.

Total entries: ${totalEntries}
Total credits (income): ${totalCredit}
Total debits (expenses): ${totalDebit}
Net balance: ${totalCredit - totalDebit}
Top category: ${topCat}
Category breakdown: ${JSON.stringify(categories)}

Respond ONLY with valid JSON:
{
  "overview": "<1 sentence overall financial health summary>",
  "topCategory": "<most active category and what it means>",
  "insight": "<1 interesting pattern or observation>",
  "advice": "<1 actionable financial tip based on the data>"
}`

      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 250,
        }),
      })

      if (!aiRes.ok) throw new Error(`OpenAI error ${aiRes.status}`)
      const aiData = await aiRes.json()
      const raw = aiData.choices?.[0]?.message?.content?.trim() ?? ''
      setAiSummary(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'AI summary failed')
    } finally {
      setAiLoading(false)
    }
  }

  if (isLoading) return <div className="status-box">Loading your ledger...</div>

  const ledgers = data?.data ?? []

  if (ledgers.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>My Ledger</h2>
          <p className="card-desc">You don't have a ledger yet. Create one to start recording.</p>
        </div>
        <div className="empty-state" style={{ padding: '2rem 0' }}>
          <div className="empty-icon">📒</div>
          <h3>No ledger found</h3>
          <p style={{ marginBottom: '1.5rem' }}>Create your personal on-chain ledger to begin tracking transactions.</p>
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
      {ledgers.map((obj) => {
        const content = obj.data?.content
        if (content?.dataType !== 'moveObject') return null
        const f = content.fields as unknown as LedgerFields
        const objId = obj.data?.objectId ?? ''

        return (
          <div key={objId}>
            {/* Ledger Stats Card */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2>Your Financial Ledger</h2>
                  <p className="card-desc">{f.total_entries} entries recorded on-chain</p>
                </div>
                <button
                  className="btn-ai-summary"
                  onClick={() => summarizeWithAI(f.total_entries)}
                  disabled={aiLoading || f.total_entries === '0'}
                  title={f.total_entries === '0' ? 'Record some entries first' : 'Summarize with AI'}
                >
                  {aiLoading ? (
                    <><span className="ai-spin">⟳</span> Analyzing...</>
                  ) : (
                    <>🤖 AI Summary</>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total Entries</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)', marginTop: '.3rem' }}>{f.total_entries}</div>
                </div>
                <div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Next Entry ID</div>
                  <div style={{ fontSize: '1rem', fontFamily: "'SF Mono','Fira Code',monospace", marginTop: '.3rem' }}>{f.next_id}</div>
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
          </div>
        )
      })}
    </div>
  )
}
