import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    async function signIn() {
        setErr(null);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        });
        if (error) setErr(error.message);
        else setSent(true);
    }

    async function signOut() {
        await supabase.auth.signOut();
        nav("/auth");
    }

    return (
        <div style={{ padding: 16, maxWidth: 520 }}>
            <h2>QiOne</h2>
            <p>Sign in with email link.</p>
            {err && <p style={{ color: "crimson" }}>{err}</p>}
            {sent ? (
                <p>Check your email for the sign-in link.</p>
            ) : (
                <div style={{ display: "flex", gap: 8 }}>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                    <button onClick={signIn}>Send Link</button>
                </div>
            )}
            <div style={{ marginTop: 12 }}>
                <button onClick={signOut}>Sign out</button>
            </div>
        </div>
    );
}
