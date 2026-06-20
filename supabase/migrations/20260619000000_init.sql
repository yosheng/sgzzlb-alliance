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

create policy "anon can read members"
  on members for select to anon using (true);

create policy "anon can insert members"
  on members for insert to anon with check (true);

create policy "anon can delete members"
  on members for delete to anon using (true);

create policy "anon can delete upload_records"
  on upload_records for delete to anon using (true);
