module ledgerx::ledger {
    use std::string;
    use std::vector;

    use sui::event;
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    public struct Ledger has key, store {
        id: UID,
        owner: address,
        entries: Table<u64, Entry>,
        next_id: u64,
    }

    public struct Entry has store, drop {
        amount: i64,
        category: vector<u8>,
        note: vector<u8>,
        timestamp_epoch: u64,
    }

    public struct EntryEvent has copy, drop {
        owner: address,
        id: u64,
        amount: i64,
        category: vector<u8>,
    }

    fun init(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let ledger = Ledger {
            id: object::new(ctx),
            owner: sender,
            entries: table::new(ctx),
            next_id: 0,
        };
        transfer::transfer(ledger, sender);
    }

    public entry fun record(
        ledger: &mut Ledger,
        amount: i64,
        category: vector<u8>,
        note: vector<u8>,
        ctx: &TxContext,
    ) {
        assert_owner(ledger);
        let entry = Entry {
            amount,
            category: category.clone(),
            note,
            timestamp_epoch: tx_context::epoch(ctx),
        };
        let id = ledger.next_id;
        ledger.next_id = id + 1;
        table::add(&mut ledger.entries, id, entry);
        emit_entry_event(ledger.owner, id, amount, category);
    }

    public entry fun remove(ledger: &mut Ledger, entry_id: u64, ctx: &TxContext) {
        assert_owner(ledger);
        if (table::contains(&ledger.entries, &entry_id)) {
            let entry = table::remove(&mut ledger.entries, &entry_id);
            event::emit(EntryEvent {
                owner: ledger.owner,
                id: entry_id,
                amount: -entry.amount,
                category: entry.category,
            });
        };
    }

    public fun get_entry(ledger: &Ledger, id: u64): vector<u8> {
        let entry_ref = table::borrow(&ledger.entries, &id);
        entry_ref.category.clone()
    }

    fun assert_owner(ledger: &Ledger) {
        assert!(ledger.owner == tx_context::sender(), 0);
    }

    fun emit_entry_event(owner: address, id: u64, amount: i64, category: vector<u8>) {
        event::emit(EntryEvent { owner, id, amount, category });
    }
}
