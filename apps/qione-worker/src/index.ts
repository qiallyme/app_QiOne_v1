import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Env = {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string; // secret
    SUPABASE_REDIRECT_TO?: string;
};

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            ...extraHeaders,
        },
    });
}

function corsHeaders(req: Request) {
    const origin = req.headers.get("origin") ?? "*";
    return {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type,authorization",
        "access-control-allow-credentials": "true",
        "vary": "origin",
    };
}

function requireJson(req: Request) {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error("Expected application/json");
}

function getBearer(req: Request): string | null {
    const h = req.headers.get("authorization");
    if (!h) return null;
    const m = /^Bearer\s+(.+)$/i.exec(h);
    return m?.[1] ?? null;
}

/**
 * Validate the caller's Supabase access token by calling Supabase Auth "get user".
 * This avoids JWT verification in Worker (no JWT secret needed).
 */
async function getCallerUser(env: Env, accessToken: string) {
    const url = `${env.SUPABASE_URL}/auth/v1/user`;
    const res = await fetch(url, {
        headers: {
            apikey: env.SUPABASE_ANON_KEY,
            authorization: `Bearer ${accessToken}`,
        },
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string; email?: string };
}

function sbService(env: Env): SupabaseClient {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'qione' }
    });
}

async function assertTenantAdmin(sb: SupabaseClient, tenantId: string, userId: string) {
    // Must have admin access on qione_admin for this tenant
    const { data, error } = await sb.rpc("has_module_access", {
        p_tenant: tenantId,
        p_module: "qione_admin",
        p_user: userId,
        p_min: "admin",
    });
    if (error) throw new Error(error.message);
    if (data !== true) throw new Error("Not authorized (admin required).");
}

async function ensureOwnerRole(sb: SupabaseClient, tenantId: string) {
    // idempotent create
    const { data: roleRow, error } = await sb
        .from("roles")
        .upsert({ tenant_id: tenantId, name: "Owner", rank: 1 }, { onConflict: "tenant_id,name" })
        .select("id")
        .single();
    if (error) throw new Error(error.message);
    return roleRow.id as string;
}

async function enableCoreModules(sb: SupabaseClient, tenantId: string) {
    const { error } = await sb.from("tenant_modules").upsert(
        [
            { tenant_id: tenantId, module_key: "qione_admin", is_enabled: true, settings: {} },
            { tenant_id: tenantId, module_key: "qihome", is_enabled: true, settings: {} },
        ],
        { onConflict: "tenant_id,module_key" }
    );
    if (error) throw new Error(error.message);
}

async function grantRoleAdminForCore(sb: SupabaseClient, tenantId: string, roleId: string) {
    const { error } = await sb.from("module_role_access").upsert(
        [
            { tenant_id: tenantId, module_key: "qione_admin", role_id: roleId, access: "admin" },
            { tenant_id: tenantId, module_key: "qihome", role_id: roleId, access: "admin" },
        ],
        { onConflict: "tenant_id,module_key,role_id" }
    );
    if (error) throw new Error(error.message);
}

async function addMember(sb: SupabaseClient, tenantId: string, userId: string, displayName?: string, status: "active" | "invited" | "disabled" = "active") {
    const { error } = await sb.from("tenant_members").upsert(
        { tenant_id: tenantId, user_id: userId, status, display_name: displayName ?? null },
        { onConflict: "tenant_id,user_id" }
    );
    if (error) throw new Error(error.message);
}

async function assignRole(sb: SupabaseClient, tenantId: string, userId: string, roleId: string) {
    const { error } = await sb.from("member_roles").upsert(
        { tenant_id: tenantId, user_id: userId, role_id: roleId },
        { onConflict: "tenant_id,user_id,role_id" }
    );
    if (error) throw new Error(error.message);
}

async function findRoleIdByName(sb: SupabaseClient, tenantId: string, name: string) {
    const { data, error } = await sb.from("roles").select("id").eq("tenant_id", tenantId).eq("name", name).single();
    if (error) throw new Error(`Role not found: ${name}`);
    return data.id as string;
}

export default {
    async fetch(req: Request, env: Env): Promise<Response> {
        const cors = corsHeaders(req);
        if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

        try {
            const url = new URL(req.url);
            const path = url.pathname;

            // Require caller auth for everything except health
            if (path === "/health") return json({ ok: true }, 200, cors);

            const token = getBearer(req);
            if (!token) return json({ error: "Missing Authorization: Bearer <access_token>" }, 401, cors);

            const caller = await getCallerUser(env, token);
            if (!caller?.id) return json({ error: "Invalid/expired token" }, 401, cors);

            const sb = sbService(env);

            // --------
            // POST /api/bootstrap
            // body: { name, type } -> returns { tenant_id }
            // Creates tenant + makes caller Owner + enables core modules + grants admin access
            // --------
            if (path === "/api/bootstrap" && req.method === "POST") {
                requireJson(req);
                const body = (await req.json()) as { name?: string; type?: "home" | "business" | "client" };

                const name = (body.name ?? "Home").trim();
                const type = body.type ?? "home";

                if (!name) return json({ error: "name required" }, 400, cors);

                // 1) create tenant
                const { data: t, error: e1 } = await sb
                    .from("tenants")
                    .insert({ name, type, created_by: caller.id })
                    .select("id")
                    .single();
                if (e1) throw new Error(e1.message);

                const tenantId = t.id as string;

                // 2) member active
                await addMember(sb, tenantId, caller.id, "Owner", "active");

                // 3) owner role
                const ownerRoleId = await ensureOwnerRole(sb, tenantId);

                // 4) assign owner role
                await assignRole(sb, tenantId, caller.id, ownerRoleId);

                // 5) enable core modules
                await enableCoreModules(sb, tenantId);

                // 6) grant Owner admin on core modules
                await grantRoleAdminForCore(sb, tenantId, ownerRoleId);

                return json({ tenant_id: tenantId }, 200, cors);
            }

            // --------
            // POST /api/tenants/:tenantId/invite
            // body: { email, display_name?, role_name?, module_keys? }
            //
            // Invites user via Supabase Auth Admin invite
            // Adds (invited) membership + assigns role (optional) + enables modules (optional)
            // Requires caller to be qione_admin admin in that tenant.
            // --------
            const inviteMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/invite$/);
            if (inviteMatch && req.method === "POST") {
                requireJson(req);
                const tenantId = inviteMatch[1];

                await assertTenantAdmin(sb, tenantId, caller.id);

                const body = (await req.json()) as {
                    email?: string;
                    display_name?: string;
                    role_name?: string; // e.g. "Member", "Caregiver", "Viewer"
                    module_keys?: string[]; // optional enable for tenant
                };

                const email = (body.email ?? "").trim().toLowerCase();
                if (!email) return json({ error: "email required" }, 400, cors);

                // invite via Supabase Admin API
                const redirectTo = env.SUPABASE_REDIRECT_TO || undefined;
                const { data: invited, error: invErr } = await sb.auth.admin.inviteUserByEmail(email, {
                    redirectTo,
                });
                if (invErr) throw new Error(invErr.message);

                const invitedUserId = invited.user?.id;
                if (!invitedUserId) throw new Error("Invite created but user id missing.");

                // Add membership as invited
                await addMember(sb, tenantId, invitedUserId, body.display_name ?? null, "invited");

                // Optional: enable modules for tenant (if you want the invite to turn on QiHome, etc.)
                if (Array.isArray(body.module_keys) && body.module_keys.length) {
                    const rows = body.module_keys.map((k) => ({
                        tenant_id: tenantId,
                        module_key: k,
                        is_enabled: true,
                        settings: {},
                    }));
                    const { error } = await sb.from("tenant_modules").upsert(rows, { onConflict: "tenant_id,module_key" });
                    if (error) throw new Error(error.message);
                }

                // Optional: role assignment
                if (body.role_name && body.role_name.trim()) {
                    const roleId = await findRoleIdByName(sb, tenantId, body.role_name.trim());
                    await assignRole(sb, tenantId, invitedUserId, roleId);
                }

                return json(
                    {
                        ok: true,
                        invited_user_id: invitedUserId,
                        email,
                        status: "invited",
                    },
                    200,
                    cors
                );
            }

            return json({ error: "Not found" }, 404, cors);
        } catch (e: any) {
            return json({ error: e?.message ?? "Server error" }, 500, corsHeaders(req));
        }
    },
};
