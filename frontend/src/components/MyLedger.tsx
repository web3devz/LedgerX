import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'
import { PACKAGE_ID } from '../config/network'

interface LedgerFields {
  owner: string
  total_entries: string
  next_id: string
}

export default function MyLedger() {
  const account = useCurrentAccount()
  const { data, isPending, error } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address ?? '',
    filter: { StructType: `${PACKAGE_ID}::ledger::Ledger` },
    options: { showContent: true },
  })

  if (isPending) return <div className="status-box">Loading your ledger...</div>
  if (error) return <div className="status-box error">Error: {error.message}</div>

  const ledgers = data?.data ?? []

  if (ledgers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>No ledger found</h3>
        <p>Create your first ledger to start recording transactions.</p>
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
          <div key={objId} className="card">
            <div className="card-header">
              <h2>Your Financial Ledger</h2>
              <p className="card-desc">{f.total_entries} entries recorded on-chain</p>
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
        )
      })}
    </div>
  )
}
