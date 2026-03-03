import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
export default function TenantSelect() {
    const nav = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [name, setName] = useState("My Household");
    const [type, setType] = useState("home");
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    async function load() {
        setErr(null);
        const { data, error } = await supabase
            .schema('qione')
            .from("tenants")
            .select("id,name,type")
            .order("created_at", { ascending: false });
        if (error)
            setErr(error.message);
        else
            setTenants((data ?? []));
    }
    useEffect(() => { load(); }, []);
    async function createTenant() {
        if (!name)
            return;
        setLoading(true);
        setErr(null);
        try {
            const out = await apiPost("/api/bootstrap", { name, type });
            // After bootstrapping, we should set this as active
            const { data: session } = await supabase.auth.getSession();
            const uid = session.session?.user.id;
            if (uid) {
                await supabase.from("users").update({ active_tenant_id: out.tenant_id }).eq("id", uid);
            }
            nav(`/t/${out.tenant_id}/launcher`);
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    async function enterTenant(t) {
        setLoading(true);
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (uid) {
            // Persist the active tenant in the database for RLS consistency
            await supabase
                .from("users")
                .update({ active_tenant_id: t.id })
                .eq("id", uid);
        }
        nav(`/t/${t.id}/launcher`);
    }
    return (_jsxs("div", { className: "container", style: { maxWidth: 800 }, children: [_jsxs("div", { className: "glass-card fade-in", style: { marginBottom: '40px' }, children: [_jsx("h2", { style: { marginBottom: '20px' }, children: "Create New Tenant" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }, children: "Tenant Name" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. My Household" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }, children: "Type" }), _jsxs("select", { value: type, onChange: (e) => setType(e.target.value), children: [_jsx("option", { value: "home", children: "Home / Household" }), _jsx("option", { value: "business", children: "Business / Organization" }), _jsx("option", { value: "client", children: "Client / Managed" })] })] }), _jsx("button", { disabled: loading, onClick: createTenant, children: loading ? "Creating..." : "Create" })] }), err && _jsx("div", { style: { color: 'var(--error)', marginTop: '16px', fontSize: '14px' }, children: err })] }), _jsx("h3", { style: { marginBottom: '20px', paddingLeft: '8px' }, children: "Your Existing Tenants" }), _jsx("div", { style: { display: 'grid', gap: '16px' }, children: !tenants.length ? (_jsx("div", { className: "glass-card", style: { textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)' }, children: _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "No tenants found. Create your first one above!" }) })) : (tenants.map((t) => (_jsxs("div", { className: "module-tile", style: { flexDirection: 'row', alignItems: 'center', padding: '20px 32px' }, onClick: () => enterTenant(t), children: [_jsx("div", { style: { fontSize: '24px', marginRight: '20px' }, children: "\uD83C\uDFE2" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { style: { marginBottom: '4px' }, children: t.name }), _jsx("span", { className: "status-badge", children: t.type })] }), _jsx("span", { style: { color: 'var(--accent-primary)', fontWeight: 600 }, children: "Enter \u2192" })] }, t.id)))) })] }));
}
