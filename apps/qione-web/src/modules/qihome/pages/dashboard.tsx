import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { dollars } from "../../../lib/money";

type BalRow = {
    user_id: string;
    net_cents: number;
    shares_owed: number;
    paid_total: number;
};

export default function Dashboard() {
    const { tenantId } = useParams();
    const [rows, setRows] = useState<BalRow[]>([]);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!tenantId) return;
        (async () => {
            setErr(null);
            const { data, error } = await supabase
                .schema('qione')
                .from("v_qihome_member_balances")
                .select("user_id, net_cents, shares_owed, paid_total")
                .eq("tenant_id", tenantId);

            if (error) setErr(error.message);
            else setRows((data ?? []) as BalRow[]);
        })();
    }, [tenantId]);

    return (
        <div>
            <h3 style={{ marginBottom: '24px' }}>Member Balances</h3>
            {err && <div style={{ color: 'var(--error)', padding: '12px', background: 'rgba(255,82,82,0.1)', borderRadius: '8px', marginBottom: '20px' }}>{err}</div>}

            {!rows.length ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <p>No transactions yet. Start by adding an expense in the Ledger.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {rows.map((r) => (
                        <div key={r.user_id} className="module-tile" style={{ flexDirection: 'row', padding: '20px', cursor: 'default' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {r.user_id.slice(0, 1).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, marginLeft: '16px' }}>
                                <div style={{ fontWeight: 600 }}>User {r.user_id.slice(0, 8)}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Owed: {dollars(r.shares_owed)} | Paid: {dollars(r.paid_total)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: r.net_cents > 0 ? 'var(--error)' : r.net_cents < 0 ? 'var(--success)' : 'inherit' }}>
                                    {dollars(r.net_cents)}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {r.net_cents > 0 ? 'owes' : r.net_cents < 0 ? 'is owed' : 'settled'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
