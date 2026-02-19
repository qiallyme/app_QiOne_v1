import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/require_auth";
import Layout from "./components/layout";
import AuthPage from "./routes/auth";
import AuthConfirm from "./routes/auth_confirm";
import TenantSelect from "./routes/tenant_select";
import TenantHome from "./routes/tenant_home";
import Launcher from "./routes/launcher";
import ModuleRouter from "./routes/module_router";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />

                <Route
                    path="/"
                    element={
                        <RequireAuth>
                            <Layout>
                                <TenantSelect />
                            </Layout>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/t/:tenantId"
                    element={
                        <RequireAuth>
                            <Layout>
                                <TenantHome />
                            </Layout>
                        </RequireAuth>
                    }
                />

                <Route
                    path="/t/:tenantId/launcher"
                    element={
                        <RequireAuth>
                            <Layout>
                                <Launcher />
                            </Layout>
                        </RequireAuth>
                    }
                />

                {/* Module routes */}
                <Route
                    path="/m/*"
                    element={
                        <RequireAuth>
                            <Layout>
                                <ModuleRouter />
                            </Layout>
                        </RequireAuth>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
