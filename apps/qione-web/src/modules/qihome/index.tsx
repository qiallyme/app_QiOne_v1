import React from "react";
import { Link, Route, Routes, useParams, useNavigate } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Ledger from "./pages/ledger";
import Chores from "./pages/chores";

export default function QiHome() {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const path = window.location.pathname;

    const isActive = (p: string) => path.includes(p) ? 'active' : '';

    return (
        <div className="container" style={{ paddingTop: '20px' }}>
            <div className="nav-bar" style={{ marginBottom: '20px', justifyContent: 'flex-start' }}>
                <h2 style={{ marginBottom: 0 }}>QiHome</h2>
                <button className="secondary" style={{ marginLeft: 'auto' }} onClick={() => nav(`/t/${tenantId}/launcher`)}>Back to Launcher</button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', padding: '4px', background: 'var(--surface-color)', borderRadius: '16px', width: 'fit-content' }}>
                <Link to={`/m/qihome/${tenantId}/dashboard`} style={{ textDecoration: 'none' }}>
                    <button className={path.includes('dashboard') ? '' : 'secondary'} style={{ padding: '8px 20px', borderRadius: '12px' }}>Dashboard</button>
                </Link>
                <Link to={`/m/qihome/${tenantId}/ledger`} style={{ textDecoration: 'none' }}>
                    <button className={path.includes('ledger') ? '' : 'secondary'} style={{ padding: '8px 20px', borderRadius: '12px' }}>Ledger</button>
                </Link>
                <Link to={`/m/qihome/${tenantId}/chores`} style={{ textDecoration: 'none' }}>
                    <button className={path.includes('chores') ? '' : 'secondary'} style={{ padding: '8px 20px', borderRadius: '12px' }}>Chores</button>
                </Link>
            </div>

            <div className="glass-card fade-in" style={{ padding: '40px' }}>
                <Routes>
                    <Route path=":tenantId/dashboard" element={<Dashboard />} />
                    <Route path=":tenantId/ledger" element={<Ledger />} />
                    <Route path=":tenantId/chores" element={<Chores />} />
                </Routes>
            </div>
        </div>
    );
}
