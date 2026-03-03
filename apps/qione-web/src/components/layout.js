import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function Layout({ children }) {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const [userEmail, setUserEmail] = useState(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserEmail(data.user?.email ?? null);
        });
    }, []);
    async function handleSignOut() {
        await supabase.auth.signOut();
        window.location.href = "/auth"; // Force a full reload to clear any stale state
    }
    return (_jsxs("div", { style: { minHeight: '100vh', display: 'flex', flexDirection: 'column' }, children: [_jsxs("header", { className: "glass-card", style: {
                    margin: '20px',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 100
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '20px' }, children: [_jsx(Link, { to: "/", style: { textDecoration: 'none' }, children: _jsx("h1", { className: "gradient-text", style: { margin: 0, fontSize: '1.5rem' }, children: "QiOne" }) }), tenantId && (_jsxs("div", { style: { display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }, children: [_jsx(Link, { to: `/t/${tenantId}/launcher`, style: { textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }, children: "Launcher" }), _jsx(Link, { to: `/m/qihome/${tenantId}/dashboard`, style: { textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }, children: "QiHome" })] }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '16px' }, children: [userEmail && (_jsxs("div", { style: { textAlign: 'right', display: 'none' }, children: [_jsx("div", { style: { fontSize: '12px', color: 'var(--text-secondary)' }, children: "Signed in as" }), _jsx("div", { style: { fontSize: '14px', fontWeight: 500 }, children: userEmail })] })), _jsx("div", { className: "status-badge", style: { background: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)', borderColor: 'rgba(0, 230, 118, 0.2)' }, children: "Live" }), _jsx("button", { className: "secondary", onClick: handleSignOut, style: { padding: '8px 16px', fontSize: '13px' }, children: "Sign Out" })] })] }), _jsx("main", { style: { flex: 1 }, children: children }), _jsx("footer", { style: { padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }, children: "\u00A9 2026 QiAll Me. All rights reserved." })] }));
}
