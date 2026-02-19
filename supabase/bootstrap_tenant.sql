do $$
declare
  -- 1. YOUR REAL USER ID (Copy from Authentication > Users)
  v_user_id   uuid := 'ad7845bb-b444-4976-9add-10b2bf666c30'; 
  
  v_tenant_id uuid;
begin
  -- Create the Tenant (Using 'home' as valid type)
  insert into qione.tenants (name, type, created_by)
  values ('CODY RICE-VELASQUEZ', 'home', v_user_id)
  returning id into v_tenant_id;

  -- 1) Create 'Owner' role
  insert into qione.roles (tenant_id, name, rank)
  values (v_tenant_id, 'Owner', 1);

  -- 2) Add you as member (active)
  insert into qione.tenant_members (tenant_id, user_id, status, display_name)
  values (v_tenant_id, v_user_id, 'active', 'Admin');

  -- 3) Assign Owner role to you
  insert into qione.member_roles (tenant_id, user_id, role_id)
  select v_tenant_id, v_user_id, id from qione.roles 
  where tenant_id = v_tenant_id and name = 'Owner';

  -- 4) Enable modules for tenant
  insert into qione.tenant_modules (tenant_id, module_key, is_enabled)
  values 
    (v_tenant_id, 'qione_admin', true),
    (v_tenant_id, 'qihome', true);

  -- 5) Grant Owner admin access to modules
  insert into qione.module_role_access (tenant_id, module_key, role_id, access)
  select v_tenant_id, m.key, r.id, 'admin'
  from qione.modules m
  join qione.roles r on r.tenant_id = v_tenant_id and r.name = 'Owner';

  raise notice 'SUCCESS! Tenant created and bootstrapped.';
  raise notice 'Tenant ID: %', v_tenant_id;
end $$;