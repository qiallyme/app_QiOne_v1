import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
export default function AuthPage() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [err, setErr] = useState(null);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    async function signIn() {
        if (!email)
            return;
        setLoading(true);
        setErr(null);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        });
        setLoading(false);
        if (error)
            setErr(error.message);
        else
            setSent(true);
    }
    return (_jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }, children: _jsxs("div", { className: "glass-card fade-in", style: { width: '100%', maxWidth: 440, textAlign: 'center' }, children: [_jsx("h1", { className: "gradient-text", style: { fontSize: '3rem', marginBottom: '0.5rem' }, children: "QiOne" }), _jsx("p", { style: { color: 'var(--text-secondary)', marginBottom: '2rem' }, children: "Welcome back. Enter your email to receive a magic sign-in link." }), err && (_jsx("div", { style: { background: 'rgba(255, 82, 82, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }, children: err })), sent ? (_jsxs("div", { className: "fade-in", children: [_jsx("div", { style: { fontSize: '4rem', marginBottom: '1rem' }, children: "\u2709\uFE0F" }), _jsx("h2", { style: { marginBottom: '0.5rem' }, children: "Check your email" }), _jsxs("p", { style: { color: 'var(--text-secondary)' }, children: ["We've sent a magic link to ", _jsx("strong", { children: email }), "."] }), _jsx("button", { className: "secondary", style: { marginTop: '2rem' }, onClick: () => setSent(false), children: "Try another email" })] })) : (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { textAlign: 'left' }, children: [_jsx("label", { style: { fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', marginLeft: '4px' }, children: "Email Address" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "name@company.com" })] }), _jsx("button", { disabled: loading, onClick: signIn, children: loading ? "Sending..." : "Send Magic Link" }), _jsx("p", { style: { fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1rem' }, children: "No password required. Secure and stateless." })] }))] }) }));
}
