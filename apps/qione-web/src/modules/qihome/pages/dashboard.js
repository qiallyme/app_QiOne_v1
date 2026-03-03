import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { dollars } from "../../../lib/money";
export default function Dashboard() {
    const { tenantId } = useParams();
    const [rows, setRows] = useState([]);
    const [err, setErr] = useState(null);
    useEffect(() => {
        if (!tenantId)
            return;
        (async () => {
            setErr(null);
            const { data, error } = await supabase
                .schema('qione')
                .from("v_qihome_member_balances")
                .select("user_id, net_cents, shares_owed, paid_total")
                .eq("tenant_id", tenantId);
            if (error)
                setErr(error.message);
            else
                setRows((data ?? []));
        })();
    }, [tenantId]);
    return (_jsxs("div", { children: [_jsx("h3", { style: { marginBottom: '24px' }, children: "Member Balances" }), err && _jsx("div", { style: { color: 'var(--error)', padding: '12px', background: 'rgba(255,82,82,0.1)', borderRadius: '8px', marginBottom: '20px' }, children: err }), !rows.length ? (_jsx("div", { style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }, children: _jsx("p", { children: "No transactions yet. Start by adding an expense in the Ledger." }) })) : (_jsx("div", { style: { display: 'grid', gap: '12px' }, children: rows.map((r) => (_jsxs("div", { className: "module-tile", style: { flexDirection: 'row', padding: '20px', cursor: 'default' }, children: [_jsx("div", { style: { width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }, children: r.user_id.slice(0, 1).toUpperCase() }), _jsxs("div", { style: { flex: 1, marginLeft: '16px' }, children: [_jsxs("div", { style: { fontWeight: 600 }, children: ["User ", r.user_id.slice(0, 8)] }), _jsxs("div", { style: { fontSize: '13px', color: 'var(--text-secondary)' }, children: ["Owed: ", dollars(r.shares_owed), " | Paid: ", dollars(r.paid_total)] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '20px', fontWeight: 700, color: r.net_cents > 0 ? 'var(--error)' : r.net_cents < 0 ? 'var(--success)' : 'inherit' }, children: dollars(r.net_cents) }), _jsx("div", { style: { fontSize: '12px', color: 'var(--text-secondary)' }, children: r.net_cents > 0 ? 'owes' : r.net_cents < 0 ? 'is owed' : 'settled' })] })] }, r.user_id))) }))] }));
}
