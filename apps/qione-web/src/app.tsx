import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/require_auth";
import AuthPage from "./routes/auth";
import TenantSelect from "./routes/tenant_select";
import TenantHome from "./routes/tenant_home";
import Launcher from "./routes/launcher";
import ModuleRouter from "./routes/module_router";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/auth" element={<AuthPage />} />

                <Route
                    path="/"
                    element={
                        <RequireAuth>
                            <TenantSelect />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/t/:tenantId"
                    element={
                        <RequireAuth>
                            <TenantHome />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/t/:tenantId/launcher"
                    element={
                        <RequireAuth>
                            <Launcher />
                        </RequireAuth>
                    }
                />

                {/* Module routes */}
                <Route
                    path="/m/*"
                    element={
                        <RequireAuth>
                            <ModuleRouter />
                        </RequireAuth>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
