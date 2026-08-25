export type RealmLocation = {
  key: string;
  name: string;
  realmKey: string;
  description: string;
  image: string;
  grid: { columns: number; rows: number; column: number; row: number };
};

type LocationCopy = readonly [key: string, name: string, description: string];

function atlasLocations(
  realmKey: string,
  _image: string,
  _columns: number,
  _rows: number,
  locations: readonly LocationCopy[],
  _startIndex = 0,
): RealmLocation[] {
  void _startIndex;
  return locations.map(([key, name, description]) => ({
    key,
    name,
    realmKey,
    description,
    image: `/images/locations/hq/${realmKey}/${key}.webp`,
    grid: { columns: 1, rows: 1, column: 0, row: 0 },
  }));
}

export const realmLocations: readonly RealmLocation[] = [
  {
    key: "bosque-raizes-cantantes",
    name: "Bosque das Raízes Cantantes",
    realmKey: "aokigahara",
    description:
      "Um bosque antigo onde raízes arqueadas formam corredores naturais. Quando o vento atravessa seus veios de Mana, a madeira produz um coro grave que os moradores usam para prever mudanças na floresta.",
    image: "/images/locations/hq/aokigahara/bosque-raizes-cantantes.webp",
    grid: { columns: 1, rows: 1, column: 0, row: 0 },
  },
  ...atlasLocations("aokigahara", "/images/locations/aokigahara-locations-v2.webp", 2, 5, [
    [
      "jardins-ervas-lunares",
      "Jardins de Ervas Lunares",
      "Terraços cultivados sob a luz da lua, onde curandeiros preservam plantas que perdem suas propriedades quando expostas ao sol direto.",
    ],
    [
      "ponte-copas-antigas",
      "Ponte das Copas Antigas",
      "Uma longa travessia suspensa entre árvores centenárias. Suas tábuas rangem acima da névoa, ligando comunidades que vivem nas copas mais altas.",
    ],
    [
      "ninho-fungos-rubros",
      "Ninho dos Fungos Rubros",
      "Uma gruta úmida dominada por cogumelos escarlates gigantes. Seus esporos iluminam o caminho, mas também atraem criaturas da floresta profunda.",
    ],
    [
      "santuario-seiva-dourada",
      "Santuário da Seiva Dourada",
      "Templo erguido ao redor de uma raiz da Árvore Imponente, da qual corre uma seiva dourada usada apenas em ritos e curas excepcionais.",
    ],
    [
      "vale-flores-sonoras",
      "Vale das Flores Sonoras",
      "Um vale coberto por flores em forma de sino. Cada espécie produz uma nota diferente, transformando as rajadas de vento em melodias naturais.",
    ],
    [
      "mercado-resinas",
      "Mercado das Resinas",
      "Centro comercial de frascos âmbar, pigmentos, perfumes e ingredientes alquímicos extraídos sem ferir as árvores vivas de Aokigahara.",
    ],
    [
      "trilha-cipos-errantes",
      "Trilha dos Cipós Errantes",
      "Um caminho que nunca permanece igual por muito tempo, pois os cipós se movem durante a noite e fecham passagens antes consideradas seguras.",
    ],
    [
      "fonte-sementes-eternas",
      "Fonte das Sementes Eternas",
      "Uma nascente sagrada onde sementes luminosas flutuam sobre a água. Dizem que algumas guardam espécies desaparecidas há séculos.",
    ],
    [
      "circulo-sacerdotes-verdes",
      "Círculo dos Sacerdotes Verdes",
      "Clareira cerimonial de pedra e raízes onde os sacerdotes interpretam a vontade da floresta e protegem os ritos da Árvore Imponente.",
    ],
  ], 1),
  ...atlasLocations("darkya", "/images/locations/darkya-locations-v2.webp", 2, 5, [
    [
      "aqueduto-garoa-cinzenta",
      "Aqueduto da Garoa Cinzenta",
      "Aqueduto monumental de ferro tratado e pedra escura que conduz água aos bairros altos, mesmo durante as tempestades mais violentas.",
    ],
    [
      "vinicola-corvo-rubro",
      "Vinícola do Corvo Rubro",
      "Vinícola fortificada cercada por parreirais encharcados. Suas adegas aquecidas são ponto de encontro de mercadores, nobres e viajantes.",
    ],
    [
      "ponte-sinos-ferro",
      "Ponte dos Sinos de Ferro",
      "Travessia sobre um desfiladeiro alagado, ladeada por grandes sinos que alertam a Cidade Ferrugem quando o vento anuncia uma tempestade severa.",
    ],
    [
      "taverna-trovao-manso",
      "Taverna do Trovão Manso",
      "Uma taverna de ardósia conhecida pela lareira sempre acesa. O som da chuva no telhado tornou o lugar um refúgio tradicional para contadores de histórias.",
    ],
    [
      "distrito-curtumes",
      "Distrito dos Curtumes",
      "Bairro de oficinas cobertas junto aos canais, onde couro, lã e tecidos impermeáveis são preparados para resistir ao clima de Darkya.",
    ],
    [
      "estrada-carruagens-seladas",
      "Estrada das Carruagens Seladas",
      "Rota lamacenta usada por carruagens reforçadas e impermeáveis. Postos de troca permitem substituir rodas antes que o terreno as destrua.",
    ],
    [
      "torre-para-raios-antigo",
      "Torre do Para-raios Antigo",
      "Uma torre anterior à Cidade Ferrugem moderna. Seus mecanismos ainda absorvem relâmpagos, embora ninguém compreenda completamente para onde a energia é levada.",
    ],
    [
      "armazem-las-negras",
      "Armazém das Lãs Negras",
      "Grande depósito de vigas metálicas onde a lã escura das regiões frias é seca, classificada e preparada para exportação.",
    ],
    [
      "canal-chuva-profunda",
      "Canal da Chuva Profunda",
      "O maior canal de drenagem da capital. Comportas antigas controlam a água, mas seus túneis inferiores escondem passagens esquecidas.",
    ],
    [
      "portao-cidade-ferrugem",
      "Portão da Cidade Ferrugem",
      "Entrada monumental da capital, construída com camadas de ferro marcado pelo tempo. Suas luzes âmbar permanecem acesas durante toda a noite chuvosa.",
    ],
  ]),
  ...atlasLocations("oymyakon", "/images/locations/oymyakon-locations-v2.webp", 2, 5, [
    [
      "mina-diamante-boreal",
      "Mina do Diamante Boreal",
      "Uma mina profunda onde diamantes refletem as cores da aurora. A extração é lenta para evitar que o gelo regenerativo sele os túneis.",
    ],
    [
      "porto-agulhas-gelo",
      "Porto das Agulhas de Gelo",
      "Porto protegido por formações pontiagudas de gelo. Somente pilotos experientes atravessam o corredor estreito entre as agulhas.",
    ],
    [
      "caverna-cristais-azuis",
      "Caverna dos Cristais Azuis",
      "Caverna semelhante a uma catedral, iluminada por cristais de Mana. O eco altera a intensidade de seu brilho e confunde exploradores.",
    ],
    [
      "passagem-nevasca-eterna",
      "Passagem da Nevasca Eterna",
      "Desfiladeiro onde a neve nunca cessa. Marcos de pedra e cordas entre os paredões são a única orientação quando o horizonte desaparece.",
    ],
    [
      "salao-vidros-coloridos",
      "Salão dos Vidros Coloridos",
      "Grande salão de pedra escura cujos vitrais reforçados projetam cores sobre o gelo, preservando registros das antigas famílias de Oymyakon.",
    ],
    [
      "veio-ouro-congelado",
      "Veio de Ouro Congelado",
      "Uma faixa de ouro visível dentro de uma geleira transparente. Retirá-la sem provocar rachaduras exige ferramentas e técnicas especializadas.",
    ],
    [
      "doca-quebra-gelos",
      "Doca dos Quebra-gelos",
      "Complexo portuário de correntes, guindastes e cascos reforçados onde as embarcações que mantêm o comércio do reino são reparadas.",
    ],
    [
      "vale-paredes-brancas",
      "Vale das Paredes Brancas",
      "Vale cercado por muralhas naturais de gelo que voltam a crescer quando danificadas. O fenômeno mantém o reino isolado e protegido.",
    ],
    [
      "fortaleza-pedra-escura",
      "Fortaleza da Pedra Escura",
      "Bastião erguido contra a montanha, aquecido por galerias subterrâneas. Suas torres vigiam a principal entrada terrestre do reino.",
    ],
    [
      "tunel-carvao-silencioso",
      "Túnel do Carvão Silencioso",
      "Antiga galeria de mineração abandonada após um desabamento. Trilhos congelados e lampiões ocasionais indicam que o lugar não está completamente vazio.",
    ],
  ]),
  ...atlasLocations("lesedi", "/images/locations/lesedi-locations-v2.webp", 2, 5, [
    [
      "oasis-frutas-vidro",
      "Oásis das Frutas de Vidro",
      "Oásis fértil onde frutas translúcidas armazenam água e refletem a Estrela de Mana como pequenas joias coloridas.",
    ],
    [
      "caravana-especiarias",
      "Caravana das Especiarias",
      "Uma rota móvel de mercadores, animais de carga e tendas coloridas. Seu aroma pode ser percebido muito antes de a caravana surgir nas dunas.",
    ],
    [
      "pedreira-arenito-solar",
      "Pedreira do Arenito Solar",
      "Pedreira em terraços que fornece os grandes blocos dourados da capital. Marcas antigas sugerem que parte do local já foi um templo.",
    ],
    [
      "forja-vidro-mana",
      "Forja do Vidro de Mana",
      "Oficina onde areia e cristais são fundidos em vidro resistente. A luz azul e dourada dos fornos permanece visível mesmo sob o sol de Lesedi.",
    ],
    [
      "dunas-escaravelhos-dourados",
      "Dunas dos Escaravelhos Dourados",
      "Mar de areia atravessado por escaravelhos de carapaça metálica. Seus rastros revelam passagens subterrâneas e ruínas soterradas.",
    ],
    [
      "mercado-nunca-dorme",
      "Mercado que Nunca Dorme",
      "Bazar permanentemente iluminado pela Estrela de Mana, onde caravanas negociam tecidos, cerâmicas, especiarias e notícias de todo o continente.",
    ],
    [
      "templo-estrela-ardente",
      "Templo da Estrela Ardente",
      "Templo de arenito alinhado com a Estrela de Mana. Seus espelhos conduzem luz até câmaras que jamais conhecem a escuridão.",
    ],
    [
      "vale-ceramicas-antigas",
      "Vale das Cerâmicas Antigas",
      "Vale repleto de vasos monumentais e fragmentos decorados. Alguns são grandes o bastante para esconder entradas de antigas habitações.",
    ],
    [
      "rota-oleos-perfumados",
      "Rota dos Óleos Perfumados",
      "Caminho comercial entre pequenos oásis, reconhecido pelos jardins aromáticos e pelas ânforas seladas transportadas em caixas acolchoadas.",
    ],
    [
      "poco-ervas-deserto",
      "Poço das Ervas do Deserto",
      "Poço profundo cercado por plantas medicinais raras. A comunidade controla cuidadosamente a água que mantém esse jardim vivo.",
    ],
  ]),
  ...atlasLocations("namida", "/images/locations/namida-locations-v2.webp", 2, 5, [
    [
      "jardim-corais-luminosos",
      "Jardim dos Corais Luminosos",
      "Terraços de corais bioluminescentes cultivados como jardins. Suas cores indicam a saúde das águas ao redor de Namida.",
    ],
    [
      "canal-cardumes-prateados",
      "Canal dos Cardumes Prateados",
      "Canal urbano atravessado por cardumes que se movem como fitas de prata, acompanhando as correntes entre os bairros.",
    ],
    [
      "torre-redoma-exterior",
      "Torre da Redoma Exterior",
      "Torre de vigilância situada junto às fraturas da antiga Redoma de Mana, usada para observar mudanças de pressão e invasões marinhas.",
    ],
    [
      "floresta-algas-azuis",
      "Floresta das Algas Azuis",
      "Bosque submerso de algas gigantes que ondulam como árvores. Trilhas luminosas guiam viajantes entre suas folhas compridas.",
    ],
    [
      "praca-conchas-cantoras",
      "Praça das Conchas Cantoras",
      "Praça construída com conchas espirais que transformam as correntes em música. Cerimônias públicas costumam começar ao primeiro acorde.",
    ],
    [
      "fenda-correntes-frias",
      "Fenda das Correntes Frias",
      "Abismo oceânico de onde emergem correntes geladas. Seu fundo nunca foi alcançado, e luzes desconhecidas às vezes sobem pela abertura.",
    ],
    [
      "bercario-cavalos-marinhos",
      "Berçário dos Cavalos-marinhos",
      "Recinto protegido de corais delicados onde filhotes são cuidados antes de retornar ao oceano aberto.",
    ],
    [
      "palacio-perolas",
      "Palácio das Pérolas",
      "Sede real de cúpulas claras e arcos de coral, construída ao redor de pérolas gigantes que iluminam seus salões.",
    ],
    [
      "tunel-aguas-claras",
      "Túnel das Águas Claras",
      "Passagem transparente entre distritos, atravessada por uma corrente sempre límpida. Do interior é possível observar a vida marinha sem barreiras visíveis.",
    ],
    [
      "recife-guardioes",
      "Recife dos Guardiões",
      "Fortificação natural marcada por estátuas antigas. Portões bioluminescentes controlam o acesso às águas internas do reino.",
    ],
  ]),
  ...atlasLocations("skypiece", "/images/locations/skypiece-locations-v2.webp", 2, 5, [
    [
      "ponte-arco-iris",
      "Ponte do Arco-Íris",
      "Travessia luminosa que liga o mundo terrestre às ilhas de Skypiece. Suas cores se tornam mais intensas conforme a altitude aumenta.",
    ],
    [
      "pedreira-quartzo-branco",
      "Pedreira de Quartzo Branco",
      "Pedreira celestial onde o quartzo é retirado em grandes placas para a construção de palácios e estradas suspensas.",
    ],
    [
      "estrada-nuvens-solidas",
      "Estrada das Nuvens Sólidas",
      "Via formada por nuvens compactadas, marcada por cristais e coberta por uma névoa baixa que esconde suas bordas.",
    ],
    [
      "jardim-nevoa-rasteira",
      "Jardim da Névoa Rasteira",
      "Jardim suspenso de flores resistentes ao vento. Uma camada prateada de névoa corre entre os canteiros durante todo o dia.",
    ],
    [
      "torre-cristais-translucidos",
      "Torre dos Cristais Translúcidos",
      "Torre construída com cristais que deixam passar luz, mas ocultam o interior. Seus reflexos servem de farol entre as ilhas.",
    ],
    [
      "ilha-ventos-alaranjados",
      "Ilha dos Ventos Alaranjados",
      "Ilha afastada envolvida por correntes de ar coloridas. O vento muda de direção sem aviso e altera lentamente sua posição no céu.",
    ],
    [
      "palacio-aurora-celeste",
      "Palácio da Aurora Celeste",
      "Palácio de quartzo branco que reflete as auroras em tons violetas e alaranjados, parecendo mudar de cor a cada hora.",
    ],
    [
      "celeiro-nuvens",
      "Celeiro das Nuvens",
      "Complexo agrícola sobre terraços suspensos, onde colheitas e sementes são protegidas da umidade por cristais de calor.",
    ],
    [
      "santuario-cristal-azul",
      "Santuário do Cristal Azul",
      "Câmara sagrada construída ao redor de um cristal de Mana ligado à sustentação das ilhas e à história do retorno de Skypiece.",
    ],
    [
      "ancoradouro-ilhas-flutuantes",
      "Ancoradouro das Ilhas Flutuantes",
      "Porto celeste de docas suspensas, correntes e âncoras de cristal que estabilizam ilhas menores durante viagens e tempestades.",
    ],
  ]),
];

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function getRealmLocations(realmKey: string) {
  return realmLocations.filter((location) => location.realmKey === realmKey);
}

export function findRealmLocationByName(name: string) {
  const needle = normalized(name.trim());
  return realmLocations.find((location) => normalized(location.name) === needle) ?? null;
}

export function findRealmLocationsInText(text: string) {
  const haystack = normalized(text);
  return realmLocations.filter((location) => haystack.includes(normalized(location.name)));
}
