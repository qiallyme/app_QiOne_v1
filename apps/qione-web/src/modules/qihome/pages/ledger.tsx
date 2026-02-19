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
    const [amount, setAmount] = useState<string>("");
    const [memo, setMemo] = useState<string>("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        if (!tenantId || !amount) return;
        setLoading(true);
        setErr(null);

        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (!uid) return setErr("Not signed in.");

        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) {
            setLoading(false);
            return setErr("Amount must be > 0");
        }

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

        setLoading(false);
        if (error) return setErr(error.message);

        setAmount("");
        setMemo("");
        await load();
    }

    return (
        <div>
            <h3 style={{ marginBottom: '24px' }}>Expense Ledger</h3>

            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Add New Expense</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '16px', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Amount</label>
                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Memo / Description</label>
                        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What was this for?" />
                    </div>
                    <button onClick={addExpense} disabled={loading}>{loading ? '...' : 'Add'}</button>
                </div>
                {err && <p style={{ color: "var(--error)", fontSize: '14px', marginTop: '12px' }}>{err}</p>}
            </div>

            {!items.length ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <p>No expenses logged in this tenant.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                    {items.map((e) => (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{e.memo ?? "Untitled Expense"}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{e.date} • Paid by {e.paid_by.slice(0, 8)}</div>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                                {dollars(e.amount_cents)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '40px', padding: '16px', borderRadius: '12px', background: 'rgba(124, 77, 255, 0.05)', border: '1px dashed var(--accent-primary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                💡 <strong>Tip:</strong> Balances remain zero until <code>qihome_expense_shares</code> are linked. Future updates will automate splitting.
            </div>
        </div>
    );
}
