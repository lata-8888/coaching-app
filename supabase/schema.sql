-- =====================================================================
-- Coaching-App: Datenbank-Schema für Supabase (DEV)
-- Im Supabase-Dashboard unter «SQL Editor» einfügen und mit «Run» ausführen.
-- Das Skript ist idempotent: es kann erneut ausgeführt werden, Daten bleiben erhalten.
-- Danach den ersten Admin setzen (siehe README):
--   update public.profiles set role = 'admin' where phone = '+41…';
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Einstellungen (nur über Funktionen zugänglich) ----------
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
-- absichtlich keine Policy: niemand kann die Tabelle direkt lesen

-- Zugangscode für neue Konten. Ohne passenden Code lehnt die Datenbank jede Registrierung ab.
-- Vor dem ersten Einsatz ändern:  update public.app_settings set value = '…' where key = 'club_code';
insert into public.app_settings (key, value) values ('club_code', 'CHANGE-ME')
  on conflict (key) do nothing;

-- ---------- Profile ----------
-- Rollen: admin (verwaltet Personen), mentor, assistent, talent (Standard für neue Konten)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null check (length(trim(first_name)) > 0),
  last_name   text not null check (length(trim(last_name)) > 0),
  name        text generated always as (trim(first_name) || ' ' || trim(last_name)) stored,
  gender      text not null check (gender in ('m', 'w', 'x')),   -- männlich / weiblich / divers
  avatar      text check (avatar is null or (avatar like 'data:image/jpeg;base64,%' and length(avatar) <= 120000)),  -- Profilbild (klein, im Browser verkleinert)
  traits      text check (traits is null or length(traits) <= 2000),   -- Eigenschaften (Freitext)
  phone       text not null unique,                 -- Login-Name (zusammen mit dem PIN)
  email       text not null check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),  -- Kontakt-Adresse, nicht für den Login
  role        text not null default 'talent' check (role in ('admin', 'mentor', 'assistent', 'talent')),
  language    text check (language is null or language in ('de', 'en', 'fr', 'it')),
  theme       text check (theme is null or theme in ('light', 'dark')),   -- null = automatisch
  pin_changed boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Upgrade einer älteren Version (Spalte «name» als freier Text) auf Vorname/Nachname/E-Mail
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'profiles'
                and column_name = 'name' and is_generated = 'NEVER') then
    alter table public.profiles
      add column if not exists first_name text,
      add column if not exists last_name  text,
      add column if not exists email      text;
    update public.profiles set
      first_name = coalesce(first_name, nullif(split_part(name, ' ', 1), ''), 'Unbekannt'),
      last_name  = coalesce(last_name, nullif(trim(substr(name, length(split_part(name, ' ', 1)) + 1)), ''), '-'),
      email      = coalesce(email, 'bitte-ergaenzen@example.invalid');
    alter table public.profiles drop column name;
    alter table public.profiles
      alter column first_name set not null,
      alter column last_name  set not null,
      alter column email      set not null,
      add constraint profiles_first_name_chk check (length(trim(first_name)) > 0),
      add constraint profiles_last_name_chk  check (length(trim(last_name)) > 0),
      add constraint profiles_email_chk check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
      add column name text generated always as (trim(first_name) || ' ' || trim(last_name)) stored;
  end if;
end $$;

-- Upgrade: Geschlecht und Profilbild nachrüsten (ältere Versionen)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'gender') then
    alter table public.profiles add column gender text;
    update public.profiles set gender = 'x';
    alter table public.profiles
      alter column gender set not null,
      add constraint profiles_gender_chk check (gender in ('m', 'w', 'x'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar') then
    alter table public.profiles add column avatar text;
    alter table public.profiles
      add constraint profiles_avatar_chk check (avatar is null or (avatar like 'data:image/jpeg;base64,%' and length(avatar) <= 120000));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'traits') then
    alter table public.profiles add column traits text;
    alter table public.profiles add constraint profiles_traits_chk check (traits is null or length(traits) <= 2000);
  end if;
end $$;

-- Rolle «assistent» ergänzen (ältere Versionen kennen nur admin, mentor, talent)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'mentor', 'assistent', 'talent'));

-- ---------- Chat (Gespräch zwischen Bot und Talent) ----------
-- sender: 'bot' oder 'user'.
-- kind steuert den Gesprächsablauf: Bot-Nachrichten sind greet, q1, q2, q3, offer oder done;
-- bei Nutzer-Nachrichten ist kind leer (freier Text) oder 'chip' (Schnellantwort angetippt).
-- chips: Schnellantworten, die der Bot mit dieser Nachricht anbietet (kommagetrennte Schlüssel).
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  sender     text not null check (sender in ('bot', 'user')),
  body       text not null check (length(body) between 1 and 4000),
  kind       text check (kind is null or kind in ('greet', 'q1', 'q2', 'q3', 'offer', 'done', 'chip')),
  topic      text check (topic is null or topic in ('goal', 'decision', 'blocked', 'meeting', 'other')),
  chips      text check (chips is null or length(chips) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_user_created on public.chat_messages (user_id, created_at);

-- ---------- Notes (Gedanken und Notizen mit Zeitstempel und automatischem Titel) ----------
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  title_manual boolean not null default false,   -- true = Titel wurde von Hand geändert
  body         text not null check (length(body) between 1 and 10000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists notes_user_created on public.notes (user_id, created_at desc);

-- ---------- Prep (Checkliste / Agenda zur Vorbereitung eines Meetings) ----------
-- source_type/source_id verweisen auf die Herkunft (Chat-Nachricht oder Notiz); bewusst ohne
-- Fremdschlüssel, damit ein Punkt erhalten bleibt, wenn die Quelle gelöscht wird.
create table if not exists public.prep_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  text        text not null check (length(text) between 1 and 1000),
  done        boolean not null default false,
  sort        integer not null default 0,
  source_type text check (source_type is null or source_type in ('chat', 'note')),
  source_id   uuid,
  created_at  timestamptz not null default now()
);
create index if not exists prep_items_user_sort on public.prep_items (user_id, sort);

-- ---------- Hilfsfunktionen ----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Rolle setzen (nur Admins). Die eigene Rolle kann nicht entzogen werden,
-- damit immer mindestens ein Admin bleibt.
create or replace function public.set_role(target uuid, new_role text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen Rollen vergeben';
  end if;
  if new_role not in ('admin', 'mentor', 'assistent', 'talent') then
    raise exception 'Ungültige Rolle';
  end if;
  if target = auth.uid() and new_role <> 'admin' then
    raise exception 'Du kannst dir die Admin-Rolle nicht selbst entziehen';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

-- PIN einer Person auf den Standard zurücksetzen (letzte 6 Ziffern der Handynummer)
create or replace function public.reset_pin(target uuid)
returns void
language plpgsql security definer set search_path = public, extensions, auth
as $$
declare
  ph text;
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen PINs zurücksetzen';
  end if;
  select phone into ph from public.profiles where id = target;
  if ph is null then
    raise exception 'Person nicht gefunden';
  end if;
  update auth.users
     set encrypted_password = crypt(right(regexp_replace(ph, '\D', '', 'g'), 6), gen_salt('bf'))
   where id = target;
  update public.profiles set pin_changed = false where id = target;
end;
$$;

-- Zugangscode auslesen (nur Admins; wird beim Hinzufügen von Personen benötigt)
create or replace function public.get_club_code()
returns text
language plpgsql stable security definer set search_path = public
as $$
declare
  code text;
begin
  if not public.is_admin() then
    raise exception 'Nur Admins';
  end if;
  select value into code from public.app_settings where key = 'club_code';
  return coalesce(code, '');
end;
$$;

-- Person samt Konto und allen Daten entfernen (nur Admins)
create or replace function public.remove_member(target uuid)
returns void
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen Personen entfernen';
  end if;
  if target = auth.uid() then
    raise exception 'Du kannst dich nicht selbst entfernen';
  end if;
  delete from auth.users where id = target;  -- löscht über «on delete cascade» auch Profil und Inhalte
end;
$$;

-- Eigene Handynummer ändern. Die Anmeldung wechselt auf die neue Nummer, der PIN bleibt gleich.
create or replace function public.update_own_phone(new_phone text)
returns void
language plpgsql security definer set search_path = public, extensions, auth
as $$
declare
  old_email text;
  new_email text;
  digits    text;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;
  if coalesce(new_phone, '') !~ '^\+[0-9]{9,15}$' then
    raise exception 'Ungültige Handynummer';
  end if;
  if exists (select 1 from public.profiles where phone = new_phone and id <> auth.uid()) then
    raise exception 'PHONE_TAKEN';
  end if;
  select email into old_email from auth.users where id = auth.uid();
  digits := regexp_replace(new_phone, '\D', '', 'g');
  new_email := digits || '@' || split_part(old_email, '@', 2);
  update auth.users
     set email = new_email,
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('phone', new_phone)
   where id = auth.uid();
  update auth.identities
     set identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object('email', new_email)
   where user_id = auth.uid() and provider = 'email';
  update public.profiles set phone = new_phone where id = auth.uid();
end;
$$;

-- Profilbild setzen oder entfernen (null): die Person selbst oder ein Admin für beliebige Personen.
create or replace function public.set_avatar(target uuid, new_avatar text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or (target <> auth.uid() and not public.is_admin()) then
    raise exception 'Keine Berechtigung';
  end if;
  update public.profiles set avatar = new_avatar where id = target;   -- Format/Grösse prüft die Tabelle
end;
$$;
-- Eigenschaften (Freitext) setzen: die Person selbst oder ein Admin für beliebige Personen.
create or replace function public.set_traits(target uuid, new_traits text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or (target <> auth.uid() and not public.is_admin()) then
    raise exception 'Keine Berechtigung';
  end if;
  update public.profiles set traits = nullif(trim(new_traits), '') where id = target;
end;
$$;
revoke execute on function public.set_traits(uuid, text) from public, anon;
grant  execute on function public.set_traits(uuid, text) to authenticated;

-- Stammdaten einer Person ändern (nur Admins): Vorname, Nachname, Geschlecht, E-Mail, Eigenschaften.
-- Handynummer und Rolle bleiben bei update_own_phone bzw. set_role.
create or replace function public.admin_update_person(target uuid, p_first text, p_last text, p_gender text, p_email text, p_traits text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nur Admins';
  end if;
  update public.profiles
     set first_name = trim(p_first), last_name = trim(p_last), gender = p_gender,
         email = trim(p_email), traits = nullif(trim(p_traits), '')
   where id = target;   -- Formate prüfen die Tabellen-Constraints
  if not found then
    raise exception 'Person nicht gefunden';
  end if;
end;
$$;
revoke execute on function public.admin_update_person(uuid, text, text, text, text, text) from public, anon;
grant  execute on function public.admin_update_person(uuid, text, text, text, text, text) to authenticated;

revoke execute on function public.set_avatar(uuid, text) from public, anon;
grant  execute on function public.set_avatar(uuid, text) to authenticated;

revoke execute on function public.set_role(uuid, text)         from public, anon;
revoke execute on function public.reset_pin(uuid)              from public, anon;
revoke execute on function public.get_club_code()              from public, anon;
revoke execute on function public.remove_member(uuid)          from public, anon;
revoke execute on function public.update_own_phone(text)       from public, anon;
grant  execute on function public.set_role(uuid, text)         to authenticated;
grant  execute on function public.reset_pin(uuid)              to authenticated;
grant  execute on function public.get_club_code()              to authenticated;
grant  execute on function public.remove_member(uuid)          to authenticated;
grant  execute on function public.update_own_phone(text)       to authenticated;
-- is_admin wird von den RLS-Regeln gebraucht (nur angemeldet); Trigger-Funktionen sind nie direkt aufrufbar.
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- ---------- Registrierung: Zugangscode prüfen, Profil anlegen ----------
-- Neue Konten erhalten immer die Rolle «talent». Die Rolle wird nie aus den Angaben des
-- Clients übernommen; nur ein Admin kann sie ändern (set_role).
create or replace function public.check_club_code()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  code text;
begin
  select value into code from public.app_settings where key = 'club_code';
  if code is null or code = '' or coalesce(new.raw_user_meta_data->>'club_code', '') <> code then
    raise exception 'Ungültiger Zugangscode';
  end if;
  return new;
end;
$$;

drop trigger if exists before_user_created on auth.users;
create trigger before_user_created
  before insert on auth.users
  for each row execute function public.check_club_code();

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  fn text := trim(coalesce(new.raw_user_meta_data->>'first_name', ''));
  ln text := trim(coalesce(new.raw_user_meta_data->>'last_name', ''));
  em text := trim(coalesce(new.raw_user_meta_data->>'email', ''));
  gd text := coalesce(new.raw_user_meta_data->>'gender', '');
begin
  if fn = '' or ln = '' or em = '' or gd not in ('m', 'w', 'x') then
    raise exception 'Vorname, Nachname, E-Mail und Geschlecht sind Pflicht';
  end if;
  insert into public.profiles (id, first_name, last_name, gender, phone, email, language)
  values (
    new.id, fn, ln, gd,
    coalesce(new.raw_user_meta_data->>'phone', new.email),
    em,
    case when new.raw_user_meta_data->>'language' in ('de', 'en', 'fr', 'it')
         then new.raw_user_meta_data->>'language' else null end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.check_club_code() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- Zugriffsregeln (Row Level Security) ----------
alter table public.profiles      enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notes         enable row level security;
alter table public.prep_items    enable row level security;

-- Profile: Admins sehen alle (Personenverwaltung), alle anderen nur das eigene.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Ändern darf jede Person nur Vorname, Nachname, Geschlecht, E-Mail, Sprache, Darstellung und pin_changed des eigenen Profils.
-- Rolle, Handynummer, Profilbild und Eigenschaften laufen ausschliesslich über die Funktionen set_role / update_own_phone / set_avatar / set_traits.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant  update (first_name, last_name, gender, email, language, pin_changed, theme) on public.profiles to authenticated;

-- Chat, Notizen, Prep: streng privat. Jede Person sieht und ändert nur die eigenen Einträge.
do $$
declare
  t text;
begin
  foreach t in array array['chat_messages', 'notes', 'prep_items'] loop
    execute format('drop policy if exists "%1$s_own" on public.%1$s', t);
    execute format(
      'create policy "%1$s_own" on public.%1$s for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t);
  end loop;
end $$;

-- ---------- Live-Aktualisierung (Realtime) ----------
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'chat_messages', 'notes', 'prep_items'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null; -- Tabelle ist bereits enthalten
    end;
  end loop;
end $$;
