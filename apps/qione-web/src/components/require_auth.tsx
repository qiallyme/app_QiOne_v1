import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
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
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="module-icon" style={{ margin: '0 auto 20px', width: '60px', height: '60px', borderRadius: '20px' }}>⚡</div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Initializing QiOne...</p>
                </div>
            </div>
        );
    }

    if (!signedIn) return <Navigate to="/auth" replace />;
    return <>{children}</>;
}
