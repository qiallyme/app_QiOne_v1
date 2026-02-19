import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

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
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (!uid) return setErr("Not signed in.");

        // Create tenant
        const { data: t, error: e1 } = await supabase
            .schema('qione')
            .from("tenants")
            .insert({ name, type, created_by: uid })
            .select("id")
            .single();
        if (e1) return setErr(e1.message);

        const tenantId = t.id as string;

        // Bootstrap: enable qihome + qione_admin modules, create Owner role, grant admin, assign user
        // NOTE: these tables are admin-gated by qione_admin access. On a brand-new tenant you don't have that yet.
        // Best practice: do this bootstrap with SQL (supabase dashboard) or a Cloudflare Worker using service role.
        // For now, we do the minimal membership insert only (allowed by RLS? no — tenant_members is admin-gated).
        // So: you MUST bootstrap once with SQL or service role. (I’m not going to lie to you here.)

        nav(`/t/${tenantId}`);
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
                ⚠️ Bootstrap note: creating a tenant is not enough. You need a one-time bootstrap (membership + role + module enablement),
                ideally via a Worker with service-role. See “Bootstrap SQL” below.
            </p>
        </div>
    );
}
