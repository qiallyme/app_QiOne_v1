import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE;

async function authHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not signed in.");
    return {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
    };
}

export async function apiGet(path: string) {
    if (!API_BASE) {
        console.error("VITE_API_BASE is not defined. Ensure it is set in your environment variables.");
        throw new Error("API configuration missing.");
    }
    const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "API error");
    return j;
}

export async function apiPost(path: string, body: unknown) {
    if (!API_BASE) {
        console.error("VITE_API_BASE is not defined.");
        throw new Error("API configuration missing.");
    }
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "API error");
    return j;
}

export async function apiPatch(path: string, body: unknown) {
    if (!API_BASE) {
        console.error("VITE_API_BASE is not defined.");
        throw new Error("API configuration missing.");
    }
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "API error");
    return j;
}
