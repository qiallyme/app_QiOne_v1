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
        "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
        "access-control-allow-headers": "content-type,authorization",
        "access-control-allow-credentials": "true",
        vary: "origin",
    } as HeadersInit;
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
    const { data, error } = await sb.rpc("has_module_access", {
        p_tenant: tenantId,
        p_module: "qione_admin",
        p_user: userId,
        p_min: "admin",
    });
    if (error) throw new Error(error.message);
    if (data !== true) throw new Error("Not authorized (admin required).");
}

async function assertTenantMember(sb: SupabaseClient, tenantId: string, userId: string) {
    const { data, error } = await sb.rpc("is_tenant_member", { p_tenant: tenantId, p_user: userId });
    if (error) throw new Error(error.message);
    if (data !== true) throw new Error("Not authorized (member required).");
}

async function ensureRole(sb: SupabaseClient, tenantId: string, name: string, rank = 50) {
    const { data, error } = await sb
        .from("roles")
        .upsert({ tenant_id: tenantId, name, rank }, { onConflict: "tenant_id,name" })
        .select("id")
        .single();
    if (error) throw new Error(error.message);
    return data.id as string;
}

async function addMember(
    sb: SupabaseClient,
    tenantId: string,
    userId: string,
    displayName?: string | null,
    status: "active" | "invited" | "disabled" = "active"
) {
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
    const { data, error } = await sb
        .from("roles")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("name", name)
        .single();
    if (error) throw new Error(`Role not found: ${name}`);
    return data.id as string;
}

async function enableModules(sb: SupabaseClient, tenantId: string, moduleKeys: string[], enabled: boolean) {
    const rows = moduleKeys.map((k) => ({
        tenant_id: tenantId,
        module_key: k,
        is_enabled: enabled,
        settings: {},
    }));
    const { error } = await sb.from("tenant_modules").upsert(rows, { onConflict: "tenant_id,module_key" });
    if (error) throw new Error(error.message);
}

async function setRoleAccess(
    sb: SupabaseClient,
    tenantId: string,
    moduleKey: string,
    roleId: string,
    access: "none" | "read" | "write" | "admin"
) {
    const { error } = await sb.from("module_role_access").upsert(
        { tenant_id: tenantId, module_key: moduleKey, role_id: roleId, access },
        { onConflict: "tenant_id,module_key,role_id" }
    );
    if (error) throw new Error(error.message);
}

export default {
    async fetch(req: Request, env: Env): Promise<Response> {
        const cors = corsHeaders(req);
        if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

        try {
            const url = new URL(req.url);
            const path = url.pathname;

            if (path === "/health") return json({ ok: true }, 200, cors);

            const token = getBearer(req);
            if (!token) return json({ error: "Missing Authorization: Bearer <access_token>" }, 401, cors);

            const caller = await getCallerUser(env, token);
            if (!caller?.id) return json({ error: "Invalid/expired token" }, 401, cors);

            const sb = sbService(env);

            // --------------------
            // POST /api/bootstrap
            // --------------------
            if (path === "/api/bootstrap" && req.method === "POST") {
                requireJson(req);
                const body = (await req.json()) as { name?: string; type?: "home" | "business" | "client" };

                const name = (body.name ?? "Home").trim();
                const type = body.type ?? "home";
                if (!name) return json({ error: "name required" }, 400, cors);

                const { data: t, error: e1 } = await sb
                    .from("tenants")
                    .insert({ name, type, created_by: caller.id })
                    .select("id")
                    .single();
                if (e1) throw new Error(e1.message);

                const tenantId = t.id as string;

                // Create default roles
                const ownerRoleId = await ensureRole(sb, tenantId, "Owner", 1);
                const memberRoleId = await ensureRole(sb, tenantId, "Member", 50);
                const viewerRoleId = await ensureRole(sb, tenantId, "Viewer", 90);

                // Add caller as active + Owner role
                await addMember(sb, tenantId, caller.id, "Owner", "active");
                await assignRole(sb, tenantId, caller.id, ownerRoleId);

                // Enable core modules by default
                await enableModules(sb, tenantId, ["qione_admin", "qihome"], true);

                // Role access defaults:
                // Owner admin on admin + qihome
                await setRoleAccess(sb, tenantId, "qione_admin", ownerRoleId, "admin");
                await setRoleAccess(sb, tenantId, "qihome", ownerRoleId, "admin");

                // Member: no admin panel, but write qihome
                await setRoleAccess(sb, tenantId, "qione_admin", memberRoleId, "none");
                await setRoleAccess(sb, tenantId, "qihome", memberRoleId, "write");

                // Viewer: read-only qihome
                await setRoleAccess(sb, tenantId, "qione_admin", viewerRoleId, "none");
                await setRoleAccess(sb, tenantId, "qihome", viewerRoleId, "read");

                return json({ tenant_id: tenantId }, 200, cors);
            }

            // --------------------
            // GET /api/tenants/:tenantId/members
            // --------------------
            const membersMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/members$/);
            if (membersMatch && req.method === "GET") {
                const tenantId = membersMatch[1];
                await assertTenantAdmin(sb, tenantId, caller.id);

                const { data: mem, error } = await sb
                    .from("tenant_members")
                    .select("tenant_id,user_id,status,display_name,joined_at")
                    .eq("tenant_id", tenantId)
                    .order("joined_at", { ascending: true });

                if (error) throw new Error(error.message);

                // Enrich with email using admin API
                const enriched = await Promise.all(
                    (mem ?? []).map(async (m) => {
                        const { data: u } = await sb.auth.admin.getUserById(m.user_id);
                        return { ...m, email: u.user?.email ?? null };
                    })
                );

                return json({ members: enriched }, 200, cors);
            }

            // --------------------
            // POST /api/tenants/:tenantId/invite
            // --------------------
            const inviteMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/invite$/);
            if (inviteMatch && req.method === "POST") {
                requireJson(req);
                const tenantId = inviteMatch[1];
                await assertTenantAdmin(sb, tenantId, caller.id);

                const body = (await req.json()) as {
                    email?: string;
                    display_name?: string;
                    role_name?: string;
                };

                const email = (body.email ?? "").trim().toLowerCase();
                if (!email) return json({ error: "email required" }, 400, cors);

                const redirectTo = env.SUPABASE_REDIRECT_TO || undefined;
                const { data: invited, error: invErr } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo });
                if (invErr) throw new Error(invErr.message);

                const invitedUserId = invited.user?.id;
                if (!invitedUserId) throw new Error("Invite created but user id missing.");

                await addMember(sb, tenantId, invitedUserId, body.display_name ?? null, "invited");

                if (body.role_name && body.role_name.trim()) {
                    const roleId = await findRoleIdByName(sb, tenantId, body.role_name.trim());
                    await assignRole(sb, tenantId, invitedUserId, roleId);
                }

                return json({ ok: true, invited_user_id: invitedUserId, email, status: "invited" }, 200, cors);
            }

            // --------------------
            // POST /api/tenants/:tenantId/accept
            // --------------------
            const acceptMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/accept$/);
            if (acceptMatch && req.method === "POST") {
                requireJson(req);
                const tenantId = acceptMatch[1];

                const { data: row, error } = await sb
                    .from("tenant_members")
                    .select("status")
                    .eq("tenant_id", tenantId)
                    .eq("user_id", caller.id)
                    .maybeSingle();
                if (error) throw new Error(error.message);
                if (!row) throw new Error("No invite found for this tenant.");

                const body = (await req.json()) as { display_name?: string };

                if (row.status === "invited") {
                    const { error: upErr } = await sb
                        .from("tenant_members")
                        .update({
                            status: "active",
                            display_name: body.display_name ?? null,
                        })
                        .eq("tenant_id", tenantId)
                        .eq("user_id", caller.id);
                    if (upErr) throw new Error(upErr.message);
                }

                return json({ ok: true, status: "active" }, 200, cors);
            }

            // --------------------
            // GET /api/tenants/:tenantId/modules
            // --------------------
            const modListMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/modules$/);
            if (modListMatch && req.method === "GET") {
                const tenantId = modListMatch[1];
                await assertTenantMember(sb, tenantId, caller.id);

                const { data, error } = await sb
                    .from("tenant_modules")
                    .select("module_key,is_enabled,settings,modules(name,description,route,icon,is_active)")
                    .eq("tenant_id", tenantId);

                if (error) throw new Error(error.message);

                return json({ tenant_modules: data ?? [] }, 200, cors);
            }

            // --------------------
            // PATCH /api/tenants/:tenantId/modules
            // --------------------
            const modPatchMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/modules$/);
            if (modPatchMatch && req.method === "PATCH") {
                requireJson(req);
                const tenantId = modPatchMatch[1];
                await assertTenantAdmin(sb, tenantId, caller.id);

                const body = (await req.json()) as { module_key?: string; is_enabled?: boolean };
                if (!body.module_key) throw new Error("module_key required");
                if (typeof body.is_enabled !== "boolean") throw new Error("is_enabled required");

                await enableModules(sb, tenantId, [body.module_key], body.is_enabled);
                return json({ ok: true }, 200, cors);
            }

            // --------------------
            // GET /api/tenants/:tenantId/roles
            // --------------------
            const rolesListMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/roles$/);
            if (rolesListMatch && req.method === "GET") {
                const tenantId = rolesListMatch[1];
                await assertTenantAdmin(sb, tenantId, caller.id);

                const { data: roles, error: rErr } = await sb
                    .from("roles")
                    .select("id,name,rank")
                    .eq("tenant_id", tenantId)
                    .order("rank", { ascending: true });

                if (rErr) throw new Error(rErr.message);

                const { data: access, error: aErr } = await sb
                    .from("module_role_access")
                    .select("module_key,role_id,access")
                    .eq("tenant_id", tenantId);

                if (aErr) throw new Error(aErr.message);

                return json({ roles: roles ?? [], access: access ?? [] }, 200, cors);
            }

            // --------------------
            // POST /api/tenants/:tenantId/roles
            // --------------------
            const roleCreateMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/roles$/);
            if (roleCreateMatch && req.method === "POST") {
                requireJson(req);
                const tenantId = roleCreateMatch[1];
                await assertTenantAdmin(sb, tenantId, caller.id);

                const body = (await req.json()) as { name?: string; rank?: number };
                const name = (body.name ?? "").trim();
                if (!name) throw new Error("role name required");

                const roleId = await ensureRole(sb, tenantId, name, body.rank ?? 50);
                return json({ ok: true, role_id: roleId }, 200, cors);
            }

            // --------------------
            // POST /api/tenants/:tenantId/access
            // --------------------
            const accessSetMatch = path.match(/^\/api\/tenants\/([0-9a-fA-F-]{36})\/access$/);
            if (accessSetMatch && req.method === "POST") {
                requireJson(req);
                const tenantId = accessSetMatch[1];
                await assertTenantAdmin(sb, tenantId, caller.id);

                const body = (await req.json()) as {
                    role_id?: string;
                    module_key?: string;
                    access?: "none" | "read" | "write" | "admin";
                };

                if (!body.role_id) throw new Error("role_id required");
                if (!body.module_key) throw new Error("module_key required");
                if (!body.access) throw new Error("access required");

                await setRoleAccess(sb, tenantId, body.module_key, body.role_id, body.access);
                return json({ ok: true }, 200, cors);
            }

            return json({ error: "Not found" }, 404, cors);
        } catch (e: any) {
            return json({ error: e?.message ?? "Server error" }, 500, corsHeaders(req));
        }
    },
};
