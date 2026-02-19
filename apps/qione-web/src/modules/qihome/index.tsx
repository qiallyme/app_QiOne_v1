import React from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Ledger from "./pages/ledger";
import Chores from "./pages/chores";

export default function QiHome() {
    const { tenantId } = useParams();
    return (
        <div style={{ padding: 16 }}>
            <h2>QiHome</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <Link to={`/m/qihome/${tenantId}/dashboard`}>Dashboard</Link>
                <Link to={`/m/qihome/${tenantId}/ledger`}>Ledger</Link>
                <Link to={`/m/qihome/${tenantId}/chores`}>Chores</Link>
            </div>

            <Routes>
                <Route path=":tenantId/dashboard" element={<Dashboard />} />
                <Route path=":tenantId/ledger" element={<Ledger />} />
                <Route path=":tenantId/chores" element={<Chores />} />
            </Routes>
        </div>
    );
}
