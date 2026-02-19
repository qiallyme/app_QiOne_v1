import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getSession();
            setSignedIn(!!data.session);
            setReady(true);
        })();

        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
            setSignedIn(!!session);
            setReady(true);
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    if (!ready) return <div style={{ padding: 16 }}>Loading…</div>;
    if (!signedIn) return <Navigate to="/auth" replace />;
    return <>{children}</>;
}
