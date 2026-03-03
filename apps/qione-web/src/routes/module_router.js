import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from "react-router-dom";
import QiHome from "../modules/qihome";
export default function ModuleRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/qihome/*", element: _jsx(QiHome, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
