import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { tenantId } = useParams();
    const nav = useNavigate();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserEmail(data.user?.email ?? null);
        });
    }, []);

    async function handleSignOut() {
        await supabase.auth.signOut();
        window.location.href = "/auth"; // Force a full reload to clear any stale state
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header className="glass-card" style={{
                margin: '20px',
                padding: '12px 24px',
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <h1 className="gradient-text" style={{ margin: 0, fontSize: '1.5rem' }}>QiOne</h1>
                    </Link>
                    {tenantId && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                            <Link to={`/t/${tenantId}/launcher`} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Launcher</Link>
                            <Link to={`/m/qihome/${tenantId}/dashboard`} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>QiHome</Link>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {userEmail && (
                        <div style={{ textAlign: 'right', display: 'none' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Signed in as</div>
                            <div style={{ fontSize: '14px', fontWeight: 500 }}>{userEmail}</div>
                        </div>
                    )}
                    <div className="status-badge" style={{ background: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)', borderColor: 'rgba(0, 230, 118, 0.2)' }}>
                        Live
                    </div>
                    <button className="secondary" onClick={handleSignOut} style={{ padding: '8px 16px', fontSize: '13px' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            <main style={{ flex: 1 }}>
                {children}
            </main>

            <footer style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                &copy; 2026 QiAll Me. All rights reserved.
            </footer>
        </div>
    );
}
