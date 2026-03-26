import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { PACKAGE_ID, txUrl } from '../config/network'
import { useState } from 'react'

interface LedgerFields {
  owner: string
  total_entries: string
  next_id: string
}

export default function MyLedger() {
  const account = useCurrentAccount()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [txDigest, setTxDigest] = useState('')
  const [error, setError] = useState('')

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
