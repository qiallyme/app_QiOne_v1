import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
export default function AdminModules() {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const [allModules, setAllModules] = useState([]);
    const [enabledModules, setEnabledModules] = useState({});
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    async function load() {
        setLoading(true);
        setErr(null);
        try {
            // 1. Fetch available modules
            const { data: mods, error: modErr } = await supabase
                .schema('qione')
                .from("modules")
                .select("module_key, name, description")
                .eq("is_active", true);
            if (modErr)
                throw modErr;
            // 2. Fetch enabled modules for this tenant
            const { data: active, error: activeErr } = await supabase
                .schema('qione')
                .from("tenant_modules")
                .select("module_key, is_enabled")
                .eq("tenant_id", tenantId);
            if (activeErr)
                throw activeErr;
            setAllModules(mods || []);
            const map = {};
            (active || []).forEach(m => {
                map[m.module_key] = m.is_enabled;
            });
            setEnabledModules(map);
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (tenantId)
            load();
    }, [tenantId]);
    async function toggleModule(moduleKey, current) {
        try {
            if (current) {
                // Disable: Remove or set is_enabled=false
                await supabase
                    .schema('qione')
                    .from("tenant_modules")
                    .update({ is_enabled: false })
                    .match({ tenant_id: tenantId, module_key: moduleKey });
            }
            else {
                // Enable: Insert or upsert
                await supabase
                    .schema('qione')
                    .from("tenant_modules")
                    .upsert({
                    tenant_id: tenantId,
                    module_key: moduleKey,
                    is_enabled: true,
                    settings: {}
                });
            }
            await load(); // Reload state
        }
        catch (e) {
            setErr(e.message);
        }
    }
    return (_jsxs("div", { className: "container", children: [_jsxs("div", { className: "nav-bar", style: { justifyContent: 'flex-start' }, children: [_jsx("button", { className: "secondary", onClick: () => nav(`/t/${tenantId}/launcher`), children: "\u2190 Back" }), _jsx("h2", { style: { marginLeft: '16px' }, children: "Module Management" })] }), err && _jsx("div", { style: { color: 'var(--error)', padding: '20px', background: 'rgba(255,82,82,0.1)', borderRadius: '12px' }, children: err }), _jsxs("div", { className: "glass-card", style: { padding: '0' }, children: [_jsxs("div", { style: { padding: '24px', borderBottom: '1px solid var(--border-color)' }, children: [_jsx("h3", { style: { margin: 0 }, children: "Available Modules" }), _jsx("p", { style: { color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }, children: "Enable or disable functionality for this specific workspace." })] }), loading ? (_jsx("div", { style: { padding: '40px', textAlign: 'center' }, children: "Loading..." })) : (_jsx("div", { style: { display: 'grid', gap: '1px', background: 'var(--border-color)' }, children: allModules.map(m => {
                            const isEnabled = enabledModules[m.module_key] || false;
                            return (_jsxs("div", { style: { background: 'var(--card-bg)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '16px' }, children: [_jsx("div", { className: "module-icon", style: { width: '40px', height: '40px', fontSize: '18px' }, children: m.module_key === 'qihome' ? '🏠' : '📦' }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: m.name }), _jsx("div", { style: { fontSize: '12px', color: 'var(--text-secondary)' }, children: m.description })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("span", { style: { fontSize: '12px', fontWeight: 600, color: isEnabled ? 'var(--success)' : 'var(--text-secondary)' }, children: isEnabled ? 'ACTIVE' : 'INACTIVE' }), _jsx("button", { className: isEnabled ? "secondary" : "", onClick: () => toggleModule(m.module_key, isEnabled), style: { padding: '8px 16px', fontSize: '12px' }, children: isEnabled ? "Disable" : "Enable" })] })] }, m.module_key));
                        }) }))] })] }));
}
