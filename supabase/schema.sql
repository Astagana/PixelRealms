-- Jalankan seluruh file ini di Supabase > SQL Editor > New query > Run

-- ===== profil / akun =====
create table public.profiles(
  id uuid primary key references auth.users on delete cascade,
  username text not null,
  look jsonb not null default '{}',
  gems int not null default 50 check (gems >= 0),
  inv jsonb not null default '{"2":10,"30":5}',
  created_at timestamptz default now()
);
create unique index profiles_username_key on public.profiles (lower(username));
alter table public.profiles enable row level security;
create policy "read own" on public.profiles for select using (auth.uid() = id);
create policy "update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- profil dibuat otomatis saat register; username unik (tanpa beda huruf besar/kecil)
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'username','') !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'bad username'; end if;
  insert into public.profiles(id, username) values (new.id, new.raw_user_meta_data->>'username');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 1 akun = 1 username, tidak bisa diganti
create function public.prevent_rename() returns trigger language plpgsql as $$
begin
  if new.username <> old.username then raise exception 'username cannot be changed'; end if;
  return new;
end $$;
create trigger no_rename before update on public.profiles for each row execute function public.prevent_rename();

-- ===== world =====
create table public.worlds(
  name text primary key check (name ~ '^[A-Z0-9]{1,16}$'),
  owner uuid references auth.users on delete set null,
  owner_name text,
  locked boolean not null default false,
  data text not null,
  updated_at timestamptz default now()
);
alter table public.worlds enable row level security;
create policy "read worlds" on public.worlds for select to authenticated using (true);
-- tidak ada policy insert/update/delete: semua perubahan lewat fungsi di bawah

create function public.save_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_name = 'START' then raise exception 'START is protected'; end if;
  if length(p_data) > 400000 then raise exception 'world too big'; end if;
  select * into w from public.worlds where name = p_name for update;
  if found and w.locked and w.owner is distinct from auth.uid() then raise exception 'world is locked'; end if;
  insert into public.worlds(name, data) values (p_name, p_data)
    on conflict (name) do update set data = excluded.data, updated_at = now();
end $$;

-- Gold Lock: pemain harus punya item (id 40) di inventori
create function public.claim_world(p_name text, p_data text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds; u text; n int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_name = 'START' then raise exception 'START cannot be locked'; end if;
  select username, coalesce((inv->>'40')::int, 0) into u, n from public.profiles where id = auth.uid();
  if n < 1 then raise exception 'you need a Gold Lock'; end if;
  select * into w from public.worlds where name = p_name for update;
  if found and w.locked then raise exception 'world is already locked'; end if;
  insert into public.worlds(name, owner, owner_name, locked, data) values (p_name, auth.uid(), u, true, p_data)
    on conflict (name) do update set owner = auth.uid(), owner_name = u, locked = true, data = excluded.data, updated_at = now();
end $$;

create function public.unlock_world(p_name text) returns void language plpgsql security definer set search_path = public as $$
declare w public.worlds;
begin
  select * into w from public.worlds where name = p_name for update;
  if not found or w.owner is distinct from auth.uid() then raise exception 'not your world'; end if;
  update public.worlds set locked = false, owner = null, owner_name = null where name = p_name;
end $$;

-- ===== roulette (hasil diundi di server) =====
create function public.spin_roulette(p_kind text, p_num int, p_amount int) returns json language plpgsql security definer set search_path = public as $$
declare g int; r int; mult int := 0; delta int;
  reds int[] := array[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_amount < 1 or p_amount > 1000 then raise exception 'bet must be 1-1000'; end if;
  select gems into g from public.profiles where id = auth.uid() for update;
  if g < p_amount then raise exception 'not enough gems'; end if;
  r := floor(random() * 37)::int;
  if    p_kind = 'red'   and r > 0 and r = any(reds)         then mult := 1;
  elsif p_kind = 'black' and r > 0 and not r = any(reds)     then mult := 1;
  elsif p_kind = 'odd'   and r > 0 and r % 2 = 1             then mult := 1;
  elsif p_kind = 'even'  and r > 0 and r % 2 = 0             then mult := 1;
  elsif p_kind = 'low'   and r between 1 and 18              then mult := 1;
  elsif p_kind = 'high'  and r between 19 and 36             then mult := 1;
  elsif p_kind = 'd1'    and r between 1 and 12              then mult := 2;
  elsif p_kind = 'd2'    and r between 13 and 24             then mult := 2;
  elsif p_kind = 'd3'    and r between 25 and 36             then mult := 2;
  elsif p_kind = 'num'   and p_num between 0 and 36 and r = p_num then mult := 35;
  elsif p_kind not in ('red','black','odd','even','low','high','d1','d2','d3','num') then raise exception 'bad bet';
  end if;
  delta := case when mult > 0 then p_amount * mult else -p_amount end;
  update public.profiles set gems = gems + delta where id = auth.uid();
  return json_build_object('r', r, 'delta', delta, 'gems', g + delta);
end $$;

-- hanya user login yang boleh memanggil fungsi
revoke execute on function public.save_world, public.claim_world, public.unlock_world, public.spin_roulette from public, anon;
grant  execute on function public.save_world, public.claim_world, public.unlock_world, public.spin_roulette to authenticated;
