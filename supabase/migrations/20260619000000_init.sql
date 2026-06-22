-- 上傳批次紀錄表
create table if not exists upload_records (
  id          bigint generated always as identity primary key,
  filename    text        not null,
  stat_at     timestamptz not null unique,  -- 從檔名解析出的統計時間，unique 防止重複上傳
  description text,
  row_count   int         not null default 0,
  uploaded_at timestamptz not null default now()
);

-- 成員資料表
create table if not exists members (
  id                  bigint generated always as identity primary key,
  upload_id           bigint      not null references upload_records(id) on delete cascade,
  name                text        not null,
  contribution_rank   int,
  contribution_weekly bigint      not null default 0,
  battle_weekly       int         not null default 0,
  assist_weekly       int         not null default 0,
  donate_weekly       int         not null default 0,
  contribution_total  bigint      not null default 0,
  battle_total        int         not null default 0,
  assist_total        int         not null default 0,
  donate_total        int         not null default 0,
  power               int         not null default 0,
  state               text,
  group_name          text
);

create index if not exists members_upload_id_idx on members(upload_id);
create index if not exists members_name_idx on members(name);

-- RLS：開放 anon 角色讀寫（前端使用 publishable key 屬於 anon）
alter table upload_records enable row level security;
alter table members enable row level security;

create policy "anon can read upload_records"
  on upload_records for select to anon using (true);

create policy "anon can insert upload_records"
  on upload_records for insert to anon with check (true);

CREATE POLICY "anon can update upload_records"
  ON upload_records FOR UPDATE to anon USING (true) WITH CHECK (true);

create policy "anon can read members"
  on members for select to anon using (true);

create policy "anon can insert members"
  on members for insert to anon with check (true);

create policy "anon can delete members"
  on members for delete to anon using (true);

create policy "anon can delete upload_records"
  on upload_records for delete to anon using (true);

-- 系統設定表
create table if not exists system_settings (
  id    bigint generated always as identity primary key,
  code  text not null unique,
  label text not null,
  value text
);

alter table system_settings enable row level security;

create policy "anon can read system_settings"
  on system_settings for select to anon using (true);

create policy "anon can insert system_settings"
  on system_settings for insert to anon with check (true);

create policy "anon can update system_settings"
  on system_settings for update to anon using (true) with check (true);

insert into system_settings (code, label, value) values
  ('ALLIANCE_NAME',   '同盟名称',   ''),
  ('ALLOW_REGISTER',  '开放注册',   'true'),
  ('EMAIL_DOMAIN',    '邮箱后缀',   'yosheng.tw');


-- 清除联盟数据 RPC
create or replace function clear_alliance_data()
returns void
language plpgsql
security definer
as $$
begin
  truncate table members, upload_records restart identity cascade;
end;
$$;

-- 使用者擴充資料表
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade not null primary key,
  role         text not null default 'USER',
  display_name text,
  created_at   timestamptz default now(),
  constraint profiles_role_check check (role in ('ADMIN', 'USER'))
);

alter table public.profiles enable row level security;

-- 宽松策略：anon 和已登入用户均可读取全部 profiles（后期收紧）
create policy "anyone can read profiles"
  on profiles for select using (true);

create policy "anyone can update profiles"
  on profiles for update using (true) with check (true);

-- 自动为新注册用户建立 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'USER', '未命名使用者');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
