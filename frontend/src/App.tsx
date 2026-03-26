import { useState } from 'react'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import MyLedger from './components/MyLedger'
import RecordEntry from './components/RecordEntry'
import './App.css'

type Tab = 'view' | 'record'

export default function App() {
  const account = useCurrentAccount()
  const [tab, setTab] = useState<Tab>('view')

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="logo">📊</span>
          <div>
            <div className="brand-name">LedgerX</div>
            <div className="brand-sub">Immutable Financial Records</div>
          </div>
        </div>
        <ConnectButton />
      </header>

      {!account ? (
        <>
          <section className="hero">
            <div className="hero-badge">Transparent Finance</div>
            <h1>Your Finances,<br />Permanently Recorded</h1>
            <p className="hero-sub">
              Record every transaction on-chain. No manipulation. No data loss.
              Complete transparency and accountability for your financial history.
            </p>
            <div className="hero-features">
              <div className="feature"><span>🔐</span><span>Immutable</span></div>
              <div className="feature"><span>📝</span><span>Transparent</span></div>
              <div className="feature"><span>✅</span><span>Verifiable</span></div>
              <div className="feature"><span>🌐</span><span>Portable</span></div>
            </div>
          </section>

          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-value">∞</div>
              <div className="stat-label">Entries Possible</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Data Loss Risk</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100%</div>
              <div className="stat-label">Auditable</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">&lt;1s</div>
              <div className="stat-label">Finality</div>
            </div>
          </div>

          <section className="how-section">
            <div className="section-title">How LedgerX Works</div>
            <p className="section-sub">Three simple steps to financial transparency</p>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-num">01</div>
                <div className="step-icon">💰</div>
                <h3>Record Entry</h3>
                <p>Log any transaction — income, expense, or transfer. Add category and notes.</p>
              </div>
              <div className="step-card">
                <div className="step-num">02</div>
                <div className="step-icon">⛓️</div>
                <h3>On-Chain Storage</h3>
                <p>Your entry is minted as an immutable record in your personal ledger.</p>
              </div>
              <div className="step-card">
                <div className="step-num">03</div>
                <div className="step-icon">📈</div>
                <h3>Full History</h3>
                <p>Build a complete, verifiable financial history that's yours forever.</p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="dashboard">
          <div className="dashboard-inner">
            <nav className="tabs">
              {(['view', 'record'] as Tab[]).map((t) => (
                <button
                  key={t}
                  className={tab === t ? 'active' : ''}
                  onClick={() => setTab(t)}
                >
                  {t === 'view' && '📊 My Ledger'}
                  {t === 'record' && '✏️ Record Entry'}
                </button>
              ))}
            </nav>
            <main>
              {tab === 'view' && <MyLedger />}
              {tab === 'record' && <RecordEntry onSuccess={() => setTab('view')} />}
            </main>
          </div>
        </div>
      )}

      <footer className="footer">
        <span>LedgerX · OneChain Testnet</span>
        <a href="https://onescan.cc/testnet" target="_blank" rel="noreferrer">Explorer ↗</a>
      </footer>
    </div>
  )
}
