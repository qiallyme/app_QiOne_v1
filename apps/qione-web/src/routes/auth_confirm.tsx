import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthConfirm() {
    const [searchParams] = useSearchParams();
    const nav = useNavigate();
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type") as any;

        if (!tokenHash || !type) {
            setErr("Invalid confirmation link.");
            return;
        }

        (async () => {
            const { error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type,
            });

            if (error) {
                setErr(error.message);
            } else {
                // Success! Go home.
                nav("/", { replace: true });
            }
        })();
    }, [searchParams, nav]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
            <div className="glass-card fade-in" style={{ textAlign: 'center', maxWidth: 400 }}>
                <div className="module-icon" style={{ margin: '0 auto 20px', width: '60px', height: '60px', borderRadius: '20px' }}>
                    {err ? "❌" : "🔗"}
                </div>

                {err ? (
                    <>
                        <h2 style={{ color: 'var(--error)' }}>Authentication Failed</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>{err}</p>
                        <button className="secondary" style={{ marginTop: '24px' }} onClick={() => nav("/auth")}>
                            Try signing in again
                        </button>
                    </>
                ) : (
                    <>
                        <h2>Confirming...</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Please wait while we verify your magic link.</p>
                    </>
                )}
            </div>
        </div>
    );
}
