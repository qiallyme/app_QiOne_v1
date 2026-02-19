import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../lib/api";

type Member = {
    user_id: string;
    email: string | null;
    status: string;
    display_name: string | null;
    joined_at: string;
};

type TenantModule = {
    module_key: string;
    is_enabled: boolean;
    settings: any;
    modules: { name: string; description: string | null; icon: string | null; is_active: boolean; route: string } | null;
};

type Role = { id: string; name: string; rank: number };
type AccessRow = { module_key: string; role_id: string; access: "none" | "read" | "write" | "admin" };

export default function TenantSettings() {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const [tab, setTab] = useState<"members" | "modules" | "roles">("members");

    return (
        <div className="container">
            <div className="nav-bar" style={{ justifyContent: 'flex-start' }}>
                <button className="secondary" style={{ marginLeft: 'auto' }} onClick={() => nav(`/t/${tenantId}/launcher`)}>Back to Launcher</button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', padding: '4px', background: 'var(--surface-color)', borderRadius: '16px', width: 'fit-content' }}>
                <button className={tab === "members" ? "" : "secondary"} onClick={() => setTab("members")} style={{ padding: '8px 24px', borderRadius: '12px' }}>Members</button>
                <button className={tab === "modules" ? "" : "secondary"} onClick={() => setTab("modules")} style={{ padding: '8px 24px', borderRadius: '12px' }}>Modules</button>
                <button className={tab === "roles" ? "" : "secondary"} onClick={() => setTab("roles")} style={{ padding: '8px 24px', borderRadius: '12px' }}>Roles & Access</button>
            </div>

            <div className="glass-card fade-in" style={{ padding: '40px' }}>
                {tab === "members" && tenantId && <MembersTab tenantId={tenantId} />}
                {tab === "modules" && tenantId && <ModulesTab tenantId={tenantId} />}
                {tab === "roles" && tenantId && <RolesTab tenantId={tenantId} />}
            </div>
        </div>
    );
}

function MembersTab({ tenantId }: { tenantId: string }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [err, setErr] = useState<string | null>(null);
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
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [tenantId]);

    async function invite() {
        if (!email) return;
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
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div>
            <h3 style={{ marginBottom: '24px' }}>Workspace Members</h3>

            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Invite New Member</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Email Address</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Display Name</label>
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. John Doe" />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Initial Role</label>
                        <select value={roleName} onChange={(e) => setRoleName(e.target.value)}>
                            <option>Owner</option>
                            <option>Member</option>
                            <option>Viewer</option>
                        </select>
                    </div>
                    <button onClick={invite}>Send Invite</button>
                </div>
                {err && <p style={{ color: "var(--error)", marginTop: '12px', fontSize: '14px' }}>{err}</p>}
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading members...</p>
            ) : !members.length ? (
                <p style={{ color: 'var(--text-secondary)' }}>No members found.</p>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {members.map((m) => (
                        <div key={m.user_id} className="module-tile" style={{ flexDirection: 'row', alignItems: 'center', padding: '16px 24px', cursor: 'default' }}>
                            <div className="module-icon" style={{ width: '40px', height: '40px', fontSize: '18px' }}>👤</div>
                            <div style={{ flex: 1, marginLeft: '16px' }}>
                                <div style={{ fontWeight: 600 }}>{m.display_name ?? m.email?.split('@')[0] ?? 'Unknown User'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className="status-badge" style={{
                                    background: m.status === 'active' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 171, 0, 0.1)',
                                    color: m.status === 'active' ? 'var(--success)' : '#ffab00',
                                    borderColor: m.status === 'active' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 171, 0, 0.2)'
                                }}>
                                    {m.status}
                                </span>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ModulesTab({ tenantId }: { tenantId: string }) {
    const [mods, setMods] = useState<TenantModule[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        setErr(null);
        setLoading(true);
        try {
            const out = await apiGet(`/api/tenants/${tenantId}/modules`);
            setMods(out.tenant_modules ?? []);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [tenantId]);

    async function toggle(moduleKey: string, isEnabled: boolean) {
        setErr(null);
        try {
            await apiPatch(`/api/tenants/${tenantId}/modules`, { module_key: moduleKey, is_enabled: isEnabled });
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div>
            <h3 style={{ marginBottom: '24px' }}>Workspace Modules</h3>
            {err && <p style={{ color: "var(--error)", marginBottom: '20px' }}>{err}</p>}

            {loading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading modules...</p>
            ) : !mods.length ? (
                <p style={{ color: 'var(--text-secondary)' }}>No modules found.</p>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {mods.map((m) => (
                        <div key={m.module_key} className="module-tile" style={{ padding: '24px', cursor: 'default' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div className="module-icon" style={{ width: '48px', height: '48px' }}>
                                        {m.module_key === 'qihome' ? '🏠' : '⚙️'}
                                    </div>
                                    <div>
                                        <h4 style={{ marginBottom: '4px' }}>{m.modules?.name ?? m.module_key}</h4>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{m.modules?.description}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: m.is_enabled ? 'var(--success)' : 'var(--text-secondary)' }}>
                                        {m.is_enabled ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={m.is_enabled}
                                        onChange={(e) => toggle(m.module_key, e.target.checked)}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function RolesTab({ tenantId }: { tenantId: string }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [access, setAccess] = useState<AccessRow[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [newRole, setNewRole] = useState("");

    async function load() {
        setErr(null);
        setLoading(true);
        try {
            const out = await apiGet(`/api/tenants/${tenantId}/roles`);
            setRoles(out.roles ?? []);
            setAccess(out.access ?? []);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [tenantId]);

    async function createRole() {
        if (!newRole.trim()) return;
        setErr(null);
        try {
            await apiPost(`/api/tenants/${tenantId}/roles`, { name: newRole.trim(), rank: 60 });
            setNewRole("");
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    function getAccess(roleId: string, moduleKey: string) {
        return access.find((a) => a.role_id === roleId && a.module_key === moduleKey)?.access ?? "none";
    }

    async function setAccessLevel(roleId: string, moduleKey: string, level: AccessRow["access"]) {
        setErr(null);
        try {
            await apiPost(`/api/tenants/${tenantId}/access`, { role_id: roleId, module_key: moduleKey, access: level });
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    const moduleKeys = ["qione_admin", "qihome"];

    return (
        <div>
            <h3 style={{ marginBottom: '24px' }}>Roles & Module Access</h3>

            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Create Custom Role</h4>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Role Name</label>
                        <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Caregiver, Manager" />
                    </div>
                    <button onClick={createRole}>Add Role</button>
                </div>
                {err && <p style={{ color: "var(--error)", marginTop: '12px', fontSize: '14px' }}>{err}</p>}
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading roles...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>Role</th>
                                {moduleKeys.map((k) => (
                                    <th key={k} style={{ textAlign: "center", padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>{k}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ padding: "20px 16px", fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{r.name}</td>
                                    {moduleKeys.map((k) => (
                                        <td key={k} style={{ padding: "16px", textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                                            <select
                                                value={getAccess(r.id, k)}
                                                onChange={(e) => setAccessLevel(r.id, k, e.target.value as any)}
                                                style={{ width: 'fit-content', padding: '8px 12px' }}
                                            >
                                                <option value="none">None</option>
                                                <option value="read">Read</option>
                                                <option value="write">Write</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
