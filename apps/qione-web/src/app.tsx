import React from "react";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";
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

// 1. Create a wrapper for your protected routes
const ProtectedLayout = () => {
    return (
        <RequireAuth>
            <Layout>
                {/* Outlet renders the nested child route */}
                <Outlet />
            </Layout>
        </RequireAuth>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />

                {/* Protected Routes using the wrapper */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<TenantSelect />} />

                    {/* Tenant Routes */}
                    <Route path="/t/:tenantId" element={<TenantHome />} />
                    <Route path="/t/:tenantId/launcher" element={<Launcher />} />
                    <Route path="/t/:tenantId/settings" element={<TenantSettings />} />
                    <Route path="/t/:tenantId/admin/modules" element={<AdminModules />} />

                    {/* Module Routes */}
                    <Route path="/m/*" element={<ModuleRouter />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
