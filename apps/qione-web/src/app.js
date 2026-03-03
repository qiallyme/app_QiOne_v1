import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/require_auth";
import Layout from "./components/layout";
import AuthPage from "./routes/auth";
import AuthConfirm from "./routes/auth_confirm";
import TenantSelect from "./routes/tenant_select";
import TenantHome from "./routes/tenant_home";
import Launcher from "./routes/launcher";
import TenantSettings from "./routes/tenant_settings";
import ModuleRouter from "./routes/module_router";
import AdminModules from "./routes/admin_modules";
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/auth", element: _jsx(AuthPage, {}) }), _jsx(Route, { path: "/auth/confirm", element: _jsx(AuthConfirm, {}) }), _jsx(Route, { path: "/", element: _jsx(RequireAuth, { children: _jsx(Layout, { children: _jsx(TenantSelect, {}) }) }) }), _jsx(Route, { path: "/t/:tenantId", element: _jsx(RequireAuth, { children: _jsx(Layout, { children: _jsx(TenantHome, {}) }) }) }), _jsx(Route, { path: "/t/:tenantId/launcher", element: _jsx(RequireAuth, { children: _jsx(Layout, { children: _jsx(Launcher, {}) }) }) }), _jsx(Route, { path: "/t/:tenantId/settings", element: _jsx(RequireAuth, { children: _jsx(Layout, { children: _jsx(TenantSettings, {}) }) }) }), _jsx(Route, { path: "/t/:tenantId/admin/modules", element: _jsx(RequireAuth, { children: _jsx(Layout, { children: _jsx(AdminModules, {}) }) }) }), _jsx(Route, { path: "/m/*", element: _jsx(RequireAuth, { children: _jsx(Layout, { children: _jsx(ModuleRouter, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
