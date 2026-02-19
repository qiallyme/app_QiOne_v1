import React from "react";
import { Link, useParams } from "react-router-dom";

export default function TenantHome() {
    const { tenantId } = useParams();
    return (
        <div style={{ padding: 16 }}>
            <h2>Tenant</h2>
            <p>tenantId: <code>{tenantId}</code></p>
            <div style={{ display: "flex", gap: 12 }}>
                <Link to={`/t/${tenantId}/launcher`}>Open Launcher</Link>
                <Link to={`/m/qihome/${tenantId}/dashboard`}>QiHome</Link>
            </div>
        </div>
    );
}
