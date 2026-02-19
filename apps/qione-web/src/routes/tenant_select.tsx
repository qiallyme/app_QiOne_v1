import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

type Tenant = { id: string; name: string; type: string };

export default function TenantSelect() {
    const nav = useNavigate();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [name, setName] = useState("Home");
    const [type, setType] = useState<"home" | "business" | "client">("home");
    const [err, setErr] = useState<string | null>(null);

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
        setErr(null);
        try {
            const out = await apiPost("/api/bootstrap", { name, type });
            nav(`/t/${out.tenant_id}`);
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Select Tenant</h2>
            {err && <p style={{ color: "crimson" }}>{err}</p>}

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} />
                <select value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="home">home</option>
                    <option value="business">business</option>
                    <option value="client">client</option>
                </select>
                <button onClick={createTenant}>Create</button>
            </div>

            <h3>Your tenants</h3>
            {!tenants.length ? (
                <p>No tenants found (yet).</p>
            ) : (
                <ul>
                    {tenants.map((t) => (
                        <li key={t.id}>
                            <button onClick={() => nav(`/t/${t.id}`)}>{t.name}</button> <span style={{ opacity: 0.7 }}>({t.type})</span>
                        </li>
                    ))}
                </ul>
            )}

            <p style={{ marginTop: 16, opacity: 0.85 }}>
                ⚠️ Bootstrap note: the app now uses a Cloudflare Worker to bootstrap your tenant automatically (membership + role + module enablement).
            </p>
        </div>
    );
}
