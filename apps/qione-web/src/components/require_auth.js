import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate } from "react-router-dom";
export default function RequireAuth({ children }) {
    const [ready, setReady] = useState(false);
    const [signedIn, setSignedIn] = useState(false);
    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Check if the user has an active tenant already
                const { data: profile } = await supabase
                    .from("users")
                    .select("active_tenant_id")
                    .eq("id", session.user.id)
                    .single();
                setSignedIn(true);
                // If they are on the root path and have a tenant, jump to it
                if (window.location.pathname === "/" && profile?.active_tenant_id) {
                    window.location.href = `/t/${profile.active_tenant_id}/launcher`;
                }
            }
            setReady(true);
        })();
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
            setSignedIn(!!session);
            setReady(true);
        });
        return () => sub.subscription.unsubscribe();
    }, []);
    if (!ready) {
        return (_jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)' }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { className: "module-icon", style: { margin: '0 auto 20px', width: '60px', height: '60px', borderRadius: '20px' }, children: "\u26A1" }), _jsx("p", { style: { color: 'var(--text-secondary)', fontWeight: 500 }, children: "Initializing QiOne..." })] }) }));
    }
    if (!signedIn)
        return _jsx(Navigate, { to: "/auth", replace: true });
    return _jsx(_Fragment, { children: children });
}
