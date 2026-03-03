import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Route, Routes, useParams, useNavigate } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Ledger from "./pages/ledger";
import Chores from "./pages/chores";
export default function QiHome() {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const path = window.location.pathname;
    const isActive = (p) => path.includes(p) ? 'active' : '';
    return (_jsxs("div", { className: "container", style: { paddingTop: '20px' }, children: [_jsxs("div", { className: "nav-bar", style: { marginBottom: '20px', justifyContent: 'flex-start' }, children: [_jsx("h2", { style: { marginBottom: 0 }, children: "QiHome" }), _jsx("button", { className: "secondary", style: { marginLeft: 'auto' }, onClick: () => nav(`/t/${tenantId}/launcher`), children: "Back to Launcher" })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginBottom: '32px', padding: '4px', background: 'var(--surface-color)', borderRadius: '16px', width: 'fit-content' }, children: [_jsx(Link, { to: `/m/qihome/${tenantId}/dashboard`, style: { textDecoration: 'none' }, children: _jsx("button", { className: path.includes('dashboard') ? '' : 'secondary', style: { padding: '8px 20px', borderRadius: '12px' }, children: "Dashboard" }) }), _jsx(Link, { to: `/m/qihome/${tenantId}/ledger`, style: { textDecoration: 'none' }, children: _jsx("button", { className: path.includes('ledger') ? '' : 'secondary', style: { padding: '8px 20px', borderRadius: '12px' }, children: "Ledger" }) }), _jsx(Link, { to: `/m/qihome/${tenantId}/chores`, style: { textDecoration: 'none' }, children: _jsx("button", { className: path.includes('chores') ? '' : 'secondary', style: { padding: '8px 20px', borderRadius: '12px' }, children: "Chores" }) })] }), _jsx("div", { className: "glass-card fade-in", style: { padding: '40px' }, children: _jsxs(Routes, { children: [_jsx(Route, { path: ":tenantId/dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: ":tenantId/ledger", element: _jsx(Ledger, {}) }), _jsx(Route, { path: ":tenantId/chores", element: _jsx(Chores, {}) })] }) })] }));
}
