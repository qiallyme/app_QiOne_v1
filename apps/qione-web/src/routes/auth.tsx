import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function signIn() {
        if (!email) return;
        setLoading(true);
        setErr(null);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        });
        setLoading(false);
        if (error) setErr(error.message);
        else setSent(true);
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
            <div className="glass-card fade-in" style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>QiOne</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Welcome back. Enter your email to receive a magic sign-in link.
                </p>

                {err && (
                    <div style={{ background: 'rgba(255, 82, 82, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
                        {err}
                    </div>
                )}

                {sent ? (
                    <div className="fade-in">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✉️</div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Check your email</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            We've sent a magic link to <strong>{email}</strong>.
                        </p>
                        <button className="secondary" style={{ marginTop: '2rem' }} onClick={() => setSent(false)}>
                            Try another email
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                            />
                        </div>
                        <button disabled={loading} onClick={signIn}>
                            {loading ? "Sending..." : "Send Magic Link"}
                        </button>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                            No password required. Secure and stateless.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
