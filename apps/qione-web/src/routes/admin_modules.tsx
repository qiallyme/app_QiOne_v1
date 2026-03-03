import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useParams, useNavigate } from "react-router-dom";

type Module = {
    module_key: string;
    name: string;
    description: string | null;
};

type TenantModule = {
    module_key: string;
    is_enabled: boolean;
};

export default function AdminModules() {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const [allModules, setAllModules] = useState<Module[]>([]);
    const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

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

            if (modErr) throw modErr;

            // 2. Fetch enabled modules for this tenant
            const { data: active, error: activeErr } = await supabase
                .schema('qione')
                .from("tenant_modules")
                .select("module_key, is_enabled")
                .eq("tenant_id", tenantId);

            if (activeErr) throw activeErr;

            setAllModules(mods || []);
            const map: Record<string, boolean> = {};
            (active || []).forEach(m => {
                map[m.module_key] = m.is_enabled;
            });
            setEnabledModules(map);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (tenantId) load();
    }, [tenantId]);

    async function toggleModule(moduleKey: string, current: boolean) {
        try {
            if (current) {
                // Disable: Remove or set is_enabled=false
                await supabase
                    .schema('qione')
                    .from("tenant_modules")
                    .update({ is_enabled: false })
                    .match({ tenant_id: tenantId, module_key: moduleKey });
            } else {
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
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div className="container">
            <div className="nav-bar" style={{ justifyContent: 'flex-start' }}>
                <button className="secondary" onClick={() => nav(`/t/${tenantId}/launcher`)}>← Back</button>
                <h2 style={{ marginLeft: '16px' }}>Module Management</h2>
            </div>

            {err && <div style={{ color: 'var(--error)', padding: '20px', background: 'rgba(255,82,82,0.1)', borderRadius: '12px' }}>{err}</div>}

            <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0 }}>Available Modules</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Enable or disable functionality for this specific workspace.
                    </p>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
                ) : (
                    <div style={{ display: 'grid', gap: '1px', background: 'var(--border-color)' }}>
                        {allModules.map(m => {
                            const isEnabled = enabledModules[m.module_key] || false;
                            return (
                                <div key={m.module_key} style={{ background: 'var(--card-bg)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div className="module-icon" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                                            {m.module_key === 'qihome' ? '🏠' : '📦'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.description}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: isEnabled ? 'var(--success)' : 'var(--text-secondary)' }}>
                                            {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                        <button
                                            className={isEnabled ? "secondary" : ""}
                                            onClick={() => toggleModule(m.module_key, isEnabled)}
                                            style={{ padding: '8px 16px', fontSize: '12px' }}
                                        >
                                            {isEnabled ? "Disable" : "Enable"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
