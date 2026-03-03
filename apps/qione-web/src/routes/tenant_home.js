import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
export default function TenantHome() {
    const { tenantId } = useParams();
    return (_jsxs("div", { style: { padding: 16 }, children: [_jsx("h2", { children: "Tenant" }), _jsxs("p", { children: ["tenantId: ", _jsx("code", { children: tenantId })] }), _jsxs("div", { style: { display: "flex", gap: 12 }, children: [_jsx(Link, { to: `/t/${tenantId}/launcher`, children: "Open Launcher" }), _jsx(Link, { to: `/m/qihome/${tenantId}/dashboard`, children: "QiHome" })] })] }));
}
