import { TrainingArena } from "@/components/arena/training-arena";
import { PlayerNav } from "@/components/player-nav";
import { getCharacterSheets } from "@/lib/content/characters";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { defaultCombatRules } from "@/lib/game/combat";
import { prepareArenaSkill } from "@/lib/game/classes";

export const metadata = { title: "Arena de Treinamento" };
export const dynamic = "force-dynamic";

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<{ personagem?: string }>;
}) {
  const { account, characterId } = await requireActiveCharacter("/arena");
  const [characters, query] = await Promise.all([getCharacterSheets(account.id), searchParams]);

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        <TrainingArena
          characters={characters
            .filter((character) => character.id === characterId)
            .map((character) => ({
              id: character.id,
              name: character.name,
              raceName: character.race.name,
              className: character.characterClass.name,
              baseHp: character.race.payload.baseHp,
              baseMana: character.race.payload.baseMana,
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
                ...character.race.payload.traits,
                ...character.race.payload.mechanics,
              ],
              items: character.inventory
                .filter((item) => /consum|poção|pocao/i.test(item.category))
                .map((item) => ({ id: item.id, name: item.name, description: item.description })),
            }))}
          initialCharacterId={query.personagem}
          rules={defaultCombatRules}
        />
      </div>
    </main>
  );
}
