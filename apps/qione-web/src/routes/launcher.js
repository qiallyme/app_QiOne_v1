import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
const ICON_MAP = {
    qihome: "🏠",
    qione_admin: "⚙️",
};
export default function Launcher() {
    const nav = useNavigate();
    const { tenantId } = useParams();
    const [mods, setMods] = useState([]);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!tenantId)
            return;
        (async () => {
            setLoading(true);
            setErr(null);
            const { data: session } = await supabase.auth.getSession();
            const uid = session.session?.user.id;
            if (!uid)
                return setErr("Not signed in.");
            const { data, error } = await supabase
                .schema('qione')
                .from("v_launcher_modules")
                .select("module_key,name,description,route,access_level")
                .eq("tenant_id", tenantId)
                .eq("user_id", uid);
            setLoading(false);
            if (error)
                setErr(error.message);
            else
                setMods((data ?? []));
        })();
    }, [tenantId]);
    function open(m) {
        if (m.module_key === "qihome") {
            nav(`/m/qihome/${tenantId}/dashboard`);
        }
        else if (m.module_key === "qione_admin") {
            nav(`/t/${tenantId}/admin/modules`);
        }
        else {
            nav(`/t/${tenantId}/settings`);
        }
    }
    return (_jsxs("div", { className: "container", children: [_jsxs("div", { className: "nav-bar", style: { justifyContent: 'flex-start', gap: '12px' }, children: [_jsxs("p", { style: { color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }, children: ["Tenant: ", tenantId?.slice(0, 8), "..."] }), _jsxs("div", { style: { marginLeft: 'auto', display: 'flex', gap: '12px' }, children: [_jsx("button", { className: "secondary", onClick: () => nav(`/t/${tenantId}/settings`), children: "Settings" }), _jsx("button", { className: "secondary", onClick: () => nav('/'), children: "Switch Tenant" })] })] }), err && _jsx("div", { style: { color: 'var(--error)', padding: '20px', background: 'rgba(255,82,82,0.1)', borderRadius: '12px' }, children: err }), loading ? (_jsxs("div", { style: { textAlign: 'center', padding: '100px' }, children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { style: { marginTop: '20px', color: 'var(--text-secondary)' }, children: "Loading your modules..." })] })) : !mods.length ? (_jsxs("div", { className: "glass-card", style: { textAlign: 'center', padding: '60px' }, children: [_jsx("h3", { children: "No modules accessible" }), _jsx("p", { style: { color: 'var(--text-secondary)', marginTop: '12px' }, children: "Your account hasn't been assigned any modules for this tenant yet." }), _jsx("button", { style: { marginTop: '24px' }, onClick: () => nav('/'), children: "Go Back" })] })) : (_jsx("div", { className: "launcher-grid fade-in", children: mods.map((m) => (_jsxs("div", { className: "module-tile", onClick: () => open(m), children: [_jsx("div", { className: "module-icon", children: ICON_MAP[m.module_key] || "📦" }), _jsxs("div", { children: [_jsx("h3", { style: { marginBottom: '4px' }, children: m.name }), _jsx("p", { style: { color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }, children: m.description ?? "Access your module features." })] }), _jsxs("div", { style: { marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { className: "status-badge", style: { color: m.access_level === 'admin' ? 'var(--accent-secondary)' : 'var(--text-secondary)' }, children: m.access_level }), _jsx("span", { style: { color: 'var(--accent-primary)', fontWeight: 600 }, children: "Launch \u2192" })] })] }, m.module_key))) }))] }));
}
