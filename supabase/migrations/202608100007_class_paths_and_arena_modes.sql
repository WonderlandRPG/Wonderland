-- Caminhos de classe, modos de Arena e recompensas oficiais.
begin;

alter table public.v2_characters add column if not exists class_path_key text;

update public.v2_content content
set payload = jsonb_set(content.payload, '{paths}', source.entry->'paths', true), updated_at = now()
from jsonb_array_elements($paths$[{"slug":"barbaro","paths":[{"key":"berserker","name":"Berserker","description":"Converte Fúria em pressão ofensiva e execuções.","passive":{"name":"Doutrina: Berserker","description":"Dano físico aumenta enquanto a Fúria estiver acima da metade."},"skills":[]},{"key":"guardiao-totemico","name":"Guardião Totêmico","description":"Transforma Fúria em resistência e proteção do grupo.","passive":{"name":"Doutrina: Guardião Totêmico","description":"Ao receber dano elevado, concede proteção temporária a si."},"skills":[]}]},{"slug":"guerreiro","paths":[{"key":"mestre-de-armas","name":"Mestre de Armas","description":"Especialista em sequências técnicas e dano consistente.","passive":{"name":"Doutrina: Mestre de Armas","description":"Alternar habilidades ofensivas reduz a recarga da próxima técnica."},"skills":[]},{"key":"comandante","name":"Comandante","description":"Controla a linha de frente e fortalece aliados.","passive":{"name":"Doutrina: Comandante","description":"A primeira habilidade de suporte da rodada tem efeito ampliado."},"skills":[]}]},{"slug":"paladino","paths":[{"key":"juramento-da-luz","name":"Juramento da Luz","description":"Cura, escudos e proteção sagrada.","passive":{"name":"Doutrina: Juramento da Luz","description":"Escudos aplicados em alvos feridos ficam mais fortes."},"skills":[]},{"key":"juramento-da-vinganca","name":"Juramento da Vingança","description":"Persegue e pune inimigos marcados.","passive":{"name":"Doutrina: Juramento da Vingança","description":"Causa dano adicional contra o último inimigo que feriu um aliado."},"skills":[]}]},{"slug":"cavaleiro","paths":[{"key":"bastiao","name":"Bastião","description":"Defesa absoluta, provocação e bloqueio.","passive":{"name":"Doutrina: Bastião","description":"Recebe menos dano enquanto protege um aliado."},"skills":[]},{"key":"cavaleiro-negro","name":"Cavaleiro Negro","description":"Sacrifica proteção para aplicar pressão sombria.","passive":{"name":"Doutrina: Cavaleiro Negro","description":"Perder HP fortalece o próximo ataque físico."},"skills":[]}]},{"slug":"arqueiro","paths":[{"key":"atirador","name":"Atirador","description":"Precisão extrema e dano em alvo único.","passive":{"name":"Doutrina: Atirador","description":"Ataques a longa distância acumulam Precisão."},"skills":[]},{"key":"cacador","name":"Caçador","description":"Marcas, armadilhas e controle de território.","passive":{"name":"Doutrina: Caçador","description":"Alvos marcados não podem ocultar sua posição."},"skills":[]}]},{"slug":"assassino","paths":[{"key":"executor","name":"Executor","description":"Explosão de dano contra inimigos enfraquecidos.","passive":{"name":"Doutrina: Executor","description":"Dano aumenta contra alvos abaixo de 35% do HP."},"skills":[]},{"key":"sombra","name":"Sombra","description":"Mobilidade, furtividade e ataques de oportunidade.","passive":{"name":"Doutrina: Sombra","description":"Reposicionar-se fortalece o próximo golpe."},"skills":[]}]},{"slug":"ladino","paths":[{"key":"duelista","name":"Duelista","description":"Combate ágil, contra-ataques e precisão.","passive":{"name":"Doutrina: Duelista","description":"Esquivar habilita uma reação ofensiva."},"skills":[]},{"key":"trapaceiro","name":"Trapaceiro","description":"Debuffs, itens e manipulação do campo.","passive":{"name":"Doutrina: Trapaceiro","description":"O primeiro item de cada combate não consome a ação de item."},"skills":[]}]},{"slug":"monge","paths":[{"key":"punho-de-ferro","name":"Punho de Ferro","description":"Combos físicos e quebra de postura.","passive":{"name":"Doutrina: Punho de Ferro","description":"Golpes consecutivos aumentam o dano do combo."},"skills":[]},{"key":"caminho-espiritual","name":"Caminho Espiritual","description":"Ki defensivo, cura e purificação.","passive":{"name":"Doutrina: Caminho Espiritual","description":"Gastar Ki em suporte recupera uma pequena quantidade de HP."},"skills":[]}]},{"slug":"mago","paths":[{"key":"elementalista","name":"Elementalista","description":"Domina áreas e interações elementais.","passive":{"name":"Doutrina: Elementalista","description":"Alternar elementos aplica uma reação elemental adicional."},"skills":[]},{"key":"arcanista","name":"Arcanista","description":"Controle de Mana, escudos e magia pura.","passive":{"name":"Doutrina: Arcanista","description":"Ao terminar a rodada com Mana, recebe escudo arcano."},"skills":[]}]},{"slug":"feiticeiro","paths":[{"key":"linhagem-draconica","name":"Linhagem Dracônica","description":"Poder elemental estável e resistência mágica.","passive":{"name":"Doutrina: Linhagem Dracônica","description":"Habilidades elementais concedem resistência temporária."},"skills":[]},{"key":"caos-arcano","name":"Caos Arcano","description":"Magia imprevisível de alto risco e recompensa.","passive":{"name":"Doutrina: Caos Arcano","description":"Efeitos com chance bem-sucedidos geram poder adicional."},"skills":[]}]},{"slug":"bruxo","paths":[{"key":"pacto-infernal","name":"Pacto Infernal","description":"Dano contínuo, fogo e contratos de poder.","passive":{"name":"Doutrina: Pacto Infernal","description":"Inimigos com debuff recebem dano mágico adicional."},"skills":[]},{"key":"pacto-abissal","name":"Pacto Abissal","description":"Controle, medo e enfraquecimento.","passive":{"name":"Doutrina: Pacto Abissal","description":"Aplicar controle recupera parte do recurso de pacto."},"skills":[]}]},{"slug":"clerigo","paths":[{"key":"dominio-da-vida","name":"Domínio da Vida","description":"Cura intensiva e remoção de efeitos negativos.","passive":{"name":"Doutrina: Domínio da Vida","description":"A primeira cura em um alvo ferido é ampliada."},"skills":[]},{"key":"dominio-da-guerra","name":"Domínio da Guerra","description":"Bênçãos ofensivas e combate sagrado.","passive":{"name":"Doutrina: Domínio da Guerra","description":"Curar um aliado fortalece o próximo ataque do Clérigo."},"skills":[]}]},{"slug":"druida","paths":[{"key":"circulo-da-lua","name":"Círculo da Lua","description":"Transformações e combate bestial.","passive":{"name":"Doutrina: Círculo da Lua","description":"Transformações preservam parte dos efeitos defensivos ativos."},"skills":[]},{"key":"circulo-da-terra","name":"Círculo da Terra","description":"Controle natural, cura e terreno.","passive":{"name":"Doutrina: Círculo da Terra","description":"Efeitos de terreno duram uma rodada adicional."},"skills":[]}]},{"slug":"bardo","paths":[{"key":"colegio-da-guerra","name":"Colégio da Guerra","description":"Inspiração ofensiva e liderança de batalha.","passive":{"name":"Doutrina: Colégio da Guerra","description":"Inspirar um aliado também fortalece o próprio Bardo."},"skills":[]},{"key":"colegio-do-glamour","name":"Colégio do Glamour","description":"Encanto, ilusão e controle social.","passive":{"name":"Doutrina: Colégio do Glamour","description":"O primeiro controle aplicado em combate tem chance aumentada."},"skills":[]}]}]$paths$::jsonb) source(entry)
where content.content_type = 'class' and content.slug = source.entry->>'slug';

alter table public.v2_characters disable trigger v2_characters_guard;
update public.v2_characters character
set class_path_key = content.payload->'paths'->0->>'key'
from public.v2_content content
where content.id = character.class_id and character.class_path_key is null;
alter table public.v2_characters enable trigger v2_characters_guard;

drop function if exists public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text);
create function public.v2_admin_update_character(
  p_character_id uuid, p_name text, p_xp bigint, p_gold bigint, p_image_url text,
  p_kingdom text, p_adventure_rank text, p_class_path_key text
) returns public.v2_characters language plpgsql security definer set search_path = '' as $$
declare result public.v2_characters; clean_url text; chosen_class uuid;
begin
  if not (select public.v2_is_admin()) then raise exception 'Acesso negado' using errcode='42501'; end if;
  if char_length(trim(p_name)) not between 2 and 32 or p_xp < 0 or p_gold < 0 then raise exception 'Dados inválidos'; end if;
  if p_kingdom not in ('aokigahara','oymyakon','lesedi','namida','skypiece') then raise exception 'Reino inválido'; end if;
  if p_adventure_rank not in ('E','D','C','B','A','S','EX') then raise exception 'Rank inválido'; end if;
  select class_id into chosen_class from public.v2_characters where id=p_character_id;
  if not exists (select 1 from public.v2_content c, jsonb_array_elements(c.payload->'paths') path where c.id=chosen_class and path->>'key'=p_class_path_key) then raise exception 'Caminho inválido'; end if;
  clean_url := nullif(trim(p_image_url),'');
  if clean_url is not null and clean_url !~ '^https?://' then raise exception 'Link inválido'; end if;
  update public.v2_characters set name=trim(p_name),xp=p_xp,gold=p_gold,image_url=clean_url,kingdom=p_kingdom,adventure_rank=p_adventure_rank,class_path_key=p_class_path_key,updated_at=now() where id=p_character_id returning * into result;
  if result.id is null then raise exception 'Personagem não encontrado' using errcode='P0002'; end if;
  insert into public.v2_admin_history(actor_id,action,target_type,target_id,details) values ((select auth.uid()),'character.updated','character',p_character_id::text,jsonb_build_object('name',p_name,'xp',p_xp,'gold',p_gold,'class_path_key',p_class_path_key));
  return result;
end; $$;
revoke execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) from public,anon;
grant execute on function public.v2_admin_update_character(uuid,text,bigint,bigint,text,text,text,text) to authenticated;

create table if not exists public.v2_arena_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.v2_characters(id) on delete cascade,
  mode text not null check(mode in ('pve','pvp')), status text not null default 'open' check(status in ('open','victory','defeat','abandoned')),
  created_at timestamptz not null default now(), completed_at timestamptz
);
alter table public.v2_arena_sessions enable row level security;
drop policy if exists "arena_sessions_select_own" on public.v2_arena_sessions;
create policy "arena_sessions_select_own" on public.v2_arena_sessions for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.v2_arena_sessions from anon;
grant select on public.v2_arena_sessions to authenticated;

create or replace function public.v2_start_arena_session(p_character_id uuid,p_mode text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if (select auth.uid()) is null or p_mode not in ('pve','pvp') or not exists(select 1 from public.v2_characters where id=p_character_id and user_id=(select auth.uid())) then raise exception 'Sessão inválida' using errcode='42501'; end if;
  update public.v2_arena_sessions set status='abandoned',completed_at=now() where user_id=(select auth.uid()) and character_id=p_character_id and mode=p_mode and status='open';
  insert into public.v2_arena_sessions(user_id,character_id,mode) values((select auth.uid()),p_character_id,p_mode) returning id into result;
  return result;
end; $$;

create or replace function public.v2_claim_arena_victory(p_session_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare session_row public.v2_arena_sessions; character_row public.v2_characters; reward_xp bigint; reward_wg bigint;
begin
  select * into session_row from public.v2_arena_sessions where id=p_session_id and user_id=(select auth.uid()) and status='open' for update;
  if session_row.id is null or session_row.created_at < now()-interval '2 hours' then raise exception 'Sessão inválida ou encerrada' using errcode='42501'; end if;
  select * into character_row from public.v2_characters where id=session_row.character_id and user_id=(select auth.uid()) for update;
  reward_xp := case character_row.adventure_rank when 'E' then 500 when 'D' then 1000 when 'C' then 2000 when 'B' then 4000 when 'A' then 8000 when 'S' then 15000 when 'EX' then 30000 end;
  reward_wg := case character_row.adventure_rank when 'E' then 100 when 'D' then 250 when 'C' then 600 when 'B' then 1500 when 'A' then 4000 when 'S' then 10000 when 'EX' then 25000 end;
  update public.v2_characters set xp=xp+reward_xp,gold=gold+reward_wg,updated_at=now() where id=character_row.id;
  update public.v2_arena_sessions set status='victory',completed_at=now() where id=session_row.id;
  return jsonb_build_object('xp',reward_xp,'wg',reward_wg,'rank',character_row.adventure_rank,'character_id',character_row.id);
end; $$;
revoke execute on function public.v2_start_arena_session(uuid,text),public.v2_claim_arena_victory(uuid) from public,anon;
grant execute on function public.v2_start_arena_session(uuid,text),public.v2_claim_arena_victory(uuid) to authenticated;

commit;
