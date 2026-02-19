import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
    // We'll allow these to be missing during build but log error
    console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anon || 'placeholder', {
    auth: { persistSession: true, autoRefreshToken: true },
});
