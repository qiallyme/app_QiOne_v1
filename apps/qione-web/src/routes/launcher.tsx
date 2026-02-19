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

export default function Launcher() {
    const nav = useNavigate();
    const { tenantId } = useParams();
    const [mods, setMods] = useState<LauncherRow[]>([]);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!tenantId) return;
        (async () => {
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

            if (error) setErr(error.message);
            else setMods((data ?? []) as LauncherRow[]);
        })();
    }, [tenantId]);

    function open(m: LauncherRow) {
        // routes stored in catalog are base routes; for modules we pass tenantId in the actual URL
        if (m.module_key === "qihome") nav(`/m/qihome/${tenantId}/dashboard`);
        else nav(`/t/${tenantId}/settings`); // admin stub
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Launcher</h2>
            {err && <p style={{ color: "crimson" }}>{err}</p>}
            {!mods.length ? (
                <p>No modules visible. This usually means the tenant wasn’t bootstrapped (roles/access/modules).</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    {mods.map((m) => (
                        <div key={m.module_key} style={{ border: "1px solid #333", borderRadius: 12, padding: 12 }}>
                            <div style={{ fontWeight: 700 }}>{m.name}</div>
                            <div style={{ opacity: 0.8, margin: "8px 0" }}>{m.description ?? ""}</div>
                            <div style={{ opacity: 0.7 }}>Access: {m.access_level}</div>
                            <button style={{ marginTop: 10 }} onClick={() => open(m)}>Open</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
