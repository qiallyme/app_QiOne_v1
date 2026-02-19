import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

type Tenant = { id: string; name: string; type: string };

export default function TenantSelect() {
    const nav = useNavigate();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [name, setName] = useState("My Household");
    const [type, setType] = useState<"home" | "business" | "client">("home");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function load() {
        setErr(null);
        const { data, error } = await supabase
            .schema('qione')
            .from("tenants")
            .select("id,name,type")
            .order("created_at", { ascending: false });
        if (error) setErr(error.message);
        else setTenants((data ?? []) as Tenant[]);
    }

    useEffect(() => { load(); }, []);

    async function createTenant() {
        if (!name) return;
        setLoading(true);
        setErr(null);
        try {
            const out = await apiPost("/api/bootstrap", { name, type });
            nav(`/t/${out.tenant_id}/launcher`);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container" style={{ maxWidth: 800 }}>
            <div className="nav-bar">
                <h1 className="gradient-text">QiOne</h1>
                <button className="secondary" onClick={() => supabase.auth.signOut()}>Sign Out</button>
            </div>

            <div className="glass-card fade-in" style={{ marginBottom: '40px' }}>
                <h2 style={{ marginBottom: '20px' }}>Create New Tenant</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Tenant Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value as any)}>
                            <option value="home">Home / Household</option>
                            <option value="business">Business / Organization</option>
                            <option value="client">Client / Managed</option>
                        </select>
                    </div>
                    <button disabled={loading} onClick={createTenant}>
                        {loading ? "Creating..." : "Create"}
                    </button>
                </div>
                {err && <div style={{ color: 'var(--error)', marginTop: '16px', fontSize: '14px' }}>{err}</div>}
            </div>

            <h3 style={{ marginBottom: '20px', paddingLeft: '8px' }}>Your Existing Tenants</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
                {!tenants.length ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>No tenants found. Create your first one above!</p>
                    </div>
                ) : (
                    tenants.map((t) => (
                        <div key={t.id} className="module-tile" style={{ flexDirection: 'row', alignItems: 'center', padding: '20px 32px' }} onClick={() => nav(`/t/${t.id}/launcher`)}>
                            <div style={{ fontSize: '24px', marginRight: '20px' }}>🏢</div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ marginBottom: '4px' }}>{t.name}</h3>
                                <span className="status-badge">{t.type}</span>
                            </div>
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Enter →</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
