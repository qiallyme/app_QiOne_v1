import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

type Chore = { id: string; title: string; frequency: string };

export default function Chores() {
    const { tenantId } = useParams();
    const [items, setItems] = useState<Chore[]>([]);
    const [title, setTitle] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        if (!tenantId || !title.trim()) return;
        setLoading(true);
        setErr(null);

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

        setLoading(false);
        if (error) return setErr(error.message);

        setTitle("");
        await load();
    }

    return (
        <div>
            <h3 style={{ marginBottom: '24px' }}>Household Chores</h3>

            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', marginBottom: '32px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Create New Chore</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>What needs to be done?</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Vacuum living room"
                        />
                    </div>
                    <button onClick={addChore} disabled={loading}>{loading ? '...' : 'Add Chore'}</button>
                </div>
                {err && <p style={{ color: "var(--error)", fontSize: '14px', marginTop: '12px' }}>{err}</p>}
            </div>

            {!items.length ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <p>No active chores found. Time to relax, or add one above!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                    {items.map((c) => (
                        <div key={c.id} className="module-tile" style={{ padding: '20px', cursor: 'default' }}>
                            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🧹</div>
                            <h4 style={{ marginBottom: '4px' }}>{c.title}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <span className="status-badge" style={{ fontSize: '10px' }}>{c.frequency}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: {c.id.slice(0, 4)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
