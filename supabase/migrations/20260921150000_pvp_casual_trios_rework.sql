-- Item 11: PvP casual completo (1x1, 2x2 e 3x3) com equipes persistentes.

alter table public.v2_pvp_queue
  add column if not exists tertiary_user_id uuid references auth.users(id) on delete set null,
  add column if not exists tertiary_character_id uuid references public.v2_characters(id) on delete set null,
  add column if not exists opponent_tertiary_character_id uuid references public.v2_characters(id) on delete set null;

alter table public.v2_pvp_matches
  add column if not exists player_one_tertiary_user_id uuid references auth.users(id) on delete set null,
  add column if not exists player_one_tertiary_character_id uuid references public.v2_characters(id) on delete set null,
  add column if not exists player_two_tertiary_user_id uuid references auth.users(id) on delete set null,
  add column if not exists player_two_tertiary_character_id uuid references public.v2_characters(id) on delete set null;

alter table public.v2_pvp_queue drop constraint if exists v2_pvp_queue_format_check;
alter table public.v2_pvp_queue add constraint v2_pvp_queue_format_check check(format in ('solo','duo','trio'));
alter table public.v2_pvp_matches drop constraint if exists v2_pvp_matches_format_check;
alter table public.v2_pvp_matches add constraint v2_pvp_matches_format_check check(format in ('solo','duo','trio'));
alter table public.v2_pvp_party_members drop constraint if exists v2_pvp_party_members_slot_check;
alter table public.v2_pvp_party_members add constraint v2_pvp_party_members_slot_check check(slot in (1,2,3));

create index if not exists v2_pvp_queue_tertiary_user_idx on public.v2_pvp_queue(tertiary_user_id,status,joined_at);

create or replace function public.v2_pvp_queue_payload(p_entry public.v2_pvp_queue)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  v_user uuid := (select auth.uid());
  v_match public.v2_pvp_matches;
  v_required integer := 0;
  v_accepted integer := 0;
  v_acceptance text;
  v_secondary uuid;
  v_tertiary uuid;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if not (v_user=any(array_remove(array[p_entry.user_id,p_entry.secondary_user_id,p_entry.tertiary_user_id],null))) then
    raise exception 'Fila não encontrada' using errcode='42501';
  end if;
  if p_entry.user_id=v_user then v_secondary:=p_entry.secondary_character_id; v_tertiary:=p_entry.tertiary_character_id;
  elsif p_entry.secondary_user_id=v_user then v_secondary:=p_entry.character_id; v_tertiary:=p_entry.tertiary_character_id;
  else v_secondary:=p_entry.character_id; v_tertiary:=p_entry.secondary_character_id; end if;
  if p_entry.match_id is not null then select * into v_match from public.v2_pvp_matches where id=p_entry.match_id; end if;
  if v_match.id is not null then
    v_required:=cardinality(array_remove(array[v_match.player_one_user_id,v_match.player_one_secondary_user_id,v_match.player_one_tertiary_user_id,v_match.player_two_user_id,v_match.player_two_secondary_user_id,v_match.player_two_tertiary_user_id],null));
    v_accepted:=cardinality(v_match.accepted_user_ids);
    v_acceptance:=case when v_match.status='active' then 'ready' when v_match.status='awaiting_acceptance' and v_user=any(v_match.accepted_user_ids) then 'accepted' when v_match.status='awaiting_acceptance' then 'waiting' else 'expired' end;
  end if;
  return jsonb_build_object(
    'status',p_entry.status,'queueId',p_entry.id,'matchId',p_entry.match_id,'rank',p_entry.rank,'format',p_entry.format,
    'secondaryCharacter',public.v2_pvp_character_card(v_secondary),'tertiaryCharacter',public.v2_pvp_character_card(v_tertiary),
    'opponent',public.v2_pvp_character_card(p_entry.opponent_character_id),
    'opponentSecondary',public.v2_pvp_character_card(p_entry.opponent_secondary_character_id),
    'opponentTertiary',public.v2_pvp_character_card(p_entry.opponent_tertiary_character_id),
    'acceptanceStatus',v_acceptance,'acceptedByYou',coalesce(v_user=any(v_match.accepted_user_ids),false),
    'acceptedCount',v_accepted,'requiredCount',v_required,'acceptDeadline',v_match.accept_deadline
  );
end; $$;

create or replace function public.v2_get_pvp_party_state(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_character public.v2_characters; v_party public.v2_pvp_parties; v_own public.v2_pvp_party_members; v_members jsonb; v_partner uuid; v_incoming jsonb; v_outgoing jsonb; v_queue public.v2_pvp_queue;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into v_character from public.v2_characters where id=p_character_id and user_id=v_user;
  if v_character.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  update public.v2_pvp_party_invites set status='expired',responded_at=now() where status='pending' and expires_at<=now() and(inviter_user_id=v_user or invitee_user_id=v_user);
  select * into v_own from public.v2_pvp_party_members where user_id=v_user limit 1;
  if v_own.party_id is not null then
    select * into v_party from public.v2_pvp_parties where id=v_own.party_id;
    select coalesce(jsonb_agg(public.v2_pvp_character_card(pm.character_id) order by pm.slot),'[]'::jsonb)
      into v_members from public.v2_pvp_party_members pm where pm.party_id=v_own.party_id;
    select pm.character_id into v_partner from public.v2_pvp_party_members pm where pm.party_id=v_own.party_id and pm.user_id<>v_user order by pm.slot limit 1;
    select * into v_queue from public.v2_pvp_queue q where q.format in ('duo','trio') and q.status in('searching','matched') and v_user=any(array_remove(array[q.user_id,q.secondary_user_id,q.tertiary_user_id],null)) order by q.joined_at desc limit 1;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'createdAt',i.created_at,'expiresAt',i.expires_at,'character',public.v2_pvp_character_card(i.inviter_character_id)) order by i.created_at desc),'[]'::jsonb) into v_incoming from public.v2_pvp_party_invites i where i.invitee_user_id=v_user and i.status='pending' and i.expires_at>now();
  select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'createdAt',i.created_at,'expiresAt',i.expires_at,'character',public.v2_pvp_character_card(i.invitee_character_id)) order by i.created_at desc),'[]'::jsonb) into v_outgoing from public.v2_pvp_party_invites i where i.inviter_user_id=v_user and i.status='pending' and i.expires_at>now();
  return jsonb_build_object('party',case when v_party.id is null then null else jsonb_build_object('id',v_party.id,'rank',v_party.rank,'createdAt',v_party.created_at,'ownCharacter',public.v2_pvp_character_card(v_own.character_id),'partner',public.v2_pvp_character_card(v_partner),'members',v_members) end,'incoming',coalesce(v_incoming,'[]'::jsonb),'outgoing',coalesce(v_outgoing,'[]'::jsonb),'queue',case when v_queue.id is null then null else public.v2_pvp_queue_payload(v_queue) end);
end; $$;

create or replace function public.v2_invite_pvp_partner(p_character_id uuid,p_target_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_character public.v2_characters; v_target public.v2_characters; v_party_id uuid; v_count integer; v_invite public.v2_pvp_party_invites;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into v_character from public.v2_characters where id=p_character_id and user_id=v_user;
  select * into v_target from public.v2_characters where id=p_target_character_id;
  if v_character.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  if v_target.id is null or v_target.user_id=v_user then raise exception 'Parceiro inválido' using errcode='22023'; end if;
  if v_target.adventure_rank<>v_character.adventure_rank then raise exception 'A equipe precisa estar no mesmo Rank' using errcode='P0001'; end if;
  if exists(select 1 from public.v2_pvp_party_members where user_id=v_target.user_id) then raise exception 'Este jogador já está em uma equipe' using errcode='P0001'; end if;
  select party_id into v_party_id from public.v2_pvp_party_members where user_id=v_user;
  if v_party_id is not null then select count(*) into v_count from public.v2_pvp_party_members where party_id=v_party_id; if v_count>=3 then raise exception 'Sua equipe já está completa' using errcode='P0001'; end if; end if;
  update public.v2_pvp_party_invites set status='cancelled',responded_at=now() where inviter_user_id=v_user and invitee_user_id=v_target.user_id and status='pending';
  insert into public.v2_pvp_party_invites(inviter_user_id,inviter_character_id,invitee_user_id,invitee_character_id,rank) values(v_user,v_character.id,v_target.user_id,v_target.id,v_character.adventure_rank) returning * into v_invite;
  return jsonb_build_object('id',v_invite.id,'status',v_invite.status,'character',public.v2_pvp_character_card(v_target.id));
end; $$;

create or replace function public.v2_respond_pvp_party_invite(p_invite_id uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_invite public.v2_pvp_party_invites; v_inviter public.v2_characters; v_invitee public.v2_characters; v_party public.v2_pvp_parties; v_party_id uuid; v_slot integer;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  select * into v_invite from public.v2_pvp_party_invites where id=p_invite_id for update;
  if v_invite.id is null or v_invite.invitee_user_id<>v_user then raise exception 'Convite não encontrado' using errcode='42501'; end if;
  if v_invite.status<>'pending' or v_invite.expires_at<=now() then raise exception 'Este convite não está mais disponível' using errcode='P0001'; end if;
  if not p_accept then update public.v2_pvp_party_invites set status='declined',responded_at=now() where id=v_invite.id; return jsonb_build_object('accepted',false); end if;
  if exists(select 1 from public.v2_pvp_party_members where user_id=v_invite.invitee_user_id) then raise exception 'Você já está em uma equipe' using errcode='P0001'; end if;
  select * into v_inviter from public.v2_characters where id=v_invite.inviter_character_id and user_id=v_invite.inviter_user_id;
  select * into v_invitee from public.v2_characters where id=v_invite.invitee_character_id and user_id=v_invite.invitee_user_id;
  if v_inviter.id is null or v_invitee.id is null or v_inviter.adventure_rank<>v_invitee.adventure_rank then raise exception 'Os personagens não estão mais disponíveis no mesmo Rank' using errcode='P0001'; end if;
  select party_id into v_party_id from public.v2_pvp_party_members where user_id=v_invite.inviter_user_id;
  if v_party_id is null then
    insert into public.v2_pvp_parties(rank) values(v_inviter.adventure_rank) returning * into v_party;
    v_party_id:=v_party.id;
    insert into public.v2_pvp_party_members(party_id,user_id,character_id,slot) values(v_party_id,v_invite.inviter_user_id,v_inviter.id,1);
  end if;
  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-party-'||v_party_id::text));
  select coalesce(max(slot),0)+1 into v_slot from public.v2_pvp_party_members where party_id=v_party_id;
  if v_slot>3 then raise exception 'Esta equipe já está completa' using errcode='P0001'; end if;
  insert into public.v2_pvp_party_members(party_id,user_id,character_id,slot) values(v_party_id,v_invite.invitee_user_id,v_invitee.id,v_slot);
  update public.v2_pvp_party_invites set status='accepted',responded_at=now() where id=v_invite.id;
  update public.v2_pvp_party_invites set status='cancelled',responded_at=now() where status='pending' and id<>v_invite.id and (inviter_user_id=v_invite.invitee_user_id or invitee_user_id=v_invite.invitee_user_id);
  return jsonb_build_object('accepted',true,'partyId',v_party_id,'partner',public.v2_pvp_character_card(v_inviter.id));
end; $$;

create or replace function public.v2_join_pvp_queue_v2(p_character_id uuid,p_format text default 'solo')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); chosen public.v2_characters; normalized text:=lower(coalesce(p_format,'solo')); party_id uuid; member_count integer; users uuid[]; chars uuid[]; opponent public.v2_pvp_queue; own public.v2_pvp_queue; new_match uuid;
begin
  if v_user is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
  if normalized not in ('solo','duo','trio') then raise exception 'Formato PvP inválido' using errcode='22023'; end if;
  select * into chosen from public.v2_characters where id=p_character_id and user_id=v_user;
  if chosen.id is null then raise exception 'Personagem inválido' using errcode='42501'; end if;
  if normalized='solo' then users:=array[v_user]; chars:=array[chosen.id];
  else
    select pm.party_id into party_id from public.v2_pvp_party_members pm where pm.user_id=v_user and pm.character_id=chosen.id;
    select count(*),array_agg(pm.user_id order by pm.slot),array_agg(pm.character_id order by pm.slot) into member_count,users,chars from public.v2_pvp_party_members pm where pm.party_id=party_id;
    if party_id is null or member_count<>(case when normalized='duo' then 2 else 3 end) then raise exception 'Sua equipe precisa ter exatamente % jogadores para esta fila',case when normalized='duo' then 2 else 3 end using errcode='P0001'; end if;
    if exists(select 1 from public.v2_characters c where c.id=any(chars) and c.adventure_rank<>chosen.adventure_rank) then raise exception 'Todos os personagens precisam estar no mesmo Rank' using errcode='P0001'; end if;
    if exists(select 1 from unnest(chars) as selected(character_id) where public.v2_character_has_active_mission(selected.character_id)) then raise exception 'Um integrante está em missão e não pode entrar na Arena' using errcode='P0001'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtext('wonderland-pvp-'||normalized||'-'||chosen.adventure_rank));
  update public.v2_pvp_queue set status='expired' where status='searching' and joined_at<now()-interval '15 minutes';
  update public.v2_pvp_queue set status='cancelled' where status='searching' and (user_id=any(users) or secondary_user_id=any(users) or tertiary_user_id=any(users));
  select * into opponent from public.v2_pvp_queue q where q.status='searching' and q.rank=chosen.adventure_rank and q.format=normalized and not (array_remove(array[q.user_id,q.secondary_user_id,q.tertiary_user_id],null)&&users) and (normalized='solo' or q.secondary_user_id is not null) and (normalized<>'trio' or q.tertiary_user_id is not null) order by q.joined_at limit 1 for update skip locked;
  if opponent.id is null then
    insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,tertiary_user_id,tertiary_character_id,rank,format) values(users[1],chars[1],users[2],chars[2],users[3],chars[3],chosen.adventure_rank,normalized) returning * into own;
    return public.v2_pvp_queue_payload(own);
  end if;
  new_match:=gen_random_uuid();
  update public.v2_pvp_queue set status='matched',opponent_character_id=chars[1],opponent_secondary_character_id=chars[2],opponent_tertiary_character_id=chars[3],match_id=new_match,matched_at=now() where id=opponent.id;
  insert into public.v2_pvp_queue(user_id,character_id,secondary_user_id,secondary_character_id,tertiary_user_id,tertiary_character_id,rank,format,status,opponent_character_id,opponent_secondary_character_id,opponent_tertiary_character_id,match_id,matched_at) values(users[1],chars[1],users[2],chars[2],users[3],chars[3],chosen.adventure_rank,normalized,'matched',opponent.character_id,opponent.secondary_character_id,opponent.tertiary_character_id,new_match,now()) returning * into own;
  return public.v2_pvp_queue_payload(own);
end; $$;

create or replace function public.v2_poll_pvp_queue_v2(p_queue_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); entry public.v2_pvp_queue; begin
  select * into entry from public.v2_pvp_queue where id=p_queue_id and v_user=any(array_remove(array[user_id,secondary_user_id,tertiary_user_id],null));
  if entry.id is null then raise exception 'Fila não encontrada' using errcode='P0002'; end if;
  if entry.status='searching' and entry.joined_at<now()-interval '15 minutes' then update public.v2_pvp_queue set status='expired' where id=entry.id returning * into entry; end if;
  return public.v2_pvp_queue_payload(entry); end; $$;

create or replace function public.v2_cancel_pvp_queue(p_queue_id uuid)
returns void language plpgsql security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); begin update public.v2_pvp_queue set status='cancelled' where id=p_queue_id and status='searching' and v_user=any(array_remove(array[user_id,secondary_user_id,tertiary_user_id],null)); end; $$;

create or replace function public.v2_disband_pvp_party(p_party_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); users uuid[]; begin
  select array_agg(user_id) into users from public.v2_pvp_party_members where party_id=p_party_id;
  if users is null or not(v_user=any(users)) then raise exception 'Equipe não encontrada' using errcode='42501'; end if;
  update public.v2_pvp_queue set status='cancelled' where format in('duo','trio') and status='searching' and (user_id=any(users) or secondary_user_id=any(users) or tertiary_user_id=any(users));
  delete from public.v2_pvp_parties where id=p_party_id;
  return true;
end; $$;

create or replace function public.v2_block_combat_during_mission()
returns trigger language plpgsql security definer set search_path='' as $$ begin
  if public.v2_character_has_active_mission(new.character_id) then raise exception 'Personagem em missão: Arena está bloqueada'; end if;
  if new.secondary_character_id is not null and public.v2_character_has_active_mission(new.secondary_character_id) then raise exception 'Parceiro em missão: Arena está bloqueada'; end if;
  if new.tertiary_character_id is not null and public.v2_character_has_active_mission(new.tertiary_character_id) then raise exception 'Parceiro em missão: Arena está bloqueada'; end if;
  return new;
end; $$;

create or replace function public.v2_create_pvp_match_room()
returns trigger language plpgsql security definer set search_path='' as $$ declare other_entry public.v2_pvp_queue; begin
  if new.status<>'matched' or new.match_id is null then return new; end if;
  select * into other_entry from public.v2_pvp_queue where match_id=new.match_id and status='matched' and id<>new.id order by matched_at limit 1;
  if other_entry.id is not null then insert into public.v2_pvp_matches(id,player_one_user_id,player_one_character_id,player_one_secondary_user_id,player_one_secondary_character_id,player_one_tertiary_user_id,player_one_tertiary_character_id,player_two_user_id,player_two_character_id,player_two_secondary_user_id,player_two_secondary_character_id,player_two_tertiary_user_id,player_two_tertiary_character_id,rank,format,status,accepted_user_ids,accept_deadline) values(new.match_id,other_entry.user_id,other_entry.character_id,other_entry.secondary_user_id,other_entry.secondary_character_id,other_entry.tertiary_user_id,other_entry.tertiary_character_id,new.user_id,new.character_id,new.secondary_user_id,new.secondary_character_id,new.tertiary_user_id,new.tertiary_character_id,new.rank,new.format,'awaiting_acceptance','{}'::uuid[],now()+interval '30 seconds') on conflict(id) do nothing; end if;
  return new; end; $$;

create or replace function public.v2_respond_pvp_match(p_match_id uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); room public.v2_pvp_matches; entry public.v2_pvp_queue; participants uuid[]; accepted uuid[]; begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update;
  participants:=array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id,room.player_two_user_id,room.player_two_secondary_user_id,room.player_two_tertiary_user_id],null);
  if room.id is null or not(v_user=any(participants)) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.status='awaiting_acceptance' and room.accept_deadline<=now() then update public.v2_pvp_matches set status='abandoned',updated_at=now(),finished_at=now() where id=room.id; update public.v2_pvp_queue set status='expired' where match_id=room.id and status='matched';
  elsif room.status='awaiting_acceptance' and not p_accept then update public.v2_pvp_matches set status='abandoned',updated_at=now(),finished_at=now() where id=room.id; update public.v2_pvp_queue set status='cancelled' where match_id=room.id and status='matched';
  elsif room.status='awaiting_acceptance' then accepted:=case when v_user=any(room.accepted_user_ids) then room.accepted_user_ids else array_append(room.accepted_user_ids,v_user) end; update public.v2_pvp_matches set accepted_user_ids=accepted,status=case when cardinality(accepted)=cardinality(participants) then 'active' else status end,updated_at=now() where id=room.id; end if;
  select * into entry from public.v2_pvp_queue where match_id=room.id and v_user=any(array_remove(array[user_id,secondary_user_id,tertiary_user_id],null)) limit 1;
  return public.v2_pvp_queue_payload(entry); end; $$;

create or replace function public.v2_pvp_room_payload(p_match public.v2_pvp_matches)
returns jsonb language plpgsql stable security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); v_team integer; v_own uuid; v_own_ids jsonb; v_enemy_ids jsonb; v_control jsonb:='[]'::jsonb; begin
  if v_user=any(array_remove(array[p_match.player_one_user_id,p_match.player_one_secondary_user_id,p_match.player_one_tertiary_user_id],null)) then
    v_team:=1; v_own_ids:=to_jsonb(array_remove(array[p_match.player_one_character_id,p_match.player_one_secondary_character_id,p_match.player_one_tertiary_character_id],null)); v_enemy_ids:=to_jsonb(array_remove(array[p_match.player_two_character_id,p_match.player_two_secondary_character_id,p_match.player_two_tertiary_character_id],null));
    if p_match.player_one_user_id=v_user then v_own:=p_match.player_one_character_id; v_control:=v_control||jsonb_build_array(v_own); elsif p_match.player_one_secondary_user_id=v_user then v_own:=p_match.player_one_secondary_character_id; v_control:=v_control||jsonb_build_array(v_own); else v_own:=p_match.player_one_tertiary_character_id; v_control:=v_control||jsonb_build_array(v_own); end if;
  elsif v_user=any(array_remove(array[p_match.player_two_user_id,p_match.player_two_secondary_user_id,p_match.player_two_tertiary_user_id],null)) then
    v_team:=2; v_own_ids:=to_jsonb(array_remove(array[p_match.player_two_character_id,p_match.player_two_secondary_character_id,p_match.player_two_tertiary_character_id],null)); v_enemy_ids:=to_jsonb(array_remove(array[p_match.player_one_character_id,p_match.player_one_secondary_character_id,p_match.player_one_tertiary_character_id],null));
    if p_match.player_two_user_id=v_user then v_own:=p_match.player_two_character_id; v_control:=v_control||jsonb_build_array(v_own); elsif p_match.player_two_secondary_user_id=v_user then v_own:=p_match.player_two_secondary_character_id; v_control:=v_control||jsonb_build_array(v_own); else v_own:=p_match.player_two_tertiary_character_id; v_control:=v_control||jsonb_build_array(v_own); end if;
  else raise exception 'Sala PvP não encontrada' using errcode='42501'; end if;
  return jsonb_build_object('matchId',p_match.id,'version',p_match.version,'format',p_match.format,'ownTeam',v_team,'ownCharacterId',v_own,'opponentCharacterId',v_enemy_ids->>0,'ownCharacterIds',v_own_ids,'opponentCharacterIds',v_enemy_ids,'controllableCharacterIds',v_control,'state',p_match.state,'status',p_match.status); end; $$;

create or replace function public.v2_get_pvp_team_roster(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare room public.v2_pvp_matches; result jsonb; v_user uuid:=(select auth.uid()); users uuid[]; begin
  select * into room from public.v2_pvp_matches where id=p_match_id; users:=array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id,room.player_two_user_id,room.player_two_secondary_user_id,room.player_two_tertiary_user_id],null);
  if room.id is null or not(v_user=any(users)) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('team',x.team,'slot',x.slot,'character',jsonb_build_object('id',c.id,'name',c.name,'race_id',c.race_id,'class_id',c.class_id,'class_path_key',c.class_path_key,'level',c.level,'image_url',c.image_url,'adventure_rank',c.adventure_rank,'allocated_attributes',c.allocated_attributes,'rework_attributes',c.rework_attributes,'cosmetics',c.cosmetics),'loadout',(select to_jsonb(l) from public.v2_character_skill_loadouts l where l.character_id=c.id),'equipment',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'character_id',i.character_id,'item_id',i.item_id,'quantity',i.quantity,'equipped_slot',i.equipped_slot) order by i.id) from public.v2_character_inventory i where i.character_id=c.id),'[]'::jsonb)) order by x.team,x.slot),'[]'::jsonb) into result
  from(values(1,1,room.player_one_character_id),(1,2,room.player_one_secondary_character_id),(1,3,room.player_one_tertiary_character_id),(2,1,room.player_two_character_id),(2,2,room.player_two_secondary_character_id),(2,3,room.player_two_tertiary_character_id))x(team,slot,character_id) join public.v2_characters c on c.id=x.character_id;
  return jsonb_build_object('format',room.format,'ownTeam',case when v_user=any(array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id],null)) then 1 else 2 end,'members',result); end; $$;

create or replace function public.v2_get_pvp_match_state(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare room public.v2_pvp_matches; v_user uuid:=(select auth.uid()); users uuid[]; begin select * into room from public.v2_pvp_matches where id=p_match_id; users:=array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id,room.player_two_user_id,room.player_two_secondary_user_id,room.player_two_tertiary_user_id],null); if room.id is null or not(v_user=any(users)) then raise exception 'Sala PvP não encontrada' using errcode='42501'; end if; if room.state is null then raise exception 'Sala PvP ainda não inicializada' using errcode='P0002'; end if; return public.v2_pvp_room_payload(room); end; $$;

create or replace function public.v2_initialize_pvp_match(p_match_id uuid,p_state jsonb)
returns boolean language plpgsql security definer set search_path='' as $$ declare room public.v2_pvp_matches; v_user uuid:=(select auth.uid()); users uuid[]; begin select * into room from public.v2_pvp_matches where id=p_match_id for update; users:=array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id,room.player_two_user_id,room.player_two_secondary_user_id,room.player_two_tertiary_user_id],null); if room.id is null or not(v_user=any(users)) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if; if room.state is null then if p_state is null or p_state->>'status'<>'active' or not(p_state?'fighters') or not(p_state?'turnOrder') then raise exception 'Estado inicial inválido' using errcode='22023'; end if; update public.v2_pvp_matches set state=p_state,version=1,updated_at=now() where id=room.id; end if; return true; end; $$;

create or replace function public.v2_update_pvp_match_state(p_match_id uuid,p_expected_version integer,p_state jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$ declare room public.v2_pvp_matches; v_user uuid:=(select auth.uid()); users uuid[]; active_id uuid; allowed uuid[]; all_chars uuid[]; next_status text; next_winner uuid; begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update; users:=array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id,room.player_two_user_id,room.player_two_secondary_user_id,room.player_two_tertiary_user_id],null); if room.id is null or not(v_user=any(users)) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if;
  if room.version<>p_expected_version or room.status<>'active' then return public.v2_pvp_room_payload(room); end if;
  active_id:=nullif(room.state->>'activeCharacterId','')::uuid; allowed:=array_remove(array[case when room.player_one_user_id=v_user then room.player_one_character_id end,case when room.player_one_secondary_user_id=v_user then room.player_one_secondary_character_id end,case when room.player_one_tertiary_user_id=v_user then room.player_one_tertiary_character_id end,case when room.player_two_user_id=v_user then room.player_two_character_id end,case when room.player_two_secondary_user_id=v_user then room.player_two_secondary_character_id end,case when room.player_two_tertiary_user_id=v_user then room.player_two_tertiary_character_id end],null); if active_id is null or not(active_id=any(allowed)) then raise exception 'Não é o seu turno' using errcode='42501'; end if;
  next_status:=coalesce(p_state->>'status','active'); if next_status not in('active','finished','abandoned') then raise exception 'Estado PvP inválido' using errcode='22023'; end if; next_winner:=nullif(p_state->>'winnerCharacterId','')::uuid; all_chars:=array_remove(array[room.player_one_character_id,room.player_one_secondary_character_id,room.player_one_tertiary_character_id,room.player_two_character_id,room.player_two_secondary_character_id,room.player_two_tertiary_character_id],null); if next_winner is not null and not(next_winner=any(all_chars)) then raise exception 'Vencedor inválido' using errcode='22023'; end if;
  update public.v2_pvp_matches set state=p_state,version=version+1,status=next_status,winner_character_id=next_winner,updated_at=now(),finished_at=case when next_status='finished' then now() else null end where id=room.id returning * into room; return public.v2_pvp_room_payload(room); end; $$;

create or replace function public.v2_record_pvp_result()
returns trigger language plpgsql security definer set search_path='' as $$ declare rounds_played integer; team_one_won boolean; team_one_ids uuid[]; begin
  if new.status<>'finished' or new.winner_character_id is null or (old.status='finished' and old.winner_character_id is not null) then return new; end if;
  rounds_played:=greatest(1,coalesce((new.state->>'turn')::integer,1));
  team_one_ids:=array_remove(array[new.player_one_character_id,new.player_one_secondary_character_id,new.player_one_tertiary_character_id],null);
  team_one_won:=new.winner_character_id=any(team_one_ids);
  insert into public.v2_pvp_history(match_id,character_id,opponent_character_id,result,rank,rounds,finished_at)
  select new.id,v.character_id,v.opponent_character_id,v.result,new.rank,rounds_played,coalesce(new.finished_at,now()) from(values
    (new.player_one_character_id,new.player_two_character_id,case when team_one_won then 'victory' else 'defeat' end),
    (new.player_one_secondary_character_id,new.player_two_character_id,case when team_one_won then 'victory' else 'defeat' end),
    (new.player_one_tertiary_character_id,new.player_two_character_id,case when team_one_won then 'victory' else 'defeat' end),
    (new.player_two_character_id,new.player_one_character_id,case when team_one_won then 'defeat' else 'victory' end),
    (new.player_two_secondary_character_id,new.player_one_character_id,case when team_one_won then 'defeat' else 'victory' end),
    (new.player_two_tertiary_character_id,new.player_one_character_id,case when team_one_won then 'defeat' else 'victory' end)
  )v(character_id,opponent_character_id,result) where v.character_id is not null on conflict(match_id,character_id) do nothing;
  return new;
end; $$;

-- Include o sexto jogador na expiração de turno e restaura o movimento do próximo turno.
create or replace function public.v2_expire_pvp_turn(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); room public.v2_pvp_matches; state jsonb; users uuid[]; order_ids text[]; living text[]; current_id text; next_id text; idx integer; next_idx integer; next_round integer; message text; begin
  select * into room from public.v2_pvp_matches where id=p_match_id for update; users:=array_remove(array[room.player_one_user_id,room.player_one_secondary_user_id,room.player_one_tertiary_user_id,room.player_two_user_id,room.player_two_secondary_user_id,room.player_two_tertiary_user_id],null); if room.id is null or not(v_user=any(users)) then raise exception 'Partida PvP não encontrada' using errcode='42501'; end if; if room.status<>'active' or room.state is null or coalesce((room.state->>'turnEndsAt')::timestamptz,now()+interval '1 minute')>now() then return public.v2_pvp_room_payload(room); end if;
  state:=room.state; current_id:=state->>'activeCharacterId'; select array_agg(value order by ordinality) into order_ids from jsonb_array_elements_text(state->'turnOrder') with ordinality; select array_agg(id order by position) into living from(select id,position from unnest(order_ids) with ordinality x(id,position) where coalesce((state->'fighters'->id->>'hp')::integer,0)>0)s; if cardinality(living)=0 then return public.v2_pvp_room_payload(room); end if; idx:=array_position(living,current_id); next_idx:=case when idx is null then 1 else idx+1 end; next_round:=coalesce((state->>'round')::integer,1); if next_idx>cardinality(living) then next_idx:=1; next_round:=next_round+1; end if; next_id:=living[next_idx]; message:=coalesce(state->'fighters'->current_id->>'name','O jogador')||' não agiu a tempo. Turno de '||coalesce(state->'fighters'->next_id->>'name','o próximo jogador')||'.';
  state:=jsonb_set(state,'{activeCharacterId}',to_jsonb(next_id),true); state:=jsonb_set(state,'{turn}',to_jsonb(coalesce((state->>'turn')::integer,0)+1),true); state:=jsonb_set(state,'{round}',to_jsonb(next_round),true); state:=jsonb_set(state,'{turnOrder}',to_jsonb(living),true); state:=jsonb_set(state,'{turnEndsAt}',to_jsonb((now()+interval '60 seconds')::text),true); state:=jsonb_set(state,'{turnActions}','{"basic":false,"class":false,"race":false}'::jsonb,true); state:=jsonb_set(state,'{movement}','4'::jsonb,true); state:=jsonb_set(state,'{message}',to_jsonb(message),true); state:=jsonb_set(state,'{log}',to_jsonb((array_append(coalesce(array(select jsonb_array_elements_text(state->'log')),array[]::text[]),message))[-80:]),true);
  update public.v2_pvp_matches set state=state,version=version+1,updated_at=now() where id=room.id returning * into room; return public.v2_pvp_room_payload(room); end; $$;

create or replace function public.v2_combat_surrender_status(p_kind text,p_combat_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); participants uuid[]; required integer; votes integer; voted boolean; completed boolean:=false; combat_status text; begin
  if p_kind='arena' then select array[user_id],status into participants,combat_status from public.v2_arena_sessions where id=p_combat_id; completed:=coalesce(combat_status,'')<>'open';
  elsif p_kind='pvp' then select array(select distinct u from unnest(array[player_one_user_id,player_one_secondary_user_id,player_one_tertiary_user_id,player_two_user_id,player_two_secondary_user_id,player_two_tertiary_user_id])u where u is not null),status into participants,combat_status from public.v2_pvp_matches where id=p_combat_id; completed:=coalesce(combat_status,'')<>'active';
  else raise exception 'Tipo de combate inválido' using errcode='22023'; end if; if participants is null or not(v_user=any(participants)) then raise exception 'Combate não encontrado para este jogador' using errcode='42501'; end if; required:=cardinality(participants); select count(*)::int,bool_or(user_id=v_user) into votes,voted from public.v2_combat_surrender_votes where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(participants); return jsonb_build_object('completed',completed,'votes',coalesce(votes,0),'required',required,'voted',coalesce(voted,false)); end; $$;

create or replace function public.v2_request_combat_surrender(p_kind text,p_combat_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$ declare v_user uuid:=(select auth.uid()); participants uuid[]; required integer; votes integer; voted boolean; completed boolean:=false; state jsonb; combat_status text; log jsonb; begin
  if p_kind='arena' then select array[user_id],status into participants,combat_status from public.v2_arena_sessions where id=p_combat_id for update; completed:=coalesce(combat_status,'')<>'open';
  elsif p_kind='pvp' then select array(select distinct u from unnest(array[player_one_user_id,player_one_secondary_user_id,player_one_tertiary_user_id,player_two_user_id,player_two_secondary_user_id,player_two_tertiary_user_id])u where u is not null),status into participants,combat_status from public.v2_pvp_matches where id=p_combat_id for update; completed:=coalesce(combat_status,'')<>'active';
  else raise exception 'Tipo de combate inválido' using errcode='22023'; end if; if participants is null or not(v_user=any(participants)) then raise exception 'Combate não encontrado para este jogador' using errcode='42501'; end if; required:=cardinality(participants); if not completed then insert into public.v2_combat_surrender_votes(combat_kind,combat_id,user_id) values(p_kind,p_combat_id,v_user) on conflict do nothing; end if; select count(*)::int,bool_or(user_id=v_user) into votes,voted from public.v2_combat_surrender_votes where combat_kind=p_kind and combat_id=p_combat_id and user_id=any(participants);
  if not completed and votes>=required then if p_kind='arena' then update public.v2_arena_sessions set status='defeat',completed_at=now() where id=p_combat_id and status='open'; else select m.state into state from public.v2_pvp_matches m where m.id=p_combat_id; state:=coalesce(state,'{}'::jsonb)||jsonb_build_object('status','finished','winnerCharacterId',null,'message','Todos os jogadores confirmaram a desistência.'); log:=coalesce(state->'log','[]'::jsonb); state:=jsonb_set(state,'{log}',log||jsonb_build_array('Todos os jogadores confirmaram a desistência.'),true); update public.v2_pvp_matches m set state=state,status='finished',winner_character_id=null,version=m.version+1,updated_at=now(),finished_at=now() where m.id=p_combat_id and m.status='active'; end if; completed:=true; end if; return jsonb_build_object('completed',completed,'votes',coalesce(votes,0),'required',required,'voted',coalesce(voted,false)); end; $$;

revoke execute on function public.v2_pvp_queue_payload(public.v2_pvp_queue) from public,anon,authenticated;
revoke execute on function public.v2_get_pvp_party_state(uuid) from public,anon;
revoke execute on function public.v2_invite_pvp_partner(uuid,uuid) from public,anon;
revoke execute on function public.v2_respond_pvp_party_invite(uuid,boolean) from public,anon;
revoke execute on function public.v2_join_pvp_queue_v2(uuid,text) from public,anon;
revoke execute on function public.v2_poll_pvp_queue_v2(uuid) from public,anon;
revoke execute on function public.v2_cancel_pvp_queue(uuid) from public,anon;
revoke execute on function public.v2_disband_pvp_party(uuid) from public,anon;
revoke execute on function public.v2_respond_pvp_match(uuid,boolean) from public,anon;
revoke execute on function public.v2_get_pvp_match_state(uuid) from public,anon;
revoke execute on function public.v2_initialize_pvp_match(uuid,jsonb) from public,anon;
revoke execute on function public.v2_update_pvp_match_state(uuid,integer,jsonb) from public,anon;
revoke execute on function public.v2_get_pvp_team_roster(uuid) from public,anon;
revoke execute on function public.v2_expire_pvp_turn(uuid) from public,anon;
revoke execute on function public.v2_combat_surrender_status(text,uuid) from public,anon;
revoke execute on function public.v2_request_combat_surrender(text,uuid) from public,anon;
grant execute on function public.v2_get_pvp_party_state(uuid),public.v2_invite_pvp_partner(uuid,uuid),public.v2_respond_pvp_party_invite(uuid,boolean),public.v2_join_pvp_queue_v2(uuid,text),public.v2_poll_pvp_queue_v2(uuid),public.v2_cancel_pvp_queue(uuid),public.v2_disband_pvp_party(uuid),public.v2_respond_pvp_match(uuid,boolean),public.v2_get_pvp_match_state(uuid),public.v2_initialize_pvp_match(uuid,jsonb),public.v2_update_pvp_match_state(uuid,integer,jsonb),public.v2_get_pvp_team_roster(uuid),public.v2_expire_pvp_turn(uuid),public.v2_combat_surrender_status(text,uuid),public.v2_request_combat_surrender(text,uuid) to authenticated;
