import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

type Chore = { id: string; title: string; frequency: string };

export default function Chores() {
    const { tenantId } = useParams();
    const [items, setItems] = useState<Chore[]>([]);
    const [title, setTitle] = useState("");
    const [err, setErr] = useState<string | null>(null);

    async function load() {
        if (!tenantId) return;
        const { data, error } = await supabase
            .schema('qione')
            .from("qihome_chores")
            .select("id,title,frequency")
            .eq("tenant_id", tenantId)
            .eq("is_active", true)
            .order("title");

        if (error) setErr(error.message);
        else setItems((data ?? []) as Chore[]);
    }

    useEffect(() => {
        setErr(null);
        load();
    }, [tenantId]);

    async function addChore() {
        if (!tenantId) return;
        setErr(null);

        if (!title.trim()) return setErr("Chore title required.");

        const { error } = await supabase
            .schema('qione')
            .from("qihome_chores")
            .insert({
                tenant_id: tenantId,
                title: title.trim(),
                frequency: "weekly",
                points: 1,
                is_active: true,
            });

        if (error) return setErr(error.message);

        setTitle("");
        await load();
    }

    return (
        <div>
            <h3>Chores</h3>
            {err && <p style={{ color: "crimson" }}>{err}</p>}

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New chore" />
                <button onClick={addChore}>Add</button>
            </div>

            {!items.length ? (
                <p>No chores yet.</p>
            ) : (
                <ul>
                    {items.map((c) => (
                        <li key={c.id}>
                            {c.title} <span style={{ opacity: 0.7 }}>({c.frequency})</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
