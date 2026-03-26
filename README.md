# LedgerX

A decentralized financial logging system built on **OneChain**. Users record transactions immutably on-chain — no centralized storage, no data manipulation. Suitable for personal finance tracking, shared expense management, and accountability-focused applications.

---

## Deployed Contracts (Testnet)

| Name | Address |
|------|---------|
| Package ID | `0xede946c09ff47552253fe8049ad2aa99e54894b2fde68c484c7bd33560fda01d` |
| Deploy Transaction | `3uWhCUTnDcert6tjh4kPd8p36GRzWYKhYEyKvP2DfUzZ` |

- [View Package](https://onescan.cc/testnet/packageDetail?packageId=0xede946c09ff47552253fe8049ad2aa99e54894b2fde68c484c7bd33560fda01d)
- [View Deploy Tx](https://onescan.cc/testnet/transactionBlocksDetail?digest=3uWhCUTnDcert6tjh4kPd8p36GRzWYKhYEyKvP2DfUzZ)

---

## Contract API

```move
// Create your personal ledger (owned object minted to caller)
public fun create_ledger(ctx: &mut TxContext)

// Record a transaction entry
public fun record(ledger: &mut Ledger, amount: u64, is_credit: bool, category: vector<u8>, note: vector<u8>, ctx: &mut TxContext)

// Remove an entry
public fun remove_entry(ledger: &mut Ledger, entry_id: u64, ctx: &mut TxContext)
```

---

## Local Development

```bash
~/.cargo/bin/one move build --path contracts
~/.cargo/bin/one client publish --gas-budget 50000000 contracts
cd frontend && npm install && npm run dev
```

Set in `frontend/.env`:
```env
VITE_PACKAGE_ID=<package_id>
```

## License
MIT
