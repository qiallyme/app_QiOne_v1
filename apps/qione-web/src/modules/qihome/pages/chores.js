import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
export default function Chores() {
    const { tenantId } = useParams();
    const [items, setItems] = useState([]);
    const [title, setTitle] = useState("");
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    async function load() {
        if (!tenantId)
            return;
        const { data, error } = await supabase
            .schema('qione')
            .from("qihome_chores")
            .select("id,title,frequency")
            .eq("tenant_id", tenantId)
            .eq("is_active", true)
            .order("title");
        if (error)
            setErr(error.message);
        else
            setItems((data ?? []));
    }
    useEffect(() => {
        setErr(null);
        load();
    }, [tenantId]);
    async function addChore() {
        if (!tenantId || !title.trim())
            return;
        setLoading(true);
        setErr(null);
        const { error } = await supabase
            .schema('qione')
            .from("qihome_chores")
            .insert({
            tenant_id: tenantId,
            title: title.trim(),
            frequency: "weekly",
            points: 1,
            is_active: true,
        });
        setLoading(false);
        if (error)
            return setErr(error.message);
        setTitle("");
        await load();
    }
    return (_jsxs("div", { children: [_jsx("h3", { style: { marginBottom: '24px' }, children: "Household Chores" }), _jsxs("div", { className: "glass-card", style: { background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }, children: [_jsx("h4", { style: { marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }, children: "Create New Chore" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', display: 'block', marginBottom: '6px' }, children: "What needs to be done?" }), _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Vacuum living room" })] }), _jsx("button", { onClick: addChore, disabled: loading, children: loading ? '...' : 'Add Chore' })] }), err && _jsx("p", { style: { color: "var(--error)", fontSize: '14px', marginTop: '12px' }, children: err })] }), !items.length ? (_jsx("div", { style: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }, children: _jsx("p", { children: "No active chores found. Time to relax, or add one above!" }) })) : (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }, children: items.map((c) => (_jsxs("div", { className: "module-tile", style: { padding: '20px', cursor: 'default' }, children: [_jsx("div", { style: { fontSize: '24px', marginBottom: '12px' }, children: "\uD83E\uDDF9" }), _jsx("h4", { style: { marginBottom: '4px' }, children: c.title }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }, children: [_jsx("span", { className: "status-badge", style: { fontSize: '10px' }, children: c.frequency }), _jsxs("span", { style: { fontSize: '11px', color: 'var(--text-secondary)' }, children: ["ID: ", c.id.slice(0, 4)] })] })] }, c.id))) }))] }));
}
