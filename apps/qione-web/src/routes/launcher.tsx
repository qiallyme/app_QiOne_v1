import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type LauncherRow = {
    module_key: string;
    name: string;
    description: string | null;
    route: string;
    access_level: string;
};

const ICON_MAP: Record<string, string> = {
    qihome: "🏠",
    qione_admin: "⚙️",
};

export default function Launcher() {
    const nav = useNavigate();
    const { tenantId } = useParams();
    const [mods, setMods] = useState<LauncherRow[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        (async () => {
            setLoading(true);
            setErr(null);
            const { data: session } = await supabase.auth.getSession();
            const uid = session.session?.user.id;
            if (!uid) return setErr("Not signed in.");

            const { data, error } = await supabase
                .schema('qione')
                .from("v_launcher_modules")
                .select("module_key,name,description,route,access_level")
                .eq("tenant_id", tenantId)
                .eq("user_id", uid);

            setLoading(false);
            if (error) setErr(error.message);
            else setMods((data ?? []) as LauncherRow[]);
        })();
    }, [tenantId]);

    function open(m: LauncherRow) {
        if (m.module_key === "qihome") nav(`/m/qihome/${tenantId}/dashboard`);
        else nav(`/t/${tenantId}/settings`);
    }

    return (
        <div className="container">
            <div className="nav-bar">
                <div>
                    <h2 style={{ marginBottom: 0 }}>QiOne <span className="gradient-text">Launcher</span></h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Tenant: {tenantId?.slice(0, 8)}...</p>
                </div>
                <button className="secondary" onClick={() => nav('/')}>Switch Tenant</button>
            </div>

            {err && <div style={{ color: 'var(--error)', padding: '20px', background: 'rgba(255,82,82,0.1)', borderRadius: '12px' }}>{err}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px' }}>
                    <div className="loading-spinner"></div>
                    <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading your modules...</p>
                </div>
            ) : !mods.length ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <h3>No modules accessible</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                        Your account hasn't been assigned any modules for this tenant yet.
                    </p>
                    <button style={{ marginTop: '24px' }} onClick={() => nav('/')}>Go Back</button>
                </div>
            ) : (
                <div className="launcher-grid fade-in">
                    {mods.map((m) => (
                        <div key={m.module_key} className="module-tile" onClick={() => open(m)}>
                            <div className="module-icon">
                                {ICON_MAP[m.module_key] || "📦"}
                            </div>
                            <div>
                                <h3 style={{ marginBottom: '4px' }}>{m.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                                    {m.description ?? "Access your module features."}
                                </p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="status-badge" style={{ color: m.access_level === 'admin' ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>
                                    {m.access_level}
                                </span>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Launch →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
