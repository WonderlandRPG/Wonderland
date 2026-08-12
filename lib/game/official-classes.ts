import { classPayloadSchema, type AttributeKey } from "@/lib/game/schemas";

type SkillKind = "damage" | "heal" | "shield" | "utility";
type DamageType = "physical" | "magic" | "true" | "none";
type Target = "self" | "ally" | "enemy" | "area";

interface SkillSeed {
  key: string;
  name: string;
  level: number;
  type?: "Ativa" | "Passiva" | "Reação";
  category: string;
  kind: SkillKind;
  damageType?: DamageType;
  target: Target;
  cost: number;
  cooldown: number;
  range: number;
  area?: number;
  duration?: number;
  attribute?: AttributeKey;
  multiplier?: number;
  operation: string;
  status?: string;
  chance?: number;
  stacks?: number;
  maxStacks?: number;
  condition?: string;
  modifiers?: Array<{ attribute: AttributeKey; value: number }>;
  description: string;
}

interface ClassSeed {
  name: string;
  slug: string;
  difficulty: number;
  specialization: string;
  description: string;
  primary: AttributeKey[];
  resource: {
    name: string;
    initial: number;
    maximum: number;
    generation: string;
    consumption: string;
  };
  passive: SkillSeed;
  skills: SkillSeed[];
}

type PathTechniqueMode = "damage" | "shield" | "buff" | "debuff" | "heal" | "control" | "mobility";
type PathTechniqueSeed = { name: string; mode: PathTechniqueMode; flavor: string };

const pathTechniques: Record<string, [PathTechniqueSeed, PathTechniqueSeed]> = {
  berserker: [
    { name: "Frenesi Carmesim", mode: "buff", flavor: "Transforma a dor em força bruta." },
    {
      name: "Ruptura do Carrasco",
      mode: "damage",
      flavor: "Desfere um golpe decisivo contra o alvo.",
    },
  ],
  "guardiao-totemico": [
    { name: "Totem do Urso", mode: "shield", flavor: "Invoca a proteção dos ancestrais." },
    { name: "Clamor Ancestral", mode: "buff", flavor: "Fortalece o corpo com poder totêmico." },
  ],
  "mestre-de-armas": [
    {
      name: "Corte de Transição",
      mode: "damage",
      flavor: "Conecta posturas em um único ataque técnico.",
    },
    {
      name: "Arsenal Perfeito",
      mode: "buff",
      flavor: "Entra na postura ideal para o próximo confronto.",
    },
  ],
  comandante: [
    {
      name: "Ordem de Avanço",
      mode: "buff",
      flavor: "Emite uma ordem que aumenta o poder ofensivo.",
    },
    {
      name: "Formação Inabalável",
      mode: "shield",
      flavor: "Organiza a linha de frente contra o impacto inimigo.",
    },
  ],
  "juramento-da-luz": [
    { name: "Luz Restauradora", mode: "heal", flavor: "Canaliza a luz para restaurar um aliado." },
    {
      name: "Égide do Juramento",
      mode: "shield",
      flavor: "Concede uma proteção sagrada duradoura.",
    },
  ],
  "juramento-da-vinganca": [
    {
      name: "Marca do Culpado",
      mode: "debuff",
      flavor: "Condena o inimigo que ameaça seus aliados.",
    },
    {
      name: "Sentença Radiante",
      mode: "damage",
      flavor: "Executa a sentença do juramento em luz concentrada.",
    },
  ],
  bastiao: [
    {
      name: "Muralha Viva",
      mode: "shield",
      flavor: "Transforma a própria armadura em uma fortaleza.",
    },
    {
      name: "Desafio Irrecusável",
      mode: "control",
      flavor: "Obriga o inimigo a enfrentar o Bastião.",
    },
  ],
  "cavaleiro-negro": [
    {
      name: "Lâmina do Sacrifício",
      mode: "damage",
      flavor: "Converte vitalidade perdida em um golpe sombrio.",
    },
    {
      name: "Armadura Profana",
      mode: "buff",
      flavor: "Aceita a corrupção para ampliar o poder físico.",
    },
  ],
  atirador: [
    {
      name: "Mira Implacável",
      mode: "buff",
      flavor: "Estabiliza a postura e elimina qualquer hesitação.",
    },
    {
      name: "Disparo Perfurante",
      mode: "damage",
      flavor: "Dispara um projétil de altíssima precisão.",
    },
  ],
  cacador: [
    { name: "Marca da Presa", mode: "debuff", flavor: "Expõe a presa e seus pontos vulneráveis." },
    {
      name: "Armadilha de Contenção",
      mode: "control",
      flavor: "Prende o alvo no terreno preparado.",
    },
  ],
  executor: [
    { name: "Selo da Execução", mode: "debuff", flavor: "Marca o alvo para um fim rápido." },
    { name: "Golpe Terminal", mode: "damage", flavor: "Ataca o ponto vital revelado pelo selo." },
  ],
  sombra: [
    {
      name: "Passo Sombrio",
      mode: "mobility",
      flavor: "Desaparece e reaparece em posição vantajosa.",
    },
    { name: "Lâmina do Ocaso", mode: "damage", flavor: "Ataca ao emergir da escuridão." },
  ],
  duelista: [
    {
      name: "Convite ao Duelo",
      mode: "debuff",
      flavor: "Desafia o alvo e quebra sua concentração.",
    },
    {
      name: "Resposta Perfeita",
      mode: "damage",
      flavor: "Transforma uma abertura em contra-ataque preciso.",
    },
  ],
  trapaceiro: [
    {
      name: "Bolsa de Truques",
      mode: "debuff",
      flavor: "Usa um artifício para enfraquecer o adversário.",
    },
    {
      name: "Saída Ensaiada",
      mode: "mobility",
      flavor: "Escapa da ameaça antes que o plano seja descoberto.",
    },
  ],
  "punho-de-ferro": [
    {
      name: "Quebra-Postura",
      mode: "debuff",
      flavor: "Abala a guarda do inimigo com um impacto concentrado.",
    },
    {
      name: "Cem Punhos",
      mode: "damage",
      flavor: "Conclui o combo com uma sequência devastadora.",
    },
  ],
  "caminho-espiritual": [
    { name: "Sopro de Ki", mode: "heal", flavor: "Conduz energia vital para fechar ferimentos." },
    {
      name: "Círculo de Pureza",
      mode: "shield",
      flavor: "Forma uma barreira espiritual contra agressões.",
    },
  ],
  elementalista: [
    {
      name: "Convergência Elemental",
      mode: "debuff",
      flavor: "Mistura elementos para romper resistências.",
    },
    {
      name: "Cataclismo Primordial",
      mode: "damage",
      flavor: "Libera uma colisão concentrada de forças elementais.",
    },
  ],
  arcanista: [
    { name: "Barreira Arcana", mode: "shield", flavor: "Condensa energia arcana em proteção." },
    { name: "Ruptura Arcana", mode: "damage", flavor: "Desmonta a defesa inimiga com magia pura." },
  ],
  "linhagem-draconica": [
    {
      name: "Escamas Ancestrais",
      mode: "shield",
      flavor: "Manifesta a resistência da linhagem dracônica.",
    },
    {
      name: "Sopro do Ancestral",
      mode: "damage",
      flavor: "Expele o poder elemental herdado do sangue dracônico.",
    },
  ],
  "caos-arcano": [
    {
      name: "Distorção Instável",
      mode: "debuff",
      flavor: "Desorganiza a energia do alvo com magia caótica.",
    },
    {
      name: "Surto Impossível",
      mode: "damage",
      flavor: "Força o caos a assumir uma forma destrutiva.",
    },
  ],
  "pacto-infernal": [
    {
      name: "Contrato em Chamas",
      mode: "debuff",
      flavor: "Grava no alvo uma cláusula de sofrimento.",
    },
    {
      name: "Cobrança Infernal",
      mode: "damage",
      flavor: "Cobra o preço do contrato com fogo profano.",
    },
  ],
  "pacto-abissal": [
    {
      name: "Olhar do Abismo",
      mode: "control",
      flavor: "Impõe ao alvo uma visão paralisante do vazio.",
    },
    {
      name: "Maré do Vazio",
      mode: "damage",
      flavor: "Faz o abismo atravessar o campo de batalha.",
    },
  ],
  "dominio-da-vida": [
    { name: "Oração Revigorante", mode: "heal", flavor: "Restaura a força vital com uma prece." },
    {
      name: "Milagre da Vigília",
      mode: "shield",
      flavor: "Mantém o alvo de pé sob proteção divina.",
    },
  ],
  "dominio-da-guerra": [
    { name: "Bênção do Confronto", mode: "buff", flavor: "Consagra o combatente para a batalha." },
    {
      name: "Martelo da Fé",
      mode: "damage",
      flavor: "Concentra a convicção em um impacto sagrado.",
    },
  ],
  "circulo-da-lua": [
    { name: "Pele da Fera", mode: "buff", flavor: "Assume aspectos predatórios sob a luz lunar." },
    {
      name: "Investida Bestial",
      mode: "damage",
      flavor: "Avança com a força de uma fera transformada.",
    },
  ],
  "circulo-da-terra": [
    { name: "Raízes Profundas", mode: "control", flavor: "Faz o terreno aprisionar o inimigo." },
    {
      name: "Seiva Ancestral",
      mode: "heal",
      flavor: "Canaliza a vitalidade da terra para um aliado.",
    },
  ],
  "colegio-da-guerra": [
    { name: "Marcha dos Heróis", mode: "buff", flavor: "Entoa um ritmo que conduz ao ataque." },
    {
      name: "Acorde de Impacto",
      mode: "damage",
      flavor: "Transforma música em uma onda ofensiva.",
    },
  ],
  "colegio-do-glamour": [
    {
      name: "Olhar Irresistível",
      mode: "control",
      flavor: "Captura a atenção do alvo com encanto sobrenatural.",
    },
    {
      name: "Palco de Ilusões",
      mode: "debuff",
      flavor: "Cerca o inimigo de imagens que confundem seus sentidos.",
    },
  ],
};

const classPaths: Record<
  string,
  Array<{ key: string; name: string; description: string; passive: string }>
> = {
  barbaro: [
    {
      key: "berserker",
      name: "Berserker",
      description: "Converte Fúria em pressão ofensiva e execuções.",
      passive: "Dano físico aumenta enquanto a Fúria estiver acima da metade.",
    },
    {
      key: "guardiao-totemico",
      name: "Guardião Totêmico",
      description: "Transforma Fúria em resistência e proteção do grupo.",
      passive: "Ao receber dano elevado, concede proteção temporária a si.",
    },
  ],
  guerreiro: [
    {
      key: "mestre-de-armas",
      name: "Mestre de Armas",
      description: "Especialista em sequências técnicas e dano consistente.",
      passive: "Alternar habilidades ofensivas reduz a recarga da próxima técnica.",
    },
    {
      key: "comandante",
      name: "Comandante",
      description: "Controla a linha de frente e fortalece aliados.",
      passive: "A primeira habilidade de suporte da rodada tem efeito ampliado.",
    },
  ],
  paladino: [
    {
      key: "juramento-da-luz",
      name: "Juramento da Luz",
      description: "Cura, escudos e proteção sagrada.",
      passive: "Escudos aplicados em alvos feridos ficam mais fortes.",
    },
    {
      key: "juramento-da-vinganca",
      name: "Juramento da Vingança",
      description: "Persegue e pune inimigos marcados.",
      passive: "Causa dano adicional contra o último inimigo que feriu um aliado.",
    },
  ],
  cavaleiro: [
    {
      key: "bastiao",
      name: "Bastião",
      description: "Defesa absoluta, provocação e bloqueio.",
      passive: "Recebe menos dano enquanto protege um aliado.",
    },
    {
      key: "cavaleiro-negro",
      name: "Cavaleiro Negro",
      description: "Sacrifica proteção para aplicar pressão sombria.",
      passive: "Perder HP fortalece o próximo ataque físico.",
    },
  ],
  arqueiro: [
    {
      key: "atirador",
      name: "Atirador",
      description: "Precisão extrema e dano em alvo único.",
      passive: "Ataques a longa distância acumulam Precisão.",
    },
    {
      key: "cacador",
      name: "Caçador",
      description: "Marcas, armadilhas e controle de território.",
      passive: "Alvos marcados não podem ocultar sua posição.",
    },
  ],
  assassino: [
    {
      key: "executor",
      name: "Executor",
      description: "Explosão de dano contra inimigos enfraquecidos.",
      passive: "Dano aumenta contra alvos abaixo de 35% do HP.",
    },
    {
      key: "sombra",
      name: "Sombra",
      description: "Mobilidade, furtividade e ataques de oportunidade.",
      passive: "Reposicionar-se fortalece o próximo golpe.",
    },
  ],
  ladino: [
    {
      key: "duelista",
      name: "Duelista",
      description: "Combate ágil, contra-ataques e precisão.",
      passive: "Esquivar habilita uma reação ofensiva.",
    },
    {
      key: "trapaceiro",
      name: "Trapaceiro",
      description: "Debuffs, itens e manipulação do campo.",
      passive: "O primeiro item de cada combate não consome a ação de item.",
    },
  ],
  monge: [
    {
      key: "punho-de-ferro",
      name: "Punho de Ferro",
      description: "Combos físicos e quebra de postura.",
      passive: "Golpes consecutivos aumentam o dano do combo.",
    },
    {
      key: "caminho-espiritual",
      name: "Caminho Espiritual",
      description: "Ki defensivo, cura e purificação.",
      passive: "Gastar Ki em suporte recupera uma pequena quantidade de HP.",
    },
  ],
  mago: [
    {
      key: "elementalista",
      name: "Elementalista",
      description: "Domina áreas e interações elementais.",
      passive: "Alternar elementos aplica uma reação elemental adicional.",
    },
    {
      key: "arcanista",
      name: "Arcanista",
      description: "Controle de energia arcana, escudos e magia pura.",
      passive: "Ao terminar a rodada com Energia Arcana, recebe escudo arcano.",
    },
  ],
  feiticeiro: [
    {
      key: "linhagem-draconica",
      name: "Linhagem Dracônica",
      description: "Poder elemental estável e resistência mágica.",
      passive: "Habilidades elementais concedem resistência temporária.",
    },
    {
      key: "caos-arcano",
      name: "Caos Arcano",
      description: "Magia imprevisível de alto risco e recompensa.",
      passive: "Efeitos com chance bem-sucedidos geram poder adicional.",
    },
  ],
  bruxo: [
    {
      key: "pacto-infernal",
      name: "Pacto Infernal",
      description: "Dano contínuo, fogo e contratos de poder.",
      passive: "Inimigos com debuff recebem dano mágico adicional.",
    },
    {
      key: "pacto-abissal",
      name: "Pacto Abissal",
      description: "Controle, medo e enfraquecimento.",
      passive: "Aplicar controle recupera parte do recurso de pacto.",
    },
  ],
  clerigo: [
    {
      key: "dominio-da-vida",
      name: "Domínio da Vida",
      description: "Cura intensiva e remoção de efeitos negativos.",
      passive: "A primeira cura em um alvo ferido é ampliada.",
    },
    {
      key: "dominio-da-guerra",
      name: "Domínio da Guerra",
      description: "Bênçãos ofensivas e combate sagrado.",
      passive: "Curar um aliado fortalece o próximo ataque do Clérigo.",
    },
  ],
  druida: [
    {
      key: "circulo-da-lua",
      name: "Círculo da Lua",
      description: "Transformações e combate bestial.",
      passive: "Transformações preservam parte dos efeitos defensivos ativos.",
    },
    {
      key: "circulo-da-terra",
      name: "Círculo da Terra",
      description: "Controle natural, cura e terreno.",
      passive: "Efeitos de terreno duram uma rodada adicional.",
    },
  ],
  bardo: [
    {
      key: "colegio-da-guerra",
      name: "Colégio da Guerra",
      description: "Inspiração ofensiva e liderança de batalha.",
      passive: "Inspirar um aliado também fortalece o próprio Bardo.",
    },
    {
      key: "colegio-do-glamour",
      name: "Colégio do Glamour",
      description: "Encanto, ilusão e controle social.",
      passive: "O primeiro controle aplicado em combate tem chance aumentada.",
    },
  ],
};

function buildPathSkill(
  pathKey: string,
  seed: PathTechniqueSeed,
  index: number,
  resourceName: string,
  primary: AttributeKey[],
) {
  const level = index === 0 ? 15 : 45;
  const strong = index === 1;
  const attribute =
    seed.mode === "shield"
      ? primary.includes("DEF")
        ? "DEF"
        : "RES"
      : seed.mode === "heal"
        ? primary.includes("ARC")
          ? "ARC"
          : "INT"
        : primary[0];
  const multiplier = strong ? 1.8 : 1.25;
  const value = strong ? 15 : 10;
  const duration =
    seed.mode === "control" ? 1 : seed.mode === "damage" || seed.mode === "mobility" ? 0 : 2;
  const target =
    seed.mode === "heal"
      ? "ally"
      : seed.mode === "damage" || seed.mode === "debuff" || seed.mode === "control"
        ? "enemy"
        : "self";
  const operation =
    seed.mode === "damage"
      ? "DAMAGE"
      : seed.mode === "shield"
        ? "SHIELD"
        : seed.mode === "heal"
          ? "HEAL"
          : seed.mode === "buff"
            ? "BUFF"
            : seed.mode === "debuff"
              ? "DEBUFF"
              : seed.mode === "control"
                ? "APPLY_STATUS"
                : "MOVE";
  const category =
    seed.mode === "damage"
      ? "Dano"
      : seed.mode === "shield"
        ? "Escudo"
        : seed.mode === "heal"
          ? "Cura"
          : seed.mode === "control"
            ? "Controle"
            : seed.mode === "mobility"
              ? "Mobilidade"
              : seed.mode === "buff"
                ? "Buff"
                : "Debuff";
  const detail =
    seed.mode === "damage"
      ? `Causa dano ${multiplier}x ${attribute}.`
      : seed.mode === "shield"
        ? `Concede escudo de ${multiplier}x ${attribute} por ${duration} rodadas.`
        : seed.mode === "heal"
          ? `Cura ${multiplier}x ${attribute}.`
          : seed.mode === "buff"
            ? `Aumenta ${attribute} em ${value} por ${duration} rodadas.`
            : seed.mode === "debuff"
              ? `Reduz ${attribute} do alvo em ${value} por ${duration} rodadas.`
              : seed.mode === "control"
                ? `Aplica ${pathKey} por 1 rodada.`
                : "Move o usuário em até 2 casas sem provocar reação.";
  return buildSkill(
    {
      key: `${pathKey}-${index + 1}`,
      name: seed.name,
      level,
      category,
      kind:
        seed.mode === "damage"
          ? "damage"
          : seed.mode === "shield"
            ? "shield"
            : seed.mode === "heal"
              ? "heal"
              : "utility",
      damageType:
        seed.mode === "damage"
          ? attribute === "FOR" || attribute === "INI"
            ? "physical"
            : "magic"
          : "none",
      target,
      cost: strong ? 40 : 25,
      cooldown: strong ? 4 : 2,
      range: target === "enemy" || target === "ally" ? 4 : 0,
      duration,
      attribute,
      multiplier:
        seed.mode === "damage" || seed.mode === "shield" || seed.mode === "heal" ? multiplier : 0,
      operation,
      status: seed.mode === "control" ? pathKey : "",
      modifiers:
        seed.mode === "buff" || seed.mode === "debuff"
          ? [{ attribute, value: seed.mode === "buff" ? value : -value }]
          : [],
      description: `${seed.flavor} ${detail}`,
    },
    resourceName,
  );
}

function buildPaths(slug: string, resourceName: string, primary: AttributeKey[]) {
  return (classPaths[slug] ?? []).map((path) => ({
    key: path.key,
    name: path.name,
    description: path.description,
    passive: { name: `Doutrina: ${path.name}`, description: path.passive },
    skills: (pathTechniques[path.key] ?? []).map((skill, index) =>
      buildPathSkill(path.key, skill, index, resourceName, primary),
    ),
  }));
}

function affinities(primary: AttributeKey[]) {
  return Object.fromEntries(
    (["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const).map((key) => [
      key,
      primary.includes(key) ? 5 : key === "RES" || key === "DEF" ? 3 : 2,
    ]),
  );
}

function buildSkill(seed: SkillSeed, resourceName: string) {
  const scaling = seed.attribute
    ? [{ attribute: seed.attribute, multiplier: seed.multiplier ?? 1 }]
    : [];
  const reachText = seed.area
    ? `${seed.range} casas; área de ${seed.area} casa(s)`
    : `${seed.range} casa(s)`;
  const conditions = seed.condition ? [seed.condition] : [];
  const systemRule = [
    `Valide custo, alcance, alvo e recarga antes de executar.`,
    `Execute ${seed.operation} com ${seed.chance ?? 100}% de chance.`,
    seed.duration
      ? `A duração é de ${seed.duration} rodada(s) completas.`
      : "O efeito é instantâneo.",
    `Arredonde valores finais para o inteiro mais próximo; empate .5 arredonda para cima.`,
  ].join(" ");
  return {
    key: seed.key
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
    name: seed.name,
    level: seed.level,
    category: seed.category,
    type: seed.type ?? "Ativa",
    effect: seed.description,
    kind: seed.kind,
    damageType: seed.damageType ?? "none",
    target: seed.target,
    resource: seed.type === "Passiva" ? "none" : "special",
    resourceKey: "class",
    cost: seed.type === "Passiva" ? 0 : seed.cost,
    cooldown: seed.cooldown,
    range: seed.range,
    area: seed.area ?? 0,
    duration: seed.duration ?? 0,
    scaling,
    reachText,
    conditions,
    systemRule,
    playerDescription: seed.description,
    chance: seed.chance ?? 100,
    maxStacks: seed.maxStacks ?? 0,
    operations: [
      {
        operation: seed.operation,
        target: seed.target,
        base: 0,
        scaling,
        damageType: seed.damageType ?? "none",
        status: seed.status ?? "",
        duration: seed.duration ?? 0,
        chance: seed.chance ?? 100,
        stacks: seed.stacks ?? 0,
        maxStacks: seed.maxStacks ?? 0,
        distance: seed.operation === "PUSH" || seed.operation === "MOVE" ? 2 : 0,
        modifiers: seed.modifiers ?? [],
      },
    ],
    resourceLabel: resourceName,
  };
}

function buildClass(seed: ClassSeed) {
  const progression = [seed.passive, ...seed.skills].map((skill) =>
    buildSkill(skill, seed.resource.name),
  );
  return {
    name: seed.name,
    slug: seed.slug,
    payload: classPayloadSchema.parse({
      engineContractVersion: 1,
      description: seed.description,
      imageUrl: "",
      difficulty: seed.difficulty,
      complexity: `${seed.difficulty}/5 estrelas`,
      specialization: seed.specialization,
      primaryAttributes: seed.primary,
      affinities: affinities(seed.primary),
      mechanic: {
        name: seed.resource.name,
        description: `${seed.resource.generation} ${seed.resource.consumption}`,
      },
      resource: {
        name: seed.resource.name,
        initial: seed.resource.initial,
        maximum: seed.resource.maximum,
        generationRules: [seed.resource.generation],
        consumptionRules: [seed.resource.consumption],
        resetRules: [
          `No início do combate, ${seed.resource.name} retorna a ${seed.resource.initial}.`,
        ],
        generationEvents: [
          {
            trigger: "BASIC_ATTACK_HIT",
            amount: seed.resource.maximum <= 10 ? 1 : 10,
            limitPerAction: 1,
          },
        ],
      },
      passive: {
        name: seed.passive.name,
        description: seed.passive.description,
      },
      progression,
      paths: buildPaths(seed.slug, seed.resource.name, seed.primary),
    }),
  };
}

const classes: ClassSeed[] = [
  {
    name: "Bárbaro",
    slug: "barbaro",
    difficulty: 2,
    specialization: "Dano físico e sobrevivência",
    primary: ["FOR", "RES"],
    description: "Combatente agressivo que converte dano recebido e causado em Fúria.",
    resource: {
      name: "Fúria",
      initial: 0,
      maximum: 100,
      generation: "Ganha 10 Fúria ao causar dano e 5 ao receber dano, uma vez por ação.",
      consumption: "Habilidades consomem Fúria; o valor nunca fica abaixo de 0 nem acima de 100.",
    },
    passive: {
      key: "sangue-fervente",
      name: "Sangue Fervente",
      level: 1,
      type: "Passiva",
      category: "Buff",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "sangue-fervente",
      condition: "Ao receber dano.",
      description: "Ao receber dano, ganha 5 Fúria, limitado a uma ativação por ação inimiga.",
    },
    skills: [
      {
        key: "golpe-selvagem",
        name: "Golpe Selvagem",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 20,
        cooldown: 1,
        range: 1,
        attribute: "FOR",
        multiplier: 1.25,
        operation: "DAMAGE",
        description: "Golpeia um inimigo adjacente e causa 1,25x FOR de dano físico.",
      },
      {
        key: "pele-de-ferro",
        name: "Pele de Ferro",
        level: 10,
        category: "Escudo",
        kind: "shield",
        target: "self",
        cost: 25,
        cooldown: 3,
        range: 0,
        duration: 2,
        attribute: "RES",
        multiplier: 1,
        operation: "SHIELD",
        description: "Recebe escudo igual a 1x RES por 2 rodadas.",
      },
      {
        key: "brado-aterrorizante",
        name: "Brado Aterrorizante",
        level: 25,
        category: "Controle",
        kind: "utility",
        target: "area",
        cost: 35,
        cooldown: 4,
        range: 0,
        area: 2,
        duration: 1,
        operation: "FEAR",
        status: "amedrontado",
        chance: 80,
        description: "Inimigos em até 2 casas têm 80% de chance de receber Medo por 1 rodada.",
      },
      {
        key: "furia-imortal",
        name: "Fúria Imortal",
        level: 50,
        category: "Buff",
        kind: "utility",
        target: "self",
        cost: 100,
        cooldown: 6,
        range: 0,
        duration: 3,
        operation: "APPLY_STATUS",
        status: "furia-imortal",
        description:
          "Por 3 rodadas, não pode cair abaixo de 1 HP; o efeito termina após impedir uma morte.",
      },
    ],
  },
  {
    name: "Guerreiro",
    slug: "guerreiro",
    difficulty: 2,
    specialization: "Combate adaptável",
    primary: ["FOR", "DEF"],
    description: "Combatente disciplinado que alterna pressão ofensiva e postura defensiva.",
    resource: {
      name: "Ímpeto",
      initial: 20,
      maximum: 100,
      generation: "Ganha 10 Ímpeto ao acertar um ataque básico e 10 ao bloquear dano com escudo.",
      consumption: "Técnicas consomem Ímpeto após a validação do alvo.",
    },
    passive: {
      key: "disciplina-marcial",
      name: "Disciplina Marcial",
      level: 1,
      type: "Passiva",
      category: "Buff",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "disciplina-marcial",
      description: "O primeiro ataque básico de cada rodada gera 10 Ímpeto.",
    },
    skills: [
      {
        key: "corte-tatico",
        name: "Corte Tático",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 15,
        cooldown: 1,
        range: 1,
        attribute: "FOR",
        multiplier: 1.1,
        operation: "DAMAGE",
        description: "Causa 1,1x FOR de dano físico a um inimigo adjacente.",
      },
      {
        key: "guarda-alta",
        name: "Guarda Alta",
        level: 10,
        category: "Escudo",
        kind: "shield",
        target: "self",
        cost: 20,
        cooldown: 2,
        range: 0,
        duration: 2,
        attribute: "DEF",
        multiplier: 1.1,
        operation: "SHIELD",
        description: "Recebe escudo igual a 1,1x DEF por 2 rodadas.",
      },
      {
        key: "investida",
        name: "Investida",
        level: 25,
        category: "Mobilidade",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 30,
        cooldown: 3,
        range: 3,
        attribute: "FOR",
        multiplier: 0.9,
        operation: "DAMAGE",
        description: "Avança até 3 casas e causa 0,9x FOR de dano físico ao alvo.",
      },
      {
        key: "mestre-de-armas",
        name: "Mestre de Armas",
        level: 50,
        category: "Buff",
        kind: "utility",
        target: "self",
        cost: 80,
        cooldown: 6,
        range: 0,
        duration: 3,
        operation: "BUFF",
        status: "mestre-de-armas",
        modifiers: [
          { attribute: "FOR", value: 20 },
          { attribute: "DEF", value: 20 },
        ],
        description: "Por 3 rodadas, recebe +20 FOR e +20 DEF.",
      },
    ],
  },
  {
    name: "Paladino",
    slug: "paladino",
    difficulty: 3,
    specialization: "Proteção, cura e julgamento",
    primary: ["ARC", "DEF"],
    description: "Guardião sagrado que acumula Fervor ao proteger e curar aliados.",
    resource: {
      name: "Fervor",
      initial: 25,
      maximum: 100,
      generation: "Ganha 10 Fervor ao aplicar escudo ou cura e 5 ao sofrer dano.",
      consumption: "Milagres consomem Fervor depois da escolha válida de alvo.",
    },
    passive: {
      key: "juramento-protetor",
      name: "Juramento Protetor",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "ally",
      cost: 0,
      cooldown: 1,
      range: 2,
      operation: "REACTION",
      status: "juramento-protetor",
      description: "Uma vez por rodada, quando um aliado em 2 casas sofre dano, ganha 10 Fervor.",
    },
    skills: [
      {
        key: "golpe-sagrado",
        name: "Golpe Sagrado",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "enemy",
        cost: 20,
        cooldown: 1,
        range: 1,
        attribute: "ARC",
        multiplier: 1.15,
        operation: "DAMAGE",
        description: "Causa 1,15x ARC de dano mágico a um inimigo adjacente.",
      },
      {
        key: "luz-restauradora",
        name: "Luz Restauradora",
        level: 10,
        category: "Cura",
        kind: "heal",
        target: "ally",
        cost: 25,
        cooldown: 2,
        range: 3,
        attribute: "ARC",
        multiplier: 1.2,
        operation: "HEAL",
        description: "Cura um aliado em até 3 casas em 1,2x ARC.",
      },
      {
        key: "egide-radiante",
        name: "Égide Radiante",
        level: 25,
        category: "Escudo",
        kind: "shield",
        target: "area",
        cost: 40,
        cooldown: 4,
        range: 0,
        area: 2,
        attribute: "DEF",
        multiplier: 0.8,
        operation: "SHIELD",
        description: "Concede escudo de 0,8x DEF a aliados em até 2 casas.",
      },
      {
        key: "julgamento-celeste",
        name: "Julgamento Celeste",
        level: 50,
        category: "Dano",
        kind: "damage",
        damageType: "true",
        target: "enemy",
        cost: 100,
        cooldown: 6,
        range: 4,
        attribute: "ARC",
        multiplier: 1.5,
        operation: "DAMAGE",
        description: "Causa 1,5x ARC de dano verdadeiro a um inimigo em até 4 casas.",
      },
    ],
  },
  {
    name: "Cavaleiro",
    slug: "cavaleiro",
    difficulty: 3,
    specialization: "Defesa e controle de espaço",
    primary: ["DEF", "RES"],
    description: "Defensor de linha de frente que marca inimigos e controla rotas.",
    resource: {
      name: "Guarda",
      initial: 50,
      maximum: 100,
      generation: "Ganha 10 Guarda ao receber dano e 15 ao usar TAUNT com sucesso.",
      consumption: "Manobras defensivas consomem Guarda; excedentes são descartados.",
    },
    passive: {
      key: "muralha-viva",
      name: "Muralha Viva",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 1,
      range: 0,
      operation: "REACTION",
      status: "muralha-viva",
      description: "O primeiro dano recebido por rodada gera 10 Guarda.",
    },
    skills: [
      {
        key: "golpe-de-escudo",
        name: "Golpe de Escudo",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 20,
        cooldown: 1,
        range: 1,
        attribute: "DEF",
        multiplier: 1,
        operation: "DAMAGE",
        description: "Causa 1x DEF de dano físico a um inimigo adjacente.",
      },
      {
        key: "desafio",
        name: "Desafio",
        level: 10,
        category: "Controle",
        kind: "utility",
        target: "enemy",
        cost: 20,
        cooldown: 3,
        range: 3,
        duration: 2,
        operation: "TAUNT",
        status: "provocado",
        description: "Provoca um inimigo em até 3 casas por 2 rodadas.",
      },
      {
        key: "linha-intransponivel",
        name: "Linha Intransponível",
        level: 25,
        category: "Controle",
        kind: "utility",
        target: "area",
        cost: 40,
        cooldown: 4,
        range: 0,
        area: 2,
        duration: 1,
        operation: "ROOT",
        status: "imobilizado",
        chance: 100,
        description: "Imobiliza inimigos em até 2 casas por 1 rodada.",
      },
      {
        key: "fortaleza",
        name: "Fortaleza",
        level: 50,
        category: "Escudo",
        kind: "shield",
        target: "self",
        cost: 100,
        cooldown: 6,
        range: 0,
        duration: 3,
        attribute: "DEF",
        multiplier: 2,
        operation: "SHIELD",
        description: "Recebe escudo igual a 2x DEF por 3 rodadas.",
      },
    ],
  },
  {
    name: "Arqueiro",
    slug: "arqueiro",
    difficulty: 3,
    specialization: "Dano físico à distância",
    primary: ["INI", "FOR"],
    description: "Atirador de longo alcance que acumula Foco ao manter distância.",
    resource: {
      name: "Foco",
      initial: 30,
      maximum: 100,
      generation: "Ganha 10 Foco ao causar dano a 3 ou mais casas de distância.",
      consumption: "Disparos especiais consomem Foco no momento da execução.",
    },
    passive: {
      key: "olho-de-aguia",
      name: "Olho de Águia",
      level: 1,
      type: "Passiva",
      category: "Buff",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "olho-de-aguia",
      description: "Ataques realizados a 3 ou mais casas geram 10 Foco.",
    },
    skills: [
      {
        key: "tiro-preciso",
        name: "Tiro Preciso",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 15,
        cooldown: 1,
        range: 6,
        attribute: "INI",
        multiplier: 1.2,
        operation: "DAMAGE",
        description: "Causa 1,2x INI de dano físico a um inimigo em até 6 casas.",
      },
      {
        key: "flecha-restritiva",
        name: "Flecha Restritiva",
        level: 10,
        category: "Controle",
        kind: "utility",
        target: "enemy",
        cost: 25,
        cooldown: 3,
        range: 6,
        duration: 1,
        operation: "ROOT",
        status: "imobilizado",
        chance: 85,
        description: "Tem 85% de chance de imobilizar um inimigo em até 6 casas por 1 rodada.",
      },
      {
        key: "chuva-de-flechas",
        name: "Chuva de Flechas",
        level: 25,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "area",
        cost: 45,
        cooldown: 4,
        range: 5,
        area: 2,
        attribute: "INI",
        multiplier: 0.9,
        operation: "DAMAGE",
        description: "Causa 0,9x INI de dano físico em uma área de 2 casas.",
      },
      {
        key: "tiro-do-horizonte",
        name: "Tiro do Horizonte",
        level: 50,
        category: "Dano",
        kind: "damage",
        damageType: "true",
        target: "enemy",
        cost: 100,
        cooldown: 6,
        range: 10,
        attribute: "INI",
        multiplier: 1.6,
        operation: "DAMAGE",
        description: "Causa 1,6x INI de dano verdadeiro a um inimigo em até 10 casas.",
      },
    ],
  },
  {
    name: "Assassino",
    slug: "assassino",
    difficulty: 4,
    specialization: "Explosão e execução",
    primary: ["INI", "FOR"],
    description: "Especialista em eliminar alvos marcados e reposicionar-se pelas sombras.",
    resource: {
      name: "Sombra",
      initial: 40,
      maximum: 100,
      generation: "Ganha 15 Sombra ao atacar um alvo que ainda não agiu na rodada.",
      consumption: "Técnicas furtivas consomem Sombra após a validação da condição.",
    },
    passive: {
      key: "primeiro-sangue",
      name: "Primeiro Sangue",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 1,
      range: 0,
      operation: "REACTION",
      status: "primeiro-sangue",
      description: "Uma vez por rodada, atacar antes do alvo gera 15 Sombra.",
    },
    skills: [
      {
        key: "corte-velado",
        name: "Corte Velado",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 20,
        cooldown: 1,
        range: 1,
        attribute: "INI",
        multiplier: 1.3,
        operation: "DAMAGE",
        description: "Causa 1,3x INI de dano físico a um inimigo adjacente.",
      },
      {
        key: "passo-sombrio",
        name: "Passo Sombrio",
        level: 10,
        category: "Mobilidade",
        kind: "utility",
        target: "enemy",
        cost: 25,
        cooldown: 3,
        range: 5,
        operation: "TELEPORT",
        description: "Teleporta para uma casa livre adjacente a um inimigo em até 5 casas.",
      },
      {
        key: "marca-da-morte",
        name: "Marca da Morte",
        level: 25,
        category: "Debuff",
        kind: "utility",
        target: "enemy",
        cost: 35,
        cooldown: 4,
        range: 3,
        duration: 3,
        operation: "DEBUFF",
        status: "marca-da-morte",
        stacks: 1,
        maxStacks: 1,
        description: "Marca um inimigo por 3 rodadas; ele recebe 20% mais dano do Assassino.",
      },
      {
        key: "execucao",
        name: "Execução",
        level: 50,
        category: "Dano",
        kind: "damage",
        damageType: "true",
        target: "enemy",
        cost: 100,
        cooldown: 6,
        range: 1,
        attribute: "INI",
        multiplier: 1.8,
        operation: "DAMAGE",
        condition: "O alvo deve estar com 35% ou menos do HP máximo.",
        description: "Contra alvo com até 35% de HP, causa 1,8x INI de dano verdadeiro.",
      },
    ],
  },
  {
    name: "Ladino",
    slug: "ladino",
    difficulty: 4,
    specialization: "Controle e oportunismo",
    primary: ["INI", "ARC"],
    description: "Manipulador de campo que cria vantagens com truques e efeitos acumuláveis.",
    resource: {
      name: "Oportunidade",
      initial: 2,
      maximum: 5,
      generation:
        "Ganha 1 Oportunidade quando um inimigo recebe um debuff, máximo de uma por ação.",
      consumption: "Truques consomem unidades inteiras de Oportunidade.",
    },
    passive: {
      key: "jogo-sujo",
      name: "Jogo Sujo",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "jogo-sujo",
      description: "Quando um inimigo recebe um debuff, ganha 1 Oportunidade, uma vez por ação.",
    },
    skills: [
      {
        key: "estocada-oportuna",
        name: "Estocada Oportuna",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 1,
        cooldown: 1,
        range: 1,
        attribute: "INI",
        multiplier: 1.1,
        operation: "DAMAGE",
        description: "Causa 1,1x INI de dano físico a um inimigo adjacente.",
      },
      {
        key: "po-de-cegueira",
        name: "Pó de Cegueira",
        level: 10,
        category: "Debuff",
        kind: "utility",
        target: "area",
        cost: 1,
        cooldown: 3,
        range: 3,
        area: 1,
        duration: 2,
        operation: "DEBUFF",
        status: "cego",
        chance: 80,
        description: "Inimigos na área têm 80% de chance de receber Cegueira por 2 rodadas.",
      },
      {
        key: "gancho",
        name: "Gancho",
        level: 25,
        category: "Controle",
        kind: "utility",
        target: "enemy",
        cost: 2,
        cooldown: 3,
        range: 4,
        operation: "PUSH",
        description:
          "Puxa o inimigo 2 casas na direção do Ladino; falha se a rota estiver bloqueada.",
      },
      {
        key: "plano-perfeito",
        name: "Plano Perfeito",
        level: 50,
        category: "Buff",
        kind: "utility",
        target: "self",
        cost: 5,
        cooldown: 6,
        range: 0,
        duration: 3,
        operation: "BUFF",
        status: "plano-perfeito",
        description:
          "Por 3 rodadas, seus debuffs têm +20 pontos percentuais de chance, limitados a 100%.",
      },
    ],
  },
  {
    name: "Monge",
    slug: "monge",
    difficulty: 4,
    specialization: "Combos e mobilidade",
    primary: ["FOR", "ARC", "INI"],
    description: "Lutador móvel que encadeia técnicas e administra Chi.",
    resource: {
      name: "Chi",
      initial: 3,
      maximum: 6,
      generation: "Ganha 1 Chi ao usar ataque básico, limitado a uma vez por rodada.",
      consumption: "Técnicas consomem Chi; ao fim do combate o Chi retorna a 3.",
    },
    passive: {
      key: "fluxo-continuo",
      name: "Fluxo Contínuo",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 1,
      range: 0,
      operation: "REACTION",
      status: "fluxo-continuo",
      description: "O primeiro ataque básico da rodada gera 1 Chi.",
    },
    skills: [
      {
        key: "palma-ressonante",
        name: "Palma Ressonante",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "physical",
        target: "enemy",
        cost: 1,
        cooldown: 1,
        range: 1,
        attribute: "FOR",
        multiplier: 1.15,
        operation: "DAMAGE",
        description: "Causa 1,15x FOR de dano físico a um inimigo adjacente.",
      },
      {
        key: "passo-do-vento",
        name: "Passo do Vento",
        level: 10,
        category: "Mobilidade",
        kind: "utility",
        target: "self",
        cost: 1,
        cooldown: 2,
        range: 0,
        operation: "MOVE",
        description: "Move até 2 casas sem provocar reações de movimento.",
      },
      {
        key: "selo-do-silencio",
        name: "Selo do Silêncio",
        level: 25,
        category: "Controle",
        kind: "utility",
        target: "enemy",
        cost: 2,
        cooldown: 4,
        range: 1,
        duration: 1,
        operation: "SILENCE",
        status: "silenciado",
        chance: 90,
        description: "Tem 90% de chance de silenciar um inimigo adjacente por 1 rodada.",
      },
      {
        key: "cem-golpes",
        name: "Cem Golpes",
        level: 50,
        category: "Dano",
        kind: "damage",
        damageType: "true",
        target: "enemy",
        cost: 6,
        cooldown: 6,
        range: 1,
        attribute: "FOR",
        multiplier: 1.7,
        operation: "DAMAGE",
        description: "Causa 1,7x FOR de dano verdadeiro a um inimigo adjacente.",
      },
    ],
  },
  {
    name: "Mago",
    slug: "mago",
    difficulty: 3,
    specialization: "Dano mágico e controle",
    primary: ["INT"],
    description: "Conjurador acadêmico que prepara fórmulas arcanas para controlar áreas.",
    resource: {
      name: "Carga Arcana",
      initial: 0,
      maximum: 5,
      generation: "Ganha 1 Carga Arcana ao usar uma habilidade com custo, máximo uma por ação.",
      consumption: "Magias avançadas consomem Cargas Arcanas antes de resolver operações.",
    },
    passive: {
      key: "estudo-arcano",
      name: "Estudo Arcano",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "estudo-arcano",
      description: "Usar uma habilidade com custo gera 1 Carga Arcana.",
    },
    skills: [
      {
        key: "projetil-arcano",
        name: "Projétil Arcano",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "enemy",
        cost: 1,
        cooldown: 1,
        range: 6,
        attribute: "INT",
        multiplier: 1.2,
        operation: "DAMAGE",
        description: "Causa 1,2x INT de dano mágico a um inimigo em até 6 casas.",
      },
      {
        key: "barreira-runica",
        name: "Barreira Rúnica",
        level: 10,
        category: "Escudo",
        kind: "shield",
        target: "ally",
        cost: 1,
        cooldown: 3,
        range: 4,
        attribute: "INT",
        multiplier: 0.9,
        operation: "SHIELD",
        description: "Concede escudo igual a 0,9x INT a um aliado em até 4 casas.",
      },
      {
        key: "campo-gravitacional",
        name: "Campo Gravitacional",
        level: 25,
        category: "Controle",
        kind: "utility",
        target: "area",
        cost: 3,
        cooldown: 4,
        range: 5,
        area: 2,
        duration: 1,
        operation: "ROOT",
        status: "imobilizado",
        chance: 100,
        description: "Imobiliza inimigos em uma área de 2 casas por 1 rodada.",
      },
      {
        key: "meteoro",
        name: "Meteoro",
        level: 50,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "area",
        cost: 5,
        cooldown: 6,
        range: 8,
        area: 3,
        attribute: "INT",
        multiplier: 1.8,
        operation: "DAMAGE",
        description: "Causa 1,8x INT de dano mágico em uma área de 3 casas.",
      },
    ],
  },
  {
    name: "Feiticeiro",
    slug: "feiticeiro",
    difficulty: 5,
    specialization: "Magia instável e explosiva",
    primary: ["INT", "INI"],
    description:
      "Conjurador espontâneo que manipula Instabilidade para amplificar riscos e resultados.",
    resource: {
      name: "Instabilidade",
      initial: 0,
      maximum: 100,
      generation: "Ganha 15 Instabilidade ao causar dano mágico, uma vez por ação.",
      consumption:
        "Feitiços consomem Instabilidade; chances são roladas antes das operações de efeito.",
    },
    passive: {
      key: "magia-volatil",
      name: "Magia Volátil",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "magia-volatil",
      description: "Causar dano mágico gera 15 Instabilidade, uma vez por ação.",
    },
    skills: [
      {
        key: "centelha-caotica",
        name: "Centelha Caótica",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "enemy",
        cost: 15,
        cooldown: 1,
        range: 5,
        attribute: "INT",
        multiplier: 1.3,
        operation: "DAMAGE",
        description: "Causa 1,3x INT de dano mágico a um inimigo em até 5 casas.",
      },
      {
        key: "salto-imprevisivel",
        name: "Salto Imprevisível",
        level: 10,
        category: "Mobilidade",
        kind: "utility",
        target: "self",
        cost: 20,
        cooldown: 3,
        range: 0,
        operation: "TELEPORT",
        description: "Teleporta para uma casa livre em até 4 casas.",
      },
      {
        key: "ruptura-arcana",
        name: "Ruptura Arcana",
        level: 25,
        category: "Debuff",
        kind: "utility",
        target: "area",
        cost: 40,
        cooldown: 4,
        range: 5,
        area: 2,
        duration: 2,
        operation: "DEBUFF",
        status: "vulneravel-magia",
        chance: 85,
        modifiers: [{ attribute: "RES", value: -20 }],
        description: "Inimigos na área têm 85% de chance de perder 20 RES por 2 rodadas.",
      },
      {
        key: "singularidade",
        name: "Singularidade",
        level: 50,
        category: "Dano",
        kind: "damage",
        damageType: "true",
        target: "area",
        cost: 100,
        cooldown: 7,
        range: 6,
        area: 2,
        attribute: "INT",
        multiplier: 1.7,
        operation: "DAMAGE",
        description: "Causa 1,7x INT de dano verdadeiro em uma área de 2 casas.",
      },
    ],
  },
  {
    name: "Bruxo",
    slug: "bruxo",
    difficulty: 4,
    specialization: "Maldições e drenagem",
    primary: ["ARC", "INT"],
    description: "Conjurador de pactos que acumula Selos ao aplicar condições negativas.",
    resource: {
      name: "Selos de Pacto",
      initial: 1,
      maximum: 5,
      generation: "Ganha 1 Selo ao aplicar um status negativo, máximo uma vez por ação.",
      consumption: "Rituais consomem Selos inteiros após a chance de aplicação ser validada.",
    },
    passive: {
      key: "preco-do-pacto",
      name: "Preço do Pacto",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "preco-do-pacto",
      description: "Aplicar um status negativo gera 1 Selo de Pacto, uma vez por ação.",
    },
    skills: [
      {
        key: "rajada-profana",
        name: "Rajada Profana",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "enemy",
        cost: 1,
        cooldown: 1,
        range: 5,
        attribute: "ARC",
        multiplier: 1.2,
        operation: "DAMAGE",
        description: "Causa 1,2x ARC de dano mágico a um inimigo em até 5 casas.",
      },
      {
        key: "maldicao-da-fraqueza",
        name: "Maldição da Fraqueza",
        level: 10,
        category: "Debuff",
        kind: "utility",
        target: "enemy",
        cost: 1,
        cooldown: 3,
        range: 5,
        duration: 3,
        operation: "DEBUFF",
        status: "fraqueza",
        chance: 90,
        modifiers: [
          { attribute: "FOR", value: -15 },
          { attribute: "INT", value: -15 },
        ],
        description: "Tem 90% de chance de reduzir FOR e INT do alvo em 15 por 3 rodadas.",
      },
      {
        key: "drenar-essencia",
        name: "Drenar Essência",
        level: 25,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "enemy",
        cost: 2,
        cooldown: 4,
        range: 4,
        attribute: "ARC",
        multiplier: 1,
        operation: "DAMAGE",
        description:
          "Causa 1x ARC de dano mágico; cura recebida por esta habilidade é resolvida em operação subsequente no motor.",
      },
      {
        key: "condenacao",
        name: "Condenação",
        level: 50,
        category: "Controle",
        kind: "utility",
        target: "enemy",
        cost: 5,
        cooldown: 7,
        range: 6,
        duration: 2,
        operation: "SILENCE",
        status: "condenado",
        chance: 100,
        description:
          "Silencia o alvo por 2 rodadas e impede a remoção deste status durante sua duração.",
      },
    ],
  },
  {
    name: "Clérigo",
    slug: "clerigo",
    difficulty: 3,
    specialization: "Cura e suporte",
    primary: ["ARC", "RES"],
    description: "Canalizador divino que gera Fé ao restaurar e proteger o grupo.",
    resource: {
      name: "Fé",
      initial: 30,
      maximum: 100,
      generation: "Ganha 10 Fé ao curar HP efetivamente ou aplicar escudo, uma vez por ação.",
      consumption: "Milagres consomem Fé; cura excedente não gera recurso.",
    },
    passive: {
      key: "graca",
      name: "Graça",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "graca",
      description: "Curar HP efetivamente ou aplicar escudo gera 10 Fé, uma vez por ação.",
    },
    skills: [
      {
        key: "toque-restaurador",
        name: "Toque Restaurador",
        level: 1,
        category: "Cura",
        kind: "heal",
        target: "ally",
        cost: 15,
        cooldown: 1,
        range: 3,
        attribute: "ARC",
        multiplier: 1.25,
        operation: "HEAL",
        description: "Cura um aliado em até 3 casas em 1,25x ARC.",
      },
      {
        key: "bencao-protetora",
        name: "Bênção Protetora",
        level: 10,
        category: "Escudo",
        kind: "shield",
        target: "ally",
        cost: 20,
        cooldown: 2,
        range: 4,
        attribute: "ARC",
        multiplier: 1,
        operation: "SHIELD",
        description: "Concede escudo igual a 1x ARC a um aliado em até 4 casas.",
      },
      {
        key: "purificacao",
        name: "Purificação",
        level: 25,
        category: "Suporte",
        kind: "utility",
        target: "ally",
        cost: 35,
        cooldown: 4,
        range: 4,
        operation: "REMOVE_STATUS",
        status: "negative",
        description:
          "Remove até 2 status negativos removíveis de um aliado em até 4 casas, priorizando controle.",
      },
      {
        key: "renascimento",
        name: "Renascimento",
        level: 50,
        category: "Cura",
        kind: "heal",
        target: "ally",
        cost: 100,
        cooldown: 8,
        range: 3,
        attribute: "ARC",
        multiplier: 2,
        operation: "HEAL",
        condition: "O alvo deve estar vivo e com até 25% do HP máximo.",
        description: "Cura em 2x ARC um aliado vivo com até 25% do HP máximo.",
      },
    ],
  },
  {
    name: "Druida",
    slug: "druida",
    difficulty: 4,
    specialization: "Controle natural e sustentação",
    primary: ["ARC", "RES"],
    description: "Guardião natural que acumula Essência para curar, prender e invocar.",
    resource: {
      name: "Essência",
      initial: 20,
      maximum: 100,
      generation: "Ganha 10 Essência quando uma habilidade afeta dois ou mais alvos.",
      consumption: "Manifestações naturais consomem Essência após determinar a área afetada.",
    },
    passive: {
      key: "ciclo-natural",
      name: "Ciclo Natural",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "ciclo-natural",
      description: "Afetar dois ou mais alvos com uma habilidade gera 10 Essência.",
    },
    skills: [
      {
        key: "espinhos",
        name: "Espinhos",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "enemy",
        cost: 15,
        cooldown: 1,
        range: 4,
        attribute: "ARC",
        multiplier: 1.1,
        operation: "DAMAGE",
        description: "Causa 1,1x ARC de dano mágico a um inimigo em até 4 casas.",
      },
      {
        key: "renovo",
        name: "Renovo",
        level: 10,
        category: "Cura",
        kind: "heal",
        target: "ally",
        cost: 20,
        cooldown: 2,
        range: 4,
        duration: 2,
        attribute: "ARC",
        multiplier: 0.8,
        operation: "HEAL",
        description:
          "Cura imediatamente um aliado em 0,8x ARC; efeitos recorrentes usam duração de 2 rodadas.",
      },
      {
        key: "raizes-primitivas",
        name: "Raízes Primitivas",
        level: 25,
        category: "Controle",
        kind: "utility",
        target: "area",
        cost: 40,
        cooldown: 4,
        range: 5,
        area: 2,
        duration: 2,
        operation: "ROOT",
        status: "enraizado",
        chance: 85,
        description: "Inimigos na área têm 85% de chance de ficar enraizados por 2 rodadas.",
      },
      {
        key: "guardiao-da-mata",
        name: "Guardião da Mata",
        level: 50,
        category: "Invocação",
        kind: "utility",
        target: "self",
        cost: 100,
        cooldown: 7,
        range: 1,
        duration: 4,
        operation: "SUMMON",
        status: "guardiao-da-mata",
        description: "Invoca um Guardião por 4 rodadas em uma casa livre adjacente.",
      },
    ],
  },
  {
    name: "Bardo",
    slug: "bardo",
    difficulty: 4,
    specialization: "Buffs, debuffs e suporte",
    primary: ["ARC", "INI"],
    description: "Artista de batalha que acumula Inspiração ao alternar canções e alvos.",
    resource: {
      name: "Inspiração",
      initial: 2,
      maximum: 6,
      generation:
        "Ganha 1 Inspiração ao afetar um aliado ou inimigo diferente do alvo da ação anterior.",
      consumption: "Canções consomem Inspiração; repetir o mesmo alvo não gera recurso.",
    },
    passive: {
      key: "ritmo-crescente",
      name: "Ritmo Crescente",
      level: 1,
      type: "Passiva",
      category: "Reação",
      kind: "utility",
      target: "self",
      cost: 0,
      cooldown: 0,
      range: 0,
      operation: "REACTION",
      status: "ritmo-crescente",
      description: "Alternar o alvo entre ações gera 1 Inspiração.",
    },
    skills: [
      {
        key: "nota-cortante",
        name: "Nota Cortante",
        level: 1,
        category: "Dano",
        kind: "damage",
        damageType: "magic",
        target: "enemy",
        cost: 1,
        cooldown: 1,
        range: 5,
        attribute: "ARC",
        multiplier: 1,
        operation: "DAMAGE",
        description: "Causa 1x ARC de dano mágico a um inimigo em até 5 casas.",
      },
      {
        key: "cancao-de-coragem",
        name: "Canção de Coragem",
        level: 10,
        category: "Buff",
        kind: "utility",
        target: "area",
        cost: 2,
        cooldown: 3,
        range: 0,
        area: 3,
        duration: 2,
        operation: "BUFF",
        status: "coragem",
        modifiers: [
          { attribute: "FOR", value: 15 },
          { attribute: "INT", value: 15 },
        ],
        description: "Aliados em até 3 casas recebem +15 FOR e +15 INT por 2 rodadas.",
      },
      {
        key: "refrão-dissonante",
        name: "Refrão Dissonante",
        level: 25,
        category: "Debuff",
        kind: "utility",
        target: "area",
        cost: 3,
        cooldown: 4,
        range: 4,
        area: 2,
        duration: 2,
        operation: "DEBUFF",
        status: "dissonancia",
        chance: 85,
        modifiers: [
          { attribute: "DEF", value: -15 },
          { attribute: "RES", value: -15 },
        ],
        description: "Inimigos na área têm 85% de chance de perder 15 DEF e 15 RES por 2 rodadas.",
      },
      {
        key: "grande-finale",
        name: "Grande Finale",
        level: 50,
        category: "Controle",
        kind: "utility",
        target: "area",
        cost: 6,
        cooldown: 7,
        range: 5,
        area: 3,
        duration: 1,
        operation: "STUN",
        status: "atordoado",
        chance: 90,
        description: "Inimigos na área têm 90% de chance de ficar atordoados por 1 rodada.",
      },
    ],
  },
];

export const officialClasses = classes.map(buildClass);
