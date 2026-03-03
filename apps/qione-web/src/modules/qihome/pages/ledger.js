import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { cents, dollars } from "../../../lib/money";
export default function Ledger() {
    const { tenantId } = useParams();
    const [items, setItems] = useState([]);
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    async function load() {
        if (!tenantId)
            return;
        const { data, error } = await supabase
            .schema('qione')
            .from("qihome_expenses")
            .select("id,date,amount_cents,memo,paid_by")
            .eq("tenant_id", tenantId)
            .order("date", { ascending: false })
            .limit(25);
        if (error)
            setErr(error.message);
        else
            setItems((data ?? []));
    }
    useEffect(() => {
        setErr(null);
        load();
    }, [tenantId]);
    async function addExpense() {
        if (!tenantId || !amount)
            return;
        setLoading(true);
        setErr(null);
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (!uid)
            return setErr("Not signed in.");
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
        if (error)
            return setErr(error.message);
        setAmount("");
        setMemo("");
        await load();
    }
    return (_jsxs("div", { children: [_jsx("h3", { style: { marginBottom: '24px' }, children: "Expense Ledger" }), _jsxs("div", { className: "glass-card", style: { background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }, children: [_jsx("h4", { style: { marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }, children: "Add New Expense" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', display: 'block', marginBottom: '6px' }, children: "Amount" }), _jsx("input", { value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "0.00" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', display: 'block', marginBottom: '6px' }, children: "Memo / Description" }), _jsx("input", { value: memo, onChange: (e) => setMemo(e.target.value), placeholder: "What was this for?" })] }), _jsx("button", { onClick: addExpense, disabled: loading, children: loading ? '...' : 'Add' })] }), err && _jsx("p", { style: { color: "var(--error)", fontSize: '14px', marginTop: '12px' }, children: err })] }), !items.length ? (_jsx("div", { style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }, children: _jsx("p", { children: "No expenses logged in this tenant." }) })) : (_jsx("div", { style: { display: 'grid', gap: '8px' }, children: items.map((e) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: e.memo ?? "Untitled Expense" }), _jsxs("div", { style: { fontSize: '13px', color: 'var(--text-secondary)' }, children: [e.date, " \u2022 Paid by ", e.paid_by.slice(0, 8)] })] }), _jsx("div", { style: { fontSize: '18px', fontWeight: 700, color: 'var(--accent-secondary)' }, children: dollars(e.amount_cents) })] }, e.id))) })), _jsxs("div", { style: { marginTop: '40px', padding: '16px', borderRadius: '12px', background: 'rgba(124, 77, 255, 0.05)', border: '1px dashed var(--accent-primary)', color: 'var(--text-secondary)', fontSize: '13px' }, children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Tip:" }), " Balances remain zero until ", _jsx("code", { children: "qihome_expense_shares" }), " are linked. Future updates will automate splitting."] })] }));
}
