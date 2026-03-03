import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function AuthConfirm() {
    const [searchParams] = useSearchParams();
    const nav = useNavigate();
    const [err, setErr] = useState(null);
    useEffect(() => {
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
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
            }
            else {
                // Success! Go home.
                nav("/", { replace: true });
            }
        })();
    }, [searchParams, nav]);
    return (_jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-color)' }, children: _jsxs("div", { className: "glass-card fade-in", style: { textAlign: 'center', maxWidth: 400 }, children: [_jsx("div", { className: "module-icon", style: { margin: '0 auto 20px', width: '60px', height: '60px', borderRadius: '20px' }, children: err ? "❌" : "🔗" }), err ? (_jsxs(_Fragment, { children: [_jsx("h2", { style: { color: 'var(--error)' }, children: "Authentication Failed" }), _jsx("p", { style: { color: 'var(--text-secondary)', marginTop: '12px' }, children: err }), _jsx("button", { className: "secondary", style: { marginTop: '24px' }, onClick: () => nav("/auth"), children: "Try signing in again" })] })) : (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Confirming..." }), _jsx("p", { style: { color: 'var(--text-secondary)', marginTop: '12px' }, children: "Please wait while we verify your magic link." })] }))] }) }));
}
