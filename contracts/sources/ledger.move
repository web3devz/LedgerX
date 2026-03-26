module ledgerx::ledger {
    use std::string::{Self, String};
    use one::event;
    use one::table::{Self, Table};

    /// Each user owns their own Ledger object
    public struct Ledger has key, store {
        id: object::UID,
        owner: address,
        entries: Table<u64, Entry>,
        next_id: u64,
        total_entries: u64,
    }

    public struct Entry has store, drop {
        amount: u64,
        is_credit: bool,
        category: String,
        note: String,
        epoch: u64,
    }

    public struct EntryAdded has copy, drop {
        owner: address,
        entry_id: u64,
        amount: u64,
        is_credit: bool,
        category: String,
        epoch: u64,
    }

    public struct EntryRemoved has copy, drop {
        owner: address,
        entry_id: u64,
    }

    const E_NOT_OWNER: u64 = 0;
    const E_NOT_FOUND: u64 = 1;

    /// Each user creates their own ledger
    public fun create_ledger(ctx: &mut TxContext) {
        let ledger = Ledger {
            id: object::new(ctx),
            owner: ctx.sender(),
            entries: table::new(ctx),
            next_id: 0,
            total_entries: 0,
        };
        transfer::transfer(ledger, ctx.sender());
    }

    /// Record a transaction entry
    public fun record(
        ledger: &mut Ledger,
        amount: u64,
        is_credit: bool,
        raw_category: vector<u8>,
        raw_note: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(ledger.owner == ctx.sender(), E_NOT_OWNER);
        let category = string::utf8(raw_category);
        let note = string::utf8(raw_note);
        let id = ledger.next_id;
        let epoch = ctx.epoch();

        table::add(&mut ledger.entries, id, Entry {
            amount, is_credit, category, note, epoch,
        });
        ledger.next_id = id + 1;
        ledger.total_entries = ledger.total_entries + 1;

        event::emit(EntryAdded {
            owner: ledger.owner,
            entry_id: id,
            amount,
            is_credit,
            category: string::utf8(raw_category),
            epoch,
        });
    }

    /// Remove an entry
    public fun remove_entry(
        ledger: &mut Ledger,
        entry_id: u64,
        ctx: &mut TxContext,
    ) {
        assert!(ledger.owner == ctx.sender(), E_NOT_OWNER);
        assert!(table::contains(&ledger.entries, entry_id), E_NOT_FOUND);
        table::remove(&mut ledger.entries, entry_id);
        ledger.total_entries = ledger.total_entries - 1;
        event::emit(EntryRemoved { owner: ledger.owner, entry_id });
    }

    public fun owner(l: &Ledger): address { l.owner }
    public fun total_entries(l: &Ledger): u64 { l.total_entries }
    public fun next_id(l: &Ledger): u64 { l.next_id }
}
