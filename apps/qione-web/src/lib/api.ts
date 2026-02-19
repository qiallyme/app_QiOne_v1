import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function apiPost(path: string, body: unknown) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not signed in.");

    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    const j = await res.json();
    if (!res.ok) throw new Error(j?.error ?? "API error");
    return j;
}
