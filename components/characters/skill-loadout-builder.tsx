import type { CharacterSheet } from "@/lib/content/characters";
import { applySkillBalanceOverride } from "@/lib/game/skill-loadout";
import { saveCharacterSkillLoadoutAction } from "@/app/personagens/[id]/loadout-actions";

function SkillMeta({ skill }: { skill: CharacterSheet["unlockedClassSkills"][number] }) {
  return (
    <span className="loadout-card__meta">
      <span>{skill.cost ? `Custo ${skill.cost}` : "Sem custo"}</span>
      <span>{skill.cooldown ? `Recarga ${skill.cooldown}` : "Sem recarga"}</span>
      <span>{skill.range ? `Alcance ${skill.range}` : skill.reachText}</span>
      {skill.area ? <span>Área {skill.area}</span> : null}
    </span>
  );
}

export function SkillLoadoutBuilder({ character }: { character: CharacterSheet }) {
  const selected = character.skillLoadout;
  const activeClassSkills = character.unlockedClassSkills.flatMap((skill) => {
    if (/passiva|rea[cç][aã]o/i.test(skill.type)) return [];
    const balanced = applySkillBalanceOverride(skill, character.skillBalanceOverrides);
    return balanced ? [balanced] : [];
  });
  const activeRaceSkills = character.unlockedRaceAbilities.flatMap((skill) => {
    if (/passiva|rea[cç][aã]o/i.test(skill.type)) return [];
    const balanced = applySkillBalanceOverride(skill, character.skillBalanceOverrides);
    return balanced ? [balanced] : [];
  });
  const talentKeys = new Set(character.talentSkills.map((skill) => skill.key));

  return (
    <form
      action={saveCharacterSkillLoadoutAction.bind(null, character.id)}
      className="skill-loadout"
    >
      <header className="skill-loadout__header">
        <div>
          <span className="eyebrow">Preparação de combate</span>
          <h2>Talentos e loadout</h2>
          <p>Somente as técnicas e passivas marcadas abaixo serão levadas para Arena, PvE e PvP.</p>
        </div>
        <div data-wl-status={selected.persisted ? "success" : "warning"}>
          {selected.persisted ? "Loadout personalizado ativo" : "Configuração legada preservada"}
        </div>
      </header>

      <div className="skill-loadout__columns">
        <fieldset data-wl-component="panel">
          <legend>Habilidades de classe</legend>
          <p>Escolha até {character.skillLoadoutLimits.classSkills}.</p>
          <div className="loadout-card-grid">
            {activeClassSkills.map((skill) => (
              <label className="loadout-card" key={skill.key}>
                <input
                  defaultChecked={selected.classSkillKeys.includes(skill.key)}
                  name="classSkillKey"
                  type="checkbox"
                  value={skill.key}
                />
                <span>
                  <small>{talentKeys.has(skill.key) ? "Talento do caminho" : skill.category}</small>
                  <strong>{skill.name}</strong>
                  <span>{skill.playerDescription}</span>
                  <SkillMeta skill={skill} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset data-wl-component="panel">
          <legend>Habilidades raciais</legend>
          <p>Escolha até {character.skillLoadoutLimits.raceSkills}.</p>
          <div className="loadout-card-grid">
            {activeRaceSkills.map((skill) => (
              <label className="loadout-card" key={skill.key}>
                <input
                  defaultChecked={selected.raceSkillKeys.includes(skill.key)}
                  name="raceSkillKey"
                  type="checkbox"
                  value={skill.key}
                />
                <span>
                  <small>{skill.category}</small>
                  <strong>{skill.name}</strong>
                  <span>{skill.playerDescription}</span>
                  <SkillMeta skill={skill} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="skill-loadout__columns">
        <fieldset data-wl-component="panel">
          <legend>Passivas selecionadas</legend>
          <p>Escolha até {character.skillLoadoutLimits.passives}.</p>
          <div className="loadout-card-grid">
            {character.passiveOptions.map((passive) => (
              <label className="loadout-card" key={passive.key}>
                <input
                  defaultChecked={selected.passiveKeys.includes(passive.key)}
                  name="passiveKey"
                  type="checkbox"
                  value={passive.key}
                />
                <span>
                  <small>{passive.source}</small>
                  <strong>{passive.name}</strong>
                  <span>{passive.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset data-wl-component="panel">
          <legend>Árvore de talentos</legend>
          <p>
            Ative até {character.skillLoadoutLimits.talents} nós em sequência. Um talento ativo
            ainda precisa ser equipado acima para aparecer no combate.
          </p>
          {character.talentSkills.length ? (
            <ol className="talent-tree">
              {character.talentSkills.map((skill, index) => (
                <li key={skill.key}>
                  <label className="loadout-card">
                    <input
                      defaultChecked={selected.talentKeys.includes(skill.key)}
                      name="talentKey"
                      type="checkbox"
                      value={skill.key}
                    />
                    <span>
                      <small>
                        Nó {index + 1} · nível {skill.level}
                      </small>
                      <strong>{skill.name}</strong>
                      <span>{skill.playerDescription}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ol>
          ) : (
            <div className="loadout-empty" data-wl-status="warning">
              Escolha e desbloqueie um caminho de classe para abrir esta árvore.
            </div>
          )}
        </fieldset>
      </div>

      <footer className="skill-loadout__footer">
        <p>Ataque básico, movimento e itens continuam disponíveis fora destes espaços.</p>
        <button data-wl-action="primary" type="submit">
          Salvar preparação de combate
        </button>
      </footer>
    </form>
  );
}
