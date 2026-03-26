import { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { PACKAGE_ID, txUrl } from '../config/network'

const enc = (s: string) => Array.from(new TextEncoder().encode(s))

interface Props {
  onSuccess?: () => void
}

export default function RecordEntry({ onSuccess }: Props) {
  const account = useCurrentAccount()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [amount, setAmount] = useState('')
  const [isCredit, setIsCredit] = useState(true)
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [txDigest, setTxDigest] = useState('')
  const [error, setError] = useState('')

  const { data } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address ?? '',
    filter: { StructType: `${PACKAGE_ID}::ledger::Ledger` },
    options: { showContent: true },
  })

  const ledger = data?.data?.[0]
  const ledgerId = ledger?.data?.objectId

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!account || !ledgerId || !amount || !category) return
    setError('')
    setTxDigest('')

    const tx = new Transaction()
    tx.moveCall({
      target: `${PACKAGE_ID}::ledger::record`,
      arguments: [
        tx.object(ledgerId),
        tx.pure.u64(BigInt(amount)),
        tx.pure.bool(isCredit),
        tx.pure.vector('u8', enc(category)),
        tx.pure.vector('u8', enc(note)),
      ],
    })

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (r) => {
          setTxDigest(r.digest)
          setAmount('')
          setCategory('')
          setNote('')
          onSuccess?.()
        },
        onError: (e) => setError(e.message),
      }
    )
  }

  if (!ledgerId) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h3>No ledger found</h3>
        <p>You need to create a ledger first.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Record Transaction</h2>
        <p className="card-desc">Add a new entry to your immutable financial ledger.</p>
      </div>

      <form onSubmit={submit} className="form">
        <div className="form-row">
          <label>
            Amount *
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="1"
              required
            />
          </label>
          <label>
            Category *
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Salary, Groceries"
              required
            />
          </label>
        </div>

        <label>
          <input
            type="checkbox"
            checked={isCredit}
            onChange={(e) => setIsCredit(e.target.checked)}
          />
          {' '}Credit (uncheck for debit)
        </label>

        <label>
          Note
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional details..."
            rows={2}
          />
        </label>

        {error && <p className="error">⚠ {error}</p>}

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Recording...' : 'Record Entry'}
        </button>
      </form>

      {txDigest && (
        <div className="tx-success">
          <span>✅ Entry recorded on-chain</span>
          <a href={txUrl(txDigest)} target="_blank" rel="noreferrer">View tx ↗</a>
        </div>
      )}
    </div>
  )
}
