import { TrainingArena } from "@/components/arena/training-arena";
import { PlayerNav } from "@/components/player-nav";
import {
  getCharacterSheet,
  getCharacterSheets,
  type CharacterSheet,
} from "@/lib/content/characters";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { defaultCombatRules } from "@/lib/game/combat";
import { prepareArenaSkill } from "@/lib/game/classes";
import { PvpLobby } from "@/components/arena/pvp-lobby";
import { arenaRewards, type ArenaMode } from "@/lib/game/arena";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBasicAttackRange } from "@/lib/game/equipment";

export const metadata = { title: "Arena de Treinamento" };
export const dynamic = "force-dynamic";

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<{ personagem?: string; modo?: string; partida?: string }>;
}) {
  const { account, characterId } = await requireActiveCharacter("/arena");
  const [characters, query] = await Promise.all([getCharacterSheets(account.id), searchParams]);
  const mode = (["training", "pve", "pvp"] as const).includes(query.modo as ArenaMode)
    ? (query.modo as ArenaMode)
    : null;
  const activeCharacter = characters.find((character) => character.id === characterId);
  const client = mode === "pve" ? await createServerSupabaseClient() : null;
  const arenaSessionResult =
    client && activeCharacter
      ? await client.rpc("v2_start_arena_session", {
          p_character_id: activeCharacter.id,
          p_mode: "pve",
        })
      : { data: null };
  const arenaSessionId = arenaSessionResult.data;
  const arenaSessionError = "error" in arenaSessionResult ? arenaSessionResult.error : null;
  const pvpClient = mode === "pvp" && query.partida ? await createServerSupabaseClient() : null;
  const pvpQueueResult =
    pvpClient && query.partida
      ? await pvpClient
          .from("v2_pvp_queue")
          .select("opponent_character_id,match_id,status")
          .eq("match_id", query.partida)
          .eq("user_id", account.id)
          .eq("status", "matched")
          .maybeSingle()
      : { data: null };
  const pvpQueue = pvpQueueResult.data;
  const opponent = pvpQueue?.opponent_character_id
    ? await getCharacterSheet(pvpQueue.opponent_character_id)
    : null;
  const pvpMatchError =
    query.partida && (!pvpQueue || ("error" in pvpQueueResult && pvpQueueResult.error))
      ? "A partida PvP não pôde ser carregada. Ela pode ter expirado ou sido encerrada."
      : pvpQueue?.opponent_character_id && !opponent
        ? "O adversário foi encontrado, mas a ficha dele não pôde ser carregada."
        : null;
  const toArenaCharacter = (character: CharacterSheet) => ({
    id: character.id,
    name: character.name,
    level: character.level,
    adventureRank: character.adventure_rank,
    imageUrl: character.image_url ?? "",
    raceName: character.race.name,
    className: character.characterClass.name,
    baseHp: character.race.payload.baseHp,
    baseMana: character.race.payload.baseMana,
    classResource: character.characterClass.payload.resource,
    raceResource: character.race.payload.resource,
    usesMana: [...character.unlockedClassSkills, ...character.unlockedRaceAbilities].some(
      (skill) => skill.resource === "mana",
    ),
    basicAttackRange: getBasicAttackRange(character.inventory),
    attributes: character.stats.attributes,
    skills: character.unlockedClassSkills
      .filter((skill) => !/passiva/i.test(skill.type))
      .map(prepareArenaSkill),
    raceAbilities: character.unlockedRaceAbilities,
    combatLore: [
      {
        name: character.characterClass.payload.passive.name,
        description: character.characterClass.payload.passive.description,
      },
      {
        name: character.characterClass.payload.mechanic.name,
        description: character.characterClass.payload.mechanic.description,
      },
      ...character.characterClass.payload.paths
        .filter((path) => path.key === character.class_path_key)
        .map((path) => ({ name: path.passive.name, description: path.passive.description })),
      ...character.race.payload.traits,
      ...character.race.payload.mechanics,
      ...character.inventory
        .filter((item) => item.equippedSlot)
        .flatMap((item) =>
          item.specialEffects.map((effect) => ({
            name: effect.name,
            description: effect.description,
          })),
        ),
    ],
    equipmentEffects: character.inventory
      .filter((item) => item.equippedSlot)
      .flatMap((item) => item.specialEffects),
    items: character.inventory
      .filter((item) => /consum|poção|pocao/i.test(item.category))
      .map((item) => ({ id: item.id, name: item.name, description: item.description })),
  });

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        {!mode ? (
          <section className="arena-mode-select">
            <header>
              <span className="eyebrow">Portal de combate</span>
              <h1>Escolha seu modo</h1>
              <p>Cada modalidade usa a ficha e os equipamentos do personagem selecionado.</p>
            </header>
            <div>
              <Link href="/arena?modo=training">
                <span>修</span>
                <small>Sem recompensas</small>
                <strong>Treino</strong>
                <p>Teste habilidades e sequências contra o Boneco Rúnico.</p>
                <b>Entrar →</b>
              </Link>
              <Link href="/arena?modo=pve">
                <span>獣</span>
                <small>10 monstros adaptativos</small>
                <strong>PvE</strong>
                <p>Enfrente um monstro do seu nível e com o mesmo total de atributos.</p>
                <b>
                  {activeCharacter
                    ? `+${arenaRewards[activeCharacter.adventure_rank as keyof typeof arenaRewards].xp.toLocaleString("pt-BR")} XP`
                    : "Entrar"}{" "}
                  →
                </b>
              </Link>
              <Link href="/arena?modo=pvp">
                <span>対</span>
                <small>Estrutura competitiva</small>
                <strong>PvP</strong>
                <p>Entre na fila para duelos balanceados entre aventureiros.</p>
                <b>Ver fila →</b>
              </Link>
            </div>
          </section>
        ) : null}
        {mode === "pve" && arenaSessionError ? (
          <section className="arena-load-error" role="alert">
            <span>!</span>
            <div>
              <strong>Não foi possível iniciar o PvE</strong>
              <p>A sessão de combate não foi criada. Tente novamente em alguns instantes.</p>
            </div>
            <Link href="/arena">Voltar aos modos</Link>
          </section>
        ) : null}
        {mode === "pvp" && pvpMatchError ? (
          <section className="arena-load-error" role="alert">
            <span>!</span>
            <div>
              <strong>Partida PvP indisponível</strong>
              <p>{pvpMatchError}</p>
            </div>
            <Link href="/arena?modo=pvp">Voltar para a fila</Link>
          </section>
        ) : null}
        {mode === "pvp" && activeCharacter && !query.partida && !opponent ? (
          <PvpLobby
            characterId={activeCharacter.id}
            characterName={activeCharacter.name}
            rank={activeCharacter.adventure_rank}
          />
        ) : null}
        {mode && !(mode === "pve" && arenaSessionError) && (mode !== "pvp" || opponent) ? (
          <>
            <Link className="arena-mode-back" href="/arena">
              ← Trocar modo
            </Link>
            <TrainingArena
              characters={characters
                .filter((character) => character.id === characterId)
                .map(toArenaCharacter)}
              initialCharacterId={query.personagem}
              mode={mode}
              monsterIndex={
                typeof arenaSessionId === "string"
                  ? Number.parseInt(arenaSessionId.replaceAll("-", "").slice(-4), 16) % 10
                  : 0
              }
              sessionId={typeof arenaSessionId === "string" ? arenaSessionId : undefined}
              opponent={opponent ? toArenaCharacter(opponent) : undefined}
              rules={defaultCombatRules}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
