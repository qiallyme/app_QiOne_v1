import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../lib/api";
export default function TenantSettings() {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const [tab, setTab] = useState("members");
    return (_jsxs("div", { className: "container", children: [_jsx("div", { className: "nav-bar", style: { justifyContent: 'flex-start' }, children: _jsx("button", { className: "secondary", style: { marginLeft: 'auto' }, onClick: () => nav(`/t/${tenantId}/launcher`), children: "Back to Launcher" }) }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginBottom: '32px', padding: '4px', background: 'var(--surface-color)', borderRadius: '16px', width: 'fit-content' }, children: [_jsx("button", { className: tab === "members" ? "" : "secondary", onClick: () => setTab("members"), style: { padding: '8px 24px', borderRadius: '12px' }, children: "Members" }), _jsx("button", { className: tab === "modules" ? "" : "secondary", onClick: () => setTab("modules"), style: { padding: '8px 24px', borderRadius: '12px' }, children: "Modules" }), _jsx("button", { className: tab === "roles" ? "" : "secondary", onClick: () => setTab("roles"), style: { padding: '8px 24px', borderRadius: '12px' }, children: "Roles & Access" })] }), _jsxs("div", { className: "glass-card fade-in", style: { padding: '40px' }, children: [tab === "members" && tenantId && _jsx(MembersTab, { tenantId: tenantId }), tab === "modules" && tenantId && _jsx(ModulesTab, { tenantId: tenantId }), tab === "roles" && tenantId && _jsx(RolesTab, { tenantId: tenantId })] })] }));
}
function MembersTab({ tenantId }) {
    const [members, setMembers] = useState([]);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [roleName, setRoleName] = useState("Member");
    async function load() {
        setErr(null);
        setLoading(true);
        try {
            const out = await apiGet(`/api/tenants/${tenantId}/members`);
            setMembers(out.members ?? []);
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, [tenantId]);
    async function invite() {
        if (!email)
            return;
        setErr(null);
        try {
            await apiPost(`/api/tenants/${tenantId}/invite`, {
                email,
                display_name: displayName || undefined,
                role_name: roleName || undefined,
            });
            setEmail("");
            setDisplayName("");
            await load();
        }
        catch (e) {
            setErr(e.message);
        }
    }
    return (_jsxs("div", { children: [_jsx("h3", { style: { marginBottom: '24px' }, children: "Workspace Members" }), _jsxs("div", { className: "glass-card", style: { background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }, children: [_jsx("h4", { style: { marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }, children: "Invite New Member" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', display: 'block', marginBottom: '6px' }, children: "Email Address" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "email@domain.com" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', display: 'block', marginBottom: '6px' }, children: "Display Name" }), _jsx("input", { value: displayName, onChange: (e) => setDisplayName(e.target.value), placeholder: "e.g. John Doe" })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: '12px', display: 'block', marginBottom: '6px' }, children: "Initial Role" }), _jsxs("select", { value: roleName, onChange: (e) => setRoleName(e.target.value), children: [_jsx("option", { children: "Owner" }), _jsx("option", { children: "Member" }), _jsx("option", { children: "Viewer" })] })] }), _jsx("button", { onClick: invite, children: "Send Invite" })] }), err && _jsx("p", { style: { color: "var(--error)", marginTop: '12px', fontSize: '14px' }, children: err })] }), loading ? (_jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Loading members..." })) : !members.length ? (_jsx("p", { style: { color: 'var(--text-secondary)' }, children: "No members found." })) : (_jsx("div", { style: { display: 'grid', gap: '12px' }, children: members.map((m) => (_jsxs("div", { className: "module-tile", style: { flexDirection: 'row', alignItems: 'center', padding: '16px 24px', cursor: 'default' }, children: [_jsx("div", { className: "module-icon", style: { width: '40px', height: '40px', fontSize: '18px' }, children: "\uD83D\uDC64" }), _jsxs("div", { style: { flex: 1, marginLeft: '16px' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: m.display_name ?? m.email?.split('@')[0] ?? 'Unknown User' }), _jsx("div", { style: { fontSize: '12px', color: 'var(--text-secondary)' }, children: m.email })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("span", { className: "status-badge", style: {
                                        background: m.status === 'active' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 171, 0, 0.1)',
                                        color: m.status === 'active' ? 'var(--success)' : '#ffab00',
                                        borderColor: m.status === 'active' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 171, 0, 0.2)'
                                    }, children: m.status }), _jsxs("div", { style: { fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }, children: ["Joined ", new Date(m.joined_at).toLocaleDateString()] })] })] }, m.user_id))) }))] }));
}
function ModulesTab({ tenantId }) {
    const [mods, setMods] = useState([]);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    async function load() {
        setErr(null);
        setLoading(true);
        try {
            const out = await apiGet(`/api/tenants/${tenantId}/modules`);
            setMods(out.tenant_modules ?? []);
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, [tenantId]);
    async function toggle(moduleKey, isEnabled) {
        setErr(null);
        try {
            await apiPatch(`/api/tenants/${tenantId}/modules`, { module_key: moduleKey, is_enabled: isEnabled });
            await load();
        }
        catch (e) {
            setErr(e.message);
        }
    }
    return (_jsxs("div", { children: [_jsx("h3", { style: { marginBottom: '24px' }, children: "Workspace Modules" }), err && _jsx("p", { style: { color: "var(--error)", marginBottom: '20px' }, children: err }), loading ? (_jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Loading modules..." })) : !mods.length ? (_jsx("p", { style: { color: 'var(--text-secondary)' }, children: "No modules found." })) : (_jsx("div", { style: { display: 'grid', gap: '16px' }, children: mods.map((m) => (_jsx("div", { className: "module-tile", style: { padding: '24px', cursor: 'default' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'center' }, children: [_jsx("div", { className: "module-icon", style: { width: '48px', height: '48px' }, children: m.module_key === 'qihome' ? '🏠' : '⚙️' }), _jsxs("div", { children: [_jsx("h4", { style: { marginBottom: '4px' }, children: m.modules?.name ?? m.module_key }), _jsx("p", { style: { fontSize: '13px', color: 'var(--text-secondary)' }, children: m.modules?.description })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("span", { style: { fontSize: '13px', fontWeight: 600, color: m.is_enabled ? 'var(--success)' : 'var(--text-secondary)' }, children: m.is_enabled ? 'ENABLED' : 'DISABLED' }), _jsx("input", { type: "checkbox", checked: m.is_enabled, onChange: (e) => toggle(m.module_key, e.target.checked), style: { width: '20px', height: '20px', cursor: 'pointer' } })] })] }) }, m.module_key))) }))] }));
}
function RolesTab({ tenantId }) {
    const [roles, setRoles] = useState([]);
    const [access, setAccess] = useState([]);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newRole, setNewRole] = useState("");
    async function load() {
        setErr(null);
        setLoading(true);
        try {
            const out = await apiGet(`/api/tenants/${tenantId}/roles`);
            setRoles(out.roles ?? []);
            setAccess(out.access ?? []);
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, [tenantId]);
    async function createRole() {
        if (!newRole.trim())
            return;
        setErr(null);
        try {
            await apiPost(`/api/tenants/${tenantId}/roles`, { name: newRole.trim(), rank: 60 });
            setNewRole("");
            await load();
        }
        catch (e) {
            setErr(e.message);
        }
    }
    function getAccess(roleId, moduleKey) {
        return access.find((a) => a.role_id === roleId && a.module_key === moduleKey)?.access ?? "none";
    }
    async function setAccessLevel(roleId, moduleKey, level) {
        setErr(null);
        try {
            await apiPost(`/api/tenants/${tenantId}/access`, { role_id: roleId, module_key: moduleKey, access: level });
            await load();
        }
        catch (e) {
            setErr(e.message);
        }
    }
    const moduleKeys = ["qione_admin", "qihome"];
    return (_jsxs("div", { children: [_jsx("h3", { style: { marginBottom: '24px' }, children: "Roles & Module Access" }), _jsxs("div", { className: "glass-card", style: { background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }, children: [_jsx("h4", { style: { marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }, children: "Create Custom Role" }), _jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: { fontSize: '12px', display: 'block', marginBottom: '6px' }, children: "Role Name" }), _jsx("input", { value: newRole, onChange: (e) => setNewRole(e.target.value), placeholder: "e.g. Caregiver, Manager" })] }), _jsx("button", { onClick: createRole, children: "Add Role" })] }), err && _jsx("p", { style: { color: "var(--error)", marginTop: '12px', fontSize: '14px' }, children: err })] }), loading ? (_jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Loading roles..." })) : (_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { textAlign: "left", padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }, children: "Role" }), moduleKeys.map((k) => (_jsx("th", { style: { textAlign: "center", padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }, children: k }, k)))] }) }), _jsx("tbody", { children: roles.map((r) => (_jsxs("tr", { children: [_jsx("td", { style: { padding: "20px 16px", fontWeight: 600, borderBottom: '1px solid var(--border-color)' }, children: r.name }), moduleKeys.map((k) => (_jsx("td", { style: { padding: "16px", textAlign: 'center', borderBottom: '1px solid var(--border-color)' }, children: _jsxs("select", { value: getAccess(r.id, k), onChange: (e) => setAccessLevel(r.id, k, e.target.value), style: { width: 'fit-content', padding: '8px 12px' }, children: [_jsx("option", { value: "none", children: "None" }), _jsx("option", { value: "read", children: "Read" }), _jsx("option", { value: "write", children: "Write" }), _jsx("option", { value: "admin", children: "Admin" })] }) }, k)))] }, r.id))) })] }) }))] }));
}
