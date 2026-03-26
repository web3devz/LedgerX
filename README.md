# LedgerX 📒

**Decentralized Financial Logging on OneChain — Transparent, Immutable, and User-Owned**

LedgerX is a blockchain-based financial tracking system that allows users to record transactions directly on-chain. It eliminates reliance on centralized apps and ensures that financial records are tamper-proof, transparent, and fully owned by the user.

## 🌐 Overview

Most financial tracking tools today are centralized, meaning your data is stored, controlled, and potentially manipulated by third-party services. This creates risks around privacy, trust, and long-term data ownership.

LedgerX introduces a **decentralized ledger system** where every transaction is recorded on-chain, ensuring:

* **Immutability** → records cannot be altered or deleted arbitrarily
* **Transparency** → verifiable transaction history
* **Ownership** → your financial data belongs only to you
* **Trustlessness** → no need for intermediaries

This makes LedgerX ideal for both personal finance and shared accountability use cases.

## ❗ The Problem

* Financial data stored in centralized apps
* Risk of data manipulation or loss
* Lack of transparency in shared expenses
* No verifiable audit trail
* Limited insights into spending behavior

## 💡 The Solution

LedgerX creates a **personal on-chain ledger** for each user. Every transaction (credit or debit) is stored as part of this ledger, along with metadata like category and notes.

With built-in analytics and optional AI insights, users gain both **trustless record-keeping** and **intelligent financial understanding**.

## ✨ Key Features

* **On-Chain Ledger Creation**
  Each user owns a personal ledger stored as a Move object

* **Transaction Recording**
  Log credit and debit entries with categories and notes

* **Immutable Financial History**
  All entries are permanently recorded on-chain

* **Dynamic Data Fetching**
  Efficient retrieval of transaction history via dynamic fields

* **Real-Time Balance Tracking**
  Automatically calculates credits, debits, and net balance

* **AI Financial Insights**
  Generate smart summaries, spending patterns, and actionable advice using GPT-based analysis

* **User-Owned & Secure**
  No centralized database — full control remains with the user

## ⚙️ How It Works

1. User creates a personal ledger on-chain
2. Each transaction is recorded via a smart contract call
3. Entries are stored as part of the ledger object
4. Frontend fetches and displays transaction history
5. Balance is calculated dynamically
6. AI analyzes data to generate financial insights

## 📦 Deployed Contract

* **Network:** OneChain Testnet

* **Package ID:**
  `0xede946c09ff47552253fe8049ad2aa99e54894b2fde68c484c7bd33560fda01d`

* **Deploy Transaction:**
  `3uWhCUTnDcert6tjh4kPd8p36GRzWYKhYEyKvP2DfUzZ`

* **Explorer Links:**
  [https://onescan.cc/testnet/packageDetail?packageId=0xede946c09ff47552253fe8049ad2aa99e54894b2fde68c484c7bd33560fda01d](https://onescan.cc/testnet/packageDetail?packageId=0xede946c09ff47552253fe8049ad2aa99e54894b2fde68c484c7bd33560fda01d)
  [https://onescan.cc/testnet/transactionBlocksDetail?digest=3uWhCUTnDcert6tjh4kPd8p36GRzWYKhYEyKvP2DfUzZ](https://onescan.cc/testnet/transactionBlocksDetail?digest=3uWhCUTnDcert6tjh4kPd8p36GRzWYKhYEyKvP2DfUzZ)

## 🛠 Tech Stack

**Smart Contract**

* Move (OneChain)

**Frontend**

* React
* TypeScript
* Vite

**Wallet Integration**

* @mysten/dapp-kit

**Data Layer**

* Dynamic fields (on-chain data access)

**AI Integration**

* GPT-4o-mini (financial insights & summaries)

**Network**

* OneChain Testnet

## 🔍 Use Cases

* **Personal Finance Tracking**
  Maintain a transparent and immutable expense log

* **Shared Expense Management**
  Track group spending with verifiable records

* **Freelancer / Business Accounting**
  Maintain tamper-proof income and expense logs

* **Audit & Compliance Systems**
  Provide verifiable financial trails

* **Financial Behavior Analysis**
  Gain insights into spending patterns and habits

## 🚀 Why LedgerX Stands Out

* **Immutable Financial Records** — no tampering possible
* **User-Owned Data** — no centralized control
* **Transparent & Verifiable** — perfect for accountability
* **AI-Powered Insights** — goes beyond simple tracking
* **Composable Web3 Primitive** — can integrate with DeFi, identity, etc.
* **Hackathon-Ready Utility** — real-world practical application

## 🔮 Future Improvements

* Multi-user shared ledgers
* Budgeting and goal tracking features
* Visual analytics dashboards
* Export to traditional formats (CSV, PDF)
* Integration with DeFi protocols
* Privacy layers (zero-knowledge summaries)

## ⚙️ Contract API

```move
// Create your personal ledger (owned object minted to caller)
public fun create_ledger(ctx: &mut TxContext)

// Record a transaction entry
public fun record(ledger: &mut Ledger, amount: u64, is_credit: bool, category: vector<u8>, note: vector<u8>, ctx: &mut TxContext)

// Remove an entry
public fun remove_entry(ledger: &mut Ledger, entry_id: u64, ctx: &mut TxContext)
```

## 💻 Local Development

```bash
~/.cargo/bin/one move build --path contracts
~/.cargo/bin/one client publish --gas-budget 50000000 contracts
cd frontend && npm install && npm run dev
```

Set in `frontend/.env`:

```env
VITE_PACKAGE_ID=<package_id>
VITE_OPENAI_KEY=<openai_api_key>
```

## 📄 License

MIT License
