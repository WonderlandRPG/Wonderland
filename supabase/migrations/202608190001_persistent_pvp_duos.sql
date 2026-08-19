-- Wonderland · PvP persistent duos
-- Two real players form a persistent party and queue together against another real duo.

alter table public.v2_pvp_queue
  add column if not exists secondary_user_id uuid;

alter table public.v2_pvp_matches
  add column if not exists player_one_secondary_user_id uuid,
  add column if not exists player_two_secondary_user_id uuid;

create table if not exists public.v2_pvp_parties (
  id uuid primary key default gen_random_uuid(),
  rank text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.v2_pvp_party_members (
  party_id uuid not null references public.v2_pvp_parties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  slot smallint not null check (slot in (1,2)),
  joined_at timestamptz not null default now(),
  primary key (party_id, slot),
  unique (user_id),
  unique (character_id)
);

create table if not exists public.v2_pvp_party_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  inviter_character_id uuid not null references public.v2_characters(id) on delete cascade,
  invitee_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_character_id uuid not null references public.v2_characters(id) on delete cascade,
  rank text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  responded_at timestamptz,
  check (inviter_user_id <> invitee_user_id)
);

create index if not exists v2_pvp_party_invites_invitee_pending_idx
  on public.v2_pvp_party_invites(invitee_user_id, created_at desc)
  where status='pending';
create index if not exists v2_pvp_party_invites_inviter_pending_idx
  on public.v2_pvp_party_invites(inviter_user_id, created_at desc)
  where status='pending';
create index if not exists v2_pvp_queue_secondary_user_idx
  on public.v2_pvp_queue(secondary_user_id, status, joined_at);

alter table public.v2_pvp_parties enable row level security;
alter table public.v2_pvp_party_members enable row level security;
alter table public.v2_pvp_party_invites enable row level security;

revoke all on public.v2_pvp_parties from public, anon, authenticated;
revoke all on public.v2_pvp_party_members from public, anon, authenticated;
revoke all on public.v2_pvp_party_invites from public, anon, authenticated;

create or replace function public.v2_pvp_character_card(p_character_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select case when c.id is null then null else jsonb_build_object(
    'id',c.id,
    'name',c.name,
    'level',c.level,
    'rank',c.adventure_rank,
    'imageUrl',c.image_url
  ) end
  from (select 1) seed
  left join public.v2_characters c on c.id=p_character_id;
$$;

create or replace function public.v2_pvp_queue_payload(p_entry public.v2_pvp_queue)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_partner uuid;
begin
  if v_user is null then
    raise exception 'Autenticação necessária' using errcode='42501';
  end if;
  if v_user not in (p_entry.user_id, p_entry.secondary_user_id) then
    raise exception 'Fila não encontrada' using errcode='42501';
  end if;

  v_partner := case
    when p_entry.format='duo' and p_entry.user_id=v_user then p_entry.secondary_character_id
    when p_entry.format='duo' and p_entry.secondary_user_id=v_user then p_entry.character_id
    else null
  end;

  return jsonb_build_object(
    'status',p_entry.status,
    'queueId',p_entry.id,
    'matchId',p_entry.match_id,
    'rank',p_entry.rank,
    'format',p_entry.format,
    'secondaryCharacter',public.v2_pvp_character_card(v_partner),
    'opponent',public.v2_pvp_character_card(p_entry.opponent_character_id),
    'opponentSecondary',public.v2_pvp_character_card(p_entry.opponent_secondary_character_id)
  );
end;
$$;

create or replace function public.v2_search_pvp_partner(p_character_id uuid, p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_character public.v2_characters;
  v_query text := trim(coalesce(p_query,''));
  v_result jsonb;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into v_character from public.v2_characters where id=p_character_id and user_id=v_user;
  if v_character.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  if length(v_query) < 2 then return '[]'::jsonb; end if;

  select coalesce(jsonb_agg(public.v2_pvp_character_card(c.id) order by c.name, c.level desc),'[]'::jsonb)
  into v_result
  from (
    select c.id,c.name,c.level
    from public.v2_characters c
    where c.user_id<>v_user
      and c.adventure_rank=v_character.adventure_rank
      and c.name ilike '%'||v_query||'%'
      and not exists (
        select 1 from public.v2_pvp_party_members pm where pm.user_id=c.user_id
      )
    order by c.name,c.level desc
    limit 12
  ) c;

  return coalesce(v_result,'[]'::jsonb);
end;
$$;

create or replace function public.v2_get_pvp_party_state(p_character_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_character public.v2_characters;
  v_party public.v2_pvp_parties;
  v_own_member public.v2_pvp_party_members;
  v_partner_member public.v2_pvp_party_members;
  v_incoming jsonb;
  v_outgoing jsonb;
  v_queue public.v2_pvp_queue;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into v_character from public.v2_characters where id=p_character_id and user_id=v_user;
  if v_character.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;

  update public.v2_pvp_party_invites
    set status='expired',responded_at=now()
    where status='pending' and expires_at<=now()
      and (inviter_user_id=v_user or invitee_user_id=v_user);

  select pm.* into v_own_member
  from public.v2_pvp_party_members pm
  where pm.user_id=v_user
  limit 1;

  if v_own_member.party_id is not null then
    select * into v_party from public.v2_pvp_parties where id=v_own_member.party_id;
    select * into v_partner_member
    from public.v2_pvp_party_members
    where party_id=v_own_member.party_id and user_id<>v_user
    limit 1;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,
    'createdAt',i.created_at,
    'expiresAt',i.expires_at,
    'character',public.v2_pvp_character_card(i.inviter_character_id)
  ) order by i.created_at desc),'[]'::jsonb)
  into v_incoming
  from public.v2_pvp_party_invites i
  where i.invitee_user_id=v_user and i.status='pending' and i.expires_at>now();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,
    'createdAt',i.created_at,
    'expiresAt',i.expires_at,
    'character',public.v2_pvp_character_card(i.invitee_character_id)
  ) order by i.created_at desc),'[]'::jsonb)
  into v_outgoing
  from public.v2_pvp_party_invites i
  where i.inviter_user_id=v_user and i.status='pending' and i.expires_at>now();

  if v_own_member.party_id is not null then
    select * into v_queue
    from public.v2_pvp_queue q
    where q.format='duo'
      and q.status in ('searching','matched')
      and (q.user_id=v_user or q.secondary_user_id=v_user)
    order by q.joined_at desc
    limit 1;
  end if;

  return jsonb_build_object(
    'party',case when v_party.id is null then null else jsonb_build_object(
      'id',v_party.id,
      'rank',v_party.rank,
      'createdAt',v_party.created_at,
      'ownCharacter',public.v2_pvp_character_card(v_own_member.character_id),
      'partner',public.v2_pvp_character_card(v_partner_member.character_id)
    ) end,
    'incoming',coalesce(v_incoming,'[]'::jsonb),
    'outgoing',coalesce(v_outgoing,'[]'::jsonb),
    'queue',case when v_queue.id is null then null else public.v2_pvp_queue_payload(v_queue) end
  );
end;
$$;

create or replace function public.v2_invite_pvp_partner(p_character_id uuid, p_target_character_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_character public.v2_characters;
  v_target public.v2_characters;
  v_invite public.v2_pvp_party_invites;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into v_character from public.v2_characters where id=p_character_id and user_id=v_user;
  select * into v_target from public.v2_characters where id=p_target_character_id;
  if v_character.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  if v_target.id is null or v_target.user_id=v_user then raise exception 'Parceiro inválido' using errcode='22023'; end if;
  if v_target.adventure_rank<>v_character.adventure_rank then raise exception 'A dupla precisa estar no mesmo Rank' using errcode='P0001'; end if;

  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-party-'||least(v_user::text,v_target.user_id::text)||'-'||greatest(v_user::text,v_target.user_id::text)));

  if exists(select 1 from public.v2_pvp_party_members where user_id in (v_user,v_target.user_id)) then
    raise exception 'Um dos jogadores já está em uma dupla' using errcode='P0001';
  end if;

  update public.v2_pvp_party_invites
    set status='cancelled',responded_at=now()
    where inviter_user_id=v_user and invitee_user_id=v_target.user_id and status='pending';

  insert into public.v2_pvp_party_invites(
    inviter_user_id,inviter_character_id,invitee_user_id,invitee_character_id,rank
  ) values(
    v_user,v_character.id,v_target.user_id,v_target.id,v_character.adventure_rank
  ) returning * into v_invite;

  return jsonb_build_object(
    'id',v_invite.id,
    'status',v_invite.status,
    'character',public.v2_pvp_character_card(v_target.id)
  );
end;
$$;

create or replace function public.v2_cancel_pvp_party_invite(p_invite_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  update public.v2_pvp_party_invites
    set status='cancelled',responded_at=now()
    where id=p_invite_id and inviter_user_id=v_user and status='pending';
  return found;
end;
$$;

create or replace function public.v2_respond_pvp_party_invite(p_invite_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_invite public.v2_pvp_party_invites;
  v_inviter public.v2_characters;
  v_invitee public.v2_characters;
  v_party public.v2_pvp_parties;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;

  select * into v_invite
  from public.v2_pvp_party_invites
  where id=p_invite_id
  for update;

  if v_invite.id is null or v_invite.invitee_user_id<>v_user then
    raise exception 'Convite não encontrado' using errcode='42501';
  end if;
  if v_invite.status<>'pending' then raise exception 'Este convite não está mais disponível' using errcode='P0001'; end if;
  if v_invite.expires_at<=now() then
    update public.v2_pvp_party_invites set status='expired',responded_at=now() where id=v_invite.id;
    raise exception 'Este convite expirou' using errcode='P0001';
  end if;

  if not p_accept then
    update public.v2_pvp_party_invites set status='declined',responded_at=now() where id=v_invite.id;
    return jsonb_build_object('accepted',false);
  end if;

  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-party-'||least(v_invite.inviter_user_id::text,v_invite.invitee_user_id::text)||'-'||greatest(v_invite.inviter_user_id::text,v_invite.invitee_user_id::text)));

  if exists(select 1 from public.v2_pvp_party_members where user_id in (v_invite.inviter_user_id,v_invite.invitee_user_id)) then
    raise exception 'Um dos jogadores já está em uma dupla' using errcode='P0001';
  end if;

  select * into v_inviter from public.v2_characters where id=v_invite.inviter_character_id and user_id=v_invite.inviter_user_id;
  select * into v_invitee from public.v2_characters where id=v_invite.invitee_character_id and user_id=v_invite.invitee_user_id;
  if v_inviter.id is null or v_invitee.id is null then raise exception 'Um dos personagens não está mais disponível' using errcode='P0001'; end if;
  if v_inviter.adventure_rank<>v_invitee.adventure_rank then raise exception 'Os personagens não estão mais no mesmo Rank' using errcode='P0001'; end if;

  insert into public.v2_pvp_parties(rank) values(v_inviter.adventure_rank) returning * into v_party;
  insert into public.v2_pvp_party_members(party_id,user_id,character_id,slot) values
    (v_party.id,v_invite.inviter_user_id,v_inviter.id,1),
    (v_party.id,v_invite.invitee_user_id,v_invitee.id,2);

  update public.v2_pvp_party_invites set status='accepted',responded_at=now() where id=v_invite.id;
  update public.v2_pvp_party_invites
    set status='cancelled',responded_at=now()
    where status='pending' and id<>v_invite.id
      and (
        inviter_user_id in (v_invite.inviter_user_id,v_invite.invitee_user_id)
        or invitee_user_id in (v_invite.inviter_user_id,v_invite.invitee_user_id)
      );

  return jsonb_build_object(
    'accepted',true,
    'partyId',v_party.id,
    'partner',public.v2_pvp_character_card(v_inviter.id)
  );
end;
$$;

create or replace function public.v2_disband_pvp_party(p_party_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_users uuid[];
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select array_agg(user_id) into v_users from public.v2_pvp_party_members where party_id=p_party_id;
  if v_users is null or not (v_user=any(v_users)) then raise exception 'Dupla não encontrada' using errcode='42501'; end if;

  update public.v2_pvp_queue
    set status='cancelled'
    where format='duo' and status='searching'
      and (user_id=any(v_users) or secondary_user_id=any(v_users));

  delete from public.v2_pvp_parties where id=p_party_id;
  return true;
end;
$$;

create or replace function public.v2_join_pvp_queue_v2(p_character_id uuid, p_format text default 'solo')
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  chosen public.v2_characters;
  partner public.v2_characters;
  partner_user uuid;
  party_id uuid;
  opponent public.v2_pvp_queue;
  own_queue public.v2_pvp_queue;
  new_match uuid;
  normalized_format text := lower(coalesce(p_format,'solo'));
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if normalized_format not in ('solo','duo') then raise exception 'Formato PvP inválido' using errcode='22023'; end if;

  select * into chosen from public.v2_characters where id=p_character_id and user_id=v_user;
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;

  if normalized_format='duo' then
    select own.party_id, teammate.user_id, c.*
    into party_id, partner_user, partner
    from public.v2_pvp_party_members own
    join public.v2_pvp_party_members teammate on teammate.party_id=own.party_id and teammate.user_id<>own.user_id
    join public.v2_characters c on c.id=teammate.character_id
    where own.user_id=v_user and own.character_id=chosen.id
    limit 1;

    if party_id is null or partner.id is null then
      raise exception 'Forme uma dupla com outro jogador usando este personagem antes de buscar 2x2.' using errcode='P0001';
    end if;
    if partner.adventure_rank<>chosen.adventure_rank then
      raise exception 'Os dois personagens da dupla precisam estar no mesmo Rank.' using errcode='P0001';
    end if;
    if public.v2_character_has_active_mission(partner.id) then
      raise exception 'Seu parceiro está em missão e não pode entrar na Arena agora.' using errcode='P0001';
    end if;
    perform pg_advisory_xact_lock(hashtext('wonderland-pvp-party-'||party_id::text));
  end if;

  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-'||normalized_format||'-'||chosen.adventure_rank));
  update public.v2_pvp_queue set status='expired'
    where status='searching' and joined_at < now()-interval '15 minutes';

  if normalized_format='duo' then
    update public.v2_pvp_queue set status='cancelled'
      where status='searching' and (user_id in (v_user,partner_user) or secondary_user_id in (v_user,partner_user));
  else
    update public.v2_pvp_queue set status='cancelled' where user_id=v_user and status='searching';
  end if;

  select * into opponent from public.v2_pvp_queue
  where status='searching'
    and rank=chosen.adventure_rank
    and format=normalized_format
    and user_id<>v_user
    and (normalized_format='solo' or secondary_user_id is not null)
    and (
      normalized_format='solo'
      or (
        user_id not in (v_user,partner_user)
        and secondary_user_id not in (v_user,partner_user)
      )
    )
  order by joined_at limit 1 for update skip locked;

  if opponent.id is null then
    insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,rank,format)
    values(v_user,chosen.id,partner_user,partner.id,chosen.adventure_rank,normalized_format)
    returning * into own_queue;
    return public.v2_pvp_queue_payload(own_queue);
  end if;

  new_match := gen_random_uuid();
  update public.v2_pvp_queue set
    status='matched',opponent_character_id=chosen.id,
    opponent_secondary_character_id=partner.id,
    match_id=new_match,matched_at=now()
  where id=opponent.id;

  insert into public.v2_pvp_queue(
    user_id,character_id,secondary_user_id,secondary_character_id,rank,format,status,
    opponent_character_id,opponent_secondary_character_id,match_id,matched_at
  ) values(
    v_user,chosen.id,partner_user,partner.id,chosen.adventure_rank,normalized_format,'matched',
    opponent.character_id,opponent.secondary_character_id,new_match,now()
  ) returning * into own_queue;

  return public.v2_pvp_queue_payload(own_queue);
end;
$$;

create or replace function public.v2_poll_pvp_queue_v2(p_queue_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  entry public.v2_pvp_queue;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into entry from public.v2_pvp_queue
  where id=p_queue_id and (user_id=v_user or secondary_user_id=v_user);
  if entry.id is null then raise exception 'Fila não encontrada' using errcode='P0002'; end if;
  if entry.status='searching' and entry.joined_at < now()-interval '15 minutes' then
    update public.v2_pvp_queue set status='expired' where id=entry.id returning * into entry;
  end if;
  return public.v2_pvp_queue_payload(entry);
end;
$$;

create or replace function public.v2_cancel_pvp_queue(p_queue_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  update public.v2_pvp_queue set status='cancelled'
    where id=p_queue_id and status='searching' and (user_id=v_user or secondary_user_id=v_user);
end;
$$;

create or replace function public.v2_block_combat_during_mission()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if public.v2_character_has_active_mission(new.character_id) then
    raise exception 'Personagem em missão: Arena e Dungeons estão bloqueadas';
  end if;
  if new.secondary_character_id is not null and public.v2_character_has_active_mission(new.secondary_character_id) then
    raise exception 'Parceiro em missão: Arena está bloqueada para esta dupla';
  end if;
  return new;
end;
$$;

create or replace function public.v2_create_pvp_match_room()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare other_entry public.v2_pvp_queue;
begin
  if new.status <> 'matched' or new.match_id is null then return new; end if;
  select * into other_entry from public.v2_pvp_queue
  where match_id=new.match_id and status='matched' and id<>new.id order by matched_at limit 1;
  if other_entry.id is not null then
    insert into public.v2_pvp_matches(
      id,
      player_one_user_id,player_one_character_id,player_one_secondary_user_id,player_one_secondary_character_id,
      player_two_user_id,player_two_character_id,player_two_secondary_user_id,player_two_secondary_character_id,
      rank,format
    ) values(
      new.match_id,
      other_entry.user_id,other_entry.character_id,other_entry.secondary_user_id,other_entry.secondary_character_id,
      new.user_id,new.character_id,new.secondary_user_id,new.secondary_character_id,
      new.rank,new.format
    ) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.v2_pvp_room_payload(p_match public.v2_pvp_matches)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_team integer;
  v_own_character uuid;
  v_own_ids jsonb;
  v_enemy_ids jsonb;
  v_controllable jsonb := '[]'::jsonb;
begin
  if v_user in (p_match.player_one_user_id,p_match.player_one_secondary_user_id) then
    v_team := 1;
    v_own_ids := jsonb_build_array(p_match.player_one_character_id)
      || case when p_match.player_one_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_one_secondary_character_id) end;
    v_enemy_ids := jsonb_build_array(p_match.player_two_character_id)
      || case when p_match.player_two_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_two_secondary_character_id) end;
    if p_match.player_one_user_id=v_user then
      v_own_character := p_match.player_one_character_id;
      v_controllable := v_controllable || jsonb_build_array(p_match.player_one_character_id);
    end if;
    if p_match.player_one_secondary_user_id=v_user and p_match.player_one_secondary_character_id is not null then
      v_own_character := coalesce(v_own_character,p_match.player_one_secondary_character_id);
      v_controllable := v_controllable || jsonb_build_array(p_match.player_one_secondary_character_id);
    end if;
  elsif v_user in (p_match.player_two_user_id,p_match.player_two_secondary_user_id) then
    v_team := 2;
    v_own_ids := jsonb_build_array(p_match.player_two_character_id)
      || case when p_match.player_two_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_two_secondary_character_id) end;
    v_enemy_ids := jsonb_build_array(p_match.player_one_character_id)
      || case when p_match.player_one_secondary_character_id is null then '[]'::jsonb else jsonb_build_array(p_match.player_one_secondary_character_id) end;
    if p_match.player_two_user_id=v_user then
      v_own_character := p_match.player_two_character_id;
      v_controllable := v_controllable || jsonb_build_array(p_match.player_two_character_id);
    end if;
    if p_match.player_two_secondary_user_id=v_user and p_match.player_two_secondary_character_id is not null then
      v_own_character := coalesce(v_own_character,p_match.player_two_secondary_character_id);
      v_controllable := v_controllable || jsonb_build_array(p_match.player_two_secondary_character_id);
    end if;
  else
    raise exception 'Sala PvP não encontrada' using errcode='42501';
  end if;

  return jsonb_build_object(
    'matchId',p_match.id,
    'version',p_match.version,
    'format',p_match.format,
    'ownTeam',v_team,
    'ownCharacterId',v_own_character,
    'opponentCharacterId',case when v_team=1 then p_match.player_two_character_id else p_match.player_one_character_id end,
    'ownCharacterIds',v_own_ids,
    'opponentCharacterIds',v_enemy_ids,
    'controllableCharacterIds',v_controllable,
    'state',p_match.state,
    'status',p_match.status
  );
end;
$$;

create or replace function public.v2_get_pvp_match_state(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare room public.v2_pvp_matches; v_user uuid := (select auth.uid());
begin
  select * into room from public.v2_pvp_matches where id=p_match_id;
  if room.id is null or room.state is null or v_user not in (
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ) then raise exception 'Sala PvP não encontrada' using errcode='42501'; end if;
  return public.v2_pvp_room_payload(room);
end;
$$;

create or replace function public.v2_initialize_pvp_match(p_match_id uuid, p_state jsonb)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare room public.v2_pvp_matches; v_user uuid := (select auth.uid());
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or v_user not in (
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.state is null then
    if p_state is null or p_state->>'status'<>'active' or not (p_state ? 'fighters') or not (p_state ? 'turnOrder') then
      raise exception 'Estado inicial inválido' using errcode='22023';
    end if;
    update public.v2_pvp_matches set state=p_state,version=1,updated_at=now() where id=room.id;
  end if;
  return true;
end;
$$;

create or replace function public.v2_update_pvp_match_state(p_match_id uuid, p_expected_version integer, p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  room public.v2_pvp_matches;
  v_user uuid := (select auth.uid());
  next_status text;
  next_winner uuid;
  active_id uuid;
  allowed_ids uuid[];
begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  if room.id is null or v_user not in (
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.version<>p_expected_version then return public.v2_pvp_room_payload(room); end if;
  if room.status<>'active' then return public.v2_pvp_room_payload(room); end if;

  active_id := nullif(room.state->>'activeCharacterId','')::uuid;
  allowed_ids := array_remove(array[
    case when room.player_one_user_id=v_user then room.player_one_character_id end,
    case when room.player_one_secondary_user_id=v_user then room.player_one_secondary_character_id end,
    case when room.player_two_user_id=v_user then room.player_two_character_id end,
    case when room.player_two_secondary_user_id=v_user then room.player_two_secondary_character_id end
  ],null);
  if active_id is null or not (active_id=any(allowed_ids)) then raise exception 'Não é o seu turno' using errcode='42501'; end if;

  next_status:=coalesce(p_state->>'status','active');
  if next_status not in ('active','finished','abandoned') then raise exception 'Estado PvP inválido' using errcode='22023'; end if;
  next_winner:=nullif(p_state->>'winnerCharacterId','')::uuid;
  if next_winner is not null and next_winner not in (
    room.player_one_character_id,room.player_one_secondary_character_id,
    room.player_two_character_id,room.player_two_secondary_character_id
  ) then raise exception 'Vencedor inválido' using errcode='22023'; end if;

  update public.v2_pvp_matches
  set state=p_state,version=version+1,status=next_status,winner_character_id=next_winner,
      updated_at=now(),finished_at=case when next_status='finished' then now() else null end
  where id=room.id returning * into room;
  return public.v2_pvp_room_payload(room);
end;
$$;

create or replace function public.v2_get_pvp_team_roster(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare room public.v2_pvp_matches; result jsonb; v_user uuid := (select auth.uid());
begin
  select * into room from public.v2_pvp_matches where id=p_match_id;
  if room.id is null or v_user not in (
    room.player_one_user_id,room.player_one_secondary_user_id,
    room.player_two_user_id,room.player_two_secondary_user_id
  ) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'team',x.team,'slot',x.slot,
    'character',jsonb_build_object(
      'id',c.id,'name',c.name,'race_id',c.race_id,'class_id',c.class_id,'class_path_key',c.class_path_key,
      'level',c.level,'image_url',c.image_url,'adventure_rank',c.adventure_rank,'allocated_attributes',c.allocated_attributes
    ),
    'equipment',coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'character_id',i.character_id,'item_id',i.item_id,'quantity',i.quantity,'equipped_slot',i.equipped_slot
    ) order by i.id) from public.v2_character_inventory i where i.character_id=c.id),'[]'::jsonb)
  ) order by x.team,x.slot),'[]'::jsonb) into result
  from (
    values
      (1,1,room.player_one_character_id),
      (1,2,room.player_one_secondary_character_id),
      (2,1,room.player_two_character_id),
      (2,2,room.player_two_secondary_character_id)
  ) as x(team,slot,character_id)
  join public.v2_characters c on c.id=x.character_id;

  return jsonb_build_object(
    'format',room.format,
    'ownTeam',case when v_user in (room.player_one_user_id,room.player_one_secondary_user_id) then 1 else 2 end,
    'members',result
  );
end;
$$;

create or replace function public.v2_record_pvp_result()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  rounds_played integer;
  team_one_won boolean;
begin
  if new.status <> 'finished'
     or new.winner_character_id is null
     or (old.status = 'finished' and old.winner_character_id is not null) then
    return new;
  end if;

  rounds_played := greatest(1, coalesce((new.state ->> 'turn')::integer, 1));
  team_one_won := new.winner_character_id in (new.player_one_character_id,new.player_one_secondary_character_id);

  insert into public.v2_pvp_history(match_id,character_id,opponent_character_id,result,rank,rounds,finished_at)
  select new.id,v.character_id,v.opponent_character_id,v.result,new.rank,rounds_played,coalesce(new.finished_at,now())
  from (values
    (new.player_one_character_id,new.player_two_character_id,case when team_one_won then 'victory' else 'defeat' end),
    (new.player_one_secondary_character_id,new.player_two_character_id,case when team_one_won then 'victory' else 'defeat' end),
    (new.player_two_character_id,new.player_one_character_id,case when team_one_won then 'defeat' else 'victory' end),
    (new.player_two_secondary_character_id,new.player_one_character_id,case when team_one_won then 'defeat' else 'victory' end)
  ) as v(character_id,opponent_character_id,result)
  where v.character_id is not null
  on conflict(match_id,character_id) do nothing;

  return new;
end;
$$;

create or replace function public.v2_combat_surrender_status(p_kind text, p_combat_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_participants uuid[];
  v_required integer;
  v_votes integer;
  v_voted boolean;
  v_completed boolean := false;
  v_status text;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if p_kind not in ('arena','pvp','dungeon') then raise exception 'Tipo de combate inválido' using errcode='22023'; end if;

  if p_kind='arena' then
    select array[user_id], status into v_participants, v_status from public.v2_arena_sessions where id=p_combat_id;
    v_completed := coalesce(v_status,'') <> 'open';
  elsif p_kind='pvp' then
    select array(select distinct u from unnest(array[
      player_one_user_id,player_one_secondary_user_id,player_two_user_id,player_two_secondary_user_id
    ]) u where u is not null), status
    into v_participants,v_status
    from public.v2_pvp_matches where id=p_combat_id;
    v_completed := coalesce(v_status,'') <> 'active';
  else
    select coalesce(array_agg(distinct c.user_id),array[]::uuid[]), r.status into v_participants, v_status
      from public.v2_dungeon_runs r left join public.v2_characters c on c.id=any(r.party_character_ids)
      where r.id=p_combat_id group by r.status;
    v_completed := coalesce(v_status,'') <> 'active';
  end if;

  if v_participants is null or not (v_user=any(v_participants)) then raise exception 'Combate não encontrado para este jogador' using errcode='42501'; end if;
  v_required := cardinality(v_participants);
  select count(*)::int, bool_or(user_id=v_user) into v_votes,v_voted
    from public.v2_combat_surrender_votes
    where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(v_participants);

  return jsonb_build_object('completed',v_completed,'votes',coalesce(v_votes,0),'required',v_required,'voted',coalesce(v_voted,false));
end;
$$;

create or replace function public.v2_request_combat_surrender(p_kind text, p_combat_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_participants uuid[];
  v_required integer;
  v_votes integer;
  v_voted boolean;
  v_completed boolean := false;
  v_state jsonb;
  v_status text;
  v_log jsonb;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if p_kind not in ('arena','pvp','dungeon') then raise exception 'Tipo de combate inválido' using errcode='22023'; end if;

  if p_kind='arena' then
    select array[user_id], status into v_participants, v_status from public.v2_arena_sessions where id=p_combat_id for update;
    if coalesce(v_status,'') <> 'open' then v_completed:=true; end if;
  elsif p_kind='pvp' then
    select array(select distinct u from unnest(array[
      player_one_user_id,player_one_secondary_user_id,player_two_user_id,player_two_secondary_user_id
    ]) u where u is not null), status
    into v_participants,v_status
    from public.v2_pvp_matches where id=p_combat_id for update;
    if coalesce(v_status,'') <> 'active' then v_completed:=true; end if;
  else
    select coalesce(array_agg(distinct c.user_id),array[]::uuid[]), r.status into v_participants, v_status
      from public.v2_dungeon_runs r left join public.v2_characters c on c.id=any(r.party_character_ids)
      where r.id=p_combat_id group by r.status;
    perform 1 from public.v2_dungeon_runs where id=p_combat_id for update;
    if coalesce(v_status,'') <> 'active' then v_completed:=true; end if;
  end if;

  if v_participants is null or not (v_user=any(v_participants)) then raise exception 'Combate não encontrado para este jogador' using errcode='42501'; end if;
  v_required := cardinality(v_participants);
  if not v_completed then
    insert into public.v2_combat_surrender_votes(combat_kind,combat_id,user_id)
    values(p_kind,p_combat_id,v_user) on conflict do nothing;
  end if;

  select count(*)::int, bool_or(user_id=v_user) into v_votes,v_voted
    from public.v2_combat_surrender_votes
    where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(v_participants);

  if not v_completed and v_votes>=v_required then
    if p_kind='arena' then
      update public.v2_arena_sessions set status='defeat',completed_at=now() where id=p_combat_id and status='open';
    elsif p_kind='pvp' then
      select state into v_state from public.v2_pvp_matches where id=p_combat_id;
      v_state := coalesce(v_state,'{}'::jsonb) || jsonb_build_object(
        'status','finished','winnerCharacterId',null,
        'message','Todos os jogadores confirmaram a desistência. A partida terminou em derrota para os participantes.'
      );
      v_log := coalesce(v_state->'log','[]'::jsonb);
      v_state := jsonb_set(v_state,'{log}',v_log || jsonb_build_array('Todos os jogadores confirmaram a desistência. A partida terminou sem vencedor.'),true);
      update public.v2_pvp_matches
        set state=v_state,status='finished',winner_character_id=null,version=version+1,updated_at=now(),finished_at=now()
        where id=p_combat_id and status='active';
    else
      select state into v_state from public.v2_dungeon_runs where id=p_combat_id;
      v_state := coalesce(v_state,'{}'::jsonb) || jsonb_build_object('status','defeat','message','Todos os aventureiros confirmaram a desistência. A expedição fracassou.');
      v_log := coalesce(v_state->'log','[]'::jsonb);
      v_state := jsonb_set(v_state,'{log}',v_log || jsonb_build_array('O grupo desistiu da expedição e saiu derrotado.'),true);
      update public.v2_dungeon_runs set state=v_state,status='finished',version=version+1,finished_at=now()
        where id=p_combat_id and status='active';
    end if;
    v_completed := true;
  end if;

  return jsonb_build_object('completed',v_completed,'votes',coalesce(v_votes,0),'required',v_required,'voted',coalesce(v_voted,false));
end;
$$;

revoke execute on function public.v2_pvp_character_card(uuid) from public, anon, authenticated;
revoke execute on function public.v2_pvp_queue_payload(public.v2_pvp_queue) from public, anon, authenticated;

revoke execute on function public.v2_search_pvp_partner(uuid,text) from public, anon;
revoke execute on function public.v2_get_pvp_party_state(uuid) from public, anon;
revoke execute on function public.v2_invite_pvp_partner(uuid,uuid) from public, anon;
revoke execute on function public.v2_cancel_pvp_party_invite(uuid) from public, anon;
revoke execute on function public.v2_respond_pvp_party_invite(uuid,boolean) from public, anon;
revoke execute on function public.v2_disband_pvp_party(uuid) from public, anon;

grant execute on function public.v2_search_pvp_partner(uuid,text) to authenticated;
grant execute on function public.v2_get_pvp_party_state(uuid) to authenticated;
grant execute on function public.v2_invite_pvp_partner(uuid,uuid) to authenticated;
grant execute on function public.v2_cancel_pvp_party_invite(uuid) to authenticated;
grant execute on function public.v2_respond_pvp_party_invite(uuid,boolean) to authenticated;
grant execute on function public.v2_disband_pvp_party(uuid) to authenticated;

revoke execute on function public.v2_join_pvp_queue_v2(uuid,text) from public, anon;
revoke execute on function public.v2_poll_pvp_queue_v2(uuid) from public, anon;
revoke execute on function public.v2_cancel_pvp_queue(uuid) from public, anon;
revoke execute on function public.v2_get_pvp_match_state(uuid) from public, anon;
revoke execute on function public.v2_initialize_pvp_match(uuid,jsonb) from public, anon;
revoke execute on function public.v2_update_pvp_match_state(uuid,integer,jsonb) from public, anon;
revoke execute on function public.v2_get_pvp_team_roster(uuid) from public, anon;
revoke execute on function public.v2_combat_surrender_status(text,uuid) from public, anon;
revoke execute on function public.v2_request_combat_surrender(text,uuid) from public, anon;

grant execute on function public.v2_join_pvp_queue_v2(uuid,text) to authenticated;
grant execute on function public.v2_poll_pvp_queue_v2(uuid) to authenticated;
grant execute on function public.v2_cancel_pvp_queue(uuid) to authenticated;
grant execute on function public.v2_get_pvp_match_state(uuid) to authenticated;
grant execute on function public.v2_initialize_pvp_match(uuid,jsonb) to authenticated;
grant execute on function public.v2_update_pvp_match_state(uuid,integer,jsonb) to authenticated;
grant execute on function public.v2_get_pvp_team_roster(uuid) to authenticated;
grant execute on function public.v2_combat_surrender_status(text,uuid) to authenticated;
grant execute on function public.v2_request_combat_surrender(text,uuid) to authenticated;
