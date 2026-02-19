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
    const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "API error");
    return j;
}

export async function apiPost(path: string, body: unknown) {
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
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "API error");
    return j;
}
