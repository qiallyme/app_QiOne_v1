import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import QiHome from "../modules/qihome";

export default function ModuleRouter() {
    return (
        <Routes>
            <Route path="/qihome/*" element={<QiHome />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
