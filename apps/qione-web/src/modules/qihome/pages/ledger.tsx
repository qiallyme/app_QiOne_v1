import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { cents, dollars } from "../../../lib/money";

type Expense = {
    id: string;
    date: string;
    amount_cents: number;
    memo: string | null;
    paid_by: string;
};

export default function Ledger() {
    const { tenantId } = useParams();
    const [items, setItems] = useState<Expense[]>([]);
    const [amount, setAmount] = useState<string>("0");
    const [memo, setMemo] = useState<string>("");
    const [err, setErr] = useState<string | null>(null);

    async function load() {
        if (!tenantId) return;
        const { data, error } = await supabase
            .schema('qione')
            .from("qihome_expenses")
            .select("id,date,amount_cents,memo,paid_by")
            .eq("tenant_id", tenantId)
            .order("date", { ascending: false })
            .limit(25);

        if (error) setErr(error.message);
        else setItems((data ?? []) as Expense[]);
    }

    useEffect(() => {
        setErr(null);
        load();
    }, [tenantId]);

    async function addExpense() {
        if (!tenantId) return;
        setErr(null);

        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (!uid) return setErr("Not signed in.");

        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) return setErr("Amount must be > 0");

        const { error } = await supabase
            .schema('qione')
            .from("qihome_expenses")
            .insert({
                tenant_id: tenantId,
                date: new Date().toISOString().slice(0, 10),
                amount_cents: cents(amt),
                paid_by: uid,
                memo: memo || null,
                created_by: uid,
            });

        if (error) return setErr(error.message);

        setAmount("0");
        setMemo("");
        await load();
    }

    return (
        <div>
            <h3>Ledger</h3>
            {err && <p style={{ color: "crimson" }}>{err}</p>}

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount (e.g. 42.50)"
                />
                <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Memo" />
                <button onClick={addExpense}>Add</button>
            </div>

            {!items.length ? (
                <p>No expenses yet.</p>
            ) : (
                <ul>
                    {items.map((e) => (
                        <li key={e.id}>
                            {e.date} — {dollars(e.amount_cents)} — {e.memo ?? "(no memo)"}
                        </li>
                    ))}
                </ul>
            )}

            <p style={{ opacity: 0.8 }}>
                Next step: when adding an expense, also create <code>qihome_expense_shares</code> rows
                (equal split / custom split). Right now balances will stay empty until shares exist.
            </p>
        </div>
    );
}
