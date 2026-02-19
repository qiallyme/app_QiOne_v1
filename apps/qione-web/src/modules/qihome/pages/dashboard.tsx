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
            <h3>Balances</h3>
            {err && <p style={{ color: "crimson" }}>{err}</p>}
            {!rows.length ? (
                <p>No balance data yet. Add expenses with shares.</p>
            ) : (
                <ul>
                    {rows.map((r) => (
                        <li key={r.user_id}>
                            {r.user_id.slice(0, 8)}… → net {dollars(r.net_cents)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
